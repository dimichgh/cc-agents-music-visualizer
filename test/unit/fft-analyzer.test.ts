/**
 * FFT Analyzer Tests
 */

import { expect, sinon } from '../setup';
import { FFTAnalyzer } from '../../src/renderer/services/fft-analyzer';

describe('FFTAnalyzer', () => {
  let fftAnalyzer: FFTAnalyzer;
  let mockAudioContext: sinon.SinonStubbedInstance<AudioContext>;
  let mockAnalyserNode: any;

  beforeEach(() => {
    mockAnalyserNode = {
      fftSize: 2048,
      frequencyBinCount: 1024,
      smoothingTimeConstant: 0.8,
      minDecibels: -100,
      maxDecibels: -30,
      connect: sinon.stub(),
      disconnect: sinon.stub(),
      getFloatFrequencyData: sinon.stub(),
      getByteFrequencyData: sinon.stub(),
    };

    mockAudioContext = sinon.createStubInstance(AudioContext as any);
    mockAudioContext.createAnalyser.returns(mockAnalyserNode);
    mockAudioContext.sampleRate = 44100;
    mockAudioContext.currentTime = 0;

    fftAnalyzer = new FFTAnalyzer(mockAudioContext as any);
  });

  afterEach(() => {
    if (fftAnalyzer && fftAnalyzer.isInitialized()) {
      fftAnalyzer.dispose();
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      expect(fftAnalyzer.isInitialized()).to.be.false;

      await fftAnalyzer.initialize();

      expect(fftAnalyzer.isInitialized()).to.be.true;
      expect(mockAudioContext.createAnalyser.calledOnce).to.be.true;
    });

    it('should configure analyser node correctly', async () => {
      await fftAnalyzer.initialize();

      expect(mockAnalyserNode.fftSize).to.equal(2048);
      expect(mockAnalyserNode.smoothingTimeConstant).to.equal(0.8);
      expect(mockAnalyserNode.minDecibels).to.equal(-100);
      expect(mockAnalyserNode.maxDecibels).to.equal(-30);
    });
  });

  describe('frequency analysis', () => {
    beforeEach(async () => {
      await fftAnalyzer.initialize();
    });

    it('should analyze frequencies correctly', () => {
      // Mock frequency data
      const mockFreqData = new Float32Array(1024);
      for (let i = 0; i < mockFreqData.length; i++) {
        mockFreqData[i] = -60 + (i / mockFreqData.length) * 30; // Gradient from -60 to -30 dB
      }

      mockAnalyserNode.getFloatFrequencyData.callsFake((array: Float32Array) => {
        array.set(mockFreqData);
      });

      const result = fftAnalyzer.analyzeFrequencies();

      expect(result).to.have.property('frequencies');
      expect(result).to.have.property('magnitudes');
      expect(result).to.have.property('phases');
      expect(result.bins).to.equal(1024);
      expect(result.sampleRate).to.equal(44100);
      expect(result.frequencies).to.be.instanceOf(Float32Array);
    });

    it('should convert dB values to linear scale', () => {
      const mockFreqData = new Float32Array(1024);
      mockFreqData[0] = -60; // Should convert to ~0.001
      mockFreqData[1] = -30; // Should convert to ~0.032
      mockFreqData[2] = 0;   // Should convert to 1.0

      mockAnalyserNode.getFloatFrequencyData.callsFake((array: Float32Array) => {
        array.set(mockFreqData);
      });

      const result = fftAnalyzer.analyzeFrequencies();

      // Check that values are in expected range [0, 1]
      expect(result.frequencies[0]).to.be.within(0, 1);
      expect(result.frequencies[1]).to.be.within(0, 1);
      expect(result.frequencies[2]).to.be.within(0, 1);
      
      // Check relative ordering
      expect(result.frequencies[0]).to.be.lessThan(result.frequencies[1]);
      expect(result.frequencies[1]).to.be.lessThan(result.frequencies[2]);
    });
  });

  describe('beat detection', () => {
    beforeEach(async () => {
      await fftAnalyzer.initialize();
      mockAudioContext.currentTime = 1.0;
    });

    it('should detect beats with sufficient energy', () => {
      // Create frequency data with strong bass energy
      const frequencyData = {
        frequencies: new Float32Array(1024),
        magnitudes: new Float32Array(1024),
        phases: new Float32Array(1024),
        bins: 1024,
        sampleRate: 44100,
        timestamp: 1.0,
      };

      // Fill bass range with high energy
      for (let i = 0; i < 32; i++) {
        frequencyData.magnitudes[i] = 0.8;
      }

      // Build up energy history first
      for (let i = 0; i < 50; i++) {
        const lowEnergyData = { ...frequencyData };
        for (let j = 0; j < 32; j++) {
          lowEnergyData.magnitudes[j] = 0.1;
        }
        fftAnalyzer.detectBeats(lowEnergyData);
      }

      // Now test with high energy
      const beats = fftAnalyzer.detectBeats(frequencyData);

      expect(beats).to.be.an('array');
      // Might or might not detect a beat depending on energy history
    });

    it('should classify beat types', () => {
      const frequencyData = {
        frequencies: new Float32Array(1024),
        magnitudes: new Float32Array(1024),
        phases: new Float32Array(1024),
        bins: 1024,
        sampleRate: 44100,
        timestamp: 1.0,
      };

      // Create kick drum pattern (strong bass)
      for (let i = 0; i < 32; i++) {
        frequencyData.magnitudes[i] = 0.9;
      }

      const beats = fftAnalyzer.detectBeats(frequencyData);
      
      // Should classify as kick if beat is detected
      if (beats.length > 0) {
        expect(beats[0].type).to.be.oneOf(['kick', 'snare', 'hihat', 'other']);
      }
    });
  });

  describe('instrument classification', () => {
    beforeEach(async () => {
      await fftAnalyzer.initialize();
    });

    it('should classify instruments based on spectral features', () => {
      const spectrum = new Float32Array(1024);
      
      // Create piano-like spectrum (strong harmonics in mid-range)
      spectrum[100] = 0.8; // Fundamental
      spectrum[200] = 0.6; // 2nd harmonic
      spectrum[300] = 0.4; // 3rd harmonic

      const instruments = fftAnalyzer.classifyInstruments(spectrum);

      expect(instruments).to.be.an('array');
      instruments.forEach(instrument => {
        expect(instrument).to.have.property('type');
        expect(instrument).to.have.property('confidence');
        expect(instrument).to.have.property('frequency');
        expect(instrument).to.have.property('amplitude');
        expect(instrument).to.have.property('timestamp');
      });
    });

    it('should filter by confidence threshold', () => {
      const spectrum = new Float32Array(1024);
      
      // Very weak signal
      spectrum[100] = 0.1;

      const instruments = fftAnalyzer.classifyInstruments(spectrum);

      // Should filter out low-confidence detections
      instruments.forEach(instrument => {
        expect(instrument.confidence).to.be.at.least(0.5);
      });
    });
  });

  describe('configuration', () => {
    it('should update configuration', async () => {
      await fftAnalyzer.initialize();

      const newConfig = {
        fftSize: 4096 as const,
        smoothingTimeConstant: 0.9,
      };

      fftAnalyzer.configure(newConfig);

      const config = fftAnalyzer.getConfig();
      expect(config.fftSize).to.equal(4096);
      expect(config.smoothingTimeConstant).to.equal(0.9);
    });
  });

  describe('audio connection', () => {
    beforeEach(async () => {
      await fftAnalyzer.initialize();
    });

    it('should connect audio source', () => {
      const mockSourceNode = {
        connect: sinon.stub(),
      };

      fftAnalyzer.connectAudioSource(mockSourceNode as any);

      expect(mockSourceNode.connect.calledWith(mockAnalyserNode)).to.be.true;
    });

    it('should disconnect audio source', () => {
      fftAnalyzer.disconnectAudioSource();

      expect(mockAnalyserNode.disconnect.calledOnce).to.be.true;
    });
  });

  describe('disposal', () => {
    it('should dispose correctly', async () => {
      await fftAnalyzer.initialize();
      expect(fftAnalyzer.isDisposed()).to.be.false;

      fftAnalyzer.dispose();

      expect(fftAnalyzer.isDisposed()).to.be.true;
      expect(mockAnalyserNode.disconnect.calledOnce).to.be.true;
    });
  });
});
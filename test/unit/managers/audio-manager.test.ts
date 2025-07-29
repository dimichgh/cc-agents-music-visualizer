/**
 * AudioManager Tests
 */

import { expect, sinon } from '../../setup';
import { AudioManager } from '../../../src/renderer/managers/audio-manager';
import { StateManager } from '../../../src/renderer/managers/state-manager';
import { AudioDecoder } from '../../../src/renderer/services/audio-decoder';
import { FFTAnalyzer } from '../../../src/renderer/services/fft-analyzer';
import { 
  SAMPLE_AUDIO_FILE, 
  SAMPLE_FREQUENCY_DATA, 
  SAMPLE_BEAT_EVENTS,
  createMockAudioBuffer
} from '../../fixtures/audio-fixtures';

describe('AudioManager', () => {
  let audioManager: AudioManager;
  let mockStateManager: sinon.SinonStubbedInstance<StateManager>;
  let mockAudioContext: sinon.SinonStubbedInstance<AudioContext>;
  let mockAudioDecoder: sinon.SinonStubbedInstance<AudioDecoder>;
  let mockFFTAnalyzer: sinon.SinonStubbedInstance<FFTAnalyzer>;
  let mockAudioBuffer: AudioBuffer;

  beforeEach(() => {
    // Create mocks
    mockStateManager = sinon.createStubInstance(StateManager);
    mockAudioContext = sinon.createStubInstance(AudioContext as any);
    mockAudioDecoder = sinon.createStubInstance(AudioDecoder);
    mockFFTAnalyzer = sinon.createStubInstance(FFTAnalyzer);
    
    // Setup mock audio context
    mockAudioContext.state = 'running';
    mockAudioContext.sampleRate = 44100;
    mockAudioContext.currentTime = 0;
    mockAudioContext.resume.resolves();
    
    // Setup mock audio buffer
    mockAudioBuffer = createMockAudioBuffer(10, 44100, 2);
    
    // Setup mock decoder
    mockAudioDecoder.isInitialized.returns(true);
    mockAudioDecoder.loadFromArrayBuffer.resolves(mockAudioBuffer);
    mockAudioDecoder.validateAudioFormat.returns({ isValid: true, errors: [] });
    mockAudioDecoder.extractMetadata.returns({
      duration: 10,
      sampleRate: 44100,
      channels: 2,
      bitDepth: 16,
      format: 'wav'
    });
    
    // Setup mock FFT analyzer
    mockFFTAnalyzer.isInitialized.returns(true);
    mockFFTAnalyzer.analyzeFrequencies.returns(SAMPLE_FREQUENCY_DATA);
    mockFFTAnalyzer.detectBeats.returns(SAMPLE_BEAT_EVENTS);
    mockFFTAnalyzer.classifyInstruments.returns([]);
    
    audioManager = new AudioManager(
      mockStateManager as any,
      mockAudioContext as any,
      mockAudioDecoder as any,
      mockFFTAnalyzer as any
    );
  });

  afterEach(() => {
    if (audioManager && audioManager.isInitialized()) {
      audioManager.dispose();
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      expect(audioManager.isInitialized()).to.be.false;

      await audioManager.initialize();

      expect(audioManager.isInitialized()).to.be.true;
      expect(mockAudioDecoder.initialize.calledOnce).to.be.true;
      expect(mockFFTAnalyzer.initialize.calledOnce).to.be.true;
    });

    it('should handle initialization failure', async () => {
      mockAudioDecoder.initialize.rejects(new Error('Decoder init failed'));

      try {
        await audioManager.initialize();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('AudioManager initialization failed');
      }
    });

    it('should not initialize twice', async () => {
      await audioManager.initialize();
      expect(audioManager.isInitialized()).to.be.true;

      // Second initialization should not throw
      await audioManager.initialize();
      expect(audioManager.isInitialized()).to.be.true;
      expect(mockAudioDecoder.initialize.calledOnce).to.be.true;
    });
  });

  describe('file loading', () => {
    beforeEach(async () => {
      await audioManager.initialize();
    });

    it('should load audio file successfully', async () => {
      const arrayBuffer = new ArrayBuffer(1024);
      
      const result = await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);

      expect(result.success).to.be.true;
      expect(result.audioBuffer).to.equal(mockAudioBuffer);
      expect(mockAudioDecoder.validateAudioFormat.calledWith(arrayBuffer)).to.be.true;
      expect(mockAudioDecoder.loadFromArrayBuffer.calledWith(arrayBuffer)).to.be.true;
      expect(mockStateManager.dispatch.called).to.be.true;
    });

    it('should handle invalid audio format', async () => {
      mockAudioDecoder.validateAudioFormat.returns({
        isValid: false,
        errors: ['Invalid WAV header']
      });

      const arrayBuffer = new ArrayBuffer(1024);
      
      try {
        await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Invalid audio format');
      }
    });

    it('should handle loading errors', async () => {
      mockAudioDecoder.loadFromArrayBuffer.rejects(new Error('Decode failed'));

      const arrayBuffer = new ArrayBuffer(1024);
      
      try {
        await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to load audio file');
      }
    });

    it('should update state on successful load', async () => {
      const arrayBuffer = new ArrayBuffer(1024);
      
      await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);

      // Verify state update calls
      const dispatchCalls = mockStateManager.dispatch.getCalls();
      expect(dispatchCalls.some(call => 
        call.args[0].type === 'AUDIO_FILE_LOAD_SUCCESS'
      )).to.be.true;
    });
  });

  describe('playback control', () => {
    beforeEach(async () => {
      await audioManager.initialize();
      const arrayBuffer = new ArrayBuffer(1024);
      await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
    });

    it('should start playback', async () => {
      await audioManager.play();

      expect(audioManager.isPlaying()).to.be.true;
      expect(mockStateManager.dispatch.called).to.be.true;
    });

    it('should pause playback', async () => {
      await audioManager.play();
      expect(audioManager.isPlaying()).to.be.true;

      await audioManager.pause();

      expect(audioManager.isPlaying()).to.be.false;
      expect(mockStateManager.dispatch.called).to.be.true;
    });

    it('should stop playback', async () => {
      await audioManager.play();
      expect(audioManager.isPlaying()).to.be.true;

      await audioManager.stop();

      expect(audioManager.isPlaying()).to.be.false;
      expect(audioManager.getCurrentTime()).to.equal(0);
    });

    it('should handle seek operations', async () => {
      await audioManager.play();
      
      await audioManager.seek(5.5);

      expect(audioManager.getCurrentTime()).to.equal(5.5);
      expect(mockStateManager.updateAudioTime.calledWith(5.5)).to.be.true;
    });

    it('should handle volume changes', () => {
      audioManager.setVolume(0.75);

      expect(audioManager.getVolume()).to.equal(0.75);
      expect(mockStateManager.dispatch.called).to.be.true;
    });

    it('should validate volume range', () => {
      audioManager.setVolume(1.5); // Above max
      expect(audioManager.getVolume()).to.equal(1.0);

      audioManager.setVolume(-0.5); // Below min
      expect(audioManager.getVolume()).to.equal(0.0);
    });
  });

  describe('audio analysis', () => {
    beforeEach(async () => {
      await audioManager.initialize();
      const arrayBuffer = new ArrayBuffer(1024);
      await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
      await audioManager.play();
    });

    it('should start audio analysis', () => {
      audioManager.startAnalysis();

      expect(audioManager.isAnalyzing()).to.be.true;
    });

    it('should stop audio analysis', () => {
      audioManager.startAnalysis();
      expect(audioManager.isAnalyzing()).to.be.true;

      audioManager.stopAnalysis();

      expect(audioManager.isAnalyzing()).to.be.false;
    });

    it('should process audio frames', () => {
      audioManager.startAnalysis();
      
      // Simulate analysis frame
      audioManager.processAudioFrame();

      expect(mockFFTAnalyzer.analyzeFrequencies.called).to.be.true;
      expect(mockFFTAnalyzer.detectBeats.called).to.be.true;
      expect(mockStateManager.dispatch.called).to.be.true;
    });

    it('should handle beat detection', () => {
      audioManager.startAnalysis();
      
      // Mock beat detection with actual beats
      mockFFTAnalyzer.detectBeats.returns([{
        timestamp: 1.234,
        energy: 0.85,
        type: 'kick',
        confidence: 0.92
      }]);

      audioManager.processAudioFrame();

      // Verify beat event was dispatched
      const dispatchCalls = mockStateManager.dispatch.getCalls();
      expect(dispatchCalls.some(call => 
        call.args[0].type === 'AUDIO_BEAT_DETECTED'
      )).to.be.true;
    });

    it('should detect tempo changes', () => {
      audioManager.startAnalysis();
      
      // Simulate multiple beats to detect tempo
      for (let i = 0; i < 10; i++) {
        mockFFTAnalyzer.detectBeats.returns([{
          timestamp: i * 0.5, // 120 BPM pattern
          energy: 0.8,
          type: 'kick',
          confidence: 0.9
        }]);
        audioManager.processAudioFrame();
      }

      const tempo = audioManager.getCurrentTempo();
      expect(tempo).to.be.within(115, 125); // Allow for some variance
    });
  });

  describe('audio features extraction', () => {
    beforeEach(async () => {
      await audioManager.initialize();
      const arrayBuffer = new ArrayBuffer(1024);
      await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
    });

    it('should extract audio features', () => {
      const features = audioManager.extractAudioFeatures();

      expect(features).to.have.property('tempo');
      expect(features).to.have.property('energy');
      expect(features).to.have.property('spectralCentroid');
      expect(features).to.have.property('spectralRolloff');
      expect(features.tempo).to.be.a('number');
      expect(features.energy).to.be.within(0, 1);
    });

    it('should calculate spectral features', () => {
      const spectrum = new Float32Array(1024);
      // Add some test frequencies
      spectrum[100] = 0.8; // ~2.15kHz at 44.1kHz
      spectrum[200] = 0.6;
      spectrum[300] = 0.4;

      const centroid = audioManager.calculateSpectralCentroid(spectrum);
      const rolloff = audioManager.calculateSpectralRolloff(spectrum);

      expect(centroid).to.be.a('number');
      expect(centroid).to.be.greaterThan(0);
      expect(rolloff).to.be.a('number');
      expect(rolloff).to.be.greaterThan(centroid);
    });

    it('should calculate energy levels', () => {
      const spectrum = new Float32Array(1024);
      for (let i = 0; i < spectrum.length; i++) {
        spectrum[i] = Math.random() * 0.5;
      }

      const energy = audioManager.calculateEnergy(spectrum);

      expect(energy).to.be.within(0, 1);
    });
  });

  describe('configuration', () => {
    beforeEach(async () => {
      await audioManager.initialize();
    });

    it('should update audio processing configuration', () => {
      const newConfig = {
        fftSize: 4096 as const,
        smoothingTimeConstant: 0.9,
        minDecibels: -90,
        maxDecibels: -20
      };

      audioManager.configure(newConfig);

      expect(mockAudioDecoder.configure.calledWith(newConfig)).to.be.true;
      expect(mockFFTAnalyzer.configure.calledWith(newConfig)).to.be.true;
    });

    it('should get current configuration', () => {
      const config = audioManager.getConfig();

      expect(config).to.have.property('fftSize');
      expect(config).to.have.property('smoothingTimeConstant');
      expect(config).to.have.property('minDecibels');
      expect(config).to.have.property('maxDecibels');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await audioManager.initialize();
    });

    it('should handle audio context errors', async () => {
      mockAudioContext.state = 'suspended';
      mockAudioContext.resume.rejects(new Error('Context error'));

      try {
        await audioManager.play();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Audio context error');
      }
    });

    it('should handle playback errors gracefully', async () => {
      // Simulate audio buffer source error
      const errorSpy = sinon.spy(console, 'error');
      
      // Try to play without loaded file
      audioManager = new AudioManager(
        mockStateManager as any,
        mockAudioContext as any,
        mockAudioDecoder as any,
        mockFFTAnalyzer as any
      );
      await audioManager.initialize();

      try {
        await audioManager.play();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('No audio file loaded');
      }

      errorSpy.restore();
    });
  });

  describe('event emission', () => {
    let eventHandler: sinon.SinonSpy;

    beforeEach(async () => {
      eventHandler = sinon.spy();
      await audioManager.initialize();
    });

    it('should emit playback events', async () => {
      audioManager.on('play', eventHandler);
      
      const arrayBuffer = new ArrayBuffer(1024);
      await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
      await audioManager.play();

      expect(eventHandler.calledOnce).to.be.true;
    });

    it('should emit analysis events', () => {
      audioManager.on('analysis', eventHandler);
      audioManager.startAnalysis();
      
      audioManager.processAudioFrame();

      expect(eventHandler.called).to.be.true;
    });

    it('should emit beat events', () => {
      audioManager.on('beat', eventHandler);
      audioManager.startAnalysis();
      
      mockFFTAnalyzer.detectBeats.returns([SAMPLE_BEAT_EVENTS[0]]);
      audioManager.processAudioFrame();

      expect(eventHandler.called).to.be.true;
    });

    it('should remove event listeners', () => {
      audioManager.on('play', eventHandler);
      audioManager.off('play', eventHandler);
      
      // Event should not be called after removal
      audioManager.emit('play', {});
      expect(eventHandler.called).to.be.false;
    });
  });

  describe('performance monitoring', () => {
    beforeEach(async () => {
      await audioManager.initialize();
      const arrayBuffer = new ArrayBuffer(1024);
      await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
    });

    it('should track processing performance', () => {
      audioManager.startAnalysis();
      
      for (let i = 0; i < 10; i++) {
        audioManager.processAudioFrame();
      }

      const metrics = audioManager.getPerformanceMetrics();
      expect(metrics).to.have.property('averageProcessingTime');
      expect(metrics).to.have.property('frameCount');
      expect(metrics).to.have.property('droppedFrames');
      expect(metrics.averageProcessingTime).to.be.a('number');
      expect(metrics.frameCount).to.equal(10);
    });

    it('should detect dropped frames', () => {
      audioManager.startAnalysis();
      
      // Simulate slow processing
      const slowProcessing = sinon.stub(audioManager, 'processAudioFrame')
        .callsFake(() => {
          // Simulate 50ms processing time (too slow for real-time)
          const start = Date.now();
          while (Date.now() - start < 50) { /* busy wait */ }
        });

      audioManager.processAudioFrame();
      
      const metrics = audioManager.getPerformanceMetrics();
      expect(metrics.droppedFrames).to.be.greaterThan(0);
      
      slowProcessing.restore();
    });
  });

  describe('disposal and cleanup', () => {
    it('should dispose correctly', async () => {
      await audioManager.initialize();
      expect(audioManager.isDisposed()).to.be.false;

      audioManager.dispose();

      expect(audioManager.isDisposed()).to.be.true;
      expect(mockAudioDecoder.dispose.calledOnce).to.be.true;
      expect(mockFFTAnalyzer.dispose.calledOnce).to.be.true;
    });

    it('should handle multiple dispose calls', async () => {
      await audioManager.initialize();

      audioManager.dispose();
      audioManager.dispose(); // Should not throw

      expect(audioManager.isDisposed()).to.be.true;
    });

    it('should stop playback on disposal', async () => {
      await audioManager.initialize();
      const arrayBuffer = new ArrayBuffer(1024);
      await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
      await audioManager.play();

      expect(audioManager.isPlaying()).to.be.true;

      audioManager.dispose();

      expect(audioManager.isPlaying()).to.be.false;
    });

    it('should clean up event listeners on disposal', async () => {
      await audioManager.initialize();
      const eventHandler = sinon.spy();
      audioManager.on('play', eventHandler);

      audioManager.dispose();

      audioManager.emit('play', {});
      expect(eventHandler.called).to.be.false;
    });
  });
});
/**
 * Audio Decoder Service Tests
 */

import { expect, sinon } from '../setup';
import { AudioDecoder } from '../../src/renderer/services/audio-decoder';

describe('AudioDecoder', () => {
  let audioDecoder: AudioDecoder;
  let mockAudioContext: sinon.SinonStubbedInstance<AudioContext>;

  beforeEach(() => {
    mockAudioContext = sinon.createStubInstance(AudioContext as any);
    mockAudioContext.state = 'running';
    mockAudioContext.resume.resolves();
    
    audioDecoder = new AudioDecoder(mockAudioContext as any);
  });

  afterEach(() => {
    if (audioDecoder && audioDecoder.isInitialized()) {
      audioDecoder.dispose();
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      expect(audioDecoder.isInitialized()).to.be.false;
      
      await audioDecoder.initialize();
      
      expect(audioDecoder.isInitialized()).to.be.true;
    });

    it('should resume audio context if suspended', async () => {
      mockAudioContext.state = 'suspended';
      
      await audioDecoder.initialize();
      
      expect(mockAudioContext.resume.calledOnce).to.be.true;
    });

    it('should not initialize twice', async () => {
      await audioDecoder.initialize();
      expect(audioDecoder.isInitialized()).to.be.true;
      
      // Second initialization should not throw
      await audioDecoder.initialize();
      expect(audioDecoder.isInitialized()).to.be.true;
    });
  });

  describe('format validation', () => {
    it('should validate WAV file format', () => {
      // Create a minimal WAV header
      const wavHeader = new ArrayBuffer(44);
      const dataView = new DataView(wavHeader);
      
      // RIFF header
      dataView.setUint32(0, 0x52494646, false); // 'RIFF'
      dataView.setUint32(4, 36, true); // File size - 8
      dataView.setUint32(8, 0x57415645, false); // 'WAVE'
      
      // fmt chunk
      dataView.setUint32(12, 0x666d7420, false); // 'fmt '
      dataView.setUint32(16, 16, true); // fmt chunk size
      dataView.setUint16(20, 1, true); // Audio format (PCM)
      dataView.setUint16(22, 2, true); // Number of channels
      dataView.setUint32(24, 44100, true); // Sample rate
      dataView.setUint32(28, 176400, true); // Byte rate
      dataView.setUint16(32, 4, true); // Block align
      dataView.setUint16(34, 16, true); // Bits per sample
      
      // data chunk
      dataView.setUint32(36, 0x64617461, false); // 'data'
      dataView.setUint32(40, 0, true); // Data size
      
      const result = audioDecoder.validateAudioFormat(wavHeader);
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.be.empty;
    });

    it('should reject invalid file format', () => {
      const invalidHeader = new ArrayBuffer(44);
      const dataView = new DataView(invalidHeader);
      dataView.setUint32(0, 0x12345678, false); // Invalid header
      
      const result = audioDecoder.validateAudioFormat(invalidHeader);
      
      expect(result.isValid).to.be.false;
      expect(result.errors).to.not.be.empty;
    });

    it('should reject empty file', () => {
      const emptyBuffer = new ArrayBuffer(0);
      
      const result = audioDecoder.validateAudioFormat(emptyBuffer);
      
      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('File is empty');
    });
  });

  describe('audio decoding', () => {
    beforeEach(async () => {
      await audioDecoder.initialize();
    });

    it('should decode valid audio buffer', async () => {
      const mockAudioBuffer = {
        duration: 10,
        sampleRate: 44100,
        numberOfChannels: 2,
        getChannelData: sinon.stub().returns(new Float32Array(441000)),
      };

      mockAudioContext.decodeAudioData.resolves(mockAudioBuffer as any);

      // Create minimal WAV buffer
      const wavBuffer = new ArrayBuffer(44);
      const dataView = new DataView(wavBuffer);
      
      // Add minimal WAV header
      dataView.setUint32(0, 0x52494646, false); // 'RIFF'
      dataView.setUint32(8, 0x57415645, false); // 'WAVE'
      dataView.setUint32(12, 0x666d7420, false); // 'fmt '
      dataView.setUint32(16, 16, true); // fmt chunk size
      dataView.setUint16(20, 1, true); // PCM format
      dataView.setUint32(36, 0x64617461, false); // 'data'

      const result = await audioDecoder.loadFromArrayBuffer(wavBuffer);

      expect(result).to.equal(mockAudioBuffer);
      expect(mockAudioContext.decodeAudioData.calledOnce).to.be.true;
    });

    it('should handle decoding errors', async () => {
      mockAudioContext.decodeAudioData.rejects(new Error('Decode failed'));

      const wavBuffer = new ArrayBuffer(44);
      
      try {
        await audioDecoder.loadFromArrayBuffer(wavBuffer);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Audio decoding failed');
      }
    });
  });

  describe('metadata extraction', () => {
    it('should extract audio metadata correctly', async () => {
      await audioDecoder.initialize();

      const mockAudioBuffer = {
        duration: 123.45,
        sampleRate: 48000,
        numberOfChannels: 2,
      };

      const metadata = audioDecoder.extractMetadata(mockAudioBuffer as any);

      expect(metadata.duration).to.equal(123.45);
      expect(metadata.sampleRate).to.equal(48000);
      expect(metadata.channels).to.equal(2);
      expect(metadata.bitDepth).to.equal(32); // AudioBuffer uses 32-bit float
    });
  });

  describe('configuration', () => {
    it('should update configuration', async () => {
      await audioDecoder.initialize();

      const newConfig = {
        fftSize: 4096 as const,
        smoothingTimeConstant: 0.9,
      };

      audioDecoder.configure(newConfig);

      const config = audioDecoder.getConfig();
      expect(config.fftSize).to.equal(4096);
      expect(config.smoothingTimeConstant).to.equal(0.9);
    });
  });

  describe('disposal', () => {
    it('should dispose correctly', async () => {
      await audioDecoder.initialize();
      expect(audioDecoder.isDisposed()).to.be.false;

      audioDecoder.dispose();

      expect(audioDecoder.isDisposed()).to.be.true;
    });

    it('should handle multiple dispose calls', async () => {
      await audioDecoder.initialize();

      audioDecoder.dispose();
      audioDecoder.dispose(); // Should not throw

      expect(audioDecoder.isDisposed()).to.be.true;
    });
  });
});
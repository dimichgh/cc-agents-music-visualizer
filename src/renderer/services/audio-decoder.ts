/**
 * Audio Decoder Service - Handles WAV file loading and audio buffer creation
 */

import { 
  ServiceInterface, 
  Logger, 
  AudioFile, 
  AudioMetadata, 
  ValidationResult,
  AudioProcessingConfig,
  MusicVisualizerError 
} from '@/shared/types';

export interface AudioDecoderService {
  loadWavFile(filePath: string): Promise<AudioBuffer>;
  loadFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<AudioBuffer>;
  validateAudioFormat(arrayBuffer: ArrayBuffer): ValidationResult;
  extractMetadata(audioBuffer: AudioBuffer): AudioMetadata;
  resampleAudio(audioBuffer: AudioBuffer, targetSampleRate: number): Promise<AudioBuffer>;
}

export class AudioDecoder implements AudioDecoderService, ServiceInterface {
  private audioContext: AudioContext;
  private logger: Logger;
  private isInitialized = false;
  private isDisposed = false;
  
  // Configuration
  private config: AudioProcessingConfig = {
    fftSize: 2048,
    hopSize: 512,
    windowFunction: 'hamming',
    smoothingTimeConstant: 0.8,
    minDecibels: -100,
    maxDecibels: -30,
  };

  // Supported formats
  private readonly supportedFormats = ['wav', 'aiff', 'flac'];
  private readonly supportedSampleRates = [44100, 48000, 96000, 192000];
  private readonly maxFileSize = 200 * 1024 * 1024; // 200MB

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.logger = new Logger('AudioDecoder');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('AudioDecoder already initialized');
      return;
    }

    this.logger.info('Initializing AudioDecoder...');

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        this.logger.info('Audio context resumed');
      }

      this.isInitialized = true;
      this.logger.info('AudioDecoder initialized successfully');
    } catch (error) {
      throw new MusicVisualizerError(
        'Failed to initialize audio decoder',
        'AUDIO_DECODER_INIT_FAILED',
        'audio',
        'high',
        { error: (error as Error).message }
      );
    }
  }

  /**
   * Load WAV file from file path using IPC
   */
  async loadWavFile(filePath: string): Promise<AudioBuffer> {
    try {
      this.logger.info(`Loading WAV file: ${filePath}`);

      // Read file through IPC
      const response = await window.electronAPI.file.read(filePath);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to read file');
      }

      // Convert number array back to ArrayBuffer
      const uint8Array = new Uint8Array(response.data.data);
      const arrayBuffer = uint8Array.buffer;

      return await this.loadFromArrayBuffer(arrayBuffer);
    } catch (error) {
      this.logger.error(`Failed to load WAV file: ${filePath}`, error as Error);
      throw new MusicVisualizerError(
        `Failed to load audio file: ${(error as Error).message}`,
        'AUDIO_FILE_LOAD_FAILED',
        'audio',
        'high',
        { filePath, error: (error as Error).message }
      );
    }
  }

  /**
   * Load audio from ArrayBuffer
   */
  async loadFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    try {
      // Validate the audio format
      const validation = this.validateAudioFormat(arrayBuffer);
      if (!validation.isValid) {
        throw new Error(`Invalid audio format: ${validation.errors.join(', ')}`);
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => this.logger.warn(warning));
      }

      // Decode the audio data
      this.logger.debug('Decoding audio data...');
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));

      // Validate the decoded audio
      this.validateDecodedAudio(audioBuffer);

      this.logger.info(`Audio decoded successfully: ${audioBuffer.duration}s, ${audioBuffer.sampleRate}Hz, ${audioBuffer.numberOfChannels} channels`);
      
      return audioBuffer;
    } catch (error) {
      this.logger.error('Failed to decode audio buffer', error as Error);
      throw new MusicVisualizerError(
        `Audio decoding failed: ${(error as Error).message}`,
        'AUDIO_DECODE_FAILED',
        'audio',
        'high',
        { error: (error as Error).message }
      );
    }
  }

  /**
   * Validate audio format and structure
   */
  validateAudioFormat(arrayBuffer: ArrayBuffer): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Check file size
      if (arrayBuffer.byteLength === 0) {
        result.isValid = false;
        result.errors.push('File is empty');
        return result;
      }

      if (arrayBuffer.byteLength > this.maxFileSize) {
        result.isValid = false;
        result.errors.push(`File too large (${this.formatBytes(arrayBuffer.byteLength)} > ${this.formatBytes(this.maxFileSize)})`);
        return result;
      }

      // Basic WAV format validation
      const dataView = new DataView(arrayBuffer);
      
      // Check RIFF header
      const riffHeader = this.readString(dataView, 0, 4);
      if (riffHeader !== 'RIFF') {
        result.isValid = false;
        result.errors.push('Invalid RIFF header');
        return result;
      }

      // Check WAVE format
      const waveFormat = this.readString(dataView, 8, 4);
      if (waveFormat !== 'WAVE') {
        result.isValid = false;
        result.errors.push('Invalid WAVE format');
        return result;
      }

      // Find and validate fmt chunk
      let offset = 12;
      let fmtFound = false;
      let dataFound = false;

      while (offset < arrayBuffer.byteLength - 8) {
        const chunkId = this.readString(dataView, offset, 4);
        const chunkSize = dataView.getUint32(offset + 4, true);

        if (chunkId === 'fmt ') {
          fmtFound = true;
          
          // Validate format chunk
          if (chunkSize < 16) {
            result.isValid = false;
            result.errors.push('Invalid format chunk size');
            return result;
          }

          const audioFormat = dataView.getUint16(offset + 8, true);
          const numChannels = dataView.getUint16(offset + 10, true);
          const sampleRate = dataView.getUint32(offset + 12, true);
          const bitsPerSample = dataView.getUint16(offset + 22, true);

          // Validate audio format (1 = PCM)
          if (audioFormat !== 1) {
            result.warnings.push(`Non-PCM format detected (${audioFormat}), may not be supported`);
          }

          // Validate channels
          if (numChannels < 1 || numChannels > 8) {
            result.isValid = false;
            result.errors.push(`Unsupported channel count: ${numChannels}`);
          }

          // Validate sample rate
          if (!this.supportedSampleRates.includes(sampleRate)) {
            result.warnings.push(`Unusual sample rate: ${sampleRate}Hz`);
          }

          // Validate bit depth
          if (![16, 24, 32].includes(bitsPerSample)) {
            result.warnings.push(`Unusual bit depth: ${bitsPerSample}-bit`);
          }

        } else if (chunkId === 'data') {
          dataFound = true;
          
          // Validate data chunk size
          if (chunkSize === 0) {
            result.isValid = false;
            result.errors.push('Empty data chunk');
          }
        }

        offset += 8 + chunkSize;
        // Ensure proper alignment
        if (chunkSize % 2 === 1) offset++;
      }

      if (!fmtFound) {
        result.isValid = false;
        result.errors.push('Format chunk not found');
      }

      if (!dataFound) {
        result.isValid = false;
        result.errors.push('Data chunk not found');
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Format validation failed: ${(error as Error).message}`);
    }

    return result;
  }

  /**
   * Extract audio metadata from decoded buffer
   */
  extractMetadata(audioBuffer: AudioBuffer): AudioMetadata {
    return {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      bitDepth: 32, // AudioBuffer uses 32-bit float internally
    };
  }

  /**
   * Resample audio to target sample rate
   */
  async resampleAudio(audioBuffer: AudioBuffer, targetSampleRate: number): Promise<AudioBuffer> {
    if (audioBuffer.sampleRate === targetSampleRate) {
      return audioBuffer;
    }

    this.logger.info(`Resampling audio from ${audioBuffer.sampleRate}Hz to ${targetSampleRate}Hz`);

    try {
      // Create offline audio context for resampling
      const resampleContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        Math.ceil(audioBuffer.duration * targetSampleRate),
        targetSampleRate
      );

      // Create buffer source
      const source = resampleContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(resampleContext.destination);

      // Start processing
      source.start(0);
      const resampledBuffer = await resampleContext.startRendering();

      this.logger.info('Audio resampling completed');
      return resampledBuffer;
    } catch (error) {
      this.logger.error('Failed to resample audio', error as Error);
      throw new MusicVisualizerError(
        'Audio resampling failed',
        'AUDIO_RESAMPLE_FAILED',
        'audio',
        'medium',
        { 
          originalSampleRate: audioBuffer.sampleRate,
          targetSampleRate,
          error: (error as Error).message 
        }
      );
    }
  }

  /**
   * Validate decoded audio buffer
   */
  private validateDecodedAudio(audioBuffer: AudioBuffer): void {
    if (audioBuffer.duration === 0) {
      throw new Error('Audio buffer has zero duration');
    }

    if (audioBuffer.numberOfChannels === 0) {
      throw new Error('Audio buffer has no channels');
    }

    if (audioBuffer.sampleRate === 0) {
      throw new Error('Audio buffer has zero sample rate');
    }

    // Check for valid audio data
    const channelData = audioBuffer.getChannelData(0);
    const hasValidData = channelData.some(sample => Math.abs(sample) > 0.0001);
    
    if (!hasValidData) {
      this.logger.warn('Audio buffer appears to contain only silence');
    }
  }

  /**
   * Read string from DataView
   */
  private readString(dataView: DataView, offset: number, length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += String.fromCharCode(dataView.getUint8(offset + i));
    }
    return result;
  }

  /**
   * Format byte size for display
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Update configuration
   */
  public configure(config: Partial<AudioProcessingConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.debug('Audio decoder configuration updated', this.config);
  }

  /**
   * Get current configuration
   */
  public getConfig(): AudioProcessingConfig {
    return { ...this.config };
  }

  public isInitialized(): boolean {
    return this.isInitialized;
  }

  public isDisposed(): boolean {
    return this.isDisposed;
  }

  public dispose(): void {
    if (this.isDisposed) return;

    this.logger.info('Disposing AudioDecoder...');
    this.isDisposed = true;
    this.logger.info('AudioDecoder disposed');
  }
}
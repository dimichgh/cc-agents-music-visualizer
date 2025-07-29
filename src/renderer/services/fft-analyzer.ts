/**
 * FFT Analyzer Service - Real-time frequency analysis using Web Audio API
 */

import { 
  ServiceInterface, 
  Logger, 
  FrequencyData, 
  BeatEvent, 
  InstrumentData,
  AudioProcessingConfig,
  MusicVisualizerError 
} from '@/shared/types';

export interface FFTAnalyzer {
  analyzeFrequencies(audioData: Float32Array): FrequencyData;
  getSpectrum(fftSize: number): Float32Array;
  detectBeats(frequencyData: FrequencyData): BeatEvent[];
  classifyInstruments(spectrum: Float32Array): InstrumentData[];
  getFrequencyBins(): number;
  getSampleRate(): number;
}

export class FFTAnalyzer implements FFTAnalyzer, ServiceInterface {
  private audioContext: AudioContext;
  private analyserNode: AnalyserNode;
  private logger: Logger;
  private isInitialized = false;
  private isDisposed = false;

  // Analysis buffers
  private frequencyBuffer: Float32Array;
  private timeDomainBuffer: Float32Array;
  private magnitudeHistory: Float32Array[] = [];
  private phaseHistory: Float32Array[] = [];
  
  // Configuration
  private config: AudioProcessingConfig = {
    fftSize: 2048,
    hopSize: 512,
    windowFunction: 'hamming',
    smoothingTimeConstant: 0.8,
    minDecibels: -100,
    maxDecibels: -30,
  };

  // Beat detection state
  private beatDetection = {
    energyHistory: [] as number[],
    threshold: 1.3,
    minTimeBetweenBeats: 0.1, // seconds
    lastBeatTime: 0,
    bassRange: { start: 0, end: 32 },
    historySize: 43, // ~1 second at 60fps
  };

  // Instrument classification state
  private instrumentClassification = {
    spectralFeatures: [] as Float32Array[],
    historySize: 20,
    confidenceThreshold: 0.5,
  };

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.logger = new Logger('FFTAnalyzer');
    
    // Create analyser node
    this.analyserNode = audioContext.createAnalyser();
    this.setupAnalyser();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('FFTAnalyzer already initialized');
      return;
    }

    this.logger.info('Initializing FFTAnalyzer...');

    try {
      // Initialize buffers
      this.initializeBuffers();
      
      this.isInitialized = true;
      this.logger.info(`FFTAnalyzer initialized: ${this.config.fftSize} FFT size, ${this.audioContext.sampleRate}Hz`);
    } catch (error) {
      throw new MusicVisualizerError(
        'Failed to initialize FFT analyzer',
        'FFT_ANALYZER_INIT_FAILED',
        'audio',
        'high',
        { error: (error as Error).message }
      );
    }
  }

  private setupAnalyser(): void {
    this.analyserNode.fftSize = this.config.fftSize;
    this.analyserNode.smoothingTimeConstant = this.config.smoothingTimeConstant;
    this.analyserNode.minDecibels = this.config.minDecibels;
    this.analyserNode.maxDecibels = this.config.maxDecibels;
  }

  private initializeBuffers(): void {
    const bufferLength = this.analyserNode.frequencyBinCount;
    this.frequencyBuffer = new Float32Array(bufferLength);
    this.timeDomainBuffer = new Float32Array(this.analyserNode.fftSize);
    
    this.logger.debug(`Initialized buffers: ${bufferLength} frequency bins`);
  }

  /**
   * Analyze current audio frequencies
   */
  analyzeFrequencies(audioData?: Float32Array): FrequencyData {
    if (!this.isInitialized) {
      throw new Error('FFTAnalyzer not initialized');
    }

    // Get frequency data from analyser
    this.analyserNode.getFloatFrequencyData(this.frequencyBuffer);
    
    // Convert decibels to linear scale and normalize
    const frequencies = new Float32Array(this.frequencyBuffer.length);
    const magnitudes = new Float32Array(this.frequencyBuffer.length);
    const phases = new Float32Array(this.frequencyBuffer.length);

    for (let i = 0; i < this.frequencyBuffer.length; i++) {
      // Convert dB to linear scale (0-1)
      const dbValue = this.frequencyBuffer[i];
      const linearValue = Math.pow(10, dbValue / 20);
      const normalizedValue = Math.max(0, Math.min(1, linearValue));
      
      frequencies[i] = normalizedValue;
      magnitudes[i] = normalizedValue;
      
      // Phase calculation (simplified - for real phase, need complex FFT)
      phases[i] = 0; // Placeholder - Web Audio API doesn't provide phase directly
    }

    // Store history for temporal analysis
    this.magnitudeHistory.push(new Float32Array(magnitudes));
    if (this.magnitudeHistory.length > this.beatDetection.historySize) {
      this.magnitudeHistory.shift();
    }

    const frequencyData: FrequencyData = {
      frequencies,
      magnitudes,
      phases,
      bins: frequencies.length,
      sampleRate: this.audioContext.sampleRate,
      timestamp: this.audioContext.currentTime,
    };

    return frequencyData;
  }

  /**
   * Get current frequency spectrum
   */
  getSpectrum(fftSize?: number): Float32Array {
    if (fftSize && fftSize !== this.config.fftSize) {
      this.logger.warn(`Requested FFT size ${fftSize} differs from configured size ${this.config.fftSize}`);
    }

    return new Float32Array(this.frequencyBuffer);
  }

  /**
   * Detect beats using energy-based algorithm
   */
  detectBeats(frequencyData: FrequencyData): BeatEvent[] {
    const beats: BeatEvent[] = [];
    const currentTime = frequencyData.timestamp;

    // Calculate energy in bass range
    const bassEnergy = this.calculateBassEnergy(frequencyData.magnitudes);
    
    // Store energy history
    this.beatDetection.energyHistory.push(bassEnergy);
    if (this.beatDetection.energyHistory.length > this.beatDetection.historySize) {
      this.beatDetection.energyHistory.shift();
    }

    // Need sufficient history for beat detection
    if (this.beatDetection.energyHistory.length < this.beatDetection.historySize) {
      return beats;
    }

    // Calculate average energy and variance
    const avgEnergy = this.beatDetection.energyHistory.reduce((sum, e) => sum + e, 0) / 
                     this.beatDetection.energyHistory.length;
    
    const variance = this.beatDetection.energyHistory.reduce((sum, e) => sum + Math.pow(e - avgEnergy, 2), 0) / 
                    this.beatDetection.energyHistory.length;
    
    const threshold = avgEnergy + (this.beatDetection.threshold * Math.sqrt(variance));

    // Detect beat if current energy exceeds threshold
    const timeSinceLastBeat = currentTime - this.beatDetection.lastBeatTime;
    
    if (bassEnergy > threshold && timeSinceLastBeat > this.beatDetection.minTimeBetweenBeats) {
      const strength = Math.min(1.0, (bassEnergy - threshold) / threshold);
      
      beats.push({
        time: currentTime,
        strength,
        type: this.classifyBeatType(frequencyData),
      });

      this.beatDetection.lastBeatTime = currentTime;
      this.logger.debug(`Beat detected: strength=${strength.toFixed(2)}, type=${beats[0]?.type}`);
    }

    return beats;
  }

  /**
   * Classify instruments based on spectral features
   */
  classifyInstruments(spectrum: Float32Array): InstrumentData[] {
    const instruments: InstrumentData[] = [];
    const currentTime = this.audioContext.currentTime;

    // Store spectral features history
    this.instrumentClassification.spectralFeatures.push(new Float32Array(spectrum));
    if (this.instrumentClassification.spectralFeatures.length > this.instrumentClassification.historySize) {
      this.instrumentClassification.spectralFeatures.shift();
    }

    // Calculate spectral features
    const features = this.extractSpectralFeatures(spectrum);

    // Simple rule-based instrument classification
    // (In a real implementation, this would use machine learning)
    
    // Piano detection - strong harmonics in mid-range
    if (features.spectralCentroid > 0.3 && features.spectralCentroid < 0.6 && 
        features.harmonicRatio > 0.7) {
      instruments.push({
        type: 'piano',
        confidence: Math.min(0.9, features.harmonicRatio),
        frequency: features.fundamentalFreq,
        amplitude: features.amplitude,
        timestamp: currentTime,
      });
    }

    // Guitar detection - strong mid frequencies with some distortion
    if (features.spectralCentroid > 0.4 && features.spectralCentroid < 0.8 && 
        features.spectralSpread > 0.3) {
      instruments.push({
        type: 'guitar',
        confidence: Math.min(0.8, features.spectralSpread),
        frequency: features.fundamentalFreq,
        amplitude: features.amplitude,
        timestamp: currentTime,
      });
    }

    // Bass detection - strong low frequencies
    if (features.bassRatio > 0.6 && features.spectralCentroid < 0.3) {
      instruments.push({
        type: 'bass',
        confidence: Math.min(0.9, features.bassRatio),
        frequency: features.fundamentalFreq,
        amplitude: features.amplitude,
        timestamp: currentTime,
      });
    }

    // Drums detection - strong transients and noise
    if (features.spectralFlux > 0.5 && features.noisiness > 0.4) {
      instruments.push({
        type: 'drums',
        confidence: Math.min(0.8, features.spectralFlux),
        frequency: features.fundamentalFreq,
        amplitude: features.amplitude,
        timestamp: currentTime,
      });
    }

    // Synthesizer detection - very pure tones or very complex spectra
    if ((features.harmonicRatio > 0.9 && features.spectralSpread < 0.2) ||
        (features.spectralComplexity > 0.8)) {
      instruments.push({
        type: 'synthesizer',
        confidence: Math.min(0.7, Math.max(features.harmonicRatio, features.spectralComplexity)),
        frequency: features.fundamentalFreq,
        amplitude: features.amplitude,
        timestamp: currentTime,
      });
    }

    // Filter by confidence threshold
    return instruments.filter(instrument => 
      instrument.confidence >= this.instrumentClassification.confidenceThreshold
    );
  }

  /**
   * Calculate bass energy for beat detection
   */
  private calculateBassEnergy(magnitudes: Float32Array): number {
    let energy = 0;
    for (let i = this.beatDetection.bassRange.start; i < this.beatDetection.bassRange.end; i++) {
      energy += magnitudes[i] * magnitudes[i];
    }
    return energy / (this.beatDetection.bassRange.end - this.beatDetection.bassRange.start);
  }

  /**
   * Classify beat type based on frequency content
   */
  private classifyBeatType(frequencyData: FrequencyData): BeatEvent['type'] {
    const { magnitudes } = frequencyData;
    const bassEnergy = this.calculateBassEnergy(magnitudes);
    
    // Simple classification based on frequency ranges
    const midEnergy = this.calculateEnergyRange(magnitudes, 32, 128);
    const highEnergy = this.calculateEnergyRange(magnitudes, 128, 256);

    if (bassEnergy > midEnergy * 2 && bassEnergy > highEnergy * 2) {
      return 'kick';
    } else if (midEnergy > bassEnergy && midEnergy > highEnergy) {
      return 'snare';
    } else if (highEnergy > bassEnergy && highEnergy > midEnergy) {
      return 'hihat';
    } else {
      return 'other';
    }
  }

  /**
   * Calculate energy in frequency range
   */
  private calculateEnergyRange(magnitudes: Float32Array, start: number, end: number): number {
    let energy = 0;
    for (let i = start; i < Math.min(end, magnitudes.length); i++) {
      energy += magnitudes[i] * magnitudes[i];
    }
    return energy / (end - start);
  }

  /**
   * Extract spectral features for instrument classification
   */
  private extractSpectralFeatures(spectrum: Float32Array) {
    const features = {
      spectralCentroid: 0,
      spectralSpread: 0,
      spectralFlux: 0,
      spectralRolloff: 0,
      harmonicRatio: 0,
      noisiness: 0,
      bassRatio: 0,
      fundamentalFreq: 0,
      amplitude: 0,
      spectralComplexity: 0,
    };

    // Calculate total energy
    let totalEnergy = 0;
    for (let i = 0; i < spectrum.length; i++) {
      totalEnergy += spectrum[i];
    }

    if (totalEnergy === 0) return features;

    // Spectral centroid (brightness)
    let weightedSum = 0;
    for (let i = 0; i < spectrum.length; i++) {
      weightedSum += i * spectrum[i];
    }
    features.spectralCentroid = weightedSum / totalEnergy / spectrum.length;

    // Spectral spread (bandwidth)
    let spreadSum = 0;
    for (let i = 0; i < spectrum.length; i++) {
      const normalizedFreq = i / spectrum.length;
      spreadSum += Math.pow(normalizedFreq - features.spectralCentroid, 2) * spectrum[i];
    }
    features.spectralSpread = Math.sqrt(spreadSum / totalEnergy);

    // Bass ratio
    const bassEnergy = this.calculateEnergyRange(spectrum, 0, 32);
    features.bassRatio = bassEnergy / totalEnergy;

    // Find fundamental frequency (peak in lower frequencies)
    let maxBin = 0;
    let maxValue = 0;
    for (let i = 1; i < Math.min(256, spectrum.length); i++) {
      if (spectrum[i] > maxValue) {
        maxValue = spectrum[i];
        maxBin = i;
      }
    }
    features.fundamentalFreq = (maxBin * this.audioContext.sampleRate) / (2 * spectrum.length);
    features.amplitude = maxValue;

    // Harmonic ratio (simplified)
    const harmonicEnergy = spectrum[maxBin] + 
                          (spectrum[maxBin * 2] || 0) + 
                          (spectrum[maxBin * 3] || 0);
    features.harmonicRatio = harmonicEnergy / totalEnergy;

    // Spectral flux (change from previous frame)
    if (this.instrumentClassification.spectralFeatures.length > 0) {
      const prevSpectrum = this.instrumentClassification.spectralFeatures[
        this.instrumentClassification.spectralFeatures.length - 1
      ];
      let fluxSum = 0;
      for (let i = 0; i < Math.min(spectrum.length, prevSpectrum.length); i++) {
        const diff = spectrum[i] - prevSpectrum[i];
        fluxSum += diff > 0 ? diff : 0;
      }
      features.spectralFlux = fluxSum / spectrum.length;
    }

    // Spectral rolloff (frequency below which 85% of energy is contained)
    let cumulativeEnergy = 0;
    const rolloffThreshold = 0.85 * totalEnergy;
    for (let i = 0; i < spectrum.length; i++) {
      cumulativeEnergy += spectrum[i];
      if (cumulativeEnergy >= rolloffThreshold) {
        features.spectralRolloff = i / spectrum.length;
        break;
      }
    }

    // Noisiness (inverse of harmonicity)
    features.noisiness = 1 - features.harmonicRatio;

    // Spectral complexity (number of significant peaks)
    let peakCount = 0;
    for (let i = 1; i < spectrum.length - 1; i++) {
      if (spectrum[i] > spectrum[i-1] && spectrum[i] > spectrum[i+1] && 
          spectrum[i] > totalEnergy * 0.1) {
        peakCount++;
      }
    }
    features.spectralComplexity = Math.min(1, peakCount / 20);

    return features;
  }

  /**
   * Connect analyser to audio source
   */
  public connectAudioSource(sourceNode: AudioNode): void {
    sourceNode.connect(this.analyserNode);
    this.logger.debug('Audio source connected to analyser');
  }

  /**
   * Disconnect analyser from audio source
   */
  public disconnectAudioSource(): void {
    this.analyserNode.disconnect();
    this.logger.debug('Audio source disconnected from analyser');
  }

  /**
   * Get analyser node for connecting to audio graph
   */
  public getAnalyserNode(): AnalyserNode {
    return this.analyserNode;
  }

  /**
   * Update configuration
   */
  public configure(config: Partial<AudioProcessingConfig>): void {
    this.config = { ...this.config, ...config };
    this.setupAnalyser();
    this.initializeBuffers();
    this.logger.debug('FFT analyzer configuration updated', this.config);
  }

  /**
   * Get current configuration
   */
  public getConfig(): AudioProcessingConfig {
    return { ...this.config };
  }

  public getFrequencyBins(): number {
    return this.analyserNode.frequencyBinCount;
  }

  public getSampleRate(): number {
    return this.audioContext.sampleRate;
  }

  public isInitialized(): boolean {
    return this.isInitialized;
  }

  public isDisposed(): boolean {
    return this.isDisposed;
  }

  public dispose(): void {
    if (this.isDisposed) return;

    this.logger.info('Disposing FFTAnalyzer...');
    
    try {
      this.analyserNode.disconnect();
    } catch (error) {
      this.logger.warn('Error disconnecting analyser node', error as Error);
    }

    // Clear history arrays
    this.magnitudeHistory = [];
    this.phaseHistory = [];
    this.beatDetection.energyHistory = [];
    this.instrumentClassification.spectralFeatures = [];

    this.isDisposed = true;
    this.logger.info('FFTAnalyzer disposed');
  }
}
/**
 * Audio Manager - Orchestrates audio playback, analysis, and state management
 */

import { 
  ServiceInterface, 
  AudioFile, 
  AudioFeatures,
  StateManager,
  ActionTypes,
  MusicVisualizerError 
} from '@/shared/types';
import { Logger, AppLogger } from '@/shared/utils/logger';
import { AudioDecoder } from '../services/audio-decoder';
import { FFTAnalyzer } from '../services/fft-analyzer';

export class AudioManager implements ServiceInterface {
  private audioContext: AudioContext;
  private audioDecoder: AudioDecoder;
  private fftAnalyzer: FFTAnalyzer;
  private stateManager: StateManager;
  private logger: Logger;

  private _isInitialized = false;
  private _isDisposed = false;

  // Audio playback
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private startTime = 0;
  private pauseTime = 0;
  private isPlaying = false;

  constructor(
    audioContext: AudioContext,
    audioDecoder: AudioDecoder,
    fftAnalyzer: FFTAnalyzer,
    stateManager: StateManager
  ) {
    this.audioContext = audioContext;
    this.audioDecoder = audioDecoder;
    this.fftAnalyzer = fftAnalyzer;
    this.stateManager = stateManager;
    this.logger = new AppLogger('AudioManager');
  }

  async initialize(): Promise<void> {
    if (this._isInitialized) {
      this.logger.warn('AudioManager already initialized');
      return;
    }

    this.logger.info('Initializing AudioManager...');

    try {
      // Create audio nodes
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);

      // Connect FFT analyzer
      this.gainNode.connect(this.fftAnalyzer.getAnalyserNode());

      // Subscribe to state changes for playback control
      this.subscribeToStateChanges();

      this._isInitialized = true;
      this.logger.info('AudioManager initialized successfully');
    } catch (error) {
      throw new MusicVisualizerError(
        'Failed to initialize audio manager',
        'AUDIO_MANAGER_INIT_FAILED',
        'audio',
        'high',
        { error: (error as Error).message }
      );
    }
  }

  async loadAudioFile(file: AudioFile): Promise<void> {
    this.logger.info(`Loading audio file: ${file.name}`);

    try {
      // Dispatch loading start
      this.stateManager.dispatch({
        type: ActionTypes.AUDIO_FILE_LOAD_START,
        payload: { file },
      });

      // Stop current playback
      this.stop();

      // Load and decode audio
      this.audioBuffer = await this.audioDecoder.loadWavFile(file.path);

      // Update file metadata with decoded info
      const metadata = this.audioDecoder.extractMetadata(this.audioBuffer);
      const updatedFile = {
        ...file,
        duration: metadata.duration,
        sampleRate: metadata.sampleRate,
        channels: metadata.channels,
        bitDepth: metadata.bitDepth,
      };

      // Dispatch successful load
      this.stateManager.dispatch({
        type: ActionTypes.AUDIO_FILE_LOAD_SUCCESS,
        payload: { 
          file: updatedFile,
          audioBuffer: this.audioBuffer,
        },
      });

      this.logger.info(`Audio file loaded: ${metadata.duration}s, ${metadata.sampleRate}Hz`);
    } catch (error) {
      this.logger.error(`Failed to load audio file: ${file.name}`, error as Error);
      
      this.stateManager.dispatch({
        type: ActionTypes.AUDIO_FILE_LOAD_ERROR,
        payload: { 
          file,
          error: (error as Error).message,
        },
      });

      throw error;
    }
  }

  play(): void {
    if (!this.audioBuffer) {
      this.logger.warn('No audio buffer available for playback');
      return;
    }

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Stop current playback
      this.stopInternal();

      // Create new source node
      this.sourceNode = this.audioContext.createBufferSource();
      this.sourceNode.buffer = this.audioBuffer;
      this.sourceNode.connect(this.gainNode!);

      // Handle playback completion
      this.sourceNode.onended = () => {
        this.handlePlaybackEnd();
      };

      // Start playback
      const offset = this.pauseTime;
      this.sourceNode.start(0, offset);
      this.startTime = this.audioContext.currentTime - offset;
      this.pauseTime = 0;
      this.isPlaying = true;

      this.logger.debug('Audio playback started');
    } catch (error) {
      this.logger.error('Failed to start audio playback', error as Error);
      throw error;
    }
  }

  pause(): void {
    if (!this.isPlaying || !this.sourceNode) {
      this.logger.warn('No active playback to pause');
      return;
    }

    try {
      // Calculate current position
      this.pauseTime = this.audioContext.currentTime - this.startTime;
      
      // Stop current source
      this.sourceNode.stop();
      this.sourceNode = null;
      this.isPlaying = false;

      this.logger.debug('Audio playback paused');
    } catch (error) {
      this.logger.error('Failed to pause audio playback', error as Error);
    }
  }

  stop(): void {
    this.stopInternal();
  }

  private stopInternal(): void {
    try {
      if (this.sourceNode) {
        this.sourceNode.stop();
        this.sourceNode = null;
      }

      this.startTime = 0;
      this.pauseTime = 0;
      this.isPlaying = false;

      this.logger.debug('Audio playback stopped');
    } catch (error) {
      this.logger.error('Failed to stop audio playback', error as Error);
    }
  }

  seek(time: number): void {
    if (!this.audioBuffer) {
      this.logger.warn('No audio buffer available for seeking');
      return;
    }

    const wasPlaying = this.isPlaying;
    
    // Stop current playback
    this.stopInternal();
    
    // Set new position
    this.pauseTime = Math.max(0, Math.min(time, this.audioBuffer.duration));
    
    // Resume playback if it was playing
    if (wasPlaying) {
      this.play();
    }

    // Dispatch seek update to state immediately
    this.stateManager.dispatch({
      type: ActionTypes.AUDIO_SEEK_UPDATE,
      payload: { currentTime: this.pauseTime, timestamp: Date.now() },
    });

    this.logger.debug(`Seeked to position: ${this.pauseTime}s`);
  }

  setVolume(volume: number): void {
    if (!this.gainNode) return;

    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.gainNode.gain.setValueAtTime(clampedVolume, this.audioContext.currentTime);

    this.logger.debug(`Volume set to: ${clampedVolume}`);
  }

  getCurrentTime(): number {
    if (!this.isPlaying) {
      return this.pauseTime;
    }
    return this.audioContext.currentTime - this.startTime;
  }

  getDuration(): number {
    return this.audioBuffer?.duration || 0;
  }

  updateAnalysis(): AudioFeatures | null {
    if (!this.audioBuffer || !this.isPlaying) {
      // Debug logging for why analysis is not running
      if (Math.random() < 0.01) { // Log occasionally to avoid spam
        this.logger.debug(`Analysis skipped - Buffer: ${!!this.audioBuffer}, Playing: ${this.isPlaying}`);
      }
      return null;
    }

    try {
      // Get frequency analysis
      const frequencyData = this.fftAnalyzer.analyzeFrequencies();
      
      // Debug frequency data
      if (frequencyData && frequencyData.frequencies.length > 0) {
        const avgFreq = frequencyData.frequencies.reduce((a, b) => a + b, 0) / frequencyData.frequencies.length;
        if (Math.random() < 0.05) { // Log 5% of the time
          this.logger.debug(`Frequency analysis - Length: ${frequencyData.frequencies.length}, Avg: ${avgFreq.toFixed(2)}`);
        }
      } else {
        this.logger.warn('No frequency data from FFT analyzer');
      }
      
      // Detect beats
      const beats = this.fftAnalyzer.detectBeats(frequencyData);
      
      // Classify instruments
      const instruments = this.fftAnalyzer.classifyInstruments(frequencyData.frequencies);

      // Create audio features object
      const audioFeatures: AudioFeatures = {
        frequencyData,
        beatData: {
          tempo: 120, // Placeholder - would be calculated from beat history
          beats,
          confidence: 0.8,
          timestamp: frequencyData.timestamp,
        },
        instrumentData: instruments,
        spectralCentroid: this.calculateSpectralCentroid(frequencyData.frequencies),
        spectralRolloff: this.calculateSpectralRolloff(frequencyData.frequencies),
        zeroCrossingRate: 0, // Placeholder
        mfcc: new Float32Array(13), // Placeholder
        chroma: new Float32Array(12), // Placeholder
        timestamp: frequencyData.timestamp,
      };

      // Update state with new features
      this.stateManager.dispatch({
        type: ActionTypes.AUDIO_FEATURES_UPDATE,
        payload: { features: audioFeatures },
      });

      return audioFeatures;
    } catch (error) {
      this.logger.error('Failed to update audio analysis', error as Error);
      return null;
    }
  }

  private calculateSpectralCentroid(frequencies: Float32Array): number {
    let weightedSum = 0;
    let totalEnergy = 0;

    for (let i = 0; i < frequencies.length; i++) {
      const freq = frequencies[i] ?? 0;
      weightedSum += i * freq;
      totalEnergy += freq;
    }

    return totalEnergy > 0 ? weightedSum / totalEnergy / frequencies.length : 0;
  }

  private calculateSpectralRolloff(frequencies: Float32Array): number {
    const totalEnergy = frequencies.reduce((sum, val) => sum + val, 0);
    const rolloffThreshold = 0.85 * totalEnergy;
    
    let cumulativeEnergy = 0;
    for (let i = 0; i < frequencies.length; i++) {
      cumulativeEnergy += frequencies[i] ?? 0;
      if (cumulativeEnergy >= rolloffThreshold) {
        return i / frequencies.length;
      }
    }
    
    return 1.0;
  }

  private subscribeToStateChanges(): void {
    let lastAction: any = null;
    
    this.stateManager.subscribe((state) => {
      // Handle volume changes
      if (this.gainNode && state.audio.volume !== this.gainNode.gain.value) {
        this.gainNode.gain.setValueAtTime(state.audio.volume, this.audioContext.currentTime);
        this.logger.debug(`Volume updated to: ${state.audio.volume}`);
      }
    });

    // Intercept dispatch for action handling
    const originalDispatch = this.stateManager.dispatch.bind(this.stateManager);
    this.stateManager.dispatch = (action) => {
      this.logger.debug(`AudioManager intercepting action: ${action.type}`);
      
      // Handle audio actions before they reach the state
      switch (action.type) {
        case ActionTypes.AUDIO_FILE_LOAD_REQUEST:
          if (action.payload?.file) {
            this.handleLoadFileAction(action.payload.file);
          }
          // Don't propagate this action to state - it's just a command
          return;
        
        case ActionTypes.AUDIO_PLAY:
          this.handlePlayAction();
          break;
        
        case ActionTypes.AUDIO_PAUSE:
          this.handlePauseAction();
          break;
        
        case ActionTypes.AUDIO_STOP:
          this.handleStopAction();
          break;
        
        case ActionTypes.AUDIO_SEEK:
          if (action.payload?.time !== undefined) {
            this.handleSeekAction(action.payload.time);
          }
          break;
          
        case ActionTypes.AUDIO_VOLUME_CHANGE:
          if (action.payload?.volume !== undefined) {
            this.handleVolumeAction(action.payload.volume);
          }
          break;
      }
      
      // Call the original dispatch to update state
      originalDispatch(action);
    };
  }

  private handleLoadFileAction(file: AudioFile): void {
    this.logger.debug('AudioManager handling load file action', file);
    try {
      this.loadAudioFile(file);
    } catch (error) {
      this.logger.error('Failed to handle load file action', error as Error);
    }
  }

  private handlePlayAction(): void {
    this.logger.debug('AudioManager handling play action');
    try {
      this.play();
    } catch (error) {
      this.logger.error('Failed to handle play action', error as Error);
    }
  }

  private handlePauseAction(): void {
    this.logger.debug('AudioManager handling pause action');
    try {
      this.pause();
    } catch (error) {
      this.logger.error('Failed to handle pause action', error as Error);
    }
  }

  private handleStopAction(): void {
    this.logger.debug('AudioManager handling stop action');
    try {
      this.stop();
    } catch (error) {
      this.logger.error('Failed to handle stop action', error as Error);
    }
  }

  private handleSeekAction(time: number): void {
    this.logger.debug(`AudioManager handling seek action to: ${time}s`);
    try {
      this.seek(time);
    } catch (error) {
      this.logger.error('Failed to handle seek action', error as Error);
    }
  }

  private handleVolumeAction(volume: number): void {
    this.logger.debug(`AudioManager handling volume action to: ${volume}`);
    try {
      this.setVolume(volume);
    } catch (error) {
      this.logger.error('Failed to handle volume action', error as Error);
    }
  }

  private handlePlaybackEnd(): void {
    this.stopInternal();
    this.logger.debug('Playback completed');
    
    // Dispatch stop action to update state
    this.stateManager.dispatch({
      type: ActionTypes.AUDIO_STOP,
      payload: { timestamp: Date.now() },
    });
  }

  public isInitialized(): boolean {
    return this._isInitialized;
  }

  public isDisposed(): boolean {
    return this._isDisposed;
  }

  public dispose(): void {
    if (this._isDisposed) return;

    this.logger.info('Disposing AudioManager...');

    // Stop playback
    this.stop();

    // Disconnect audio nodes
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    this.audioBuffer = null;

    this._isDisposed = true;
    this.logger.info('AudioManager disposed');
  }
}
/**
 * Audio-related type definitions for the Music Visualizer
 */

export interface AudioFile {
  id: string;
  name: string;
  path: string;
  size: number;
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

export interface FrequencyData {
  frequencies: Float32Array;
  magnitudes: Float32Array;
  phases: Float32Array;
  bins: number;
  sampleRate: number;
  timestamp: number;
}

export interface BeatData {
  tempo: number;
  beats: BeatEvent[];
  confidence: number;
  timestamp: number;
}

export interface BeatEvent {
  time: number;
  strength: number;
  type: 'kick' | 'snare' | 'hihat' | 'other';
}

export interface InstrumentData {
  type: InstrumentType;
  confidence: number;
  frequency: number;
  amplitude: number;
  timestamp: number;
}

export type InstrumentType = 
  | 'piano'
  | 'guitar'
  | 'bass'
  | 'drums'
  | 'violin'
  | 'saxophone'
  | 'trumpet'
  | 'synthesizer'
  | 'vocals'
  | 'unknown';

export interface AudioFeatures {
  frequencyData: FrequencyData;
  beatData: BeatData;
  instrumentData: InstrumentData[];
  spectralCentroid: number;
  spectralRolloff: number;
  zeroCrossingRate: number;
  mfcc: Float32Array;
  chroma: Float32Array;
  timestamp: number;
}

export interface AudioState {
  currentFile: AudioFile | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  frequencyData: FrequencyData | null;
  instrumentData: InstrumentData[];
  beatData: BeatData | null;
  audioFeatures: AudioFeatures | null;
}

export type PlaybackAction = 'play' | 'pause' | 'stop' | 'seek';

export interface PlaybackCommand {
  action: PlaybackAction;
  time?: number;
  volume?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AudioProcessingConfig {
  fftSize: 2048 | 4096 | 8192;
  hopSize: number;
  windowFunction: 'hamming' | 'hanning' | 'blackman';
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
}
/**
 * Centralized type exports for the Music Visualizer application
 */

// Audio types
export * from './audio';

// Visual types
export * from './visual';

// State management types
export * from './state';

// Import types for internal use in this file
import type { AudioProcessingConfig } from './audio';
import type { VisualizationConfig, PerformanceMetrics } from './visual';
import type { ThemeType, PanelType } from './state';

// Common utility types
export interface Disposable {
  dispose(): void;
}

export interface Initializable {
  initialize(): Promise<void>;
}

export interface Configurable<T> {
  configure(config: T): void;
  getConfig(): T;
}

export interface EventEmitter<T extends Record<string, (...args: any[]) => any> = Record<string, (...args: any[]) => any>> {
  on<K extends keyof T>(event: K, listener: T[K]): void;
  off<K extends keyof T>(event: K, listener: T[K]): void;
  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): boolean;
}

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error, ...args: any[]): void;
}

export interface ServiceInterface extends Disposable, Initializable {
  isInitialized(): boolean;
  isDisposed(): boolean;
}

// IPC Communication types
export interface IPCMessage<T = any> {
  channel: string;
  data: T;
  id?: string;
  timestamp: number;
}

export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  id?: string;
  timestamp: number;
}

// File handling types
export interface FileDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: FileFilter[];
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
}

export interface FileFilter {
  name: string;
  extensions: string[];
}

// Error handling types
export interface AppError extends Error {
  code: string;
  category: 'audio' | 'visual' | 'file' | 'system' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any> | undefined;
  timestamp: number;
}

export class MusicVisualizerError extends Error implements AppError {
  public readonly code: string;
  public readonly category: AppError['category'];
  public readonly severity: AppError['severity'];
  public readonly context: Record<string, any> | undefined;
  public readonly timestamp: number;

  constructor(
    message: string,
    code: string,
    category: AppError['category'],
    severity: AppError['severity'] = 'medium',
    context: Record<string, any> | undefined = undefined
  ) {
    super(message);
    this.name = 'MusicVisualizerError';
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.context = context;
    this.timestamp = Date.now();
  }
}

// Configuration types
export interface AppConfig {
  audio: AudioProcessingConfig;
  visual: VisualizationConfig;
  performance: PerformanceConfig;
  ui: UIConfig;
}

export interface PerformanceConfig {
  targetFPS: number;
  maxParticles: number;
  enableAdaptiveQuality: boolean;
  memoryLimit: number;
  gpuMemoryLimit: number;
}

export interface UIConfig {
  theme: ThemeType;
  defaultPanel: PanelType;
  enableAnimations: boolean;
  autoHideControls: boolean;
  notifications: {
    duration: number;
    maxCount: number;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
}
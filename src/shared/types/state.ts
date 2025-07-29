/**
 * Application state management type definitions
 */

import { AudioState } from './audio';
import { VisualState } from './visual';

export interface AppState {
  audio: AudioState;
  visual: VisualState;
  ui: UIState;
  playback: PlaybackState;
}

export interface UIState {
  isFileDialogOpen: boolean;
  isSettingsOpen: boolean;
  isVisualizationFullscreen: boolean;
  currentPanel: PanelType;
  theme: ThemeType;
  notifications: Notification[];
}

export type PanelType = 'audio' | 'visual' | 'settings' | 'help';
export type ThemeType = 'dark' | 'cosmic' | 'ethereal';

export interface PlaybackState {
  status: PlaybackStatus;
  position: number;
  loop: boolean;
  shuffle: boolean;
  playlist: string[];
  currentIndex: number;
}

export type PlaybackStatus = 'stopped' | 'playing' | 'paused' | 'loading' | 'error';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: number;
  autoHide: boolean;
  duration?: number;
}

export interface Action {
  type: string;
  payload?: any;
  meta?: {
    timestamp: number;
    source: string;
  };
}

export type StateListener = (state: AppState) => void;
export type Unsubscribe = () => void;

export interface StateManager {
  getState(): AppState;
  setState(partialState: Partial<AppState>): void;
  subscribe(listener: StateListener): Unsubscribe;
  dispatch(action: Action): void;
  reset(): void;
}

// Action Types
export const ActionTypes = {
  // Audio Actions
  AUDIO_FILE_LOAD_START: 'AUDIO_FILE_LOAD_START',
  AUDIO_FILE_LOAD_SUCCESS: 'AUDIO_FILE_LOAD_SUCCESS',
  AUDIO_FILE_LOAD_ERROR: 'AUDIO_FILE_LOAD_ERROR',
  AUDIO_PLAY: 'AUDIO_PLAY',
  AUDIO_PAUSE: 'AUDIO_PAUSE',
  AUDIO_STOP: 'AUDIO_STOP',
  AUDIO_SEEK: 'AUDIO_SEEK',
  AUDIO_VOLUME_CHANGE: 'AUDIO_VOLUME_CHANGE',
  AUDIO_FEATURES_UPDATE: 'AUDIO_FEATURES_UPDATE',

  // Visual Actions
  VISUAL_EFFECT_TOGGLE: 'VISUAL_EFFECT_TOGGLE',
  VISUAL_INTENSITY_CHANGE: 'VISUAL_INTENSITY_CHANGE',
  VISUAL_COLOR_CHANGE: 'VISUAL_COLOR_CHANGE',
  VISUAL_PRESET_LOAD: 'VISUAL_PRESET_LOAD',
  VISUAL_PERFORMANCE_UPDATE: 'VISUAL_PERFORMANCE_UPDATE',
  VISUAL_FULLSCREEN_TOGGLE: 'VISUAL_FULLSCREEN_TOGGLE',

  // UI Actions
  UI_PANEL_CHANGE: 'UI_PANEL_CHANGE',
  UI_THEME_CHANGE: 'UI_THEME_CHANGE',
  UI_NOTIFICATION_ADD: 'UI_NOTIFICATION_ADD',
  UI_NOTIFICATION_REMOVE: 'UI_NOTIFICATION_REMOVE',
  UI_SETTINGS_TOGGLE: 'UI_SETTINGS_TOGGLE',
  UI_FILE_DIALOG_TOGGLE: 'UI_FILE_DIALOG_TOGGLE',

  // Playback Actions
  PLAYBACK_STATUS_CHANGE: 'PLAYBACK_STATUS_CHANGE',
  PLAYBACK_POSITION_UPDATE: 'PLAYBACK_POSITION_UPDATE',
  PLAYBACK_LOOP_TOGGLE: 'PLAYBACK_LOOP_TOGGLE',
  PLAYBACK_SHUFFLE_TOGGLE: 'PLAYBACK_SHUFFLE_TOGGLE',

  // System Actions
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SYSTEM_READY: 'SYSTEM_READY',
  SYSTEM_RESET: 'SYSTEM_RESET',
} as const;

export type ActionType = typeof ActionTypes[keyof typeof ActionTypes];

// Specific Action Interfaces
export interface AudioFileLoadAction extends Action {
  type: typeof ActionTypes.AUDIO_FILE_LOAD_SUCCESS;
  payload: {
    file: AudioFile;
    audioBuffer: AudioBuffer;
  };
}

export interface AudioFeaturesUpdateAction extends Action {
  type: typeof ActionTypes.AUDIO_FEATURES_UPDATE;
  payload: {
    features: AudioFeatures;
  };
}

export interface VisualEffectToggleAction extends Action {
  type: typeof ActionTypes.VISUAL_EFFECT_TOGGLE;
  payload: {
    effectId: string;
    enabled: boolean;
  };
}

export interface NotificationAddAction extends Action {
  type: typeof ActionTypes.UI_NOTIFICATION_ADD;
  payload: Notification;
}

// Helper types for type-safe action dispatching
export type AppAction = 
  | AudioFileLoadAction
  | AudioFeaturesUpdateAction
  | VisualEffectToggleAction
  | NotificationAddAction
  | Action;

// State selectors
export interface StateSelectors {
  getAudioState: (state: AppState) => AudioState;
  getVisualState: (state: AppState) => VisualState;
  getUIState: (state: AppState) => UIState;
  getPlaybackState: (state: AppState) => PlaybackState;
  isPlaying: (state: AppState) => boolean;
  getCurrentFile: (state: AppState) => AudioFile | null;
  getNotifications: (state: AppState) => Notification[];
  getPerformanceMetrics: (state: AppState) => PerformanceMetrics;
}
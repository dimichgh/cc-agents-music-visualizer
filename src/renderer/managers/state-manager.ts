/**
 * Central State Manager for the Music Visualizer application
 */

import { 
  AppState, 
  StateManager as IStateManager, 
  Action, 
  StateListener, 
  Unsubscribe,
  AudioState,
  VisualState,
  UIState,
  PlaybackState,
  ActionTypes,
  ThemeType,
  PanelType,
  PlaybackStatus,
  PerformanceMetrics
} from '@/shared/types';
import { Logger, AppLogger } from '@/shared/utils/logger';

export class StateManager implements IStateManager {
  private state: AppState;
  private listeners: Set<StateListener> = new Set();
  private logger: Logger;

  constructor() {
    this.logger = new AppLogger('StateManager');
    this.state = this.createInitialState();
    
    // Log state changes in development
    if (process.env['NODE_ENV'] === 'development') {
      this.subscribe((state) => {
        this.logger.debug('State updated:', state);
      });
    }
  }

  private createInitialState(): AppState {
    const initialAudioState: AudioState = {
      currentFile: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      frequencyData: null,
      instrumentData: [],
      beatData: null,
      audioFeatures: null,
    };

    const initialVisualState: VisualState = {
      currentVisualization: 'cosmic',
      effects: [],
      particles: [],
      colors: {
        primary: [],
        secondary: [],
        accent: [],
        background: { r: 0.04, g: 0.04, b: 0.04 } as any,
        current: [],
      },
      intensity: 0.5,
      performance: this.createInitialPerformanceMetrics(),
    };

    const initialUIState: UIState = {
      isFileDialogOpen: false,
      isSettingsOpen: false,
      isVisualizationFullscreen: false,
      currentPanel: 'audio',
      theme: 'cosmic',
      notifications: [],
    };

    const initialPlaybackState: PlaybackState = {
      status: 'stopped',
      position: 0,
      loop: false,
      shuffle: false,
      playlist: [],
      currentIndex: -1,
    };

    return {
      audio: initialAudioState,
      visual: initialVisualState,
      ui: initialUIState,
      playback: initialPlaybackState,
    };
  }

  private createInitialPerformanceMetrics(): PerformanceMetrics {
    return {
      fps: 0,
      frameTime: 0,
      renderTime: 0,
      particleCount: 0,
      memoryUsage: 0,
      gpuMemoryUsage: 0,
      drawCalls: 0,
    };
  }

  public getState(): AppState {
    // Return a deep copy to prevent external mutations
    return JSON.parse(JSON.stringify(this.state));
  }

  public setState(partialState: Partial<AppState>): void {
    const prevState = this.state;
    
    // Merge the partial state with the current state
    this.state = {
      ...prevState,
      ...partialState,
      // Deep merge nested objects
      audio: partialState.audio ? { ...prevState.audio, ...partialState.audio } : prevState.audio,
      visual: partialState.visual ? { ...prevState.visual, ...partialState.visual } : prevState.visual,
      ui: partialState.ui ? { ...prevState.ui, ...partialState.ui } : prevState.ui,
      playback: partialState.playback ? { ...prevState.playback, ...partialState.playback } : prevState.playback,
    };

    // Notify all listeners
    this.notifyListeners();
  }

  public subscribe(listener: StateListener): Unsubscribe {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  public dispatch(action: Action): void {
    this.logger.debug(`Dispatching action: ${action.type}`, action);

    // Add metadata if not present
    if (!action.meta) {
      action.meta = {
        timestamp: Date.now(),
        source: 'renderer',
      };
    }

    // Process the action and update state accordingly
    this.processAction(action);
  }

  private processAction(action: Action): void {
    switch (action.type) {
      // Audio actions
      case ActionTypes.AUDIO_FILE_LOAD_START:
        this.setState({
          audio: { ...this.state.audio, currentFile: null },
          playback: { ...this.state.playback, status: 'loading' },
        });
        break;

      case ActionTypes.AUDIO_FILE_LOAD_SUCCESS:
        this.setState({
          audio: { 
            ...this.state.audio, 
            currentFile: action.payload.file,
            duration: action.payload.file.duration,
          },
          playback: { ...this.state.playback, status: 'stopped' },
        });
        break;

      case ActionTypes.AUDIO_FILE_LOAD_ERROR:
        this.setState({
          audio: { ...this.state.audio, currentFile: null },
          playback: { ...this.state.playback, status: 'error' },
        });
        this.addNotification('error', 'Audio Load Error', action.payload.error);
        break;

      case ActionTypes.AUDIO_PLAY:
        this.setState({
          audio: { ...this.state.audio, isPlaying: true },
          playback: { ...this.state.playback, status: 'playing' },
        });
        break;

      case ActionTypes.AUDIO_PAUSE:
        this.setState({
          audio: { ...this.state.audio, isPlaying: false },
          playback: { ...this.state.playback, status: 'paused' },
        });
        break;

      case ActionTypes.AUDIO_STOP:
        this.setState({
          audio: { ...this.state.audio, isPlaying: false, currentTime: 0 },
          playback: { ...this.state.playback, status: 'stopped', position: 0 },
        });
        break;

      case ActionTypes.AUDIO_SEEK:
        this.setState({
          audio: { ...this.state.audio, currentTime: action.payload.time },
          playback: { ...this.state.playback, position: action.payload.time },
        });
        break;

      case ActionTypes.AUDIO_VOLUME_CHANGE:
        this.setState({
          audio: { ...this.state.audio, volume: action.payload.volume },
        });
        break;

      case ActionTypes.AUDIO_FEATURES_UPDATE:
        this.setState({
          audio: {
            ...this.state.audio,
            audioFeatures: action.payload.features,
            frequencyData: action.payload.features.frequencyData,
            instrumentData: action.payload.features.instrumentData,
            beatData: action.payload.features.beatData,
          },
        });
        break;

      // Visual actions
      case ActionTypes.VISUAL_EFFECT_TOGGLE:
        const effects = this.state.visual.effects.map(effect =>
          effect.id === action.payload.effectId
            ? { ...effect, enabled: action.payload.enabled }
            : effect
        );
        this.setState({
          visual: { ...this.state.visual, effects },
        });
        break;

      case ActionTypes.VISUAL_INTENSITY_CHANGE:
        this.setState({
          visual: { ...this.state.visual, intensity: action.payload.intensity },
        });
        break;

      case ActionTypes.VISUAL_PERFORMANCE_UPDATE:
        this.setState({
          visual: { ...this.state.visual, performance: action.payload.metrics },
        });
        break;

      case ActionTypes.VISUAL_FULLSCREEN_TOGGLE:
        this.setState({
          ui: { ...this.state.ui, isVisualizationFullscreen: action.payload.fullscreen },
        });
        break;

      // UI actions
      case ActionTypes.UI_PANEL_CHANGE:
        this.setState({
          ui: { ...this.state.ui, currentPanel: action.payload.panel },
        });
        break;

      case ActionTypes.UI_THEME_CHANGE:
        this.setState({
          ui: { ...this.state.ui, theme: action.payload.theme },
        });
        break;

      case ActionTypes.UI_NOTIFICATION_ADD:
        const notifications = [...this.state.ui.notifications, action.payload];
        this.setState({
          ui: { ...this.state.ui, notifications },
        });
        break;

      case ActionTypes.UI_NOTIFICATION_REMOVE:
        const filteredNotifications = this.state.ui.notifications.filter(
          n => n.id !== action.payload.id
        );
        this.setState({
          ui: { ...this.state.ui, notifications: filteredNotifications },
        });
        break;

      case ActionTypes.UI_SETTINGS_TOGGLE:
        this.setState({
          ui: { ...this.state.ui, isSettingsOpen: action.payload.open },
        });
        break;

      case ActionTypes.UI_FILE_DIALOG_TOGGLE:
        this.setState({
          ui: { ...this.state.ui, isFileDialogOpen: action.payload.open },
        });
        break;

      // Playback actions
      case ActionTypes.PLAYBACK_STATUS_CHANGE:
        this.setState({
          playback: { ...this.state.playback, status: action.payload.status },
        });
        break;

      case ActionTypes.PLAYBACK_POSITION_UPDATE:
        this.setState({
          audio: { ...this.state.audio, currentTime: action.payload.position },
          playback: { ...this.state.playback, position: action.payload.position },
        });
        break;

      case ActionTypes.PLAYBACK_LOOP_TOGGLE:
        this.setState({
          playback: { ...this.state.playback, loop: action.payload.loop },
        });
        break;

      case ActionTypes.PLAYBACK_SHUFFLE_TOGGLE:
        this.setState({
          playback: { ...this.state.playback, shuffle: action.payload.shuffle },
        });
        break;

      // System actions
      case ActionTypes.SYSTEM_READY:
        this.logger.info('System is ready');
        // Add any system ready state updates here if needed
        break;

      case ActionTypes.SYSTEM_ERROR:
        this.addNotification('error', 'System Error', action.payload.message);
        break;

      case ActionTypes.SYSTEM_RESET:
        this.state = this.createInitialState();
        this.notifyListeners();
        break;

      default:
        this.logger.warn(`Unknown action type: ${action.type}`);
    }
  }

  private addNotification(type: 'info' | 'warning' | 'error' | 'success', title: string, message: string): void {
    const notification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      autoHide: type !== 'error',
      ...(type === 'error' ? {} : { duration: 5000 }),
    };

    this.setState({
      ui: {
        ...this.state.ui,
        notifications: [...this.state.ui.notifications, notification as any],
      },
    });

    // Auto-remove notification if autoHide is enabled
    if (notification.autoHide && notification.duration) {
      setTimeout(() => {
        this.dispatch({
          type: ActionTypes.UI_NOTIFICATION_REMOVE,
          payload: { id: notification.id },
        });
      }, notification.duration);
    }
  }

  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(currentState);
      } catch (error) {
        this.logger.error('Error in state listener', error as Error);
      }
    });
  }

  public reset(): void {
    this.logger.info('Resetting state to initial values');
    this.state = this.createInitialState();
    this.notifyListeners();
  }

  // Utility methods for common state operations
  public updateAudioTime(currentTime: number): void {
    this.setState({
      audio: { ...this.state.audio, currentTime },
      playback: { ...this.state.playback, position: currentTime },
    });
  }

  public updatePerformanceMetrics(metrics: Partial<PerformanceMetrics>): void {
    this.setState({
      visual: {
        ...this.state.visual,
        performance: { ...this.state.visual.performance, ...metrics },
      },
    });
  }

  public setPlaybackStatus(status: PlaybackStatus): void {
    this.setState({
      playback: { ...this.state.playback, status },
      audio: { ...this.state.audio, isPlaying: status === 'playing' },
    });
  }

  public getCurrentPanel(): PanelType {
    return this.state.ui.currentPanel;
  }

  public getTheme(): ThemeType {
    return this.state.ui.theme;
  }

  public isPlaying(): boolean {
    return this.state.audio.isPlaying;
  }

  public getVolume(): number {
    return this.state.audio.volume;
  }

  public getCurrentFile(): any {
    return this.state.audio.currentFile;
  }
}
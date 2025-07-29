/**
 * UI Manager - Handles user interface interactions and state synchronization
 */

import { 
  ServiceInterface, 
  Logger, 
  StateManager,
  ActionTypes,
  MusicVisualizerError 
} from '@/shared/types';
import { stateSelectors } from './state-selectors';

export class UIManager implements ServiceInterface {
  private stateManager: StateManager;
  private logger: Logger;

  private isInitialized = false;
  private isDisposed = false;

  // UI elements
  private elements: Record<string, HTMLElement> = {};
  private isFullscreen = false;
  private hideControlsTimeout: number | null = null;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
    this.logger = new Logger('UIManager');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('UIManager already initialized');
      return;
    }

    this.logger.info('Initializing UIManager...');

    try {
      // Get UI elements
      this.getUIElements();

      // Set up event listeners
      this.setupEventListeners();

      // Subscribe to state changes
      this.subscribeToState();

      // Initialize UI state
      this.updateUI();

      this.isInitialized = true;
      this.logger.info('UIManager initialized successfully');
    } catch (error) {
      throw new MusicVisualizerError(
        'Failed to initialize UI manager',
        'UI_MANAGER_INIT_FAILED',
        'system',
        'high',
        { error: (error as Error).message }
      );
    }
  }

  private getUIElements(): void {
    const elementIds = [
      'open-file',
      'play-pause',
      'stop',
      'fullscreen',
      'current-time',
      'duration',
      'progress-bar',
      'progress-fill',
      'volume-slider',
      'intensity-slider',
      'file-info',
      'control-panel',
    ];

    elementIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        this.elements[id] = element;
      } else {
        this.logger.warn(`UI element not found: ${id}`);
      }
    });
  }

  private setupEventListeners(): void {
    // File operations
    if (this.elements['open-file']) {
      this.elements['open-file'].addEventListener('click', this.handleOpenFile.bind(this));
    }

    // Playback controls
    if (this.elements['play-pause']) {
      this.elements['play-pause'].addEventListener('click', this.handlePlayPause.bind(this));
    }

    if (this.elements['stop']) {
      this.elements['stop'].addEventListener('click', this.handleStop.bind(this));
    }

    if (this.elements['fullscreen']) {
      this.elements['fullscreen'].addEventListener('click', this.handleFullscreen.bind(this));
    }

    // Progress bar
    if (this.elements['progress-bar']) {
      this.elements['progress-bar'].addEventListener('click', this.handleProgressClick.bind(this));
    }

    // Volume control
    if (this.elements['volume-slider']) {
      this.elements['volume-slider'].addEventListener('input', this.handleVolumeChange.bind(this));
    }

    // Intensity control
    if (this.elements['intensity-slider']) {
      this.elements['intensity-slider'].addEventListener('input', this.handleIntensityChange.bind(this));
    }

    // Mouse movement for auto-hide controls
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));

    this.logger.debug('Event listeners set up');
  }

  private subscribeToState(): void {
    this.stateManager.subscribe((state) => {
      this.updateUI();
    });
  }

  private async handleOpenFile(): Promise<void> {
    try {
      const response = await window.electronAPI.file.openDialog();
      if (response.success && response.data) {
        // The audio manager will handle the file loading through IPC events
        this.logger.debug('File dialog opened successfully');
      }
    } catch (error) {
      this.logger.error('Failed to open file dialog', error as Error);
    }
  }

  private handlePlayPause(): void {
    const state = this.stateManager.getState();
    const isPlaying = stateSelectors.isPlaying(state);
    const hasFile = stateSelectors.hasAudioFile(state);

    if (!hasFile) {
      this.handleOpenFile();
      return;
    }

    if (isPlaying) {
      this.stateManager.dispatch({
        type: ActionTypes.AUDIO_PAUSE,
        payload: { timestamp: Date.now() },
      });
    } else {
      this.stateManager.dispatch({
        type: ActionTypes.AUDIO_PLAY,
        payload: { timestamp: Date.now() },
      });
    }
  }

  private handleStop(): void {
    this.stateManager.dispatch({
      type: ActionTypes.AUDIO_STOP,
      payload: { timestamp: Date.now() },
    });
  }

  private async handleFullscreen(): Promise<void> {
    try {
      const response = await window.electronAPI.window.toggleFullscreen();
      if (response.success) {
        this.setFullscreen(response.data || false);
      }
    } catch (error) {
      this.logger.error('Failed to toggle fullscreen', error as Error);
    }
  }

  private handleProgressClick(event: MouseEvent): void {
    const progressBar = this.elements['progress-bar'];
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    const state = this.stateManager.getState();
    const duration = stateSelectors.getDuration(state);
    const seekTime = percentage * duration;

    this.stateManager.dispatch({
      type: ActionTypes.AUDIO_SEEK,
      payload: { time: seekTime },
    });
  }

  private handleVolumeChange(event: Event): void {
    const slider = event.target as HTMLInputElement;
    const volume = parseFloat(slider.value);

    this.stateManager.dispatch({
      type: ActionTypes.AUDIO_VOLUME_CHANGE,
      payload: { volume },
    });
  }

  private handleIntensityChange(event: Event): void {
    const slider = event.target as HTMLInputElement;
    const intensity = parseFloat(slider.value);

    this.stateManager.dispatch({
      type: ActionTypes.VISUAL_INTENSITY_CHANGE,
      payload: { intensity },
    });
  }

  private handleMouseMove(): void {
    this.showControls();
    this.scheduleHideControls();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.handlePlayPause();
        break;
      
      case 'KeyF':
        event.preventDefault();
        this.handleFullscreen();
        break;
      
      case 'KeyO':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.handleOpenFile();
        }
        break;
      
      case 'Escape':
        if (this.isFullscreen) {
          this.handleFullscreen();
        }
        break;
    }
  }

  private showControls(): void {
    const controlPanel = this.elements['control-panel'];
    if (controlPanel && this.isFullscreen) {
      controlPanel.classList.remove('hidden');
    }
  }

  private hideControls(): void {
    const controlPanel = this.elements['control-panel'];
    if (controlPanel && this.isFullscreen) {
      controlPanel.classList.add('hidden');
    }
  }

  private scheduleHideControls(): void {
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout);
    }
    
    if (this.isFullscreen) {
      this.hideControlsTimeout = window.setTimeout(() => {
        this.hideControls();
      }, 3000); // Hide after 3 seconds of inactivity
    }
  }

  setFullscreen(fullscreen: boolean): void {
    this.isFullscreen = fullscreen;
    
    if (fullscreen) {
      document.body.classList.add('fullscreen');
      this.scheduleHideControls();
    } else {
      document.body.classList.remove('fullscreen');
      this.showControls();
      if (this.hideControlsTimeout) {
        clearTimeout(this.hideControlsTimeout);
        this.hideControlsTimeout = null;
      }
    }

    this.stateManager.dispatch({
      type: ActionTypes.VISUAL_FULLSCREEN_TOGGLE,
      payload: { fullscreen },
    });
  }

  update(deltaTime: number): void {
    // Update time-based UI elements
    this.updateTimeDisplay();
    this.updateProgress();
  }

  private updateUI(): void {
    const state = this.stateManager.getState();
    
    // Update file info
    this.updateFileInfo(state);
    
    // Update playback controls
    this.updatePlaybackControls(state);
    
    // Update sliders
    this.updateSliders(state);
  }

  private updateFileInfo(state: any): void {
    const fileInfo = this.elements['file-info'];
    if (!fileInfo) return;

    const currentFile = stateSelectors.getCurrentFile(state);
    if (currentFile) {
      fileInfo.textContent = `${currentFile.name} (${this.formatDuration(currentFile.duration)})`;
    } else {
      fileInfo.textContent = 'No file loaded';
    }
  }

  private updatePlaybackControls(state: any): void {
    const playPauseBtn = this.elements['play-pause'];
    if (!playPauseBtn) return;

    const isPlaying = stateSelectors.isPlaying(state);
    const hasFile = stateSelectors.hasAudioFile(state);
    const isLoading = stateSelectors.isLoading(state);

    if (isLoading) {
      playPauseBtn.textContent = 'Loading...';
      playPauseBtn.setAttribute('disabled', 'true');
    } else if (!hasFile) {
      playPauseBtn.textContent = 'Open File';
      playPauseBtn.removeAttribute('disabled');
    } else {
      playPauseBtn.textContent = isPlaying ? 'Pause' : 'Play';
      playPauseBtn.removeAttribute('disabled');
    }
  }

  private updateSliders(state: any): void {
    const volumeSlider = this.elements['volume-slider'] as HTMLInputElement;
    const intensitySlider = this.elements['intensity-slider'] as HTMLInputElement;

    if (volumeSlider) {
      volumeSlider.value = stateSelectors.getVolume(state).toString();
    }

    if (intensitySlider) {
      intensitySlider.value = stateSelectors.getVisualIntensity(state).toString();
    }
  }

  private updateTimeDisplay(): void {
    const state = this.stateManager.getState();
    const currentTimeEl = this.elements['current-time'];
    const durationEl = this.elements['duration'];

    if (currentTimeEl) {
      currentTimeEl.textContent = stateSelectors.getFormattedCurrentTime(state);
    }

    if (durationEl) {
      durationEl.textContent = stateSelectors.getFormattedDuration(state);
    }
  }

  private updateProgress(): void {
    const state = this.stateManager.getState();
    const progressFill = this.elements['progress-fill'];

    if (progressFill) {
      const progress = stateSelectors.getPlaybackProgress(state);
      progressFill.style.width = `${progress}%`;
    }
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  public isInitialized(): boolean {
    return this.isInitialized;
  }

  public isDisposed(): boolean {
    return this.isDisposed;
  }

  public dispose(): void {
    if (this.isDisposed) return;

    this.logger.info('Disposing UIManager...');

    // Clear timeouts
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout);
    }

    // Remove event listeners would go here
    // (In a real implementation, we'd store references to the handlers)

    this.isDisposed = true;
    this.logger.info('UIManager disposed');
  }
}
/**
 * Main Renderer Process Entry Point
 */

import { Logger, AppLogger } from '@/shared/utils/logger';
import { StateManager } from './managers/state-manager';
import { AudioDecoder } from './services/audio-decoder';
import { FFTAnalyzer } from './services/fft-analyzer';
import { WebGLVisualizationRenderer } from './engine/webgl-renderer';
import { AudioManager } from './managers/audio-manager';
import { VisualizationManager } from './managers/visualization-manager';
import { UIManager } from './managers/ui-manager';
import { ActionTypes } from '@/shared/types';
import { AppLayout } from './components/layout/AppLayout';

class MusicVisualizerApp {
  private logger: Logger;
  private stateManager!: StateManager;
  private audioContext!: AudioContext;
  private audioDecoder!: AudioDecoder;
  private fftAnalyzer!: FFTAnalyzer;
  private renderer!: WebGLVisualizationRenderer;
  private audioManager!: AudioManager;
  private visualizationManager!: VisualizationManager;
  private uiManager!: UIManager;
  private appLayout!: AppLayout;

  private isInitialized = false;
  private canvas: HTMLCanvasElement | null = null;

  constructor() {
    this.logger = new AppLogger('RendererApp');
    // Canvas will be created by AppLayout
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('App already initialized');
      return;
    }

    this.logger.info('Initializing Music Visualizer renderer...');

    try {
      // Show loading indicator
      this.showLoading('Initializing application...');

      // Initialize UI first to get canvas
      await this.initializeUI();

      // Initialize core services
      await this.initializeCore();

      // Initialize managers
      await this.initializeManagers();

      // Connect components
      this.connectComponents();

      // Set up event handlers
      this.setupEventHandlers();

      // Start the main loop
      this.startMainLoop();

      this.isInitialized = true;
      this.hideLoading();
      
      this.logger.info('Music Visualizer renderer initialized successfully');
      
      // Dispatch ready event
      this.stateManager.dispatch({
        type: ActionTypes.SYSTEM_READY,
        payload: { timestamp: Date.now() },
      });

    } catch (error) {
      this.logger.error('Failed to initialize renderer', error as Error);
      this.showError(`Initialization failed: ${(error as Error).message}`);
      throw error;
    }
  }

  private async initializeUI(): Promise<void> {
    // Initialize the app layout which contains all UI components
    this.appLayout = new AppLayout({
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1440,
        wide: 1920
      },
      mobileFirst: true,
      onBreakpointChange: (breakpoint, width) => {
        this.logger.debug(`Breakpoint changed to ${breakpoint} (${width}px)`);
      }
    });

    // Mount the application
    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.appendChild(this.appLayout.element);
    }

    // Get the canvas from the visualization component
    this.canvas = this.appLayout.visualizationCanvas.element.querySelector('canvas') as HTMLCanvasElement;
    
    if (!this.canvas) {
      throw new Error('Visualization canvas not found in AppLayout');
    }

    this.logger.debug('UI initialized');
  }

  private async initializeCore(): Promise<void> {
    // Initialize state management
    this.stateManager = new StateManager();

    // Initialize audio context
    this.audioContext = new AudioContext();
    
    // Initialize audio services
    this.audioDecoder = new AudioDecoder(this.audioContext);
    await this.audioDecoder.initialize();

    this.fftAnalyzer = new FFTAnalyzer(this.audioContext);
    await this.fftAnalyzer.initialize();

    // Initialize rendering engine
    this.renderer = new WebGLVisualizationRenderer(this.canvas!);
    await this.renderer.initialize();

    this.logger.debug('Core services initialized');
  }

  private async initializeManagers(): Promise<void> {
    // Initialize audio manager
    this.audioManager = new AudioManager(
      this.audioContext,
      this.audioDecoder,
      this.fftAnalyzer,
      this.stateManager
    );
    await this.audioManager.initialize();

    // Initialize visualization manager
    this.visualizationManager = new VisualizationManager(
      this.renderer,
      this.stateManager
    );
    await this.visualizationManager.initialize();

    // Initialize UI manager
    this.uiManager = new UIManager(this.stateManager);
    await this.uiManager.initialize();

    this.logger.debug('Managers initialized');
  }

  private connectComponents(): void {
    // Connect audio controls to audio manager for progress updates
    this.appLayout.audioControls.setProgressUpdateCallback(() => {
      return this.audioManager.getCurrentTime();
    });

    // Connect audio controls events to audio manager
    this.appLayout.audioControls.on('play', () => {
      this.stateManager.dispatch({
        type: ActionTypes.AUDIO_PLAY,
        payload: { timestamp: Date.now() }
      });
    });

    this.appLayout.audioControls.on('pause', () => {
      this.stateManager.dispatch({
        type: ActionTypes.AUDIO_PAUSE,
        payload: { timestamp: Date.now() }
      });
    });

    this.appLayout.audioControls.on('stop', () => {
      this.stateManager.dispatch({
        type: ActionTypes.AUDIO_STOP,
        payload: { timestamp: Date.now() }
      });
    });

    this.appLayout.audioControls.on('seek', (time: number) => {
      this.stateManager.dispatch({
        type: ActionTypes.AUDIO_SEEK,
        payload: { time }
      });
    });

    this.appLayout.audioControls.on('volumeChange', (volume: number) => {
      this.stateManager.dispatch({
        type: ActionTypes.AUDIO_VOLUME_CHANGE,
        payload: { volume }
      });
    });

    // Connect file manager to audio manager
    this.appLayout.fileManager.on('fileSelect', (files: any[]) => {
      if (files.length > 0) {
        const file = files[0];
        this.stateManager.dispatch({
          type: ActionTypes.AUDIO_FILE_LOAD_REQUEST,
          payload: { file }
        });
      }
    });

    // Connect visualization canvas to receive audio data
    this.appLayout.on('fileSelected', (file: any) => {
      this.appLayout.audioControls.setFileName(file.name);
    });

    // Connect settings changes to managers
    this.appLayout.on('settingChange', ({ settingId, value, groupId }: any) => {
      if (settingId === 'energy-sensitivity') {
        this.visualizationManager.setIntensity(value);
        this.stateManager.dispatch({
          type: ActionTypes.VISUAL_INTENSITY_CHANGE,
          payload: { intensity: value }
        });
      }
    });

    this.logger.debug('Components connected');
  }

  private setupEventHandlers(): void {
    // Window events
    window.addEventListener('resize', this.handleResize.bind(this));
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    // Audio context state changes
    this.audioContext.addEventListener('statechange', () => {
      this.logger.debug(`Audio context state: ${this.audioContext.state}`);
    });

    // Handle visibility changes for performance optimization
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.logger.debug('App hidden - reducing performance');
        // Reduce frame rate or pause rendering
      } else {
        this.logger.debug('App visible - resuming normal performance');
      }
    });

    // IPC event handlers
    if (window.electronAPI) {
      // File selection from menu
      window.electronAPI.on.fileSelected((file) => {
        this.audioManager.loadAudioFile(file);
      });

      // Window events
      window.electronAPI.on.windowFocus((focused) => {
        this.logger.debug(`Window focus: ${focused}`);
      });

      window.electronAPI.on.windowResize((bounds) => {
        this.handleResize();
      });

      window.electronAPI.on.fullscreenChange((isFullscreen) => {
        this.uiManager.setFullscreen(isFullscreen);
      });
    }

    this.logger.debug('Event handlers set up');
  }

  private startMainLoop(): void {
    let lastTime = 0;
    
    const animate = (currentTime: number) => {
      if (!this.isInitialized) return;

      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      try {
        // Update audio analysis
        const audioFeatures = this.audioManager.updateAnalysis();

        // Update visualizations
        if (audioFeatures) {
          this.visualizationManager.update(deltaTime, audioFeatures);

          // Send audio data to visualization canvas
          this.appLayout.visualizationCanvas.updateAudioData(
            audioFeatures.frequencyData.amplitude,
            audioFeatures.frequencyData.frequencies
          );

          // Render frame
          this.renderer.render(deltaTime, audioFeatures);
        }

        // Update UI
        this.uiManager.update(deltaTime);

        // Update performance metrics
        const performanceMetrics = this.renderer.getPerformanceMetrics();
        this.stateManager.updatePerformanceMetrics(performanceMetrics);

      } catch (error) {
        this.logger.error('Error in main loop', error as Error);
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    this.logger.debug('Main loop started');
  }

  private handleResize(): void {
    if (!this.canvas || !this.renderer || !this.appLayout) return;

    // Trigger resize on AppLayout which will handle canvas resizing
    const rect = this.canvas.getBoundingClientRect();
    this.appLayout.visualizationCanvas.resize(rect.width, rect.height);
    this.renderer.resize(rect.width, rect.height);
  }

  private handleBeforeUnload(): void {
    this.logger.info('App unloading, cleaning up...');
    this.dispose();
  }

  private showLoading(message: string): void {
    const loading = document.getElementById('app-loading');
    if (loading) {
      loading.style.display = 'flex';
      const messageEl = loading.querySelector('.loading-message');
      if (messageEl) {
        messageEl.textContent = message;
      }
    }
  }

  private hideLoading(): void {
    const loading = document.getElementById('app-loading');
    const mainUI = document.getElementById('main-ui');
    
    if (loading) {
      // Fade out loading screen
      loading.style.opacity = '0';
      loading.style.transition = 'opacity 0.5s ease-out';
      
      setTimeout(() => {
        loading.style.display = 'none';
      }, 500);
    }
    
    if (mainUI) {
      // Show main UI with fade in
      mainUI.style.display = 'block';
      mainUI.style.opacity = '0';
      mainUI.style.transition = 'opacity 0.5s ease-in';
      
      // Force a reflow to ensure the display change takes effect
      mainUI.offsetHeight;
      
      setTimeout(() => {
        mainUI.style.opacity = '1';
      }, 100);
    }
    
    this.logger.info('UI transition: Loading screen hidden, main UI shown');
  }

  private showError(message: string): void {
    const loading = document.getElementById('app-loading');
    const errorScreen = document.getElementById('app-error');
    const errorMessage = errorScreen?.querySelector('.error-message');
    
    // Hide loading screen
    if (loading) {
      loading.style.display = 'none';
    }
    
    // Show error screen
    if (errorScreen) {
      errorScreen.style.display = 'flex';
      if (errorMessage) {
        errorMessage.textContent = message;
      }
    }
    
    // Set up reload button
    const reloadButton = document.getElementById('reload-button');
    if (reloadButton) {
      reloadButton.addEventListener('click', () => {
        window.location.reload();
      });
    }
    
    this.logger.error(`Showing error screen: ${message}`);
  }

  private dispose(): void {
    this.logger.info('Disposing renderer app...');

    try {
      // Dispose managers
      this.uiManager?.dispose();
      this.visualizationManager?.dispose();
      this.audioManager?.dispose();

      // Dispose UI
      this.appLayout?.destroy();

      // Dispose core services
      this.renderer?.dispose();
      this.fftAnalyzer?.dispose();
      this.audioDecoder?.dispose();

      // Close audio context
      if (this.audioContext?.state !== 'closed') {
        this.audioContext?.close();
      }

    } catch (error) {
      this.logger.error('Error during disposal', error as Error);
    }

    this.logger.info('Renderer app disposed');
  }
}

// Initialize the application
const app = new MusicVisualizerApp();

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.initialize().catch(error => {
      console.error('Failed to initialize app:', error);
    });
  });
} else {
  app.initialize().catch(error => {
    console.error('Failed to initialize app:', error);
  });
}

// Handle uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
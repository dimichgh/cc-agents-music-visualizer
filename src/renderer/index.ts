/**
 * Main Renderer Process Entry Point
 */

import { Logger } from '@/shared/utils/logger';
import { StateManager } from './managers/state-manager';
import { AudioDecoder } from './services/audio-decoder';
import { FFTAnalyzer } from './services/fft-analyzer';
import { WebGLVisualizationRenderer } from './engine/webgl-renderer';
import { AudioManager } from './managers/audio-manager';
import { VisualizationManager } from './managers/visualization-manager';
import { UIManager } from './managers/ui-manager';
import { ActionTypes } from '@/shared/types';

class MusicVisualizerApp {
  private logger: Logger;
  private stateManager: StateManager;
  private audioContext: AudioContext;
  private audioDecoder: AudioDecoder;
  private fftAnalyzer: FFTAnalyzer;
  private renderer: WebGLVisualizationRenderer;
  private audioManager: AudioManager;
  private visualizationManager: VisualizationManager;
  private uiManager: UIManager;

  private isInitialized = false;
  private canvas: HTMLCanvasElement;

  constructor() {
    this.logger = new Logger('RendererApp');
    this.canvas = document.getElementById('visualization-canvas') as HTMLCanvasElement;
    
    if (!this.canvas) {
      throw new Error('Visualization canvas not found');
    }
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

      // Initialize core services
      await this.initializeCore();

      // Initialize managers
      await this.initializeManagers();

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
    this.renderer = new WebGLVisualizationRenderer(this.canvas);
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
        this.visualizationManager.update(deltaTime, audioFeatures);

        // Render frame
        this.renderer.render(deltaTime, audioFeatures);

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
    if (!this.canvas || !this.renderer) return;

    const rect = this.canvas.getBoundingClientRect();
    this.renderer.resize(rect.width, rect.height);
  }

  private handleBeforeUnload(): void {
    this.logger.info('App unloading, cleaning up...');
    this.dispose();
  }

  private showLoading(message: string): void {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.remove('hidden');
      const messageEl = loading.querySelector('div:last-child');
      if (messageEl) {
        messageEl.textContent = message;
      }
    }
  }

  private hideLoading(): void {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
    }
  }

  private showError(message: string): void {
    const errorEl = document.getElementById('error-message');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('show');
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        errorEl.classList.remove('show');
      }, 5000);
    }
  }

  private dispose(): void {
    this.logger.info('Disposing renderer app...');

    try {
      // Dispose managers
      this.uiManager?.dispose();
      this.visualizationManager?.dispose();
      this.audioManager?.dispose();

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
// Music Visualizer - Main Application Entry Point

import { AppLayout } from './components/layout/AppLayout';
import { LoadingOverlay } from './components/ui/LoadingState';
import { ErrorState } from './components/ui/ErrorState';
import { LoadingOptions } from './types/ui-types';

class CosmicMusicVisualizer {
  private _appLayout: AppLayout | null = null;
  private _loadingOverlay: LoadingOverlay | null = null;
  private _errorState: ErrorState | null = null;
  private _initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('🌌 Initializing Cosmic Music Visualizer...');
      
      // Show loading screen
      this.showLoading('Initializing cosmic engine...', 0);
      
      // Initialize application components
      await this.initializeApp();
      
      // Hide loading screen
      this.hideLoading();
      
      console.log('✨ Cosmic Music Visualizer initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Cosmic Music Visualizer:', error);
      this.showError(error as Error);
    }
  }

  private async initializeApp(): Promise<void> {
    // Update loading progress
    this.updateLoadingProgress('Loading cosmic theme...', 20);
    await this.delay(200);

    // Initialize theme system
    this.initializeTheme();

    // Update loading progress
    this.updateLoadingProgress('Preparing audio engine...', 40);
    await this.delay(300);

    // Initialize audio context (requires user interaction)
    await this.initializeAudioSystem();

    // Update loading progress
    this.updateLoadingProgress('Starting visualization engine...', 60);
    await this.delay(400);

    // Initialize WebGL and Three.js
    await this.initializeVisualization();

    // Update loading progress
    this.updateLoadingProgress('Finalizing cosmic interface...', 80);
    await this.delay(300);

    // Create main application layout
    this._appLayout = new AppLayout({
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1440,
        wide: 1920
      },
      mobileFirst: true,
      onBreakpointChange: (breakpoint, width) => {
        console.log(`📱 Breakpoint changed to ${breakpoint} (${width}px)`);
        this.announceToScreenReader(`Layout changed to ${breakpoint} view`);
      }
    });

    // Setup event listeners
    this.setupEventListeners();

    // Mount the application
    this.mountApplication();

    // Update loading progress
    this.updateLoadingProgress('Ready for cosmic exploration!', 100);
    await this.delay(500);

    this._initialized = true;
  }

  private initializeTheme(): void {
    // Detect user preferences
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Apply initial theme
    let theme = 'cosmic';
    if (prefersHighContrast) {
      theme = 'cosmic-high-contrast';
    } else if (prefersDark) {
      theme = 'cosmic-dark';
    }

    document.documentElement.setAttribute('data-theme', theme);

    if (prefersReducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    }

    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!prefersHighContrast) {
        const newTheme = e.matches ? 'cosmic-dark' : 'cosmic';
        document.documentElement.setAttribute('data-theme', newTheme);
        this.announceToScreenReader(`Theme changed to ${newTheme.replace('-', ' ')}`);
      }
    });

    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      const newTheme = e.matches ? 'cosmic-high-contrast' : 'cosmic';
      document.documentElement.setAttribute('data-theme', newTheme);
      this.announceToScreenReader(`High contrast mode ${e.matches ? 'enabled' : 'disabled'}`);
    });

    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      document.documentElement.classList.toggle('reduced-motion', e.matches);
      this.announceToScreenReader(`Motion ${e.matches ? 'reduced' : 'restored'}`);
    });
  }

  private async initializeAudioSystem(): Promise<void> {
    // Check for Web Audio API support
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      throw new Error('Web Audio API is not supported in this browser');
    }

    // Audio context will be created when user interacts with the app
    console.log('🎵 Audio system ready for initialization');
  }

  private async initializeVisualization(): Promise<void> {
    // Check for WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      console.warn('⚠️ WebGL not supported, using fallback visualization');
    } else {
      console.log('🎨 WebGL visualization engine ready');
    }

    // Cleanup test canvas
    canvas.remove();
  }

  private setupEventListeners(): void {
    if (!this._appLayout) return;

    // App layout events
    this._appLayout.on('fileSelected', (file) => {
      console.log('📁 File selected:', file);
      this.handleFileSelection(file);
    });

    this._appLayout.on('audioPlay', () => {
      console.log('▶️ Audio play requested');
      this.handleAudioPlay();
    });

    this._appLayout.on('audioPause', () => {
      console.log('⏸️ Audio pause requested');
      this.handleAudioPause();
    });

    this._appLayout.on('audioSeek', (time) => {
      console.log('⏩ Audio seek requested:', time);
      this.handleAudioSeek(time);
    });

    this._appLayout.on('volumeChange', (volume) => {
      console.log('🔊 Volume change requested:', volume);
      this.handleVolumeChange(volume);
    });

    this._appLayout.on('settingChange', ({ settingId, value, groupId }) => {
      console.log(`⚙️ Setting changed: ${groupId}.${settingId} = ${value}`);
      this.handleSettingChange(settingId, value, groupId);
    });

    // Window events
    window.addEventListener('beforeunload', (event) => {
      if (this.hasUnsavedChanges()) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    });

    window.addEventListener('error', (event) => {
      console.error('💥 Unhandled error:', event.error);
      this.handleUnexpectedError(event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('💥 Unhandled promise rejection:', event.reason);
      this.handleUnexpectedError(event.reason);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      this.handleGlobalKeyboard(event);
    });
  }

  private mountApplication(): void {
    const appContainer = document.getElementById('app');
    const loadingScreen = document.getElementById('app-loading');
    
    if (!appContainer || !this._appLayout) {
      throw new Error('Failed to mount application: container or layout not found');
    }

    // Add main content ID for skip link
    this._appLayout.element.id = 'main-content';
    this._appLayout.element.setAttribute('tabindex', '-1');

    appContainer.appendChild(this._appLayout.element);
    
    console.log('🚀 Application mounted successfully');
  }

  // Event handlers
  private async handleFileSelection(file: any): Promise<void> {
    try {
      this.showLoading(`Loading ${file.name}...`, 0);
      
      // Simulate file loading process
      this.updateLoadingProgress('Reading cosmic frequencies...', 25);
      await this.delay(500);
      
      this.updateLoadingProgress('Analyzing audio patterns...', 50);
      await this.delay(800);
      
      this.updateLoadingProgress('Initializing visualization...', 75);
      await this.delay(600);
      
      this.updateLoadingProgress('Ready for cosmic journey!', 100);
      await this.delay(300);
      
      this.hideLoading();
      
      this.announceToScreenReader(`File ${file.name} loaded successfully`);
      
    } catch (error) {
      this.hideLoading();
      console.error('Failed to load file:', error);
      this.showFileError(file.name, error as Error);
    }
  }

  private handleAudioPlay(): void {
    this.announceToScreenReader('Audio playback started');
  }

  private handleAudioPause(): void {
    this.announceToScreenReader('Audio playback paused');
  }

  private handleAudioSeek(time: number): void {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    this.announceToScreenReader(`Seeking to ${minutes}:${seconds.toString().padStart(2, '0')}`);
  }

  private handleVolumeChange(volume: number): void {
    const percentage = Math.round(volume * 100);
    this.announceToScreenReader(`Volume set to ${percentage}%`);
  }

  private handleSettingChange(settingId: string, value: any, groupId: string): void {
    // Handle specific setting changes
    switch (settingId) {
      case 'theme':
        document.documentElement.setAttribute('data-theme', value);
        this.announceToScreenReader(`Theme changed to ${value.replace('-', ' ')}`);
        break;
        
      case 'reduced-motion':
        document.documentElement.classList.toggle('reduced-motion', value);
        this.announceToScreenReader(`Motion ${value ? 'reduced' : 'restored'}`);
        break;
        
      case 'preset':
        this.announceToScreenReader(`Visualization preset changed to ${value.replace('-', ' ')}`);
        break;
    }
  }

  private handleGlobalKeyboard(event: KeyboardEvent): void {
    // Global keyboard shortcuts
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return; // Don't interfere with input fields
    }

    switch (event.key) {
      case '?':
        if (event.shiftKey) {
          this.showKeyboardHelp();
        }
        break;
        
      case 'h':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.showKeyboardHelp();
        }
        break;
    }
  }

  private handleUnexpectedError(error: any): void {
    console.error('Unexpected error occurred:', error);
    
    // Show error toast for minor errors
    if (this._initialized) {
      this.showErrorToast('An unexpected error occurred', error.message);
    } else {
      // Show full error screen during initialization
      this.showError(error);
    }
  }

  // Loading and error management
  private showLoading(message: string, progress?: number): void {
    if (!this._loadingOverlay) {
      const loadingOptions: LoadingOptions = {
        message,
        cancelable: false
      };
      if (progress !== undefined) {
        loadingOptions.progress = progress;
      }
      this._loadingOverlay = new LoadingOverlay(loadingOptions);
      document.body.appendChild(this._loadingOverlay.element);
    } else {
      this._loadingOverlay.setMessage(message);
      if (progress !== undefined) {
        this._loadingOverlay.setProgress(progress);
      }
    }
  }

  private updateLoadingProgress(message: string, progress: number): void {
    if (this._loadingOverlay) {
      this._loadingOverlay.setMessage(message);
      this._loadingOverlay.setProgress(progress);
    }
  }

  private hideLoading(): void {
    if (this._loadingOverlay) {
      this._loadingOverlay.close();
      this._loadingOverlay = null;
    }
    
    // Hide the initial loading screen
    const loadingScreen = document.getElementById('app-loading');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
  }

  private showError(error: Error): void {
    // Hide loading if active
    this.hideLoading();
    
    // Show error screen
    const errorScreen = document.getElementById('app-error');
    if (errorScreen) {
      errorScreen.style.display = 'flex';
      
      const reloadButton = document.getElementById('reload-button');
      if (reloadButton) {
        reloadButton.addEventListener('click', () => {
          window.location.reload();
        });
      }
    }
    
    this.announceToScreenReader('Application error occurred. Please reload the application.');
  }

  private showFileError(fileName: string, error: Error): void {
    const errorState = ErrorState.fileNotFound(fileName);
    
    errorState.on('retry', () => {
      errorState.destroy();
      this._appLayout?.fileManager.refreshFileList();
    });
    
    errorState.on('dismiss', () => {
      errorState.destroy();
    });
    
    document.body.appendChild(errorState.element);
  }

  private showErrorToast(title: string, message: string): void {
    // Create and show error toast
    const toast = document.createElement('div');
    toast.className = 'cosmic-error-toast';
    toast.innerHTML = `
      <div class="toast-content">
        <span class="cosmic-icon icon-warning"></span>
        <div class="toast-message">
          <div class="toast-title">${title}</div>
          <div class="toast-text">${message}</div>
        </div>
        <button class="cosmic-button ghost small" aria-label="Dismiss">
          <span class="cosmic-icon icon-close"></span>
        </button>
      </div>
    `;
    
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
      toastContainer.appendChild(toast);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 5000);
      
      // Manual close
      const closeButton = toast.querySelector('button');
      closeButton?.addEventListener('click', () => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      });
    }
  }

  // Utility methods
  private showKeyboardHelp(): void {
    const helpContent = `
      <h3>Keyboard Shortcuts</h3>
      <ul>
        <li><kbd>Space</kbd> - Play/Pause</li>
        <li><kbd>←/→</kbd> - Seek ±10 seconds</li>
        <li><kbd>Shift</kbd> + <kbd>←/→</kbd> - Seek ±30 seconds</li>
        <li><kbd>↑/↓</kbd> - Volume ±10%</li>
        <li><kbd>M</kbd> - Mute toggle</li>
        <li><kbd>F</kbd> - Fullscreen toggle</li>
        <li><kbd>Ctrl</kbd> + <kbd>S</kbd> - Settings</li>
        <li><kbd>Ctrl</kbd> + <kbd>B</kbd> - Toggle sidebar</li>
        <li><kbd>Escape</kbd> - Close modals</li>
        <li><kbd>?</kbd> - Show this help</li>
      </ul>
    `;
    
    // Show help modal (implementation would depend on modal component)
    console.log('Keyboard help:', helpContent);
    this.announceToScreenReader('Keyboard shortcuts help displayed');
  }

  private hasUnsavedChanges(): boolean {
    // Check if there are any unsaved changes
    return false; // Implement based on app state
  }

  private announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (typeof (window as any).announceToScreenReader === 'function') {
      (window as any).announceToScreenReader(message, priority);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API
  get appLayout(): AppLayout | null {
    return this._appLayout;
  }

  get isInitialized(): boolean {
    return this._initialized;
  }

  destroy(): void {
    if (this._loadingOverlay) {
      this._loadingOverlay.destroy();
    }
    
    if (this._errorState) {
      this._errorState.destroy();
    }
    
    if (this._appLayout) {
      this._appLayout.destroy();
    }
    
    console.log('🌌 Cosmic Music Visualizer destroyed');
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌟 DOM ready, starting Cosmic Music Visualizer...');
  
  // Create global app instance
  (window as any).cosmicApp = new CosmicMusicVisualizer();
});

// Handle hot module replacement in development
declare const module: { hot?: { accept: (path: string, callback: () => void) => void } };
if (typeof module !== 'undefined' && module.hot) {
  module.hot.accept('./components/layout/AppLayout', () => {
    console.log('🔄 Hot reloading AppLayout...');
    // Implement HMR logic if needed
  });
}

export { CosmicMusicVisualizer };
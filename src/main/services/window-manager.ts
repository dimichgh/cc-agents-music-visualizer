/**
 * Window Manager Service - Handles Electron window creation and management
 */

import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { ServiceInterface } from '@/shared/types';
import { Logger, AppLogger } from '@/shared/utils/logger';

export class WindowManager implements ServiceInterface {
  private mainWindow: BrowserWindow | null = null;
  private logger: Logger;
  private _isInitialized = false;
  private _isDisposed = false;

  constructor() {
    this.logger = new AppLogger('WindowManager');
  }

  async initialize(): Promise<void> {
    if (this._isInitialized) {
      this.logger.warn('WindowManager already initialized');
      return;
    }

    this.logger.info('Initializing WindowManager...');
    this._isInitialized = true;
    this.logger.info('WindowManager initialized successfully');
  }

  async createMainWindow(): Promise<BrowserWindow> {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.focus();
      return this.mainWindow;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    // Calculate optimal window size (80% of screen, minimum 1200x800)
    const windowWidth = Math.max(1200, Math.floor(screenWidth * 0.8));
    const windowHeight = Math.max(800, Math.floor(screenHeight * 0.8));

    const windowOptions: Electron.BrowserWindowConstructorOptions = {
      width: windowWidth,
      height: windowHeight,
      minWidth: 1000,
      minHeight: 700,
      center: true,
      show: false, // Don't show until ready
      title: 'Music Visualizer',
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      frame: true,
      alwaysOnTop: false,
      skipTaskbar: false,
      focusable: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: process.env['NODE_ENV'] === 'production',
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
      },
      backgroundColor: '#0a0a0a', // Dark cosmic background
    };

    const icon = this.getAppIcon();
    if (icon) {
      windowOptions.icon = icon;
    }

    this.mainWindow = new BrowserWindow(windowOptions);
    
    this.logger.info(`Created window with dimensions: ${windowWidth}x${windowHeight}`);
    this.logger.info(`Window created, isVisible: ${this.mainWindow.isVisible()}, isDestroyed: ${this.mainWindow.isDestroyed()}`);

    // Set up window event handlers
    this.setupWindowEventHandlers();

    // Load the renderer
    await this.loadRenderer();

    // Show window when ready with fallback
    let windowShown = false;
    
    // Add additional debugging for window events
    this.mainWindow.webContents.on('did-finish-load', () => {
      this.logger.info('Renderer did-finish-load event fired');
      if (this.mainWindow) {
        this.logger.info(`After did-finish-load: isVisible: ${this.mainWindow.isVisible()}, bounds: ${JSON.stringify(this.mainWindow.getBounds())}`);
      }
    });
    
    this.mainWindow.once('ready-to-show', () => {
      this.logger.info('ready-to-show event fired');
      if (this.mainWindow && !windowShown) {
        windowShown = true;
        this.logger.info('Attempting to show window via ready-to-show event...');
        this.mainWindow.show();
        
        // Focus the window
        this.mainWindow.focus();
        
        // Ensure window is visible and on top
        this.mainWindow.moveTop();

        // Enable DevTools in development
        if (process.env['NODE_ENV'] === 'development') {
          this.mainWindow.webContents.openDevTools();
        }
        
        this.logger.info(`Window shown via ready-to-show event. isVisible: ${this.mainWindow.isVisible()}`);
      }
    });

    // More aggressive fallback: Show window after shorter timeout
    setTimeout(() => {
      if (this.mainWindow && !windowShown && !this.mainWindow.isDestroyed()) {
        windowShown = true;
        this.logger.warn('ready-to-show event did not fire, using fallback...');
        this.logger.info(`Before fallback show: isVisible: ${this.mainWindow.isVisible()}, bounds: ${JSON.stringify(this.mainWindow.getBounds())}`);
        
        this.mainWindow.show();
        this.mainWindow.focus();
        this.mainWindow.moveTop();
        
        if (process.env['NODE_ENV'] === 'development') {
          this.mainWindow.webContents.openDevTools();
        }
        
        this.logger.info(`After fallback show: isVisible: ${this.mainWindow.isVisible()}`);
      }
    }, 1500); // 1.5 second fallback
    
    // Even more aggressive fallback: Force show after longer timeout
    setTimeout(() => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        if (!this.mainWindow.isVisible()) {
          this.logger.error('Window still not visible after 3 seconds, forcing show...');
          this.mainWindow.show();
          this.mainWindow.focus();
          this.mainWindow.moveTop();
          this.logger.info(`After force show: isVisible: ${this.mainWindow.isVisible()}`);
        }
      }
    }, 3000); // 3 second force show

    this.logger.info('Main window created successfully');
    return this.mainWindow;
  }

  private setupWindowEventHandlers(): void {
    if (!this.mainWindow) return;

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.logger.info('Main window closed');
      this.mainWindow = null;
    });

    // Handle window focus/blur for performance optimization
    this.mainWindow.on('focus', () => {
      this.mainWindow?.webContents.send('window-focus', true);
    });

    this.mainWindow.on('blur', () => {
      this.mainWindow?.webContents.send('window-focus', false);
    });

    // Handle fullscreen changes
    this.mainWindow.on('enter-full-screen', () => {
      this.mainWindow?.webContents.send('fullscreen-change', true);
    });

    this.mainWindow.on('leave-full-screen', () => {
      this.mainWindow?.webContents.send('fullscreen-change', false);
    });

    // Handle window resize for responsive adjustments
    this.mainWindow.on('resize', () => {
      const bounds = this.mainWindow?.getBounds();
      if (bounds) {
        this.mainWindow?.webContents.send('window-resize', bounds);
      }
    });

    // Handle window minimize/restore for performance
    this.mainWindow.on('minimize', () => {
      this.mainWindow?.webContents.send('window-minimize', true);
    });

    this.mainWindow.on('restore', () => {
      this.mainWindow?.webContents.send('window-minimize', false);
    });

    // Handle web contents events
    this.mainWindow.webContents.on('did-finish-load', () => {
      this.logger.info('Renderer finished loading');
    });

    this.mainWindow.webContents.on('crashed', (event, killed) => {
      this.logger.error('Renderer process crashed', new Error(`killed: ${killed}`));
      
      // Attempt to reload the window
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.reload();
      }
    });

    this.mainWindow.webContents.on('unresponsive', () => {
      this.logger.warn('Renderer process became unresponsive');
    });

    this.mainWindow.webContents.on('responsive', () => {
      this.logger.info('Renderer process became responsive again');
    });
  }

  private async loadRenderer(): Promise<void> {
    if (!this.mainWindow) {
      throw new Error('Main window not created');
    }

    // Always load from built files for now (can be configured for development server later)
    const rendererPath = path.join(__dirname, '../renderer/index.html');
    
    try {
      await this.mainWindow.loadFile(rendererPath);
      this.logger.info(`Renderer loaded from: ${rendererPath}`);
    } catch (error) {
      this.logger.error(`Failed to load renderer from ${rendererPath}:`, error as Error);
      throw error;
    }
  }

  private getAppIcon(): string | undefined {
    // Return appropriate icon path for each platform
    const iconBasePath = path.join(__dirname, '../../../assets/icons');
    
    switch (process.platform) {
      case 'darwin':
        return path.join(iconBasePath, 'icon.icns');
      case 'win32':
        return path.join(iconBasePath, 'icon.ico');
      case 'linux':
        return path.join(iconBasePath, 'icon.png');
      default:
        return undefined;
    }
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  public toggleFullscreen(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
    }
  }

  public minimize(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.minimize();
    }
  }

  public maximize(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
    }
  }

  public close(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.close();
    }
  }

  isInitialized(): boolean {
    return this._isInitialized;
  }

  isDisposed(): boolean {
    return this._isDisposed;
  }

  public dispose(): void {
    if (this._isDisposed) return;

    this.logger.info('Disposing WindowManager...');

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.close();
      this.mainWindow = null;
    }

    this._isDisposed = true;
    this.logger.info('WindowManager disposed');
  }
}
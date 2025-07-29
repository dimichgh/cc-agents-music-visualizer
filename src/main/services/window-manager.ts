/**
 * Window Manager Service - Handles Electron window creation and management
 */

import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { ServiceInterface, Logger } from '@/shared/types';

export class WindowManager implements ServiceInterface {
  private mainWindow: BrowserWindow | null = null;
  private logger: Logger;
  private isInitialized = false;
  private isDisposed = false;

  constructor() {
    this.logger = new Logger('WindowManager');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('WindowManager already initialized');
      return;
    }

    this.logger.info('Initializing WindowManager...');
    this.isInitialized = true;
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

    this.mainWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      minWidth: 1000,
      minHeight: 700,
      center: true,
      show: false, // Don't show until ready
      icon: this.getAppIcon(),
      title: 'Music Visualizer',
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      frame: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        sandbox: false,
        preload: path.join(__dirname, '../preload/preload.js'),
        webSecurity: process.env.NODE_ENV === 'production',
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
      },
      backgroundColor: '#0a0a0a', // Dark cosmic background
    });

    // Set up window event handlers
    this.setupWindowEventHandlers();

    // Load the renderer
    await this.loadRenderer();

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      if (this.mainWindow) {
        this.mainWindow.show();
        
        // Focus the window
        this.mainWindow.focus();

        // Enable DevTools in development
        if (process.env.NODE_ENV === 'development') {
          this.mainWindow.webContents.openDevTools();
        }
      }
    });

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

    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      // Development: load from webpack dev server
      const devServerUrl = 'http://localhost:3000';
      await this.mainWindow.loadURL(devServerUrl);
    } else {
      // Production: load from built files
      const rendererPath = path.join(__dirname, '../../renderer/index.html');
      await this.mainWindow.loadFile(rendererPath);
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

  public isInitialized(): boolean {
    return this.isInitialized;
  }

  public isDisposed(): boolean {
    return this.isDisposed;
  }

  public dispose(): void {
    if (this.isDisposed) return;

    this.logger.info('Disposing WindowManager...');

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.close();
      this.mainWindow = null;
    }

    this.isDisposed = true;
    this.logger.info('WindowManager disposed');
  }
}
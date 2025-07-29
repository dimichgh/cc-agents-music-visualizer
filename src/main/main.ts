/**
 * Electron Main Process - Entry point for the Music Visualizer application
 */

import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import * as path from 'path';
import { WindowManager } from './services/window-manager';
import { FileManager } from './services/file-manager';
import { IPCBridge } from './services/ipc-bridge';
import { Logger } from '@/shared/utils/logger';

class MusicVisualizerApp {
  private windowManager!: WindowManager;
  private fileManager!: FileManager;
  private ipcBridge!: IPCBridge;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('MainProcess');
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // App event handlers
    app.whenReady().then(() => this.initialize());
    app.on('window-all-closed', this.onWindowAllClosed.bind(this));
    app.on('activate', this.onActivate.bind(this));
    app.on('before-quit', this.onBeforeQuit.bind(this));

    // Security handlers
    app.on('web-contents-created', (_, contents) => {
      contents.on('new-window', (navigationEvent, url) => {
        navigationEvent.preventDefault();
        shell.openExternal(url);
      });

      contents.on('will-navigate', (navigationEvent, url) => {
        if (url !== contents.getURL()) {
          navigationEvent.preventDefault();
        }
      });
    });
  }

  private async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Music Visualizer application...');

      // Initialize services
      this.windowManager = new WindowManager();
      this.fileManager = new FileManager();
      this.ipcBridge = new IPCBridge(this.fileManager);

      // Set up application menu
      this.setupApplicationMenu();

      // Create main window
      await this.windowManager.createMainWindow();

      // Initialize IPC handlers
      this.ipcBridge.initialize();

      this.logger.info('Application initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize application', error as Error);
      app.quit();
    }
  }

  private setupApplicationMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Open Audio File...',
            accelerator: 'CmdOrCtrl+O',
            click: async () => {
              const result = await this.fileManager.showOpenDialog();
              if (result) {
                this.windowManager.getMainWindow()?.webContents.send('file-selected', result);
              }
            },
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit(),
          },
        ],
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Toggle Fullscreen',
            accelerator: 'F11',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                mainWindow.setFullScreen(!mainWindow.isFullScreen());
              }
            },
          },
          {
            label: 'Toggle Developer Tools',
            accelerator: 'F12',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                mainWindow.webContents.toggleDevTools();
              }
            },
          },
          { type: 'separator' },
          { role: 'reload' },
          { role: 'forceReload' },
        ],
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' },
        ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About Music Visualizer',
            click: () => {
              dialog.showMessageBox(this.windowManager.getMainWindow()!, {
                type: 'info',
                title: 'About Music Visualizer',
                message: 'Music Visualizer',
                detail: 'Ethereal, psychedelic, cosmic music visualizer with real-time audio analysis',
                buttons: ['OK'],
              });
            },
          },
        ],
      },
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' },
        ],
      });

      // Window menu
      (template[3].submenu as Electron.MenuItemConstructorOptions[]).push(
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      );
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private onWindowAllClosed(): void {
    // On macOS, keep the app running even when all windows are closed
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  private onActivate(): void {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      this.windowManager.createMainWindow();
    }
  }

  private async onBeforeQuit(): Promise<void> {
    this.logger.info('Application shutting down...');
    
    // Cleanup services
    this.ipcBridge?.dispose();
    this.fileManager?.dispose();
    this.windowManager?.dispose();
    
    this.logger.info('Application shutdown complete');
  }
}

// Create and start the application
const musicVisualizerApp = new MusicVisualizerApp();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  app.quit();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  app.quit();
});
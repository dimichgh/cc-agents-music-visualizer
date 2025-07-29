/**
 * IPC Bridge Service - Handles communication between main and renderer processes
 */

import { ipcMain, BrowserWindow } from 'electron';
import { FileManager } from './file-manager';
import { ServiceInterface, IPCMessage, IPCResponse } from '@/shared/types';
import { Logger, AppLogger } from '@/shared/utils/logger';

export class IPCBridge implements ServiceInterface {
  private logger: Logger;
  private fileManager: FileManager;
  private _isInitialized = false;
  private _isDisposed = false;

  constructor(fileManager: FileManager) {
    this.logger = new AppLogger('IPCBridge');
    this.fileManager = fileManager;
  }

  async initialize(): Promise<void> {
    if (this._isInitialized) {
      this.logger.warn('IPCBridge already initialized');
      return;
    }

    this.logger.info('Initializing IPCBridge...');
    this.setupIPCHandlers();
    this._isInitialized = true;
    this.logger.info('IPCBridge initialized successfully');
  }

  private setupIPCHandlers(): void {
    // File operations
    ipcMain.handle('file:open-dialog', async (event) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        const result = await this.fileManager.showOpenDialog(window ?? undefined);
        return this.createResponse(true, result);
      } catch (error) {
        this.logger.error('Failed to handle file open dialog', error as Error);
        return this.createResponse(false, null, (error as Error).message);
      }
    });

    ipcMain.handle('file:read', async (event, filePath: string) => {
      try {
        const arrayBuffer = await this.fileManager.readAudioFile(filePath);
        
        // Convert ArrayBuffer to Uint8Array for IPC transfer
        const uint8Array = new Uint8Array(arrayBuffer);
        
        return this.createResponse(true, {
          data: Array.from(uint8Array),
          byteLength: arrayBuffer.byteLength
        });
      } catch (error) {
        this.logger.error(`Failed to read file: ${filePath}`, error as Error);
        return this.createResponse(false, null, (error as Error).message);
      }
    });

    ipcMain.handle('file:validate', async (event, filePath: string) => {
      try {
        const validation = this.fileManager.validateAudioFile(filePath);
        return this.createResponse(true, validation);
      } catch (error) {
        this.logger.error(`Failed to validate file: ${filePath}`, error as Error);
        return this.createResponse(false, null, (error as Error).message);
      }
    });

    ipcMain.handle('file:exists', async (event, filePath: string) => {
      try {
        const exists = await this.fileManager.fileExists(filePath);
        return this.createResponse(true, exists);
      } catch (error) {
        this.logger.error(`Failed to check file existence: ${filePath}`, error as Error);
        return this.createResponse(false, null, (error as Error).message);
      }
    });

    ipcMain.handle('file:stats', async (event, filePath: string) => {
      try {
        const stats = await this.fileManager.getFileStats(filePath);
        
        // Convert fs.Stats to plain object for IPC transfer
        const statsData = stats ? {
          size: stats.size,
          birthtime: stats.birthtime.toISOString(),
          mtime: stats.mtime.toISOString(),
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
        } : null;
        
        return this.createResponse(true, statsData);
      } catch (error) {
        this.logger.error(`Failed to get file stats: ${filePath}`, error as Error);
        return this.createResponse(false, null, (error as Error).message);
      }
    });

    // Application operations
    ipcMain.handle('app:get-version', async () => {
      try {
        const { app } = require('electron');
        return this.createResponse(true, app.getVersion());
      } catch (error) {
        this.logger.error('Failed to get app version', error as Error);
        return this.createResponse(false, null, (error as Error).message);
      }
    });

    ipcMain.handle('app:get-platform', async () => {
      try {
        return this.createResponse(true, process.platform);
      } catch (error) {
        this.logger.error('Failed to get platform', error as Error);
        return this.createResponse(false, null, (error as Error).message);
      }
    });

    // Window operations
    ipcMain.handle('window:toggle-fullscreen', async (event) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window) {
          window.setFullScreen(!window.isFullScreen());
          return this.createResponse(true, window.isFullScreen());
        }
        return this.createResponse(false, null, 'Window not found');
      } catch (error) {
        this.logger.error('Failed to toggle fullscreen', error as Error);
        return this.createResponse(false, null, (error as Error).message);
      }
    });

    ipcMain.handle('window:minimize', async (event) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window) {
          window.minimize();
          return this.createResponse(true, true);
        }
        return this.createResponse(false, null, 'Window not found');
      } catch (error) {
        this.logger.error('Failed to minimize window', error as Error);
        return this.createResponse(false, null, (error as Error).message);
      }
    });

    ipcMain.handle('window:maximize', async (event) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window) {
          if (window.isMaximized()) {
            window.unmaximize();
          } else {
            window.maximize();
          }
          return this.createResponse(true, window.isMaximized());
        }
        return this.createResponse(false, null, 'Window not found');
      } catch (error) {
        this.logger.error('Failed to toggle maximize window', error as Error);
        return this.createResponse(false, null, (error as Error).message);
      }
    });

    ipcMain.handle('window:close', async (event) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window) {
          window.close();
          return this.createResponse(true, true);
        }
        return this.createResponse(false, null, 'Window not found');
      } catch (error) {
        this.logger.error('Failed to close window', error as Error);
        return this.createResponse(false, null, (error as Error).message);
      }
    });

    // Error handling for unhandled IPC calls
    ipcMain.on('ipc:error', (event, error) => {
      this.logger.error('IPC error from renderer', new Error(error));
    });

    // Log IPC activity in development
    if (process.env['NODE_ENV'] === 'development') {
      ipcMain.on('ipc:log', (event, level: string, message: string, ...args: any[]) => {
        this.logger[level as keyof Logger](message, ...args);
      });
    }

    this.logger.info('IPC handlers registered successfully');
  }

  /**
   * Create standardized IPC response
   */
  private createResponse<T>(success: boolean, data?: T, error?: string, id?: string): IPCResponse<T> {
    const response: IPCResponse<T> = {
      success,
      timestamp: Date.now(),
    };
    
    if (data !== undefined) {
      response.data = data;
    }
    
    if (error !== undefined) {
      response.error = error;
    }
    
    if (id !== undefined) {
      response.id = id;
    }
    
    return response;
  }

  /**
   * Send message to all renderer processes
   */
  public broadcast<T>(channel: string, data: T): void {
    const allWindows = BrowserWindow.getAllWindows();
    const message: IPCMessage<T> = {
      channel,
      data,
      timestamp: Date.now(),
    };

    allWindows.forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send(channel, message);
      }
    });
  }

  /**
   * Send message to specific window
   */
  public sendToWindow<T>(window: BrowserWindow, channel: string, data: T): void {
    if (!window.isDestroyed()) {
      const message: IPCMessage<T> = {
        channel,
        data,
        timestamp: Date.now(),
      };
      window.webContents.send(channel, message);
    }
  }

  private removeIPCHandlers(): void {
    // Remove all custom IPC handlers
    const handlers = [
      'file:open-dialog',
      'file:read',
      'file:validate',
      'file:exists',
      'file:stats',
      'app:get-version',
      'app:get-platform',
      'window:toggle-fullscreen',
      'window:minimize',
      'window:maximize',
      'window:close',
    ];

    handlers.forEach(handler => {
      ipcMain.removeHandler(handler);
    });

    // Remove listeners
    ipcMain.removeAllListeners('ipc:error');
    ipcMain.removeAllListeners('ipc:log');

    this.logger.info('IPC handlers removed');
  }

  isInitialized(): boolean {
    return this._isInitialized;
  }

  isDisposed(): boolean {
    return this._isDisposed;
  }

  public dispose(): void {
    if (this._isDisposed) return;

    this.logger.info('Disposing IPCBridge...');
    this.removeIPCHandlers();
    this._isDisposed = true;
    this.logger.info('IPCBridge disposed');
  }
}
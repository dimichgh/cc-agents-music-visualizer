/**
 * Preload script for secure IPC communication between main and renderer processes
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPCResponse, AudioFile, ValidationResult } from '@/shared/types';

// Define the API that will be exposed to the renderer process
const electronAPI = {
  // File operations
  file: {
    openDialog: (): Promise<IPCResponse<AudioFile | null>> => 
      ipcRenderer.invoke('file:open-dialog'),
    
    read: (filePath: string): Promise<IPCResponse<{ data: number[]; byteLength: number }>> =>
      ipcRenderer.invoke('file:read', filePath),
    
    validate: (filePath: string): Promise<IPCResponse<ValidationResult>> =>
      ipcRenderer.invoke('file:validate', filePath),
    
    exists: (filePath: string): Promise<IPCResponse<boolean>> =>
      ipcRenderer.invoke('file:exists', filePath),
    
    getStats: (filePath: string): Promise<IPCResponse<any>> =>
      ipcRenderer.invoke('file:stats', filePath),
  },

  // Application operations
  app: {
    getVersion: (): Promise<IPCResponse<string>> =>
      ipcRenderer.invoke('app:get-version'),
    
    getPlatform: (): Promise<IPCResponse<string>> =>
      ipcRenderer.invoke('app:get-platform'),
  },

  // Window operations
  window: {
    toggleFullscreen: (): Promise<IPCResponse<boolean>> =>
      ipcRenderer.invoke('window:toggle-fullscreen'),
    
    minimize: (): Promise<IPCResponse<boolean>> =>
      ipcRenderer.invoke('window:minimize'),
    
    maximize: (): Promise<IPCResponse<boolean>> =>
      ipcRenderer.invoke('window:maximize'),
    
    close: (): Promise<IPCResponse<boolean>> =>
      ipcRenderer.invoke('window:close'),
  },

  // Event listeners
  on: {
    windowFocus: (callback: (focused: boolean) => void) => {
      ipcRenderer.on('window-focus', (_, focused) => callback(focused));
    },

    windowResize: (callback: (bounds: any) => void) => {
      ipcRenderer.on('window-resize', (_, bounds) => callback(bounds));
    },

    windowMinimize: (callback: (minimized: boolean) => void) => {
      ipcRenderer.on('window-minimize', (_, minimized) => callback(minimized));
    },

    fullscreenChange: (callback: (isFullscreen: boolean) => void) => {
      ipcRenderer.on('fullscreen-change', (_, isFullscreen) => callback(isFullscreen));
    },

    fileSelected: (callback: (file: AudioFile) => void) => {
      ipcRenderer.on('file-selected', (_, file) => callback(file));
    },
  },

  // Remove event listeners
  off: {
    windowFocus: () => ipcRenderer.removeAllListeners('window-focus'),
    windowResize: () => ipcRenderer.removeAllListeners('window-resize'),
    windowMinimize: () => ipcRenderer.removeAllListeners('window-minimize'),
    fullscreenChange: () => ipcRenderer.removeAllListeners('fullscreen-change'),
    fileSelected: () => ipcRenderer.removeAllListeners('file-selected'),
  },

  // Utility functions
  utils: {
    // Send error to main process for logging
    reportError: (error: string) => {
      ipcRenderer.send('ipc:error', error);
    },

    // Send log message to main process (development only)
    log: (level: string, message: string, ...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        ipcRenderer.send('ipc:log', level, message, ...args);
      }
    },
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for the exposed API
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}

export type ElectronAPI = typeof electronAPI;
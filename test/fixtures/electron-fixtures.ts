/**
 * Electron testing utilities and mocks
 */

import { EventEmitter } from 'events';

/**
 * Mock Electron Main Process APIs
 */
export function createMockElectronMain() {
  const mockApp = new EventEmitter();
  Object.assign(mockApp, {
    quit: () => {},
    getPath: (name: string) => `/mock/path/${name}`,
    getVersion: () => '1.0.0',
    getName: () => 'Music Visualizer',
    isReady: () => true,
    whenReady: () => Promise.resolve(),
    dock: {
      setBadge: () => {},
      getBadge: () => '',
    },
  });

  const mockBrowserWindow = class {
    webContents = new EventEmitter();
    constructor(options: any) {
      Object.assign(this.webContents, {
        loadFile: () => Promise.resolve(),
        loadURL: () => Promise.resolve(),
        send: () => {},
        openDevTools: () => {},
        closeDevTools: () => {},
        isDevToolsOpened: () => false,
        executeJavaScript: () => Promise.resolve(),
        insertCSS: () => Promise.resolve(),
        setUserAgent: () => {},
        getUserAgent: () => 'mock-user-agent',
      });
    }
    
    loadFile = () => Promise.resolve();
    loadURL = () => Promise.resolve();
    show = () => {};
    hide = () => {};
    close = () => {};
    minimize = () => {};
    maximize = () => {};
    unmaximize = () => {};
    setFullScreen = () => {};
    isFullScreen = () => false;
    setTitle = () => {};
    getTitle = () => 'Music Visualizer';
    setSize = () => {};
    getSize = () => [800, 600];
    setPosition = () => {};
    getPosition = () => [100, 100];
    center = () => {};
    focus = () => {};
    blur = () => {};
    isFocused = () => true;
    isVisible = () => true;
    isMinimized = () => false;
    isMaximized = () => false;
    isDestroyed = () => false;
  };

  const mockDialog = {
    showOpenDialog: () => Promise.resolve({ canceled: false, filePaths: ['/mock/file.wav'] }),
    showSaveDialog: () => Promise.resolve({ canceled: false, filePath: '/mock/save.wav' }),
    showMessageBox: () => Promise.resolve({ response: 0 }),
    showErrorBox: () => {},
  };

  const mockMenu = {
    setApplicationMenu: () => {},
    buildFromTemplate: () => ({}),
  };

  const mockIpcMain = new EventEmitter();
  Object.assign(mockIpcMain, {
    handle: () => {},
    handleOnce: () => {},
    removeHandler: () => {},
  });

  const mockShell = {
    openExternal: () => Promise.resolve(),
    openPath: () => Promise.resolve(''),
    showItemInFolder: () => {},
    moveItemToTrash: () => Promise.resolve(true),
  };

  return {
    app: mockApp,
    BrowserWindow: mockBrowserWindow,
    dialog: mockDialog,
    Menu: mockMenu,
    ipcMain: mockIpcMain,
    shell: mockShell,
  };
}

/**
 * Mock Electron Renderer Process APIs
 */
export function createMockElectronRenderer() {
  const mockIpcRenderer = new EventEmitter();
  Object.assign(mockIpcRenderer, {
    invoke: () => Promise.resolve(),
    send: () => {},
    sendSync: () => ({}),
    sendTo: () => {},
    sendToHost: () => {},
    removeAllListeners: () => mockIpcRenderer,
  });

  const mockWebFrame = {
    setZoomFactor: () => {},
    getZoomFactor: () => 1,
    setZoomLevel: () => {},
    getZoomLevel: () => 0,
    setVisualZoomLevelLimits: () => {},
    setSpellCheckProvider: () => {},
  };

  const mockRemote = {
    app: createMockElectronMain().app,
    BrowserWindow: createMockElectronMain().BrowserWindow,
    dialog: createMockElectronMain().dialog,
    Menu: createMockElectronMain().Menu,
    shell: createMockElectronMain().shell,
    getCurrentWindow: () => new (createMockElectronMain().BrowserWindow)({}),
    getCurrentWebContents: () => ({
      openDevTools: () => {},
      closeDevTools: () => {},
      isDevToolsOpened: () => false,
    }),
  };

  return {
    ipcRenderer: mockIpcRenderer,
    webFrame: mockWebFrame,
    remote: mockRemote,
  };
}

/**
 * Mock Electron Preload APIs
 */
export function createMockElectronPreload() {
  const mockElectronAPI = {
    // File operations
    openFile: () => Promise.resolve({ success: true, filePath: '/mock/file.wav' }),
    saveFile: () => Promise.resolve({ success: true, filePath: '/mock/save.wav' }),
    readFile: () => Promise.resolve(new ArrayBuffer(1024)),
    writeFile: () => Promise.resolve({ success: true }),
    
    // Window operations
    minimizeWindow: () => Promise.resolve(),
    maximizeWindow: () => Promise.resolve(),
    closeWindow: () => Promise.resolve(),
    setWindowTitle: () => Promise.resolve(),
    
    // System operations
    showErrorDialog: () => Promise.resolve(),
    showInfoDialog: () => Promise.resolve(),
    openExternal: () => Promise.resolve(),
    showInFolder: () => Promise.resolve(),
    
    // IPC operations
    sendMessage: () => {},
    onMessage: () => {},
    removeListener: () => {},
    
    // Platform info
    platform: process.platform,
    version: '1.0.0',
  };

  // Mock the global electronAPI
  global.electronAPI = mockElectronAPI;
  
  return mockElectronAPI;
}

/**
 * Create mock IPC message
 */
export function createMockIPCMessage(channel: string, data: any = {}) {
  return {
    channel,
    data,
    timestamp: Date.now(),
    source: 'test',
  };
}

/**
 * Mock file system operations
 */
export function createMockFileSystem() {
  return {
    readFile: () => Promise.resolve(new ArrayBuffer(1024)),
    writeFile: () => Promise.resolve(),
    exists: () => Promise.resolve(true),
    mkdir: () => Promise.resolve(),
    readdir: () => Promise.resolve(['file1.wav', 'file2.wav']),
    stat: () => Promise.resolve({
      size: 1024000,
      mtime: new Date(),
      isFile: () => true,
      isDirectory: () => false,
    }),
    unlink: () => Promise.resolve(),
    copyFile: () => Promise.resolve(),
    moveFile: () => Promise.resolve(),
  };
}

/**
 * Setup Electron testing environment
 */
export function setupElectronTestEnvironment() {
  // Mock Electron modules
  const electronMain = createMockElectronMain();
  const electronRenderer = createMockElectronRenderer();
  const electronPreload = createMockElectronPreload();
  
  // Set up global mocks
  global.electron = {
    ...electronMain,
    ...electronRenderer,
  };
  
  // Mock require for Electron modules
  const originalRequire = require;
  require = ((id: string) => {
    if (id === 'electron') {
      return global.electron;
    }
    return originalRequire(id);
  }) as any;
  
  return {
    electronMain,
    electronRenderer,
    electronPreload,
    cleanup: () => {
      global.electron = undefined;
      require = originalRequire;
    },
  };
}

/**
 * Wait for IPC communication
 */
export function waitForIPC(timeout: number = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('IPC timeout'));
    }, timeout);
    
    // Simulate IPC delay
    setTimeout(() => {
      clearTimeout(timer);
      resolve();
    }, 10);
  });
}
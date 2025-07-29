/**
 * WindowManager (Main Process) Tests
 */

import { expect, sinon } from '../../setup';
import { WindowManager } from '../../../src/main/services/window-manager';
import { 
  setupElectronTestEnvironment,
  createMockIPCMessage
} from '../../fixtures/electron-fixtures';

describe('WindowManager (Main Process)', () => {
  let windowManager: WindowManager;
  let mockElectron: any;
  let mockWindow: any;

  beforeEach(() => {
    const { electronMain } = setupElectronTestEnvironment();
    mockElectron = electronMain;
    
    // Create mock window instance
    mockWindow = new mockElectron.BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: '/path/to/preload.js'
      }
    });
    
    windowManager = new WindowManager();
  });

  afterEach(() => {
    if (windowManager && windowManager.isInitialized()) {
      windowManager.dispose();
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      expect(windowManager.isInitialized()).to.be.false;

      await windowManager.initialize();

      expect(windowManager.isInitialized()).to.be.true;
    });

    it('should set up IPC handlers during initialization', async () => {
      await windowManager.initialize();

      expect(mockElectron.ipcMain.handle.called).to.be.true;
      
      // Verify specific handlers are registered
      const handleCalls = mockElectron.ipcMain.handle.getCalls();
      const channels = handleCalls.map(call => call.args[0]);
      
      expect(channels).to.include('window:minimize');
      expect(channels).to.include('window:maximize');
      expect(channels).to.include('window:close');
      expect(channels).to.include('window:setTitle');
      expect(channels).to.include('window:getInfo');
    });

    it('should not initialize twice', async () => {
      await windowManager.initialize();
      expect(windowManager.isInitialized()).to.be.true;

      // Second initialization should not throw
      await windowManager.initialize();
      expect(windowManager.isInitialized()).to.be.true;
    });
  });

  describe('main window creation', () => {
    beforeEach(async () => {
      await windowManager.initialize();
    });

    it('should create main window', async () => {
      const window = await windowManager.createMainWindow();

      expect(window).to.exist;
      expect(windowManager.getMainWindow()).to.equal(window);
    });

    it('should configure main window properties', async () => {
      const options = {
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        title: 'Music Visualizer'
      };

      const window = await windowManager.createMainWindow(options);

      // Verify window configuration
      expect(window.getSize()).to.deep.equal([options.width, options.height]);
      expect(window.getTitle()).to.equal(options.title);
    });

    it('should set up window event listeners', async () => {
      const window = await windowManager.createMainWindow();

      // Verify event listeners are attached
      expect(window.webContents.on).to.have.been.called;
    });

    it('should load the main application', async () => {
      const window = await windowManager.createMainWindow();

      expect(window.loadFile).to.have.been.calledWith('dist/renderer/index.html');
    });

    it('should handle window creation errors', async () => {
      // Simulate window creation failure
      sinon.stub(mockElectron, 'BrowserWindow').throws(new Error('Window creation failed'));

      try {
        await windowManager.createMainWindow();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to create main window');
      }
    });
  });

  describe('window state management', () => {
    beforeEach(async () => {
      await windowManager.initialize();
      await windowManager.createMainWindow();
    });

    it('should minimize window', () => {
      windowManager.minimizeWindow();

      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.minimize).to.have.been.calledOnce;
    });

    it('should maximize window', () => {
      windowManager.maximizeWindow();

      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.maximize).to.have.been.calledOnce;
    });

    it('should unmaximize window when already maximized', () => {
      const mainWindow = windowManager.getMainWindow();
      mainWindow!.isMaximized = sinon.stub().returns(true);

      windowManager.maximizeWindow();

      expect(mainWindow?.unmaximize).to.have.been.calledOnce;
    });

    it('should close window', () => {
      windowManager.closeWindow();

      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.close).to.have.been.calledOnce;
    });

    it('should set window title', () => {
      const title = 'Music Visualizer - Loading...';
      
      windowManager.setWindowTitle(title);

      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.setTitle).to.have.been.calledWith(title);
    });

    it('should get window information', () => {
      const mainWindow = windowManager.getMainWindow();
      mainWindow!.getSize = sinon.stub().returns([1200, 800]);
      mainWindow!.getPosition = sinon.stub().returns([100, 100]);
      mainWindow!.isMaximized = sinon.stub().returns(false);
      mainWindow!.isMinimized = sinon.stub().returns(false);
      mainWindow!.isFullScreen = sinon.stub().returns(false);

      const info = windowManager.getWindowInfo();

      expect(info).to.have.property('width', 1200);
      expect(info).to.have.property('height', 800);
      expect(info).to.have.property('x', 100);
      expect(info).to.have.property('y', 100);
      expect(info).to.have.property('isMaximized', false);
      expect(info).to.have.property('isMinimized', false);
      expect(info).to.have.property('isFullScreen', false);
    });
  });

  describe('window positioning and sizing', () => {
    beforeEach(async () => {
      await windowManager.initialize();
      await windowManager.createMainWindow();
    });

    it('should resize window', () => {
      const width = 1400;
      const height = 900;
      
      windowManager.resizeWindow(width, height);

      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.setSize).to.have.been.calledWith(width, height);
    });

    it('should move window', () => {
      const x = 200;
      const y = 150;
      
      windowManager.moveWindow(x, y);

      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.setPosition).to.have.been.calledWith(x, y);
    });

    it('should center window', () => {
      windowManager.centerWindow();

      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.center).to.have.been.calledOnce;
    });

    it('should set window bounds', () => {
      const bounds = { x: 100, y: 50, width: 1300, height: 850 };
      
      windowManager.setWindowBounds(bounds);

      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.setBounds).to.have.been.calledWith(bounds);
    });

    it('should validate window size constraints', () => {
      // Try to set size below minimum
      windowManager.resizeWindow(400, 300);

      const mainWindow = windowManager.getMainWindow();
      // Should enforce minimum size constraints
      expect(mainWindow?.setSize).to.have.been.calledWith(800, 600);
    });
  });

  describe('fullscreen management', () => {
    beforeEach(async () => {
      await windowManager.initialize();
      await windowManager.createMainWindow();
    });

    it('should enter fullscreen', () => {
      windowManager.setFullScreen(true);

      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.setFullScreen).to.have.been.calledWith(true);
    });

    it('should exit fullscreen', () => {
      windowManager.setFullScreen(false);

      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.setFullScreen).to.have.been.calledWith(false);
    });

    it('should toggle fullscreen', () => {
      const mainWindow = windowManager.getMainWindow();
      mainWindow!.isFullScreen = sinon.stub().returns(false);

      windowManager.toggleFullScreen();

      expect(mainWindow?.setFullScreen).to.have.been.calledWith(true);
    });

    it('should handle fullscreen events', () => {
      const mainWindow = windowManager.getMainWindow();
      
      // Simulate fullscreen enter event
      const enterEvent = 'enter-full-screen';
      mainWindow!.webContents.emit(enterEvent);

      // Should update internal state
      expect(windowManager.isFullScreen()).to.be.true;
    });
  });

  describe('window state persistence', () => {
    beforeEach(async () => {
      await windowManager.initialize();
    });

    it('should save window state', async () => {
      await windowManager.createMainWindow();
      
      const mainWindow = windowManager.getMainWindow();
      mainWindow!.getSize = sinon.stub().returns([1300, 850]);
      mainWindow!.getPosition = sinon.stub().returns([150, 100]);
      mainWindow!.isMaximized = sinon.stub().returns(true);

      await windowManager.saveWindowState();

      const savedState = windowManager.getSavedWindowState();
      expect(savedState).to.deep.include({
        width: 1300,
        height: 850,
        x: 150,
        y: 100,
        isMaximized: true
      });
    });

    it('should restore window state', async () => {
      const savedState = {
        width: 1400,
        height: 900,
        x: 200,
        y: 150,
        isMaximized: false,
        isFullScreen: false
      };

      windowManager.setSavedWindowState(savedState);
      
      const window = await windowManager.createMainWindow();

      expect(window.setSize).to.have.been.calledWith(savedState.width, savedState.height);
      expect(window.setPosition).to.have.been.calledWith(savedState.x, savedState.y);
    });

    it('should handle corrupted state data', async () => {
      windowManager.setSavedWindowState(null);
      
      // Should create window with default settings
      const window = await windowManager.createMainWindow();
      
      expect(window).to.exist;
      expect(window.setSize).to.have.been.calledWith(1200, 800); // Default size
    });

    it('should validate restored state bounds', async () => {
      const invalidState = {
        width: -100,  // Invalid
        height: 50,   // Too small
        x: -5000,     // Off-screen
        y: 10000,     // Off-screen
        isMaximized: false
      };

      windowManager.setSavedWindowState(invalidState);
      
      const window = await windowManager.createMainWindow();

      // Should use safe defaults for invalid values
      expect(window.setSize).to.have.been.calledWith(
        sinon.match.number.and(sinon.match(n => n >= 800)),
        sinon.match.number.and(sinon.match(n => n >= 600))
      );
    });
  });

  describe('dev tools management', () => {
    beforeEach(async () => {
      await windowManager.initialize();
      await windowManager.createMainWindow();
    });

    it('should open dev tools', () => {
      windowManager.openDevTools();

      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.webContents.openDevTools).to.have.been.calledOnce;
    });

    it('should close dev tools', () => {
      windowManager.closeDevTools();

      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.webContents.closeDevTools).to.have.been.calledOnce;
    });

    it('should toggle dev tools', () => {
      const mainWindow = windowManager.getMainWindow();
      mainWindow!.webContents.isDevToolsOpened = sinon.stub().returns(false);

      windowManager.toggleDevTools();

      expect(mainWindow?.webContents.openDevTools).to.have.been.calledOnce;
    });

    it('should only open dev tools in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      windowManager.openDevTools();

      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.webContents.openDevTools).to.not.have.been.called;
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('IPC message handling', () => {
    beforeEach(async () => {
      await windowManager.initialize();
      await windowManager.createMainWindow();
    });

    it('should handle window minimize requests', async () => {
      const message = createMockIPCMessage('window:minimize', {});

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'window:minimize')?.args[1];

      expect(handler).to.exist;
      
      const result = await handler({}, message.data);
      
      expect(result.success).to.be.true;
      
      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.minimize).to.have.been.calledOnce;
    });

    it('should handle window maximize requests', async () => {
      const message = createMockIPCMessage('window:maximize', {});

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'window:maximize')?.args[1];

      const result = await handler({}, message.data);
      
      expect(result.success).to.be.true;
      
      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.maximize).to.have.been.calledOnce;
    });

    it('should handle window close requests', async () => {
      const message = createMockIPCMessage('window:close', {});

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'window:close')?.args[1];

      const result = await handler({}, message.data);
      
      expect(result.success).to.be.true;
      
      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.close).to.have.been.calledOnce;
    });

    it('should handle set title requests', async () => {
      const title = 'New Window Title';
      const message = createMockIPCMessage('window:setTitle', { title });

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'window:setTitle')?.args[1];

      const result = await handler({}, message.data);
      
      expect(result.success).to.be.true;
      
      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.setTitle).to.have.been.calledWith(title);
    });

    it('should handle get window info requests', async () => {
      const mainWindow = windowManager.getMainWindow();
      mainWindow!.getSize = sinon.stub().returns([1200, 800]);
      mainWindow!.getPosition = sinon.stub().returns([100, 100]);
      mainWindow!.isMaximized = sinon.stub().returns(false);

      const message = createMockIPCMessage('window:getInfo', {});

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'window:getInfo')?.args[1];

      const result = await handler({}, message.data);
      
      expect(result.success).to.be.true;
      expect(result.data).to.have.property('width', 1200);
      expect(result.data).to.have.property('height', 800);
    });

    it('should handle IPC errors gracefully', async () => {
      // Create window manager without main window
      const windowManagerNoWindow = new WindowManager();
      await windowManagerNoWindow.initialize();

      const message = createMockIPCMessage('window:minimize', {});

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'window:minimize')?.args[1];

      const result = await handler({}, message.data);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('No main window');
      
      windowManagerNoWindow.dispose();
    });
  });

  describe('window events', () => {
    let eventHandler: sinon.SinonSpy;

    beforeEach(async () => {
      eventHandler = sinon.spy();
      await windowManager.initialize();
      await windowManager.createMainWindow();
    });

    it('should emit window created event', () => {
      windowManager.on('windowCreated', eventHandler);
      
      // Event should have been emitted during createMainWindow
      expect(eventHandler.calledOnce).to.be.true;
    });

    it('should emit window closed event', () => {
      windowManager.on('windowClosed', eventHandler);
      
      const mainWindow = windowManager.getMainWindow();
      
      // Simulate window close event
      mainWindow!.emit('closed');
      
      expect(eventHandler.calledOnce).to.be.true;
    });

    it('should emit window state change events', () => {
      windowManager.on('windowStateChanged', eventHandler);
      
      windowManager.maximizeWindow();
      
      expect(eventHandler.called).to.be.true;
    });

    it('should remove event listeners', () => {
      windowManager.on('windowStateChanged', eventHandler);
      windowManager.off('windowStateChanged', eventHandler);
      
      windowManager.maximizeWindow();
      expect(eventHandler.called).to.be.false;
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await windowManager.initialize();
    });

    it('should handle window operation errors', async () => {
      await windowManager.createMainWindow();
      
      const mainWindow = windowManager.getMainWindow();
      mainWindow!.setSize = sinon.stub().throws(new Error('Window operation failed'));

      // Should not throw, but handle gracefully
      expect(() => windowManager.resizeWindow(1200, 800)).to.not.throw();
    });

    it('should handle missing window errors', () => {
      // Try to operate on window before creation
      expect(() => windowManager.minimizeWindow()).to.not.throw();
      expect(() => windowManager.maximizeWindow()).to.not.throw();
      expect(() => windowManager.closeWindow()).to.not.throw();
    });

    it('should handle state persistence errors', async () => {
      // Mock file system error
      sinon.stub(require('fs').promises, 'writeFile').rejects(new Error('Permission denied'));

      await windowManager.createMainWindow();
      
      // Should not throw when save fails
      expect(async () => await windowManager.saveWindowState()).to.not.throw();
    });
  });

  describe('disposal and cleanup', () => {
    it('should dispose correctly', async () => {
      await windowManager.initialize();
      expect(windowManager.isDisposed()).to.be.false;

      windowManager.dispose();

      expect(windowManager.isDisposed()).to.be.true;
    });

    it('should handle multiple dispose calls', async () => {
      await windowManager.initialize();

      windowManager.dispose();
      windowManager.dispose(); // Should not throw

      expect(windowManager.isDisposed()).to.be.true;
    });

    it('should clean up IPC handlers on disposal', async () => {
      await windowManager.initialize();
      
      windowManager.dispose();

      expect(mockElectron.ipcMain.removeHandler.called).to.be.true;
    });

    it('should close all windows on disposal', async () => {
      await windowManager.initialize();
      await windowManager.createMainWindow();
      
      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow).to.exist;

      windowManager.dispose();

      expect(mainWindow?.close).to.have.been.calledOnce;
    });

    it('should save window state before disposal', async () => {
      await windowManager.initialize();
      await windowManager.createMainWindow();
      
      const saveStateSpy = sinon.spy(windowManager, 'saveWindowState');
      
      windowManager.dispose();

      expect(saveStateSpy.calledOnce).to.be.true;
    });

    it('should clean up event listeners on disposal', async () => {
      await windowManager.initialize();
      const eventHandler = sinon.spy();
      windowManager.on('windowStateChanged', eventHandler);

      windowManager.dispose();

      windowManager.emit('windowStateChanged', {});
      expect(eventHandler.called).to.be.false;
    });
  });
});
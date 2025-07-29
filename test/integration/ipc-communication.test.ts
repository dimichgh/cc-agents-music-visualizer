/**
 * IPC Communication Integration Tests
 */

import { expect, sinon } from '../setup';
import { IPCBridge } from '../../src/main/services/ipc-bridge';
import { FileManager } from '../../src/main/services/file-manager';
import { WindowManager } from '../../src/main/services/window-manager';
import { 
  setupElectronTestEnvironment,
  createMockIPCMessage,
  waitForIPC
} from '../fixtures/electron-fixtures';
import { SAMPLE_AUDIO_FILE } from '../fixtures/audio-fixtures';

describe('IPC Communication Integration', () => {
  let mockElectron: any;
  let ipcBridge: IPCBridge;
  let fileManager: FileManager;
  let windowManager: WindowManager;
  let mockMainWindow: any;

  beforeEach(async () => {
    const { electronMain } = setupElectronTestEnvironment();
    mockElectron = electronMain;
    
    // Create mock main window
    mockMainWindow = new mockElectron.BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: '/path/to/preload.js'
      }
    });

    // Initialize services
    fileManager = new FileManager();
    windowManager = new WindowManager();
    ipcBridge = new IPCBridge();

    await fileManager.initialize();
    await windowManager.initialize();
    await windowManager.createMainWindow();
    await ipcBridge.initialize(mockMainWindow);
  });

  afterEach(() => {
    if (ipcBridge?.isInitialized()) ipcBridge.dispose();
    if (fileManager?.isInitialized()) fileManager.dispose();
    if (windowManager?.isInitialized()) windowManager.dispose();
  });

  describe('main-to-renderer communication', () => {
    it('should send messages from main to renderer', async () => {
      const channel = 'app:notification';
      const data = { 
        type: 'info', 
        message: 'Application started successfully' 
      };

      await ipcBridge.sendToRenderer(channel, data);

      expect(mockMainWindow.webContents.send.calledWith(channel, data)).to.be.true;
    });

    it('should broadcast messages to all windows', async () => {
      // Create additional windows
      const secondWindow = new mockElectron.BrowserWindow({});
      const thirdWindow = new mockElectron.BrowserWindow({});
      
      ipcBridge.addWindow('second', secondWindow);
      ipcBridge.addWindow('third', thirdWindow);

      const channel = 'global:update';
      const data = { state: 'loading' };

      ipcBridge.broadcast(channel, data);

      expect(mockMainWindow.webContents.send.calledWith(channel, data)).to.be.true;
      expect(secondWindow.webContents.send.calledWith(channel, data)).to.be.true;
      expect(thirdWindow.webContents.send.calledWith(channel, data)).to.be.true;
    });

    it('should handle renderer offline scenarios', async () => {
      // Simulate renderer being unresponsive
      mockMainWindow.webContents.send.throws(new Error('Renderer not responding'));

      const result = await ipcBridge.sendToRenderer('test:channel', {});

      expect(result.success).to.be.false;
      expect(result.error).to.include('Renderer not responding');
    });

    it('should queue messages when renderer is busy', async () => {
      let callCount = 0;
      mockMainWindow.webContents.send.callsFake(() => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Renderer busy');
        }
        return true;
      });

      const result = await ipcBridge.sendToRenderer('test:channel', {}, null, 1000, 3);

      expect(result.success).to.be.true;
      expect(callCount).to.equal(3);
    });
  });

  describe('renderer-to-main communication', () => {
    it('should handle file operations from renderer', async () => {
      // Mock file system operations
      sinon.stub(require('fs').promises, 'readFile').resolves(Buffer.from(new ArrayBuffer(1024)));

      const message = createMockIPCMessage('file:read', {
        filePath: '/path/to/audio/file.wav'
      });

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'file:read')?.args[1];

      expect(handler).to.exist;
      
      const result = await handler({}, message.data);

      expect(result.success).to.be.true;
      expect(result.data).to.be.instanceOf(ArrayBuffer);
    });

    it('should handle window operations from renderer', async () => {
      const message = createMockIPCMessage('window:maximize', {});

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'window:maximize')?.args[1];

      const result = await handler({}, message.data);

      expect(result.success).to.be.true;
      
      const mainWindow = windowManager.getMainWindow();
      expect(mainWindow?.maximize).to.have.been.calledOnce;
    });

    it('should validate renderer requests', async () => {
      const invalidMessage = createMockIPCMessage('file:read', {
        // Missing required filePath
        invalidData: true
      });

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'file:read')?.args[1];

      const result = await handler({}, invalidMessage.data);

      expect(result.success).to.be.false;
      expect(result.error).to.include('Invalid request');
    });

    it('should rate limit renderer requests', async () => {
      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'file:read')?.args[1];

      // Send many requests rapidly
      const requests = Array(50).fill(0).map(() => 
        handler({}, { filePath: '/test/file.wav' })
      );

      const results = await Promise.allSettled(requests);
      const rejectedCount = results.filter(r => 
        r.status === 'fulfilled' && !(r.value as any).success
      ).length;

      expect(rejectedCount).to.be.greaterThan(0); // Some should be rate limited
    });
  });

  describe('bidirectional communication patterns', () => {
    it('should handle request-response pattern', async () => {
      // Set up response handler in main process
      ipcBridge.registerChannel('audio:analyze', async (data) => {
        expect(data.audioData).to.exist;
        return { 
          frequencies: new Float32Array([0.1, 0.3, 0.8, 0.5, 0.2]),
          beats: [],
          timestamp: Date.now()
        };
      });

      const requestData = { audioData: new Float32Array(1024) };
      const result = await ipcBridge.request('audio:analyze', requestData);

      expect(result.frequencies).to.be.instanceOf(Float32Array);
      expect(result.timestamp).to.be.a('number');
    });

    it('should handle streaming data', (done) => {
      let messageCount = 0;
      
      // Set up streaming handler
      ipcBridge.registerChannel('audio:stream', (data) => {
        messageCount++;
        expect(data.chunk).to.be.instanceOf(Float32Array);
        
        if (messageCount >= 5) {
          done();
        }
      });

      // Simulate streaming audio data
      const interval = setInterval(() => {
        ipcBridge.routeMessage('audio:stream', {
          chunk: new Float32Array(256),
          timestamp: Date.now()
        });
        
        if (messageCount >= 5) {
          clearInterval(interval);
        }
      }, 50);
    });

    it('should handle batch operations', async () => {
      const batchRequests = [
        { operation: 'file:read', data: { filePath: '/file1.wav' } },
        { operation: 'file:read', data: { filePath: '/file2.wav' } },
        { operation: 'file:read', data: { filePath: '/file3.wav' } }
      ];

      // Mock file system
      sinon.stub(require('fs').promises, 'readFile').resolves(Buffer.from(new ArrayBuffer(1024)));

      const results = await Promise.all(
        batchRequests.map(req => {
          const handler = mockElectron.ipcMain.handle.getCalls()
            .find(call => call.args[0] === req.operation)?.args[1];
          return handler({}, req.data);
        })
      );

      expect(results).to.have.length(3);
      results.forEach(result => {
        expect(result.success).to.be.true;
      });
    });

    it('should handle long-running operations with progress', (done) => {
      let progressUpdates = 0;
      
      // Set up progress handler
      ipcBridge.registerChannel('file:process:progress', (data) => {
        progressUpdates++;
        expect(data.progress).to.be.within(0, 100);
        
        if (data.progress === 100) {
          expect(progressUpdates).to.be.greaterThan(3);
          done();
        }
      });

      // Simulate long-running file processing
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        
        ipcBridge.routeMessage('file:process:progress', {
          progress,
          status: progress < 100 ? 'processing' : 'complete'
        });
        
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 50);
    });
  });

  describe('error handling and recovery', () => {
    it('should handle main process errors gracefully', async () => {
      // Mock file system error
      sinon.stub(require('fs').promises, 'readFile').rejects(new Error('File system error'));

      const message = createMockIPCMessage('file:read', {
        filePath: '/nonexistent/file.wav'
      });

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'file:read')?.args[1];

      const result = await handler({}, message.data);

      expect(result.success).to.be.false;
      expect(result.error).to.include('File system error');
    });

    it('should recover from communication failures', async () => {
      let attemptCount = 0;
      
      mockMainWindow.webContents.send.callsFake(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Communication failure');
        }
        return true;
      });

      const result = await ipcBridge.sendToRenderer('test:channel', {});

      expect(result.success).to.be.true;
      expect(attemptCount).to.equal(3);
    });

    it('should handle renderer crashes', async () => {
      // Simulate renderer crash
      mockMainWindow.webContents.send.throws(new Error('Renderer crashed'));
      mockMainWindow.isDestroyed.returns(true);

      const result = await ipcBridge.sendToRenderer('test:channel', {});

      expect(result.success).to.be.false;
      expect(result.error).to.include('Window destroyed');
    });

    it('should maintain message queue during recovery', async () => {
      const messages = [
        { channel: 'test:1', data: { id: 1 } },
        { channel: 'test:2', data: { id: 2 } },
        { channel: 'test:3', data: { id: 3 } }
      ];

      // Simulate temporary failure
      let callCount = 0;
      mockMainWindow.webContents.send.callsFake(() => {
        callCount++;
        if (callCount <= 3) {
          throw new Error('Temporary failure');
        }
        return true;
      });

      // Send messages during failure
      const results = await Promise.all(
        messages.map(msg => ipcBridge.sendToRenderer(msg.channel, msg.data))
      );

      // All should eventually succeed
      results.forEach(result => {
        expect(result.success).to.be.true;
      });
    });
  });

  describe('security and validation', () => {
    it('should validate message origins', async () => {
      const maliciousEvent = {
        sender: {
          getURL: () => 'file://malicious-script.js'
        }
      };

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'file:read')?.args[1];

      const result = await handler(maliciousEvent, {
        filePath: '/etc/passwd'
      });

      expect(result.success).to.be.false;
      expect(result.error).to.include('Invalid origin');
    });

    it('should sanitize file paths', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32\\config\\sam',
        '/dev/null',
        'CON:', // Windows device name
        '//network/share/file'
      ];

      for (const path of maliciousPaths) {
        try {
          fileManager.validateFilePath(path);
          expect.fail(`Should have rejected path: ${path}`);
        } catch (error) {
          expect(error.message).to.include('Invalid file path');
        }
      }
    });

    it('should prevent privilege escalation', async () => {
      const privilegedChannels = [
        'system:execute',
        'process:spawn',
        'fs:root:write',
        'registry:modify'
      ];

      for (const channel of privilegedChannels) {
        const result = await ipcBridge.routeMessage(channel, { command: 'test' });
        
        expect(result.success).to.be.false;
        expect(result.error).to.include('Protected channel');
      }
    });

    it('should enforce file size limits', async () => {
      const largePath = '/path/to/large/file.wav';
      
      sinon.stub(require('fs').promises, 'stat').resolves({ 
        size: 500 * 1024 * 1024 // 500MB
      });

      try {
        await fileManager.validateFileSize(largePath, 200 * 1024 * 1024);
        expect.fail('Should have rejected large file');
      } catch (error) {
        expect(error.message).to.include('File too large');
      }
    });
  });

  describe('performance and scalability', () => {
    it('should handle high message throughput', async () => {
      const messageCount = 1000;
      const startTime = Date.now();
      
      const promises = Array(messageCount).fill(0).map((_, i) => 
        ipcBridge.sendToRenderer(`test:${i}`, { index: i })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should handle 1000 messages in reasonable time
      expect(duration).to.be.lessThan(5000); // < 5 seconds
      
      const successCount = results.filter(r => r.success).length;
      expect(successCount).to.be.greaterThan(messageCount * 0.9); // >90% success
    });

    it('should manage memory efficiently during high load', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Generate high message load
      for (let i = 0; i < 10000; i++) {
        await ipcBridge.sendToRenderer('test:memory', { 
          data: new Array(1000).fill(i) 
        });
        
        if (i % 100 === 0) {
          // Allow garbage collection
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Should not leak excessive memory
      expect(memoryIncrease).to.be.lessThan(100 * 1024 * 1024); // < 100MB
    });

    it('should scale with multiple windows', async () => {
      // Create multiple windows
      const windowCount = 10;
      const windows = Array(windowCount).fill(0).map((_, i) => {
        const window = new mockElectron.BrowserWindow({});
        ipcBridge.addWindow(`window-${i}`, window);
        return window;
      });

      const message = { data: 'broadcast test' };
      const startTime = Date.now();
      
      ipcBridge.broadcast('test:broadcast', message);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should broadcast to all windows quickly
      expect(duration).to.be.lessThan(1000); // < 1 second
      
      // Verify all windows received the message
      windows.forEach(window => {
        expect(window.webContents.send.calledWith('test:broadcast', message)).to.be.true;
      });
    });

    it('should maintain responsiveness under load', async () => {
      // Start background message processing
      const backgroundPromise = (async () => {
        for (let i = 0; i < 1000; i++) {
          await ipcBridge.sendToRenderer('background:message', { index: i });
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      })();

      // Send priority message during background load
      const priorityStartTime = Date.now();
      const priorityResult = await ipcBridge.sendToRenderer('priority:message', {});
      const priorityDuration = Date.now() - priorityStartTime;
      
      // Priority message should be handled quickly despite background load
      expect(priorityDuration).to.be.lessThan(100); // < 100ms
      expect(priorityResult.success).to.be.true;
      
      await backgroundPromise;
    });
  });

  describe('lifecycle integration', () => {
    it('should handle application startup sequence', async () => {
      const startupEvents = [];
      
      // Monitor startup events
      ipcBridge.registerChannel('app:startup:step', (data) => {
        startupEvents.push(data.step);
      });

      // Simulate startup sequence
      const steps = [
        'services-initialized',
        'window-created',
        'ipc-ready',
        'ui-loaded',
        'ready'
      ];

      for (const step of steps) {
        await ipcBridge.routeMessage('app:startup:step', { step });
        await waitForIPC();
      }

      expect(startupEvents).to.deep.equal(steps);
    });

    it('should handle application shutdown sequence', async () => {
      const shutdownEvents = [];
      
      ipcBridge.registerChannel('app:shutdown:step', (data) => {
        shutdownEvents.push(data.step);
      });

      // Simulate shutdown sequence
      const steps = [
        'save-state',
        'close-files',
        'cleanup-resources',
        'dispose-services'
      ];

      for (const step of steps) {
        await ipcBridge.routeMessage('app:shutdown:step', { step });
        await waitForIPC();
      }

      expect(shutdownEvents).to.deep.equal(steps);
    });

    it('should persist communication state across restarts', async () => {
      // Simulate saving state
      const communicationState = {
        registeredChannels: ipcBridge.getRegisteredChannels(),
        performanceMetrics: ipcBridge.getPerformanceMetrics(),
        configuration: ipcBridge.getConfig()
      };

      // Simulate app restart
      ipcBridge.dispose();
      
      const newIpcBridge = new IPCBridge();
      await newIpcBridge.initialize(mockMainWindow);
      
      // Restore state
      newIpcBridge.restoreState(communicationState);

      expect(newIpcBridge.getRegisteredChannels().length).to.equal(
        communicationState.registeredChannels.length
      );
      
      newIpcBridge.dispose();
    });

    it('should handle window lifecycle events', async () => {
      const windowEvents = [];
      
      ipcBridge.registerChannel('window:event', (data) => {
        windowEvents.push(data.event);
      });

      // Simulate window lifecycle
      const events = ['created', 'ready', 'focus', 'blur', 'minimize', 'restore', 'close'];
      
      for (const event of events) {
        await ipcBridge.routeMessage('window:event', { event });
        await waitForIPC();
      }

      expect(windowEvents).to.deep.equal(events);
    });
  });
});
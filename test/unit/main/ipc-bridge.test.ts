/**
 * IPCBridge (Main Process) Tests
 */

import { expect, sinon } from '../../setup';
import { IPCBridge } from '../../../src/main/services/ipc-bridge';
import { 
  setupElectronTestEnvironment,
  createMockIPCMessage,
  waitForIPC
} from '../../fixtures/electron-fixtures';

describe('IPCBridge (Main Process)', () => {
  let ipcBridge: IPCBridge;
  let mockElectron: any;
  let mockMainWindow: any;

  beforeEach(() => {
    const { electronMain } = setupElectronTestEnvironment();
    mockElectron = electronMain;
    
    // Create mock main window
    mockMainWindow = new mockElectron.BrowserWindow({
      width: 1200,
      height: 800
    });
    
    ipcBridge = new IPCBridge();
  });

  afterEach(() => {
    if (ipcBridge && ipcBridge.isInitialized()) {
      ipcBridge.dispose();
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      expect(ipcBridge.isInitialized()).to.be.false;

      await ipcBridge.initialize(mockMainWindow);

      expect(ipcBridge.isInitialized()).to.be.true;
    });

    it('should set up IPC handlers during initialization', async () => {
      await ipcBridge.initialize(mockMainWindow);

      expect(mockElectron.ipcMain.handle.called).to.be.true;
      
      // Verify core IPC handlers are registered
      const handleCalls = mockElectron.ipcMain.handle.getCalls();
      const channels = handleCalls.map(call => call.args[0]);
      
      expect(channels).to.include('bridge:send');
      expect(channels).to.include('bridge:broadcast');
      expect(channels).to.include('bridge:register');
      expect(channels).to.include('bridge:unregister');
    });

    it('should set up event listeners', async () => {
      await ipcBridge.initialize(mockMainWindow);

      expect(mockElectron.ipcMain.on.called).to.be.true;
    });

    it('should require main window for initialization', async () => {
      try {
        await ipcBridge.initialize(null as any);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Main window is required');
      }
    });

    it('should not initialize twice', async () => {
      await ipcBridge.initialize(mockMainWindow);
      expect(ipcBridge.isInitialized()).to.be.true;

      // Second initialization should not throw
      await ipcBridge.initialize(mockMainWindow);
      expect(ipcBridge.isInitialized()).to.be.true;
    });
  });

  describe('message handling', () => {
    beforeEach(async () => {
      await ipcBridge.initialize(mockMainWindow);
    });

    it('should handle send message requests', async () => {
      const message = createMockIPCMessage('bridge:send', {
        channel: 'test:channel',
        data: { test: 'data' },
        targetWindow: 'main'
      });

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'bridge:send')?.args[1];

      expect(handler).to.exist;
      
      const result = await handler({}, message.data);
      
      expect(result.success).to.be.true;
      expect(mockMainWindow.webContents.send.calledWith('test:channel', { test: 'data' })).to.be.true;
    });

    it('should handle broadcast message requests', async () => {
      const message = createMockIPCMessage('bridge:broadcast', {
        channel: 'global:update',
        data: { status: 'playing' }
      });

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'bridge:broadcast')?.args[1];

      const result = await handler({}, message.data);
      
      expect(result.success).to.be.true;
      expect(mockMainWindow.webContents.send.calledWith('global:update', { status: 'playing' })).to.be.true;
    });

    it('should handle channel registration', async () => {
      const message = createMockIPCMessage('bridge:register', {
        channel: 'audio:events',
        handler: 'audioEventHandler'
      });

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'bridge:register')?.args[1];

      const result = await handler({}, message.data);
      
      expect(result.success).to.be.true;
      expect(ipcBridge.isChannelRegistered('audio:events')).to.be.true;
    });

    it('should handle channel unregistration', async () => {
      // First register a channel
      await ipcBridge.registerChannel('audio:events', () => {});
      expect(ipcBridge.isChannelRegistered('audio:events')).to.be.true;

      const message = createMockIPCMessage('bridge:unregister', {
        channel: 'audio:events'
      });

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'bridge:unregister')?.args[1];

      const result = await handler({}, message.data);
      
      expect(result.success).to.be.true;
      expect(ipcBridge.isChannelRegistered('audio:events')).to.be.false;
    });

    it('should validate message format', async () => {
      const invalidMessage = createMockIPCMessage('bridge:send', {
        // Missing required fields
        data: { test: 'data' }
      });

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'bridge:send')?.args[1];

      const result = await handler({}, invalidMessage.data);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('Invalid message format');
    });
  });

  describe('channel management', () => {
    beforeEach(async () => {
      await ipcBridge.initialize(mockMainWindow);
    });

    it('should register message channels', () => {
      const handler = sinon.spy();
      
      ipcBridge.registerChannel('test:channel', handler);

      expect(ipcBridge.isChannelRegistered('test:channel')).to.be.true;
    });

    it('should unregister message channels', () => {
      const handler = sinon.spy();
      
      ipcBridge.registerChannel('test:channel', handler);
      expect(ipcBridge.isChannelRegistered('test:channel')).to.be.true;

      ipcBridge.unregisterChannel('test:channel');
      expect(ipcBridge.isChannelRegistered('test:channel')).to.be.false;
    });

    it('should route messages to registered handlers', async () => {
      const handler = sinon.spy();
      ipcBridge.registerChannel('test:message', handler);

      await ipcBridge.routeMessage('test:message', { data: 'test' });

      expect(handler.calledWith({ data: 'test' })).to.be.true;
    });

    it('should handle messages for unregistered channels', async () => {
      const consoleSpy = sinon.spy(console, 'warn');

      await ipcBridge.routeMessage('unregistered:channel', { data: 'test' });

      expect(consoleSpy.calledWith(sinon.match('No handler registered for channel'))).to.be.true;
      
      consoleSpy.restore();
    });

    it('should prevent duplicate channel registration', () => {
      const handler1 = sinon.spy();
      const handler2 = sinon.spy();
      
      ipcBridge.registerChannel('test:channel', handler1);
      
      expect(() => {
        ipcBridge.registerChannel('test:channel', handler2);
      }).to.throw('Channel already registered');
    });
  });

  describe('bidirectional communication', () => {
    beforeEach(async () => {
      await ipcBridge.initialize(mockMainWindow);
    });

    it('should send messages to renderer', async () => {
      const channel = 'main:to:renderer';
      const data = { message: 'Hello from main' };

      await ipcBridge.sendToRenderer(channel, data);

      expect(mockMainWindow.webContents.send.calledWith(channel, data)).to.be.true;
    });

    it('should handle renderer responses', async () => {
      const responseHandler = sinon.spy();
      
      ipcBridge.sendToRenderer('request:data', { requestId: '123' }, responseHandler);

      // Simulate renderer response
      await ipcBridge.handleResponse('123', { result: 'success' });

      expect(responseHandler.calledWith({ result: 'success' })).to.be.true;
    });

    it('should timeout requests without response', (done) => {
      const responseHandler = sinon.spy();
      
      ipcBridge.sendToRenderer('request:data', { requestId: '456' }, responseHandler, 100);

      setTimeout(() => {
        expect(responseHandler.calledWith(sinon.match({ error: 'Timeout' }))).to.be.true;
        done();
      }, 150);
    });

    it('should handle request-response pattern', async () => {
      const requestData = { query: 'getAudioData' };
      const responseData = { audioData: [1, 2, 3] };

      // Set up response handler in renderer (simulated)
      ipcBridge.registerChannel('audio:query', async (data) => {
        expect(data).to.deep.equal(requestData);
        return responseData;
      });

      const result = await ipcBridge.request('audio:query', requestData);

      expect(result).to.deep.equal(responseData);
    });
  });

  describe('event broadcasting', () => {
    beforeEach(async () => {
      await ipcBridge.initialize(mockMainWindow);
    });

    it('should broadcast events to all windows', () => {
      const event = 'app:stateChanged';
      const data = { state: 'playing' };

      ipcBridge.broadcast(event, data);

      expect(mockMainWindow.webContents.send.calledWith(event, data)).to.be.true;
    });

    it('should handle multiple window broadcasting', () => {
      // Create additional mock windows
      const mockWindow2 = new mockElectron.BrowserWindow({});
      const mockWindow3 = new mockElectron.BrowserWindow({});
      
      ipcBridge.addWindow('second', mockWindow2);
      ipcBridge.addWindow('third', mockWindow3);

      const event = 'global:notification';
      const data = { message: 'Hello all windows' };

      ipcBridge.broadcast(event, data);

      expect(mockMainWindow.webContents.send.calledWith(event, data)).to.be.true;
      expect(mockWindow2.webContents.send.calledWith(event, data)).to.be.true;
      expect(mockWindow3.webContents.send.calledWith(event, data)).to.be.true;
    });

    it('should filter broadcasts by window type', () => {
      const mockDevWindow = new mockElectron.BrowserWindow({});
      ipcBridge.addWindow('devtools', mockDevWindow);

      const event = 'user:action';
      const data = { action: 'play' };

      ipcBridge.broadcast(event, data, { excludeDevTools: true });

      expect(mockMainWindow.webContents.send.calledWith(event, data)).to.be.true;
      expect(mockDevWindow.webContents.send.called).to.be.false;
    });

    it('should handle broadcast to specific window groups', () => {
      const mockAudioWindow = new mockElectron.BrowserWindow({});
      const mockVisualWindow = new mockElectron.BrowserWindow({});
      
      ipcBridge.addWindow('audio', mockAudioWindow);
      ipcBridge.addWindow('visual', mockVisualWindow);

      const event = 'audio:update';
      const data = { frequency: [1, 2, 3] };

      ipcBridge.broadcastToGroup(['main', 'visual'], event, data);

      expect(mockMainWindow.webContents.send.calledWith(event, data)).to.be.true;
      expect(mockVisualWindow.webContents.send.calledWith(event, data)).to.be.true;
      expect(mockAudioWindow.webContents.send.called).to.be.false;
    });
  });

  describe('security and validation', () => {
    beforeEach(async () => {
      await ipcBridge.initialize(mockMainWindow);
    });

    it('should validate message origins', async () => {
      const invalidOrigin = { sender: { getURL: () => 'file://malicious-script.js' } };
      
      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'bridge:send')?.args[1];

      const result = await handler(invalidOrigin, {
        channel: 'test:channel',
        data: { malicious: 'data' }
      });
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('Invalid origin');
    });

    it('should sanitize message data', async () => {
      const unsafeData = {
        script: '<script>alert("xss")</script>',
        eval: 'eval("malicious code")',
        __proto__: { malicious: true }
      };

      const sanitized = ipcBridge.sanitizeData(unsafeData);

      expect(sanitized.script).to.not.include('<script>');
      expect(sanitized.eval).to.not.include('eval(');
      expect(sanitized.__proto__).to.be.undefined;
    });

    it('should rate limit message sending', async () => {
      const channel = 'test:channel';
      const data = { test: 'data' };

      // Send multiple messages rapidly
      const promises = Array(20).fill(0).map(() => 
        ipcBridge.sendToRenderer(channel, data)
      );

      const results = await Promise.allSettled(promises);
      const rejectedCount = results.filter(r => r.status === 'rejected').length;

      expect(rejectedCount).to.be.greaterThan(0); // Some should be rate limited
    });

    it('should validate channel names', () => {
      const invalidChannels = [
        '', // Empty
        'invalid..channel', // Double dots
        'system:protected', // Protected namespace
        'a'.repeat(200) // Too long
      ];

      invalidChannels.forEach(channel => {
        expect(() => {
          ipcBridge.registerChannel(channel, () => {});
        }).to.throw('Invalid channel name');
      });
    });

    it('should prevent privilege escalation attempts', async () => {
      const maliciousMessage = createMockIPCMessage('bridge:send', {
        channel: 'system:executeCommand',
        data: { command: 'rm -rf /' }
      });

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'bridge:send')?.args[1];

      const result = await handler({}, maliciousMessage.data);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('Protected channel');
    });
  });

  describe('error handling and recovery', () => {
    beforeEach(async () => {
      await ipcBridge.initialize(mockMainWindow);
    });

    it('should handle window destruction gracefully', async () => {
      // Simulate window being destroyed
      mockMainWindow.isDestroyed = sinon.stub().returns(true);

      const result = await ipcBridge.sendToRenderer('test:channel', {});
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('Window destroyed');
    });

    it('should handle channel handler errors', async () => {
      const errorHandler = sinon.stub().throws(new Error('Handler error'));
      ipcBridge.registerChannel('error:channel', errorHandler);

      const result = await ipcBridge.routeMessage('error:channel', { data: 'test' });

      expect(result.success).to.be.false;
      expect(result.error).to.include('Handler error');
    });

    it('should implement message retry logic', async () => {
      let attemptCount = 0;
      mockMainWindow.webContents.send = sinon.stub().callsFake(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Network error');
        }
        return true;
      });

      const result = await ipcBridge.sendToRenderer('test:channel', {}, null, 1000, 3);
      
      expect(result.success).to.be.true;
      expect(attemptCount).to.equal(3);
    });

    it('should handle IPC communication failures', async () => {
      mockElectron.ipcMain.handle.throws(new Error('IPC failure'));

      // Should not crash the application
      expect(() => {
        ipcBridge.registerChannel('test:channel', () => {});
      }).to.not.throw();
    });

    it('should recover from temporary communication issues', async () => {
      // Simulate temporary network issue
      mockMainWindow.webContents.send
        .onFirstCall().throws(new Error('Temporary failure'))
        .onSecondCall().returns(true);

      const result = await ipcBridge.sendToRenderer('test:channel', {});
      
      expect(result.success).to.be.true;
    });
  });

  describe('performance monitoring', () => {
    beforeEach(async () => {
      await ipcBridge.initialize(mockMainWindow);
    });

    it('should track message throughput', async () => {
      const startTime = Date.now();
      
      // Send multiple messages
      for (let i = 0; i < 10; i++) {
        await ipcBridge.sendToRenderer(`test:channel:${i}`, { index: i });
      }

      const metrics = ipcBridge.getPerformanceMetrics();
      
      expect(metrics.messagesSent).to.equal(10);
      expect(metrics.averageLatency).to.be.a('number');
      expect(metrics.throughput).to.be.greaterThan(0);
    });

    it('should detect slow handlers', async () => {
      const slowHandler = sinon.stub().callsFake(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { result: 'slow' };
      });
      
      ipcBridge.registerChannel('slow:channel', slowHandler);

      await ipcBridge.routeMessage('slow:channel', {});

      const metrics = ipcBridge.getChannelMetrics('slow:channel');
      expect(metrics.averageProcessingTime).to.be.greaterThan(90);
    });

    it('should monitor memory usage', () => {
      // Generate many messages to test memory usage
      for (let i = 0; i < 1000; i++) {
        ipcBridge.registerChannel(`temp:${i}`, () => {});
      }

      const metrics = ipcBridge.getPerformanceMetrics();
      expect(metrics.registeredChannels).to.equal(1000);
    });
  });

  describe('disposal and cleanup', () => {
    it('should dispose correctly', async () => {
      await ipcBridge.initialize(mockMainWindow);
      expect(ipcBridge.isDisposed()).to.be.false;

      ipcBridge.dispose();

      expect(ipcBridge.isDisposed()).to.be.true;
    });

    it('should handle multiple dispose calls', async () => {
      await ipcBridge.initialize(mockMainWindow);

      ipcBridge.dispose();
      ipcBridge.dispose(); // Should not throw

      expect(ipcBridge.isDisposed()).to.be.true;
    });

    it('should clean up IPC handlers on disposal', async () => {
      await ipcBridge.initialize(mockMainWindow);
      
      ipcBridge.dispose();

      expect(mockElectron.ipcMain.removeHandler.called).to.be.true;
      expect(mockElectron.ipcMain.removeAllListeners.called).to.be.true;
    });

    it('should unregister all channels on disposal', async () => {
      await ipcBridge.initialize(mockMainWindow);
      
      ipcBridge.registerChannel('test:channel1', () => {});
      ipcBridge.registerChannel('test:channel2', () => {});
      
      expect(ipcBridge.getRegisteredChannels().length).to.equal(2);

      ipcBridge.dispose();

      expect(ipcBridge.getRegisteredChannels().length).to.equal(0);
    });

    it('should cancel pending requests on disposal', async () => {
      await ipcBridge.initialize(mockMainWindow);
      
      const responseHandler = sinon.spy();
      ipcBridge.sendToRenderer('test:request', {}, responseHandler);

      ipcBridge.dispose();

      expect(responseHandler.calledWith(sinon.match({ error: 'Bridge disposed' }))).to.be.true;
    });

    it('should clear performance metrics on disposal', async () => {
      await ipcBridge.initialize(mockMainWindow);
      
      // Generate some metrics
      await ipcBridge.sendToRenderer('test:channel', {});
      
      expect(ipcBridge.getPerformanceMetrics().messagesSent).to.be.greaterThan(0);

      ipcBridge.dispose();

      const metrics = ipcBridge.getPerformanceMetrics();
      expect(metrics.messagesSent).to.equal(0);
    });
  });
});
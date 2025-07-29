/**
 * FileManager (Main Process) Tests
 */

import { expect, sinon } from '../../setup';
import { FileManager } from '../../../src/main/services/file-manager';
import { 
  setupElectronTestEnvironment,
  createMockFileSystem,
  createMockIPCMessage
} from '../../fixtures/electron-fixtures';
import { SAMPLE_AUDIO_FILE } from '../../fixtures/audio-fixtures';

describe('FileManager (Main Process)', () => {
  let fileManager: FileManager;
  let mockElectron: any;
  let mockFileSystem: any;

  beforeEach(() => {
    const { electronMain } = setupElectronTestEnvironment();
    mockElectron = electronMain;
    mockFileSystem = createMockFileSystem();
    
    fileManager = new FileManager();
  });

  afterEach(() => {
    if (fileManager && fileManager.isInitialized()) {
      fileManager.dispose();
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      expect(fileManager.isInitialized()).to.be.false;

      await fileManager.initialize();

      expect(fileManager.isInitialized()).to.be.true;
    });

    it('should set up IPC handlers during initialization', async () => {
      await fileManager.initialize();

      expect(mockElectron.ipcMain.handle.called).to.be.true;
      
      // Verify specific handlers are registered
      const handleCalls = mockElectron.ipcMain.handle.getCalls();
      const channels = handleCalls.map(call => call.args[0]);
      
      expect(channels).to.include('file:open');
      expect(channels).to.include('file:save');
      expect(channels).to.include('file:read');
      expect(channels).to.include('file:write');
      expect(channels).to.include('file:exists');
    });

    it('should not initialize twice', async () => {
      await fileManager.initialize();
      expect(fileManager.isInitialized()).to.be.true;

      // Second initialization should not throw
      await fileManager.initialize();
      expect(fileManager.isInitialized()).to.be.true;
    });
  });

  describe('file dialog operations', () => {
    beforeEach(async () => {
      await fileManager.initialize();
    });

    it('should open file dialog', async () => {
      mockElectron.dialog.showOpenDialog.resolves({
        canceled: false,
        filePaths: ['/path/to/audio/file.wav']
      });

      const result = await fileManager.showOpenDialog({
        title: 'Open Audio File',
        filters: [
          { name: 'Audio Files', extensions: ['wav', 'mp3', 'flac'] }
        ]
      });

      expect(result.canceled).to.be.false;
      expect(result.filePaths).to.deep.equal(['/path/to/audio/file.wav']);
      expect(mockElectron.dialog.showOpenDialog.calledOnce).to.be.true;
    });

    it('should handle canceled file dialog', async () => {
      mockElectron.dialog.showOpenDialog.resolves({
        canceled: true,
        filePaths: []
      });

      const result = await fileManager.showOpenDialog({
        title: 'Open Audio File'
      });

      expect(result.canceled).to.be.true;
      expect(result.filePaths).to.be.empty;
    });

    it('should open save dialog', async () => {
      mockElectron.dialog.showSaveDialog.resolves({
        canceled: false,
        filePath: '/path/to/save/output.wav'
      });

      const result = await fileManager.showSaveDialog({
        title: 'Save Audio File',
        defaultPath: 'output.wav',
        filters: [
          { name: 'WAV Files', extensions: ['wav'] }
        ]
      });

      expect(result.canceled).to.be.false;
      expect(result.filePath).to.equal('/path/to/save/output.wav');
      expect(mockElectron.dialog.showSaveDialog.calledOnce).to.be.true;
    });

    it('should validate file filters', async () => {
      const options = {
        title: 'Open Audio File',
        filters: [
          { name: 'Audio Files', extensions: ['wav', 'mp3', 'flac'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      };

      await fileManager.showOpenDialog(options);

      const dialogCall = mockElectron.dialog.showOpenDialog.getCall(0);
      expect(dialogCall.args[1]).to.deep.include(options);
    });
  });

  describe('file system operations', () => {
    beforeEach(async () => {
      await fileManager.initialize();
      
      // Mock fs operations
      sinon.stub(require('fs').promises, 'readFile').callsFake(mockFileSystem.readFile);
      sinon.stub(require('fs').promises, 'writeFile').callsFake(mockFileSystem.writeFile);
      sinon.stub(require('fs').promises, 'stat').callsFake(mockFileSystem.stat);
      sinon.stub(require('fs').promises, 'access').callsFake(() => Promise.resolve());
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should read file contents', async () => {
      const filePath = '/path/to/audio/file.wav';
      
      const content = await fileManager.readFile(filePath);

      expect(content).to.be.instanceOf(ArrayBuffer);
      expect(content.byteLength).to.equal(1024);
    });

    it('should write file contents', async () => {
      const filePath = '/path/to/output/file.wav';
      const data = new ArrayBuffer(2048);
      
      await fileManager.writeFile(filePath, data);

      expect(mockFileSystem.writeFile.called).to.be.true;
    });

    it('should check file existence', async () => {
      const filePath = '/path/to/existing/file.wav';
      
      const exists = await fileManager.fileExists(filePath);

      expect(exists).to.be.true;
    });

    it('should get file information', async () => {
      const filePath = '/path/to/audio/file.wav';
      
      const info = await fileManager.getFileInfo(filePath);

      expect(info).to.have.property('size');
      expect(info).to.have.property('mtime');
      expect(info).to.have.property('isFile');
      expect(info.size).to.equal(1024000);
      expect(info.isFile()).to.be.true;
    });

    it('should handle file not found errors', async () => {
      const filePath = '/path/to/nonexistent/file.wav';
      
      sinon.stub(require('fs').promises, 'access').rejects(new Error('ENOENT'));

      try {
        await fileManager.readFile(filePath);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('File not found');
      }
    });

    it('should handle permission errors', async () => {
      const filePath = '/restricted/file.wav';
      
      sinon.stub(require('fs').promises, 'readFile').rejects(new Error('EACCES'));

      try {
        await fileManager.readFile(filePath);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Permission denied');
      }
    });
  });

  describe('directory operations', () => {
    beforeEach(async () => {
      await fileManager.initialize();
      
      sinon.stub(require('fs').promises, 'readdir').callsFake(mockFileSystem.readdir);
      sinon.stub(require('fs').promises, 'mkdir').callsFake(mockFileSystem.mkdir);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should list directory contents', async () => {
      const dirPath = '/path/to/audio/directory';
      
      const files = await fileManager.listDirectory(dirPath);

      expect(files).to.be.an('array');
      expect(files).to.include('file1.wav');
      expect(files).to.include('file2.wav');
    });

    it('should create directory', async () => {
      const dirPath = '/path/to/new/directory';
      
      await fileManager.createDirectory(dirPath);

      expect(mockFileSystem.mkdir.calledWith(dirPath)).to.be.true;
    });

    it('should create directory recursively', async () => {
      const dirPath = '/path/to/deeply/nested/directory';
      
      await fileManager.createDirectory(dirPath, { recursive: true });

      expect(mockFileSystem.mkdir.calledWith(dirPath, { recursive: true })).to.be.true;
    });

    it('should filter directory contents by extension', async () => {
      const dirPath = '/path/to/mixed/directory';
      
      // Mock directory with mixed file types
      sinon.stub(require('fs').promises, 'readdir').resolves([
        'audio1.wav', 'audio2.mp3', 'image.jpg', 'document.txt', 'audio3.flac'
      ]);

      const audioFiles = await fileManager.listDirectory(dirPath, {
        extensions: ['wav', 'mp3', 'flac']
      });

      expect(audioFiles).to.have.length(3);
      expect(audioFiles).to.include('audio1.wav');
      expect(audioFiles).to.include('audio2.mp3');
      expect(audioFiles).to.include('audio3.flac');
      expect(audioFiles).to.not.include('image.jpg');
      expect(audioFiles).to.not.include('document.txt');
    });
  });

  describe('file validation', () => {
    beforeEach(async () => {
      await fileManager.initialize();
    });

    it('should validate audio file extensions', () => {
      const validFiles = [
        'song.wav', 'track.mp3', 'audio.flac', 'sound.aiff'
      ];
      
      validFiles.forEach(filename => {
        expect(fileManager.isValidAudioFile(filename)).to.be.true;
      });
    });

    it('should reject invalid audio file extensions', () => {
      const invalidFiles = [
        'image.jpg', 'document.pdf', 'video.mp4', 'data.json'
      ];
      
      invalidFiles.forEach(filename => {
        expect(fileManager.isValidAudioFile(filename)).to.be.false;
      });
    });

    it('should validate file size limits', async () => {
      const largePath = '/path/to/large/file.wav';
      const smallPath = '/path/to/small/file.wav';
      
      sinon.stub(require('fs').promises, 'stat')
        .withArgs(largePath).resolves({ size: 300 * 1024 * 1024 }) // 300MB
        .withArgs(smallPath).resolves({ size: 10 * 1024 * 1024 }); // 10MB

      const largeFileValid = await fileManager.validateFileSize(largePath, 200 * 1024 * 1024);
      const smallFileValid = await fileManager.validateFileSize(smallPath, 200 * 1024 * 1024);

      expect(largeFileValid).to.be.false;
      expect(smallFileValid).to.be.true;
    });

    it('should validate file header for audio format', async () => {
      const wavPath = '/path/to/file.wav';
      
      // Mock WAV file header
      const wavHeader = new ArrayBuffer(44);
      const view = new DataView(wavHeader);
      view.setUint32(0, 0x52494646, false); // 'RIFF'
      view.setUint32(8, 0x57415645, false); // 'WAVE'
      
      sinon.stub(require('fs').promises, 'readFile').resolves(Buffer.from(wavHeader));

      const isValid = await fileManager.validateAudioFormat(wavPath);

      expect(isValid).to.be.true;
    });
  });

  describe('recent files management', () => {
    beforeEach(async () => {
      await fileManager.initialize();
    });

    it('should add file to recent files', () => {
      const filePath = '/path/to/recent/file.wav';
      
      fileManager.addToRecentFiles(filePath);

      const recentFiles = fileManager.getRecentFiles();
      expect(recentFiles).to.include(filePath);
    });

    it('should limit recent files list', () => {
      // Add more files than the limit
      for (let i = 0; i < 15; i++) {
        fileManager.addToRecentFiles(`/path/to/file${i}.wav`);
      }

      const recentFiles = fileManager.getRecentFiles();
      expect(recentFiles.length).to.be.at.most(10); // Assuming max 10 recent files
    });

    it('should move existing file to top of recent files', () => {
      const filePath = '/path/to/file.wav';
      
      fileManager.addToRecentFiles('/path/to/other1.wav');
      fileManager.addToRecentFiles('/path/to/other2.wav');
      fileManager.addToRecentFiles(filePath);
      fileManager.addToRecentFiles('/path/to/other3.wav');
      
      // Add same file again
      fileManager.addToRecentFiles(filePath);

      const recentFiles = fileManager.getRecentFiles();
      expect(recentFiles[0]).to.equal(filePath);
    });

    it('should clear recent files', () => {
      fileManager.addToRecentFiles('/path/to/file1.wav');
      fileManager.addToRecentFiles('/path/to/file2.wav');
      
      expect(fileManager.getRecentFiles().length).to.be.greaterThan(0);

      fileManager.clearRecentFiles();

      expect(fileManager.getRecentFiles()).to.be.empty;
    });

    it('should persist recent files', async () => {
      const filePath = '/path/to/persistent/file.wav';
      
      fileManager.addToRecentFiles(filePath);
      await fileManager.saveRecentFiles();

      // Simulate app restart
      const newFileManager = new FileManager();
      await newFileManager.initialize();
      await newFileManager.loadRecentFiles();

      const recentFiles = newFileManager.getRecentFiles();
      expect(recentFiles).to.include(filePath);
      
      newFileManager.dispose();
    });
  });

  describe('file watching', () => {
    beforeEach(async () => {
      await fileManager.initialize();
    });

    it('should watch file for changes', () => {
      const filePath = '/path/to/watched/file.wav';
      const changeHandler = sinon.spy();
      
      fileManager.watchFile(filePath, changeHandler);

      expect(fileManager.isWatching(filePath)).to.be.true;
    });

    it('should detect file changes', (done) => {
      const filePath = '/path/to/watched/file.wav';
      
      fileManager.watchFile(filePath, (eventType, filename) => {
        expect(eventType).to.equal('change');
        expect(filename).to.equal(filePath);
        done();
      });

      // Simulate file change
      setTimeout(() => {
        fileManager.simulateFileChange(filePath);
      }, 50);
    });

    it('should stop watching file', () => {
      const filePath = '/path/to/watched/file.wav';
      const changeHandler = sinon.spy();
      
      fileManager.watchFile(filePath, changeHandler);
      expect(fileManager.isWatching(filePath)).to.be.true;
      
      fileManager.unwatchFile(filePath);
      expect(fileManager.isWatching(filePath)).to.be.false;
    });

    it('should clean up watchers on disposal', () => {
      const filePath = '/path/to/watched/file.wav';
      const changeHandler = sinon.spy();
      
      fileManager.watchFile(filePath, changeHandler);
      expect(fileManager.isWatching(filePath)).to.be.true;
      
      fileManager.dispose();
      expect(fileManager.isWatching(filePath)).to.be.false;
    });
  });

  describe('IPC message handling', () => {
    beforeEach(async () => {
      await fileManager.initialize();
    });

    it('should handle file open requests', async () => {
      const message = createMockIPCMessage('file:open', {
        title: 'Open Audio File',
        filters: [{ name: 'Audio', extensions: ['wav'] }]
      });

      mockElectron.dialog.showOpenDialog.resolves({
        canceled: false,
        filePaths: ['/selected/file.wav']
      });

      // Simulate IPC call
      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'file:open')?.args[1];

      expect(handler).to.exist;
      
      const result = await handler({}, message.data);
      
      expect(result.success).to.be.true;
      expect(result.filePaths).to.include('/selected/file.wav');
    });

    it('should handle file read requests', async () => {
      const message = createMockIPCMessage('file:read', {
        filePath: '/path/to/file.wav'
      });

      sinon.stub(require('fs').promises, 'readFile')
        .resolves(Buffer.from(new ArrayBuffer(1024)));

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'file:read')?.args[1];

      const result = await handler({}, message.data);
      
      expect(result.success).to.be.true;
      expect(result.data).to.be.instanceOf(ArrayBuffer);
    });

    it('should handle file write requests', async () => {
      const message = createMockIPCMessage('file:write', {
        filePath: '/path/to/output.wav',
        data: new ArrayBuffer(2048)
      });

      sinon.stub(require('fs').promises, 'writeFile').resolves();

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'file:write')?.args[1];

      const result = await handler({}, message.data);
      
      expect(result.success).to.be.true;
    });

    it('should handle IPC errors gracefully', async () => {
      const message = createMockIPCMessage('file:read', {
        filePath: '/nonexistent/file.wav'
      });

      sinon.stub(require('fs').promises, 'readFile')
        .rejects(new Error('File not found'));

      const handler = mockElectron.ipcMain.handle.getCalls()
        .find(call => call.args[0] === 'file:read')?.args[1];

      const result = await handler({}, message.data);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('File not found');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await fileManager.initialize();
    });

    it('should handle file system errors', async () => {
      const filePath = '/inaccessible/file.wav';
      
      sinon.stub(require('fs').promises, 'readFile')
        .rejects(new Error('EACCES: permission denied'));

      try {
        await fileManager.readFile(filePath);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Permission denied');
      }
    });

    it('should handle network drive timeouts', async () => {
      const networkPath = '\\\\network\\drive\\file.wav';
      
      sinon.stub(require('fs').promises, 'stat')
        .rejects(new Error('ETIMEDOUT'));

      try {
        await fileManager.getFileInfo(networkPath);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Network timeout');
      }
    });

    it('should validate file paths', () => {
      const invalidPaths = ['', null, undefined, '../../../etc/passwd'];
      
      invalidPaths.forEach(path => {
        expect(() => fileManager.validateFilePath(path as any)).to.throw();
      });
    });
  });

  describe('disposal and cleanup', () => {
    it('should dispose correctly', async () => {
      await fileManager.initialize();
      expect(fileManager.isDisposed()).to.be.false;

      fileManager.dispose();

      expect(fileManager.isDisposed()).to.be.true;
    });

    it('should handle multiple dispose calls', async () => {
      await fileManager.initialize();

      fileManager.dispose();
      fileManager.dispose(); // Should not throw

      expect(fileManager.isDisposed()).to.be.true;
    });

    it('should clean up IPC handlers on disposal', async () => {
      await fileManager.initialize();
      
      fileManager.dispose();

      expect(mockElectron.ipcMain.removeHandler.called).to.be.true;
    });

    it('should stop all file watchers on disposal', async () => {
      await fileManager.initialize();
      
      fileManager.watchFile('/path/to/file1.wav', () => {});
      fileManager.watchFile('/path/to/file2.wav', () => {});
      
      expect(fileManager.getWatchedFiles().length).to.equal(2);

      fileManager.dispose();

      expect(fileManager.getWatchedFiles().length).to.equal(0);
    });
  });
});
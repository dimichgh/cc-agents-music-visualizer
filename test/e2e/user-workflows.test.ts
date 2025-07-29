/**
 * End-to-End User Workflow Tests
 */

import { expect, sinon } from '../setup';
import { 
  setupDOMEnvironment, 
  createTestContainer, 
  cleanupTestContainer,
  createMockDragEvent,
  createMockFile,
  waitForDOMUpdate
} from '../fixtures/dom-fixtures';
import { setupElectronTestEnvironment } from '../fixtures/electron-fixtures';
import { SAMPLE_AUDIO_FILE, createMockAudioBuffer } from '../fixtures/audio-fixtures';

describe('End-to-End User Workflows', () => {
  let container: HTMLElement;
  let mockElectron: any;

  before(() => {
    setupDOMEnvironment();
    const { electronRenderer } = setupElectronTestEnvironment();
    mockElectron = electronRenderer;
  });

  beforeEach(() => {
    container = createTestContainer();
  });

  afterEach(() => {
    cleanupTestContainer();
  });

  describe('File Loading Workflow', () => {
    it('should complete drag-and-drop file loading workflow', async () => {
      // Simulate user dragging audio file to application
      const audioFile = createMockFile('cosmic-symphony.wav', 5242880, 'audio/wav');
      const dragEvent = createMockDragEvent('drop', [audioFile]);

      container.dispatchEvent(dragEvent);
      await waitForDOMUpdate();

      // Should show loading state
      expect(container.querySelector('.loading-indicator')).to.exist;

      // Mock successful file processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should show audio controls
      expect(container.querySelector('.audio-controls')).to.exist;
      expect(container.querySelector('.play-button')).to.exist;
    });

    it('should handle file selection via dialog', async () => {
      // Mock file dialog
      mockElectron.ipcRenderer.invoke.withArgs('file:open').resolves({
        success: true,
        filePaths: ['/Users/test/music/track.wav']
      });

      // Trigger file open dialog
      const openButton = container.querySelector('[data-action="open-file"]') as HTMLElement;
      openButton?.click();

      await waitForDOMUpdate();

      // Should initiate file loading
      expect(mockElectron.ipcRenderer.invoke.calledWith('file:open')).to.be.true;
    });
  });

  describe('Playback Control Workflow', () => {
    beforeEach(async () => {
      // Setup with loaded file
      const audioFile = createMockFile('test.wav', 1024000, 'audio/wav');
      const dragEvent = createMockDragEvent('drop', [audioFile]);
      container.dispatchEvent(dragEvent);
      await waitForDOMUpdate();
    });

    it('should complete play/pause workflow', async () => {
      const playButton = container.querySelector('.play-button') as HTMLElement;
      
      // Start playback
      playButton?.click();
      await waitForDOMUpdate();

      expect(playButton?.classList.contains('playing')).to.be.true;
      expect(container.querySelector('.visualization-canvas')).to.exist;

      // Pause playback
      playButton?.click();
      await waitForDOMUpdate();

      expect(playButton?.classList.contains('playing')).to.be.false;
    });

    it('should handle volume control workflow', async () => {
      const volumeSlider = container.querySelector('.volume-slider') as HTMLInputElement;
      
      // Adjust volume
      volumeSlider.value = '0.7';
      volumeSlider.dispatchEvent(new Event('input'));
      await waitForDOMUpdate();

      // Should update UI and send volume change
      expect(volumeSlider.value).to.equal('0.7');
    });

    it('should handle seek workflow', async () => {
      const progressBar = container.querySelector('.progress-bar') as HTMLElement;
      
      // Click on progress bar to seek
      const seekEvent = new MouseEvent('click', {
        clientX: progressBar.offsetWidth * 0.5 // 50% position
      });
      progressBar.dispatchEvent(seekEvent);
      await waitForDOMUpdate();

      // Should update playback position
      expect(container.querySelector('.current-time')?.textContent).to.not.equal('00:00');
    });
  });

  describe('Visualization Workflow', () => {
    beforeEach(async () => {
      // Setup with loaded file and playback
      const audioFile = createMockFile('test.wav', 1024000, 'audio/wav');
      const dragEvent = createMockDragEvent('drop', [audioFile]);
      container.dispatchEvent(dragEvent);
      await waitForDOMUpdate();

      const playButton = container.querySelector('.play-button') as HTMLElement;
      playButton?.click();
      await waitForDOMUpdate();
    });

    it('should change visualization modes', async () => {
      const modeSelector = container.querySelector('.visualization-mode-selector') as HTMLSelectElement;
      
      // Change to cosmic mode
      modeSelector.value = 'cosmic';
      modeSelector.dispatchEvent(new Event('change'));
      await waitForDOMUpdate();

      // Should update visualization
      const canvas = container.querySelector('.visualization-canvas') as HTMLCanvasElement;
      expect(canvas.classList.contains('mode-cosmic')).to.be.true;
    });

    it('should adjust visualization intensity', async () => {
      const intensitySlider = container.querySelector('.intensity-slider') as HTMLInputElement;
      
      // Increase intensity
      intensitySlider.value = '0.9';
      intensitySlider.dispatchEvent(new Event('input'));
      await waitForDOMUpdate();

      // Should update visualization intensity
      expect(intensitySlider.value).to.equal('0.9');
    });

    it('should toggle fullscreen mode', async () => {
      const fullscreenButton = container.querySelector('.fullscreen-button') as HTMLElement;
      
      fullscreenButton?.click();
      await waitForDOMUpdate();

      // Should enter fullscreen mode
      expect(container.classList.contains('fullscreen')).to.be.true;
    });
  });

  describe('Settings Workflow', () => {
    it('should open and navigate settings panel', async () => {
      const settingsButton = container.querySelector('.settings-button') as HTMLElement;
      
      settingsButton?.click();
      await waitForDOMUpdate();

      // Should open settings panel
      const settingsPanel = container.querySelector('.settings-panel');
      expect(settingsPanel?.classList.contains('open')).to.be.true;

      // Navigate between settings tabs
      const audioTab = container.querySelector('[data-tab="audio"]') as HTMLElement;
      audioTab?.click();
      await waitForDOMUpdate();

      expect(container.querySelector('.audio-settings')).to.exist;
    });

    it('should change theme settings', async () => {
      const settingsButton = container.querySelector('.settings-button') as HTMLElement;
      settingsButton?.click();
      await waitForDOMUpdate();

      const themeSelector = container.querySelector('.theme-selector') as HTMLSelectElement;
      themeSelector.value = 'dark';
      themeSelector.dispatchEvent(new Event('change'));
      await waitForDOMUpdate();

      // Should apply dark theme
      expect(container.classList.contains('theme-dark')).to.be.true;
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle unsupported file format', async () => {
      const invalidFile = createMockFile('image.jpg', 500000, 'image/jpeg');
      const dragEvent = createMockDragEvent('drop', [invalidFile]);

      container.dispatchEvent(dragEvent);
      await waitForDOMUpdate();

      // Should show error message
      const errorMessage = container.querySelector('.error-notification');
      expect(errorMessage).to.exist;
      expect(errorMessage?.textContent).to.include('Unsupported file format');
    });

    it('should handle playback errors', async () => {
      // Mock audio context error
      const audioFile = createMockFile('corrupted.wav', 1024000, 'audio/wav');
      const dragEvent = createMockDragEvent('drop', [audioFile]);
      container.dispatchEvent(dragEvent);
      await waitForDOMUpdate();

      const playButton = container.querySelector('.play-button') as HTMLElement;
      playButton?.click();
      await waitForDOMUpdate();

      // Should show error state
      const errorState = container.querySelector('.error-state');
      expect(errorState).to.exist;
    });

    it('should provide error recovery options', async () => {
      const invalidFile = createMockFile('invalid.txt', 1000, 'text/plain');
      const dragEvent = createMockDragEvent('drop', [invalidFile]);
      container.dispatchEvent(dragEvent);
      await waitForDOMUpdate();

      const retryButton = container.querySelector('.error-retry-button') as HTMLElement;
      expect(retryButton).to.exist;

      retryButton?.click();
      await waitForDOMUpdate();

      // Should attempt recovery
      expect(container.querySelector('.file-selector')).to.exist;
    });
  });

  describe('Keyboard Navigation Workflow', () => {
    beforeEach(async () => {
      // Setup with loaded file
      const audioFile = createMockFile('test.wav', 1024000, 'audio/wav');
      const dragEvent = createMockDragEvent('drop', [audioFile]);
      container.dispatchEvent(dragEvent);
      await waitForDOMUpdate();
    });

    it('should navigate using keyboard shortcuts', async () => {
      // Test spacebar for play/pause
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      await waitForDOMUpdate();

      const playButton = container.querySelector('.play-button') as HTMLElement;
      expect(playButton?.classList.contains('playing')).to.be.true;

      // Test arrow keys for volume
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
      await waitForDOMUpdate();

      // Should increase volume
      const volumeSlider = container.querySelector('.volume-slider') as HTMLInputElement;
      expect(parseFloat(volumeSlider.value)).to.be.greaterThan(0.8);
    });

    it('should handle tab navigation', async () => {
      const firstFocusable = container.querySelector('[tabindex="0"]') as HTMLElement;
      firstFocusable?.focus();

      // Tab through focusable elements
      for (let i = 0; i < 5; i++) {
        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Tab' }));
        await waitForDOMUpdate();
      }

      // Should maintain focus within application
      expect(document.activeElement).to.be.instanceOf(HTMLElement);
    });
  });

  describe('Accessibility Workflow', () => {
    it('should provide screen reader announcements', async () => {
      const audioFile = createMockFile('test.wav', 1024000, 'audio/wav');
      const dragEvent = createMockDragEvent('drop', [audioFile]);
      container.dispatchEvent(dragEvent);
      await waitForDOMUpdate();

      // Should announce file loading
      const announcement = container.querySelector('[aria-live="polite"]');
      expect(announcement?.textContent).to.include('loaded');
    });

    it('should support high contrast mode', async () => {
      const settingsButton = container.querySelector('.settings-button') as HTMLElement;
      settingsButton?.click();
      await waitForDOMUpdate();

      const highContrastToggle = container.querySelector('.high-contrast-toggle') as HTMLInputElement;
      highContrastToggle?.click();
      await waitForDOMUpdate();

      // Should apply high contrast theme
      expect(container.classList.contains('high-contrast')).to.be.true;
    });

    it('should support reduced motion', async () => {
      const settingsButton = container.querySelector('.settings-button') as HTMLElement;
      settingsButton?.click();
      await waitForDOMUpdate();

      const reducedMotionToggle = container.querySelector('.reduced-motion-toggle') as HTMLInputElement;
      reducedMotionToggle?.click();
      await waitForDOMUpdate();

      // Should disable animations
      expect(container.classList.contains('reduced-motion')).to.be.true;
    });
  });

  describe('Multi-Window Workflow', () => {
    it('should handle visualization in separate window', async () => {
      const detachButton = container.querySelector('.detach-visualization') as HTMLElement;
      detachButton?.click();
      await waitForDOMUpdate();

      // Should request new window
      expect(mockElectron.ipcRenderer.invoke.calledWith('window:create')).to.be.true;
    });

    it('should sync state across windows', async () => {
      // Load file in main window
      const audioFile = createMockFile('test.wav', 1024000, 'audio/wav');
      const dragEvent = createMockDragEvent('drop', [audioFile]);
      container.dispatchEvent(dragEvent);
      await waitForDOMUpdate();

      // Start playback
      const playButton = container.querySelector('.play-button') as HTMLElement;
      playButton?.click();
      await waitForDOMUpdate();

      // Should broadcast state to other windows
      expect(mockElectron.ipcRenderer.send.calledWith('state:broadcast')).to.be.true;
    });
  });

  describe('Session Management Workflow', () => {
    it('should save and restore session state', async () => {
      // Load file and adjust settings
      const audioFile = createMockFile('test.wav', 1024000, 'audio/wav');
      const dragEvent = createMockDragEvent('drop', [audioFile]);
      container.dispatchEvent(dragEvent);
      await waitForDOMUpdate();

      const volumeSlider = container.querySelector('.volume-slider') as HTMLInputElement;
      volumeSlider.value = '0.6';
      volumeSlider.dispatchEvent(new Event('input'));
      await waitForDOMUpdate();

      // Simulate app close
      window.dispatchEvent(new Event('beforeunload'));
      await waitForDOMUpdate();

      // Should save session state
      expect(mockElectron.ipcRenderer.invoke.calledWith('session:save')).to.be.true;
    });

    it('should handle app restart workflow', async () => {
      // Mock restored session data
      mockElectron.ipcRenderer.invoke.withArgs('session:restore').resolves({
        volume: 0.6,
        lastFile: '/path/to/last/file.wav',
        visualMode: 'cosmic'
      });

      // Simulate app startup
      window.dispatchEvent(new Event('load'));
      await waitForDOMUpdate();

      // Should restore previous session
      const volumeSlider = container.querySelector('.volume-slider') as HTMLInputElement;
      expect(volumeSlider.value).to.equal('0.6');
    });
  });
});
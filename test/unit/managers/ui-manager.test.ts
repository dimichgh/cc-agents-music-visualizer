/**
 * UIManager Tests
 */

import { expect, sinon } from '../../setup';
import { UIManager } from '../../../src/renderer/managers/ui-manager';
import { StateManager } from '../../../src/renderer/managers/state-manager';
import { 
  setupDOMEnvironment, 
  createTestContainer, 
  cleanupTestContainer,
  createMockMouseEvent,
  createMockKeyboardEvent,
  waitForDOMUpdate
} from '../../fixtures/dom-fixtures';
import { SAMPLE_UI_STATE } from '../../fixtures/audio-fixtures';

describe('UIManager', () => {
  let uiManager: UIManager;
  let mockStateManager: sinon.SinonStubbedInstance<StateManager>;
  let container: HTMLElement;

  before(() => {
    setupDOMEnvironment();
  });

  beforeEach(() => {
    container = createTestContainer();
    
    // Create mocks
    mockStateManager = sinon.createStubInstance(StateManager);
    
    // Setup mock state manager
    mockStateManager.getState.returns({
      ui: SAMPLE_UI_STATE,
      audio: {
        isPlaying: false,
        currentFile: null,
        volume: 0.8,
        currentTime: 0,
        duration: 0
      },
      visual: {
        mode: 'cosmic',
        intensity: 0.8,
        colorPalette: 'cosmic'
      }
    } as any);

    mockStateManager.getCurrentPanel.returns('audio');
    mockStateManager.isPlaying.returns(false);
    mockStateManager.getVolume.returns(0.8);
    
    uiManager = new UIManager(mockStateManager as any);
  });

  afterEach(() => {
    if (uiManager && uiManager.isInitialized()) {
      uiManager.dispose();
    }
    cleanupTestContainer();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      expect(uiManager.isInitialized()).to.be.false;

      await uiManager.initialize(container);

      expect(uiManager.isInitialized()).to.be.true;
    });

    it('should create UI layout', async () => {
      await uiManager.initialize(container);

      const layout = container.querySelector('.app-layout');
      expect(layout).to.exist;
    });

    it('should initialize all UI components', async () => {
      await uiManager.initialize(container);

      // Check for main UI components
      expect(container.querySelector('.audio-controls')).to.exist;
      expect(container.querySelector('.file-manager')).to.exist;
      expect(container.querySelector('.settings-panel')).to.exist;
    });

    it('should set up event listeners', async () => {
      await uiManager.initialize(container);

      expect(mockStateManager.subscribe.called).to.be.true;
    });

    it('should not initialize twice', async () => {
      await uiManager.initialize(container);
      expect(uiManager.isInitialized()).to.be.true;

      // Second initialization should not throw
      await uiManager.initialize(container);
      expect(uiManager.isInitialized()).to.be.true;
    });
  });

  describe('panel management', () => {
    beforeEach(async () => {
      await uiManager.initialize(container);
    });

    it('should switch between panels', () => {
      uiManager.showPanel('visual');

      expect(mockStateManager.setState.calledWith(
        sinon.match({ ui: sinon.match({ currentPanel: 'visual' }) })
      )).to.be.true;
    });

    it('should handle panel visibility', () => {
      const panels = ['audio', 'visual', 'settings'] as const;
      
      panels.forEach(panel => {
        uiManager.showPanel(panel);
        expect(uiManager.getCurrentPanel()).to.equal(panel);
      });
    });

    it('should update panel content when state changes', async () => {
      uiManager.showPanel('audio');
      
      // Simulate state change
      const newState = {
        ...mockStateManager.getState(),
        audio: { ...mockStateManager.getState().audio, isPlaying: true }
      };
      mockStateManager.getState.returns(newState);
      
      uiManager.onStateChange(newState);
      
      await waitForDOMUpdate();
      
      // Check that UI reflects the state change
      const playButton = container.querySelector('.play-button');
      expect(playButton?.classList.contains('playing')).to.be.true;
    });

    it('should toggle panel visibility', () => {
      const panel = 'settings';
      
      uiManager.togglePanel(panel);
      expect(uiManager.isPanelVisible(panel)).to.be.true;
      
      uiManager.togglePanel(panel);
      expect(uiManager.isPanelVisible(panel)).to.be.false;
    });
  });

  describe('notification system', () => {
    beforeEach(async () => {
      await uiManager.initialize(container);
    });

    it('should show notifications', async () => {
      const notification = {
        type: 'info' as const,
        message: 'Test notification',
        duration: 3000
      };
      
      uiManager.showNotification(notification);
      
      await waitForDOMUpdate();
      
      const notificationElement = container.querySelector('.notification');
      expect(notificationElement).to.exist;
      expect(notificationElement?.textContent).to.include('Test notification');
    });

    it('should handle different notification types', async () => {
      const types = ['info', 'success', 'warning', 'error'] as const;
      
      for (const type of types) {
        uiManager.showNotification({
          type,
          message: `${type} notification`,
          duration: 1000
        });
        
        await waitForDOMUpdate();
        
        const notification = container.querySelector(`.notification--${type}`);
        expect(notification).to.exist;
        
        uiManager.clearNotifications();
      }
    });

    it('should auto-dismiss notifications', (done) => {
      uiManager.showNotification({
        type: 'info',
        message: 'Auto dismiss test',
        duration: 100
      });
      
      setTimeout(() => {
        const notification = container.querySelector('.notification');
        expect(notification).to.not.exist;
        done();
      }, 150);
    });

    it('should stack multiple notifications', async () => {
      uiManager.showNotification({ type: 'info', message: 'First', duration: 5000 });
      uiManager.showNotification({ type: 'warning', message: 'Second', duration: 5000 });
      uiManager.showNotification({ type: 'error', message: 'Third', duration: 5000 });
      
      await waitForDOMUpdate();
      
      const notifications = container.querySelectorAll('.notification');
      expect(notifications.length).to.equal(3);
    });

    it('should dismiss notifications manually', async () => {
      uiManager.showNotification({ 
        type: 'info', 
        message: 'Dismissible', 
        duration: 5000,
        dismissible: true 
      });
      
      await waitForDOMUpdate();
      
      const dismissButton = container.querySelector('.notification__dismiss');
      expect(dismissButton).to.exist;
      
      dismissButton?.dispatchEvent(createMockMouseEvent('click'));
      
      await waitForDOMUpdate();
      
      const notification = container.querySelector('.notification');
      expect(notification).to.not.exist;
    });
  });

  describe('theme management', () => {
    beforeEach(async () => {
      await uiManager.initialize(container);
    });

    it('should set theme', () => {
      uiManager.setTheme('dark');

      expect(mockStateManager.setState.calledWith(
        sinon.match({ ui: sinon.match({ theme: 'dark' }) })
      )).to.be.true;
    });

    it('should apply theme classes to container', () => {
      uiManager.setTheme('cosmic');

      expect(container.classList.contains('theme-cosmic')).to.be.true;
    });

    it('should remove previous theme classes', () => {
      uiManager.setTheme('light');
      expect(container.classList.contains('theme-light')).to.be.true;
      
      uiManager.setTheme('dark');
      expect(container.classList.contains('theme-light')).to.be.false;
      expect(container.classList.contains('theme-dark')).to.be.true;
    });

    it('should handle theme transitions', async () => {
      uiManager.setTheme('dark');
      
      await waitForDOMUpdate();
      
      // Should add transition class during theme change
      expect(container.classList.contains('theme-transitioning')).to.be.true;
      
      // Wait for transition to complete
      setTimeout(() => {
        expect(container.classList.contains('theme-transitioning')).to.be.false;
      }, 300);
    });
  });

  describe('keyboard shortcuts', () => {
    beforeEach(async () => {
      await uiManager.initialize(container);
    });

    it('should handle play/pause shortcut', () => {
      const spaceKeyEvent = createMockKeyboardEvent('keydown', ' ');
      document.dispatchEvent(spaceKeyEvent);

      expect(mockStateManager.dispatch.called).to.be.true;
    });

    it('should handle volume shortcuts', () => {
      const volumeUpEvent = createMockKeyboardEvent('keydown', 'ArrowUp');
      const volumeDownEvent = createMockKeyboardEvent('keydown', 'ArrowDown');
      
      document.dispatchEvent(volumeUpEvent);
      expect(mockStateManager.dispatch.called).to.be.true;
      
      document.dispatchEvent(volumeDownEvent);
      expect(mockStateManager.dispatch.callCount).to.be.greaterThan(1);
    });

    it('should handle panel navigation shortcuts', () => {
      const tabEvent = createMockKeyboardEvent('keydown', 'Tab');
      document.dispatchEvent(tabEvent);

      // Should cycle through panels
      expect(mockStateManager.setState.called).to.be.true;
    });

    it('should disable shortcuts when input is focused', () => {
      const input = document.createElement('input');
      container.appendChild(input);
      input.focus();
      
      const spaceKeyEvent = createMockKeyboardEvent('keydown', ' ');
      Object.defineProperty(spaceKeyEvent, 'target', { value: input });
      
      document.dispatchEvent(spaceKeyEvent);

      // Should not trigger play/pause when input is focused
      expect(mockStateManager.dispatch.called).to.be.false;
    });

    it('should handle modifier key combinations', () => {
      const ctrlEnterEvent = createMockKeyboardEvent('keydown', 'Enter', { ctrlKey: true });
      document.dispatchEvent(ctrlEnterEvent);

      // Should trigger specific action for Ctrl+Enter
      expect(mockStateManager.dispatch.called).to.be.true;
    });
  });

  describe('accessibility features', () => {
    beforeEach(async () => {
      await uiManager.initialize(container);
    });

    it('should set up proper ARIA attributes', () => {
      const mainElement = container.querySelector('main');
      expect(mainElement?.getAttribute('role')).to.equal('main');
      
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.getAttribute('tabindex')).to.not.equal('-1');
      });
    });

    it('should provide screen reader announcements', async () => {
      uiManager.announceToScreenReader('File loaded successfully');
      
      await waitForDOMUpdate();
      
      const announcement = container.querySelector('[aria-live="polite"]');
      expect(announcement?.textContent).to.include('File loaded successfully');
    });

    it('should handle focus management', () => {
      uiManager.showPanel('settings');
      
      // Should focus the first focusable element in the panel
      const settingsPanel = container.querySelector('.settings-panel');
      const focusableElement = settingsPanel?.querySelector('button, input, select, [tabindex]:not([tabindex="-1"])');
      
      expect(document.activeElement).to.equal(focusableElement);
    });

    it('should support high contrast mode', () => {
      uiManager.setHighContrast(true);

      expect(container.classList.contains('high-contrast')).to.be.true;
      expect(mockStateManager.setState.calledWith(
        sinon.match({ ui: sinon.match({ settings: sinon.match({ highContrast: true }) }) })
      )).to.be.true;
    });

    it('should support reduced motion', () => {
      uiManager.setReducedMotion(true);

      expect(container.classList.contains('reduced-motion')).to.be.true;
    });
  });

  describe('responsive behavior', () => {
    beforeEach(async () => {
      await uiManager.initialize(container);
    });

    it('should handle window resize', () => {
      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);

      // Should trigger layout recalculation
      expect(uiManager.getViewportSize()).to.have.property('width');
      expect(uiManager.getViewportSize()).to.have.property('height');
    });

    it('should adapt layout for mobile', () => {
      // Simulate mobile viewport
      sinon.stub(window, 'innerWidth').value(375);
      sinon.stub(window, 'innerHeight').value(667);
      
      uiManager.updateLayout();

      expect(container.classList.contains('mobile-layout')).to.be.true;
    });

    it('should handle orientation changes', () => {
      const orientationEvent = new Event('orientationchange');
      window.dispatchEvent(orientationEvent);

      // Should trigger layout update
      expect(uiManager.getCurrentOrientation()).to.be.oneOf(['portrait', 'landscape']);
    });

    it('should collapse panels on small screens', () => {
      // Simulate small screen
      sinon.stub(window, 'innerWidth').value(600);
      
      uiManager.updateLayout();

      // Panels should be collapsed by default on small screens
      expect(container.classList.contains('collapsed-panels')).to.be.true;
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await uiManager.initialize(container);
    });

    it('should display error messages', async () => {
      const error = new Error('Test error message');
      
      uiManager.showError(error);
      
      await waitForDOMUpdate();
      
      const errorDisplay = container.querySelector('.error-display');
      expect(errorDisplay).to.exist;
      expect(errorDisplay?.textContent).to.include('Test error message');
    });

    it('should handle file loading errors', async () => {
      const fileError = {
        type: 'file',
        message: 'Invalid file format',
        fileName: 'test.mp3'
      };
      
      uiManager.showFileError(fileError);
      
      await waitForDOMUpdate();
      
      const errorNotification = container.querySelector('.notification--error');
      expect(errorNotification).to.exist;
      expect(errorNotification?.textContent).to.include('Invalid file format');
      expect(errorNotification?.textContent).to.include('test.mp3');
    });

    it('should provide error recovery options', async () => {
      uiManager.showError(new Error('Playback failed'), {
        recoveryActions: [
          { text: 'Retry', action: () => {} },
          { text: 'Load Different File', action: () => {} }
        ]
      });
      
      await waitForDOMUpdate();
      
      const retryButton = container.querySelector('.error-action[data-action="retry"]');
      expect(retryButton).to.exist;
    });

    it('should clear errors when resolved', async () => {
      uiManager.showError(new Error('Test error'));
      
      await waitForDOMUpdate();
      expect(container.querySelector('.error-display')).to.exist;
      
      uiManager.clearErrors();
      
      await waitForDOMUpdate();
      expect(container.querySelector('.error-display')).to.not.exist;
    });
  });

  describe('loading states', () => {
    beforeEach(async () => {
      await uiManager.initialize(container);
    });

    it('should show loading indicators', async () => {
      uiManager.showLoading('Loading audio file...');
      
      await waitForDOMUpdate();
      
      const loadingIndicator = container.querySelector('.loading-indicator');
      expect(loadingIndicator).to.exist;
      expect(loadingIndicator?.textContent).to.include('Loading audio file');
    });

    it('should update loading progress', async () => {
      uiManager.showLoading('Processing...', { progress: true });
      
      await waitForDOMUpdate();
      
      uiManager.updateLoadingProgress(50);
      
      const progressBar = container.querySelector('.loading-progress');
      expect(progressBar).to.exist;
      expect(progressBar?.getAttribute('aria-valuenow')).to.equal('50');
    });

    it('should hide loading when complete', async () => {
      uiManager.showLoading('Loading...');
      
      await waitForDOMUpdate();
      expect(container.querySelector('.loading-indicator')).to.exist;
      
      uiManager.hideLoading();
      
      await waitForDOMUpdate();
      expect(container.querySelector('.loading-indicator')).to.not.exist;
    });
  });

  describe('event handling', () => {
    let eventHandler: sinon.SinonSpy;

    beforeEach(async () => {
      eventHandler = sinon.spy();
      await uiManager.initialize(container);
    });

    it('should emit UI events', () => {
      uiManager.on('panelChange', eventHandler);
      
      uiManager.showPanel('visual');

      expect(eventHandler.calledWith('visual')).to.be.true;
    });

    it('should emit notification events', () => {
      uiManager.on('notification', eventHandler);
      
      uiManager.showNotification({
        type: 'info',
        message: 'Test notification'
      });

      expect(eventHandler.called).to.be.true;
    });

    it('should emit error events', () => {
      uiManager.on('error', eventHandler);
      
      uiManager.showError(new Error('Test error'));

      expect(eventHandler.called).to.be.true;
    });

    it('should remove event listeners', () => {
      uiManager.on('panelChange', eventHandler);
      uiManager.off('panelChange', eventHandler);
      
      uiManager.showPanel('settings');
      expect(eventHandler.called).to.be.false;
    });
  });

  describe('disposal and cleanup', () => {
    it('should dispose correctly', async () => {
      await uiManager.initialize(container);
      expect(uiManager.isDisposed()).to.be.false;

      uiManager.dispose();

      expect(uiManager.isDisposed()).to.be.true;
    });

    it('should handle multiple dispose calls', async () => {
      await uiManager.initialize(container);

      uiManager.dispose();
      uiManager.dispose(); // Should not throw

      expect(uiManager.isDisposed()).to.be.true;
    });

    it('should clean up DOM elements on disposal', async () => {
      await uiManager.initialize(container);
      
      const layout = container.querySelector('.app-layout');
      expect(layout).to.exist;

      uiManager.dispose();

      const remainingLayout = container.querySelector('.app-layout');
      expect(remainingLayout).to.not.exist;
    });

    it('should remove event listeners on disposal', async () => {
      await uiManager.initialize(container);
      const eventHandler = sinon.spy();
      uiManager.on('panelChange', eventHandler);

      uiManager.dispose();

      uiManager.emit('panelChange', 'test');
      expect(eventHandler.called).to.be.false;
    });

    it('should clear notifications on disposal', async () => {
      await uiManager.initialize(container);
      
      uiManager.showNotification({ type: 'info', message: 'Test' });
      await waitForDOMUpdate();
      
      expect(container.querySelector('.notification')).to.exist;

      uiManager.dispose();

      expect(container.querySelector('.notification')).to.not.exist;
    });
  });
});
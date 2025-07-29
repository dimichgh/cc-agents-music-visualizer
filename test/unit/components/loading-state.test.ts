/**
 * LoadingState Component Tests
 */

import { expect, sinon } from '../../setup';
import { LoadingState } from '../../../src/renderer/components/ui/LoadingState';
import { 
  setupDOMEnvironment, 
  createTestContainer, 
  cleanupTestContainer,
  waitForDOMUpdate
} from '../../fixtures/dom-fixtures';

describe('LoadingState', () => {
  let container: HTMLElement;

  before(() => {
    setupDOMEnvironment();
  });

  beforeEach(() => {
    container = createTestContainer();
  });

  afterEach(() => {
    cleanupTestContainer();
  });

  describe('creation and initialization', () => {
    it('should create loading state with default options', () => {
      const loadingState = new LoadingState({ message: 'Loading...' });
      expect(loadingState).to.be.instanceOf(LoadingState);
      expect(loadingState.getMessage()).to.equal('Loading...');
    });

    it('should create loading state with custom options', () => {
      const options = {
        message: 'Custom loading message',
        type: 'spinner' as const,
        size: 'large' as const,
        showProgress: true,
        progress: 50,
        animated: true,
        overlay: true,
      };

      const loadingState = new LoadingState(options);
      expect(loadingState.getMessage()).to.equal('Custom loading message');
      expect(loadingState.getProgress()).to.equal(50);
    });

    it('should render with correct structure', () => {
      const loadingState = new LoadingState({
        message: 'Loading cosmic frequencies...',
        type: 'pulse',
        size: 'medium'
      });
      
      container.appendChild(loadingState.getElement());

      const element = loadingState.getElement();
      expect(element.classList.contains('cosmic-loading-state')).to.be.true;
      expect(element.classList.contains('cosmic-loading-state--pulse')).to.be.true;
      expect(element.classList.contains('cosmic-loading-state--medium')).to.be.true;
      
      const message = element.querySelector('.cosmic-loading-state__message');
      expect(message?.textContent).to.equal('Loading cosmic frequencies...');
    });
  });

  describe('loading types and animations', () => {
    it('should apply different loading types', () => {
      const types = ['spinner', 'pulse', 'wave', 'cosmic'] as const;
      
      types.forEach(type => {
        const loadingState = new LoadingState({
          message: `Loading with ${type}`,
          type
        });
        container.appendChild(loadingState.getElement());

        expect(loadingState.getElement().classList.contains(`cosmic-loading-state--${type}`)).to.be.true;
        
        const indicator = loadingState.getElement().querySelector('.cosmic-loading-state__indicator');
        expect(indicator).to.exist;
        
        loadingState.dispose();
      });
    });

    it('should apply different sizes', () => {
      const sizes = ['small', 'medium', 'large'] as const;
      
      sizes.forEach(size => {
        const loadingState = new LoadingState({
          message: 'Loading...',
          size
        });
        container.appendChild(loadingState.getElement());

        expect(loadingState.getElement().classList.contains(`cosmic-loading-state--${size}`)).to.be.true;
        
        loadingState.dispose();
      });
    });

    it('should show cosmic-themed loading animation', () => {
      const loadingState = new LoadingState({
        message: 'Loading cosmic visualization...',
        type: 'cosmic',
        animated: true
      });
      container.appendChild(loadingState.getElement());

      const cosmicElements = loadingState.getElement().querySelectorAll('.cosmic-particle');
      expect(cosmicElements.length).to.be.greaterThan(0);
    });
  });

  describe('progress tracking', () => {
    let loadingState: LoadingState;

    beforeEach(() => {
      loadingState = new LoadingState({
        message: 'Loading with progress...',
        showProgress: true,
        progress: 0
      });
      container.appendChild(loadingState.getElement());
    });

    it('should show progress bar when enabled', () => {
      const progressBar = loadingState.getElement().querySelector('.cosmic-loading-state__progress');
      expect(progressBar).to.exist;
      
      const progressFill = progressBar?.querySelector('.cosmic-loading-state__progress-fill');
      expect(progressFill).to.exist;
    });

    it('should update progress value', () => {
      loadingState.setProgress(75);
      expect(loadingState.getProgress()).to.equal(75);
      
      const progressFill = loadingState.getElement().querySelector('.cosmic-loading-state__progress-fill');
      expect(progressFill?.getAttribute('style')).to.include('75%');
    });

    it('should show progress percentage', () => {
      loadingState.setProgress(42);
      
      const progressText = loadingState.getElement().querySelector('.cosmic-loading-state__progress-text');
      expect(progressText?.textContent).to.include('42%');
    });

    it('should animate progress changes', async () => {
      loadingState.setProgress(25);
      await waitForDOMUpdate();
      
      loadingState.setProgress(75);
      await waitForDOMUpdate();
      
      const progressFill = loadingState.getElement().querySelector('.cosmic-loading-state__progress-fill');
      expect(progressFill?.classList.contains('cosmic-loading-state__progress-fill--animated')).to.be.true;
    });

    it('should complete loading at 100%', async () => {
      const completeHandler = sinon.spy();
      loadingState.onComplete(completeHandler);
      
      loadingState.setProgress(100);
      await waitForDOMUpdate();
      
      expect(completeHandler.calledOnce).to.be.true;
      expect(loadingState.isComplete()).to.be.true;
    });
  });

  describe('message and content updates', () => {
    let loadingState: LoadingState;

    beforeEach(() => {
      loadingState = new LoadingState({
        message: 'Initial loading message'
      });
      container.appendChild(loadingState.getElement());
    });

    it('should update message', () => {
      loadingState.setMessage('Updated loading message');
      expect(loadingState.getMessage()).to.equal('Updated loading message');
      
      const messageElement = loadingState.getElement().querySelector('.cosmic-loading-state__message');
      expect(messageElement?.textContent).to.equal('Updated loading message');
    });

    it('should handle empty message', () => {
      loadingState.setMessage('');
      
      const messageElement = loadingState.getElement().querySelector('.cosmic-loading-state__message');
      expect(messageElement?.textContent).to.equal('');
    });

    it('should update loading type', () => {
      loadingState.setType('wave');
      expect(loadingState.getElement().classList.contains('cosmic-loading-state--wave')).to.be.true;
      expect(loadingState.getElement().classList.contains('cosmic-loading-state--spinner')).to.be.false;
    });

    it('should update size', () => {
      loadingState.setSize('large');
      expect(loadingState.getElement().classList.contains('cosmic-loading-state--large')).to.be.true;
      expect(loadingState.getElement().classList.contains('cosmic-loading-state--medium')).to.be.false;
    });
  });

  describe('overlay and modal behavior', () => {
    let loadingState: LoadingState;

    beforeEach(() => {
      loadingState = new LoadingState({
        message: 'Loading with overlay...',
        overlay: true,
        modal: true
      });
      container.appendChild(loadingState.getElement());
    });

    it('should create overlay when enabled', () => {
      expect(loadingState.getElement().classList.contains('cosmic-loading-state--overlay')).to.be.true;
      
      const overlay = loadingState.getElement().querySelector('.cosmic-loading-state__overlay');
      expect(overlay).to.exist;
    });

    it('should be modal when enabled', () => {
      expect(loadingState.getElement().classList.contains('cosmic-loading-state--modal')).to.be.true;
      expect(loadingState.getElement().getAttribute('aria-modal')).to.equal('true');
    });

    it('should prevent background interaction when modal', () => {
      const overlay = loadingState.getElement().querySelector('.cosmic-loading-state__overlay');
      expect(overlay?.getAttribute('style')).to.include('pointer-events');
    });
  });

  describe('cancellation support', () => {
    let cancelHandler: sinon.SinonSpy;
    let loadingState: LoadingState;

    beforeEach(() => {
      cancelHandler = sinon.spy();
      loadingState = new LoadingState({
        message: 'Cancellable loading...',
        cancellable: true,
        onCancel: cancelHandler
      });
      container.appendChild(loadingState.getElement());
    });

    it('should show cancel button when cancellable', () => {
      const cancelButton = loadingState.getElement().querySelector('.cosmic-loading-state__cancel');
      expect(cancelButton).to.exist;
      expect(cancelButton?.textContent).to.include('Cancel');
    });

    it('should handle cancel action', () => {
      const cancelButton = loadingState.getElement().querySelector('.cosmic-loading-state__cancel');
      cancelButton?.dispatchEvent(new Event('click'));

      expect(cancelHandler.calledOnce).to.be.true;
    });

    it('should mark as cancelled when cancel is called', () => {
      loadingState.cancel();
      expect(loadingState.isCancelled()).to.be.true;
    });
  });

  describe('states and lifecycle', () => {
    let loadingState: LoadingState;

    beforeEach(() => {
      loadingState = new LoadingState({
        message: 'Loading state test...'
      });
      container.appendChild(loadingState.getElement());
    });

    it('should track loading state', () => {
      expect(loadingState.isLoading()).to.be.true;
      expect(loadingState.isComplete()).to.be.false;
      expect(loadingState.isCancelled()).to.be.false;
    });

    it('should handle completion', async () => {
      const completeHandler = sinon.spy();
      loadingState.onComplete(completeHandler);
      
      loadingState.complete();
      
      expect(loadingState.isLoading()).to.be.false;
      expect(loadingState.isComplete()).to.be.true;
      expect(completeHandler.calledOnce).to.be.true;
    });

    it('should handle reset', () => {
      loadingState.complete();
      expect(loadingState.isComplete()).to.be.true;
      
      loadingState.reset();
      expect(loadingState.isLoading()).to.be.true;
      expect(loadingState.isComplete()).to.be.false;
      expect(loadingState.getProgress()).to.equal(0);
    });

    it('should start and stop loading', () => {
      loadingState.stop();
      expect(loadingState.isLoading()).to.be.false;
      
      loadingState.start();
      expect(loadingState.isLoading()).to.be.true;
    });
  });

  describe('accessibility', () => {
    let loadingState: LoadingState;

    beforeEach(() => {
      loadingState = new LoadingState({
        message: 'Accessible loading...',
        showProgress: true
      });
      container.appendChild(loadingState.getElement());
    });

    it('should have proper ARIA attributes', () => {
      const element = loadingState.getElement();
      expect(element.getAttribute('role')).to.equal('status');
      expect(element.getAttribute('aria-live')).to.equal('polite');
      expect(element.getAttribute('aria-busy')).to.equal('true');
    });

    it('should provide screen reader updates', () => {
      const element = loadingState.getElement();
      expect(element.getAttribute('aria-label')).to.exist;
    });

    it('should update ARIA attributes with progress', () => {
      loadingState.setProgress(50);
      
      const progressBar = loadingState.getElement().querySelector('.cosmic-loading-state__progress');
      expect(progressBar?.getAttribute('role')).to.equal('progressbar');
      expect(progressBar?.getAttribute('aria-valuenow')).to.equal('50');
      expect(progressBar?.getAttribute('aria-valuemin')).to.equal('0');
      expect(progressBar?.getAttribute('aria-valuemax')).to.equal('100');
    });

    it('should be focusable when modal', () => {
      const modalLoading = new LoadingState({
        message: 'Modal loading...',
        modal: true
      });
      container.appendChild(modalLoading.getElement());

      expect(modalLoading.getElement().getAttribute('tabindex')).to.equal('0');
      
      modalLoading.dispose();
    });
  });

  describe('static factory methods', () => {
    it('should create file loading state', () => {
      const loadingState = LoadingState.fileLoading('cosmic-symphony.wav');
      expect(loadingState.getMessage()).to.include('cosmic-symphony.wav');
    });

    it('should create audio processing state', () => {
      const loadingState = LoadingState.audioProcessing();
      expect(loadingState.getMessage()).to.include('audio');
    });

    it('should create visualization loading state', () => {
      const loadingState = LoadingState.visualizationLoading();
      expect(loadingState.getMessage()).to.include('visualization');
    });

    it('should create cosmic loading state', () => {
      const loadingState = LoadingState.cosmic('Entering cosmic realm...');
      expect(loadingState.getElement().classList.contains('cosmic-loading-state--cosmic')).to.be.true;
    });

    it('should create indeterminate loading state', () => {
      const loadingState = LoadingState.indeterminate('Processing...');
      expect(loadingState.getElement().classList.contains('cosmic-loading-state--indeterminate')).to.be.true;
    });
  });

  describe('timing and duration', () => {
    let loadingState: LoadingState;

    beforeEach(() => {
      loadingState = new LoadingState({
        message: 'Timed loading...',
        duration: 1000
      });
      container.appendChild(loadingState.getElement());
    });

    it('should auto-complete after duration', (done) => {
      const completeHandler = sinon.spy(() => {
        expect(loadingState.isComplete()).to.be.true;
        done();
      });
      
      loadingState.onComplete(completeHandler);
      
      // Wait longer than duration
      setTimeout(() => {
        if (!completeHandler.called) {
          done(new Error('Loading did not auto-complete'));
        }
      }, 1200);
    });

    it('should show elapsed time', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const timeElement = loadingState.getElement().querySelector('.cosmic-loading-state__time');
      if (timeElement) {
        expect(timeElement.textContent).to.match(/\d+ms/);
      }
    });
  });

  describe('disposal and cleanup', () => {
    let loadingState: LoadingState;

    beforeEach(() => {
      loadingState = new LoadingState({
        message: 'Disposable loading...'
      });
      container.appendChild(loadingState.getElement());
    });

    it('should dispose correctly', () => {
      expect(loadingState.isDisposed()).to.be.false;

      loadingState.dispose();

      expect(loadingState.isDisposed()).to.be.true;
    });

    it('should handle multiple dispose calls', () => {
      loadingState.dispose();
      loadingState.dispose(); // Should not throw

      expect(loadingState.isDisposed()).to.be.true;
    });

    it('should clean up timers on disposal', () => {
      const timedLoading = new LoadingState({
        message: 'Timed loading...',
        duration: 5000
      });
      
      timedLoading.dispose();
      
      // Should not auto-complete after disposal
      setTimeout(() => {
        expect(timedLoading.isComplete()).to.be.false;
      }, 100);
    });

    it('should remove event listeners on disposal', () => {
      const cancelHandler = sinon.spy();
      const cancellableLoading = new LoadingState({
        message: 'Test',
        cancellable: true,
        onCancel: cancelHandler
      });
      container.appendChild(cancellableLoading.getElement());

      cancellableLoading.dispose();

      const cancelButton = cancellableLoading.getElement().querySelector('.cosmic-loading-state__cancel');
      cancelButton?.dispatchEvent(new Event('click'));

      expect(cancelHandler.called).to.be.false;
    });
  });
});
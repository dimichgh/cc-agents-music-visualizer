/**
 * ErrorState Component Tests
 */

import { expect, sinon } from '../../setup';
import { ErrorState } from '../../../src/renderer/components/ui/ErrorState';
import { 
  setupDOMEnvironment, 
  createTestContainer, 
  cleanupTestContainer,
  createMockMouseEvent,
  waitForDOMUpdate
} from '../../fixtures/dom-fixtures';

describe('ErrorState', () => {
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
    it('should create error state with default options', () => {
      const errorState = new ErrorState({ 
        message: 'Something went wrong',
        title: 'Error' 
      });
      
      expect(errorState).to.be.instanceOf(ErrorState);
      expect(errorState.getMessage()).to.equal('Something went wrong');
      expect(errorState.getTitle()).to.equal('Error');
    });

    it('should create error state with custom options', () => {
      const options = {
        title: 'Custom Error',
        message: 'Custom error message',
        type: 'critical' as const,
        showDetails: true,
        details: 'Detailed error information',
        retryable: true,
        dismissible: true,
      };

      const errorState = new ErrorState(options);
      expect(errorState.getTitle()).to.equal('Custom Error');
      expect(errorState.getMessage()).to.equal('Custom error message');
    });

    it('should render with correct structure', () => {
      const errorState = new ErrorState({
        title: 'Test Error',
        message: 'Test message',
        type: 'warning',
      });
      
      container.appendChild(errorState.getElement());

      const element = errorState.getElement();
      expect(element.classList.contains('cosmic-error-state')).to.be.true;
      expect(element.classList.contains('cosmic-error-state--warning')).to.be.true;
      
      const title = element.querySelector('.cosmic-error-state__title');
      expect(title?.textContent).to.equal('Test Error');
      
      const message = element.querySelector('.cosmic-error-state__message');
      expect(message?.textContent).to.equal('Test message');
    });
  });

  describe('error types and styling', () => {
    it('should apply error type styling', () => {
      const errorTypes = ['error', 'warning', 'critical'] as const;
      
      errorTypes.forEach(type => {
        const errorState = new ErrorState({
          title: 'Test',
          message: 'Test message',
          type
        });
        container.appendChild(errorState.getElement());

        expect(errorState.getElement().classList.contains(`cosmic-error-state--${type}`)).to.be.true;
        
        errorState.dispose();
      });
    });

    it('should show appropriate icons for different types', () => {
      const errorState = new ErrorState({
        title: 'Critical Error',
        message: 'Critical error message',
        type: 'critical'
      });
      container.appendChild(errorState.getElement());

      const icon = errorState.getElement().querySelector('.cosmic-error-state__icon');
      expect(icon).to.exist;
    });
  });

  describe('error details', () => {
    let errorState: ErrorState;

    beforeEach(() => {
      errorState = new ErrorState({
        title: 'Error with Details',
        message: 'Main error message',
        showDetails: true,
        details: 'Detailed error information\nStack trace line 1\nStack trace line 2'
      });
      container.appendChild(errorState.getElement());
    });

    it('should show details when enabled', () => {
      const detailsSection = errorState.getElement().querySelector('.cosmic-error-state__details');
      expect(detailsSection).to.exist;
    });

    it('should toggle details visibility', async () => {
      const toggleButton = errorState.getElement().querySelector('.cosmic-error-state__details-toggle');
      expect(toggleButton).to.exist;

      const detailsContent = errorState.getElement().querySelector('.cosmic-error-state__details-content');
      
      // Initially collapsed
      expect(detailsContent?.classList.contains('collapsed')).to.be.true;

      // Click to expand
      toggleButton?.dispatchEvent(createMockMouseEvent('click'));
      await waitForDOMUpdate();

      expect(detailsContent?.classList.contains('collapsed')).to.be.false;

      // Click to collapse
      toggleButton?.dispatchEvent(createMockMouseEvent('click'));
      await waitForDOMUpdate();

      expect(detailsContent?.classList.contains('collapsed')).to.be.true;
    });

    it('should format details properly', () => {
      const detailsContent = errorState.getElement().querySelector('.cosmic-error-state__details-content');
      expect(detailsContent?.textContent).to.include('Detailed error information');
      expect(detailsContent?.textContent).to.include('Stack trace line 1');
    });
  });

  describe('actions and buttons', () => {
    let retryHandler: sinon.SinonSpy;
    let dismissHandler: sinon.SinonSpy;
    let errorState: ErrorState;

    beforeEach(() => {
      retryHandler = sinon.spy();
      dismissHandler = sinon.spy();
      
      errorState = new ErrorState({
        title: 'Actionable Error',
        message: 'Error with actions',
        retryable: true,
        dismissible: true,
        onRetry: retryHandler,
        onDismiss: dismissHandler
      });
      container.appendChild(errorState.getElement());
    });

    it('should show retry button when retryable', () => {
      const retryButton = errorState.getElement().querySelector('.cosmic-error-state__retry');
      expect(retryButton).to.exist;
      expect(retryButton?.textContent).to.include('Retry');
    });

    it('should show dismiss button when dismissible', () => {
      const dismissButton = errorState.getElement().querySelector('.cosmic-error-state__dismiss');
      expect(dismissButton).to.exist;
    });

    it('should handle retry action', () => {
      const retryButton = errorState.getElement().querySelector('.cosmic-error-state__retry');
      retryButton?.dispatchEvent(createMockMouseEvent('click'));

      expect(retryHandler.calledOnce).to.be.true;
    });

    it('should handle dismiss action', () => {
      const dismissButton = errorState.getElement().querySelector('.cosmic-error-state__dismiss');
      dismissButton?.dispatchEvent(createMockMouseEvent('click'));

      expect(dismissHandler.calledOnce).to.be.true;
    });

    it('should handle custom actions', () => {
      const customHandler = sinon.spy();
      const customErrorState = new ErrorState({
        title: 'Custom Actions',
        message: 'Error with custom actions',
        actions: [
          { text: 'Custom Action', handler: customHandler, variant: 'primary' }
        ]
      });
      container.appendChild(customErrorState.getElement());

      const customButton = customErrorState.getElement().querySelector('.cosmic-error-state__action');
      expect(customButton).to.exist;
      expect(customButton?.textContent).to.include('Custom Action');

      customButton?.dispatchEvent(createMockMouseEvent('click'));
      expect(customHandler.calledOnce).to.be.true;

      customErrorState.dispose();
    });
  });

  describe('content updates', () => {
    let errorState: ErrorState;

    beforeEach(() => {
      errorState = new ErrorState({
        title: 'Original Title',
        message: 'Original message'
      });
      container.appendChild(errorState.getElement());
    });

    it('should update title', () => {
      errorState.setTitle('Updated Title');
      expect(errorState.getTitle()).to.equal('Updated Title');
      
      const titleElement = errorState.getElement().querySelector('.cosmic-error-state__title');
      expect(titleElement?.textContent).to.equal('Updated Title');
    });

    it('should update message', () => {
      errorState.setMessage('Updated message');
      expect(errorState.getMessage()).to.equal('Updated message');
      
      const messageElement = errorState.getElement().querySelector('.cosmic-error-state__message');
      expect(messageElement?.textContent).to.equal('Updated message');
    });

    it('should update error type', () => {
      errorState.setType('critical');
      expect(errorState.getElement().classList.contains('cosmic-error-state--critical')).to.be.true;
      expect(errorState.getElement().classList.contains('cosmic-error-state--error')).to.be.false;
    });

    it('should update details', () => {
      errorState.setDetails('New detailed information');
      
      const detailsContent = errorState.getElement().querySelector('.cosmic-error-state__details-content');
      expect(detailsContent?.textContent).to.include('New detailed information');
    });
  });

  describe('accessibility', () => {
    let errorState: ErrorState;

    beforeEach(() => {
      errorState = new ErrorState({
        title: 'Accessible Error',
        message: 'Accessible error message',
        type: 'error'
      });
      container.appendChild(errorState.getElement());
    });

    it('should have proper ARIA attributes', () => {
      const element = errorState.getElement();
      expect(element.getAttribute('role')).to.equal('alert');
      expect(element.getAttribute('aria-live')).to.equal('polite');
    });

    it('should have proper heading structure', () => {
      const title = errorState.getElement().querySelector('.cosmic-error-state__title');
      expect(title?.tagName.toLowerCase()).to.equal('h3');
      expect(title?.getAttribute('role')).to.equal('heading');
    });

    it('should have keyboard accessible buttons', () => {
      const retryableError = new ErrorState({
        title: 'Keyboard Accessible',
        message: 'Test message',
        retryable: true,
        dismissible: true
      });
      container.appendChild(retryableError.getElement());

      const buttons = retryableError.getElement().querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.getAttribute('tabindex')).to.not.equal('-1');
      });

      retryableError.dispose();
    });
  });

  describe('animations and transitions', () => {
    let errorState: ErrorState;

    beforeEach(() => {
      errorState = new ErrorState({
        title: 'Animated Error',
        message: 'Error with animations',
        animated: true
      });
      container.appendChild(errorState.getElement());
    });

    it('should apply animation classes', () => {
      expect(errorState.getElement().classList.contains('cosmic-error-state--animated')).to.be.true;
    });

    it('should handle entrance animations', async () => {
      errorState.show();
      await waitForDOMUpdate();

      expect(errorState.getElement().classList.contains('cosmic-error-state--visible')).to.be.true;
    });

    it('should handle exit animations', async () => {
      errorState.hide();
      await waitForDOMUpdate();

      expect(errorState.getElement().classList.contains('cosmic-error-state--hidden')).to.be.true;
    });
  });

  describe('static factory methods', () => {
    it('should create error state', () => {
      const errorState = ErrorState.error('Error title', 'Error message');
      expect(errorState.getElement().classList.contains('cosmic-error-state--error')).to.be.true;
    });

    it('should create warning state', () => {
      const errorState = ErrorState.warning('Warning title', 'Warning message');
      expect(errorState.getElement().classList.contains('cosmic-error-state--warning')).to.be.true;
    });

    it('should create critical state', () => {
      const errorState = ErrorState.critical('Critical title', 'Critical message');
      expect(errorState.getElement().classList.contains('cosmic-error-state--critical')).to.be.true;
    });

    it('should create file error state', () => {
      const errorState = ErrorState.fileError('file.wav', 'Invalid format');
      expect(errorState.getTitle()).to.include('File Error');
      expect(errorState.getMessage()).to.include('file.wav');
    });

    it('should create network error state', () => {
      const errorState = ErrorState.networkError('Connection failed');
      expect(errorState.getTitle()).to.include('Network Error');
    });

    it('should create audio error state', () => {
      const errorState = ErrorState.audioError('Playback failed');
      expect(errorState.getTitle()).to.include('Audio Error');
    });
  });

  describe('disposal and cleanup', () => {
    let errorState: ErrorState;

    beforeEach(() => {
      errorState = new ErrorState({
        title: 'Test Error',
        message: 'Test message'
      });
      container.appendChild(errorState.getElement());
    });

    it('should dispose correctly', () => {
      expect(errorState.isDisposed()).to.be.false;

      errorState.dispose();

      expect(errorState.isDisposed()).to.be.true;
    });

    it('should handle multiple dispose calls', () => {
      errorState.dispose();
      errorState.dispose(); // Should not throw

      expect(errorState.isDisposed()).to.be.true;
    });

    it('should remove event listeners on disposal', () => {
      const retryHandler = sinon.spy();
      const retryableError = new ErrorState({
        title: 'Test',
        message: 'Test',
        retryable: true,
        onRetry: retryHandler
      });
      container.appendChild(retryableError.getElement());

      retryableError.dispose();

      const retryButton = retryableError.getElement().querySelector('.cosmic-error-state__retry');
      retryButton?.dispatchEvent(createMockMouseEvent('click'));

      expect(retryHandler.called).to.be.false;
    });
  });
});
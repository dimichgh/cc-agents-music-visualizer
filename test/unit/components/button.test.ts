/**
 * Button Component Tests
 */

import { expect, sinon } from '../../setup';
import { CosmicButton } from '../../../src/renderer/components/ui/Button';
import { 
  setupDOMEnvironment, 
  createTestContainer, 
  cleanupTestContainer,
  createMockMouseEvent,
  createMockKeyboardEvent,
  waitForDOMUpdate
} from '../../fixtures/dom-fixtures';

describe('CosmicButton', () => {
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
    it('should create button with default options', () => {
      const button = new CosmicButton({ text: 'Test Button' });
      expect(button).to.be.instanceOf(CosmicButton);
      expect(button.getText()).to.equal('Test Button');
      expect(button.isEnabled()).to.be.true;
    });

    it('should create button with custom options', () => {
      const options = {
        text: 'Custom Button',
        variant: 'primary' as const,
        size: 'large' as const,
        disabled: true,
        icon: 'play',
        loading: false,
      };

      const button = new CosmicButton(options);
      expect(button.getText()).to.equal('Custom Button');
      expect(button.isEnabled()).to.be.false;
    });

    it('should render with correct CSS classes', () => {
      const button = new CosmicButton({ 
        text: 'Test', 
        variant: 'secondary',
        size: 'small' 
      });
      
      container.appendChild(button.getElement());

      const element = button.getElement();
      expect(element.classList.contains('cosmic-button')).to.be.true;
      expect(element.classList.contains('cosmic-button--secondary')).to.be.true;
      expect(element.classList.contains('cosmic-button--small')).to.be.true;
    });
  });

  describe('state management', () => {
    let button: CosmicButton;

    beforeEach(() => {
      button = new CosmicButton({ text: 'Test Button' });
      container.appendChild(button.getElement());
    });

    it('should handle enabled/disabled state', () => {
      expect(button.isEnabled()).to.be.true;
      expect(button.getElement().disabled).to.be.false;

      button.setEnabled(false);
      expect(button.isEnabled()).to.be.false;
      expect(button.getElement().disabled).to.be.true;

      button.setEnabled(true);
      expect(button.isEnabled()).to.be.true;
      expect(button.getElement().disabled).to.be.false;
    });

    it('should handle loading state', () => {
      expect(button.isLoading()).to.be.false;

      button.setLoading(true);
      expect(button.isLoading()).to.be.true;
      expect(button.getElement().classList.contains('cosmic-button--loading')).to.be.true;

      button.setLoading(false);
      expect(button.isLoading()).to.be.false;
      expect(button.getElement().classList.contains('cosmic-button--loading')).to.be.false;
    });

    it('should update text content', () => {
      expect(button.getText()).to.equal('Test Button');

      button.setText('Updated Text');
      expect(button.getText()).to.equal('Updated Text');
      expect(button.getElement().textContent).to.include('Updated Text');
    });

    it('should handle icon updates', () => {
      button.setIcon('play');
      const iconElement = button.getElement().querySelector('.cosmic-icon');
      expect(iconElement).to.exist;

      button.setIcon(null);
      const removedIcon = button.getElement().querySelector('.cosmic-icon');
      expect(removedIcon).to.not.exist;
    });
  });

  describe('event handling', () => {
    let button: CosmicButton;
    let clickHandler: sinon.SinonSpy;

    beforeEach(() => {
      clickHandler = sinon.spy();
      button = new CosmicButton({ 
        text: 'Test Button',
        onClick: clickHandler 
      });
      container.appendChild(button.getElement());
    });

    it('should handle click events', () => {
      const clickEvent = createMockMouseEvent('click');
      button.getElement().dispatchEvent(clickEvent);

      expect(clickHandler.calledOnce).to.be.true;
      expect(clickHandler.firstCall.args[0]).to.equal(clickEvent);
    });

    it('should not trigger click when disabled', () => {
      button.setEnabled(false);
      
      const clickEvent = createMockMouseEvent('click');
      button.getElement().dispatchEvent(clickEvent);

      expect(clickHandler.called).to.be.false;
    });

    it('should not trigger click when loading', () => {
      button.setLoading(true);
      
      const clickEvent = createMockMouseEvent('click');
      button.getElement().dispatchEvent(clickEvent);

      expect(clickHandler.called).to.be.false;
    });

    it('should handle keyboard events (Enter)', () => {
      const keyEvent = createMockKeyboardEvent('keydown', 'Enter');
      button.getElement().dispatchEvent(keyEvent);

      expect(clickHandler.calledOnce).to.be.true;
    });

    it('should handle keyboard events (Space)', () => {
      const keyEvent = createMockKeyboardEvent('keydown', ' ');
      button.getElement().dispatchEvent(keyEvent);

      expect(clickHandler.calledOnce).to.be.true;
    });

    it('should ignore other keyboard events', () => {
      const keyEvent = createMockKeyboardEvent('keydown', 'a');
      button.getElement().dispatchEvent(keyEvent);

      expect(clickHandler.called).to.be.false;
    });
  });

  describe('accessibility', () => {
    let button: CosmicButton;

    beforeEach(() => {
      button = new CosmicButton({ text: 'Accessible Button' });
      container.appendChild(button.getElement());
    });

    it('should have proper ARIA attributes', () => {
      const element = button.getElement();
      expect(element.getAttribute('role')).to.equal('button');
      expect(element.getAttribute('tabindex')).to.equal('0');
    });

    it('should update ARIA attributes when disabled', () => {
      button.setEnabled(false);
      const element = button.getElement();
      expect(element.getAttribute('aria-disabled')).to.equal('true');
      expect(element.getAttribute('tabindex')).to.equal('-1');
    });

    it('should update ARIA attributes when loading', () => {
      button.setLoading(true);
      const element = button.getElement();
      expect(element.getAttribute('aria-busy')).to.equal('true');
    });

    it('should have proper label for screen readers', () => {
      const element = button.getElement();
      expect(element.getAttribute('aria-label')).to.exist;
    });
  });

  describe('animation and effects', () => {
    let button: CosmicButton;

    beforeEach(() => {
      button = new CosmicButton({ text: 'Animated Button' });
      container.appendChild(button.getElement());
    });

    it('should add ripple effect on click', async () => {
      const clickEvent = createMockMouseEvent('click', 50, 50);
      button.getElement().dispatchEvent(clickEvent);

      await waitForDOMUpdate();

      const ripple = button.getElement().querySelector('.cosmic-ripple');
      expect(ripple).to.exist;
    });

    it('should remove ripple effect after animation', async () => {
      const clickEvent = createMockMouseEvent('click', 50, 50);
      button.getElement().dispatchEvent(clickEvent);

      await waitForDOMUpdate();

      // Simulate animation end
      const ripple = button.getElement().querySelector('.cosmic-ripple');
      if (ripple) {
        ripple.dispatchEvent(new Event('animationend'));
      }

      await waitForDOMUpdate();

      const remainingRipple = button.getElement().querySelector('.cosmic-ripple');
      expect(remainingRipple).to.not.exist;
    });
  });

  describe('variants and styling', () => {
    it('should apply primary variant styles', () => {
      const button = new CosmicButton({ 
        text: 'Primary', 
        variant: 'primary' 
      });
      container.appendChild(button.getElement());

      expect(button.getElement().classList.contains('cosmic-button--primary')).to.be.true;
    });

    it('should apply secondary variant styles', () => {
      const button = new CosmicButton({ 
        text: 'Secondary', 
        variant: 'secondary' 
      });
      container.appendChild(button.getElement());

      expect(button.getElement().classList.contains('cosmic-button--secondary')).to.be.true;
    });

    it('should apply danger variant styles', () => {
      const button = new CosmicButton({ 
        text: 'Danger', 
        variant: 'danger' 
      });
      container.appendChild(button.getElement());

      expect(button.getElement().classList.contains('cosmic-button--danger')).to.be.true;
    });

    it('should apply size variants', () => {
      const smallButton = new CosmicButton({ 
        text: 'Small', 
        size: 'small' 
      });
      const largeButton = new CosmicButton({ 
        text: 'Large', 
        size: 'large' 
      });

      container.appendChild(smallButton.getElement());
      container.appendChild(largeButton.getElement());

      expect(smallButton.getElement().classList.contains('cosmic-button--small')).to.be.true;
      expect(largeButton.getElement().classList.contains('cosmic-button--large')).to.be.true;
    });
  });

  describe('static factory methods', () => {
    it('should create primary button', () => {
      const button = CosmicButton.primary('Primary Button');
      expect(button.getElement().classList.contains('cosmic-button--primary')).to.be.true;
    });

    it('should create secondary button', () => {
      const button = CosmicButton.secondary('Secondary Button');
      expect(button.getElement().classList.contains('cosmic-button--secondary')).to.be.true;
    });

    it('should create danger button', () => {
      const button = CosmicButton.danger('Danger Button');
      expect(button.getElement().classList.contains('cosmic-button--danger')).to.be.true;
    });

    it('should create icon button', () => {
      const button = CosmicButton.icon('play', 'Play');
      const iconElement = button.getElement().querySelector('.cosmic-icon');
      expect(iconElement).to.exist;
    });

    it('should create loading button', () => {
      const button = CosmicButton.loading('Loading...');
      expect(button.isLoading()).to.be.true;
    });
  });

  describe('disposal and cleanup', () => {
    let button: CosmicButton;

    beforeEach(() => {
      button = new CosmicButton({ text: 'Test Button' });
      container.appendChild(button.getElement());
    });

    it('should dispose correctly', () => {
      expect(button.isDisposed()).to.be.false;

      button.dispose();

      expect(button.isDisposed()).to.be.true;
    });

    it('should handle multiple dispose calls', () => {
      button.dispose();
      button.dispose(); // Should not throw

      expect(button.isDisposed()).to.be.true;
    });

    it('should remove event listeners on disposal', () => {
      const clickHandler = sinon.spy();
      button.onClick(clickHandler);

      button.dispose();

      const clickEvent = createMockMouseEvent('click');
      button.getElement().dispatchEvent(clickEvent);

      expect(clickHandler.called).to.be.false;
    });
  });
});
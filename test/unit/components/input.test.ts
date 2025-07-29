/**
 * Input Component Tests
 */

import { expect, sinon } from '../../setup';
import { CosmicInput } from '../../../src/renderer/components/ui/Input';
import { 
  setupDOMEnvironment, 
  createTestContainer, 
  cleanupTestContainer,
  createMockKeyboardEvent,
  waitForDOMUpdate
} from '../../fixtures/dom-fixtures';

describe('CosmicInput', () => {
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
    it('should create input with default options', () => {
      const input = new CosmicInput({ type: 'text' });
      expect(input).to.be.instanceOf(CosmicInput);
      expect(input.getValue()).to.equal('');
      expect(input.isValid()).to.be.true;
    });

    it('should create input with custom options', () => {
      const options = {
        type: 'email' as const,
        placeholder: 'Enter email',
        value: 'test@example.com',
        required: true,
        disabled: false,
        label: 'Email Address',
      };

      const input = new CosmicInput(options);
      expect(input.getValue()).to.equal('test@example.com');
      expect(input.getElement().placeholder).to.equal('Enter email');
    });

    it('should render with correct structure', () => {
      const input = new CosmicInput({ 
        type: 'text',
        label: 'Test Input',
        placeholder: 'Enter text'
      });
      
      container.appendChild(input.getElement());

      const wrapper = input.getElement().closest('.cosmic-input-wrapper');
      expect(wrapper).to.exist;
      
      const label = wrapper?.querySelector('label');
      expect(label?.textContent).to.equal('Test Input');
      
      const inputElement = wrapper?.querySelector('input');
      expect(inputElement?.placeholder).to.equal('Enter text');
    });
  });

  describe('value management', () => {
    let input: CosmicInput;

    beforeEach(() => {
      input = new CosmicInput({ type: 'text' });
      container.appendChild(input.getElement());
    });

    it('should get and set values', () => {
      expect(input.getValue()).to.equal('');

      input.setValue('test value');
      expect(input.getValue()).to.equal('test value');
      expect(input.getElement().value).to.equal('test value');
    });

    it('should handle numeric values for number input', () => {
      const numberInput = new CosmicInput({ type: 'number' });
      container.appendChild(numberInput.getElement());

      numberInput.setValue('123.45');
      expect(numberInput.getValue()).to.equal('123.45');
      expect(numberInput.getNumericValue()).to.equal(123.45);
    });

    it('should return NaN for invalid numeric values', () => {
      const numberInput = new CosmicInput({ type: 'number' });
      numberInput.setValue('invalid');
      expect(numberInput.getNumericValue()).to.be.NaN;
    });

    it('should clear values', () => {
      input.setValue('test');
      expect(input.getValue()).to.equal('test');

      input.clear();
      expect(input.getValue()).to.equal('');
    });
  });

  describe('validation', () => {
    let input: CosmicInput;

    beforeEach(() => {
      input = new CosmicInput({ 
        type: 'email',
        required: true,
        validator: (value) => ({
          isValid: value.includes('@'),
          message: value.includes('@') ? '' : 'Must contain @ symbol'
        })
      });
      container.appendChild(input.getElement());
    });

    it('should validate required fields', () => {
      expect(input.isValid()).to.be.false; // Empty required field

      input.setValue('test@example.com');
      expect(input.isValid()).to.be.true;

      input.clear();
      expect(input.isValid()).to.be.false;
    });

    it('should use custom validator', () => {
      input.setValue('invalid-email');
      expect(input.isValid()).to.be.false;

      input.setValue('valid@email.com');
      expect(input.isValid()).to.be.true;
    });

    it('should display validation messages', async () => {
      input.setValue('invalid');
      input.validate();

      await waitForDOMUpdate();

      const errorMessage = container.querySelector('.cosmic-input__error');
      expect(errorMessage).to.exist;
      expect(errorMessage?.textContent).to.include('Must contain @ symbol');
    });

    it('should clear validation messages when valid', async () => {
      input.setValue('invalid');
      input.validate();
      await waitForDOMUpdate();

      input.setValue('valid@email.com');
      input.validate();
      await waitForDOMUpdate();

      const errorMessage = container.querySelector('.cosmic-input__error');
      expect(errorMessage?.textContent).to.be.empty;
    });
  });

  describe('state management', () => {
    let input: CosmicInput;

    beforeEach(() => {
      input = new CosmicInput({ type: 'text' });
      container.appendChild(input.getElement());
    });

    it('should handle enabled/disabled state', () => {
      expect(input.isEnabled()).to.be.true;
      expect(input.getElement().disabled).to.be.false;

      input.setEnabled(false);
      expect(input.isEnabled()).to.be.false;
      expect(input.getElement().disabled).to.be.true;

      input.setEnabled(true);
      expect(input.isEnabled()).to.be.true;
      expect(input.getElement().disabled).to.be.false;
    });

    it('should handle focus state', () => {
      expect(input.isFocused()).to.be.false;

      input.focus();
      expect(input.isFocused()).to.be.true;

      input.blur();
      expect(input.isFocused()).to.be.false;
    });

    it('should update placeholder', () => {
      input.setPlaceholder('New placeholder');
      expect(input.getElement().placeholder).to.equal('New placeholder');
    });
  });

  describe('event handling', () => {
    let input: CosmicInput;
    let changeHandler: sinon.SinonSpy;
    let inputHandler: sinon.SinonSpy;

    beforeEach(() => {
      changeHandler = sinon.spy();
      inputHandler = sinon.spy();
      
      input = new CosmicInput({ 
        type: 'text',
        onChange: changeHandler,
        onInput: inputHandler
      });
      container.appendChild(input.getElement());
    });

    it('should handle input events', () => {
      input.setValue('test');
      
      const inputEvent = new Event('input', { bubbles: true });
      input.getElement().dispatchEvent(inputEvent);

      expect(inputHandler.calledOnce).to.be.true;
    });

    it('should handle change events', () => {
      input.setValue('test');
      
      const changeEvent = new Event('change', { bubbles: true });
      input.getElement().dispatchEvent(changeEvent);

      expect(changeHandler.calledOnce).to.be.true;
    });

    it('should handle focus and blur events', () => {
      const focusHandler = sinon.spy();
      const blurHandler = sinon.spy();
      
      input.onFocus(focusHandler);
      input.onBlur(blurHandler);

      const focusEvent = new Event('focus');
      const blurEvent = new Event('blur');
      
      input.getElement().dispatchEvent(focusEvent);
      expect(focusHandler.calledOnce).to.be.true;

      input.getElement().dispatchEvent(blurEvent);
      expect(blurHandler.calledOnce).to.be.true;
    });

    it('should handle keyboard events', () => {
      const keyHandler = sinon.spy();
      input.onKeyDown(keyHandler);

      const keyEvent = createMockKeyboardEvent('keydown', 'Enter');
      input.getElement().dispatchEvent(keyEvent);

      expect(keyHandler.calledOnce).to.be.true;
      expect(keyHandler.firstCall.args[0]).to.equal(keyEvent);
    });
  });

  describe('accessibility', () => {
    let input: CosmicInput;

    beforeEach(() => {
      input = new CosmicInput({ 
        type: 'text',
        label: 'Accessible Input',
        required: true
      });
      container.appendChild(input.getElement());
    });

    it('should have proper ARIA attributes', () => {
      const element = input.getElement();
      expect(element.getAttribute('aria-required')).to.equal('true');
      expect(element.getAttribute('aria-label')).to.exist;
    });

    it('should associate label with input', () => {
      const wrapper = input.getElement().closest('.cosmic-input-wrapper');
      const label = wrapper?.querySelector('label');
      const inputElement = wrapper?.querySelector('input');
      
      expect(label?.getAttribute('for')).to.equal(inputElement?.id);
    });

    it('should update ARIA attributes when invalid', async () => {
      input.setValue(''); // Required field, should be invalid
      input.validate();
      
      await waitForDOMUpdate();
      
      const element = input.getElement();
      expect(element.getAttribute('aria-invalid')).to.equal('true');
    });
  });

  describe('input types and specialized behaviors', () => {
    it('should handle file input type', () => {
      const fileInput = new CosmicInput({ type: 'file' });
      container.appendChild(fileInput.getElement());

      expect(fileInput.getElement().type).to.equal('file');
    });

    it('should handle range input type', () => {
      const rangeInput = new CosmicInput({ 
        type: 'range',
        min: 0,
        max: 100,
        step: 1
      });
      container.appendChild(rangeInput.getElement());

      expect(rangeInput.getElement().type).to.equal('range');
      expect(rangeInput.getElement().min).to.equal('0');
      expect(rangeInput.getElement().max).to.equal('100');
      expect(rangeInput.getElement().step).to.equal('1');
    });

    it('should handle password input with visibility toggle', () => {
      const passwordInput = new CosmicInput({ 
        type: 'password',
        showPasswordToggle: true
      });
      container.appendChild(passwordInput.getElement());

      const wrapper = passwordInput.getElement().closest('.cosmic-input-wrapper');
      const toggleButton = wrapper?.querySelector('.password-toggle');
      expect(toggleButton).to.exist;
    });
  });

  describe('static factory methods', () => {
    it('should create text input', () => {
      const input = CosmicInput.text('Enter text');
      expect(input.getElement().type).to.equal('text');
      expect(input.getElement().placeholder).to.equal('Enter text');
    });

    it('should create email input', () => {
      const input = CosmicInput.email('Enter email');
      expect(input.getElement().type).to.equal('email');
      expect(input.getElement().placeholder).to.equal('Enter email');
    });

    it('should create password input', () => {
      const input = CosmicInput.password('Enter password');
      expect(input.getElement().type).to.equal('password');
      expect(input.getElement().placeholder).to.equal('Enter password');
    });

    it('should create number input', () => {
      const input = CosmicInput.number('Enter number');
      expect(input.getElement().type).to.equal('number');
      expect(input.getElement().placeholder).to.equal('Enter number');
    });

    it('should create search input', () => {
      const input = CosmicInput.search('Search');
      expect(input.getElement().type).to.equal('search');
      expect(input.getElement().placeholder).to.equal('Search');
    });

    it('should create file input', () => {
      const input = CosmicInput.file();
      expect(input.getElement().type).to.equal('file');
    });

    it('should create time input', () => {
      const input = CosmicInput.time();
      expect(input.getElement().type).to.equal('time');
    });
  });

  describe('disposal and cleanup', () => {
    let input: CosmicInput;

    beforeEach(() => {
      input = new CosmicInput({ type: 'text' });
      container.appendChild(input.getElement());
    });

    it('should dispose correctly', () => {
      expect(input.isDisposed()).to.be.false;

      input.dispose();

      expect(input.isDisposed()).to.be.true;
    });

    it('should handle multiple dispose calls', () => {
      input.dispose();
      input.dispose(); // Should not throw

      expect(input.isDisposed()).to.be.true;
    });

    it('should remove event listeners on disposal', () => {
      const changeHandler = sinon.spy();
      input.onChange(changeHandler);

      input.dispose();

      const changeEvent = new Event('change');
      input.getElement().dispatchEvent(changeEvent);

      expect(changeHandler.called).to.be.false;
    });
  });
});
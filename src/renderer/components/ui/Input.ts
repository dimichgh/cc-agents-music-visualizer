// Music Visualizer - Cosmic Input Component

import { BaseComponent } from '../base/BaseComponent';
import { InputOptions, InputType, InputSize } from '../../types/ui-types';

export class CosmicInput extends BaseComponent {
  private _options: InputOptions;
  private _inputElement: HTMLInputElement;
  private _labelElement?: HTMLLabelElement;
  private _errorElement?: HTMLSpanElement;
  private _value: string = '';

  constructor(options: InputOptions = {}) {
    super('div');
    this._options = {
      type: 'text',
      size: 'medium',
      disabled: false,
      required: false,
      ...options
    };
    
    this._inputElement = document.createElement('input');
    this._value = this._options.value || '';
    this.render();
  }

  protected override init(): void {
    super.init();
  }

  private setupInputEventListeners(): void {
    if (!this._inputElement) return;
    
    this._inputElement.addEventListener('input', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const oldValue = this._value;
      this._value = target.value;
      
      if (this._options.onChange) {
        this._options.onChange(this._value, event);
      }
      
      this.emit('change', this._value, oldValue, event);
      this.clearError(); // Clear errors on input
    });

    this._inputElement.addEventListener('focus', (event: FocusEvent) => {
      this.setState({ isFocused: true });
      
      if (this._options.onFocus) {
        this._options.onFocus(event);
      }
      
      this.emit('focus', event);
    });

    this._inputElement.addEventListener('blur', (event: FocusEvent) => {
      this.setState({ isFocused: false });
      
      if (this._options.onBlur) {
        this._options.onBlur(event);
      }
      
      this.emit('blur', event);
      this.validateInputValue();
    });

    this._inputElement.addEventListener('keydown', (event: KeyboardEvent) => {
      this.emit('keydown', event);
      
      if (event.key === 'Enter') {
        this.emit('submit', this._value, event);
      }
      
      if (event.key === 'Escape') {
        this._inputElement.blur();
        this.emit('escape', event);
      }
    });

    this._inputElement.addEventListener('paste', (event: ClipboardEvent) => {
      // Allow paste, then validate after a short delay
      setTimeout(() => this.validateInputValue(), 0);
      this.emit('paste', event);
    });
  }

  render(): HTMLElement {
    const container = this._element;
    container.className = 'cosmic-input-container';
    
    // Create label if needed
    if (this._options.ariaLabel) {
      this._labelElement = document.createElement('label');
      this._labelElement.className = 'cosmic-input-label';
      this._labelElement.textContent = this._options.ariaLabel;
      container.appendChild(this._labelElement);
    }

    // Setup input element
    this._inputElement.className = 'cosmic-input';
    this._inputElement.type = this._options.type || 'text';
    this._inputElement.value = this._value;
    
    if (this._options.placeholder) {
      this._inputElement.placeholder = this._options.placeholder;
    }
    
    if (this._options.size) {
      this._inputElement.classList.add(this._options.size);
    }
    
    if (this._options.disabled) {
      this._inputElement.disabled = true;
      this.disable();
    }
    
    if (this._options.required) {
      this._inputElement.required = true;
      this._inputElement.setAttribute('aria-required', 'true');
    }

    // Set accessibility attributes
    const accessibilityOptions: any = {
      tabIndex: 0
    };
    if (this._options.ariaLabel !== undefined) {
      accessibilityOptions.ariaLabel = this._options.ariaLabel;
    }
    this.setAccessibility(accessibilityOptions);

    container.appendChild(this._inputElement);

    // Create error element for validation messages
    this._errorElement = document.createElement('span');
    this._errorElement.className = 'cosmic-input-error';
    this._errorElement.setAttribute('role', 'alert');
    this._errorElement.style.display = 'none';
    container.appendChild(this._errorElement);

    // Link label and input
    if (this._labelElement) {
      const inputId = `cosmic-input-${Math.random().toString(36).substr(2, 9)}`;
      this._inputElement.id = inputId;
      this._labelElement.setAttribute('for', inputId);
    }

    // Setup event listeners after elements are created
    this.setupInputEventListeners();

    return container;
  }

  // Value management
  get value(): string {
    return this._value;
  }

  set value(newValue: string) {
    this._value = newValue;
    this._inputElement.value = newValue;
    this.validateInputValue();
    this.emit('change', newValue);
  }

  getValue(): string {
    return this._value;
  }

  setValue(value: string): void {
    this.value = value;
  }

  clear(): void {
    this.setValue('');
  }

  // Validation
  private validateInputValue(): void {
    if (!this._options.required && !this._value.trim()) {
      this.clearError();
      return;
    }

    const errors: string[] = [];

    // Required validation
    if (this._options.required && !this._value.trim()) {
      errors.push('This field is required');
    }

    // Type-specific validation
    switch (this._options.type) {
      case 'email':
        if (this._value && !this.isValidEmail(this._value)) {
          errors.push('Please enter a valid email address');
        }
        break;
      case 'number':
        if (this._value && isNaN(Number(this._value))) {
          errors.push('Please enter a valid number');
        }
        break;
    }

    if (errors.length > 0) {
      this.setError(errors[0] || 'Validation error');
    } else {
      this.clearError();
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Error handling
  override setError(message: string): void {
    super.setError(message);
    
    if (this._errorElement) {
      this._errorElement.textContent = message;
      this._errorElement.style.display = 'block';
      this._inputElement.setAttribute('aria-describedby', this._errorElement.id || '');
    }
    
    this._inputElement.classList.add('error');
  }

  override clearError(): void {
    super.clearError();
    
    if (this._errorElement) {
      this._errorElement.style.display = 'none';
      this._inputElement.removeAttribute('aria-describedby');
    }
    
    this._inputElement.classList.remove('error');
  }

  // State management
  override enable(): void {
    super.enable();
    this._inputElement.disabled = false;
  }

  override disable(): void {
    super.disable();
    this._inputElement.disabled = true;
  }

  override focus(): void {
    if (this._state.isEnabled && this._state.isVisible) {
      this._inputElement.focus();
    }
  }

  override blur(): void {
    this._inputElement.blur();
  }

  select(): void {
    this._inputElement.select();
  }

  // Type and size management
  setType(type: InputType): void {
    this._options.type = type;
    this._inputElement.type = type;
    this.validateInputValue();
  }

  setSize(size: InputSize): void {
    if (this._options.size) {
      this._inputElement.classList.remove(this._options.size);
    }
    
    this._options.size = size;
    this._inputElement.classList.add(size);
  }

  setPlaceholder(placeholder: string): void {
    this._options.placeholder = placeholder;
    this._inputElement.placeholder = placeholder;
  }

  setRequired(required: boolean): void {
    this._options.required = required;
    this._inputElement.required = required;
    this._inputElement.setAttribute('aria-required', String(required));
    
    if (required && this._labelElement) {
      this._labelElement.classList.add('required');
    } else if (this._labelElement) {
      this._labelElement.classList.remove('required');
    }
  }

  // Input modes for better mobile experience
  setInputMode(mode: 'text' | 'numeric' | 'decimal' | 'tel' | 'search' | 'email' | 'url'): void {
    this._inputElement.inputMode = mode;
  }

  // Autocomplete settings
  setAutocomplete(value: string): void {
    this._inputElement.autocomplete = value as any;
  }

  // Pattern validation
  setPattern(pattern: string, title?: string): void {
    this._inputElement.pattern = pattern;
    if (title) {
      this._inputElement.title = title;
    }
  }

  // Min/max for number inputs
  setMinMax(min?: number, max?: number): void {
    if (min !== undefined) {
      this._inputElement.min = String(min);
    }
    if (max !== undefined) {
      this._inputElement.max = String(max);
    }
  }

  // Step for number inputs
  setStep(step: number): void {
    this._inputElement.step = String(step);
  }

  // Static factory methods for common input types
  static text(placeholder?: string, options: Omit<InputOptions, 'type' | 'placeholder'> = {}): CosmicInput {
    return new CosmicInput({ ...options, type: 'text', placeholder: placeholder || '' });
  }

  static email(placeholder?: string, options: Omit<InputOptions, 'type' | 'placeholder'> = {}): CosmicInput {
    return new CosmicInput({ ...options, type: 'email', placeholder: placeholder || 'Enter email address' });
  }

  static password(placeholder?: string, options: Omit<InputOptions, 'type' | 'placeholder'> = {}): CosmicInput {
    return new CosmicInput({ ...options, type: 'password', placeholder: placeholder || 'Enter password' });
  }

  static number(placeholder?: string, options: Omit<InputOptions, 'type' | 'placeholder'> = {}): CosmicInput {
    return new CosmicInput({ ...options, type: 'number', placeholder: placeholder || 'Enter number' });
  }

  static search(placeholder?: string, options: Omit<InputOptions, 'type' | 'placeholder'> = {}): CosmicInput {
    const input = new CosmicInput({ ...options, type: 'search', placeholder: placeholder || 'Search...' });
    input.setInputMode('search');
    return input;
  }

  static fileName(options: InputOptions = {}): CosmicInput {
    return new CosmicInput({
      ...options,
      type: 'text',
      placeholder: 'cosmic-symphony.wav',
      ariaLabel: 'Audio file name'
    });
  }

  static timeCode(options: InputOptions = {}): CosmicInput {
    const input = new CosmicInput({
      ...options,
      type: 'text',
      placeholder: '00:00',
      ariaLabel: 'Time code'
    });
    input.setPattern('^([0-9]{1,2}):([0-5][0-9])$', 'Format: MM:SS');
    return input;
  }
}
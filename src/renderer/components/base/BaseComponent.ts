// Music Visualizer - Base Component Class

import { CosmicComponent, EventEmitter, ComponentState, AccessibilityOptions, AnimationOptions } from '../../types/ui-types';

export abstract class BaseComponent implements CosmicComponent, EventEmitter {
  protected _element: HTMLElement;
  protected _state: ComponentState;
  protected _listeners: Map<string, Set<Function>>;
  protected _destroyed: boolean = false;

  constructor(tagName: string = 'div') {
    this._element = document.createElement(tagName);
    this._state = {
      isVisible: true,
      isEnabled: true,
      isActive: false,
      isFocused: false,
      isHovered: false,
      hasError: false,
      isLoading: false
    };
    this._listeners = new Map();
    this.init();
  }

  protected init(): void {
    this.setupEventListeners();
    this.applyBaseStyles();
  }

  protected setupEventListeners(): void {
    // Focus management
    this._element.addEventListener('focus', () => {
      this._state.isFocused = true;
      this.emit('focus');
    });

    this._element.addEventListener('blur', () => {
      this._state.isFocused = false;
      this.emit('blur');
    });

    // Hover management
    this._element.addEventListener('mouseenter', () => {
      this._state.isHovered = true;
      this.emit('hover', true);
    });

    this._element.addEventListener('mouseleave', () => {
      this._state.isHovered = false;
      this.emit('hover', false);
    });

    // Keyboard navigation
    this._element.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    // Base keyboard handling - can be overridden
    switch (event.key) {
      case 'Enter':
      case ' ':
        if (this._element.tagName === 'BUTTON' || this._element.getAttribute('role') === 'button') {
          event.preventDefault();
          this.emit('click', event);
        }
        break;
      case 'Escape':
        this.emit('escape', event);
        break;
    }
  }

  protected applyBaseStyles(): void {
    // Apply base cosmic styling
    this._element.style.boxSizing = 'border-box';
    this._element.style.outline = 'none';
  }

  // EventEmitter implementation
  on(event: string, listener: (...args: any[]) => void): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(listener);
  }

  off(event: string, listener: (...args: any[]) => void): void {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this._listeners.delete(event);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Component state management
  get state(): ComponentState {
    return { ...this._state };
  }

  protected setState(newState: Partial<ComponentState>): void {
    const oldState = { ...this._state };
    this._state = { ...this._state, ...newState };
    this.onStateChange(oldState, this._state);
  }

  protected onStateChange(oldState: ComponentState, newState: ComponentState): void {
    // Update visual state
    this.updateVisualState();
    this.emit('stateChange', { oldState, newState });
  }

  protected updateVisualState(): void {
    const element = this._element;
    
    // Visibility
    element.style.display = this._state.isVisible ? '' : 'none';
    
    // Enabled/disabled state
    if (element instanceof HTMLInputElement || element instanceof HTMLButtonElement) {
      element.disabled = !this._state.isEnabled;
    }
    element.setAttribute('aria-disabled', String(!this._state.isEnabled));
    
    // CSS classes for state
    element.classList.toggle('is-active', this._state.isActive);
    element.classList.toggle('is-focused', this._state.isFocused);
    element.classList.toggle('is-hovered', this._state.isHovered);
    element.classList.toggle('has-error', this._state.hasError);
    element.classList.toggle('is-loading', this._state.isLoading);
  }

  // Public API
  get element(): HTMLElement {
    return this._element;
  }

  get isVisible(): boolean {
    return this._state.isVisible;
  }

  get isEnabled(): boolean {
    return this._state.isEnabled;
  }

  abstract render(): HTMLElement;

  show(): void {
    this.setState({ isVisible: true });
    this.emit('show');
  }

  hide(): void {
    this.setState({ isVisible: false });
    this.emit('hide');
  }

  enable(): void {
    this.setState({ isEnabled: true });
    this.emit('enable');
  }

  disable(): void {
    this.setState({ isEnabled: false });
    this.emit('disable');
  }

  focus(): void {
    if (this._state.isEnabled && this._state.isVisible) {
      this._element.focus();
    }
  }

  blur(): void {
    this._element.blur();
  }

  // Accessibility helpers
  setAccessibility(options: AccessibilityOptions): void {
    const { role, ariaLabel, ariaDescribedBy, ariaExpanded, ariaSelected, ariaDisabled, tabIndex, focusable } = options;
    
    if (role) this._element.setAttribute('role', role);
    if (ariaLabel) this._element.setAttribute('aria-label', ariaLabel);
    if (ariaDescribedBy) this._element.setAttribute('aria-describedby', ariaDescribedBy);
    if (ariaExpanded !== undefined) this._element.setAttribute('aria-expanded', String(ariaExpanded));
    if (ariaSelected !== undefined) this._element.setAttribute('aria-selected', String(ariaSelected));
    if (ariaDisabled !== undefined) this._element.setAttribute('aria-disabled', String(ariaDisabled));
    if (tabIndex !== undefined) this._element.tabIndex = tabIndex;
    if (focusable === false) this._element.tabIndex = -1;
  }

  // Animation helpers
  animate(options: AnimationOptions): Promise<void> {
    return new Promise((resolve) => {
      const { type, duration = 300, easing = 'ease', delay = 0, onComplete } = options;
      
      this._element.style.transition = `all ${duration}ms ${easing}`;
      
      if (delay > 0) {
        setTimeout(() => this.applyAnimation(type), delay);
      } else {
        this.applyAnimation(type);
      }
      
      setTimeout(() => {
        this._element.style.transition = '';
        if (onComplete) onComplete();
        resolve();
      }, duration + delay);
    });
  }

  protected applyAnimation(type: string): void {
    switch (type) {
      case 'fade':
        this._element.style.opacity = this._state.isVisible ? '1' : '0';
        break;
      case 'slide':
        this._element.style.transform = this._state.isVisible ? 'translateY(0)' : 'translateY(-20px)';
        break;
      case 'scale':
        this._element.style.transform = this._state.isVisible ? 'scale(1)' : 'scale(0.95)';
        break;
      case 'cosmic-warp':
        if (this._state.isVisible) {
          this._element.style.transform = 'scale(1) rotate(0deg)';
          this._element.style.opacity = '1';
          this._element.style.filter = 'blur(0px)';
        } else {
          this._element.style.transform = 'scale(0.1) rotate(180deg)';
          this._element.style.opacity = '0';
          this._element.style.filter = 'blur(20px)';
        }
        break;
    }
  }

  // CSS class management
  addClass(className: string): void {
    this._element.classList.add(className);
  }

  removeClass(className: string): void {
    this._element.classList.remove(className);
  }

  toggleClass(className: string, force?: boolean): void {
    this._element.classList.toggle(className, force);
  }

  hasClass(className: string): boolean {
    return this._element.classList.contains(className);
  }

  // DOM helpers
  append(child: HTMLElement | BaseComponent): void {
    if (child instanceof BaseComponent) {
      this._element.appendChild(child.element);
    } else {
      this._element.appendChild(child);
    }
  }

  prepend(child: HTMLElement | BaseComponent): void {
    if (child instanceof BaseComponent) {
      this._element.prepend(child.element);
    } else {
      this._element.prepend(child);
    }
  }

  remove(): void {
    if (this._element.parentNode) {
      this._element.parentNode.removeChild(this._element);
    }
  }

  // Data attributes
  setData(key: string, value: string): void {
    this._element.setAttribute(`data-${key}`, value);
  }

  getData(key: string): string | null {
    return this._element.getAttribute(`data-${key}`);
  }

  // Error handling
  setError(message?: string): void {
    this.setState({ hasError: true });
    if (message) {
      this.setData('error-message', message);
      this._element.setAttribute('aria-invalid', 'true');
    }
  }

  clearError(): void {
    this.setState({ hasError: false });
    this._element.removeAttribute('data-error-message');
    this._element.setAttribute('aria-invalid', 'false');
  }

  // Loading state
  setLoading(loading: boolean): void {
    this.setState({ isLoading: loading });
    this._element.setAttribute('aria-busy', String(loading));
  }

  // Cleanup
  destroy(): void {
    if (this._destroyed) return;
    
    this._destroyed = true;
    this._listeners.clear();
    
    // Remove all event listeners
    this._element.removeEventListener('focus', this.handleKeyDown);
    this._element.removeEventListener('blur', this.handleKeyDown);
    this._element.removeEventListener('mouseenter', this.handleKeyDown);
    this._element.removeEventListener('mouseleave', this.handleKeyDown);
    this._element.removeEventListener('keydown', this.handleKeyDown);
    
    // Remove from DOM
    this.remove();
    
    this.emit('destroy');
  }

  // Validation helper
  protected validateInput(value: any, rules: any[]): string[] {
    const errors: string[] = [];
    
    for (const rule of rules) {
      switch (rule.type) {
        case 'required':
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            errors.push(rule.message);
          }
          break;
        case 'min':
          if (typeof value === 'number' && value < rule.value) {
            errors.push(rule.message);
          } else if (typeof value === 'string' && value.length < rule.value) {
            errors.push(rule.message);
          }
          break;
        case 'max':
          if (typeof value === 'number' && value > rule.value) {
            errors.push(rule.message);
          } else if (typeof value === 'string' && value.length > rule.value) {
            errors.push(rule.message);
          }
          break;
        case 'pattern':
          if (typeof value === 'string' && !rule.value.test(value)) {
            errors.push(rule.message);
          }
          break;
        case 'custom':
          if (rule.validator && !rule.validator(value)) {
            errors.push(rule.message);
          }
          break;
      }
    }
    
    return errors;
  }

  // Utility methods
  protected createIcon(iconName: string): HTMLElement {
    const icon = document.createElement('span');
    icon.className = `cosmic-icon icon-${iconName}`;
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  }

  protected debounce(func: Function, wait: number): Function {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  protected throttle(func: Function, wait: number): Function {
    let inThrottle: boolean;
    return function executedFunction(...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, wait);
      }
    };
  }
}
// Music Visualizer - Cosmic Button Component

import { BaseComponent } from '../base/BaseComponent';
import { ButtonOptions, ButtonVariant, ButtonSize, AccessibilityOptions } from '../../types/ui-types';

export class CosmicButton extends BaseComponent {
  private _options: ButtonOptions;
  private _textElement?: HTMLSpanElement;
  private _iconElement?: HTMLSpanElement;

  constructor(options: ButtonOptions = {}) {
    super('button');
    this._options = {
      variant: 'primary',
      size: 'medium',
      disabled: false,
      ...options
    };
    this.render();
  }

  protected override init(): void {
    super.init();
    this.setupButtonEventListeners();
  }

  private setupButtonEventListeners(): void {
    this._element.addEventListener('click', (event: MouseEvent) => {
      if (!this._state.isEnabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      this.createRippleEffect(event);
      
      if (this._options.onClick) {
        this._options.onClick(event);
      }
      
      this.emit('click', event);
    });

    // Space and Enter key support
    this._element.addEventListener('keydown', (event: KeyboardEvent) => {
      if ((event.key === ' ' || event.key === 'Enter') && this._state.isEnabled) {
        event.preventDefault();
        this._element.click();
      }
    });
  }

  private createRippleEffect(event: MouseEvent): void {
    const button = this._element as HTMLButtonElement;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'cosmic-ripple';
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
      border-radius: 50%;
      transform: scale(0);
      animation: cosmic-ripple 0.6s ease-out;
      pointer-events: none;
      z-index: 1;
    `;

    button.appendChild(ripple);

    // Add ripple animation keyframes if not already present
    if (!document.getElementById('cosmic-ripple-styles')) {
      const style = document.createElement('style');
      style.id = 'cosmic-ripple-styles';
      style.textContent = `
        @keyframes cosmic-ripple {
          to { transform: scale(4); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }

  render(): HTMLElement {
    const button = this._element as HTMLButtonElement;
    
    // Apply base classes
    button.className = 'cosmic-button';
    
    // Apply variant
    if (this._options.variant) {
      button.classList.add(this._options.variant);
    }
    
    // Apply size
    if (this._options.size) {
      button.classList.add(this._options.size);
    }

    // Set disabled state
    if (this._options.disabled) {
      this.disable();
    }

    // Set accessibility attributes
    const accessibilityOptions: AccessibilityOptions = {
      role: 'button',
      tabIndex: 0
    };
    
    const ariaLabel = this._options.ariaLabel || this._options.text;
    if (ariaLabel) {
      accessibilityOptions.ariaLabel = ariaLabel;
    }
    
    this.setAccessibility(accessibilityOptions);

    // Create content
    this.updateContent();

    return button;
  }

  private updateContent(): void {
    const button = this._element;
    button.innerHTML = ''; // Clear existing content

    // Add icon if specified
    if (this._options.icon) {
      this._iconElement = document.createElement('span');
      this._iconElement.className = `cosmic-icon icon-${this._options.icon}`;
      this._iconElement.setAttribute('aria-hidden', 'true');
      button.appendChild(this._iconElement);
    }

    // Add text if specified and not icon-only
    if (this._options.text && this._options.variant !== 'icon-only') {
      this._textElement = document.createElement('span');
      this._textElement.className = 'button-text';
      this._textElement.textContent = this._options.text;
      button.appendChild(this._textElement);
    }

    // For icon-only buttons, ensure proper sizing
    if (this._options.variant === 'icon-only') {
      button.classList.add('icon-only');
      if (this._options.ariaLabel) {
        button.setAttribute('aria-label', this._options.ariaLabel);
      }
    }
  }

  // Public API methods
  setText(text: string): void {
    this._options.text = text;
    if (this._textElement) {
      this._textElement.textContent = text;
    } else if (this._options.variant !== 'icon-only') {
      this.updateContent();
    }
  }

  setIcon(icon: string): void {
    this._options.icon = icon;
    if (this._iconElement) {
      this._iconElement.className = `cosmic-icon icon-${icon}`;
    } else {
      this.updateContent();
    }
  }

  setVariant(variant: ButtonVariant): void {
    // Remove old variant class
    if (this._options.variant) {
      this._element.classList.remove(this._options.variant);
    }
    
    this._options.variant = variant;
    this._element.classList.add(variant);
    
    // Update content for icon-only variant
    if (variant === 'icon-only') {
      this.updateContent();
    }
  }

  setSize(size: ButtonSize): void {
    // Remove old size class
    if (this._options.size) {
      this._element.classList.remove(this._options.size);
    }
    
    this._options.size = size;
    this._element.classList.add(size);
  }

  override setLoading(loading: boolean): void {
    super.setLoading(loading);
    
    if (loading) {
      this._element.classList.add('loading');
      
      // Create loading spinner
      const spinner = document.createElement('span');
      spinner.className = 'cosmic-spinner small';
      spinner.setAttribute('aria-hidden', 'true');
      
      // Temporarily replace content with spinner
      const originalContent = this._element.innerHTML;
      this._element.setAttribute('data-original-content', originalContent);
      this._element.innerHTML = '';
      this._element.appendChild(spinner);
      
      this.disable();
    } else {
      this._element.classList.remove('loading');
      
      // Restore original content
      const originalContent = this._element.getAttribute('data-original-content');
      if (originalContent) {
        this._element.innerHTML = originalContent;
        this._element.removeAttribute('data-original-content');
      }
      
      this.enable();
    }
  }

  click(): void {
    if (this._state.isEnabled && this._state.isVisible) {
      this._element.click();
    }
  }

  // Override enable/disable to update button state
  override enable(): void {
    super.enable();
    (this._element as HTMLButtonElement).disabled = false;
  }

  override disable(): void {
    super.disable();
    (this._element as HTMLButtonElement).disabled = true;
  }

  // Static factory methods for common button types
  static primary(text: string, options: Omit<ButtonOptions, 'text' | 'variant'> = {}): CosmicButton {
    return new CosmicButton({ ...options, text, variant: 'primary' });
  }

  static secondary(text: string, options: Omit<ButtonOptions, 'text' | 'variant'> = {}): CosmicButton {
    return new CosmicButton({ ...options, text, variant: 'secondary' });
  }

  static ghost(text: string, options: Omit<ButtonOptions, 'text' | 'variant'> = {}): CosmicButton {
    return new CosmicButton({ ...options, text, variant: 'ghost' });
  }

  static icon(icon: string, options: Omit<ButtonOptions, 'icon' | 'variant'> = {}): CosmicButton {
    return new CosmicButton({ ...options, icon, variant: 'icon-only' });
  }

  static playPause(isPlaying: boolean = false, options: ButtonOptions = {}): CosmicButton {
    return new CosmicButton({
      ...options,
      icon: isPlaying ? 'pause' : 'play',
      variant: 'icon-only',
      ariaLabel: isPlaying ? 'Pause cosmic journey' : 'Play cosmic journey'
    });
  }

  static stop(options: ButtonOptions = {}): CosmicButton {
    return new CosmicButton({
      ...options,
      icon: 'stop',
      variant: 'icon-only',
      ariaLabel: 'Stop cosmic journey'
    });
  }

  static skipPrevious(options: ButtonOptions = {}): CosmicButton {
    return new CosmicButton({
      ...options,
      icon: 'skip-previous',
      variant: 'icon-only',
      ariaLabel: 'Previous cosmic sector'
    });
  }

  static skipNext(options: ButtonOptions = {}): CosmicButton {
    return new CosmicButton({
      ...options,
      icon: 'skip-next',
      variant: 'icon-only',
      ariaLabel: 'Next cosmic sector'
    });
  }
}
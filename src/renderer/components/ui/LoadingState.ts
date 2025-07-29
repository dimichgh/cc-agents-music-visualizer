// Music Visualizer - Loading State Component

import { BaseComponent } from '../base/BaseComponent';
import { CosmicButton } from './Button';
import { LoadingOptions } from '../../types/ui-types';

export class LoadingState extends BaseComponent {
  private _options: LoadingOptions;
  private _spinnerContainer!: HTMLElement;
  private _messageContainer!: HTMLElement;
  private _progressContainer!: HTMLElement;
  private _actionContainer!: HTMLElement;
  private _progressBar!: HTMLElement;
  private _progressText!: HTMLElement;
  private _cancelButton?: CosmicButton | undefined;
  
  private _currentProgress: number = 0;
  private _animationFrame: number = 0;

  constructor(options: LoadingOptions = {}) {
    super('div');
    this._options = {
      message: 'Loading cosmic frequencies...',
      cancelable: false,
      ...options
    };
    
    this.render();
    this.startCosmicAnimation();
  }

  render(): HTMLElement {
    const container = this._element;
    container.className = 'cosmic-loading-state';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-label', 'Loading');

    this.createSpinner();
    this.createMessage();
    
    if (this._options.progress !== undefined) {
      this.createProgressBar();
    }
    
    if (this._options.cancelable) {
      this.createActionButtons();
    }

    return container;
  }

  private createSpinner(): void {
    this._spinnerContainer = document.createElement('div');
    this._spinnerContainer.className = 'cosmic-spinner-container';
    
    // Main cosmic spinner
    const spinner = document.createElement('div');
    spinner.className = 'cosmic-loading-spinner';
    spinner.setAttribute('aria-hidden', 'true');
    
    // Create multiple rotating rings for cosmic effect
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('div');
      ring.className = `cosmic-ring ring-${i + 1}`;
      spinner.appendChild(ring);
    }
    
    // Central energy core
    const core = document.createElement('div');
    core.className = 'cosmic-core';
    spinner.appendChild(core);
    
    // Particle effects
    const particles = document.createElement('div');
    particles.className = 'cosmic-particles';
    
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.className = 'cosmic-particle';
      particle.style.setProperty('--particle-delay', `${i * 0.2}s`);
      particles.appendChild(particle);
    }
    
    spinner.appendChild(particles);
    this._spinnerContainer.appendChild(spinner);
    this._element.appendChild(this._spinnerContainer);
  }

  private createMessage(): void {
    this._messageContainer = document.createElement('div');
    this._messageContainer.className = 'loading-message';
    this._messageContainer.textContent = this._options.message || 'Loading...';
    this._element.appendChild(this._messageContainer);
  }

  private createProgressBar(): void {
    this._progressContainer = document.createElement('div');
    this._progressContainer.className = 'cosmic-progress-container';
    
    this._progressBar = document.createElement('div');
    this._progressBar.className = 'cosmic-progress';
    this._progressBar.setAttribute('role', 'progressbar');
    this._progressBar.setAttribute('aria-valuemin', '0');
    this._progressBar.setAttribute('aria-valuemax', '100');
    this._progressBar.setAttribute('aria-valuenow', String(this._options.progress || 0));
    
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.width = `${this._options.progress || 0}%`;
    
    // Cosmic energy flow effect
    const energyFlow = document.createElement('div');
    energyFlow.className = 'progress-energy-flow';
    progressFill.appendChild(energyFlow);
    
    this._progressBar.appendChild(progressFill);
    
    this._progressText = document.createElement('div');
    this._progressText.className = 'progress-text';
    this._progressText.textContent = `${Math.round(this._options.progress || 0)}%`;
    
    this._progressContainer.appendChild(this._progressBar);
    this._progressContainer.appendChild(this._progressText);
    this._element.appendChild(this._progressContainer);
  }

  private createActionButtons(): void {
    this._actionContainer = document.createElement('div');
    this._actionContainer.className = 'loading-actions';
    
    this._cancelButton = CosmicButton.secondary('Cancel Operation', {
      onClick: () => this.handleCancel()
    });
    
    this._actionContainer.appendChild(this._cancelButton.element);
    this._element.appendChild(this._actionContainer);
  }

  private startCosmicAnimation(): void {
    const animate = (time: number) => {
      this._animationFrame = requestAnimationFrame(animate);
      this.updateCosmicEffects(time);
    };
    
    animate(0);
  }

  private updateCosmicEffects(time: number): void {
    const spinner = this._element.querySelector('.cosmic-loading-spinner') as HTMLElement;
    if (!spinner) return;
    
    const timeSeconds = time * 0.001;
    
    // Rotate rings at different speeds
    const rings = spinner.querySelectorAll('.cosmic-ring');
    rings.forEach((ring, index) => {
      const element = ring as HTMLElement;
      const speed = (index + 1) * 0.5;
      const rotation = (timeSeconds * speed * 60) % 360;
      element.style.transform = `rotate(${rotation}deg)`;
    });
    
    // Pulse the core
    const core = spinner.querySelector('.cosmic-core') as HTMLElement;
    if (core) {
      const pulse = 0.8 + 0.2 * Math.sin(timeSeconds * 3);
      core.style.transform = `scale(${pulse})`;
      core.style.opacity = String(pulse);
    }
    
    // Animate particles
    const particles = spinner.querySelectorAll('.cosmic-particle');
    particles.forEach((particle, index) => {
      const element = particle as HTMLElement;
      const angle = (timeSeconds * 2 + index * 0.785) % (Math.PI * 2); // 45 degrees apart
      const radius = 30 + 10 * Math.sin(timeSeconds * 1.5 + index);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      element.style.transform = `translate(${x}px, ${y}px)`;
      element.style.opacity = String(0.6 + 0.4 * Math.sin(timeSeconds * 2 + index));
    });
  }

  private handleCancel(): void {
    if (this._options.onCancel) {
      this._options.onCancel();
    }
    
    this.emit('cancel');
  }

  // Public API methods
  setMessage(message: string): void {
    this._options.message = message;
    this._messageContainer.textContent = message;
    this._element.setAttribute('aria-label', message);
  }

  setProgress(progress: number): void {
    this._currentProgress = Math.max(0, Math.min(100, progress));
    
    if (!this._progressContainer && progress >= 0) {
      this.createProgressBar();
    }
    
    if (this._progressBar) {
      const fill = this._progressBar.querySelector('.progress-fill') as HTMLElement;
      fill.style.width = `${this._currentProgress}%`;
      
      this._progressBar.setAttribute('aria-valuenow', String(this._currentProgress));
      this._progressText.textContent = `${Math.round(this._currentProgress)}%`;
    }
    
    this.emit('progressUpdate', this._currentProgress);
  }

  setIndeterminate(): void {
    if (this._progressBar) {
      this._progressBar.classList.add('indeterminate');
      this._progressText.textContent = '';
    }
  }

  setDeterminate(): void {
    if (this._progressBar) {
      this._progressBar.classList.remove('indeterminate');
    }
  }

  setCancelable(cancelable: boolean): void {
    this._options.cancelable = cancelable;
    
    if (cancelable && !this._actionContainer) {
      this.createActionButtons();
    } else if (!cancelable && this._actionContainer) {
      this._actionContainer.remove();
      this._actionContainer = null!;
      this._cancelButton = undefined;
    }
  }

  // Get current options
  getOptions(): LoadingOptions {
    return { ...this._options };
  }

  // Animation control
  pauseAnimation(): void {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = 0;
    }
  }

  resumeAnimation(): void {
    if (!this._animationFrame) {
      this.startCosmicAnimation();
    }
  }

  // Static factory methods for common loading states
  static fileLoading(fileName: string): LoadingState {
    return new LoadingState({
      message: `Loading cosmic frequencies from ${fileName}...`,
      cancelable: true
    });
  }

  static audioAnalysis(): LoadingState {
    return new LoadingState({
      message: 'Analyzing cosmic audio patterns...',
      progress: 0
    });
  }

  static visualizationInit(): LoadingState {
    return new LoadingState({
      message: 'Initializing cosmic visualization engine...',
      cancelable: false
    });
  }

  static processing(operation: string): LoadingState {
    return new LoadingState({
      message: `Processing ${operation}...`,
      progress: 0,
      cancelable: true
    });
  }

  static saving(fileName: string): LoadingState {
    return new LoadingState({
      message: `Saving cosmic creation: ${fileName}...`,
      progress: 0
    });
  }

  static exporting(format: string): LoadingState {
    return new LoadingState({
      message: `Exporting visualization as ${format}...`,
      progress: 0,
      cancelable: true
    });
  }

  // Cleanup
  override destroy(): void {
    this.pauseAnimation();
    super.destroy();
  }
}

// Loading overlay component for full-screen loading
export class LoadingOverlay extends BaseComponent {
  private _loadingState: LoadingState;
  private _backdrop!: HTMLElement;

  constructor(options: LoadingOptions = {}) {
    super('div');
    this._loadingState = new LoadingState(options);
    this.render();
  }

  render(): HTMLElement {
    const overlay = this._element;
    overlay.className = 'cosmic-loading-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'loading-message');

    // Backdrop
    this._backdrop = document.createElement('div');
    this._backdrop.className = 'loading-backdrop';
    
    // Loading container
    const container = document.createElement('div');
    container.className = 'loading-container cosmic-container glowing';
    container.appendChild(this._loadingState.element);

    overlay.appendChild(this._backdrop);
    overlay.appendChild(container);

    // Trap focus within the overlay
    this.trapFocus();

    return overlay;
  }

  private trapFocus(): void {
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    // Focus the cancel button if available
    const cancelButton = this._element.querySelector('button');
    if (cancelButton) {
      cancelButton.focus();
    }

    // Handle escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this._loadingState.getOptions().cancelable) {
        this.close();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    // Store reference for cleanup
    this._element.addEventListener('destroy', () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    });
  }

  // Delegate methods to internal LoadingState
  setMessage(message: string): void {
    this._loadingState.setMessage(message);
  }

  setProgress(progress: number): void {
    this._loadingState.setProgress(progress);
  }

  setIndeterminate(): void {
    this._loadingState.setIndeterminate();
  }

  setDeterminate(): void {
    this._loadingState.setDeterminate();
  }

  setCancelable(cancelable: boolean): void {
    this._loadingState.setCancelable(cancelable);
  }

  close(): void {
    this._element.classList.add('closing');
    
    setTimeout(() => {
      this.destroy();
    }, 300); // Wait for close animation
    
    this.emit('close');
  }

  // Forward events from internal LoadingState
  override on(event: string, listener: (...args: any[]) => void): void {
    if (event === 'cancel' || event === 'progressUpdate') {
      this._loadingState.on(event, listener);
    } else {
      super.on(event, listener);
    }
  }

  override destroy(): void {
    document.body.style.overflow = '';
    this._loadingState.destroy();
    super.destroy();
  }
}
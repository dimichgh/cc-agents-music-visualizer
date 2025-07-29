// Music Visualizer - Error State Component

import { BaseComponent } from '../base/BaseComponent';
import { CosmicButton } from './Button';
import { ErrorOptions } from '../../types/ui-types';

export class ErrorState extends BaseComponent {
  private _options: ErrorOptions;
  private _iconContainer!: HTMLElement;
  private _contentContainer!: HTMLElement;
  private _actionsContainer!: HTMLElement;
  private _detailsContainer?: HTMLElement;
  private _showingDetails: boolean = false;

  constructor(options: ErrorOptions) {
    super('div');
    this._options = {
      title: 'Cosmic Disturbance Detected',
      recoverable: true,
      ...options
    };
    
    this.render();
  }

  render(): HTMLElement {
    const container = this._element;
    container.className = 'cosmic-error-state';
    container.setAttribute('role', 'alert');
    container.setAttribute('aria-live', 'assertive');

    this.createErrorIcon();
    this.createContent();
    this.createActions();
    
    if (this._options.details) {
      this.createDetails();
    }

    return container;
  }

  private createErrorIcon(): void {
    this._iconContainer = document.createElement('div');
    this._iconContainer.className = 'error-icon-container';
    
    const icon = document.createElement('div');
    icon.className = 'cosmic-error-icon';
    icon.setAttribute('aria-hidden', 'true');
    
    // Create animated error symbol
    icon.innerHTML = `
      <div class="error-symbol">
        <div class="error-ring outer-ring"></div>
        <div class="error-ring middle-ring"></div>
        <div class="error-ring inner-ring"></div>
        <div class="error-center">
          <span class="cosmic-icon icon-warning"></span>
        </div>
      </div>
    `;
    
    this._iconContainer.appendChild(icon);
    this._element.appendChild(this._iconContainer);
  }

  private createContent(): void {
    this._contentContainer = document.createElement('div');
    this._contentContainer.className = 'error-content';
    
    // Title
    if (this._options.title) {
      const title = document.createElement('h2');
      title.className = 'error-title cosmic-heading-medium';
      title.textContent = this._options.title;
      this._contentContainer.appendChild(title);
    }
    
    // Message
    const message = document.createElement('p');
    message.className = 'error-message';
    message.textContent = this._options.message;
    this._contentContainer.appendChild(message);
    
    // Error code or type (if available)
    if (this._options.details?.includes('Error:') || this._options.details?.includes('Code:')) {
      const errorInfo = document.createElement('div');
      errorInfo.className = 'error-info';
      
      // Extract error code if present
      const codeMatch = this._options.details.match(/(?:Error|Code):\s*(\w+)/i);
      if (codeMatch) {
        errorInfo.innerHTML = `<span class="error-code">Error Code: ${codeMatch[1]}</span>`;
        this._contentContainer.appendChild(errorInfo);
      }
    }
    
    this._element.appendChild(this._contentContainer);
  }

  private createActions(): void {
    this._actionsContainer = document.createElement('div');
    this._actionsContainer.className = 'error-actions';
    
    if (this._options.actions && this._options.actions.length > 0) {
      // Custom actions
      this._options.actions.forEach(action => {
        const button = new CosmicButton({
          text: action.label,
          variant: action.variant || 'secondary',
          onClick: action.handler
        });
        
        this._actionsContainer.appendChild(button.element);
      });
    } else if (this._options.recoverable) {
      // Default recovery actions
      const retryButton = CosmicButton.primary('Try Again', {
        icon: 'refresh',
        onClick: () => this.emit('retry')
      });
      
      const dismissButton = CosmicButton.secondary('Dismiss', {
        onClick: () => this.emit('dismiss')
      });
      
      this._actionsContainer.appendChild(retryButton.element);
      this._actionsContainer.appendChild(dismissButton.element);
    } else {
      // Non-recoverable error
      const closeButton = CosmicButton.secondary('Close Application', {
        onClick: () => this.emit('close')
      });
      
      this._actionsContainer.appendChild(closeButton.element);
    }
    
    // Details toggle button
    if (this._options.details) {
      const detailsButton = CosmicButton.ghost('Show Details', {
        icon: 'chevron-down',
        onClick: () => this.toggleDetails()
      });
      
      detailsButton.addClass('details-toggle');
      this._actionsContainer.appendChild(detailsButton.element);
    }
    
    this._element.appendChild(this._actionsContainer);
  }

  private createDetails(): void {
    this._detailsContainer = document.createElement('div');
    this._detailsContainer.className = 'error-details cosmic-surface';
    this._detailsContainer.style.display = 'none';
    this._detailsContainer.setAttribute('aria-expanded', 'false');
    
    const detailsTitle = document.createElement('h3');
    detailsTitle.className = 'details-title';
    detailsTitle.textContent = 'Technical Details';
    
    const detailsContent = document.createElement('pre');
    detailsContent.className = 'details-content';
    detailsContent.textContent = this._options.details || '';
    
    // Copy button for details
    const copyButton = CosmicButton.icon('copy', {
      ariaLabel: 'Copy error details',
      onClick: () => this.copyDetails()
    });
    copyButton.addClass('copy-details-button');
    
    const detailsHeader = document.createElement('div');
    detailsHeader.className = 'details-header';
    detailsHeader.appendChild(detailsTitle);
    detailsHeader.appendChild(copyButton.element);
    
    this._detailsContainer.appendChild(detailsHeader);
    this._detailsContainer.appendChild(detailsContent);
    this._element.appendChild(this._detailsContainer);
  }

  private toggleDetails(): void {
    if (!this._detailsContainer) return;
    
    this._showingDetails = !this._showingDetails;
    
    const detailsButton = this._element.querySelector('.details-toggle') as HTMLElement;
    const buttonIcon = detailsButton?.querySelector('.cosmic-icon') as HTMLElement;
    
    if (this._showingDetails) {
      this._detailsContainer.style.display = 'block';
      this._detailsContainer.setAttribute('aria-expanded', 'true');
      
      if (detailsButton) {
        detailsButton.textContent = 'Hide Details';
        if (buttonIcon) {
          buttonIcon.className = 'cosmic-icon icon-chevron-up';
        }
      }
    } else {
      this._detailsContainer.style.display = 'none';
      this._detailsContainer.setAttribute('aria-expanded', 'false');
      
      if (detailsButton) {
        detailsButton.textContent = 'Show Details';
        if (buttonIcon) {
          buttonIcon.className = 'cosmic-icon icon-chevron-down';
        }
      }
    }
  }

  private async copyDetails(): Promise<void> {
    if (!this._options.details) return;
    
    try {
      await navigator.clipboard.writeText(this._options.details);
      
      // Show feedback
      const copyButton = this._element.querySelector('.copy-details-button') as HTMLElement;
      if (copyButton) {
        const originalIcon = copyButton.querySelector('.cosmic-icon');
        if (originalIcon) {
          originalIcon.className = 'cosmic-icon icon-check';
          setTimeout(() => {
            originalIcon.className = 'cosmic-icon icon-copy';
          }, 2000);
        }
      }
      
      this.emit('detailsCopied');
    } catch (err) {
      console.error('Failed to copy details:', err);
    }
  }

  // Public API methods
  setTitle(title: string): void {
    this._options.title = title;
    const titleElement = this._element.querySelector('.error-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  setMessage(message: string): void {
    this._options.message = message;
    const messageElement = this._element.querySelector('.error-message');
    if (messageElement) {
      messageElement.textContent = message;
    }
  }

  setDetails(details: string): void {
    this._options.details = details;
    
    if (!this._detailsContainer) {
      this.createDetails();
    } else {
      const detailsContent = this._detailsContainer.querySelector('.details-content');
      if (detailsContent) {
        detailsContent.textContent = details;
      }
    }
  }

  setRecoverable(recoverable: boolean): void {
    this._options.recoverable = recoverable;
    
    // Recreate actions with new recoverability
    this._actionsContainer.innerHTML = '';
    this.createActions();
  }

  // Static factory methods for common error types
  static fileNotFound(fileName: string): ErrorState {
    return new ErrorState({
      title: 'Cosmic File Not Located',
      message: `Unable to locate the cosmic frequency file: ${fileName}`,
      details: `File path: ${fileName}\nError: File not found or access denied`,
      recoverable: true,
      actions: [
        {
          label: 'Choose Different File',
          handler: () => {},
          variant: 'primary'
        },
        {
          label: 'Cancel',
          handler: () => {},
          variant: 'secondary'
        }
      ]
    });
  }

  static unsupportedFormat(fileName: string, format: string): ErrorState {
    return new ErrorState({
      title: 'Unsupported Cosmic Format',
      message: `The file format "${format}" is not supported by the cosmic analyzer.`,
      details: `File: ${fileName}\nFormat: ${format}\nSupported formats: .wav, .mp3, .flac, .m4a, .ogg, .aac`,
      recoverable: true,
      actions: [
        {
          label: 'Convert File',
          handler: () => {},
          variant: 'primary'
        },
        {
          label: 'Choose Different File',
          handler: () => {},
          variant: 'secondary'
        }
      ]
    });
  }

  static audioAnalysisError(error: string): ErrorState {
    return new ErrorState({
      title: 'Audio Analysis Failure',
      message: 'Failed to analyze the cosmic audio patterns. The file may be corrupted or in an unsupported format.',
      details: `Analysis Error: ${error}`,
      recoverable: true,
      actions: [
        {
          label: 'Retry Analysis',
          handler: () => {},
          variant: 'primary'
        },
        {
          label: 'Try Different File',
          handler: () => {},
          variant: 'secondary'
        }
      ]
    });
  }

  static visualizationError(error: string): ErrorState {
    return new ErrorState({
      title: 'Visualization Engine Error',
      message: 'The cosmic visualization engine encountered an error. This may be due to graphics hardware limitations.',
      details: `WebGL Error: ${error}`,
      recoverable: true,
      actions: [
        {
          label: 'Restart Visualization',
          handler: () => {},
          variant: 'primary'
        },
        {
          label: 'Use Fallback Mode',
          handler: () => {},
          variant: 'secondary'
        }
      ]
    });
  }

  static networkError(operation: string): ErrorState {
    return new ErrorState({
      title: 'Cosmic Connection Lost',
      message: `Failed to ${operation}. Please check your network connection and try again.`,
      recoverable: true,
      actions: [
        {
          label: 'Retry',
          handler: () => {},
          variant: 'primary'
        },
        {
          label: 'Work Offline',
          handler: () => {},
          variant: 'secondary'
        }
      ]
    });
  }

  static permissionError(resource: string): ErrorState {
    return new ErrorState({
      title: 'Access Permission Required',
      message: `Permission is required to access ${resource}. Please grant the necessary permissions and try again.`,
      recoverable: true,
      actions: [
        {
          label: 'Grant Permission',
          handler: () => {},
          variant: 'primary'
        },
        {
          label: 'Cancel',
          handler: () => {},
          variant: 'secondary'
        }
      ]
    });
  }

  static criticalError(error: string): ErrorState {
    return new ErrorState({
      title: 'Critical System Error',
      message: 'A critical error has occurred that prevents the application from continuing. The application will need to be restarted.',
      details: error,
      recoverable: false,
      actions: [
        {
          label: 'Restart Application',
          handler: () => {},
          variant: 'primary'
        },
        {
          label: 'Report Issue',
          handler: () => {},
          variant: 'secondary'
        }
      ]
    });
  }

  static genericError(message: string, details?: string): ErrorState {
    const options: ErrorOptions = {
      title: 'Unexpected Error',
      message,
      recoverable: true
    };
    
    if (details !== undefined) {
      options.details = details;
    }
    
    return new ErrorState(options);
  }
}

// Error notification toast for non-blocking errors
export class ErrorToast extends BaseComponent {
  private _options: ErrorOptions;
  private _autoHideTimer?: NodeJS.Timeout;

  constructor(options: ErrorOptions, duration: number = 5000) {
    super('div');
    this._options = options;
    
    this.render();
    
    if (duration > 0) {
      this._autoHideTimer = setTimeout(() => {
        this.hide();
      }, duration);
    }
  }

  render(): HTMLElement {
    const toast = this._element;
    toast.className = 'cosmic-error-toast cosmic-container';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    const content = document.createElement('div');
    content.className = 'toast-content';

    const icon = document.createElement('span');
    icon.className = 'cosmic-icon icon-warning toast-icon';
    icon.setAttribute('aria-hidden', 'true');

    const messageContainer = document.createElement('div');
    messageContainer.className = 'toast-message-container';

    if (this._options.title) {
      const title = document.createElement('div');
      title.className = 'toast-title';
      title.textContent = this._options.title;
      messageContainer.appendChild(title);
    }

    const message = document.createElement('div');
    message.className = 'toast-message';
    message.textContent = this._options.message;
    messageContainer.appendChild(message);

    const closeButton = CosmicButton.icon('close', {
      ariaLabel: 'Dismiss error',
      onClick: () => this.hide()
    });
    closeButton.addClass('toast-close');

    content.appendChild(icon);
    content.appendChild(messageContainer);
    content.appendChild(closeButton.element);
    toast.appendChild(content);

    return toast;
  }

  override show(): void {
    super.show();
    this._element.classList.add('toast-visible');
    
    // Announce to screen readers
    this._element.setAttribute('aria-label', 
      `Error: ${this._options.title || ''} ${this._options.message}`);
  }

  override hide(): void {
    if (this._autoHideTimer) {
      clearTimeout(this._autoHideTimer);
    }
    
    this._element.classList.remove('toast-visible');
    this._element.classList.add('toast-hiding');
    
    setTimeout(() => {
      super.hide();
      this.emit('hidden');
    }, 300);
  }

  override destroy(): void {
    if (this._autoHideTimer) {
      clearTimeout(this._autoHideTimer);
    }
    super.destroy();
  }
}
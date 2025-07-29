# Error States and Loading Animations - Music Visualizer Application

## Overview

The Music Visualizer application provides comprehensive error handling and loading state management with cosmic-themed visual feedback. All states maintain the ethereal aesthetic while clearly communicating system status and recovery options to users.

## Loading States

### Primary Loading Animation - Cosmic Spinner
```css
.cosmic-spinner {
  width: 64px;
  height: 64px;
  position: relative;
  display: inline-block;
  
  /* Outer ring */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 3px solid rgba(100, 255, 218, 0.2);
    border-top: 3px solid rgba(100, 255, 218, 0.8);
    border-radius: 50%;
    animation: cosmic-rotate 1.2s linear infinite;
  }
  
  /* Inner glow */
  &::after {
    content: '';
    position: absolute;
    top: 12px;
    left: 12px;
    width: 40px;
    height: 40px;
    border: 2px solid rgba(68, 138, 255, 0.3);
    border-top: 2px solid rgba(68, 138, 255, 0.9);
    border-radius: 50%;
    animation: cosmic-rotate 0.8s linear infinite reverse;
  }
  
  /* Size variants */
  &.small {
    width: 32px;
    height: 32px;
    
    &::before {
      border-width: 2px;
    }
    
    &::after {
      top: 6px;
      left: 6px;
      width: 20px;
      height: 20px;
      border-width: 1px;
    }
  }
  
  &.large {
    width: 96px;
    height: 96px;
    
    &::before {
      border-width: 4px;
    }
    
    &::after {
      top: 18px;
      left: 18px;
      width: 60px;
      height: 60px;
      border-width: 3px;
    }
  }
}

@keyframes cosmic-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Pulsing Energy Loader
```css
.cosmic-pulse-loader {
  width: 48px;
  height: 48px;
  position: relative;
  display: inline-block;
  
  .pulse-ring {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 2px solid rgba(100, 255, 218, 0.6);
    border-radius: 50%;
    animation: cosmic-pulse 1.5s ease-in-out infinite;
    
    &:nth-child(2) {
      animation-delay: 0.3s;
    }
    
    &:nth-child(3) {
      animation-delay: 0.6s;
    }
  }
  
  .core {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    background: radial-gradient(circle,
      rgba(100, 255, 218, 0.9) 0%,
      rgba(68, 138, 255, 0.7) 100%);
    border-radius: 50%;
    animation: core-glow 2s ease-in-out infinite;
  }
}

@keyframes cosmic-pulse {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

@keyframes core-glow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(100, 255, 218, 0.4);
  }
  50% {
    box-shadow: 0 0 16px rgba(100, 255, 218, 0.8);
  }
}
```

### Progress Loading with Cosmic Effects
```css
.cosmic-progress-loader {
  width: 200px;
  height: 8px;
  background: rgba(58, 58, 85, 0.6);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  
  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg,
      rgba(100, 255, 218, 0.8) 0%,
      rgba(68, 138, 255, 0.8) 50%,
      rgba(124, 77, 255, 0.8) 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
    position: relative;
    
    /* Energy wave effect */
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.4) 50%,
        transparent 100%);
      animation: energy-wave 2s infinite linear;
    }
  }
  
  /* Indeterminate state */
  &.indeterminate .progress-bar {
    width: 40%;
    animation: indeterminate-slide 2s infinite ease-in-out;
  }
  
  /* With percentage display */
  .progress-text {
    position: absolute;
    top: -24px;
    left: 0;
    font-size: 12px;
    color: rgba(100, 255, 218, 0.9);
    font-weight: 500;
  }
}

@keyframes energy-wave {
  0% { left: -100%; }
  100% { left: 100%; }
}

@keyframes indeterminate-slide {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(400%); }
  100% { transform: translateX(-100%); }
}
```

### Audio Processing Loader
```css
.audio-processing-loader {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 40px;
  
  .frequency-bar {
    width: 6px;
    background: linear-gradient(to top,
      rgba(100, 255, 218, 0.8) 0%,
      rgba(68, 138, 255, 0.6) 100%);
    border-radius: 3px 3px 0 0;
    animation: frequency-bounce 1.2s ease-in-out infinite;
    
    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.1s; }
    &:nth-child(3) { animation-delay: 0.2s; }
    &:nth-child(4) { animation-delay: 0.3s; }
    &:nth-child(5) { animation-delay: 0.4s; }
    &:nth-child(6) { animation-delay: 0.5s; }
    &:nth-child(7) { animation-delay: 0.4s; }
    &:nth-child(8) { animation-delay: 0.3s; }
    &:nth-child(9) { animation-delay: 0.2s; }
    &:nth-child(10) { animation-delay: 0.1s; }
  }
}

@keyframes frequency-bounce {
  0%, 100% {
    height: 8px;
    opacity: 0.4;
  }
  50% {
    height: 32px;
    opacity: 1;
  }
}
```

## Loading Overlays

### Full-Screen Loading Overlay
```css
.cosmic-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(ellipse 800px 400px at center, rgba(100, 255, 218, 0.1) 0%, transparent 70%),
    rgba(10, 10, 15, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  
  .loading-content {
    text-align: center;
    
    .loader {
      margin-bottom: 24px;
    }
    
    .loading-message {
      font-size: 18px;
      color: rgba(100, 255, 218, 0.9);
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .loading-details {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      max-width: 400px;
      line-height: 1.4;
    }
    
    .loading-progress {
      margin-top: 20px;
      width: 300px;
    }
  }
  
  /* Animated background particles */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(1px 1px at 20px 30px, rgba(100, 255, 218, 0.3), transparent),
      radial-gradient(1px 1px at 40px 70px, rgba(68, 138, 255, 0.2), transparent),
      radial-gradient(2px 2px at 90px 40px, rgba(124, 77, 255, 0.2), transparent);
    background-repeat: repeat;
    background-size: 200px 100px;
    animation: starfield-drift 20s infinite linear;
    opacity: 0.6;
  }
}

@keyframes starfield-drift {
  0% { transform: translate(0, 0); }
  100% { transform: translate(-200px, -100px); }
}
```

### Component Loading States
```css
.component-loading {
  position: relative;
  
  .loading-shimmer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
      rgba(42, 42, 64, 0.8) 0%,
      rgba(58, 58, 85, 0.6) 50%,
      rgba(42, 42, 64, 0.8) 100%);
    background-size: 200% 100%;
    animation: shimmer 2s infinite ease-in-out;
    border-radius: inherit;
  }
  
  .loading-skeleton {
    .skeleton-line {
      height: 16px;
      background: rgba(58, 58, 85, 0.6);
      border-radius: 4px;
      margin-bottom: 8px;
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg,
          transparent 0%,
          rgba(100, 255, 218, 0.2) 50%,
          transparent 100%);
        animation: skeleton-wave 2s infinite ease-in-out;
      }
      
      &.short { width: 60%; }
      &.medium { width: 80%; }
      &.long { width: 100%; }
    }
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes skeleton-wave {
  0% { left: -100%; }
  100% { left: 100%; }
}
```

## Error States

### Primary Error Display
```css
.cosmic-error {
  background: 
    radial-gradient(ellipse 400px 200px at center, rgba(244, 67, 54, 0.1) 0%, transparent 70%),
    rgba(26, 26, 37, 0.9);
  border: 2px solid rgba(244, 67, 54, 0.4);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  backdrop-filter: blur(10px);
  
  .error-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    background: radial-gradient(circle,
      rgba(244, 67, 54, 0.8) 0%,
      rgba(244, 67, 54, 0.4) 70%,
      transparent 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: error-pulse 2s ease-in-out infinite;
    
    &::before {
      content: '⚠';
      font-size: 32px;
      color: rgba(255, 255, 255, 0.9);
    }
  }
  
  .error-title {
    font-size: 20px;
    font-weight: 600;
    color: rgba(244, 67, 54, 0.9);
    margin-bottom: 8px;
  }
  
  .error-message {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.5;
    margin-bottom: 16px;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .error-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 20px;
    
    .retry-button {
      padding: 10px 20px;
      background: rgba(244, 67, 54, 0.8);
      border: none;
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(244, 67, 54, 1);
        transform: translateY(-1px);
      }
    }
    
    .help-button {
      padding: 10px 20px;
      background: transparent;
      border: 1px solid rgba(244, 67, 54, 0.6);
      border-radius: 8px;
      color: rgba(244, 67, 54, 0.9);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(244, 67, 54, 0.1);
        border-color: rgba(244, 67, 54, 0.8);
      }
    }
  }
}

@keyframes error-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 16px rgba(244, 67, 54, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 24px rgba(244, 67, 54, 0.5);
  }
}
```

### Inline Error Messages
```css
.inline-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 6px;
  font-size: 12px;
  color: rgba(244, 67, 54, 0.9);
  margin-top: 4px;
  
  .error-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    background: url('./icons/warning.svg') center/contain no-repeat;
  }
  
  .error-text {
    flex: 1;
    line-height: 1.3;
  }
  
  .dismiss-button {
    width: 16px;
    height: 16px;
    background: url('./icons/close.svg') center/contain no-repeat;
    border: none;
    background-color: transparent;
    cursor: pointer;
    opacity: 0.7;
    
    &:hover {
      opacity: 1;
    }
  }
}
```

### Connection Error State
```css
.connection-error {
  background: rgba(26, 26, 37, 0.95);
  border: 2px solid rgba(255, 193, 7, 0.4);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  
  .connection-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 16px;
    background: rgba(255, 193, 7, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    
    &::before {
      content: '📡';
      font-size: 24px;
    }
    
    /* Disconnected animation */
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: 2px solid rgba(255, 193, 7, 0.6);
      border-radius: 50%;
      animation: connection-search 2s ease-in-out infinite;
    }
  }
  
  .connection-title {
    font-size: 16px;
    color: rgba(255, 193, 7, 0.9);
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .connection-message {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 16px;
    line-height: 1.4;
  }
  
  .reconnect-button {
    padding: 8px 16px;
    background: rgba(255, 193, 7, 0.8);
    border: none;
    border-radius: 6px;
    color: rgba(10, 10, 15, 0.9);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(255, 193, 7, 1);
    }
  }
}

@keyframes connection-search {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}
```

## Success States

### Success Notification
```css
.cosmic-success {
  background: 
    radial-gradient(ellipse 400px 200px at center, rgba(76, 175, 80, 0.1) 0%, transparent 70%),
    rgba(26, 26, 37, 0.9);
  border: 2px solid rgba(76, 175, 80, 0.4);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  
  .success-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 12px;
    background: rgba(76, 175, 80, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: success-bounce 0.6s ease-out;
    
    &::before {
      content: '✓';
      font-size: 24px;
      color: rgba(76, 175, 80, 0.9);
      font-weight: bold;
    }
  }
  
  .success-title {
    font-size: 16px;
    color: rgba(76, 175, 80, 0.9);
    margin-bottom: 6px;
    font-weight: 500;
  }
  
  .success-message {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.4;
  }
}

@keyframes success-bounce {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
```

## Empty States

### No Files Available
```css
.empty-state {
  text-align: center;
  padding: 48px 24px;
  background: rgba(42, 42, 64, 0.3);
  border-radius: 12px;
  border: 2px dashed rgba(100, 255, 218, 0.2);
  
  .empty-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    background: 
      radial-gradient(ellipse 60px 40px at center, rgba(100, 255, 218, 0.1) 0%, transparent 70%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    
    &::before {
      content: '🎵';
      font-size: 32px;
      opacity: 0.6;
      animation: float 3s ease-in-out infinite;
    }
  }
  
  .empty-title {
    font-size: 18px;
    color: rgba(100, 255, 218, 0.8);
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .empty-message {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.5;
    margin-bottom: 20px;
    max-width: 300px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .empty-action {
    padding: 12px 24px;
    background: linear-gradient(135deg,
      rgba(100, 255, 218, 0.8),
      rgba(68, 138, 255, 0.8));
    border: none;
    border-radius: 8px;
    color: rgba(10, 10, 15, 0.9);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(100, 255, 218, 0.3);
    }
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
```

## State Management JavaScript

### Loading State Controller
```javascript
class LoadingStateManager {
  constructor() {
    this.activeLoaders = new Set();
    this.createOverlay();
  }
  
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'cosmic-loading-overlay';
    this.overlay.style.display = 'none';
    
    this.overlay.innerHTML = `
      <div class="loading-content">
        <div class="cosmic-spinner large"></div>
        <div class="loading-message">Loading Cosmic Experience...</div>
        <div class="loading-details">Preparing your music visualization</div>
        <div class="cosmic-progress-loader">
          <div class="progress-bar" style="width: 0%"></div>
          <div class="progress-text">0%</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.overlay);
  }
  
  show(message = 'Loading...', details = '') {
    const loaderId = `loader_${Date.now()}`;
    this.activeLoaders.add(loaderId);
    
    this.overlay.querySelector('.loading-message').textContent = message;
    this.overlay.querySelector('.loading-details').textContent = details;
    this.overlay.style.display = 'flex';
    
    return loaderId;
  }
  
  updateProgress(loaderId, progress, message) {
    if (!this.activeLoaders.has(loaderId)) return;
    
    const progressBar = this.overlay.querySelector('.progress-bar');
    const progressText = this.overlay.querySelector('.progress-text');
    
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}%`;
    
    if (message) {
      this.overlay.querySelector('.loading-details').textContent = message;
    }
  }
  
  hide(loaderId) {
    this.activeLoaders.delete(loaderId);
    
    if (this.activeLoaders.size === 0) {
      this.overlay.style.display = 'none';
    }
  }
  
  hideAll() {
    this.activeLoaders.clear();
    this.overlay.style.display = 'none';
  }
}

// Error handling system
class ErrorStateManager {
  constructor() {
    this.createErrorContainer();
  }
  
  createErrorContainer() {
    this.container = document.createElement('div');
    this.container.className = 'error-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
    `;
    document.body.appendChild(this.container);
  }
  
  showError(title, message, actions = []) {
    const errorElement = document.createElement('div');
    errorElement.className = 'cosmic-error';
    
    const actionsHTML = actions.map(action => 
      `<button class="${action.type}-button" onclick="${action.handler}">${action.label}</button>`
    ).join('');
    
    errorElement.innerHTML = `
      <div class="error-icon"></div>
      <div class="error-title">${title}</div>
      <div class="error-message">${message}</div>
      <div class="error-actions">
        ${actionsHTML}
        <button class="help-button" onclick="this.parentElement.parentElement.remove()">Dismiss</button>
      </div>
    `;
    
    this.container.appendChild(errorElement);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.remove();
      }
    }, 10000);
    
    return errorElement;
  }
  
  showSuccess(title, message) {
    const successElement = document.createElement('div');
    successElement.className = 'cosmic-success';
    
    successElement.innerHTML = `
      <div class="success-icon"></div>
      <div class="success-title">${title}</div>
      <div class="success-message">${message}</div>
    `;
    
    this.container.appendChild(successElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (successElement.parentNode) {
        successElement.remove();
      }
    }, 5000);
    
    return successElement;
  }
}

// Usage examples
const loadingManager = new LoadingStateManager();
const errorManager = new ErrorStateManager();

// Show loading for file processing
const loaderId = loadingManager.show(
  'Analyzing Audio File', 
  'Processing frequency data and generating waveform...'
);

// Update progress
loadingManager.updateProgress(loaderId, 50, 'Extracting audio features...');

// Show error if something goes wrong
errorManager.showError(
  'Audio File Error',
  'The selected file format is not supported. Please choose a WAV file.',
  [
    {
      type: 'retry',
      label: 'Choose Another File',
      handler: 'openFileDialog()'
    }
  ]
);

// Show success
errorManager.showSuccess(
  'File Loaded Successfully',
  'Your cosmic visualization is ready to begin!'
);
```

This comprehensive error and loading state system provides clear feedback to users while maintaining the cosmic aesthetic throughout all application states.
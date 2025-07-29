# Accessibility Guidelines - Music Visualizer Application

## Overview

The Music Visualizer application prioritizes inclusive design, ensuring that users of all abilities can enjoy cosmic music visualization experiences. These guidelines address the unique challenges of audio-visual content accessibility while maintaining the immersive cosmic aesthetic.

## WCAG 2.1 AA Compliance Standards

### Principle 1: Perceivable
Information and user interface components must be presentable to users in ways they can perceive.

### Principle 2: Operable
User interface components and navigation must be operable.

### Principle 3: Understandable
Information and the operation of user interface must be understandable.

### Principle 4: Robust
Content must be robust enough that it can be interpreted by a wide variety of user agents, including assistive technologies.

## Visual Accessibility

### Color and Contrast

#### Color Contrast Requirements
```css
/* WCAG AA compliant color combinations */
:root {
  /* High contrast text combinations */
  --text-primary-accessible: #ffffff;        /* White on dark backgrounds */
  --text-secondary-accessible: #e0e0e0;      /* Light gray on dark backgrounds */
  --text-disabled-accessible: #999999;       /* Disabled text minimum contrast */
  
  /* Background combinations ensuring 4.5:1 contrast ratio */
  --bg-contrast-high: #000000;               /* Pure black for maximum contrast */
  --bg-contrast-medium: #1a1a1a;             /* Dark gray maintaining readability */
  
  /* Interactive element contrasts */
  --interactive-primary: #00bcd4;            /* Cyan with 4.8:1 contrast ratio */
  --interactive-secondary: #4fc3f7;          /* Light blue with 4.5:1 contrast ratio */
  --interactive-success: #66bb6a;            /* Green with 4.6:1 contrast ratio */
  --interactive-warning: #ffb74d;            /* Orange with 4.5:1 contrast ratio */
  --interactive-error: #ef5350;              /* Red with 4.5:1 contrast ratio */
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --cosmic-bg-primary: #000000;
    --cosmic-bg-secondary: #000000;
    --cosmic-text-primary: #ffffff;
    --cosmic-text-secondary: #ffffff;
    --cosmic-accent-1: #00ffff;              /* Maximum contrast cyan */
    --cosmic-accent-2: #ffff00;              /* Maximum contrast yellow */
    --cosmic-border: #ffffff;
    --cosmic-focus: #ffff00;                 /* High visibility yellow focus */
  }
  
  .cosmic-container {
    background: var(--cosmic-bg-primary);
    border: 2px solid var(--cosmic-border);
  }
  
  .cosmic-button.primary {
    background: var(--cosmic-accent-1);
    color: #000000;
    border: 2px solid #ffffff;
  }
  
  .cosmic-visualization {
    /* Simplified visualization for high contrast */
    filter: contrast(150%) brightness(120%);
  }
}
```

#### Color Independence
```css
/* Ensure information is not conveyed through color alone */
.status-indicator {
  position: relative;
  
  /* Success state */
  &.success {
    color: var(--interactive-success);
    
    &::before {
      content: '✓';
      margin-right: 4px;
      font-weight: bold;
    }
  }
  
  /* Warning state */
  &.warning {
    color: var(--interactive-warning);
    
    &::before {
      content: '⚠';
      margin-right: 4px;
    }
  }
  
  /* Error state */
  &.error {
    color: var(--interactive-error);
    
    &::before {
      content: '✕';
      margin-right: 4px;
      font-weight: bold;
    }
  }
}

/* Visual patterns for colorblind users */
.frequency-visualization {
  .bass-region {
    background: 
      linear-gradient(45deg, 
        var(--bass-color) 25%, 
        transparent 25%, 
        transparent 75%, 
        var(--bass-color) 75%);
    background-size: 4px 4px;
  }
  
  .mid-region {
    background: 
      radial-gradient(circle, 
        var(--mid-color) 2px, 
        transparent 2px);
    background-size: 8px 8px;
  }
  
  .high-region {
    background: 
      repeating-linear-gradient(90deg,
        var(--high-color) 0px,
        var(--high-color) 2px,
        transparent 2px,
        transparent 6px);
  }
}
```

### Visual Motion and Animation

#### Reduced Motion Support
```css
/* Respect user preference for reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Provide static alternatives for motion-based content */
  .cosmic-visualization {
    .particle-system {
      display: none;
    }
    
    .static-visualization {
      display: block;
      background: 
        radial-gradient(ellipse 400px 200px at center, 
          rgba(100, 255, 218, 0.3) 0%, 
          transparent 70%);
    }
  }
  
  .cosmic-waveform {
    .animated-bars {
      display: none;
    }
    
    .static-bars {
      display: flex;
    }
  }
}

/* Vestibular disorder considerations */
.accessibility-safe-mode {
  /* Disable all parallax and zoom effects */
  .cosmic-observatory {
    transform: none !important;
  }
  
  /* Limit rotation and scaling */
  .rotating-element {
    animation: none !important;
    transform: none !important;
  }
  
  /* Provide gentle alternatives */
  .gentle-pulse {
    animation: gentle-opacity 3s infinite ease-in-out;
  }
}

@keyframes gentle-opacity {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
```

#### Epilepsy and Seizure Prevention
```css
/* Seizure-safe visualization settings */
.epilepsy-safe-mode {
  /* No flashing faster than 3Hz (3 times per second) */
  .cosmic-visualization {
    animation-duration: 1s !important;
    
    /* Limit brightness changes */
    filter: brightness(0.8) contrast(0.9);
  }
  
  /* Prevent rapid color changes */
  .particle-system {
    .particle {
      animation-duration: 2s !important;
      transition-duration: 0.5s !important;
    }
  }
  
  /* Disable strobe effects */
  .strobe-effect,
  .flash-effect {
    display: none !important;
  }
  
  /* Gentle color transitions only */
  .color-transition {
    transition: color 1s ease-in-out;
  }
}

/* Photosensitive epilepsy protections */
.photosensitive-safe {
  /* Maximum brightness limits */
  .bright-element {
    opacity: 0.6 !important;
    filter: brightness(0.7);
  }
  
  /* Prevent sharp contrasts */
  .high-contrast-element {
    filter: contrast(0.8);
  }
  
  /* Smooth transitions only */
  * {
    transition-timing-function: ease-in-out !important;
  }
}
```

## Audio Accessibility

### Hearing Impairment Support

#### Visual Audio Feedback
```css
/* Visual representations of audio for deaf/hard of hearing users */
.audio-visualization-accessibility {
  .volume-indicator {
    display: flex;
    flex-direction: column;
    gap: 2px;
    
    .volume-bar {
      height: 4px;
      background: rgba(58, 58, 85, 0.6);
      border-radius: 2px;
      transition: background-color 0.1s ease;
      
      &.active {
        background: var(--interactive-primary);
      }
    }
  }
  
  .frequency-display {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 2px;
    height: 40px;
    
    .freq-band {
      background: rgba(58, 58, 85, 0.6);
      border-radius: 2px 2px 0 0;
      transition: all 0.1s ease;
      
      &.active {
        background: var(--interactive-primary);
        transform: scaleY(1.2);
      }
    }
  }
  
  .rhythm-indicator {
    width: 60px;
    height: 60px;
    border: 3px solid rgba(100, 255, 218, 0.3);
    border-radius: 50%;
    position: relative;
    
    &.beat-active {
      border-color: var(--interactive-primary);
      animation: beat-pulse 0.2s ease-out;
    }
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 30px;
      height: 30px;
      background: var(--interactive-primary);
      border-radius: 50%;
      opacity: 0;
      transition: opacity 0.1s ease;
    }
    
    &.beat-active::before {
      opacity: 1;
    }
  }
}

@keyframes beat-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

#### Captions and Audio Descriptions
```html
<!-- Audio description for visualization -->
<div class="visualization-description" aria-live="polite" aria-atomic="true">
  <span id="current-visualization-state" class="sr-only">
    Current visualization: Stellar Nursery effect with moderate particle density. 
    Audio shows strong bass presence and gentle mid-range harmonics.
  </span>
</div>

<!-- Live audio analysis feedback -->
<div class="audio-analysis-live" aria-live="polite">
  <span class="sr-only">
    BPM: <span id="current-bpm">128</span> beats per minute. 
    Key: <span id="current-key">D minor</span>. 
    Volume level: <span id="current-volume">70%</span>.
  </span>
</div>
```

### Audio Processing Accessibility
```javascript
// Accessible audio analysis descriptions
class AudioAccessibilityManager {
  constructor() {
    this.lastUpdate = 0;
    this.updateInterval = 2000; // Update every 2 seconds
    this.descriptionElement = document.getElementById('visualization-description');
  }
  
  updateAudioDescription(audioData) {
    const now = Date.now();
    if (now - this.lastUpdate < this.updateInterval) return;
    
    const description = this.generateDescription(audioData);
    this.descriptionElement.textContent = description;
    this.lastUpdate = now;
  }
  
  generateDescription(audioData) {
    const { volume, frequencies, tempo, energy } = audioData;
    
    let description = '';
    
    // Volume description
    if (volume > 0.8) description += 'Loud audio with ';
    else if (volume > 0.5) description += 'Moderate volume with ';
    else if (volume > 0.2) description += 'Quiet audio with ';
    else description += 'Very quiet audio with ';
    
    // Frequency content
    const bassLevel = frequencies.bass / 255;
    const midLevel = frequencies.mid / 255;
    const highLevel = frequencies.high / 255;
    
    if (bassLevel > 0.7) description += 'strong bass, ';
    else if (bassLevel > 0.3) description += 'moderate bass, ';
    
    if (midLevel > 0.7) description += 'rich midrange, ';
    else if (midLevel > 0.3) description += 'gentle midrange, ';
    
    if (highLevel > 0.7) description += 'bright highs. ';
    else if (highLevel > 0.3) description += 'soft highs. ';
    
    // Energy and tempo
    if (energy > 0.8) description += 'High energy music';
    else if (energy > 0.5) description += 'Moderate energy music';
    else description += 'Calm, low energy music';
    
    if (tempo > 140) description += ' with fast tempo.';
    else if (tempo > 100) description += ' with moderate tempo.';
    else description += ' with slow tempo.';
    
    return description;
  }
}
```

## Motor Accessibility

### Keyboard Navigation

#### Focus Management
```css
/* Comprehensive focus indicators */
.cosmic-focusable {
  outline: none;
  transition: all 0.2s ease;
  
  &:focus {
    box-shadow: 
      0 0 0 2px var(--cosmic-focus, #ffff00),
      0 0 8px rgba(255, 255, 0, 0.5);
    position: relative;
    z-index: 10;
  }
  
  &:focus-visible {
    outline: 2px solid var(--cosmic-focus, #ffff00);
    outline-offset: 2px;
  }
}

/* Skip links for keyboard users */
.skip-links {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--cosmic-bg-primary);
  color: var(--cosmic-text-primary);
  padding: 8px 16px;
  border-radius: 0 0 8px 0;
  border: 2px solid var(--cosmic-accent-1);
  z-index: 1000;
  transition: top 0.3s ease;
  
  &:focus {
    top: 0;
  }
  
  a {
    color: var(--cosmic-accent-1);
    text-decoration: underline;
    margin-right: 16px;
    
    &:focus {
      outline: 1px solid var(--cosmic-focus);
      outline-offset: 2px;
    }
  }
}
```

#### Keyboard Shortcuts
```html
<!-- Keyboard shortcut documentation -->
<div id="keyboard-shortcuts" class="sr-only" aria-label="Keyboard shortcuts">
  <h3>Keyboard Navigation</h3>
  <ul>
    <li>Space: Play/Pause audio</li>
    <li>Left/Right Arrow: Seek audio ±10 seconds</li>
    <li>Up/Down Arrow: Adjust volume ±10%</li>
    <li>Tab: Navigate between controls</li>
    <li>Enter/Space: Activate buttons</li>
    <li>Escape: Close dialogs and menus</li>
    <li>F: Toggle fullscreen visualization</li>
    <li>M: Mute/unmute audio</li>
    <li>1-4: Select effect presets</li>
    <li>?/F1: Show help dialog</li>
  </ul>
</div>
```

```javascript
// Keyboard navigation manager
class KeyboardAccessibilityManager {
  constructor() {
    this.setupKeyboardShortcuts();
    this.manageFocusFlow();
  }
  
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't interfere with form inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          this.togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.seekAudio(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.seekAudio(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.adjustVolume(-0.1);
          break;
        case 'f':
        case 'F':
          if (!e.ctrlKey) {
            e.preventDefault();
            this.toggleFullscreen();
          }
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          this.toggleMute();
          break;
        case 'Escape':
          this.closeModals();
          break;
        case '?':
        case 'F1':
          e.preventDefault();
          this.showKeyboardHelp();
          break;
      }
    });
  }
  
  manageFocusFlow() {
    // Ensure logical tab order
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach((element, index) => {
      element.setAttribute('tabindex', index + 1);
    });
  }
  
  trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    });
  }
}
```

### Touch and Pointer Accessibility

#### Large Touch Targets
```css
/* Minimum 44px touch targets */
@media (pointer: coarse) {
  .cosmic-button,
  .cosmic-icon-button,
  .cosmic-toggle,
  .dropdown-trigger,
  .tab-item {
    min-width: 44px;
    min-height: 44px;
    touch-action: manipulation;
  }
  
  .cosmic-range .range-handle {
    width: 28px;
    height: 28px;
    touch-action: pan-x;
  }
  
  /* Increase spacing between touch targets */
  .button-group {
    gap: 8px;
  }
  
  .control-grid {
    gap: 12px;
  }
}

/* Alternative input methods */
.voice-control-active {
  .cosmic-button {
    &::after {
      content: attr(data-voice-command);
      position: absolute;
      bottom: -20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      white-space: nowrap;
    }
  }
}
```

## Cognitive Accessibility

### Clear Information Architecture

#### Simple Language and Instructions
```html
<!-- Clear, simple instructions -->
<div class="instruction-panel">
  <h2>How to Use the Music Visualizer</h2>
  <ol class="simple-steps">
    <li>
      <strong>Step 1:</strong> Click "Open File" to choose your music
      <span class="help-text">Look for the folder icon</span>
    </li>
    <li>
      <strong>Step 2:</strong> Press the play button to start
      <span class="help-text">The triangle icon starts the music</span>
    </li>
    <li>
      <strong>Step 3:</strong> Watch the cosmic visualization
      <span class="help-text">Colors and shapes will move with your music</span>
    </li>
    <li>
      <strong>Step 4:</strong> Try different effects
      <span class="help-text">Use the dropdown menu to change styles</span>
    </li>
  </ol>
</div>

<!-- Progress indicators -->
<div class="setup-progress" role="progressbar" aria-valuemin="0" aria-valuemax="4" aria-valuenow="2">
  <span class="sr-only">Step 2 of 4 complete</span>
  <div class="progress-steps">
    <div class="step completed">File Selected</div>
    <div class="step current">Audio Playing</div>
    <div class="step">Effect Chosen</div>
    <div class="step">Ready to Enjoy</div>
  </div>
</div>
```

#### Error Prevention and Recovery
```css
/* Clear error messages and recovery options */
.error-message {
  background: rgba(244, 67, 54, 0.1);
  border: 2px solid rgba(244, 67, 54, 0.6);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  
  .error-icon {
    width: 24px;
    height: 24px;
    margin-right: 12px;
    vertical-align: middle;
  }
  
  .error-title {
    font-size: 16px;
    font-weight: 600;
    color: rgba(244, 67, 54, 1);
    margin-bottom: 8px;
  }
  
  .error-description {
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 12px;
  }
  
  .error-actions {
    display: flex;
    gap: 12px;
    
    .retry-button {
      background: rgba(244, 67, 54, 0.8);
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
    }
    
    .help-button {
      background: transparent;
      color: rgba(244, 67, 54, 0.8);
      border: 1px solid rgba(244, 67, 54, 0.6);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
    }
  }
}
```

## Screen Reader Support

### Semantic HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cosmic Music Visualizer</title>
</head>
<body>
  <!-- Main application structure -->
  <header role="banner">
    <h1>Cosmic Music Visualizer</h1>
    <nav role="navigation" aria-label="Main navigation">
      <ul>
        <li><a href="#file-section">File Management</a></li>
        <li><a href="#controls-section">Audio Controls</a></li>
        <li><a href="#visualization-section">Visualization</a></li>
        <li><a href="#settings-section">Settings</a></li>
      </ul>
    </nav>
  </header>

  <main role="main">
    <section id="file-section" aria-labelledby="file-heading">
      <h2 id="file-heading">File Management</h2>
      <!-- File management content -->
    </section>

    <section id="visualization-section" aria-labelledby="viz-heading">
      <h2 id="viz-heading">Music Visualization</h2>
      <div role="img" aria-labelledby="viz-description" aria-describedby="viz-live-region">
        <!-- Visualization canvas -->
      </div>
      <div id="viz-description">
        Real-time visual representation of your music using cosmic particle effects
      </div>
      <div id="viz-live-region" aria-live="polite" aria-atomic="true" class="sr-only">
        <!-- Live updates about visualization state -->
      </div>
    </section>

    <section id="controls-section" aria-labelledby="controls-heading">
      <h2 id="controls-heading">Audio Controls</h2>
      <div role="toolbar" aria-label="Audio playback controls">
        <!-- Audio controls -->
      </div>
    </section>
  </main>

  <footer role="contentinfo">
    <p>Cosmic Music Visualizer - Accessible for all users</p>
  </footer>
</body>
</html>
```

### ARIA Live Regions
```html
<!-- Status announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  <span id="status-announcements"></span>
</div>

<!-- Real-time updates -->
<div aria-live="assertive" aria-atomic="false" class="sr-only">
  <span id="urgent-announcements"></span>
</div>

<!-- Audio analysis updates -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  <span id="audio-analysis-updates"></span>
</div>
```

```javascript
// Screen reader announcement system
class ScreenReaderManager {
  constructor() {
    this.statusElement = document.getElementById('status-announcements');
    this.urgentElement = document.getElementById('urgent-announcements');
    this.analysisElement = document.getElementById('audio-analysis-updates');
  }
  
  announceStatus(message) {
    this.statusElement.textContent = message;
  }
  
  announceUrgent(message) {
    this.urgentElement.textContent = message;
  }
  
  announceAudioAnalysis(data) {
    const message = `Audio playing: ${data.filename}. 
      Current time: ${data.currentTime} of ${data.duration}. 
      Effect: ${data.currentEffect}. 
      Volume: ${Math.round(data.volume * 100)}%.`;
    
    this.analysisElement.textContent = message;
  }
  
  announceVisualizationChange(effect) {
    this.announceStatus(`Visualization changed to ${effect} effect`);
  }
  
  announceError(error) {
    this.announceUrgent(`Error: ${error.message}. ${error.solution}`);
  }
}
```

## Testing and Validation

### Accessibility Testing Checklist
```markdown
# Accessibility Testing Checklist

## Automated Testing
- [ ] axe-core accessibility testing
- [ ] WAVE Web Accessibility Evaluation
- [ ] Lighthouse accessibility audit
- [ ] Color contrast analyzer
- [ ] Keyboard navigation testing

## Manual Testing
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Keyboard-only navigation
- [ ] High contrast mode testing
- [ ] Reduced motion preference testing
- [ ] Voice control testing
- [ ] Switch control testing

## User Testing
- [ ] Users with visual impairments
- [ ] Users with hearing impairments
- [ ] Users with motor disabilities
- [ ] Users with cognitive disabilities
- [ ] Users with epilepsy/photosensitive conditions

## Content Validation
- [ ] Alt text for all images
- [ ] Captions for audio content
- [ ] Clear heading structure
- [ ] Descriptive link text
- [ ] Error message clarity
- [ ] Form label associations
```

These comprehensive accessibility guidelines ensure that the Music Visualizer provides an inclusive experience for users of all abilities while maintaining the cosmic aesthetic and full functionality.
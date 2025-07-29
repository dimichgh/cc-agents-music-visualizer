# Audio Controls Component - Music Visualizer Application

## Component Overview

The Audio Controls component serves as the mission command center for the music visualization experience. It combines traditional audio playback functionality with cosmic-themed visual design and advanced features specific to audio analysis and visualization.

## Component Architecture

### Primary Control Panel Layout
```
┌─────────────────────────────────────────────────────────────────────────┐
│                          MISSION COMMAND                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐  ┌───────────────────────────────┐  ┌────────────┐ │
│  │   TRANSPORT     │  │        WAVEFORM DISPLAY       │  │  MISSION   │ │
│  │     CONTROLS    │  │                               │  │    INFO    │ │
│  │                 │  │ ████▓▓▓▓▓░░░░░░░░░░░░░░░░░░░ │  │            │ │
│  │  [◀◀] [▶] [▶▶] │  │        ▲                     │  │ 02:34 /    │ │
│  │      [■]        │  │    Playhead                   │  │ 04:56      │ │
│  │                 │  │                               │  │            │ │
│  │   🔊 ■■■■■□□    │  │ [Frequency Visualization]     │  │ File:      │ │
│  │      Volume     │  │                               │  │ cosmic.wav │ │
│  └─────────────────┘  └───────────────────────────────┘  └────────────┘ │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                        ADVANCED CONTROLS                           │ │
│  │                                                                     │ │
│  │ Input: [File Mode ▼] [🎵] BPM: 128  Key: Dm  [🎯] [⚙] [💾] [📤] │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## Transport Controls

### Primary Playback Buttons

#### Play/Pause Button (Mission Launch/Hold)
```css
.cosmic-play-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #448aff 0%, #7c4dff 100%);
  border: 2px solid rgba(100, 255, 218, 0.3);
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 
      0 0 20px rgba(68, 138, 255, 0.4),
      0 4px 16px rgba(0, 0, 0, 0.2);
    border-color: rgba(100, 255, 218, 0.6);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  /* Play icon */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 55%;
    transform: translate(-50%, -50%);
    width: 0;
    height: 0;
    border-left: 12px solid #ffffff;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    transition: all 0.2s ease;
  }
  
  /* Pause state */
  &.paused::before {
    border: none;
    width: 12px;
    height: 16px;
    background: 
      linear-gradient(to right, #ffffff 0%, #ffffff 40%, transparent 40%, transparent 60%, #ffffff 60%, #ffffff 100%);
    left: 50%;
  }
}
```

#### Skip Controls (Temporal Navigation)
```css
.cosmic-skip-button {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(42, 42, 64, 0.8);
  border: 1px solid rgba(100, 255, 218, 0.2);
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(58, 58, 85, 0.9);
    border-color: rgba(100, 255, 218, 0.4);
    transform: translateY(-1px);
  }
  
  /* Previous track icon */
  &.previous::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 0;
    height: 0;
    border-right: 8px solid rgba(100, 255, 218, 0.8);
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
  }
  
  &.previous::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 35%;
    transform: translate(-50%, -50%);
    width: 2px;
    height: 12px;
    background: rgba(100, 255, 218, 0.8);
  }
}
```

#### Stop Button (Mission Abort)
```css
.cosmic-stop-button {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(244, 67, 54, 0.2);
    border-color: rgba(244, 67, 54, 0.5);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 12px;
    background: rgba(244, 67, 54, 0.8);
    border-radius: 2px;
  }
}
```

## Waveform Display

### Interactive Waveform Visualization
```css
.cosmic-waveform {
  width: 100%;
  height: 64px;
  background: rgba(26, 26, 37, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(100, 255, 218, 0.1);
  position: relative;
  overflow: hidden;
  
  /* Cosmic background effect */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(ellipse 200px 100px at 25% 50%, rgba(100, 255, 218, 0.1) 0%, transparent 70%),
      radial-gradient(ellipse 200px 100px at 75% 50%, rgba(124, 77, 255, 0.1) 0%, transparent 70%);
    animation: cosmic-drift 8s infinite ease-in-out;
  }
}

.waveform-bars {
  display: flex;
  align-items: flex-end;
  height: 100%;
  padding: 8px;
  gap: 1px;
  
  .bar {
    flex: 1;
    background: linear-gradient(to top, 
      rgba(100, 255, 218, 0.6) 0%, 
      rgba(100, 255, 218, 0.3) 50%, 
      rgba(100, 255, 218, 0.1) 100%);
    border-radius: 1px 1px 0 0;
    transition: all 0.1s ease;
    
    &.played {
      background: linear-gradient(to top, 
        rgba(124, 77, 255, 0.8) 0%, 
        rgba(124, 77, 255, 0.5) 50%, 
        rgba(124, 77, 255, 0.2) 100%);
    }
    
    &.current {
      background: linear-gradient(to top, 
        rgba(255, 64, 129, 0.9) 0%, 
        rgba(255, 64, 129, 0.6) 50%, 
        rgba(255, 64, 129, 0.3) 100%);
      transform: scaleY(1.2);
      box-shadow: 0 0 8px rgba(255, 64, 129, 0.5);
    }
  }
}

.playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, 
    rgba(255, 255, 255, 0.9) 0%, 
    rgba(100, 255, 218, 0.8) 50%, 
    rgba(255, 255, 255, 0.9) 100%);
  box-shadow: 
    0 0 8px rgba(100, 255, 218, 0.6),
    0 0 16px rgba(100, 255, 218, 0.3);
  transition: left 0.1s ease;
  z-index: 10;
}
```

### Frequency Visualization Overlay
```css
.frequency-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 24px;
  background: linear-gradient(to right,
    rgba(255, 109, 0, 0.3) 0%,    /* Bass */
    rgba(255, 193, 7, 0.3) 20%,   /* Low-mid */
    rgba(100, 255, 218, 0.3) 40%, /* Mid */
    rgba(68, 138, 255, 0.3) 60%,  /* High-mid */
    rgba(124, 77, 255, 0.3) 80%,  /* High */
    rgba(255, 255, 255, 0.3) 100% /* Ultra-high */
  );
  border-radius: 0 0 8px 8px;
  
  .frequency-band {
    position: absolute;
    bottom: 0;
    width: 16.66%;
    background: currentColor;
    transition: height 0.1s ease;
    border-radius: 2px 2px 0 0;
  }
}
```

## Volume Control

### Cosmic Volume Slider
```css
.cosmic-volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .volume-icon {
    width: 20px;
    height: 20px;
    background: url('./icons/cosmic-speaker.svg') center/contain no-repeat;
    opacity: 0.7;
    transition: opacity 0.2s ease;
    
    &:hover {
      opacity: 1;
    }
  }
  
  .volume-slider {
    width: 80px;
    height: 4px;
    background: rgba(58, 58, 85, 0.6);
    border-radius: 2px;
    position: relative;
    cursor: pointer;
    
    .volume-track {
      height: 100%;
      background: linear-gradient(to right, 
        rgba(100, 255, 218, 0.8) 0%, 
        rgba(68, 138, 255, 0.8) 100%);
      border-radius: 2px;
      transition: width 0.2s ease;
    }
    
    .volume-handle {
      position: absolute;
      top: 50%;
      right: 0;
      transform: translate(50%, -50%);
      width: 12px;
      height: 12px;
      background: radial-gradient(circle, 
        rgba(255, 255, 255, 0.9) 0%, 
        rgba(100, 255, 218, 0.8) 100%);
      border-radius: 50%;
      box-shadow: 
        0 0 8px rgba(100, 255, 218, 0.4),
        0 2px 4px rgba(0, 0, 0, 0.2);
      cursor: grab;
      transition: transform 0.2s ease;
      
      &:hover {
        transform: translate(50%, -50%) scale(1.2);
      }
      
      &:active {
        cursor: grabbing;
        transform: translate(50%, -50%) scale(1.1);
      }
    }
  }
}
```

## Mission Info Panel

### Track Information Display
```css
.mission-info {
  background: rgba(26, 26, 37, 0.6);
  border: 1px solid rgba(100, 255, 218, 0.1);
  border-radius: 8px;
  padding: 12px;
  backdrop-filter: blur(10px);
  
  .time-display {
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    font-weight: 500;
    color: rgba(100, 255, 218, 0.9);
    text-align: center;
    margin-bottom: 8px;
    
    .current-time {
      color: rgba(255, 255, 255, 0.9);
    }
    
    .separator {
      color: rgba(100, 255, 218, 0.5);
      margin: 0 4px;
    }
    
    .total-time {
      color: rgba(100, 255, 218, 0.7);
    }
  }
  
  .file-info {
    .file-label {
      font-size: 11px;
      color: rgba(100, 255, 218, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    
    .file-name {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120px;
    }
  }
}
```

## Advanced Controls

### Input Mode Selector
```css
.input-mode-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .mode-dropdown {
    background: rgba(42, 42, 64, 0.8);
    border: 1px solid rgba(100, 255, 218, 0.2);
    border-radius: 6px;
    padding: 6px 12px 6px 8px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 12px;
    cursor: pointer;
    position: relative;
    
    &::after {
      content: '▼';
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 8px;
      color: rgba(100, 255, 218, 0.7);
    }
    
    &:hover {
      border-color: rgba(100, 255, 218, 0.4);
      background: rgba(58, 58, 85, 0.9);
    }
  }
  
  .live-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(76, 175, 80, 0.8);
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
    animation: pulse 2s infinite ease-in-out;
    
    &.inactive {
      background: rgba(158, 158, 158, 0.4);
      box-shadow: none;
      animation: none;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}
```

### Audio Analysis Display
```css
.audio-analysis {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 11px;
  color: rgba(100, 255, 218, 0.7);
  
  .bpm-display {
    display: flex;
    align-items: center;
    gap: 4px;
    
    .bpm-icon {
      width: 12px;
      height: 12px;
      background: url('./icons/cosmic-heartbeat.svg') center/contain no-repeat;
      opacity: 0.7;
    }
    
    .bpm-value {
      color: rgba(255, 255, 255, 0.8);
      font-weight: 500;
    }
  }
  
  .key-display {
    display: flex;
    align-items: center;
    gap: 4px;
    
    .key-icon {
      width: 12px;
      height: 12px;
      background: url('./icons/cosmic-key.svg') center/contain no-repeat;
      opacity: 0.7;
    }
    
    .key-value {
      color: rgba(255, 255, 255, 0.8);
      font-weight: 500;
    }
  }
}
```

### Action Buttons
```css
.action-buttons {
  display: flex;
  gap: 8px;
  
  .action-button {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: rgba(42, 42, 64, 0.6);
    border: 1px solid rgba(100, 255, 218, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(58, 58, 85, 0.8);
      border-color: rgba(100, 255, 218, 0.4);
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(0);
    }
    
    .icon {
      width: 16px;
      height: 16px;
      opacity: 0.7;
      
      &.sync-icon { background: url('./icons/cosmic-sync.svg') center/contain no-repeat; }
      &.settings-icon { background: url('./icons/cosmic-settings.svg') center/contain no-repeat; }
      &.save-icon { background: url('./icons/cosmic-save.svg') center/contain no-repeat; }
      &.export-icon { background: url('./icons/cosmic-export.svg') center/contain no-repeat; }
    }
    
    &:hover .icon {
      opacity: 1;
    }
  }
}
```

## Interaction Behaviors

### Keyboard Shortcuts
- **Space**: Play/Pause toggle
- **Left/Right Arrow**: Skip ±10 seconds
- **Shift + Left/Right Arrow**: Skip ±30 seconds  
- **Up/Down Arrow**: Volume ±10%
- **M**: Mute toggle
- **F**: Toggle fullscreen visualization
- **R**: Reset to beginning

### Mouse Interactions
- **Waveform Click**: Seek to position
- **Volume Slider Drag**: Adjust volume level
- **Button Hover**: Preview action with cosmic glow effect
- **Playhead Drag**: Scrub through audio timeline

### Touch Gestures (for touch-capable devices)
- **Tap Waveform**: Seek to position
- **Pinch Waveform**: Zoom timeline view
- **Swipe Left/Right**: Skip tracks
- **Long Press Play**: Show playback options menu

## Accessibility Features

### Screen Reader Support
```html
<button class="cosmic-play-button" 
        aria-label="Play cosmic journey" 
        aria-pressed="false"
        role="button">
  <span class="sr-only">Launch mission playback</span>
</button>

<div class="cosmic-waveform" 
     role="slider" 
     aria-label="Audio timeline"
     aria-valuemin="0" 
     aria-valuemax="100" 
     aria-valuenow="25"
     aria-valuetext="2 minutes 34 seconds of 4 minutes 56 seconds">
</div>
```

### Keyboard Navigation
- **Tab Order**: Transport controls → Waveform → Volume → Advanced controls
- **Focus Indicators**: Cosmic glow effects for focused elements
- **Escape Key**: Return focus to main visualization area

### High Contrast Support
```css
@media (prefers-contrast: high) {
  .cosmic-play-button {
    background: #0066cc;
    border: 2px solid #ffffff;
    color: #ffffff;
  }
  
  .waveform-bars .bar {
    background: #00ff00;
    
    &.played {
      background: #ffff00;
    }
    
    &.current {
      background: #ff0000;
    }
  }
}
```

This comprehensive audio controls component provides an immersive, accessible, and highly functional interface for controlling music playback while maintaining the cosmic aesthetic and supporting advanced audio analysis features.
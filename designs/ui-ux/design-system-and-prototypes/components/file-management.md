# File Management Interface - Music Visualizer Application

## Component Overview

The File Management Interface serves as the **Cosmic Archive System** for the Music Visualizer, enabling users to discover, organize, and access their audio content with an intuitive space-exploration metaphor. The interface supports multiple input methods and provides rich metadata visualization.

## Interface Architecture

### Primary File Management Layout
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            COSMIC ARCHIVE SYSTEM                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         SECTOR EXPLORER                             │   │
│  │                                                                     │   │
│  │  [📁 My Music]  [⭐ Favorites]  [🎵 Recent]  [🔴 Live Input]      │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    DROP ZONE ACTIVE                         │   │   │
│  │  │                                                             │   │   │
│  │  │         🌌 Drop WAV files here to begin exploration        │   │   │
│  │  │              or click to browse your system                │   │   │
│  │  │                                                             │   │   │
│  │  │                    [Browse Files] [Scan Directory]         │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DISCOVERED SIGNALS                           │   │
│  │                                                                     │   │
│  │  🎵 cosmic_dream.wav        [▶] [⭐] [📊] [🗑]                     │   │
│  │     ████▓▓▓░░░░░░ 4:23   Duration   192 kHz   Stereo               │   │
│  │                                                                     │   │
│  │  🎵 stellar_ambience.wav   [▶] [⭐] [📊] [🗑]                     │   │
│  │     ████████▓░░░░ 6:45   Duration   96 kHz    Mono                 │   │
│  │                                                                     │   │
│  │  🎵 quantum_beats.wav      [▶] [⭐] [📊] [🗑]                     │   │
│  │     ██▓▓▓▓░░░░░░░ 3:12   Duration   48 kHz    Stereo               │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      SIGNAL ANALYSIS PREVIEW                       │   │
│  │  Selected: cosmic_dream.wav                                        │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ ████▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │   │   │
│  │  │ BPM: 128  Key: Dm  Complexity: ████████░░  Energy: ██████░░  │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │  [Load for Visualization] [Add to Favorites] [Quick Preview]       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## File Browser Components

### Sector Explorer (File Browser Tabs)
```css
.sector-explorer {
  background: rgba(26, 26, 37, 0.8);
  border-radius: 12px 12px 0 0;
  border: 1px solid rgba(100, 255, 218, 0.2);
  backdrop-filter: blur(10px);
  
  .sector-tabs {
    display: flex;
    padding: 16px 16px 0 16px;
    gap: 8px;
    
    .sector-tab {
      padding: 8px 16px;
      border-radius: 8px 8px 0 0;
      background: rgba(42, 42, 64, 0.6);
      border: 1px solid rgba(100, 255, 218, 0.1);
      border-bottom: none;
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      
      &:hover {
        background: rgba(58, 58, 85, 0.8);
        color: rgba(100, 255, 218, 0.8);
        border-color: rgba(100, 255, 218, 0.3);
      }
      
      &.active {
        background: rgba(100, 255, 218, 0.1);
        color: rgba(100, 255, 218, 0.9);
        border-color: rgba(100, 255, 218, 0.4);
        
        &::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(to right, 
            rgba(100, 255, 218, 0.8), 
            rgba(68, 138, 255, 0.8));
        }
      }
      
      .tab-icon {
        margin-right: 6px;
        font-size: 14px;
      }
    }
  }
}
```

### Cosmic Drop Zone
```css
.cosmic-drop-zone {
  margin: 16px;
  padding: 48px 24px;
  border: 2px dashed rgba(100, 255, 218, 0.3);
  border-radius: 12px;
  background: 
    radial-gradient(ellipse 400px 200px at center, rgba(100, 255, 218, 0.05) 0%, transparent 70%),
    rgba(26, 26, 37, 0.4);
  text-align: center;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
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
      rgba(100, 255, 218, 0.1) 50%, 
      transparent 100%);
    animation: cosmic-scan 3s infinite linear;
  }
  
  &.drag-over {
    border-color: rgba(100, 255, 218, 0.6);
    background: 
      radial-gradient(ellipse 400px 200px at center, rgba(100, 255, 218, 0.15) 0%, transparent 70%),
      rgba(26, 26, 37, 0.6);
    transform: scale(1.02);
    
    .drop-message {
      color: rgba(100, 255, 218, 0.9);
      transform: scale(1.05);
    }
  }
  
  &.processing {
    border-color: rgba(124, 77, 255, 0.6);
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(124, 77, 255, 0.1);
      animation: pulse 1s infinite ease-in-out;
    }
  }
  
  .drop-icon {
    font-size: 48px;
    color: rgba(100, 255, 218, 0.6);
    margin-bottom: 16px;
    animation: float 3s infinite ease-in-out;
  }
  
  .drop-message {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 24px;
    transition: all 0.3s ease;
    
    .primary-text {
      font-weight: 500;
      color: rgba(100, 255, 218, 0.9);
    }
    
    .secondary-text {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 8px;
    }
  }
  
  .action-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
    
    .cosmic-button {
      padding: 10px 20px;
      border-radius: 8px;
      border: 1px solid rgba(100, 255, 218, 0.3);
      background: rgba(42, 42, 64, 0.8);
      color: rgba(100, 255, 218, 0.9);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(58, 58, 85, 0.9);
        border-color: rgba(100, 255, 218, 0.5);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(100, 255, 218, 0.2);
      }
      
      &.primary {
        background: linear-gradient(135deg, rgba(100, 255, 218, 0.2), rgba(68, 138, 255, 0.2));
        border-color: rgba(100, 255, 218, 0.5);
      }
    }
  }
}

@keyframes cosmic-scan {
  0% { left: -100%; }
  100% { left: 100%; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
```

## File List Components

### Discovered Signals (File List)
```css
.discovered-signals {
  background: rgba(26, 26, 37, 0.6);
  border-radius: 0 0 12px 12px;
  border: 1px solid rgba(100, 255, 218, 0.2);
  border-top: none;
  max-height: 300px;
  overflow-y: auto;
  
  .signals-header {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(100, 255, 218, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-title {
      font-size: 14px;
      font-weight: 600;
      color: rgba(100, 255, 218, 0.9);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .signals-count {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      background: rgba(42, 42, 64, 0.6);
      padding: 4px 8px;
      border-radius: 4px;
    }
  }
  
  .signal-item {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(100, 255, 218, 0.05);
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    
    &:hover {
      background: rgba(42, 42, 64, 0.4);
      
      .signal-actions {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    &.selected {
      background: rgba(100, 255, 218, 0.1);
      border-left: 3px solid rgba(100, 255, 218, 0.6);
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(to bottom, 
          rgba(100, 255, 218, 0.8), 
          rgba(68, 138, 255, 0.8));
        animation: signal-pulse 2s infinite ease-in-out;
      }
    }
    
    .signal-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, 
        rgba(100, 255, 218, 0.2), 
        rgba(68, 138, 255, 0.2));
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: rgba(100, 255, 218, 0.8);
    }
    
    .signal-info {
      flex: 1;
      min-width: 0;
      
      .signal-name {
        font-size: 14px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.9);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 4px;
      }
      
      .signal-metadata {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
        
        .waveform-mini {
          flex: 1;
          height: 16px;
          background: rgba(42, 42, 64, 0.6);
          border-radius: 2px;
          position: relative;
          overflow: hidden;
          
          .waveform-bars {
            display: flex;
            height: 100%;
            align-items: flex-end;
            padding: 2px;
            gap: 1px;
            
            .bar {
              flex: 1;
              background: rgba(100, 255, 218, 0.4);
              border-radius: 1px 1px 0 0;
              min-height: 2px;
            }
          }
        }
        
        .metadata-item {
          display: flex;
          align-items: center;
          gap: 2px;
          white-space: nowrap;
          
          .metadata-icon {
            width: 10px;
            height: 10px;
            opacity: 0.6;
          }
        }
      }
    }
    
    .signal-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transform: translateX(10px);
      transition: all 0.2s ease;
      
      .action-button {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        background: rgba(42, 42, 64, 0.8);
        border: 1px solid rgba(100, 255, 218, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          background: rgba(58, 58, 85, 0.9);
          border-color: rgba(100, 255, 218, 0.4);
          transform: scale(1.1);
        }
        
        .icon {
          width: 12px;
          height: 12px;
          opacity: 0.7;
          
          &.play-icon { background: url('./icons/play-mini.svg') center/contain no-repeat; }
          &.favorite-icon { background: url('./icons/star-mini.svg') center/contain no-repeat; }
          &.analyze-icon { background: url('./icons/chart-mini.svg') center/contain no-repeat; }
          &.delete-icon { background: url('./icons/trash-mini.svg') center/contain no-repeat; }
        }
        
        &:hover .icon {
          opacity: 1;
        }
        
        &.favorited .favorite-icon {
          background-image: url('./icons/star-filled-mini.svg');
          opacity: 1;
        }
      }
    }
  }
}

@keyframes signal-pulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}
```

## Signal Analysis Preview

### Audio File Preview Panel
```css
.signal-analysis-preview {
  background: rgba(26, 26, 37, 0.8);
  border: 1px solid rgba(100, 255, 218, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  
  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .selected-file {
      font-size: 14px;
      font-weight: 600;
      color: rgba(100, 255, 218, 0.9);
      
      .file-path {
        font-size: 12px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.6);
        margin-top: 2px;
      }
    }
    
    .preview-controls {
      display: flex;
      gap: 8px;
      
      .control-button {
        padding: 6px 12px;
        border-radius: 6px;
        background: rgba(42, 42, 64, 0.6);
        border: 1px solid rgba(100, 255, 218, 0.2);
        color: rgba(100, 255, 218, 0.8);
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          background: rgba(58, 58, 85, 0.8);
          border-color: rgba(100, 255, 218, 0.4);
        }
      }
    }
  }
  
  .waveform-preview {
    height: 80px;
    background: rgba(42, 42, 64, 0.4);
    border-radius: 8px;
    margin-bottom: 16px;
    position: relative;
    overflow: hidden;
    
    .waveform-canvas {
      width: 100%;
      height: 100%;
      background: linear-gradient(to right,
        rgba(100, 255, 218, 0.1) 0%,
        rgba(68, 138, 255, 0.1) 50%,
        rgba(124, 77, 255, 0.1) 100%);
    }
    
    .analysis-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 20px;
      background: rgba(26, 26, 37, 0.8);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      padding: 0 12px;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.7);
      gap: 16px;
    }
  }
  
  .analysis-metrics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
    
    .metric {
      text-align: center;
      
      .metric-label {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.6);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      
      .metric-value {
        font-size: 14px;
        font-weight: 600;
        color: rgba(100, 255, 218, 0.9);
        margin-bottom: 4px;
      }
      
      .metric-bar {
        height: 4px;
        background: rgba(42, 42, 64, 0.6);
        border-radius: 2px;
        overflow: hidden;
        
        .metric-fill {
          height: 100%;
          background: linear-gradient(to right, 
            rgba(100, 255, 218, 0.6), 
            rgba(68, 138, 255, 0.6));
          border-radius: 2px;
          transition: width 0.3s ease;
        }
      }
    }
  }
  
  .action-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
    
    .primary-action {
      padding: 10px 24px;
      border-radius: 8px;
      background: linear-gradient(135deg, 
        rgba(100, 255, 218, 0.8), 
        rgba(68, 138, 255, 0.8));
      border: none;
      color: rgba(10, 10, 15, 0.9);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(100, 255, 218, 0.3);
      }
    }
    
    .secondary-action {
      padding: 10px 20px;
      border-radius: 8px;
      background: rgba(42, 42, 64, 0.6);
      border: 1px solid rgba(100, 255, 218, 0.3);
      color: rgba(100, 255, 218, 0.8);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(58, 58, 85, 0.8);
        border-color: rgba(100, 255, 218, 0.5);
      }
    }
  }
}
```

## Live Input Configuration

### Live Input Setup Panel
```css
.live-input-panel {
  background: rgba(26, 26, 37, 0.8);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 12px;
  padding: 16px;
  
  .live-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    
    .live-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: rgba(76, 175, 80, 0.8);
      box-shadow: 0 0 12px rgba(76, 175, 80, 0.6);
      animation: live-pulse 2s infinite ease-in-out;
    }
    
    .live-label {
      font-size: 14px;
      font-weight: 600;
      color: rgba(76, 175, 80, 0.9);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
  
  .input-device-selector {
    margin-bottom: 16px;
    
    .device-label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 8px;
    }
    
    .device-dropdown {
      width: 100%;
      padding: 8px 12px;
      background: rgba(42, 42, 64, 0.8);
      border: 1px solid rgba(76, 175, 80, 0.3);
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      cursor: pointer;
      
      &:hover {
        border-color: rgba(76, 175, 80, 0.5);
      }
    }
  }
  
  .level-meter {
    background: rgba(42, 42, 64, 0.6);
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 16px;
    
    .meter-label {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 8px;
    }
    
    .meter-bars {
      display: flex;
      gap: 2px;
      height: 24px;
      align-items: flex-end;
      
      .meter-bar {
        flex: 1;
        background: rgba(58, 58, 85, 0.6);
        border-radius: 1px 1px 0 0;
        transition: all 0.1s ease;
        
        &.active {
          background: linear-gradient(to top,
            rgba(76, 175, 80, 0.8) 0%,
            rgba(255, 193, 7, 0.8) 70%,
            rgba(244, 67, 54, 0.8) 100%);
        }
      }
    }
  }
  
  .latency-monitor {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
    
    .latency-value {
      color: rgba(76, 175, 80, 0.8);
      font-weight: 500;
    }
  }
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}
```

## Error States and Loading

### File Processing States
```css
.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 26, 37, 0.9);
  backdrop-filter: blur(5px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  
  .cosmic-loader {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(100, 255, 218, 0.2);
    border-top: 3px solid rgba(100, 255, 218, 0.8);
    border-radius: 50%;
    animation: cosmic-spin 1s linear infinite;
    margin-bottom: 16px;
  }
  
  .processing-message {
    font-size: 14px;
    color: rgba(100, 255, 218, 0.9);
    text-align: center;
    
    .progress-text {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 4px;
    }
  }
}

.error-state {
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  
  .error-icon {
    font-size: 32px;
    color: rgba(244, 67, 54, 0.8);
    margin-bottom: 12px;
  }
  
  .error-message {
    font-size: 14px;
    color: rgba(244, 67, 54, 0.9);
    margin-bottom: 8px;
  }
  
  .error-details {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 16px;
  }
  
  .retry-button {
    padding: 8px 16px;
    background: rgba(244, 67, 54, 0.2);
    border: 1px solid rgba(244, 67, 54, 0.4);
    border-radius: 6px;
    color: rgba(244, 67, 54, 0.9);
    cursor: pointer;
    
    &:hover {
      background: rgba(244, 67, 54, 0.3);
    }
  }
}

@keyframes cosmic-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

## Accessibility Features

### Keyboard Navigation
- **Tab Order**: Tabs → Drop zone → File list → Preview panel
- **Arrow Keys**: Navigate through file list items
- **Enter/Space**: Select file or activate buttons
- **Escape**: Clear selection or close panels

### Screen Reader Support
```html
<div class="discovered-signals" role="listbox" aria-label="Audio file library">
  <div class="signal-item" 
       role="option" 
       aria-selected="false"
       aria-label="Audio file: cosmic_dream.wav, duration 4 minutes 23 seconds">
    <button class="action-button" 
            aria-label="Play preview of cosmic_dream.wav">
      <span class="sr-only">Play preview</span>
    </button>
  </div>
</div>
```

### File Format Support
- **Primary**: WAV files (uncompressed audio)
- **Analysis**: Automatic format detection and validation
- **Error Handling**: Clear feedback for unsupported formats
- **Batch Processing**: Multiple file selection and processing

This comprehensive file management interface provides an intuitive, cosmic-themed experience for discovering and organizing audio content while maintaining accessibility and robust functionality.
# Settings Panels Component - Music Visualizer Application

## Component Overview

The Settings Panels provide **Mission Control Configuration** for the Music Visualizer, offering comprehensive customization of visual effects, audio processing, performance optimization, and accessibility features. The interface uses a cosmic command center aesthetic with organized, progressive disclosure of advanced options.

## Settings Architecture

### Main Settings Interface
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MISSION CONTROL CONFIGURATION                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       CONFIGURATION SECTORS                        │   │
│  │                                                                     │   │
│  │  [🌌 Visual Effects] [🎵 Audio] [⚡ Performance] [♿ Access] [🔧 Advanced] │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      VISUAL EFFECTS SETTINGS                       │   │
│  │                                                                     │   │
│  │  Effect Style                                                       │   │
│  │  ○ Stellar Nursery    ● Galactic Core    ○ Solar Wind    ○ Quantum │   │
│  │                                                                     │   │
│  │  Particle Density: ●●●●●●○○○○ (6000 particles)                     │   │
│  │  Animation Speed:  ●●●●○○○○○○ (2.5x normal)                        │   │
│  │  Color Intensity:  ●●●●●●●○○○ (70% saturation)                     │   │
│  │                                                                     │   │
│  │  🎨 Color Palette: [Aurora Borealis ▼]                            │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  Instrument Shadows: [✓] Piano [✓] Guitar [✓] Drums [○] Vocals    │   │
│  │  Shadow Opacity: ●●●●○○○○○○ (40%)                                  │   │
│  │                                                                     │   │
│  │  [Reset to Defaults] [Save Preset] [Load Preset]                   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Settings Panel Structure

### Tab Navigation System
```css
.mission-control-settings {
  background: rgba(26, 26, 37, 0.95);
  border: 2px solid rgba(100, 255, 218, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 16px 48px rgba(0, 0, 0, 0.4),
    inset 0 0 100px rgba(100, 255, 218, 0.05);
  max-width: 800px;
  max-height: 600px;
  overflow: hidden;
  
  .settings-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid rgba(100, 255, 218, 0.1);
    
    .header-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: rgba(100, 255, 218, 0.9);
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }
    
    .configuration-sectors {
      display: flex;
      justify-content: center;
      gap: 8px;
      
      .sector-tab {
        padding: 8px 16px;
        border-radius: 8px;
        background: rgba(42, 42, 64, 0.6);
        border: 1px solid rgba(100, 255, 218, 0.2);
        color: rgba(255, 255, 255, 0.7);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        position: relative;
        
        &:hover {
          background: rgba(58, 58, 85, 0.8);
          color: rgba(100, 255, 218, 0.8);
          border-color: rgba(100, 255, 218, 0.4);
          transform: translateY(-1px);
        }
        
        &.active {
          background: linear-gradient(135deg, 
            rgba(100, 255, 218, 0.2), 
            rgba(68, 138, 255, 0.2));
          color: rgba(100, 255, 218, 1);
          border-color: rgba(100, 255, 218, 0.6);
          
          &::before {
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
        
        .sector-icon {
          margin-right: 6px;
          font-size: 14px;
        }
      }
    }
  }
  
  .settings-content {
    padding: 24px;
    height: 500px;
    overflow-y: auto;
    
    /* Custom scrollbar */
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(42, 42, 64, 0.3);
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(100, 255, 218, 0.3);
      border-radius: 4px;
      
      &:hover {
        background: rgba(100, 255, 218, 0.5);
      }
    }
  }
}
```

## Visual Effects Settings Panel

### Effect Selection and Customization
```css
.visual-effects-panel {
  .effect-style-selector {
    margin-bottom: 24px;
    
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: rgba(100, 255, 218, 0.9);
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .effect-options {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      
      .effect-option {
        padding: 16px;
        background: rgba(42, 42, 64, 0.4);
        border: 2px solid rgba(100, 255, 218, 0.2);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
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
          transition: left 0.5s ease;
        }
        
        &:hover {
          border-color: rgba(100, 255, 218, 0.4);
          transform: translateY(-2px);
          
          &::before {
            left: 100%;
          }
        }
        
        &.selected {
          background: rgba(100, 255, 218, 0.1);
          border-color: rgba(100, 255, 218, 0.6);
          
          &::after {
            content: '✓';
            position: absolute;
            top: 8px;
            right: 8px;
            width: 20px;
            height: 20px;
            background: rgba(100, 255, 218, 0.8);
            color: rgba(10, 10, 15, 0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
          }
        }
        
        .effect-preview {
          width: 100%;
          height: 40px;
          background: var(--effect-gradient);
          border-radius: 6px;
          margin-bottom: 8px;
          position: relative;
          overflow: hidden;
          
          .preview-animation {
            position: absolute;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, 
              rgba(255, 255, 255, 0.2) 0%, 
              transparent 70%);
            animation: preview-pulse 2s infinite ease-in-out;
          }
        }
        
        .effect-name {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 4px;
        }
        
        .effect-description {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.3;
        }
      }
    }
  }
  
  /* Individual effect gradients */
  .effect-option[data-effect="stellar-nursery"] .effect-preview {
    --effect-gradient: linear-gradient(135deg, 
      rgba(100, 255, 218, 0.3) 0%, 
      rgba(68, 138, 255, 0.3) 100%);
  }
  
  .effect-option[data-effect="galactic-core"] .effect-preview {
    --effect-gradient: radial-gradient(ellipse, 
      rgba(124, 77, 255, 0.4) 0%, 
      rgba(68, 138, 255, 0.3) 70%, 
      transparent 100%);
  }
  
  .effect-option[data-effect="solar-wind"] .effect-preview {
    --effect-gradient: linear-gradient(45deg, 
      rgba(255, 109, 0, 0.3) 0%, 
      rgba(255, 193, 7, 0.3) 50%, 
      rgba(255, 64, 129, 0.3) 100%);
  }
  
  .effect-option[data-effect="quantum-field"] .effect-preview {
    --effect-gradient: 
      repeating-linear-gradient(45deg,
        rgba(100, 255, 218, 0.2) 0px,
        rgba(100, 255, 218, 0.2) 2px,
        transparent 2px,
        transparent 8px);
  }
}

@keyframes preview-pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}
```

### Parameter Controls
```css
.parameter-controls {
  .control-group {
    margin-bottom: 20px;
    
    .control-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      .label-text {
        font-size: 12px;
        color: rgba(100, 255, 218, 0.8);
        font-weight: 500;
      }
      
      .value-display {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.7);
        font-family: 'JetBrains Mono', monospace;
        background: rgba(42, 42, 64, 0.6);
        padding: 2px 6px;
        border-radius: 4px;
      }
    }
    
    .cosmic-range-slider {
      width: 100%;
      height: 6px;
      background: rgba(58, 58, 85, 0.6);
      border-radius: 3px;
      position: relative;
      cursor: pointer;
      
      .slider-track {
        height: 100%;
        background: linear-gradient(to right,
          rgba(100, 255, 218, 0.8) 0%,
          rgba(68, 138, 255, 0.8) 50%,
          rgba(124, 77, 255, 0.8) 100%);
        border-radius: 3px;
        transition: width 0.2s ease;
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%);
          animation: energy-flow 2s infinite linear;
        }
      }
      
      .slider-handle {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
        background: radial-gradient(circle,
          rgba(255, 255, 255, 1) 0%,
          rgba(100, 255, 218, 0.8) 70%,
          rgba(100, 255, 218, 0.4) 100%);
        border-radius: 50%;
        cursor: grab;
        box-shadow: 
          0 0 12px rgba(100, 255, 218, 0.6),
          0 2px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.2s ease;
        
        &:hover {
          transform: translate(-50%, -50%) scale(1.2);
          box-shadow: 
            0 0 16px rgba(100, 255, 218, 0.8),
            0 4px 12px rgba(0, 0, 0, 0.4);
        }
        
        &:active {
          cursor: grabbing;
          transform: translate(-50%, -50%) scale(1.1);
        }
      }
    }
  }
}

@keyframes energy-flow {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### Color Palette Selector
```css
.color-palette-selector {
  .palette-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
    
    .palette-option {
      aspect-ratio: 3/1;
      border-radius: 8px;
      border: 2px solid rgba(100, 255, 218, 0.2);
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      
      &:hover {
        border-color: rgba(100, 255, 218, 0.4);
        transform: scale(1.05);
      }
      
      &.selected {
        border-color: rgba(100, 255, 218, 0.8);
        box-shadow: 0 0 16px rgba(100, 255, 218, 0.4);
        
        &::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: rgba(255, 255, 255, 1);
          font-weight: bold;
          font-size: 14px;
          text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
        }
      }
      
      &.aurora-borealis {
        background: linear-gradient(90deg,
          #64ffda 0%, #448aff 33%, #7c4dff 66%, #ff4081 100%);
      }
      
      &.cosmic-sunset {
        background: linear-gradient(90deg,
          #ff6d00 0%, #ff8f00 33%, #ffc107 66%, #ffeb3b 100%);
      }
      
      &.deep-space {
        background: linear-gradient(90deg,
          #1a1a25 0%, #2a2a40 33%, #3a3a55 66%, #4a4a70 100%);
      }
      
      &.plasma-storm {
        background: linear-gradient(90deg,
          #ff4081 0%, #e91e63 33%, #9c27b0 66%, #673ab7 100%);
      }
      
      &.stellar-nursery {
        background: linear-gradient(90deg,
          #00e5ff 0%, #00bcd4 33%, #009688 66%, #4caf50 100%);
      }
      
      &.quantum-field {
        background: linear-gradient(90deg,
          #ffffff 0%, #e3f2fd 25%, #bbdefb 50%, #90caf9 75%, #64b5f6 100%);
      }
    }
  }
  
  .custom-palette-controls {
    display: flex;
    gap: 8px;
    justify-content: center;
    
    .palette-button {
      padding: 6px 12px;
      border-radius: 6px;
      background: rgba(42, 42, 64, 0.6);
      border: 1px solid rgba(100, 255, 218, 0.3);
      color: rgba(100, 255, 218, 0.8);
      font-size: 11px;
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

## Audio Settings Panel

### Audio Processing Configuration
```css
.audio-settings-panel {
  .audio-device-section {
    margin-bottom: 24px;
    
    .device-selector {
      .device-dropdown {
        width: 100%;
        padding: 10px 12px;
        background: rgba(42, 42, 64, 0.8);
        border: 1px solid rgba(100, 255, 218, 0.3);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
        cursor: pointer;
        
        &:hover {
          border-color: rgba(100, 255, 218, 0.5);
        }
        
        &:focus {
          outline: none;
          border-color: rgba(100, 255, 218, 0.8);
          box-shadow: 0 0 0 2px rgba(100, 255, 218, 0.2);
        }
      }
    }
    
    .device-status {
      margin-top: 8px;
      padding: 8px 12px;
      background: rgba(42, 42, 64, 0.4);
      border-radius: 6px;
      font-size: 11px;
      
      &.connected {
        color: rgba(76, 175, 80, 0.9);
        border-left: 3px solid rgba(76, 175, 80, 0.8);
      }
      
      &.disconnected {
        color: rgba(244, 67, 54, 0.9);
        border-left: 3px solid rgba(244, 67, 54, 0.8);
      }
    }
  }
  
  .analysis-settings {
    .fft-size-selector {
      .fft-options {
        display: flex;
        gap: 8px;
        margin-top: 8px;
        
        .fft-option {
          flex: 1;
          padding: 8px 12px;
          background: rgba(42, 42, 64, 0.6);
          border: 1px solid rgba(100, 255, 218, 0.2);
          border-radius: 6px;
          text-align: center;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            border-color: rgba(100, 255, 218, 0.4);
            color: rgba(255, 255, 255, 0.9);
          }
          
          &.selected {
            background: rgba(100, 255, 218, 0.2);
            border-color: rgba(100, 255, 218, 0.6);
            color: rgba(100, 255, 218, 0.9);
          }
        }
      }
    }
    
    .frequency-range-visualizer {
      margin-top: 16px;
      padding: 12px;
      background: rgba(42, 42, 64, 0.4);
      border-radius: 8px;
      
      .frequency-bars {
        display: flex;
        height: 40px;
        gap: 2px;
        align-items: flex-end;
        
        .freq-bar {
          flex: 1;
          background: linear-gradient(to top,
            rgba(100, 255, 218, 0.3) 0%,
            rgba(68, 138, 255, 0.3) 50%,
            rgba(124, 77, 255, 0.3) 100%);
          border-radius: 1px 1px 0 0;
          min-height: 4px;
          animation: freq-demo 2s infinite ease-in-out;
          
          &:nth-child(odd) {
            animation-delay: 0.1s;
          }
          
          &:nth-child(even) {
            animation-delay: 0.2s;
          }
        }
      }
      
      .frequency-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 4px;
        font-size: 9px;
        color: rgba(255, 255, 255, 0.5);
      }
    }
  }
}

@keyframes freq-demo {
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
}
```

## Performance Settings Panel

### Performance Optimization Controls
```css
.performance-settings-panel {
  .performance-presets {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;
    
    .preset-option {
      padding: 16px 12px;
      background: rgba(42, 42, 64, 0.4);
      border: 2px solid rgba(100, 255, 218, 0.2);
      border-radius: 10px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: rgba(100, 255, 218, 0.4);
        transform: translateY(-2px);
      }
      
      &.selected {
        background: rgba(100, 255, 218, 0.15);
        border-color: rgba(100, 255, 218, 0.8);
      }
      
      .preset-icon {
        font-size: 24px;
        margin-bottom: 8px;
        
        &.quality { color: rgba(100, 255, 218, 0.8); }
        &.balanced { color: rgba(255, 193, 7, 0.8); }
        &.performance { color: rgba(255, 109, 0, 0.8); }
      }
      
      .preset-name {
        font-size: 12px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 4px;
      }
      
      .preset-description {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.6);
        line-height: 1.3;
      }
    }
  }
  
  .performance-metrics {
    background: rgba(42, 42, 64, 0.4);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      
      .metric-item {
        text-align: center;
        
        .metric-value {
          font-size: 18px;
          font-weight: 600;
          color: rgba(100, 255, 218, 0.9);
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 4px;
        }
        
        .metric-label {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .metric-bar {
          width: 100%;
          height: 4px;
          background: rgba(58, 58, 85, 0.6);
          border-radius: 2px;
          margin-top: 6px;
          overflow: hidden;
          
          .metric-fill {
            height: 100%;
            border-radius: 2px;
            transition: width 0.3s ease;
            
            &.fps-fill {
              background: linear-gradient(to right,
                rgba(244, 67, 54, 0.8) 0%,
                rgba(255, 193, 7, 0.8) 50%,
                rgba(76, 175, 80, 0.8) 100%);
            }
            
            &.memory-fill {
              background: linear-gradient(to right,
                rgba(76, 175, 80, 0.8) 0%,
                rgba(255, 193, 7, 0.8) 70%,
                rgba(244, 67, 54, 0.8) 100%);
            }
            
            &.gpu-fill {
              background: linear-gradient(to right,
                rgba(100, 255, 218, 0.8) 0%,
                rgba(68, 138, 255, 0.8) 100%);
            }
            
            &.particles-fill {
              background: linear-gradient(to right,
                rgba(124, 77, 255, 0.8) 0%,
                rgba(255, 64, 129, 0.8) 100%);
            }
          }
        }
      }
    }
  }
  
  .advanced-performance-controls {
    .toggle-controls {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      
      .performance-toggle {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: rgba(42, 42, 64, 0.4);
        border-radius: 8px;
        
        .toggle-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .cosmic-toggle {
          width: 40px;
          height: 20px;
          background: rgba(58, 58, 85, 0.6);
          border-radius: 10px;
          position: relative;
          cursor: pointer;
          transition: all 0.3s ease;
          
          &.active {
            background: rgba(100, 255, 218, 0.6);
          }
          
          .toggle-handle {
            width: 16px;
            height: 16px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            position: absolute;
            top: 2px;
            left: 2px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          &.active .toggle-handle {
            left: 22px;
            background: rgba(10, 10, 15, 0.9);
          }
        }
      }
    }
  }
}
```

## Accessibility Settings Panel

### Accessibility Configuration
```css
.accessibility-settings-panel {
  .accessibility-categories {
    .category-section {
      margin-bottom: 24px;
      padding: 16px;
      background: rgba(42, 42, 64, 0.3);
      border-radius: 10px;
      border-left: 4px solid rgba(100, 255, 218, 0.6);
      
      .category-title {
        font-size: 14px;
        font-weight: 600;
        color: rgba(100, 255, 218, 0.9);
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        
        .category-icon {
          font-size: 16px;
        }
      }
      
      .accessibility-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
        
        .option-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .option-info {
            flex: 1;
            
            .option-name {
              font-size: 12px;
              color: rgba(255, 255, 255, 0.9);
              margin-bottom: 2px;
            }
            
            .option-description {
              font-size: 10px;
              color: rgba(255, 255, 255, 0.6);
              line-height: 1.3;
            }
          }
          
          .option-control {
            margin-left: 16px;
          }
        }
      }
    }
    
    /* Visual accessibility */
    .visual-accessibility {
      border-left-color: rgba(68, 138, 255, 0.6);
      
      .high-contrast-toggle,
      .reduced-motion-toggle,
      .epilepsy-safe-toggle {
        /* Inherits cosmic-toggle styles */
      }
    }
    
    /* Motor accessibility */
    .motor-accessibility {
      border-left-color: rgba(124, 77, 255, 0.6);
    }
    
    /* Cognitive accessibility */
    .cognitive-accessibility {
      border-left-color: rgba(255, 109, 0, 0.6);
    }
  }
  
  .accessibility-preview {
    background: rgba(42, 42, 64, 0.4);
    border-radius: 8px;
    padding: 16px;
    margin-top: 20px;
    
    .preview-title {
      font-size: 12px;
      color: rgba(100, 255, 218, 0.8);
      margin-bottom: 12px;
      text-align: center;
    }
    
    .preview-visualization {
      height: 60px;
      background: linear-gradient(135deg,
        rgba(100, 255, 218, 0.1) 0%,
        rgba(68, 138, 255, 0.1) 50%,
        rgba(124, 77, 255, 0.1) 100%);
      border-radius: 6px;
      position: relative;
      overflow: hidden;
      
      .preview-particles {
        position: absolute;
        width: 100%;
        height: 100%;
        
        .preview-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(100, 255, 218, 0.6);
          border-radius: 50%;
          animation: preview-float 3s infinite ease-in-out;
          
          &:nth-child(2) {
            animation-delay: 1s;
            background: rgba(68, 138, 255, 0.6);
          }
          
          &:nth-child(3) {
            animation-delay: 2s;
            background: rgba(124, 77, 255, 0.6);
          }
        }
      }
    }
  }
}

@keyframes preview-float {
  0%, 100% { transform: translateY(0) translateX(10px); opacity: 0.6; }
  50% { transform: translateY(-20px) translateX(80px); opacity: 1; }
}
```

## Action Buttons and Presets

### Settings Actions Panel
```css
.settings-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(42, 42, 64, 0.6);
  border-top: 1px solid rgba(100, 255, 218, 0.1);
  
  .preset-controls {
    display: flex;
    gap: 8px;
    
    .preset-button {
      padding: 8px 16px;
      border-radius: 6px;
      background: rgba(58, 58, 85, 0.6);
      border: 1px solid rgba(100, 255, 218, 0.3);
      color: rgba(100, 255, 218, 0.8);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(68, 68, 95, 0.8);
        border-color: rgba(100, 255, 218, 0.5);
      }
    }
  }
  
  .action-controls {
    display: flex;
    gap: 12px;
    
    .reset-button {
      padding: 10px 20px;
      background: rgba(244, 67, 54, 0.2);
      border: 1px solid rgba(244, 67, 54, 0.4);
      border-radius: 8px;
      color: rgba(244, 67, 54, 0.9);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(244, 67, 54, 0.3);
        border-color: rgba(244, 67, 54, 0.6);
      }
    }
    
    .apply-button {
      padding: 10px 24px;
      background: linear-gradient(135deg,
        rgba(100, 255, 218, 0.8),
        rgba(68, 138, 255, 0.8));
      border: none;
      border-radius: 8px;
      color: rgba(10, 10, 15, 0.9);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(100, 255, 218, 0.3);
      }
    }
    
    .close-button {
      padding: 10px 20px;
      background: rgba(58, 58, 85, 0.6);
      border: 1px solid rgba(100, 255, 218, 0.3);
      border-radius: 8px;
      color: rgba(100, 255, 218, 0.8);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(68, 68, 95, 0.8);
        border-color: rgba(100, 255, 218, 0.5);
      }
    }
  }
}
```

## Keyboard Navigation and Accessibility

### Screen Reader Support
```html
<div class="mission-control-settings" role="dialog" aria-labelledby="settings-title">
  <div class="settings-header">
    <h2 id="settings-title" class="header-title">Mission Control Configuration</h2>
    
    <div class="configuration-sectors" role="tablist">
      <button class="sector-tab active" 
              role="tab" 
              aria-selected="true" 
              aria-controls="visual-effects-panel"
              id="visual-effects-tab">
        <span class="sector-icon" aria-hidden="true">🌌</span>
        Visual Effects
      </button>
      <!-- Additional tabs... -->
    </div>
  </div>
  
  <div class="settings-content">
    <div id="visual-effects-panel" 
         role="tabpanel" 
         aria-labelledby="visual-effects-tab">
      
      <fieldset class="effect-style-selector">
        <legend>Effect Style</legend>
        <div class="effect-options" role="radiogroup">
          <div class="effect-option selected" 
               role="radio" 
               aria-checked="true"
               tabindex="0">
            <div class="effect-preview" aria-hidden="true"></div>
            <div class="effect-name">Stellar Nursery</div>
            <div class="effect-description">Gentle cosmic clouds with flowing particles</div>
          </div>
          <!-- Additional options... -->
        </div>
      </fieldset>
      
    </div>
  </div>
</div>
```

### Keyboard Navigation Patterns
- **Tab**: Navigate between major sections and controls
- **Arrow Keys**: Navigate within option groups (effect styles, presets)
- **Space/Enter**: Select options and activate buttons
- **Escape**: Close settings panel
- **Home/End**: Jump to first/last item in lists
- **Page Up/Down**: Navigate between setting categories

This comprehensive settings panel system provides extensive customization capabilities while maintaining the cosmic aesthetic and ensuring accessibility across all user interactions.
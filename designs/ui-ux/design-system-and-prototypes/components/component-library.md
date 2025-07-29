# Component Library - Music Visualizer Application

## Library Overview

The Music Visualizer Component Library provides a comprehensive collection of reusable UI elements designed with the **Cosmic Observatory** aesthetic. All components follow the ethereal, space-inspired design language while maintaining accessibility and performance standards.

## Component Categories

### 1. Foundation Components
- [Base Elements](#base-elements)
- [Typography](#typography)  
- [Color System](#color-system)
- [Spacing & Layout](#spacing--layout)

### 2. Interface Components
- [Buttons](#buttons)
- [Form Controls](#form-controls)
- [Navigation](#navigation)
- [Feedback Elements](#feedback-elements)

### 3. Specialized Components
- [Audio Controls](#audio-controls)
- [Visualization Elements](#visualization-elements)
- [File Management](#file-management)
- [Settings Panels](#settings-panels)

### 4. Layout Components
- [Containers](#containers)
- [Panels](#panels)
- [Modals & Overlays](#modals--overlays)

## Base Elements

### Cosmic Container
```css
.cosmic-container {
  background: rgba(26, 26, 37, 0.8);
  border: 1px solid rgba(100, 255, 218, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 0 50px rgba(100, 255, 218, 0.05);
  
  /* Variants */
  &.translucent {
    background: rgba(26, 26, 37, 0.6);
  }
  
  &.solid {
    background: rgba(26, 26, 37, 0.95);
  }
  
  &.glowing {
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.3),
      0 0 24px rgba(100, 255, 218, 0.3),
      inset 0 0 50px rgba(100, 255, 218, 0.1);
  }
}
```

### Cosmic Surface
```css
.cosmic-surface {
  background: linear-gradient(135deg, 
    rgba(42, 42, 64, 0.8) 0%, 
    rgba(58, 58, 85, 0.6) 100%);
  border-radius: 8px;
  border: 1px solid rgba(100, 255, 218, 0.1);
  
  /* Interactive surface */
  &.interactive {
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    
    &:hover {
      background: linear-gradient(135deg, 
        rgba(58, 58, 85, 0.9) 0%, 
        rgba(68, 68, 95, 0.7) 100%);
      border-color: rgba(100, 255, 218, 0.3);
      transform: translateY(-1px);
    }
  }
}
```

## Buttons

### Primary Cosmic Button
```css
.cosmic-button {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
  border: none;
  
  /* Primary variant */
  &.primary {
    background: linear-gradient(135deg, 
      rgba(100, 255, 218, 0.8) 0%, 
      rgba(68, 138, 255, 0.8) 100%);
    color: rgba(10, 10, 15, 0.9);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(100, 255, 218, 0.4);
    }
    
    &:active {
      transform: translateY(-1px);
    }
  }
  
  /* Secondary variant */
  &.secondary {
    background: rgba(42, 42, 64, 0.8);
    border: 1px solid rgba(100, 255, 218, 0.3);
    color: rgba(100, 255, 218, 0.9);
    
    &:hover {
      background: rgba(58, 58, 85, 0.9);
      border-color: rgba(100, 255, 218, 0.5);
      transform: translateY(-1px);
    }
  }
  
  /* Ghost variant */
  &.ghost {
    background: transparent;
    border: 1px solid rgba(100, 255, 218, 0.2);
    color: rgba(100, 255, 218, 0.8);
    
    &:hover {
      background: rgba(100, 255, 218, 0.1);
      border-color: rgba(100, 255, 218, 0.4);
    }
  }
  
  /* Icon button */
  &.icon-only {
    width: 40px;
    height: 40px;
    padding: 0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .icon {
      width: 20px;
      height: 20px;
    }
  }
  
  /* Disabled state */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
  
  /* Energy ripple effect */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: radial-gradient(circle, 
      rgba(255, 255, 255, 0.3) 0%, 
      transparent 70%);
    transform: translate(-50%, -50%);
    transition: all 0.6s ease;
  }
  
  &:active::before {
    width: 300px;
    height: 300px;
  }
}
```

### Floating Action Button
```css
.cosmic-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, 
    rgba(124, 77, 255, 0.9) 0%, 
    rgba(68, 138, 255, 0.9) 100%);
  border: none;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 8px 24px rgba(124, 77, 255, 0.4),
    0 0 40px rgba(124, 77, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  &:hover {
    transform: scale(1.1) translateY(-2px);
    box-shadow: 
      0 12px 32px rgba(124, 77, 255, 0.6),
      0 0 60px rgba(124, 77, 255, 0.3);
  }
  
  &:active {
    transform: scale(1.05);
  }
  
  .fab-icon {
    width: 24px;
    height: 24px;
    transition: transform 0.3s ease;
  }
  
  &:hover .fab-icon {
    transform: rotate(180deg);
  }
}
```

## Form Controls

### Cosmic Input Field
```css
.cosmic-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(42, 42, 64, 0.8);
  border: 1px solid rgba(100, 255, 218, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-family: inherit;
  transition: all 0.3s ease;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(100, 255, 218, 0.6);
    box-shadow: 
      0 0 0 2px rgba(100, 255, 218, 0.2),
      0 0 16px rgba(100, 255, 218, 0.1);
    background: rgba(58, 58, 85, 0.9);
  }
  
  &:invalid {
    border-color: rgba(244, 67, 54, 0.6);
    box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
  }
  
  /* Variants */
  &.compact {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  &.large {
    padding: 16px 20px;
    font-size: 16px;
  }
}
```

### Cosmic Range Slider
```css
.cosmic-range {
  width: 100%;
  height: 6px;
  background: rgba(58, 58, 85, 0.6);
  border-radius: 3px;
  position: relative;
  cursor: pointer;
  
  .range-track {
    height: 100%;
    background: linear-gradient(to right,
      rgba(100, 255, 218, 0.8) 0%,
      rgba(68, 138, 255, 0.8) 50%,
      rgba(124, 77, 255, 0.8) 100%);
    border-radius: 3px;
    transition: width 0.2s ease;
    position: relative;
    
    /* Energy flow animation */
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.3) 50%,
        transparent 100%);
      animation: energy-flow 2s infinite linear;
    }
  }
  
  .range-handle {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 18px;
    height: 18px;
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
  
  /* Value display */
  .range-value {
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(26, 26, 37, 0.9);
    color: rgba(100, 255, 218, 0.9);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  &:hover .range-value {
    opacity: 1;
  }
}

@keyframes energy-flow {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### Cosmic Toggle Switch
```css
.cosmic-toggle {
  width: 48px;
  height: 24px;
  background: rgba(58, 58, 85, 0.6);
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(100, 255, 218, 0.2);
  
  &.active {
    background: rgba(100, 255, 218, 0.6);
    border-color: rgba(100, 255, 218, 0.8);
    box-shadow: 0 0 16px rgba(100, 255, 218, 0.3);
  }
  
  .toggle-handle {
    width: 20px;
    height: 20px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    position: absolute;
    top: 1px;
    left: 1px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    
    /* Inner glow */
    &::before {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      background: radial-gradient(circle,
        rgba(100, 255, 218, 0.3) 0%,
        transparent 70%);
      border-radius: 50%;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
  }
  
  &.active .toggle-handle {
    left: 25px;
    background: rgba(10, 10, 15, 0.9);
    
    &::before {
      opacity: 1;
    }
  }
  
  /* Focus state for accessibility */
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(100, 255, 218, 0.4);
  }
}
```

### Cosmic Dropdown
```css
.cosmic-dropdown {
  position: relative;
  
  .dropdown-trigger {
    width: 100%;
    padding: 10px 16px;
    background: rgba(42, 42, 64, 0.8);
    border: 1px solid rgba(100, 255, 218, 0.2);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: rgba(100, 255, 218, 0.4);
      background: rgba(58, 58, 85, 0.9);
    }
    
    &.open {
      border-color: rgba(100, 255, 218, 0.6);
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
    
    .dropdown-arrow {
      width: 12px;
      height: 12px;
      background: url('./icons/chevron-down.svg') center/contain no-repeat;
      opacity: 0.7;
      transition: transform 0.3s ease;
    }
    
    &.open .dropdown-arrow {
      transform: rotate(180deg);
    }
  }
  
  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(42, 42, 64, 0.95);
    border: 1px solid rgba(100, 255, 218, 0.2);
    border-top: none;
    border-radius: 0 0 8px 8px;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    z-index: 100;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
    pointer-events: none;
    max-height: 200px;
    overflow-y: auto;
    
    &.open {
      opacity: 1;
      transform: translateY(0);
      pointer-events: all;
    }
    
    .dropdown-item {
      padding: 10px 16px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(100, 255, 218, 0.1);
        color: rgba(100, 255, 218, 0.9);
      }
      
      &.selected {
        background: rgba(100, 255, 218, 0.2);
        color: rgba(100, 255, 218, 1);
      }
      
      &:last-child {
        border-radius: 0 0 8px 8px;
      }
    }
  }
}
```

## Navigation Components

### Cosmic Tab Navigation
```css
.cosmic-tabs {
  display: flex;
  background: rgba(42, 42, 64, 0.6);
  border-radius: 10px 10px 0 0;
  border: 1px solid rgba(100, 255, 218, 0.2);
  border-bottom: none;
  overflow: hidden;
  
  .tab-item {
    flex: 1;
    padding: 12px 16px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    
    &:not(:last-child)::after {
      content: '';
      position: absolute;
      top: 20%;
      right: 0;
      bottom: 20%;
      width: 1px;
      background: rgba(100, 255, 218, 0.1);
    }
    
    &:hover {
      background: rgba(58, 58, 85, 0.6);
      color: rgba(100, 255, 218, 0.8);
    }
    
    &.active {
      background: rgba(100, 255, 218, 0.1);
      color: rgba(100, 255, 218, 1);
      
      &::before {
        content: '';
        position: absolute;
        bottom: 0;
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
      font-size: 16px;
    }
  }
}
```

### Cosmic Breadcrumbs
```css
.cosmic-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  
  .breadcrumb-item {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    
    &:not(:last-child) {
      cursor: pointer;
      transition: color 0.2s ease;
      
      &:hover {
        color: rgba(100, 255, 218, 0.8);
      }
    }
    
    &:last-child {
      color: rgba(100, 255, 218, 0.9);
      font-weight: 500;
    }
    
    &:not(:last-child)::after {
      content: '›';
      margin-left: 8px;
      color: rgba(100, 255, 218, 0.4);
      font-size: 14px;
    }
  }
}
```

## Feedback Elements

### Cosmic Progress Bar
```css
.cosmic-progress {
  width: 100%;
  height: 8px;
  background: rgba(58, 58, 85, 0.6);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(to right,
      rgba(100, 255, 218, 0.8) 0%,
      rgba(68, 138, 255, 0.8) 50%,
      rgba(124, 77, 255, 0.8) 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
    position: relative;
    
    /* Animated shine effect */
    &::after {
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
      animation: progress-shine 2s infinite ease-in-out;
    }
  }
  
  /* Indeterminate state */
  &.indeterminate .progress-fill {
    width: 30%;
    animation: progress-slide 2s infinite ease-in-out;
  }
}

@keyframes progress-shine {
  0% { left: -100%; }
  100% { left: 100%; }
}

@keyframes progress-slide {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(300%); }
  100% { transform: translateX(-100%); }
}
```

### Cosmic Loading Spinner
```css
.cosmic-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(100, 255, 218, 0.2);
  border-top: 3px solid rgba(100, 255, 218, 0.8);
  border-radius: 50%;
  animation: cosmic-spin 1s linear infinite;
  
  /* Size variants */
  &.small {
    width: 24px;
    height: 24px;
    border-width: 2px;
  }
  
  &.large {
    width: 56px;
    height: 56px;
    border-width: 4px;
  }
  
  /* Pulsing variant */
  &.pulse {
    border: 3px solid rgba(100, 255, 218, 0.3);
    animation: cosmic-pulse 1.5s ease-in-out infinite;
  }
}

@keyframes cosmic-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes cosmic-pulse {
  0%, 100% { 
    transform: scale(1); 
    border-color: rgba(100, 255, 218, 0.3);
  }
  50% { 
    transform: scale(1.1); 
    border-color: rgba(100, 255, 218, 0.8);
  }
}
```

### Cosmic Toast Notification
```css
.cosmic-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 300px;
  padding: 16px 20px;
  background: rgba(26, 26, 37, 0.95);
  border: 1px solid rgba(100, 255, 218, 0.3);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.3),
    0 0 32px rgba(100, 255, 218, 0.2);
  z-index: 10000;
  transform: translateX(100%);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  &.show {
    transform: translateX(0);
  }
  
  .toast-content {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .toast-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    
    .toast-message {
      flex: 1;
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      line-height: 1.4;
    }
    
    .toast-close {
      width: 16px;
      height: 16px;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s ease;
      
      &:hover {
        opacity: 1;
      }
    }
  }
  
  /* Type variants */
  &.success {
    border-color: rgba(76, 175, 80, 0.6);
    box-shadow: 
      0 8px 24px rgba(0, 0, 0, 0.3),
      0 0 32px rgba(76, 175, 80, 0.2);
  }
  
  &.warning {
    border-color: rgba(255, 193, 7, 0.6);
    box-shadow: 
      0 8px 24px rgba(0, 0, 0, 0.3),
      0 0 32px rgba(255, 193, 7, 0.2);
  }
  
  &.error {
    border-color: rgba(244, 67, 54, 0.6);
    box-shadow: 
      0 8px 24px rgba(0, 0, 0, 0.3),
      0 0 32px rgba(244, 67, 54, 0.2);
  }
}
```

## Accessibility Features

### Screen Reader Classes
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### Focus Management
```css
/* Focus indicators for keyboard navigation */
.cosmic-button:focus,
.cosmic-input:focus,
.cosmic-toggle:focus,
.dropdown-trigger:focus {
  outline: none;
  box-shadow: 
    0 0 0 2px rgba(100, 255, 218, 0.6),
    0 0 16px rgba(100, 255, 218, 0.3);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .cosmic-button.primary {
    background: #0066cc;
    color: #ffffff;
  }
  
  .cosmic-input {
    background: #000000;
    border-color: #ffffff;
    color: #ffffff;
  }
  
  .cosmic-container {
    background: #000000;
    border-color: #ffffff;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Component Usage Guidelines

### Implementation Standards
1. **Semantic HTML**: Use appropriate HTML elements for accessibility
2. **ARIA Labels**: Include descriptive labels for screen readers
3. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
4. **Color Independence**: Don't rely solely on color to convey information
5. **Responsive Design**: Components adapt to different screen sizes

### Performance Considerations
1. **CSS Animations**: Use transform and opacity for smooth animations
2. **GPU Acceleration**: Apply `transform: translateZ(0)` for complex animations
3. **Efficient Selectors**: Use specific class selectors for optimal rendering
4. **Lazy Loading**: Load complex components only when needed

### Customization Options
1. **CSS Custom Properties**: Use variables for easy theming
2. **Modifier Classes**: Support variant styling through additional classes
3. **Data Attributes**: Allow configuration through data attributes
4. **Event Hooks**: Provide callback functions for component interactions

This comprehensive component library ensures consistent, accessible, and performant UI elements throughout the Music Visualizer application while maintaining the ethereal cosmic aesthetic.
# Main Application Layout Wireframes

## Layout Overview

The Music Visualizer application follows a spatial layout design with distinct zones for different functionality, optimized for both desktop and windowed viewing experiences.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ☰ File   View   Effects   Settings   Help                    [- □ ×]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                          VISUALIZATION DISPLAY AREA                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                    [Cosmic Visualization Canvas]                    │   │
│  │                                                                     │   │
│  │                       • • • • • • • • • •                           │   │
│  │                     ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴                           │   │
│  │                   ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴                           │   │
│  │                 ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴                           │   │
│  │               ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴ ∴                           │   │
│  │                                                                     │   │
│  │                    [Instrument Shadow Overlays]                     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                             CONTROL PANEL AREA                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Audio Controls          │    Visualization Controls    │   Quick Settings  │
│ ┌───────────────────────┐│┌─────────────────────────────┐│┌─────────────────┐│
│ │ [◀◀] [▶] [▶▶] [■]    ││││  Effect: [Cosmic Nebula ▼] ││││ Volume: ■■■■■□□ ││
│ │                       ││││  Style:  [Ethereal     ▼] ││││ Intensity: ■■■□ ││
│ │ ████▓▓▓▓▓░░░░░░░░░    ││││  Colors: [Aurora Palette]  ││││ Speed: ■■■■□□□ ││
│ │ 1:23 / 4:56           ││││  Sync:   [Audio Reactive]  ││││                 ││
│ │                       ││││                             ││││ [Live Input]    ││
│ │ File: cosmic_dream.wav││││  [Advanced Controls]       ││││ [Presets]       ││
│ └───────────────────────┘│└─────────────────────────────┘│└─────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Layout Zones

### 1. Menu Bar (Top)
**Height**: 32px  
**Content**: Traditional application menu with context-aware options
- File operations (Open, Save Preset, Export)
- View options (Fullscreen, Multi-monitor)
- Effects library and management
- Settings and preferences
- Help and tutorials

### 2. Visualization Display Area (Center)
**Flexible Height**: 60-80% of window  
**Purpose**: Primary visual canvas for music visualization
- Full-screen capable cosmic visualization rendering
- Transparent instrument shadow overlays
- Real-time audio-reactive particle systems
- Gesture and click interaction for parameter adjustment

### 3. Control Panel Area (Bottom)
**Height**: 120-160px (collapsible)  
**Layout**: Three-column responsive design

#### Column 1: Audio Controls (Left - 30%)
- Playback controls (play, pause, stop, seek)
- Audio waveform with playback position
- Track information and timing
- File selection and audio input switching

#### Column 2: Visualization Controls (Center - 45%)
- Effect type selector dropdown
- Visual style presets
- Color palette chooser
- Audio synchronization settings
- Advanced controls expansion

#### Column 3: Quick Settings (Right - 25%)
- Volume control slider
- Visual intensity adjustment
- Animation speed control
- Live input toggle
- Preset quick-access

## Responsive Behavior

### Window Size Adaptations

#### Large Windows (1400px+ width)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Full menu bar with all options visible]                     [- □ ×]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                        [Expanded Visualization Area]                       │
│                                [1200x800px]                                │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Audio Controls]    │    [Visualization Controls]    │   [Quick Settings]  │
│  [Full width layout] │    [Extended options visible]  │   [All controls]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Medium Windows (900-1400px width)
```
┌───────────────────────────────────────────────────────────────┐
│  [☰] [Compressed menu]                           [- □ ×]       │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│                   [Standard Visualization]                   │
│                        [800x500px]                           │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│  [Audio]     │    [Visualization]    │   [Settings]          │
│  [Compact]   │    [Essential only]   │   [Priority items]    │
└───────────────────────────────────────────────────────────────┘
```

#### Small Windows (600-900px width)
```
┌─────────────────────────────────────────────────┐
│  [☰]                              [- □ ×]       │
├─────────────────────────────────────────────────┤
│                                                 │
│              [Compact Visualization]            │
│                   [600x300px]                   │
│                                                 │
├─────────────────────────────────────────────────┤
│              [Stacked Controls]                 │
│  [▶] [File: track.wav] [Effect: Cosmic ▼]      │
│  [■■■■■□□] [Volume] [Intensity] [⚙]            │
└─────────────────────────────────────────────────┘
```

### Control Panel Collapse States

#### Expanded State (Default)
- Full three-column layout
- All controls visible and accessible
- Advanced options available via expansion

#### Compact State (Space-saving)
- Essential controls only
- Consolidated into single row
- Secondary controls accessible via hover/click

#### Minimal State (Focus mode)
- Visualization area maximized
- Only playback controls visible
- Quick access to expand controls

## Interaction Patterns

### Primary Interactions
1. **File Loading**: Drag-and-drop onto visualization area or File menu
2. **Playback Control**: Large, accessible play/pause buttons
3. **Effect Selection**: Dropdown with visual previews
4. **Parameter Adjustment**: Sliders with real-time feedback
5. **Preset Management**: Quick-save and recall system

### Secondary Interactions
1. **Visualization Manipulation**: Click/drag on visualization for parameters
2. **Timeline Scrubbing**: Click anywhere on waveform to seek
3. **Keyboard Shortcuts**: Space for play/pause, arrow keys for seek
4. **Context Menus**: Right-click for advanced options
5. **Gesture Support**: Multi-touch zoom and pan on visualization

### Accessibility Interactions
1. **Keyboard Navigation**: Tab order through all controls
2. **Screen Reader Support**: Descriptive labels for all elements
3. **High Contrast**: Alternative color schemes
4. **Motor Accessibility**: Large touch targets, voice control
5. **Audio Descriptions**: Spoken feedback for visual changes

## Visual Hierarchy

### Primary Level (Immediate Attention)
- Visualization display area
- Play/pause button
- Current track information

### Secondary Level (Supporting Actions)
- Effect selection controls
- Volume and intensity adjustments
- File selection interface

### Tertiary Level (Advanced Features)
- Advanced parameter controls
- Preset management
- Settings and configuration

### Background Level (System Status)
- Performance indicators
- Connection status
- Help and documentation links

## Information Architecture

### Content Organization
1. **Media Management**: File operations and audio input
2. **Playback Control**: Transport and timing controls
3. **Visual Configuration**: Effect selection and customization
4. **System Settings**: Application preferences and configuration
5. **User Presets**: Saved configurations and templates

### Navigation Flow
```
Application Launch
├── Quick Start (Load file + default preset)
├── Project Mode (Load existing configuration)
├── Live Mode (Configure audio input)
└── Tutorial Mode (Guided introduction)

Main Interface
├── File Operations
│   ├── Open Audio File
│   ├── Configure Audio Input
│   └── Import/Export Presets
├── Visualization Control
│   ├── Effect Selection
│   ├── Parameter Adjustment
│   └── Preset Management
└── Application Settings
    ├── Performance Configuration
    ├── Audio Device Setup
    └── Accessibility Options
```

This wireframe structure provides a foundation for the detailed visual design and component specifications that will follow in the next phases of the design system.
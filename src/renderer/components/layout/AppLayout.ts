// Music Visualizer - Main Application Layout

import { BaseComponent } from '../base/BaseComponent';
import { AudioControls } from '../audio/AudioControls';
import { FileManager } from '../file/FileManager';
import { VisualizationCanvas } from '../visualization/VisualizationCanvas';
import { SettingsPanel } from '../settings/SettingsPanel';
import { CosmicButton } from '../ui/Button';
import { LayoutOptions, ResponsiveOptions, BreakpointOptions } from '../../types/ui-types';

export class AppLayout extends BaseComponent {
  private _options: LayoutOptions & ResponsiveOptions;
  private _header!: HTMLElement;
  private _sidebar!: HTMLElement;
  private _mainContent!: HTMLElement;
  private _footer!: HTMLElement;
  
  // Component instances
  private _audioControls!: AudioControls;
  private _fileManager!: FileManager;
  private _visualizationCanvas!: VisualizationCanvas;
  private _settingsPanel!: SettingsPanel;
  
  // Layout state
  private _sidebarOpen: boolean = true;
  private _fullscreenMode: boolean = false;
  private _currentBreakpoint: string = 'desktop';
  private _resizeObserver!: ResizeObserver;

  constructor(options: LayoutOptions & ResponsiveOptions = {}) {
    super('div');
    this._options = {
      direction: 'column',
      wrap: false,
      justify: 'start',
      align: 'stretch',
      gap: '0',
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1440,
        wide: 1920
      },
      mobileFirst: true,
      ...options
    };
    
    // Restore saved theme before rendering
    this.restoreTheme();
    
    this.render();
    this.setupResponsiveLayout();
    this.setupKeyboardShortcuts();
  }

  private restoreTheme(): void {
    const savedTheme = localStorage.getItem('cosmic-theme') || 'cosmic';
    this.applyTheme(savedTheme);
  }

  render(): HTMLElement {
    const container = this._element;
    container.className = 'cosmic-app-layout';
    container.setAttribute('role', 'application');
    container.setAttribute('aria-label', 'Cosmic Music Visualizer');

    this.createHeader();
    this.createMainLayout();
    this.createFooter();
    this.initializeComponents();

    return container;
  }

  private createHeader(): void {
    this._header = document.createElement('header');
    this._header.className = 'app-header cosmic-container';
    this._header.setAttribute('role', 'banner');

    const headerContent = document.createElement('div');
    headerContent.className = 'header-content';

    // App title and logo
    const titleSection = document.createElement('div');
    titleSection.className = 'app-title-section';
    titleSection.innerHTML = `
      <div class="app-logo">
        <span class="cosmic-icon icon-cosmic-logo"></span>
      </div>
      <h1 class="app-title cosmic-heading-large">
        COSMIC VISUALIZER
      </h1>
      <div class="app-subtitle">
        Ethereal Audio Exploration
      </div>
    `;

    // Navigation controls
    const navSection = document.createElement('nav');
    navSection.className = 'app-navigation';
    navSection.setAttribute('role', 'navigation');
    navSection.setAttribute('aria-label', 'Main navigation');

    const sidebarToggle = CosmicButton.icon('menu', {
      ariaLabel: 'Toggle file browser',
      onClick: () => this.toggleSidebar()
    });
    sidebarToggle.addClass('sidebar-toggle');

    const settingsButton = CosmicButton.icon('settings', {
      ariaLabel: 'Open settings',
      onClick: () => this.openSettings()
    });

    // Removed fullscreen button from header to simplify - use visualization canvas button instead
    navSection.appendChild(sidebarToggle.element);
    navSection.appendChild(settingsButton.element);

    headerContent.appendChild(titleSection);
    headerContent.appendChild(navSection);
    this._header.appendChild(headerContent);
    this._element.appendChild(this._header);
  }

  private createMainLayout(): void {
    const mainLayout = document.createElement('main');
    mainLayout.className = 'app-main-layout';
    mainLayout.setAttribute('role', 'main');

    // Sidebar
    this.createSidebar();

    // Main content area
    this._mainContent = document.createElement('div');
    this._mainContent.className = 'main-content-area';

    // Visualization area
    const visualizationArea = document.createElement('section');
    visualizationArea.className = 'visualization-area cosmic-container';
    visualizationArea.setAttribute('aria-label', 'Audio visualization');

    // Placeholder for visualization canvas
    const canvasPlaceholder = document.createElement('div');
    canvasPlaceholder.className = 'visualization-placeholder';
    canvasPlaceholder.id = 'visualization-canvas-container';
    
    visualizationArea.appendChild(canvasPlaceholder);
    this._mainContent.appendChild(visualizationArea);

    mainLayout.appendChild(this._sidebar);
    mainLayout.appendChild(this._mainContent);
    this._element.appendChild(mainLayout);
  }

  private createSidebar(): void {
    this._sidebar = document.createElement('aside');
    this._sidebar.className = 'app-sidebar cosmic-container';
    this._sidebar.setAttribute('role', 'complementary');
    this._sidebar.setAttribute('aria-label', 'File browser and controls');

    // Sidebar header
    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'sidebar-header';
    sidebarHeader.innerHTML = `
      <h2 class="cosmic-heading-medium">
        <span class="cosmic-icon icon-control-panel"></span>
        MISSION CONTROL
      </h2>
    `;

    // Tabs for different sidebar content
    const sidebarTabs = document.createElement('div');
    sidebarTabs.className = 'cosmic-tabs sidebar-tabs';
    sidebarTabs.setAttribute('role', 'tablist');

    const tabButtons = [
      { id: 'files', label: 'Files', icon: 'icon-file-browser', active: true },
      { id: 'controls', label: 'Controls', icon: 'icon-control-panel', active: false }
    ];

    tabButtons.forEach(tab => {
      const button = document.createElement('button');
      button.className = `tab-item ${tab.active ? 'active' : ''}`;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(tab.active));
      button.setAttribute('aria-controls', `${tab.id}-panel`);
      button.id = `${tab.id}-tab`;
      button.innerHTML = `
        <span class="cosmic-icon ${tab.icon}"></span>
        ${tab.label}
      `;
      
      button.addEventListener('click', () => this.switchSidebarTab(tab.id));
      sidebarTabs.appendChild(button);
    });

    // Sidebar content panels
    const sidebarContent = document.createElement('div');
    sidebarContent.className = 'sidebar-content';

    // Files panel
    const filesPanel = document.createElement('div');
    filesPanel.className = 'sidebar-panel active';
    filesPanel.id = 'files-panel';
    filesPanel.setAttribute('role', 'tabpanel');
    filesPanel.setAttribute('aria-labelledby', 'files-tab');

    // Controls panel  
    const controlsPanel = document.createElement('div');
    controlsPanel.className = 'sidebar-panel';
    controlsPanel.id = 'controls-panel';
    controlsPanel.setAttribute('role', 'tabpanel');
    controlsPanel.setAttribute('aria-labelledby', 'controls-tab');
    
    // Add quick controls to the controls panel
    controlsPanel.innerHTML = `
      <div class="quick-controls">
        <h3 class="cosmic-heading-small">
          <span class="cosmic-icon icon-mission-control"></span>
          Quick Controls
        </h3>
        <div class="control-group">
          <label class="control-label">Visualization Intensity</label>
          <input type="range" class="cosmic-slider intensity-control" 
                 min="0.1" max="2.0" step="0.1" value="1.0"
                 aria-label="Visualization intensity">
        </div>
        <div class="control-group">
          <label class="control-label">Theme Mode</label>
          <select class="cosmic-dropdown theme-selector">
            <option value="cosmic">Cosmic (Default)</option>
            <option value="cosmic-dark">Cosmic Dark</option>
            <option value="cosmic-high-contrast">High Contrast</option>
          </select>
        </div>
        <div class="control-group">
          <label class="control-label">Preset</label>
          <select class="cosmic-dropdown preset-selector">
            <option value="cosmic-symphony">Cosmic Symphony</option>
            <option value="stellar-nursery">Stellar Nursery</option>
            <option value="galactic-core">Galactic Core</option>
            <option value="solar-wind">Solar Wind</option>
            <option value="quantum-field">Quantum Field</option>
            <option value="nebula-dance">Nebula Dance</option>
          </select>
        </div>
        <div class="control-actions">
          <button class="cosmic-button secondary full-width">
            <span class="cosmic-icon icon-settings"></span>
            Advanced Settings
          </button>
        </div>
      </div>
    `;

    sidebarContent.appendChild(filesPanel);
    sidebarContent.appendChild(controlsPanel);

    // Set up quick controls event listeners
    this.setupQuickControlsListeners(controlsPanel);

    this._sidebar.appendChild(sidebarHeader);
    this._sidebar.appendChild(sidebarTabs);
    this._sidebar.appendChild(sidebarContent);
  }

  private setupQuickControlsListeners(controlsPanel: HTMLElement): void {
    // Intensity control
    const intensityControl = controlsPanel.querySelector('.intensity-control') as HTMLInputElement;
    if (intensityControl) {
      intensityControl.addEventListener('input', (event) => {
        const value = parseFloat((event.target as HTMLInputElement).value);
        this.handleSettingChange('energy-sensitivity', value, 'visualization');
      });
    }

    // Theme selector
    const themeSelector = controlsPanel.querySelector('.theme-selector') as HTMLSelectElement;
    if (themeSelector) {
      // Set current theme
      const savedTheme = localStorage.getItem('cosmic-theme') || 'cosmic';
      themeSelector.value = savedTheme;
      
      themeSelector.addEventListener('change', (event) => {
        const value = (event.target as HTMLSelectElement).value;
        this.handleSettingChange('theme', value, 'interface');
      });
    }

    // Preset selector
    const presetSelector = controlsPanel.querySelector('.preset-selector') as HTMLSelectElement;
    if (presetSelector) {
      presetSelector.addEventListener('change', (event) => {
        const value = (event.target as HTMLSelectElement).value;
        this.handleSettingChange('preset', value, 'visualization');
      });
    }

    // Advanced settings button
    const advancedButton = controlsPanel.querySelector('.control-actions button') as HTMLElement;
    if (advancedButton) {
      advancedButton.addEventListener('click', () => {
        this.openSettings();
      });
    }
  }

  private createFooter(): void {
    this._footer = document.createElement('footer');
    this._footer.className = 'app-footer cosmic-container';
    this._footer.setAttribute('role', 'contentinfo');

    // Audio controls will be placed here
    const footerContent = document.createElement('div');
    footerContent.className = 'footer-content';
    footerContent.id = 'audio-controls-container';

    this._footer.appendChild(footerContent);
    this._element.appendChild(this._footer);
  }

  private initializeComponents(): void {
    // Initialize FileManager in sidebar
    this._fileManager = new FileManager({
      supportedExtensions: ['.wav', '.mp3', '.flac', '.m4a', '.ogg', '.aac'],
      allowMultiple: false,
      onFileSelect: (files) => this.handleFileSelection(files)
    });

    const filesPanel = this._element.querySelector('#files-panel');
    if (filesPanel) {
      filesPanel.appendChild(this._fileManager.element);
    }

    // Initialize VisualizationCanvas
    this._visualizationCanvas = new VisualizationCanvas({
      width: 800,
      height: 600,
      responsive: true,
      interactive: true,
      onResize: (width, height) => this.handleVisualizationResize(width, height)
    });

    const canvasContainer = this._element.querySelector('#visualization-canvas-container');
    if (canvasContainer) {
      canvasContainer.appendChild(this._visualizationCanvas.element);
    }

    // Initialize AudioControls in footer
    this._audioControls = new AudioControls({
      onPlay: () => this.handleAudioPlay(),
      onPause: () => this.handleAudioPause(),
      onSeek: (time) => this.handleAudioSeek(time),
      onVolumeChange: (volume) => this.handleVolumeChange(volume)
    });

    const audioContainer = this._element.querySelector('#audio-controls-container');
    if (audioContainer) {
      audioContainer.appendChild(this._audioControls.element);
    }

    // Initialize SettingsPanel (initially hidden)
    this._settingsPanel = new SettingsPanel({
      groups: this.createSettingsGroups(),
      collapsible: true,
      searchable: true,
      onSettingChange: (settingId, value, groupId) => this.handleSettingChange(settingId, value, groupId)
    });

    this._settingsPanel.hide();
    this._element.appendChild(this._settingsPanel.element);
  }

  private createSettingsGroups() {
    return [
      {
        id: 'visualization',
        label: 'Visualization',
        icon: 'icon-visualization',
        settings: [
          {
            id: 'preset',
            label: 'Visual Preset',
            description: 'Choose the cosmic visualization style',
            type: 'select' as const,
            value: 'cosmic-symphony',
            options: [
              { value: 'cosmic-symphony', label: 'Cosmic Symphony' },
              { value: 'stellar-nursery', label: 'Stellar Nursery' },
              { value: 'galactic-core', label: 'Galactic Core' },
              { value: 'solar-wind', label: 'Solar Wind' },
              { value: 'quantum-field', label: 'Quantum Field' },
              { value: 'nebula-dance', label: 'Nebula Dance' }
            ]
          },
          {
            id: 'particle-count',
            label: 'Particle Density',
            description: 'Number of cosmic particles (affects performance)',
            type: 'range' as const,
            value: 5000,
            min: 1000,
            max: 20000,
            step: 500
          },
          {
            id: 'energy-sensitivity',
            label: 'Energy Sensitivity',
            description: 'How responsive the visualization is to audio',
            type: 'range' as const,
            value: 0.8,
            min: 0.1,
            max: 2.0,
            step: 0.1
          }
        ]
      },
      {
        id: 'audio',
        label: 'Audio Processing',
        icon: 'icon-audio',
        settings: [
          {
            id: 'fft-size',
            label: 'Analysis Resolution',
            description: 'Higher values provide more detailed frequency analysis',
            type: 'select' as const,
            value: 2048,
            options: [
              { value: 512, label: '512 (Fast)' },
              { value: 1024, label: '1024 (Balanced)' },
              { value: 2048, label: '2048 (Detailed)' },
              { value: 4096, label: '4096 (Ultra)' }
            ]
          },
          {
            id: 'smoothing',
            label: 'Frequency Smoothing',
            description: 'Smooths frequency data for more fluid visuals',
            type: 'range' as const,
            value: 0.8,
            min: 0,
            max: 1,
            step: 0.1
          }
        ]
      },
      {
        id: 'interface',
        label: 'Interface',
        icon: 'icon-interface',
        settings: [
          {
            id: 'theme',
            label: 'Theme Mode',
            description: 'Visual theme for the interface',
            type: 'select' as const,
            value: 'cosmic',
            options: [
              { value: 'cosmic', label: 'Cosmic (Default)' },
              { value: 'cosmic-dark', label: 'Cosmic Dark' },
              { value: 'cosmic-high-contrast', label: 'High Contrast' }
            ]
          },
          {
            id: 'reduced-motion',
            label: 'Reduce Motion',
            description: 'Minimize animations for accessibility',
            type: 'boolean' as const,
            value: false
          },
          {
            id: 'sidebar-auto-hide',
            label: 'Auto-hide Sidebar',
            description: 'Automatically hide sidebar in fullscreen',
            type: 'boolean' as const,
            value: true
          }
        ]
      }
    ];
  }

  private setupResponsiveLayout(): void {
    this._resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        this.updateBreakpoint(width);
      }
    });

    this._resizeObserver.observe(this._element);
    this.updateBreakpoint(window.innerWidth);
  }

  private updateBreakpoint(width: number): void {
    const breakpoints = this._options.breakpoints!;
    let newBreakpoint = 'mobile';

    if (width >= breakpoints.wide) {
      newBreakpoint = 'wide';
    } else if (width >= breakpoints.desktop) {
      newBreakpoint = 'desktop';
    } else if (width >= breakpoints.tablet) {
      newBreakpoint = 'tablet';
    } else {
      newBreakpoint = 'mobile';
    }

    if (newBreakpoint !== this._currentBreakpoint) {
      const oldBreakpoint = this._currentBreakpoint;
      this._currentBreakpoint = newBreakpoint;

      // Update layout classes
      this._element.classList.remove(`bp-${oldBreakpoint}`);
      this._element.classList.add(`bp-${newBreakpoint}`);

      // Handle breakpoint-specific behavior
      this.handleBreakpointChange(oldBreakpoint, newBreakpoint, width);

      if (this._options.onBreakpointChange) {
        this._options.onBreakpointChange(newBreakpoint, width);
      }

      this.emit('breakpointChange', { from: oldBreakpoint, to: newBreakpoint, width });
    }
  }

  private handleBreakpointChange(oldBreakpoint: string, newBreakpoint: string, width: number): void {
    // Auto-hide sidebar on mobile
    if (newBreakpoint === 'mobile' && this._sidebarOpen) {
      this.closeSidebar();
    }

    // Auto-show sidebar on desktop if it was hidden
    if (newBreakpoint === 'desktop' && oldBreakpoint === 'mobile' && !this._sidebarOpen) {
      this.openSidebar();
    }

    // Adjust component layouts
    this.adjustComponentLayouts(newBreakpoint, width);
  }

  private adjustComponentLayouts(breakpoint: string, width: number): void {
    // Adjust visualization canvas
    if (this._visualizationCanvas && !this._fullscreenMode) {
      const isMobile = breakpoint === 'mobile';
      const height = isMobile ? 300 : 600;
      this._visualizationCanvas.resize(width - (this._sidebarOpen && !isMobile ? 320 : 0), height);
    }

    // Adjust audio controls layout
    if (this._audioControls) {
      const controlsElement = this._audioControls.element;
      if (breakpoint === 'mobile') {
        controlsElement.classList.add('mobile-layout');
      } else {
        controlsElement.classList.remove('mobile-layout');
      }
    }
  }

  private setupKeyboardShortcuts(): void {
    const shortcuts = [
      { key: 's', ctrl: true, handler: (e: KeyboardEvent) => { e.preventDefault(); this.openSettings(); } },
      { key: 'b', ctrl: true, handler: (e: KeyboardEvent) => { e.preventDefault(); this.toggleSidebar(); } },
      { key: 'Escape', handler: () => this.handleEscape() }
    ];

    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      shortcuts.forEach(shortcut => {
        if (event.key === shortcut.key && 
            !!event.ctrlKey === !!(shortcut as any).ctrl &&
            !!event.metaKey === !!(shortcut as any).meta) {
          shortcut.handler(event);
        }
      });
    });
  }

  // Event handlers
  private switchSidebarTab(tabId: string): void {
    // Update tab buttons
    const tabButtons = this._sidebar.querySelectorAll('.tab-item');
    tabButtons.forEach(button => {
      const isActive = button.id === `${tabId}-tab`;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });

    // Update tab panels
    const tabPanels = this._sidebar.querySelectorAll('.sidebar-panel');
    tabPanels.forEach(panel => {
      const isActive = panel.id === `${tabId}-panel`;
      panel.classList.toggle('active', isActive);
    });

    this.emit('sidebarTabChange', tabId);
  }

  private handleFileSelection(files: any[]): void {
    if (files.length > 0) {
      const file = files[0];
      this._audioControls.setFileName(file.name);
      this.emit('fileSelected', file);
    }
  }

  private handleVisualizationResize(width: number, height: number): void {
    this.emit('visualizationResize', { width, height });
  }

  private handleAudioPlay(): void {
    this.emit('audioPlay');
  }

  private handleAudioPause(): void {
    this.emit('audioPause');
  }

  private handleAudioSeek(time: number): void {
    this.emit('audioSeek', time);
  }

  private handleVolumeChange(volume: number): void {
    this.emit('volumeChange', volume);
  }

  private handleSettingChange(settingId: string, value: any, groupId: string): void {
    // Apply setting changes immediately
    switch (settingId) {
      case 'preset':
        this._visualizationCanvas.applyPreset(value);
        break;
      case 'theme':
        this.applyTheme(value);
        // Store theme preference to prevent reset during playback
        localStorage.setItem('cosmic-theme', value);
        break;
      case 'reduced-motion':
        this.toggleReducedMotion(value);
        break;
      case 'particle-count':
        // Update visualization particle count
        break;
      case 'energy-sensitivity':
        this._visualizationCanvas.setIntensity(value);
        break;
    }

    this.emit('settingChange', { settingId, value, groupId });
  }

  private handleEscape(): void {
    if (this._settingsPanel.isVisible) {
      this._settingsPanel.close();
    }
  }

  // Public API methods
  toggleSidebar(): void {
    if (this._sidebarOpen) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  openSidebar(): void {
    this._sidebarOpen = true;
    this._sidebar.classList.add('open');
    this._sidebar.setAttribute('aria-hidden', 'false');
    
    const toggleButton = this._header.querySelector('.sidebar-toggle .cosmic-icon') as HTMLElement;
    if (toggleButton) {
      toggleButton.className = 'cosmic-icon icon-close';
    }

    this.emit('sidebarOpen');
  }

  closeSidebar(): void {
    this._sidebarOpen = false;
    this._sidebar.classList.remove('open');
    this._sidebar.setAttribute('aria-hidden', 'true');
    
    const toggleButton = this._header.querySelector('.sidebar-toggle .cosmic-icon') as HTMLElement;
    if (toggleButton) {
      toggleButton.className = 'cosmic-icon icon-menu';
    }

    this.emit('sidebarClose');
  }

  openSettings(): void {
    this._settingsPanel.show();
    this.emit('settingsOpen');
  }

  closeSettings(): void {
    this._settingsPanel.close();
    this.emit('settingsClose');
  }

  toggleFullscreen(): void {
    if (this._fullscreenMode) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  private enterFullscreen(): void {
    this._fullscreenMode = true;
    this._element.classList.add('fullscreen-mode');
    
    // Hide header and footer in fullscreen
    this._header.style.display = 'none';
    this._footer.style.display = 'none';
    
    // Auto-hide sidebar if setting is enabled
    const autoHideSetting = this._settingsPanel.getSetting('sidebar-auto-hide');
    if (autoHideSetting?.value && this._sidebarOpen) {
      this.closeSidebar();
    }
    
    // Resize visualization to full screen
    this._visualizationCanvas.resize(window.innerWidth, window.innerHeight);
    
    this.emit('fullscreenEnter');
  }

  private exitFullscreen(): void {
    this._fullscreenMode = false;
    this._element.classList.remove('fullscreen-mode');
    
    // Show header and footer
    this._header.style.display = '';
    this._footer.style.display = '';
    
    // Restore normal layout
    this.adjustComponentLayouts(this._currentBreakpoint, window.innerWidth);
    
    this.emit('fullscreenExit');
  }

  private applyTheme(theme: string): void {
    // Force theme application and prevent override
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    
    // Store in localStorage for persistence
    localStorage.setItem('cosmic-theme', theme);
    
    // Force re-render of theme-dependent elements
    this._element.classList.remove('theme-cosmic', 'theme-cosmic-dark', 'theme-cosmic-high-contrast');
    this._element.classList.add(`theme-${theme.replace('cosmic-', '').replace('cosmic', 'cosmic')}`);
    
    this.emit('themeChange', theme);
  }

  private toggleReducedMotion(enabled: boolean): void {
    document.documentElement.classList.toggle('reduced-motion', enabled);
    this.emit('reducedMotionChange', enabled);
  }

  // Component access
  get audioControls(): AudioControls {
    return this._audioControls;
  }

  get fileManager(): FileManager {
    return this._fileManager;
  }

  get visualizationCanvas(): VisualizationCanvas {
    return this._visualizationCanvas;
  }

  get settingsPanel(): SettingsPanel {
    return this._settingsPanel;
  }

  get currentBreakpoint(): string {
    return this._currentBreakpoint;
  }

  get isSidebarOpen(): boolean {
    return this._sidebarOpen;
  }

  get isFullscreen(): boolean {
    return this._fullscreenMode;
  }

  // Cleanup
  override destroy(): void {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }

    // Destroy child components
    this._audioControls?.destroy();
    this._fileManager?.destroy();
    this._visualizationCanvas?.destroy();
    this._settingsPanel?.destroy();

    super.destroy();
  }
}
// Music Visualizer - Audio Controls Component

import { BaseComponent } from '../base/BaseComponent';
import { CosmicButton } from '../ui/Button';
import { AudioControlsOptions, WaveformData } from '../../types/ui-types';

export class AudioControls extends BaseComponent {
  private _options: AudioControlsOptions;
  private _transportContainer!: HTMLElement;
  private _waveformContainer!: HTMLElement;
  private _infoContainer!: HTMLElement;
  private _advancedContainer!: HTMLElement;
  
  // Transport controls
  private _playButton!: CosmicButton;
  private _stopButton!: CosmicButton;
  private _previousButton!: CosmicButton;
  private _nextButton!: CosmicButton;
  
  // Waveform and timeline
  private _waveformCanvas!: HTMLCanvasElement;
  private _playhead!: HTMLElement;
  private _progressBar!: HTMLElement;
  private _frequencyOverlay!: HTMLElement;
  
  // Volume control
  private _volumeContainer!: HTMLElement;
  private _volumeSlider!: HTMLElement;
  private _volumeIcon!: HTMLElement;
  
  // Info display
  private _timeDisplay!: HTMLElement;
  private _fileInfo!: HTMLElement;
  private _currentTimeSpan!: HTMLElement;
  private _totalTimeSpan!: HTMLElement;
  private _fileNameSpan!: HTMLElement;
  
  // Advanced controls
  private _inputModeSelector!: HTMLElement;
  private _bpmDisplay!: HTMLElement;
  private _keyDisplay!: HTMLElement;
  private _actionButtons!: HTMLElement;
  
  // State
  private _duration: number = 0;
  private _currentTime: number = 0;
  private _volume: number = 1;
  private _muted: boolean = false;
  private _playing: boolean = false;
  private _loading: boolean = false;
  private _waveformData: WaveformData | null = null;
  
  // Progress update loop
  private _progressAnimationFrame: number = 0;
  private _progressUpdateCallback: (() => number) | null = null;

  constructor(options: AudioControlsOptions = {}) {
    super('div');
    this._options = {
      duration: 0,
      currentTime: 0,
      volume: 1,
      muted: false,
      playing: false,
      loading: false,
      ...options
    };
    
    this.initializeState();
    this.render();
  }

  private initializeState(): void {
    this._duration = this._options.duration || 0;
    this._currentTime = this._options.currentTime || 0;
    this._volume = this._options.volume || 1;
    this._muted = this._options.muted || false;
    this._playing = this._options.playing || false;
    this._loading = this._options.loading || false;
  }

  protected override init(): void {
    super.init();
    this.setupKeyboardShortcuts();
    this.startProgressLoop();
  }

  private setupKeyboardShortcuts(): void {
    const shortcuts = [
      { key: ' ', handler: () => this.togglePlayPause() },
      { key: 'ArrowLeft', handler: () => this.seek(this._currentTime - 10) },
      { key: 'ArrowRight', handler: () => this.seek(this._currentTime + 10) },
      { key: 'ArrowLeft', shift: true, handler: () => this.seek(this._currentTime - 30) },
      { key: 'ArrowRight', shift: true, handler: () => this.seek(this._currentTime + 30) },
      { key: 'ArrowUp', handler: () => this.setVolume(Math.min(1, this._volume + 0.1)) },
      { key: 'ArrowDown', handler: () => this.setVolume(Math.max(0, this._volume - 0.1)) },
      { key: 'm', handler: () => this.toggleMute() },
      { key: 'r', handler: () => this.seek(0) },
    ];

    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Only handle shortcuts if no input is focused
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      shortcuts.forEach(shortcut => {
        if (event.key === shortcut.key && 
            !!event.shiftKey === !!(shortcut as any).shift &&
            !!event.ctrlKey === !!(shortcut as any).ctrl) {
          event.preventDefault();
          shortcut.handler();
        }
      });
    });
  }

  render(): HTMLElement {
    const container = this._element;
    container.className = 'cosmic-audio-controls';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Mission Command Audio Controls');

    // Create main sections
    this.createHeader();
    this.createMainControls();
    this.createAdvancedControls();

    return container;
  }

  private createHeader(): void {
    const header = document.createElement('div');
    header.className = 'audio-controls-header';
    header.innerHTML = `
      <h2 class="cosmic-heading-medium">
        <span class="cosmic-icon icon-mission-control"></span>
        MISSION COMMAND
      </h2>
    `;
    this._element.appendChild(header);
  }

  private createMainControls(): void {
    const mainControls = document.createElement('div');
    mainControls.className = 'audio-controls-main';
    
    // Transport controls
    this.createTransportControls(mainControls);
    
    // Waveform display
    this.createWaveformDisplay(mainControls);
    
    // Mission info
    this.createMissionInfo(mainControls);
    
    this._element.appendChild(mainControls);
  }

  private createTransportControls(parent: HTMLElement): void {
    this._transportContainer = document.createElement('div');
    this._transportContainer.className = 'transport-controls cosmic-container';
    this._transportContainer.innerHTML = `
      <div class="transport-label">TRANSPORT CONTROLS</div>
      <div class="transport-buttons"></div>
      <div class="volume-controls"></div>
    `;

    const buttonsContainer = this._transportContainer.querySelector('.transport-buttons') as HTMLElement;
    const volumeContainer = this._transportContainer.querySelector('.volume-controls') as HTMLElement;

    // Create transport buttons
    this._previousButton = CosmicButton.skipPrevious({
      onClick: () => this.emit('previous')
    });
    this._previousButton.addClass('cosmic-skip-button');
    this._previousButton.addClass('previous');

    this._playButton = CosmicButton.playPause(this._playing, {
      onClick: () => this.togglePlayPause()
    });
    this._playButton.addClass('cosmic-play-button');

    this._nextButton = CosmicButton.skipNext({
      onClick: () => this.emit('next')
    });
    this._nextButton.addClass('cosmic-skip-button');
    this._nextButton.addClass('next');

    this._stopButton = CosmicButton.stop({
      onClick: () => this.stop()
    });
    this._stopButton.addClass('cosmic-stop-button');

    buttonsContainer.appendChild(this._previousButton.element);
    buttonsContainer.appendChild(this._playButton.element);
    buttonsContainer.appendChild(this._nextButton.element);
    buttonsContainer.appendChild(this._stopButton.element);

    // Create volume controls
    this.createVolumeControls(volumeContainer);

    parent.appendChild(this._transportContainer);
  }

  private createVolumeControls(container: HTMLElement): void {
    this._volumeContainer = document.createElement('div');
    this._volumeContainer.className = 'cosmic-volume-control';
    
    this._volumeIcon = document.createElement('div');
    this._volumeIcon.className = 'volume-icon';
    this._volumeIcon.setAttribute('role', 'button');
    this._volumeIcon.setAttribute('aria-label', 'Toggle mute');
    this._volumeIcon.addEventListener('click', () => this.toggleMute());
    
    this._volumeSlider = document.createElement('div');
    this._volumeSlider.className = 'cosmic-range volume-slider';
    this._volumeSlider.innerHTML = `
      <div class="range-track" style="width: ${this._volume * 100}%"></div>
      <div class="range-handle" style="left: ${this._volume * 100}%"></div>
      <div class="range-value">${Math.round(this._volume * 100)}%</div>
    `;

    this.setupVolumeSliderInteraction();
    
    this._volumeContainer.appendChild(this._volumeIcon);
    this._volumeContainer.appendChild(this._volumeSlider);
    container.appendChild(this._volumeContainer);
  }

  private setupVolumeSliderInteraction(): void {
    let isDragging = false;
    const handle = this._volumeSlider.querySelector('.range-handle') as HTMLElement;
    const track = this._volumeSlider.querySelector('.range-track') as HTMLElement;
    const valueDisplay = this._volumeSlider.querySelector('.range-value') as HTMLElement;

    const updateVolume = (clientX: number) => {
      const rect = this._volumeSlider.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      this.setVolume(percentage);
    };

    // Mouse events
    this._volumeSlider.addEventListener('mousedown', (event: MouseEvent) => {
      isDragging = true;
      updateVolume(event.clientX);
      event.preventDefault();
    });

    document.addEventListener('mousemove', (event: MouseEvent) => {
      if (isDragging) {
        updateVolume(event.clientX);
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch events
    this._volumeSlider.addEventListener('touchstart', (event: TouchEvent) => {
      isDragging = true;
      if (event.touches[0]) {
        updateVolume(event.touches[0].clientX);
      }
      event.preventDefault();
    });

    document.addEventListener('touchmove', (event: TouchEvent) => {
      if (isDragging && event.touches[0]) {
        updateVolume(event.touches[0].clientX);
      }
    });

    document.addEventListener('touchend', () => {
      isDragging = false;
    });

    // Keyboard events for accessibility
    handle.addEventListener('keydown', (event: KeyboardEvent) => {
      let delta = 0;
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          delta = -0.05;
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          delta = 0.05;
          break;
        case 'Home':
          this.setVolume(0);
          return;
        case 'End':
          this.setVolume(1);
          return;
      }
      
      if (delta !== 0) {
        event.preventDefault();
        this.setVolume(Math.max(0, Math.min(1, this._volume + delta)));
      }
    });
  }

  private createWaveformDisplay(parent: HTMLElement): void {
    this._waveformContainer = document.createElement('div');
    this._waveformContainer.className = 'cosmic-waveform cosmic-container';
    this._waveformContainer.innerHTML = `
      <div class="waveform-label">WAVEFORM DISPLAY</div>
    `;

    // Create canvas for waveform
    this._waveformCanvas = document.createElement('canvas');
    this._waveformCanvas.className = 'waveform-canvas';
    this._waveformCanvas.width = 800;
    this._waveformCanvas.height = 64;
    this._waveformCanvas.setAttribute('role', 'slider');
    this._waveformCanvas.setAttribute('aria-label', 'Audio timeline');
    this._waveformCanvas.setAttribute('aria-valuemin', '0');
    this._waveformCanvas.setAttribute('aria-valuemax', '100');

    // Create playhead
    this._playhead = document.createElement('div');
    this._playhead.className = 'playhead';

    // Create frequency overlay
    this._frequencyOverlay = document.createElement('div');
    this._frequencyOverlay.className = 'frequency-overlay';
    this._frequencyOverlay.innerHTML = `
      <div class="frequency-band" data-freq="bass"></div>
      <div class="frequency-band" data-freq="low-mid"></div>
      <div class="frequency-band" data-freq="mid"></div>
      <div class="frequency-band" data-freq="high-mid"></div>
      <div class="frequency-band" data-freq="high"></div>
      <div class="frequency-band" data-freq="ultra-high"></div>
    `;

    const waveformWrapper = document.createElement('div');
    waveformWrapper.className = 'waveform-wrapper';
    waveformWrapper.appendChild(this._waveformCanvas);
    waveformWrapper.appendChild(this._playhead);
    waveformWrapper.appendChild(this._frequencyOverlay);

    this._waveformContainer.appendChild(waveformWrapper);
    this.setupWaveformInteraction();

    parent.appendChild(this._waveformContainer);
  }

  private setupWaveformInteraction(): void {
    let isDragging = false;

    const seekToPosition = (clientX: number) => {
      const rect = this._waveformCanvas.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newTime = percentage * this._duration;
      this.seek(newTime);
    };

    this._waveformCanvas.addEventListener('mousedown', (event: MouseEvent) => {
      isDragging = true;
      seekToPosition(event.clientX);
      event.preventDefault();
    });

    document.addEventListener('mousemove', (event: MouseEvent) => {
      if (isDragging) {
        seekToPosition(event.clientX);
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch events
    this._waveformCanvas.addEventListener('touchstart', (event: TouchEvent) => {
      isDragging = true;
      if (event.touches[0]) {
        seekToPosition(event.touches[0].clientX);
      }
      event.preventDefault();
    });

    document.addEventListener('touchmove', (event: TouchEvent) => {
      if (isDragging && event.touches[0]) {
        seekToPosition(event.touches[0].clientX);
      }
    });

    document.addEventListener('touchend', () => {
      isDragging = false;
    });

    // Keyboard navigation
    this._waveformCanvas.addEventListener('keydown', (event: KeyboardEvent) => {
      let delta = 0;
      switch (event.key) {
        case 'ArrowLeft':
          delta = -10;
          break;
        case 'ArrowRight':
          delta = 10;
          break;
        case 'Home':
          this.seek(0);
          return;
        case 'End':
          this.seek(this._duration);
          return;
      }
      
      if (delta !== 0) {
        event.preventDefault();
        this.seek(Math.max(0, Math.min(this._duration, this._currentTime + delta)));
      }
    });
  }

  private createMissionInfo(parent: HTMLElement): void {
    this._infoContainer = document.createElement('div');
    this._infoContainer.className = 'mission-info cosmic-container';
    
    this._timeDisplay = document.createElement('div');
    this._timeDisplay.className = 'time-display';
    
    this._currentTimeSpan = document.createElement('span');
    this._currentTimeSpan.className = 'current-time';
    
    this._totalTimeSpan = document.createElement('span');
    this._totalTimeSpan.className = 'total-time';
    
    this._timeDisplay.appendChild(this._currentTimeSpan);
    this._timeDisplay.appendChild(document.createTextNode(' / '));
    this._timeDisplay.appendChild(this._totalTimeSpan);
    
    this._fileInfo = document.createElement('div');
    this._fileInfo.className = 'file-info';
    this._fileInfo.innerHTML = `
      <div class="file-label">FILE:</div>
      <div class="file-name"></div>
    `;
    
    this._fileNameSpan = this._fileInfo.querySelector('.file-name') as HTMLElement;
    
    this._infoContainer.appendChild(this._timeDisplay);
    this._infoContainer.appendChild(this._fileInfo);
    
    parent.appendChild(this._infoContainer);
  }

  private createAdvancedControls(): void {
    this._advancedContainer = document.createElement('div');
    this._advancedContainer.className = 'advanced-controls cosmic-container';
    this._advancedContainer.innerHTML = `
      <div class="advanced-label">ADVANCED CONTROLS</div>
      <div class="advanced-content">
        <div class="input-mode-section"></div>
        <div class="analysis-section"></div>
        <div class="action-section"></div>
      </div>
    `;

    this.createInputModeSelector();
    this.createAnalysisDisplay();
    this.createActionButtons();

    this._element.appendChild(this._advancedContainer);
  }

  private createInputModeSelector(): void {
    const container = this._advancedContainer.querySelector('.input-mode-section') as HTMLElement;
    this._inputModeSelector = document.createElement('div');
    this._inputModeSelector.className = 'input-mode-selector';
    this._inputModeSelector.innerHTML = `
      <select class="mode-dropdown cosmic-dropdown">
        <option value="file">File Mode</option>
        <option value="live">Live Input</option>
        <option value="mic">Microphone</option>
      </select>
      <div class="live-indicator inactive"></div>
    `;
    container.appendChild(this._inputModeSelector);
  }

  private createAnalysisDisplay(): void {
    const container = this._advancedContainer.querySelector('.analysis-section') as HTMLElement;
    this._bpmDisplay = document.createElement('div');
    this._bpmDisplay.className = 'bpm-display';
    this._bpmDisplay.innerHTML = `
      <span class="bpm-icon"></span>
      <span class="bpm-label">BPM:</span>
      <span class="bpm-value">--</span>
    `;

    this._keyDisplay = document.createElement('div');
    this._keyDisplay.className = 'key-display';
    this._keyDisplay.innerHTML = `
      <span class="key-icon"></span>
      <span class="key-label">Key:</span>
      <span class="key-value">--</span>
    `;

    const analysisWrapper = document.createElement('div');
    analysisWrapper.className = 'audio-analysis';
    analysisWrapper.appendChild(this._bpmDisplay);
    analysisWrapper.appendChild(this._keyDisplay);
    
    container.appendChild(analysisWrapper);
  }

  private createActionButtons(): void {
    const container = this._advancedContainer.querySelector('.action-section') as HTMLElement;
    this._actionButtons = document.createElement('div');
    this._actionButtons.className = 'action-buttons';

    const buttons = [
      { icon: 'sync', label: 'Sync to beat', action: () => this.emit('sync') },
      { icon: 'settings', label: 'Settings', action: () => this.emit('settings') },
      { icon: 'save', label: 'Save preset', action: () => this.emit('save') },
      { icon: 'export', label: 'Export visualization', action: () => this.emit('export') }
    ];

    buttons.forEach(btn => {
      const button = CosmicButton.icon(btn.icon, {
        ariaLabel: btn.label,
        onClick: btn.action
      });
      button.addClass('action-button');
      this._actionButtons.appendChild(button.element);
    });

    container.appendChild(this._actionButtons);
  }

  // Public API methods
  togglePlayPause(): void {
    if (this._playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  play(): void {
    this._playing = true;
    this.updatePlayButton();
    
    if (this._options.onPlay) {
      this._options.onPlay();
    }
    
    this.emit('play');
  }

  pause(): void {
    this._playing = false;
    this.updatePlayButton();
    
    if (this._options.onPause) {
      this._options.onPause();
    }
    
    this.emit('pause');
  }

  stop(): void {
    this._playing = false;
    this._currentTime = 0;
    this.updatePlayButton();
    this.updateTimeDisplay();
    this.updateWaveform();
    
    if (this._options.onStop) {
      this._options.onStop();
    }
    
    this.emit('stop');
  }

  seek(time: number): void {
    const newTime = Math.max(0, Math.min(this._duration, time));
    this._currentTime = newTime;
    this.updateTimeDisplay();
    this.updateWaveform();
    
    if (this._options.onSeek) {
      this._options.onSeek(newTime);
    }
    
    this.emit('seek', newTime);
    
    // Force immediate visual update
    this.updateTimeDisplay();
    this.updateWaveform();
  }

  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));
    this.updateVolumeDisplay();
    
    if (this._options.onVolumeChange) {
      this._options.onVolumeChange(this._volume);
    }
    
    this.emit('volumeChange', this._volume);
  }

  toggleMute(): void {
    this._muted = !this._muted;
    this.updateVolumeDisplay();
    
    if (this._options.onMute) {
      this._options.onMute(this._muted);
    }
    
    this.emit('mute', this._muted);
  }

  setDuration(duration: number): void {
    this._duration = duration;
    this.updateTimeDisplay();
    this.updateWaveform();
  }

  setCurrentTime(time: number): void {
    this._currentTime = time;
    this.updateTimeDisplay();
    this.updateWaveform();
  }

  setFileName(fileName: string): void {
    this._fileNameSpan.textContent = fileName;
  }

  setWaveformData(data: WaveformData): void {
    this._waveformData = data;
    this.drawWaveform();
  }

  setBPM(bpm: number): void {
    const bpmValue = this._bpmDisplay.querySelector('.bpm-value') as HTMLElement;
    bpmValue.textContent = Math.round(bpm).toString();
  }

  setKey(key: string): void {
    const keyValue = this._keyDisplay.querySelector('.key-value') as HTMLElement;
    keyValue.textContent = key;
  }

  override setLoading(loading: boolean): void {
    this._loading = loading;
    super.setLoading(loading);
    
    if (loading) {
      this._playButton.setLoading(true);
    } else {
      this._playButton.setLoading(false);
    }
  }

  // Update methods
  private updatePlayButton(): void {
    this._playButton.setIcon(this._playing ? 'pause' : 'play');
    this._playButton.setAccessibility({
      ariaLabel: this._playing ? 'Pause cosmic journey' : 'Play cosmic journey'
    });
  }

  private updateTimeDisplay(): void {
    this._currentTimeSpan.textContent = this.formatTime(this._currentTime);
    this._totalTimeSpan.textContent = this.formatTime(this._duration);
    
    // Update ARIA attributes
    const percentage = this._duration > 0 ? (this._currentTime / this._duration) * 100 : 0;
    this._waveformCanvas.setAttribute('aria-valuenow', percentage.toString());
    this._waveformCanvas.setAttribute('aria-valuetext', 
      `${this.formatTime(this._currentTime)} of ${this.formatTime(this._duration)}`);
  }

  private updateVolumeDisplay(): void {
    const percentage = this._muted ? 0 : this._volume * 100;
    const track = this._volumeSlider.querySelector('.range-track') as HTMLElement;
    const handle = this._volumeSlider.querySelector('.range-handle') as HTMLElement;
    const valueDisplay = this._volumeSlider.querySelector('.range-value') as HTMLElement;
    
    track.style.width = `${percentage}%`;
    handle.style.left = `${percentage}%`;
    valueDisplay.textContent = `${Math.round(percentage)}%`;
    
    // Update volume icon
    this._volumeIcon.className = `volume-icon ${this._muted || this._volume === 0 ? 'muted' : 
      this._volume < 0.5 ? 'low' : 'high'}`;
  }

  private updateWaveform(): void {
    const percentage = this._duration > 0 ? (this._currentTime / this._duration) * 100 : 0;
    this._playhead.style.left = `${percentage}%`;
    
    if (this._waveformData) {
      this.drawWaveform();
    }
  }

  private drawWaveform(): void {
    if (!this._waveformData) return;
    
    const canvas = this._waveformCanvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const peaks = this._waveformData.peaks;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw waveform bars
    const barWidth = width / peaks.length;
    const progressPoint = (this._currentTime / this._duration) * peaks.length;
    
    peaks.forEach((peak, index) => {
      const barHeight = peak * height * 0.8;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;
      
      // Choose color based on playback position
      if (index < progressPoint) {
        ctx.fillStyle = 'rgba(124, 77, 255, 0.8)'; // Played
      } else if (index === Math.floor(progressPoint)) {
        ctx.fillStyle = 'rgba(255, 64, 129, 0.9)'; // Current
      } else {
        ctx.fillStyle = 'rgba(100, 255, 218, 0.6)'; // Upcoming
      }
      
      ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
    });
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Progress update loop
  private startProgressLoop(): void {
    const updateProgress = () => {
      if (this._playing && this._progressUpdateCallback) {
        // Get current time from audio manager
        const currentTime = this._progressUpdateCallback();
        if (currentTime !== this._currentTime) {
          this._currentTime = currentTime;
          this.updateTimeDisplay();
          this.updateWaveform();
        }
      }
      
      // Continue the loop
      this._progressAnimationFrame = requestAnimationFrame(updateProgress);
    };
    
    updateProgress();
  }

  private stopProgressLoop(): void {
    if (this._progressAnimationFrame) {
      cancelAnimationFrame(this._progressAnimationFrame);
      this._progressAnimationFrame = 0;
    }
  }

  // Set callback to get current time from audio manager
  setProgressUpdateCallback(callback: () => number): void {
    this._progressUpdateCallback = callback;
  }

  // Cleanup
  override destroy(): void {
    this.stopProgressLoop();
    super.destroy();
  }
}
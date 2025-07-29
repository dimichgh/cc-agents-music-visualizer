# Interactive Prototypes - Music Visualizer Application

## Overview

These interactive prototypes demonstrate the core user flows and interactions for the Music Visualizer application. Each prototype includes HTML, CSS, and JavaScript implementations that showcase the cosmic aesthetic and user experience patterns.

## Prototype 1: Main Application Flow

### HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cosmic Music Visualizer - Interactive Prototype</title>
    <link rel="stylesheet" href="cosmic-styles.css">
</head>
<body>
    <!-- Skip Links for Accessibility -->
    <div class="skip-links">
        <a href="#main-content">Skip to main content</a>
        <a href="#audio-controls">Skip to audio controls</a>
    </div>

    <!-- Main Application Container -->
    <div class="cosmic-app" id="cosmic-app">
        <!-- Header Menu -->
        <header class="cosmic-header">
            <div class="app-title">
                <h1>🌌 Cosmic Music Visualizer</h1>
            </div>
            <nav class="main-navigation">
                <button class="nav-button" data-section="file">📁 File</button>
                <button class="nav-button" data-section="view">👁 View</button>
                <button class="nav-button" data-section="effects">✨ Effects</button>
                <button class="nav-button" data-section="settings">⚙ Settings</button>
                <button class="nav-button" data-section="help">❓ Help</button>
            </nav>
            <div class="window-controls">
                <button class="window-btn minimize">−</button>
                <button class="window-btn maximize">□</button>
                <button class="window-btn close">×</button>
            </div>
        </header>

        <main id="main-content" class="main-content">
            <!-- File Management Panel -->
            <section class="file-panel" id="file-panel">
                <div class="cosmic-container">
                    <h2>Cosmic Archive System</h2>
                    <div class="drop-zone" id="drop-zone">
                        <div class="drop-icon">🌌</div>
                        <div class="drop-message">
                            <div class="primary-text">Drop WAV files here to begin exploration</div>
                            <div class="secondary-text">or click to browse your system</div>
                        </div>
                        <div class="action-buttons">
                            <button class="cosmic-button primary" id="browse-files">Browse Files</button>
                            <button class="cosmic-button secondary" id="live-input">Live Input</button>
                        </div>
                    </div>
                    
                    <div class="file-list" id="file-list" style="display: none;">
                        <h3>Discovered Signals</h3>
                        <div class="signal-items">
                            <!-- Populated by JavaScript -->
                        </div>
                    </div>
                </div>
            </section>

            <!-- Visualization Display -->
            <section class="visualization-section" id="visualization-section">
                <div class="cosmic-observatory">
                    <canvas class="main-canvas" id="main-canvas" width="800" height="600"></canvas>
                    <div class="instrument-overlay" id="instrument-overlay">
                        <!-- Instrument shadows populated by JavaScript -->
                    </div>
                    <div class="effect-overlay" id="effect-overlay">
                        <div class="effect-controls">
                            <div class="control-group">
                                <label for="effect-select">Effect:</label>
                                <select id="effect-select" class="cosmic-dropdown">
                                    <option value="stellar-nursery">Stellar Nursery</option>
                                    <option value="galactic-core">Galactic Core</option>
                                    <option value="solar-wind">Solar Wind</option>
                                    <option value="quantum-field">Quantum Field</option>
                                </select>
                            </div>
                            <div class="control-group">
                                <label for="intensity-slider">Intensity:</label>
                                <div class="cosmic-range">
                                    <input type="range" id="intensity-slider" min="0" max="100" value="50">
                                    <div class="range-track"></div>
                                    <div class="range-handle"></div>
                                </div>
                            </div>
                            <div class="control-group">
                                <button class="cosmic-icon-button" id="fullscreen-btn" title="Fullscreen">🌌</button>
                                <button class="cosmic-icon-button" id="settings-btn" title="Settings">⚙</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Audio Controls -->
            <section class="audio-controls-section" id="audio-controls">
                <div class="cosmic-container">
                    <div class="control-panel">
                        <!-- Transport Controls -->
                        <div class="transport-controls">
                            <button class="cosmic-button icon-only" id="prev-btn" title="Previous">⏮</button>
                            <button class="cosmic-play-button" id="play-btn" title="Play/Pause">▶</button>
                            <button class="cosmic-button icon-only" id="next-btn" title="Next">⏭</button>
                            <button class="cosmic-button icon-only" id="stop-btn" title="Stop">⏹</button>
                        </div>

                        <!-- Waveform Display -->
                        <div class="waveform-container">
                            <div class="cosmic-waveform" id="waveform">
                                <div class="waveform-bars">
                                    <!-- Generated by JavaScript -->
                                </div>
                                <div class="playhead" id="playhead"></div>
                            </div>
                            <div class="time-display">
                                <span id="current-time">0:00</span> / <span id="total-time">0:00</span>
                            </div>
                        </div>

                        <!-- Volume Control -->
                        <div class="volume-control">
                            <span class="volume-icon">🔊</span>
                            <div class="cosmic-range">
                                <input type="range" id="volume-slider" min="0" max="100" value="70">
                                <div class="range-track"></div>
                                <div class="range-handle"></div>
                            </div>
                        </div>

                        <!-- Track Info -->
                        <div class="track-info">
                            <div class="file-name" id="file-name">No file selected</div>
                            <div class="audio-stats">
                                <span>BPM: <span id="bpm">--</span></span>
                                <span>Key: <span id="key">--</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <!-- Settings Modal -->
        <div class="modal-overlay" id="settings-modal" style="display: none;">
            <div class="mission-control-settings">
                <div class="settings-header">
                    <h2>Mission Control Configuration</h2>
                    <button class="close-button" id="close-settings">×</button>
                </div>
                <div class="settings-tabs">
                    <button class="tab-button active" data-tab="visual">🌌 Visual</button>
                    <button class="tab-button" data-tab="audio">🎵 Audio</button>
                    <button class="tab-button" data-tab="performance">⚡ Performance</button>
                    <button class="tab-button" data-tab="accessibility">♿ Access</button>
                </div>
                <div class="settings-content">
                    <div class="tab-content active" id="visual-tab">
                        <h3>Visual Effects Settings</h3>
                        <div class="setting-group">
                            <label for="particle-density">Particle Density:</label>
                            <div class="cosmic-range">
                                <input type="range" id="particle-density" min="100" max="5000" value="2000">
                            </div>
                        </div>
                        <div class="setting-group">
                            <label for="animation-speed">Animation Speed:</label>
                            <div class="cosmic-range">
                                <input type="range" id="animation-speed" min="0.5" max="3" step="0.1" value="1">
                            </div>
                        </div>
                        <div class="setting-group">
                            <label>Color Palette:</label>
                            <div class="palette-grid">
                                <div class="palette-option aurora selected" data-palette="aurora"></div>
                                <div class="palette-option sunset" data-palette="sunset"></div>
                                <div class="palette-option deep-space" data-palette="deep-space"></div>
                            </div>
                        </div>
                    </div>
                    <!-- Other tab contents would be here -->
                </div>
                <div class="settings-actions">
                    <button class="cosmic-button secondary" id="reset-settings">Reset Defaults</button>
                    <button class="cosmic-button primary" id="apply-settings">Apply Changes</button>
                </div>
            </div>
        </div>

        <!-- Loading Overlay -->
        <div class="cosmic-loading-overlay" id="loading-overlay" style="display: none;">
            <div class="loading-content">
                <div class="cosmic-spinner large"></div>
                <div class="loading-message">Loading Cosmic Experience...</div>
                <div class="loading-details">Preparing your music visualization</div>
            </div>
        </div>

        <!-- Toast Notifications -->
        <div class="toast-container" id="toast-container"></div>
    </div>

    <script src="cosmic-prototype.js"></script>
</body>
</html>
```

### JavaScript Interactions
```javascript
// Cosmic Music Visualizer Prototype
class CosmicVisualizerPrototype {
    constructor() {
        this.isPlaying = false;
        this.currentTime = 0;
        this.totalTime = 180; // 3 minutes for demo
        this.volume = 0.7;
        this.intensity = 0.5;
        this.currentEffect = 'stellar-nursery';
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupVisualization();
        this.setupWaveform();
        this.createDemoFiles();
        this.startCosmicBackground();
    }
    
    setupEventListeners() {
        // File handling
        document.getElementById('browse-files').addEventListener('click', () => {
            this.simulateFileSelection();
        });
        
        document.getElementById('drop-zone').addEventListener('dragover', (e) => {
            e.preventDefault();
            e.currentTarget.classList.add('drag-over');
        });
        
        document.getElementById('drop-zone').addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');
            this.simulateFileSelection();
        });
        
        // Audio controls
        document.getElementById('play-btn').addEventListener('click', () => {
            this.togglePlayback();
        });
        
        document.getElementById('volume-slider').addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
        
        document.getElementById('intensity-slider').addEventListener('input', (e) => {
            this.setIntensity(e.target.value / 100);
        });
        
        // Effect selection
        document.getElementById('effect-select').addEventListener('change', (e) => {
            this.setEffect(e.target.value);
        });
        
        // Settings modal
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.openSettings();
        });
        
        document.getElementById('close-settings').addEventListener('click', () => {
            this.closeSettings();
        });
        
        // Fullscreen
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
    }
    
    setupVisualization() {
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        
        // Create initial particles
        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                life: Math.random(),
                color: this.getParticleColor()
            });
        }
    }
    
    setupWaveform() {
        const waveformBars = document.querySelector('.waveform-bars');
        waveformBars.innerHTML = '';
        
        for (let i = 0; i < 100; i++) {
            const bar = document.createElement('div');
            bar.className = 'waveform-bar';
            bar.style.height = `${Math.random() * 80 + 20}%`;
            waveformBars.appendChild(bar);
        }
    }
    
    createDemoFiles() {
        const demoFiles = [
            { name: 'cosmic_dream.wav', duration: '4:23', size: '42MB' },
            { name: 'stellar_ambience.wav', duration: '6:45', size: '65MB' },
            { name: 'quantum_beats.wav', duration: '3:12', size: '31MB' }
        ];
        
        const fileList = document.getElementById('file-list');
        const signalItems = fileList.querySelector('.signal-items');
        
        demoFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'signal-item';
            fileItem.innerHTML = `
                <div class="signal-icon">🎵</div>
                <div class="signal-info">
                    <div class="signal-name">${file.name}</div>
                    <div class="signal-metadata">
                        <span>Duration: ${file.duration}</span>
                        <span>Size: ${file.size}</span>
                    </div>
                </div>
                <div class="signal-actions">
                    <button class="action-button play" onclick="prototype.loadFile('${file.name}')">▶</button>
                    <button class="action-button favorite">⭐</button>
                    <button class="action-button analyze">📊</button>
                </div>
            `;
            signalItems.appendChild(fileItem);
        });
    }
    
    simulateFileSelection() {
        this.showLoading('Analyzing Audio File', 'Processing frequency data...');
        
        setTimeout(() => {
            document.getElementById('file-panel').style.display = 'none';
            document.getElementById('file-list').style.display = 'block';
            document.getElementById('visualization-section').style.display = 'block';
            this.hideLoading();
            this.showToast('File loaded successfully!', 'success');
            this.loadFile('cosmic_dream.wav');
        }, 2000);
    }
    
    loadFile(filename) {
        document.getElementById('file-name').textContent = filename;
        document.getElementById('bpm').textContent = '128';
        document.getElementById('key').textContent = 'Dm';
        document.getElementById('total-time').textContent = '4:23';
        
        // Simulate audio analysis
        this.simulateAudioAnalysis();
        this.showToast(`Loaded: ${filename}`, 'info');
    }
    
    togglePlayback() {
        this.isPlaying = !this.isPlaying;
        const playBtn = document.getElementById('play-btn');
        
        if (this.isPlaying) {
            playBtn.innerHTML = '⏸';
            playBtn.classList.add('playing');
            this.startVisualization();
            this.startTimeUpdate();
            this.showToast('Cosmic journey initiated!', 'success');
        } else {
            playBtn.innerHTML = '▶';
            playBtn.classList.remove('playing');
            this.stopVisualization();
            this.stopTimeUpdate();
            this.showToast('Journey paused', 'info');
        }
    }
    
    setVolume(volume) {
        this.volume = volume;
        this.updateVolumeDisplay();
    }
    
    setIntensity(intensity) {
        this.intensity = intensity;
        this.updateVisualizationIntensity();
    }
    
    setEffect(effect) {
        this.currentEffect = effect;
        this.updateVisualizationEffect();
        this.showToast(`Effect changed to ${effect}`, 'info');
    }
    
    startVisualization() {
        const animate = () => {
            if (!this.isPlaying) return;
            
            this.updateParticles();
            this.renderVisualization();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    stopVisualization() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    updateParticles() {
        this.particles.forEach(particle => {
            // Simulate audio-reactive movement
            const audioIntensity = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
            
            particle.x += particle.vx * audioIntensity * this.intensity;
            particle.y += particle.vy * audioIntensity * this.intensity;
            
            // Wrap around edges
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // Update life
            particle.life += 0.01;
            if (particle.life > 1) particle.life = 0;
        });
    }
    
    renderVisualization() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw particles
        this.particles.forEach(particle => {
            const alpha = Math.sin(particle.life * Math.PI);
            this.ctx.fillStyle = `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    getParticleColor() {
        const colors = {
            'stellar-nursery': 'rgba(100, 255, 218, ',
            'galactic-core': 'rgba(124, 77, 255, ',
            'solar-wind': 'rgba(255, 109, 0, ',
            'quantum-field': 'rgba(68, 138, 255, '
        };
        return colors[this.currentEffect] || colors['stellar-nursery'];
    }
    
    updateVisualizationEffect() {
        // Update particle colors based on effect
        this.particles.forEach(particle => {
            particle.color = this.getParticleColor();
        });
    }
    
    updateVisualizationIntensity() {
        // Adjust particle count based on intensity
        const targetCount = Math.floor(this.intensity * 200 + 50);
        
        while (this.particles.length < targetCount) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                life: Math.random(),
                color: this.getParticleColor()
            });
        }
        
        while (this.particles.length > targetCount) {
            this.particles.pop();
        }
    }
    
    simulateAudioAnalysis() {
        // Simulate real-time audio analysis updates
        setInterval(() => {
            if (!this.isPlaying) return;
            
            // Update waveform bars
            const bars = document.querySelectorAll('.waveform-bar');
            bars.forEach(bar => {
                const height = Math.random() * 80 + 20;
                bar.style.height = `${height}%`;
            });
            
            // Update instrument shadows
            this.updateInstrumentShadows();
        }, 100);
    }
    
    updateInstrumentShadows() {
        const overlay = document.getElementById('instrument-overlay');
        
        // Simulate instrument detection
        const instruments = ['piano', 'guitar', 'drums', 'vocals'];
        const activeInstruments = instruments.filter(() => Math.random() > 0.7);
        
        overlay.innerHTML = '';
        activeInstruments.forEach(instrument => {
            const shadow = document.createElement('div');
            shadow.className = `instrument-shadow ${instrument}-shadow active`;
            shadow.style.left = `${Math.random() * 70 + 15}%`;
            shadow.style.top = `${Math.random() * 70 + 15}%`;
            overlay.appendChild(shadow);
        });
    }
    
    startTimeUpdate() {
        this.timeInterval = setInterval(() => {
            if (!this.isPlaying) return;
            
            this.currentTime += 1;
            if (this.currentTime >= this.totalTime) {
                this.currentTime = 0;
                this.togglePlayback(); // Auto-stop at end
            }
            
            this.updateTimeDisplay();
            this.updatePlayhead();
        }, 1000);
    }
    
    stopTimeUpdate() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
    }
    
    updateTimeDisplay() {
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
        
        document.getElementById('current-time').textContent = formatTime(this.currentTime);
    }
    
    updatePlayhead() {
        const progress = this.currentTime / this.totalTime;
        const playhead = document.getElementById('playhead');
        playhead.style.left = `${progress * 100}%`;
    }
    
    updateVolumeDisplay() {
        const volumeIcon = document.querySelector('.volume-icon');
        if (this.volume === 0) {
            volumeIcon.textContent = '🔇';
        } else if (this.volume < 0.5) {
            volumeIcon.textContent = '🔉';
        } else {
            volumeIcon.textContent = '🔊';
        }
    }
    
    openSettings() {
        document.getElementById('settings-modal').style.display = 'flex';
        this.showToast('Mission Control activated', 'info');
    }
    
    closeSettings() {
        document.getElementById('settings-modal').style.display = 'none';
    }
    
    toggleFullscreen() {
        const visualization = document.getElementById('visualization-section');
        
        if (!document.fullscreenElement) {
            visualization.requestFullscreen();
            this.showToast('Entering cosmic immersion mode', 'info');
        } else {
            document.exitFullscreen();
            this.showToast('Returning to mission control', 'info');
        }
    }
    
    handleKeyboard(e) {
        switch (e.key) {
            case ' ':
                e.preventDefault();
                this.togglePlayback();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.currentTime = Math.max(0, this.currentTime - 10);
                this.updateTimeDisplay();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.currentTime = Math.min(this.totalTime, this.currentTime + 10);
                this.updateTimeDisplay();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.setVolume(Math.min(1, this.volume + 0.1));
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.setVolume(Math.max(0, this.volume - 0.1));
                break;
            case 'f':
            case 'F':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this.toggleFullscreen();
                }
                break;
            case 'Escape':
                this.closeSettings();
                break;
        }
    }
    
    showLoading(message, details) {
        const overlay = document.getElementById('loading-overlay');
        overlay.querySelector('.loading-message').textContent = message;
        overlay.querySelector('.loading-details').textContent = details;
        overlay.style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `cosmic-toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">${icons[type]}</div>
                <div class="toast-message">${message}</div>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Show animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto-remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    startCosmicBackground() {
        // Add subtle background animations
        const app = document.getElementById('cosmic-app');
        
        setInterval(() => {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            
            app.style.background = `
                radial-gradient(ellipse 800px 400px at ${x}% ${y}%, rgba(100, 255, 218, 0.03) 0%, transparent 70%),
                linear-gradient(135deg, rgba(10, 10, 15, 1) 0%, rgba(26, 26, 37, 1) 100%)
            `;
        }, 5000);
    }
}

// Initialize prototype when page loads
let prototype;
document.addEventListener('DOMContentLoaded', () => {
    prototype = new CosmicVisualizerPrototype();
});

// Make prototype globally accessible for demo buttons
window.prototype = prototype;
```

### CSS Styles (Key Components)
```css
/* Cosmic Visualizer Prototype Styles */
:root {
    --cosmic-bg-primary: rgba(10, 10, 15, 1);
    --cosmic-bg-secondary: rgba(26, 26, 37, 1);
    --cosmic-text-primary: rgba(255, 255, 255, 0.9);
    --cosmic-text-secondary: rgba(255, 255, 255, 0.7);
    --cosmic-accent-1: rgba(100, 255, 218, 0.8);
    --cosmic-accent-2: rgba(68, 138, 255, 0.8);
    --cosmic-accent-3: rgba(124, 77, 255, 0.8);
    --cosmic-border: rgba(100, 255, 218, 0.2);
    --cosmic-shadow: rgba(0, 0, 0, 0.3);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--cosmic-bg-primary);
    color: var(--cosmic-text-primary);
    overflow: hidden;
}

.cosmic-app {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, var(--cosmic-bg-primary) 0%, var(--cosmic-bg-secondary) 100%);
}

/* Header Styles */
.cosmic-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: rgba(26, 26, 37, 0.9);
    border-bottom: 1px solid var(--cosmic-border);
    backdrop-filter: blur(10px);
}

.app-title h1 {
    font-size: 16px;
    font-weight: 600;
    color: var(--cosmic-accent-1);
}

.main-navigation {
    display: flex;
    gap: 8px;
}

.nav-button {
    padding: 6px 12px;
    background: rgba(42, 42, 64, 0.6);
    border: 1px solid var(--cosmic-border);
    border-radius: 6px;
    color: var(--cosmic-text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.nav-button:hover {
    background: rgba(58, 58, 85, 0.8);
    color: var(--cosmic-accent-1);
    border-color: var(--cosmic-accent-1);
}

/* Visualization Section */
.cosmic-observatory {
    position: relative;
    width: 100%;
    height: 400px;
    background: linear-gradient(135deg, rgba(10, 10, 15, 1) 0%, rgba(26, 26, 37, 0.95) 100%);
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid var(--cosmic-border);
    margin: 16px;
}

.main-canvas {
    width: 100%;
    height: 100%;
    display: block;
}

.effect-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(26, 26, 37, 0.9) 0%, transparent 100%);
    backdrop-filter: blur(10px);
    padding: 16px;
}

.effect-controls {
    display: flex;
    gap: 16px;
    align-items: center;
}

/* Instrument Shadows */
.instrument-shadow {
    position: absolute;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.5s ease;
    filter: blur(2px);
}

.instrument-shadow.active {
    opacity: 1;
}

.piano-shadow {
    width: 120px;
    height: 60px;
    background: linear-gradient(to right, rgba(255, 255, 255, 0.1) 0%, rgba(100, 255, 218, 0.2) 50%, rgba(255, 255, 255, 0.1) 100%);
    clip-path: polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%);
}

.guitar-shadow {
    width: 80px;
    height: 200px;
    background: radial-gradient(ellipse, rgba(255, 109, 0, 0.2) 30%, transparent 100%);
    border-radius: 50% 50% 30% 70%;
}

.drums-shadow {
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, rgba(244, 67, 54, 0.3) 0%, transparent 100%);
    border-radius: 50%;
}

.vocals-shadow {
    width: 60px;
    height: 120px;
    background: radial-gradient(ellipse, rgba(100, 255, 218, 0.2) 0%, transparent 100%);
    border-radius: 50%;
}

/* Animations */
@keyframes cosmic-rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

@keyframes cosmic-pulse {
    0%, 100% { opacity: 0.7; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
}

/* Responsive Design */
@media (max-width: 900px) {
    .cosmic-observatory {
        height: 300px;
        margin: 8px;
    }
    
    .effect-controls {
        flex-direction: column;
        gap: 8px;
    }
    
    .main-navigation {
        display: none;
    }
}

/* Loading States */
.cosmic-loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(10, 10, 15, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.cosmic-spinner {
    width: 64px;
    height: 64px;
    border: 3px solid rgba(100, 255, 218, 0.2);
    border-top: 3px solid var(--cosmic-accent-1);
    border-radius: 50%;
    animation: cosmic-rotate 1.2s linear infinite;
    margin-bottom: 20px;
}

/* Toast Notifications */
.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10001;
}

.cosmic-toast {
    background: rgba(26, 26, 37, 0.95);
    border: 1px solid var(--cosmic-border);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 8px;
    backdrop-filter: blur(10px);
    transform: translateX(100%);
    transition: transform 0.3s ease;
}

.cosmic-toast.show {
    transform: translateX(0);
}

.cosmic-toast.success {
    border-color: rgba(76, 175, 80, 0.6);
}

.cosmic-toast.error {
    border-color: rgba(244, 67, 54, 0.6);
}

.toast-content {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(5px);
}

.mission-control-settings {
    background: rgba(26, 26, 37, 0.95);
    border: 2px solid var(--cosmic-border);
    border-radius: 16px;
    width: 90%;
    max-width: 800px;
    max-height: 80%;
    overflow: hidden;
    backdrop-filter: blur(20px);
}

.settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--cosmic-border);
}

.settings-tabs {
    display: flex;
    background: rgba(42, 42, 64, 0.6);
    border-bottom: 1px solid var(--cosmic-border);
}

.tab-button {
    flex: 1;
    padding: 12px 16px;
    background: transparent;
    border: none;
    color: var(--cosmic-text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
}

.tab-button.active {
    background: rgba(100, 255, 218, 0.1);
    color: var(--cosmic-accent-1);
    border-bottom: 2px solid var(--cosmic-accent-1);
}

.settings-content {
    padding: 24px;
    max-height: 400px;
    overflow-y: auto;
}

.setting-group {
    margin-bottom: 20px;
}

.setting-group label {
    display: block;
    margin-bottom: 8px;
    color: var(--cosmic-accent-1);
    font-weight: 500;
}

/* Palette Grid */
.palette-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.palette-option {
    height: 40px;
    border-radius: 8px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
}

.palette-option:hover {
    transform: scale(1.05);
}

.palette-option.selected {
    border-color: var(--cosmic-accent-1);
    box-shadow: 0 0 16px rgba(100, 255, 218, 0.4);
}

.palette-option.aurora {
    background: linear-gradient(90deg, #64ffda 0%, #448aff 33%, #7c4dff 66%, #ff4081 100%);
}

.palette-option.sunset {
    background: linear-gradient(90deg, #ff6d00 0%, #ff8f00 33%, #ffc107 66%, #ffeb3b 100%);
}

.palette-option.deep-space {
    background: linear-gradient(90deg, #1a1a25 0%, #2a2a40 33%, #3a3a55 66%, #4a4a70 100%);
}
```

This interactive prototype demonstrates the key user flows and cosmic aesthetic of the Music Visualizer application, providing a functional preview of the user experience and interaction patterns.
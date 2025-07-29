// Music Visualizer - Visualization Canvas Component

import { BaseComponent } from '../base/BaseComponent';
import { CosmicButton } from '../ui/Button';
import { VisualizationOptions } from '../../types/ui-types';
import * as THREE from 'three';

export class VisualizationCanvas extends BaseComponent {
  private _options: VisualizationOptions;
  private _canvasContainer!: HTMLElement;
  private _overlayControls!: HTMLElement;
  private _canvas!: HTMLCanvasElement;
  private _overlayCanvas!: HTMLCanvasElement;
  private _fullscreenButton!: CosmicButton;
  private _recordButton!: CosmicButton;
  private _settingsButton!: CosmicButton;
  private _presetSelector!: HTMLSelectElement;
  
  // Three.js components
  private _scene!: THREE.Scene;
  private _camera!: THREE.PerspectiveCamera;
  private _renderer!: THREE.WebGLRenderer;
  private _animationFrame: number = 0;
  
  // Visualization state
  private _isFullscreen: boolean = false;
  private _isRecording: boolean = false;
  private _currentPreset: string = 'cosmic-symphony';
  private _audioData: Float32Array = new Float32Array(1024);
  private _frequencyData: Float32Array = new Float32Array(512);
  
  // Cosmic effects
  private _particleSystem!: THREE.Points;
  private _nebulaField!: THREE.Mesh;
  private _energyTrails: THREE.Line[] = [];
  private _geometryPool: Map<string, THREE.BufferGeometry> = new Map();
  private _materialPool: Map<string, THREE.Material> = new Map();

  constructor(options: VisualizationOptions = {}) {
    super('div');
    this._options = {
      width: 800,
      height: 600,
      backgroundColor: '#0a0a0f',
      responsive: true,
      interactive: true,
      ...options
    };
    
    this.render();
    this.initializeThreeJS();
    this.createCosmicScene();
  }

  protected override init(): void {
    super.init();
    this.setupResizeObserver();
    this.setupFullscreenListeners();
    this.setupInteractionListeners();
  }

  private setupResizeObserver(): void {
    if (this._options.responsive) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          this.resize(width, height);
        }
      });
      
      resizeObserver.observe(this._element);
    }
  }

  private setupFullscreenListeners(): void {
    document.addEventListener('fullscreenchange', () => {
      this._isFullscreen = !!document.fullscreenElement;
      this.updateFullscreenButton();
      this.handleFullscreenChange();
    });

    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'f' && !event.ctrlKey && !event.metaKey) {
        if (document.activeElement?.tagName !== 'INPUT') {
          event.preventDefault();
          this.toggleFullscreen();
        }
      }
      
      if (event.key === 'Escape' && this._isFullscreen) {
        this.exitFullscreen();
      }
    });
  }

  private setupInteractionListeners(): void {
    if (!this._options.interactive) return;

    let mousePosition = { x: 0, y: 0 };
    let lastMouseMove = 0;

    this._canvas.addEventListener('mousemove', (event: MouseEvent) => {
      const rect = this._canvas.getBoundingClientRect();
      mousePosition = {
        x: (event.clientX - rect.left) / rect.width * 2 - 1,
        y: -(event.clientY - rect.top) / rect.height * 2 + 1
      };
      
      lastMouseMove = Date.now();
      this.updateMouseInteraction(mousePosition);
    });

    this._canvas.addEventListener('click', (event: MouseEvent) => {
      if (Date.now() - lastMouseMove < 100) { // Ignore clicks immediately after mouse move
        return;
      }
      
      this.handleCanvasClick(mousePosition);
    });

    // Hide overlay controls on mouse inactivity
    let hideTimer: NodeJS.Timeout;
    const showControls = () => {
      this._overlayControls.classList.add('visible');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (!this._isFullscreen) return;
        this._overlayControls.classList.remove('visible');
      }, 3000);
    };

    this._element.addEventListener('mousemove', showControls);
    this._element.addEventListener('mouseenter', showControls);
  }

  render(): HTMLElement {
    const container = this._element;
    container.className = 'cosmic-visualization-canvas';
    container.setAttribute('role', 'application');
    container.setAttribute('aria-label', 'Cosmic Audio Visualization');

    this.createCanvasContainer();
    this.createOverlayControls();

    return container;
  }

  private createCanvasContainer(): void {
    this._canvasContainer = document.createElement('div');
    this._canvasContainer.className = 'canvas-container cosmic-container';
    
    // Main visualization canvas
    this._canvas = document.createElement('canvas');
    this._canvas.className = 'visualization-canvas';
    this._canvas.width = this._options.width || 800;
    this._canvas.height = this._options.height || 600;
    
    // Overlay canvas for UI elements
    this._overlayCanvas = document.createElement('canvas');
    this._overlayCanvas.className = 'overlay-canvas';
    this._overlayCanvas.width = this._canvas.width;
    this._overlayCanvas.height = this._canvas.height;
    
    this._canvasContainer.appendChild(this._canvas);
    this._canvasContainer.appendChild(this._overlayCanvas);
    this._element.appendChild(this._canvasContainer);
  }

  private createOverlayControls(): void {
    this._overlayControls = document.createElement('div');
    this._overlayControls.className = 'overlay-controls';
    
    // Top controls
    const topControls = document.createElement('div');
    topControls.className = 'top-controls';
    
    this._presetSelector = document.createElement('select');
    this._presetSelector.className = 'cosmic-dropdown preset-selector';
    this._presetSelector.innerHTML = `
      <option value="cosmic-symphony">Cosmic Symphony</option>
      <option value="stellar-nursery">Stellar Nursery</option>
      <option value="galactic-core">Galactic Core</option>
      <option value="solar-wind">Solar Wind</option>
      <option value="quantum-field">Quantum Field</option>
      <option value="nebula-dance">Nebula Dance</option>
    `;
    this._presetSelector.value = this._currentPreset;
    this._presetSelector.addEventListener('change', this.handlePresetChange.bind(this));
    
    topControls.appendChild(this._presetSelector);
    
    // Bottom controls
    const bottomControls = document.createElement('div');
    bottomControls.className = 'bottom-controls';
    
    this._recordButton = CosmicButton.icon('record', {
      ariaLabel: 'Record visualization',
      onClick: () => this.toggleRecording()
    });
    
    this._settingsButton = CosmicButton.icon('settings', {
      ariaLabel: 'Visualization settings',
      onClick: () => this.openSettings()
    });
    
    this._fullscreenButton = CosmicButton.icon('fullscreen', {
      ariaLabel: 'Enter fullscreen',
      onClick: () => this.toggleFullscreen()
    });
    
    bottomControls.appendChild(this._recordButton.element);
    bottomControls.appendChild(this._settingsButton.element);
    bottomControls.appendChild(this._fullscreenButton.element);
    
    this._overlayControls.appendChild(topControls);
    this._overlayControls.appendChild(bottomControls);
    this._canvasContainer.appendChild(this._overlayControls);
  }

  private initializeThreeJS(): void {
    // Scene
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(this._options.backgroundColor);
    
    // Camera
    this._camera = new THREE.PerspectiveCamera(
      75,
      (this._options.width || 800) / (this._options.height || 600),
      0.1,
      1000
    );
    this._camera.position.z = 5;
    
    // Renderer
    this._renderer = new THREE.WebGLRenderer({
      canvas: this._canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this._renderer.setSize(this._options.width || 800, this._options.height || 600);
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Enable shadow mapping for depth
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  private createCosmicScene(): void {
    this.createParticleSystem();
    this.createNebulaField();
    this.createLighting();
    this.startAnimation();
  }

  private createParticleSystem(): void {
    const particleCount = 10000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Create cosmic particle distribution
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Spherical distribution with cosmic clustering
      const radius = Math.random() * 20 + 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Cosmic color palette
      const colorType = Math.random();
      if (colorType < 0.3) {
        // Aurora Green
        colors[i3] = 0.4;
        colors[i3 + 1] = 1.0;
        colors[i3 + 2] = 0.85;
      } else if (colorType < 0.6) {
        // Stellar Purple
        colors[i3] = 0.49;
        colors[i3 + 1] = 0.3;
        colors[i3 + 2] = 1.0;
      } else {
        // Plasma Pink
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.25;
        colors[i3 + 2] = 0.5;
      }
      
      sizes[i] = Math.random() * 2 + 0.5;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Particle material with cosmic glow
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        pointTexture: { value: this.createParticleTexture() }
      },
      vertexShader: this.getParticleVertexShader(),
      fragmentShader: this.getParticleFragmentShader(),
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
      vertexColors: true
    });
    
    this._particleSystem = new THREE.Points(geometry, material);
    this._scene.add(this._particleSystem);
    
    this._geometryPool.set('particles', geometry);
    this._materialPool.set('particles', material);
  }

  private createNebulaField(): void {
    const geometry = new THREE.PlaneGeometry(50, 50, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        audioFreq: { value: new THREE.DataTexture(this._frequencyData, 512, 1, THREE.RedFormat) },
        resolution: { value: new THREE.Vector2(this._canvas.width, this._canvas.height) }
      },
      vertexShader: this.getNebulaVertexShader(),
      fragmentShader: this.getNebulaFragmentShader(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    
    this._nebulaField = new THREE.Mesh(geometry, material);
    this._nebulaField.position.z = -10;
    this._scene.add(this._nebulaField);
    
    this._geometryPool.set('nebula', geometry);
    this._materialPool.set('nebula', material);
  }

  private createLighting(): void {
    // Ambient cosmic glow
    const ambientLight = new THREE.AmbientLight(0x4488ff, 0.3);
    this._scene.add(ambientLight);
    
    // Stellar point lights
    const stellarColors = [0x64ffda, 0x7c4dff, 0xff4081];
    stellarColors.forEach((color, index) => {
      const light = new THREE.PointLight(color, 1, 100);
      const angle = (index / stellarColors.length) * Math.PI * 2;
      light.position.set(
        Math.cos(angle) * 15,
        Math.sin(angle) * 15,
        Math.random() * 10 - 5
      );
      this._scene.add(light);
    });
  }

  private createParticleTexture(): THREE.Texture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private startAnimation(): void {
    const animate = (time: number) => {
      this._animationFrame = requestAnimationFrame(animate);
      
      this.updateVisualization(time);
      this.renderFrame();
    };
    
    animate(0);
  }

  private updateVisualization(time: number): void {
    const timeSeconds = time * 0.001;
    
    // Update particle system
    const particleMaterial = this._materialPool.get('particles') as THREE.ShaderMaterial;
    if (particleMaterial && particleMaterial.uniforms) {
      if (particleMaterial.uniforms['time']) {
        particleMaterial.uniforms['time'].value = timeSeconds;
      }
      if (particleMaterial.uniforms['audioLevel']) {
        particleMaterial.uniforms['audioLevel'].value = this.getAverageAudioLevel();
      }
    }
    
    // Rotate particle system based on audio
    if (this._particleSystem) {
      this._particleSystem.rotation.y = timeSeconds * 0.1;
      this._particleSystem.rotation.x = Math.sin(timeSeconds * 0.05) * 0.2;
    }
    
    // Update nebula field
    const nebulaMaterial = this._materialPool.get('nebula') as THREE.ShaderMaterial;
    if (nebulaMaterial && nebulaMaterial.uniforms) {
      if (nebulaMaterial.uniforms['time']) {
        nebulaMaterial.uniforms['time'].value = timeSeconds;
      }
      if (nebulaMaterial.uniforms['audioFreq'] && nebulaMaterial.uniforms['audioFreq'].value) {
        nebulaMaterial.uniforms['audioFreq'].value.needsUpdate = true;
      }
    }
    
    // Camera movement based on audio
    this._camera.position.x = Math.sin(timeSeconds * 0.1) * 2;
    this._camera.position.y = Math.cos(timeSeconds * 0.15) * 1;
    this._camera.lookAt(0, 0, 0);
  }

  private renderFrame(): void {
    this._renderer.render(this._scene, this._camera);
  }

  private getAverageAudioLevel(): number {
    if (!this._audioData || this._audioData.length === 0) return 0;
    
    let sum = 0;
    for (let i = 0; i < this._audioData.length; i++) {
      sum += Math.abs(this._audioData[i] || 0);
    }
    return sum / this._audioData.length;
  }

  // Shader code
  private getParticleVertexShader(): string {
    return `
      attribute float size;
      uniform float time;
      uniform float audioLevel;
      varying vec3 vColor;
      
      void main() {
        vColor = color;
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        
        // Audio-reactive size
        float audioSize = size * (1.0 + audioLevel * 2.0);
        
        gl_PointSize = audioSize * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
  }

  private getParticleFragmentShader(): string {
    return `
      uniform sampler2D pointTexture;
      varying vec3 vColor;
      
      void main() {
        gl_FragColor = vec4(vColor, 1.0);
        gl_FragColor = gl_FragColor * texture2D(pointTexture, gl_PointCoord);
        
        if (gl_FragColor.a < 0.001) discard;
      }
    `;
  }

  private getNebulaVertexShader(): string {
    return `
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  private getNebulaFragmentShader(): string {
    return `
      uniform float time;
      uniform sampler2D audioFreq;
      uniform vec2 resolution;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      vec3 cosmicColors(float t) {
        vec3 a = vec3(0.4, 1.0, 0.85); // Aurora Green
        vec3 b = vec3(0.49, 0.3, 1.0); // Stellar Purple
        vec3 c = vec3(1.0, 0.25, 0.5); // Plasma Pink
        
        return mix(mix(a, b, smoothstep(0.0, 0.5, t)), c, smoothstep(0.5, 1.0, t));
      }
      
      void main() {
        vec2 st = vUv;
        
        // Audio frequency sampling
        float freq = texture2D(audioFreq, vec2(st.x, 0.5)).r;
        
        // Flowing nebula effect
        float noise = sin(st.x * 10.0 + time) * cos(st.y * 8.0 + time * 0.5);
        noise += sin(st.x * 20.0 - time * 2.0) * 0.5;
        noise += freq * 2.0;
        
        float intensity = smoothstep(-0.5, 1.5, noise);
        vec3 color = cosmicColors(intensity + time * 0.1);
        
        gl_FragColor = vec4(color, intensity * 0.3);
      }
    `;
  }

  // Event handlers
  private handlePresetChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this._currentPreset = target.value;
    this.applyPreset(this._currentPreset);
    this.emit('presetChange', this._currentPreset);
  }

  private handleCanvasClick(mousePosition: { x: number, y: number }): void {
    // Create energy burst at click position
    this.createEnergyBurst(mousePosition);
    this.emit('canvasClick', mousePosition);
  }

  private updateMouseInteraction(mousePosition: { x: number, y: number }): void {
    // Attract particles to mouse position
    if (this._particleSystem) {
      const positions = (this._particleSystem.geometry as THREE.BufferGeometry).attributes['position'] as THREE.BufferAttribute;
      const mouseVector = new THREE.Vector3(mousePosition.x * 10, mousePosition.y * 10, 0);
      
      // Apply subtle attraction force (implement if needed for performance)
    }
  }

  private createEnergyBurst(position: { x: number, y: number }): void {
    // Create temporary energy effect at position
    const geometry = new THREE.RingGeometry(0.1, 2, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0x64ffda,
      transparent: true,
      opacity: 0.8
    });
    
    const ring = new THREE.Mesh(geometry, material);
    ring.position.set(position.x * 5, position.y * 5, 0);
    this._scene.add(ring);
    
    // Animate expansion and fade
    const startTime = Date.now();
    const animateRing = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / 1000; // 1 second animation
      
      if (progress < 1) {
        ring.scale.setScalar(1 + progress * 3);
        material.opacity = 0.8 * (1 - progress);
        requestAnimationFrame(animateRing);
      } else {
        this._scene.remove(ring);
        geometry.dispose();
        material.dispose();
      }
    };
    
    animateRing();
  }

  // Public API methods
  updateAudioData(audioData: Float32Array, frequencyData: Float32Array): void {
    this._audioData = audioData;
    this._frequencyData = frequencyData;
    
    // Update frequency data texture
    const nebulaMaterial = this._materialPool.get('nebula') as THREE.ShaderMaterial;
    if (nebulaMaterial && nebulaMaterial.uniforms['audioFreq']) {
      nebulaMaterial.uniforms['audioFreq'].value.image.data = frequencyData;
      nebulaMaterial.uniforms['audioFreq'].value.needsUpdate = true;
    }
  }

  applyPreset(presetName: string): void {
    // Apply different visual presets
    switch (presetName) {
      case 'stellar-nursery':
        this.setCosmicColors([0x4488ff, 0x88ccff, 0xccddff]);
        break;
      case 'galactic-core':
        this.setCosmicColors([0xff4488, 0xffaa44, 0xffff88]);
        break;
      case 'solar-wind':
        this.setCosmicColors([0xff6600, 0xff9944, 0xffcc88]);
        break;
      case 'quantum-field':
        this.setCosmicColors([0x8844ff, 0xaa88ff, 0xccaaff]);
        break;
      case 'nebula-dance':
        this.setCosmicColors([0x44ff88, 0x88ffaa, 0xaaffcc]);
        break;
      default: // cosmic-symphony
        this.setCosmicColors([0x64ffda, 0x7c4dff, 0xff4081]);
    }
  }

  private setCosmicColors(colors: number[]): void {
    // Update particle colors
    const geometry = this._geometryPool.get('particles') as THREE.BufferGeometry;
    if (geometry) {
      const colorAttribute = geometry.attributes['color'] as THREE.BufferAttribute;
      const colorArray = colorAttribute.array as Float32Array;
      
      for (let i = 0; i < colorArray.length; i += 3) {
        const color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
        colorArray[i] = color.r;
        colorArray[i + 1] = color.g;
        colorArray[i + 2] = color.b;
      }
      
      colorAttribute.needsUpdate = true;
    }
  }

  toggleFullscreen(): void {
    if (this._isFullscreen) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  private enterFullscreen(): void {
    if (this._element.requestFullscreen) {
      this._element.requestFullscreen();
    }
  }

  private exitFullscreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  private updateFullscreenButton(): void {
    this._fullscreenButton.setIcon(this._isFullscreen ? 'fullscreen-exit' : 'fullscreen');
    this._fullscreenButton.setAccessibility({
      ariaLabel: this._isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
    });
  }

  private handleFullscreenChange(): void {
    if (this._isFullscreen) {
      this._element.classList.add('fullscreen');
      this._overlayControls.classList.add('fullscreen-controls');
    } else {
      this._element.classList.remove('fullscreen');
      this._overlayControls.classList.remove('fullscreen-controls');
    }
    
    // Resize canvas to fill screen
    setTimeout(() => {
      if (this._isFullscreen) {
        this.resize(window.innerWidth, window.innerHeight);
      } else {
        this.resize(this._options.width || 800, this._options.height || 600);
      }
    }, 100);
    
    this.emit('fullscreenChange', this._isFullscreen);
  }

  private toggleRecording(): void {
    this._isRecording = !this._isRecording;
    
    if (this._isRecording) {
      this.startRecording();
    } else {
      this.stopRecording();
    }
  }

  private startRecording(): void {
    this._recordButton.setIcon('stop-record');
    this._recordButton.setAccessibility({ ariaLabel: 'Stop recording' });
    this._recordButton.addClass('recording');
    
    this.emit('recordingStart');
  }

  private stopRecording(): void {
    this._recordButton.setIcon('record');
    this._recordButton.setAccessibility({ ariaLabel: 'Record visualization' });
    this._recordButton.removeClass('recording');
    
    this.emit('recordingStop');
  }

  private openSettings(): void {
    this.emit('settingsOpen');
  }

  resize(width: number, height: number): void {
    this._canvas.width = width;
    this._canvas.height = height;
    this._overlayCanvas.width = width;
    this._overlayCanvas.height = height;
    
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
    
    this._renderer.setSize(width, height);
    
    if (this._options.onResize) {
      this._options.onResize(width, height);
    }
    
    this.emit('resize', width, height);
  }

  setBackgroundColor(color: string): void {
    this._options.backgroundColor = color;
    this._scene.background = new THREE.Color(color);
  }

  // Cleanup
  override destroy(): void {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
    }
    
    // Dispose Three.js resources
    this._geometryPool.forEach(geometry => geometry.dispose());
    this._materialPool.forEach(material => material.dispose());
    this._renderer.dispose();
    
    super.destroy();
  }
}
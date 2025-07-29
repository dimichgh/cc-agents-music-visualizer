/**
 * WebGL Renderer - Main rendering engine using Three.js for visualization
 */

import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Vector3,
  Color,
  Fog,
  Clock,
  RenderTarget,
  WebGLRenderTarget,
  EffectComposer,
  RenderPass,
} from 'three';

import {
  ServiceInterface,
  Logger,
  VisualizationConfig,
  PerformanceMetrics,
  AudioFeatures,
  MusicVisualizerError,
  TextureSize,
  MemoryStats,
} from '@/shared/types';

export interface VisualizationRenderer {
  render(deltaTime: number, audioFeatures: AudioFeatures): void;
  resize(width: number, height: number): void;
  setQuality(level: 'low' | 'medium' | 'high' | 'ultra'): void;
  getPerformanceMetrics(): PerformanceMetrics;
  getMemoryStats(): MemoryStats;
}

export class WebGLVisualizationRenderer implements VisualizationRenderer, ServiceInterface {
  private canvas: HTMLCanvasElement;
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private clock: Clock;
  private composer: EffectComposer | null = null;
  
  private logger: Logger;
  private isInitialized = false;
  private isDisposed = false;

  // Configuration
  private config: VisualizationConfig = {
    particleCount: 5000,
    effectIntensity: 0.5,
    colorScheme: 'cosmic',
    qualityLevel: 'high',
    enablePostProcessing: true,
    enableAntialiasing: true,
    targetFPS: 60,
  };

  // Performance tracking
  private performanceMetrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    renderTime: 0,
    particleCount: 0,
    memoryUsage: 0,
    gpuMemoryUsage: 0,
    drawCalls: 0,
  };

  private frameCount = 0;
  private lastFPSUpdate = 0;
  private frameTimeHistory: number[] = [];
  private renderTimeHistory: number[] = [];

  // Scene objects
  private lights: any[] = [];
  private effects: any[] = [];
  private particleSystems: any[] = [];

  // Resource management
  private textures: Map<string, any> = new Map();
  private geometries: Map<string, any> = new Map();
  private materials: Map<string, any> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.logger = new Logger('WebGLRenderer');
    this.clock = new Clock();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('WebGL renderer already initialized');
      return;
    }

    this.logger.info('Initializing WebGL renderer...');

    try {
      // Initialize Three.js renderer
      await this.initializeRenderer();
      
      // Initialize scene
      this.initializeScene();
      
      // Initialize camera
      this.initializeCamera();
      
      // Initialize lighting
      this.initializeLighting();
      
      // Initialize post-processing
      if (this.config.enablePostProcessing) {
        await this.initializePostProcessing();
      }

      // Set initial size
      this.resize(this.canvas.clientWidth, this.canvas.clientHeight);

      this.isInitialized = true;
      this.logger.info('WebGL renderer initialized successfully');
    } catch (error) {
      throw new MusicVisualizerError(
        'Failed to initialize WebGL renderer',
        'WEBGL_RENDERER_INIT_FAILED',
        'visual',
        'high',
        { error: (error as Error).message }
      );
    }
  }

  private async initializeRenderer(): Promise<void> {
    // Check WebGL support
    if (!this.canvas.getContext('webgl2') && !this.canvas.getContext('webgl')) {
      throw new Error('WebGL not supported');
    }

    // Create renderer with optimal settings
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      context: this.canvas.getContext('webgl2') || undefined,
      antialias: this.config.enableAntialiasing,
      alpha: false,
      depth: true,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
    });

    // Configure renderer
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = 'srgb';
    this.renderer.toneMapping = 2; // ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = false; // Disable shadows for performance
    this.renderer.autoClear = true;
    this.renderer.sortObjects = true;

    // Set clear color to deep space black
    this.renderer.setClearColor(new Color(0x000005), 1);

    // Enable extensions for better performance
    const gl = this.renderer.getContext();
    const extensions = [
      'EXT_color_buffer_float',
      'EXT_float_blend',
      'OES_texture_float_linear',
      'WEBGL_depth_texture',
      'EXT_disjoint_timer_query_webgl2',
    ];

    extensions.forEach(ext => {
      const extension = gl.getExtension(ext);
      if (extension) {
        this.logger.debug(`WebGL extension enabled: ${ext}`);
      }
    });

    this.logger.info(`WebGL renderer created: ${gl.VERSION} (${gl.VENDOR})`);
  }

  private initializeScene(): void {
    this.scene = new Scene();
    
    // Add cosmic atmosphere with fog
    this.scene.fog = new Fog(0x000010, 100, 2000);
    
    // Set background to deep space
    this.scene.background = new Color(0x000008);

    this.logger.debug('Scene initialized');
  }

  private initializeCamera(): void {
    this.camera = new PerspectiveCamera(
      75, // fov
      this.canvas.clientWidth / this.canvas.clientHeight, // aspect
      0.1, // near
      10000 // far
    );

    // Position camera for optimal viewing
    this.camera.position.set(0, 0, 500);
    this.camera.lookAt(0, 0, 0);

    this.logger.debug('Camera initialized');
  }

  private initializeLighting(): void {
    // Minimal lighting for cosmic atmosphere
    // Most effects will be self-illuminated particles and shaders
    
    // Ambient light for subtle illumination
    const ambientLight = new (require('three').AmbientLight)(0x404040, 0.2);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);

    this.logger.debug('Lighting initialized');
  }

  private async initializePostProcessing(): Promise<void> {
    try {
      // Import post-processing effects dynamically
      const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
      const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js');
      const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js');
      const { FilmPass } = await import('three/examples/jsm/postprocessing/FilmPass.js');

      // Create composer
      this.composer = new EffectComposer(this.renderer);

      // Add render pass
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      // Add bloom effect for cosmic glow
      const bloomPass = new UnrealBloomPass(
        new Vector3(this.canvas.clientWidth, this.canvas.clientHeight),
        0.5, // strength
        0.4, // radius
        0.85 // threshold
      );
      this.composer.addPass(bloomPass);

      // Add film grain for ethereal feel
      const filmPass = new FilmPass(0.35, 0.025, 648, false);
      this.composer.addPass(filmPass);

      this.logger.debug('Post-processing initialized');
    } catch (error) {
      this.logger.warn('Failed to initialize post-processing, falling back to basic rendering', error as Error);
      this.composer = null;
      this.config.enablePostProcessing = false;
    }
  }

  /**
   * Main render loop
   */
  render(deltaTime: number, audioFeatures: AudioFeatures): void {
    if (!this.isInitialized) {
      this.logger.warn('Attempted to render before initialization');
      return;
    }

    const renderStart = performance.now();

    try {
      // Update camera for gentle cosmic drift
      this.updateCamera(deltaTime, audioFeatures);

      // Update fog based on audio intensity
      this.updateFog(audioFeatures);

      // Update all effects and particle systems
      this.updateEffects(deltaTime, audioFeatures);

      // Render the scene
      if (this.composer && this.config.enablePostProcessing) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }

      // Update performance metrics
      const renderTime = performance.now() - renderStart;
      this.updatePerformanceMetrics(deltaTime, renderTime);

    } catch (error) {
      this.logger.error('Render error', error as Error);
    }
  }

  private updateCamera(deltaTime: number, audioFeatures: AudioFeatures): void {
    // Gentle camera movement based on audio
    const time = this.clock.getElapsedTime();
    const bassLevel = this.getBassLevel(audioFeatures);
    const midLevel = this.getMidLevel(audioFeatures);

    // Subtle rotation based on audio
    this.camera.position.x = Math.sin(time * 0.1 + bassLevel * 0.5) * 50;
    this.camera.position.y = Math.cos(time * 0.15 + midLevel * 0.3) * 30;
    
    // Distance variation based on audio intensity
    const baseDistance = 500;
    const audioIntensity = this.getOverallIntensity(audioFeatures);
    this.camera.position.z = baseDistance + Math.sin(time * 0.2) * 100 * (1 + audioIntensity);

    this.camera.lookAt(0, 0, 0);
  }

  private updateFog(audioFeatures: AudioFeatures): void {
    if (!this.scene.fog) return;

    const audioIntensity = this.getOverallIntensity(audioFeatures);
    const fog = this.scene.fog as Fog;

    // Adjust fog density based on audio
    fog.near = 100 - (audioIntensity * 50);
    fog.far = 2000 + (audioIntensity * 1000);

    // Subtle color shift based on dominant frequencies
    const bassLevel = this.getBassLevel(audioFeatures);
    const trebleLevel = this.getTrebleLevel(audioFeatures);
    
    const r = Math.floor(bassLevel * 32);
    const g = Math.floor(trebleLevel * 16);
    const b = Math.floor((bassLevel + trebleLevel) * 24);
    
    fog.color.setRGB(r / 255, g / 255, (b + 16) / 255);
  }

  private updateEffects(deltaTime: number, audioFeatures: AudioFeatures): void {
    // Update all registered effects
    this.effects.forEach(effect => {
      if (effect.update) {
        effect.update(deltaTime, audioFeatures);
      }
    });

    // Update particle systems
    this.particleSystems.forEach(system => {
      if (system.update) {
        system.update(deltaTime, audioFeatures);
      }
    });
  }

  private updatePerformanceMetrics(deltaTime: number, renderTime: number): void {
    this.frameCount++;
    
    // Track frame and render times
    this.frameTimeHistory.push(deltaTime * 1000); // Convert to ms
    this.renderTimeHistory.push(renderTime);
    
    // Keep only recent history
    const historySize = 60; // 1 second at 60fps
    if (this.frameTimeHistory.length > historySize) {
      this.frameTimeHistory.shift();
      this.renderTimeHistory.shift();
    }

    // Update FPS every second
    const now = performance.now();
    if (now - this.lastFPSUpdate >= 1000) {
      this.performanceMetrics.fps = Math.round(this.frameCount * 1000 / (now - this.lastFPSUpdate));
      this.frameCount = 0;
      this.lastFPSUpdate = now;

      // Calculate average frame and render times
      this.performanceMetrics.frameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
      this.performanceMetrics.renderTime = this.renderTimeHistory.reduce((a, b) => a + b, 0) / this.renderTimeHistory.length;

      // Update other metrics
      this.performanceMetrics.particleCount = this.getTotalParticleCount();
      this.performanceMetrics.drawCalls = this.renderer.info.render.calls;
      this.performanceMetrics.memoryUsage = this.getMemoryUsage();
    }
  }

  /**
   * Resize renderer and camera
   */
  resize(width: number, height: number): void {
    if (!this.isInitialized) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);

    if (this.composer) {
      this.composer.setSize(width, height);
    }

    this.logger.debug(`Renderer resized to ${width}x${height}`);
  }

  /**
   * Set rendering quality level
   */
  setQuality(level: 'low' | 'medium' | 'high' | 'ultra'): void {
    const oldLevel = this.config.qualityLevel;
    this.config.qualityLevel = level;

    // Adjust settings based on quality level
    switch (level) {
      case 'low':
        this.config.particleCount = 1000;
        this.renderer.setPixelRatio(0.5);
        this.config.enablePostProcessing = false;
        break;
      
      case 'medium':
        this.config.particleCount = 2500;
        this.renderer.setPixelRatio(1);
        this.config.enablePostProcessing = false;
        break;
      
      case 'high':
        this.config.particleCount = 5000;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.config.enablePostProcessing = true;
        break;
      
      case 'ultra':
        this.config.particleCount = 10000;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.config.enablePostProcessing = true;
        break;
    }

    // Reinitialize post-processing if needed
    if (this.config.enablePostProcessing && !this.composer) {
      this.initializePostProcessing();
    }

    this.logger.info(`Quality level changed from ${oldLevel} to ${level}`);
  }

  /**
   * Add effect to the scene
   */
  addEffect(effect: any): void {
    this.effects.push(effect);
    if (effect.object3D) {
      this.scene.add(effect.object3D);
    }
  }

  /**
   * Remove effect from the scene
   */
  removeEffect(effect: any): void {
    const index = this.effects.indexOf(effect);
    if (index !== -1) {
      this.effects.splice(index, 1);
      if (effect.object3D) {
        this.scene.remove(effect.object3D);
      }
      if (effect.dispose) {
        effect.dispose();
      }
    }
  }

  /**
   * Add particle system to the scene
   */
  addParticleSystem(system: any): void {
    this.particleSystems.push(system);
    if (system.object3D) {
      this.scene.add(system.object3D);
    }
  }

  /**
   * Remove particle system from the scene
   */
  removeParticleSystem(system: any): void {
    const index = this.particleSystems.indexOf(system);
    if (index !== -1) {
      this.particleSystems.splice(index, 1);
      if (system.object3D) {
        this.scene.remove(system.object3D);
      }
      if (system.dispose) {
        system.dispose();
      }
    }
  }

  // Utility methods for audio analysis
  private getBassLevel(audioFeatures: AudioFeatures): number {
    if (!audioFeatures?.frequencyData?.frequencies) return 0;
    const bassRange = audioFeatures.frequencyData.frequencies.slice(0, 32);
    return bassRange.reduce((sum, val) => sum + val, 0) / bassRange.length;
  }

  private getMidLevel(audioFeatures: AudioFeatures): number {
    if (!audioFeatures?.frequencyData?.frequencies) return 0;
    const midRange = audioFeatures.frequencyData.frequencies.slice(32, 256);
    return midRange.reduce((sum, val) => sum + val, 0) / midRange.length;
  }

  private getTrebleLevel(audioFeatures: AudioFeatures): number {
    if (!audioFeatures?.frequencyData?.frequencies) return 0;
    const trebleRange = audioFeatures.frequencyData.frequencies.slice(256);
    return trebleRange.reduce((sum, val) => sum + val, 0) / trebleRange.length;
  }

  private getOverallIntensity(audioFeatures: AudioFeatures): number {
    if (!audioFeatures?.frequencyData?.frequencies) return 0;
    const frequencies = audioFeatures.frequencyData.frequencies;
    return frequencies.reduce((sum, val) => sum + val, 0) / frequencies.length;
  }

  private getTotalParticleCount(): number {
    return this.particleSystems.reduce((total, system) => {
      return total + (system.getParticleCount ? system.getParticleCount() : 0);
    }, 0);
  }

  private getMemoryUsage(): number {
    const info = this.renderer.info;
    return info.memory.geometries + info.memory.textures;
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  public getMemoryStats(): MemoryStats {
    const info = this.renderer.info;
    return {
      used: this.getMemoryUsage(),
      allocated: info.memory.geometries + info.memory.textures,
      limit: 512 * 1024 * 1024, // 512MB estimate
      textures: info.memory.textures,
      geometries: info.memory.geometries,
      materials: Object.keys(this.materials).length,
    };
  }

  public getScene(): Scene {
    return this.scene;
  }

  public getCamera(): PerspectiveCamera {
    return this.camera;
  }

  public getRenderer(): WebGLRenderer {
    return this.renderer;
  }

  public isInitialized(): boolean {
    return this.isInitialized;
  }

  public isDisposed(): boolean {
    return this.isDisposed;
  }

  public dispose(): void {
    if (this.isDisposed) return;

    this.logger.info('Disposing WebGL renderer...');

    // Dispose all effects
    this.effects.forEach(effect => {
      if (effect.dispose) effect.dispose();
    });
    this.effects = [];

    // Dispose all particle systems
    this.particleSystems.forEach(system => {
      if (system.dispose) system.dispose();
    });
    this.particleSystems = [];

    // Dispose resources
    this.textures.forEach(texture => texture.dispose());
    this.geometries.forEach(geometry => geometry.dispose());
    this.materials.forEach(material => material.dispose());

    // Dispose composer
    if (this.composer) {
      this.composer.dispose();
    }

    // Dispose renderer
    this.renderer.dispose();

    this.isDisposed = true;
    this.logger.info('WebGL renderer disposed');
  }
}
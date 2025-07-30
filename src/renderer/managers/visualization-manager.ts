/**
 * Visualization Manager - Orchestrates visual effects and rendering
 */

import { 
  ServiceInterface, 
  AudioFeatures,
  StateManager,
  MusicVisualizerError 
} from '@/shared/types';
import { Logger, AppLogger } from '@/shared/utils/logger';
import { WebGLVisualizationRenderer } from '../engine/webgl-renderer';

export class VisualizationManager implements ServiceInterface {
  private renderer: WebGLVisualizationRenderer;
  private stateManager: StateManager;
  private logger: Logger;

  private _isInitialized = false;
  private _isDisposed = false;

  // Effects and systems
  private effects: any[] = [];
  private particleSystems: any[] = [];
  
  // Visualization settings
  private _intensity: number = 1.0;

  constructor(
    renderer: WebGLVisualizationRenderer,
    stateManager: StateManager
  ) {
    this.renderer = renderer;
    this.stateManager = stateManager;
    this.logger = new AppLogger('VisualizationManager');
  }

  async initialize(): Promise<void> {
    if (this._isInitialized) {
      this.logger.warn('VisualizationManager already initialized');
      return;
    }

    this.logger.info('Initializing VisualizationManager...');

    try {
      // Initialize basic visualization effects
      await this.initializeEffects();

      // Subscribe to state changes for intensity updates
      this.subscribeToStateChanges();

      this._isInitialized = true;
      this.logger.info('VisualizationManager initialized successfully');
    } catch (error) {
      throw new MusicVisualizerError(
        'Failed to initialize visualization manager',
        'VISUALIZATION_MANAGER_INIT_FAILED',
        'visual',
        'high',
        { error: (error as Error).message }
      );
    }
  }

  private async initializeEffects(): Promise<void> {
    this.logger.info('Creating cosmic visualization effects...');
    
    // Create cosmic particle effect
    await this.createCosmicParticleEffect();
    
    // Create audio-reactive background
    await this.createAudioReactiveBackground();
    
    // Create fallback ambient animation (always visible)
    await this.createAmbientEffect();
    
    this.logger.info(`Initialized ${this.effects.length} effects`);
  }

  private async createCosmicParticleEffect(): Promise<void> {
    try {
      // Import Three.js components directly here
      const THREE = await import('three');
      
      // Create particle geometry
      const particleCount = 2000;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);

      // Initialize particles in a cosmic distribution
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Spherical distribution for cosmic feel
        const radius = Math.random() * 800 + 200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);
        
        // Cosmic colors - blues, purples, whites
        const colorIntensity = Math.random() * 0.8 + 0.2;
        colors[i3] = colorIntensity * (0.1 + Math.random() * 0.3); // Red
        colors[i3 + 1] = colorIntensity * (0.3 + Math.random() * 0.7); // Green  
        colors[i3 + 2] = colorIntensity * (0.8 + Math.random() * 0.2); // Blue
        
        sizes[i] = Math.random() * 3 + 1;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      // Create shader material for cosmic particles
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          audioLevel: { value: 0.0 },
          intensity: { value: this._intensity },
        },
        vertexShader: `
          attribute float size;
          uniform float time;
          uniform float audioLevel;
          uniform float intensity;
          
          varying vec3 vColor;
          
          void main() {
            vColor = color;
            
            vec3 pos = position;
            
            // Add gentle movement based on audio
            pos.x += sin(time * 0.5 + position.y * 0.01) * audioLevel * 20.0;
            pos.y += cos(time * 0.3 + position.z * 0.01) * audioLevel * 15.0;
            pos.z += sin(time * 0.4 + position.x * 0.01) * audioLevel * 10.0;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            // Make particles larger when audio is active
            gl_PointSize = size * intensity * (1.0 + audioLevel * 2.0) * (300.0 / -mvPosition.z);
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          
          void main() {
            // Create circular particles with soft edges
            vec2 center = gl_PointCoord - 0.5;
            float dist = length(center);
            
            if (dist > 0.5) discard;
            
            float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
            alpha *= 0.8; // Overall opacity
            
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        blending: THREE.AdditiveBlending,
        transparent: true,
        vertexColors: true,
      });

      const particles = new THREE.Points(geometry, material);
      
      const cosmicParticles = {
        name: 'Cosmic Particles',
        object3D: particles,
        material: material,
        update: (deltaTime: number, audioFeatures: AudioFeatures) => {
          material.uniforms.time.value += deltaTime;
          
          if (audioFeatures && audioFeatures.frequencyData) {
            // Calculate audio level from frequency data
            const frequencies = audioFeatures.frequencyData.frequencies;
            let audioLevel = 0;
            for (let i = 0; i < frequencies.length; i++) {
              audioLevel += frequencies[i];
            }
            audioLevel = audioLevel / frequencies.length / 255; // Normalize
            
            material.uniforms.audioLevel.value = audioLevel;
            material.uniforms.intensity.value = this._intensity * (0.5 + audioLevel * 1.5);
          }
        },
        dispose: () => {
          geometry.dispose();
          material.dispose();
        },
      };

      this.effects.push(cosmicParticles);
      this.renderer.addEffect(cosmicParticles);
      
      this.logger.info('Cosmic particle effect created with enhanced visibility');
    } catch (error) {
      this.logger.error('Failed to create cosmic particle effect', error as Error);
    }
  }

  private async createAudioReactiveBackground(): Promise<void> {
    try {
      const THREE = await import('three');
      
      // Create a background plane with audio-reactive shader
      const geometry = new THREE.PlaneGeometry(4000, 4000);
      
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          audioLevel: { value: 0.0 },
          bassLevel: { value: 0.0 },
          resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        },
        vertexShader: `
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform float audioLevel;
          uniform float bassLevel;
          uniform vec2 resolution;
          
          varying vec2 vUv;
          
          void main() {
            vec2 uv = vUv;
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(uv, center);
            
            // Create cosmic nebula effect
            float nebula = sin(dist * 8.0 - time * 0.5) * 0.5 + 0.5;
            nebula *= sin(uv.x * 12.0 + time * 0.3) * 0.3 + 0.7;
            nebula *= sin(uv.y * 10.0 + time * 0.4) * 0.3 + 0.7;
            
            // Audio-reactive colors
            vec3 color1 = vec3(0.1, 0.2, 0.8) * (1.0 + audioLevel * 2.0);
            vec3 color2 = vec3(0.8, 0.1, 0.6) * (1.0 + bassLevel * 3.0);
            vec3 color3 = vec3(0.0, 0.9, 0.9) * (1.0 + audioLevel * 1.5);
            
            vec3 finalColor = mix(color1, color2, nebula);
            finalColor = mix(finalColor, color3, sin(time + dist * 5.0) * 0.3 + 0.3);
            
            // Fade edges
            float edge = smoothstep(0.8, 1.0, dist);
            finalColor *= (1.0 - edge);
            
            // Overall intensity based on audio
            finalColor *= 0.1 + audioLevel * 0.4;
            
            gl_FragColor = vec4(finalColor, 0.3);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });

      const backgroundPlane = new THREE.Mesh(geometry, material);
      backgroundPlane.position.z = -1000;
      
      const audioBackground = {
        name: 'Audio Reactive Background',
        object3D: backgroundPlane,
        material: material,
        update: (deltaTime: number, audioFeatures: AudioFeatures) => {
          material.uniforms.time.value += deltaTime;
          
          if (audioFeatures && audioFeatures.frequencyData) {
            const frequencies = audioFeatures.frequencyData.frequencies;
            
            // Calculate overall audio level
            let audioLevel = 0;
            for (let i = 0; i < frequencies.length; i++) {
              audioLevel += frequencies[i];
            }
            audioLevel = audioLevel / frequencies.length / 255;
            
            // Calculate bass level (low frequencies)
            let bassLevel = 0;
            const bassRange = Math.min(frequencies.length / 4, 32);
            for (let i = 0; i < bassRange; i++) {
              bassLevel += frequencies[i];
            }
            bassLevel = bassLevel / bassRange / 255;
            
            material.uniforms.audioLevel.value = audioLevel;
            material.uniforms.bassLevel.value = bassLevel;
          }
        },
        dispose: () => {
          geometry.dispose();
          material.dispose();
        },
      };

      this.effects.push(audioBackground);
      this.renderer.addEffect(audioBackground);
      
      this.logger.info('Audio-reactive background created');
    } catch (error) {
      this.logger.error('Failed to create audio-reactive background', error as Error);
    }
  }

  private async createAmbientEffect(): Promise<void> {
    try {
      const THREE = await import('three');
      
      // Create always-visible ambient particles
      const particleCount = 500;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);

      // Initialize ambient particles
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Distribute in a sphere around the viewer
        const radius = Math.random() * 300 + 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);
        
        // Bright cosmic colors for visibility
        const colorType = Math.random();
        if (colorType < 0.4) {
          // Bright blue
          colors[i3] = 0.2;
          colors[i3 + 1] = 0.5;
          colors[i3 + 2] = 1.0;
        } else if (colorType < 0.7) {
          // Bright cyan
          colors[i3] = 0.0;
          colors[i3 + 1] = 0.8;
          colors[i3 + 2] = 1.0;
        } else {
          // Bright purple
          colors[i3] = 0.8;
          colors[i3 + 1] = 0.2;
          colors[i3 + 2] = 1.0;
        }
        
        sizes[i] = Math.random() * 4 + 2; // Larger for better visibility
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
        },
        vertexShader: `
          attribute float size;
          uniform float time;
          
          varying vec3 vColor;
          
          void main() {
            vColor = color;
            
            vec3 pos = position;
            
            // Gentle ambient movement always active
            pos.x += sin(time * 0.3 + position.y * 0.005) * 15.0;
            pos.y += cos(time * 0.4 + position.z * 0.005) * 10.0;
            pos.z += sin(time * 0.2 + position.x * 0.005) * 8.0;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            // Pulsing size
            float pulse = sin(time * 2.0 + position.x * 0.01) * 0.3 + 1.0;
            gl_PointSize = size * pulse * (400.0 / -mvPosition.z);
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          
          void main() {
            vec2 center = gl_PointCoord - 0.5;
            float dist = length(center);
            
            if (dist > 0.5) discard;
            
            float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
            alpha *= 0.9; // High opacity for visibility
            
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        blending: THREE.AdditiveBlending,
        transparent: true,
        vertexColors: true,
      });

      const ambientParticles = new THREE.Points(geometry, material);
      
      const ambientEffect = {
        name: 'Ambient Particles',
        object3D: ambientParticles,
        material: material,
        update: (deltaTime: number, audioFeatures: AudioFeatures) => {
          // Always update, regardless of audio
          material.uniforms.time.value += deltaTime;
        },
        dispose: () => {
          geometry.dispose();
          material.dispose();
        },
      };

      this.effects.push(ambientEffect);
      this.renderer.addEffect(ambientEffect);
      
      this.logger.info('Ambient effect created - always visible');
    } catch (error) {
      this.logger.error('Failed to create ambient effect', error as Error);
    }
  }

  update(deltaTime: number, audioFeatures: AudioFeatures | null): void {
    if (!this.isInitialized) return;

    try {
      // Debug logging for audio features
      if (audioFeatures) {
        const hasFrequencyData = audioFeatures.frequencyData && audioFeatures.frequencyData.frequencies.length > 0;
        if (hasFrequencyData) {
          const avgFreq = audioFeatures.frequencyData.frequencies.reduce((a, b) => a + b, 0) / audioFeatures.frequencyData.frequencies.length;
          if (avgFreq > 1) { // Only log when there's actual audio signal
            this.logger.debug(`Audio features received - Avg frequency: ${avgFreq.toFixed(2)}, Effects count: ${this.effects.length}`);
          }
        }
      } else {
        // Log when no audio features are provided
        if (Math.random() < 0.01) { // Log 1% of the time to avoid spam
          this.logger.debug('No audio features provided to visualization update');
        }
      }

      // Update all effects
      this.effects.forEach((effect, index) => {
        if (effect.update) {
          // Some effects (like ambient) work without audio features
          if (effect.name === 'Ambient Particles' || audioFeatures) {
            effect.update(deltaTime, audioFeatures);
          }
        }
      });

      // Update particle systems
      this.particleSystems.forEach(system => {
        if (system.update && audioFeatures) {
          system.update(deltaTime, audioFeatures);
        }
      });

    } catch (error) {
      this.logger.error('Error updating visualizations', error as Error);
    }
  }

  addEffect(effect: any): void {
    this.effects.push(effect);
    this.renderer.addEffect(effect);
    this.logger.debug(`Effect added: ${effect.name || 'Unknown'}`);
  }

  removeEffect(effect: any): void {
    const index = this.effects.indexOf(effect);
    if (index !== -1) {
      this.effects.splice(index, 1);
      this.renderer.removeEffect(effect);
      this.logger.debug(`Effect removed: ${effect.name || 'Unknown'}`);
    }
  }

  addParticleSystem(system: any): void {
    this.particleSystems.push(system);
    this.renderer.addParticleSystem(system);
    this.logger.debug(`Particle system added: ${system.name || 'Unknown'}`);
  }

  removeParticleSystem(system: any): void {
    const index = this.particleSystems.indexOf(system);
    if (index !== -1) {
      this.particleSystems.splice(index, 1);
      this.renderer.removeParticleSystem(system);
      this.logger.debug(`Particle system removed: ${system.name || 'Unknown'}`);
    }
  }

  setQuality(level: 'low' | 'medium' | 'high' | 'ultra'): void {
    this.renderer.setQuality(level);
    this.logger.info(`Quality level set to: ${level}`);
  }

  setIntensity(intensity: number): void {
    this._intensity = Math.max(0.1, Math.min(2.0, intensity));
    this.logger.debug(`Visualization intensity set to: ${this._intensity}`);
    
    // Update all effects with new intensity
    this.effects.forEach(effect => {
      if (effect.material && effect.material.uniforms && effect.material.uniforms.intensity) {
        effect.material.uniforms.intensity.value = this._intensity;
      }
    });
  }

  getIntensity(): number {
    return this._intensity;
  }

  private subscribeToStateChanges(): void {
    this.stateManager.subscribe((state) => {
      // Handle intensity changes from UI
      if (state.visual && typeof state.visual.intensity === 'number') {
        if (state.visual.intensity !== this._intensity) {
          this.setIntensity(state.visual.intensity);
        }
      }
    });
  }

  public isInitialized(): boolean {
    return this._isInitialized;
  }

  public isDisposed(): boolean {
    return this._isDisposed;
  }

  public dispose(): void {
    if (this._isDisposed) return;

    this.logger.info('Disposing VisualizationManager...');

    // Dispose all effects
    this.effects.forEach(effect => {
      if (effect.dispose) {
        effect.dispose();
      }
    });
    this.effects = [];

    // Dispose all particle systems
    this.particleSystems.forEach(system => {
      if (system.dispose) {
        system.dispose();
      }
    });
    this.particleSystems = [];

    this._isDisposed = true;
    this.logger.info('VisualizationManager disposed');
  }
}
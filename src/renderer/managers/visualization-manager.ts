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
    // Initialize basic cosmic background effect
    const cosmicBackground = {
      name: 'Cosmic Background',
      update: (deltaTime: number, audioFeatures: AudioFeatures) => {
        // Basic background animation - will be enhanced later
      },
      render: () => {
        // Rendering handled by main renderer for now
      },
      dispose: () => {
        // Cleanup
      },
    };

    this.effects.push(cosmicBackground);
    this.logger.debug('Basic effects initialized');
  }

  update(deltaTime: number, audioFeatures: AudioFeatures | null): void {
    if (!this.isInitialized) return;

    try {
      // Update all effects
      this.effects.forEach(effect => {
        if (effect.update && audioFeatures) {
          effect.update(deltaTime, audioFeatures);
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
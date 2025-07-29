/**
 * Visual rendering and effects type definitions
 */

import { Vector3, Color } from 'three';
import { AudioFeatures } from './audio';

export interface VisualState {
  currentVisualization: VisualizationType;
  effects: EffectState[];
  particles: ParticleState[];
  colors: ColorPalette;
  intensity: number;
  performance: PerformanceMetrics;
}

export type VisualizationType = 
  | 'cosmic'
  | 'ethereal'
  | 'psychedelic'
  | 'minimal'
  | 'custom';

export interface EffectState {
  id: string;
  type: EffectType;
  enabled: boolean;
  intensity: number;
  parameters: Record<string, number>;
}

export type EffectType =
  | 'particles'
  | 'waves'
  | 'fractals'
  | 'kaleidoscope'
  | 'distortion'
  | 'starfield'
  | 'nebula'
  | 'galaxy'
  | 'planetary';

export interface ParticleState {
  id: string;
  position: Vector3;
  velocity: Vector3;
  acceleration: Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: Color;
  opacity: number;
  type: ParticleType;
}

export type ParticleType =
  | 'point'
  | 'spark'
  | 'trail'
  | 'glow'
  | 'energy'
  | 'cosmic_dust'
  | 'star'
  | 'plasma';

export interface ColorPalette {
  primary: Color[];
  secondary: Color[];
  accent: Color[];
  background: Color;
  current: Color[];
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  renderTime: number;
  particleCount: number;
  memoryUsage: number;
  gpuMemoryUsage: number;
  drawCalls: number;
}

export interface ForceField {
  type: 'gravity' | 'magnetic' | 'wind' | 'turbulence' | 'attractor';
  position: Vector3;
  strength: number;
  radius: number;
  falloff: number;
}

export interface Effect {
  id: string;
  name: string;
  type: EffectType;
  update: (deltaTime: number, audioFeatures: AudioFeatures) => void;
  render: (renderer: any) => void;
  dispose: () => void;
}

export interface ShaderUniforms {
  time: number;
  resolution: { x: number; y: number };
  audioData: Float32Array;
  frequencyData: Float32Array;
  beatIntensity: number;
  bassLevel: number;
  midLevel: number;
  trebleLevel: number;
  tempo: number;
  colors: Color[];
}

export interface Particle {
  position: Vector3;
  velocity: Vector3;
  acceleration: Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: Color;
  opacity: number;
  type: ParticleType;
  userData?: Record<string, any>;
}

export interface VisualEvent {
  type: 'beat' | 'instrument' | 'transition' | 'climax';
  timestamp: number;
  duration: number;
  intensity: number;
  data: Record<string, any>;
}

export interface TextureSize {
  width: number;
  height: number;
}

export interface MemoryStats {
  used: number;
  allocated: number;
  limit: number;
  textures: number;
  geometries: number;
  materials: number;
}

export interface VisualizationConfig {
  particleCount: number;
  effectIntensity: number;
  colorScheme: string;
  qualityLevel: 'low' | 'medium' | 'high' | 'ultra';
  enablePostProcessing: boolean;
  enableAntialiasing: boolean;
  targetFPS: number;
}

export type ShaderType = 'vertex' | 'fragment';

export interface UniformData {
  [key: string]: number | number[] | Float32Array | Color | Vector3;
}
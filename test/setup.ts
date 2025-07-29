/**
 * Test setup and configuration
 */

import { expect } from 'chai';
import * as sinon from 'sinon';

// Global test setup
before(() => {
  console.log('Setting up test environment...');
});

after(() => {
  console.log('Cleaning up test environment...');
});

beforeEach(() => {
  // Reset all stubs before each test
  sinon.restore();
});

afterEach(() => {
  // Clean up after each test
  sinon.restore();
});

// Configure test environment
(global as any).expect = expect;
(global as any).sinon = sinon;

// Mock browser APIs for Node.js test environment
global.performance = {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
  getEntriesByType: () => [],
  getEntriesByName: () => [],
  clearMarks: () => {},
  clearMeasures: () => {},
} as any;

(global as any).requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(() => callback(Date.now()), 16) as any;
};

(global as any).cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock WebGL context for testing
(global as any).WebGLRenderingContext = class MockWebGLContext {
  canvas: any = { width: 800, height: 600, getContext: () => this };
  drawingBufferWidth = 800;
  drawingBufferHeight = 600;
  
  // Mock all WebGL methods
  clearColor() {}
  clear() {}
  enable() {}
  disable() {}
  createShader() { return {}; }
  createProgram() { return {}; }
  createBuffer() { return {}; }
  createTexture() { return {}; }
  bindBuffer() {}
  bindTexture() {}
  bufferData() {}
  texImage2D() {}
  useProgram() {}
  getAttribLocation() { return 0; }
  getUniformLocation() { return {}; }
  enableVertexAttribArray() {}
  vertexAttribPointer() {}
  uniform1f() {}
  uniform2f() {}
  uniform3f() {}
  uniform4f() {}
  uniformMatrix4fv() {}
  drawArrays() {}
  drawElements() {}
  viewport() {}
  getParameter() { return ''; }
  getExtension() { return null; }
} as any;

// Mock AudioContext for testing
(global as any).AudioContext = class MockAudioContext {
  state = 'running';
  sampleRate = 44100;
  currentTime = 0;
  destination = { connect: () => {} };
  baseLatency = 0.02;
  outputLatency = 0.01;

  createOscillator() {
    return {
      connect: () => {},
      start: () => {},
      stop: () => {},
      frequency: { setValueAtTime: () => {} },
    };
  }

  createGain() {
    return {
      connect: () => {},
      disconnect: () => {},
      gain: { setValueAtTime: () => {} },
    };
  }

  createAnalyser() {
    return {
      connect: () => {},
      disconnect: () => {},
      fftSize: 2048,
      frequencyBinCount: 1024,
      smoothingTimeConstant: 0.8,
      minDecibels: -100,
      maxDecibels: -30,
      getFloatFrequencyData: (array: Float32Array) => {
        // Fill with mock data
        for (let i = 0; i < array.length; i++) {
          array[i] = -60 + Math.random() * 30; // Random values between -90 and -30 dB
        }
      },
      getByteFrequencyData: (array: Uint8Array) => {
        // Fill with mock data
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      },
    };
  }

  createBufferSource() {
    return {
      connect: () => {},
      start: () => {},
      stop: () => {},
      buffer: null,
      onended: null,
    };
  }

  decodeAudioData() {
    return Promise.resolve({
      duration: 10,
      sampleRate: 44100,
      numberOfChannels: 2,
      getChannelData: () => new Float32Array(441000),
    });
  }

  resume() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }

  addEventListener() {}
  removeEventListener() {}
} as any;

(global as any).OfflineAudioContext = class MockOfflineAudioContext extends (global as any).AudioContext {
  constructor(public numberOfChannels: number, public length: number, public sampleRate: number) {
    super();
  }

  startRendering() {
    return Promise.resolve({
      duration: this.length / this.sampleRate,
      sampleRate: this.sampleRate,
      numberOfChannels: this.numberOfChannels,
      getChannelData: () => new Float32Array(this.length),
    });
  }
} as any;

// Mock File API
(global as any).File = class MockFile {
  constructor(public name: string, public size: number) {}
} as any;

(global as any).FileReader = class MockFileReader {
  result: any = null;
  onload: any = null;
  onerror: any = null;

  readAsArrayBuffer(file: any) {
    setTimeout(() => {
      this.result = new ArrayBuffer(file.size || 1024);
      if (this.onload) this.onload({ target: this });
    }, 10);
  }
} as any;

console.log('Test environment setup complete');

export { expect, sinon };
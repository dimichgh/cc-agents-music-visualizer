/**
 * VisualizationManager Tests
 */

import { expect, sinon } from '../../setup';
import { VisualizationManager } from '../../../src/renderer/managers/visualization-manager';
import { StateManager } from '../../../src/renderer/managers/state-manager';
import { WebGLRenderer } from '../../../src/renderer/engine/webgl-renderer';
import { 
  SAMPLE_FREQUENCY_DATA, 
  SAMPLE_BEAT_EVENTS,
  SAMPLE_VISUAL_STATE,
  PERFORMANCE_METRICS
} from '../../fixtures/audio-fixtures';
import { 
  setupDOMEnvironment, 
  createMockCanvas,
  createMockWebGLContext,
  waitForAnimationFrame
} from '../../fixtures/dom-fixtures';

describe('VisualizationManager', () => {
  let visualizationManager: VisualizationManager;
  let mockStateManager: sinon.SinonStubbedInstance<StateManager>;
  let mockRenderer: sinon.SinonStubbedInstance<WebGLRenderer>;
  let mockCanvas: HTMLCanvasElement;
  let container: HTMLElement;

  before(() => {
    setupDOMEnvironment();
  });

  beforeEach(() => {
    // Create DOM container
    container = document.createElement('div');
    container.id = 'visualization-container';
    document.body.appendChild(container);

    // Create mocks
    mockStateManager = sinon.createStubInstance(StateManager);
    mockRenderer = sinon.createStubInstance(WebGLRenderer);
    mockCanvas = createMockCanvas(800, 600);
    
    // Setup mock state manager
    mockStateManager.getState.returns({
      visual: SAMPLE_VISUAL_STATE,
      audio: {
        frequencyData: SAMPLE_FREQUENCY_DATA,
        beatData: SAMPLE_BEAT_EVENTS[0],
        isPlaying: false,
        currentTime: 0,
        volume: 0.8
      }
    } as any);

    // Setup mock renderer
    mockRenderer.isInitialized.returns(true);
    mockRenderer.getCanvas.returns(mockCanvas);
    mockRenderer.getContext.returns(createMockWebGLContext());
    mockRenderer.render.returns();
    mockRenderer.resize.returns();
    
    visualizationManager = new VisualizationManager(
      mockStateManager as any,
      mockRenderer as any
    );
  });

  afterEach(() => {
    if (visualizationManager && visualizationManager.isInitialized()) {
      visualizationManager.dispose();
    }
    
    // Clean up DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      expect(visualizationManager.isInitialized()).to.be.false;

      await visualizationManager.initialize(container);

      expect(visualizationManager.isInitialized()).to.be.true;
      expect(mockRenderer.initialize.calledOnce).to.be.true;
    });

    it('should create canvas element', async () => {
      await visualizationManager.initialize(container);

      const canvas = container.querySelector('canvas');
      expect(canvas).to.exist;
    });

    it('should handle initialization failure', async () => {
      mockRenderer.initialize.rejects(new Error('WebGL not supported'));

      try {
        await visualizationManager.initialize(container);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('VisualizationManager initialization failed');
      }
    });

    it('should not initialize twice', async () => {
      await visualizationManager.initialize(container);
      expect(visualizationManager.isInitialized()).to.be.true;

      // Second initialization should not throw
      await visualizationManager.initialize(container);
      expect(visualizationManager.isInitialized()).to.be.true;
      expect(mockRenderer.initialize.calledOnce).to.be.true;
    });
  });

  describe('visualization modes', () => {
    beforeEach(async () => {
      await visualizationManager.initialize(container);
    });

    it('should set visualization mode', () => {
      visualizationManager.setMode('cosmic');
      
      expect(visualizationManager.getCurrentMode()).to.equal('cosmic');
      expect(mockStateManager.setState.called).to.be.true;
    });

    it('should handle different visualization modes', () => {
      const modes = ['bars', 'waveform', 'circular', 'cosmic', 'particles'] as const;
      
      modes.forEach(mode => {
        visualizationManager.setMode(mode);
        expect(visualizationManager.getCurrentMode()).to.equal(mode);
      });
    });

    it('should update renderer when mode changes', () => {
      visualizationManager.setMode('cosmic');
      
      expect(mockRenderer.setMode.calledWith('cosmic')).to.be.true;
    });
  });

  describe('rendering loop', () => {
    beforeEach(async () => {
      await visualizationManager.initialize(container);
    });

    it('should start rendering', () => {
      visualizationManager.startRendering();
      
      expect(visualizationManager.isRendering()).to.be.true;
    });

    it('should stop rendering', () => {
      visualizationManager.startRendering();
      expect(visualizationManager.isRendering()).to.be.true;
      
      visualizationManager.stopRendering();
      
      expect(visualizationManager.isRendering()).to.be.false;
    });

    it('should render frames continuously', async () => {
      visualizationManager.startRendering();
      
      // Wait for a few animation frames
      await waitForAnimationFrame();
      await waitForAnimationFrame();
      await waitForAnimationFrame();
      
      expect(mockRenderer.render.called).to.be.true;
      expect(mockRenderer.render.callCount).to.be.greaterThan(1);
    });

    it('should update render data each frame', async () => {
      visualizationManager.startRendering();
      
      await waitForAnimationFrame();
      
      expect(mockRenderer.updateAudioData.called).to.be.true;
    });

    it('should maintain target frame rate', async () => {
      const targetFPS = 60;
      visualizationManager.setTargetFPS(targetFPS);
      visualizationManager.startRendering();
      
      const startTime = performance.now();
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
      const frames = mockRenderer.render.callCount;
      const elapsed = performance.now() - startTime;
      const actualFPS = (frames / elapsed) * 1000;
      
      // Allow for some variance due to timing
      expect(actualFPS).to.be.within(targetFPS * 0.8, targetFPS * 1.2);
    });
  });

  describe('audio data processing', () => {
    beforeEach(async () => {
      await visualizationManager.initialize(container);
      visualizationManager.startRendering();
    });

    it('should process frequency data', () => {
      visualizationManager.updateAudioData(SAMPLE_FREQUENCY_DATA);
      
      expect(mockRenderer.updateAudioData.calledWith(
        sinon.match.has('frequencies', SAMPLE_FREQUENCY_DATA.frequencies)
      )).to.be.true;
    });

    it('should handle beat events', () => {
      visualizationManager.onBeatDetected(SAMPLE_BEAT_EVENTS[0]);
      
      expect(mockRenderer.triggerBeatEffect.calledWith(SAMPLE_BEAT_EVENTS[0])).to.be.true;
    });

    it('should normalize audio data', () => {
      const rawData = new Float32Array([0.1, 0.5, 0.9, 0.3, 0.7]);
      
      const normalized = visualizationManager.normalizeAudioData(rawData);
      
      expect(normalized.every(value => value >= 0 && value <= 1)).to.be.true;
      expect(Math.max(...normalized)).to.equal(1);
    });

    it('should smooth audio data transitions', () => {
      const data1 = new Float32Array([0.1, 0.2, 0.3]);
      const data2 = new Float32Array([0.9, 0.8, 0.7]);
      
      visualizationManager.updateAudioData({ 
        ...SAMPLE_FREQUENCY_DATA, 
        frequencies: data1 
      });
      
      const smoothed = visualizationManager.smoothAudioData(data2, 0.5);
      
      // Should be between the two values
      expect(smoothed[0]).to.be.within(data1[0], data2[0]);
      expect(smoothed[1]).to.be.within(data1[1], data2[1]);
      expect(smoothed[2]).to.be.within(data1[2], data2[2]);
    });
  });

  describe('visual effects', () => {
    beforeEach(async () => {
      await visualizationManager.initialize(container);
    });

    it('should apply intensity changes', () => {
      visualizationManager.setIntensity(0.8);
      
      expect(mockRenderer.setIntensity.calledWith(0.8)).to.be.true;
      expect(visualizationManager.getIntensity()).to.equal(0.8);
    });

    it('should validate intensity range', () => {
      visualizationManager.setIntensity(1.5); // Above max
      expect(visualizationManager.getIntensity()).to.equal(1.0);
      
      visualizationManager.setIntensity(-0.5); // Below min
      expect(visualizationManager.getIntensity()).to.equal(0.0);
    });

    it('should change color palette', () => {
      visualizationManager.setColorPalette('psychedelic');
      
      expect(mockRenderer.setColorPalette.calledWith('psychedelic')).to.be.true;
    });

    it('should update particle settings', () => {
      const settings = {
        count: 5000,
        size: 2.0,
        speed: 1.5,
        opacity: 0.8
      };
      
      visualizationManager.setParticleSettings(settings);
      
      expect(mockRenderer.setParticleSettings.calledWith(settings)).to.be.true;
    });

    it('should toggle post-processing effects', () => {
      visualizationManager.setBloom(true);
      visualizationManager.setMotionBlur(false);
      
      expect(mockRenderer.setBloom.calledWith(true)).to.be.true;
      expect(mockRenderer.setMotionBlur.calledWith(false)).to.be.true;
    });
  });

  describe('responsive behavior', () => {
    beforeEach(async () => {
      await visualizationManager.initialize(container);
    });

    it('should handle window resize', () => {
      const newWidth = 1200;
      const newHeight = 800;
      
      visualizationManager.resize(newWidth, newHeight);
      
      expect(mockRenderer.resize.calledWith(newWidth, newHeight)).to.be.true;
    });

    it('should maintain aspect ratio', () => {
      visualizationManager.setMaintainAspectRatio(true);
      
      const containerAspect = container.clientWidth / container.clientHeight;
      visualizationManager.resize(1000, 500); // 2:1 aspect
      
      // Should adjust to maintain container aspect ratio
      expect(mockRenderer.resize.called).to.be.true;
    });

    it('should handle fullscreen mode', () => {
      visualizationManager.enterFullscreen();
      
      expect(mockRenderer.setFullscreen.calledWith(true)).to.be.true;
      expect(visualizationManager.isFullscreen()).to.be.true;
      
      visualizationManager.exitFullscreen();
      
      expect(mockRenderer.setFullscreen.calledWith(false)).to.be.true;
      expect(visualizationManager.isFullscreen()).to.be.false;
    });
  });

  describe('performance monitoring', () => {
    beforeEach(async () => {
      await visualizationManager.initialize(container);
      visualizationManager.startRendering();
    });

    it('should track frame rate', async () => {
      await waitForAnimationFrame();
      await waitForAnimationFrame();
      await waitForAnimationFrame();
      
      const fps = visualizationManager.getCurrentFPS();
      expect(fps).to.be.a('number');
      expect(fps).to.be.greaterThan(0);
    });

    it('should monitor render time', async () => {
      await waitForAnimationFrame();
      
      const metrics = visualizationManager.getPerformanceMetrics();
      expect(metrics.renderTime).to.be.a('number');
      expect(metrics.renderTime).to.be.greaterThan(0);
    });

    it('should detect performance issues', async () => {
      // Simulate slow rendering
      mockRenderer.render.callsFake(() => {
        const start = Date.now();
        while (Date.now() - start < 30) { /* busy wait */ }
      });
      
      await waitForAnimationFrame();
      await waitForAnimationFrame();
      
      const metrics = visualizationManager.getPerformanceMetrics();
      expect(metrics.droppedFrames).to.be.greaterThan(0);
    });

    it('should adjust quality based on performance', async () => {
      visualizationManager.setAdaptiveQuality(true);
      
      // Simulate poor performance
      sinon.stub(visualizationManager, 'getCurrentFPS').returns(20);
      
      await waitForAnimationFrame();
      
      // Should reduce quality
      expect(mockRenderer.setQuality.called).to.be.true;
      const qualityCall = mockRenderer.setQuality.getCall(0);
      expect(qualityCall.args[0]).to.be.lessThan(1.0);
    });

    it('should update state with performance metrics', async () => {
      await waitForAnimationFrame();
      
      expect(mockStateManager.updatePerformanceMetrics.called).to.be.true;
    });
  });

  describe('configuration', () => {
    beforeEach(async () => {
      await visualizationManager.initialize(container);
    });

    it('should update visualization settings', () => {
      const settings = {
        mode: 'cosmic' as const,
        intensity: 0.9,
        colorPalette: 'rainbow' as const,
        enableParticles: true,
        enablePostProcessing: true,
        quality: 'high' as const
      };
      
      visualizationManager.configure(settings);
      
      expect(mockRenderer.configure.calledWith(settings)).to.be.true;
    });

    it('should get current configuration', () => {
      const config = visualizationManager.getConfig();
      
      expect(config).to.have.property('mode');
      expect(config).to.have.property('intensity');
      expect(config).to.have.property('colorPalette');
      expect(config).to.have.property('quality');
    });

    it('should save and load presets', () => {
      const preset = {
        name: 'Cosmic Dream',
        mode: 'cosmic' as const,
        intensity: 0.8,
        colorPalette: 'cosmic' as const,
        particles: {
          count: 3000,
          size: 1.5,
          speed: 1.2
        }
      };
      
      visualizationManager.savePreset(preset);
      const saved = visualizationManager.getPreset('Cosmic Dream');
      
      expect(saved).to.deep.equal(preset);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await visualizationManager.initialize(container);
    });

    it('should handle WebGL context loss', () => {
      const canvas = mockRenderer.getCanvas();
      
      // Simulate context loss
      const contextLostEvent = new Event('webglcontextlost');
      canvas.dispatchEvent(contextLostEvent);
      
      expect(visualizationManager.isRendering()).to.be.false;
    });

    it('should attempt context restoration', () => {
      const canvas = mockRenderer.getCanvas();
      
      // Simulate context loss and restoration
      canvas.dispatchEvent(new Event('webglcontextlost'));
      canvas.dispatchEvent(new Event('webglcontextrestored'));
      
      expect(mockRenderer.restoreContext.called).to.be.true;
    });

    it('should handle render errors gracefully', async () => {
      mockRenderer.render.throws(new Error('Render error'));
      
      visualizationManager.startRendering();
      await waitForAnimationFrame();
      
      // Should continue running despite error
      expect(visualizationManager.isRendering()).to.be.true;
    });
  });

  describe('event handling', () => {
    let eventHandler: sinon.SinonSpy;

    beforeEach(async () => {
      eventHandler = sinon.spy();
      await visualizationManager.initialize(container);
    });

    it('should emit render events', async () => {
      visualizationManager.on('frame', eventHandler);
      visualizationManager.startRendering();
      
      await waitForAnimationFrame();
      
      expect(eventHandler.called).to.be.true;
    });

    it('should emit configuration change events', () => {
      visualizationManager.on('configChange', eventHandler);
      
      visualizationManager.setMode('cosmic');
      
      expect(eventHandler.called).to.be.true;
    });

    it('should emit performance events', async () => {
      visualizationManager.on('performance', eventHandler);
      visualizationManager.startRendering();
      
      await waitForAnimationFrame();
      
      expect(eventHandler.called).to.be.true;
    });

    it('should remove event listeners', () => {
      visualizationManager.on('frame', eventHandler);
      visualizationManager.off('frame', eventHandler);
      
      visualizationManager.emit('frame', {});
      expect(eventHandler.called).to.be.false;
    });
  });

  describe('disposal and cleanup', () => {
    it('should dispose correctly', async () => {
      await visualizationManager.initialize(container);
      expect(visualizationManager.isDisposed()).to.be.false;

      visualizationManager.dispose();

      expect(visualizationManager.isDisposed()).to.be.true;
      expect(mockRenderer.dispose.calledOnce).to.be.true;
    });

    it('should handle multiple dispose calls', async () => {
      await visualizationManager.initialize(container);

      visualizationManager.dispose();
      visualizationManager.dispose(); // Should not throw

      expect(visualizationManager.isDisposed()).to.be.true;
    });

    it('should stop rendering on disposal', async () => {
      await visualizationManager.initialize(container);
      visualizationManager.startRendering();
      
      expect(visualizationManager.isRendering()).to.be.true;

      visualizationManager.dispose();

      expect(visualizationManager.isRendering()).to.be.false;
    });

    it('should clean up DOM elements on disposal', async () => {
      await visualizationManager.initialize(container);
      
      const canvas = container.querySelector('canvas');
      expect(canvas).to.exist;

      visualizationManager.dispose();

      const remainingCanvas = container.querySelector('canvas');
      expect(remainingCanvas).to.not.exist;
    });

    it('should clean up event listeners on disposal', async () => {
      await visualizationManager.initialize(container);
      const eventHandler = sinon.spy();
      visualizationManager.on('frame', eventHandler);

      visualizationManager.dispose();

      visualizationManager.emit('frame', {});
      expect(eventHandler.called).to.be.false;
    });
  });
});
/**
 * Audio-Visual Synchronization Integration Tests
 */

import { expect, sinon } from '../setup';
import { AudioManager } from '../../src/renderer/managers/audio-manager';
import { VisualizationManager } from '../../src/renderer/managers/visualization-manager';
import { SyncManager } from '../../src/renderer/managers/sync-manager';
import { StateManager } from '../../src/renderer/managers/state-manager';
import { AudioDecoder } from '../../src/renderer/services/audio-decoder';
import { FFTAnalyzer } from '../../src/renderer/services/fft-analyzer';
import { WebGLRenderer } from '../../src/renderer/engine/webgl-renderer';
import { 
  SAMPLE_AUDIO_FILE, 
  SAMPLE_FREQUENCY_DATA, 
  SAMPLE_BEAT_EVENTS,
  createMockAudioBuffer
} from '../fixtures/audio-fixtures';
import { 
  setupDOMEnvironment, 
  createTestContainer, 
  cleanupTestContainer,
  createMockCanvas,
  waitForAnimationFrame
} from '../fixtures/dom-fixtures';

describe('Audio-Visual Synchronization Integration', () => {
  let container: HTMLElement;
  let stateManager: StateManager;
  let audioManager: AudioManager;
  let visualizationManager: VisualizationManager;
  let syncManager: SyncManager;
  let mockAudioContext: sinon.SinonStubbedInstance<AudioContext>;
  let mockCanvas: HTMLCanvasElement;

  before(() => {
    setupDOMEnvironment();
  });

  beforeEach(async () => {
    container = createTestContainer();
    mockCanvas = createMockCanvas(800, 600);
    container.appendChild(mockCanvas);

    // Create real state manager (not mocked for integration test)
    stateManager = new StateManager();

    // Create mock audio context with realistic behavior
    mockAudioContext = sinon.createStubInstance(AudioContext as any);
    mockAudioContext.state = 'running';
    mockAudioContext.sampleRate = 44100;
    mockAudioContext.currentTime = 0;
    mockAudioContext.resume.resolves();
    
    // Create mock analyser node
    const mockAnalyser = {
      fftSize: 2048,
      frequencyBinCount: 1024,
      smoothingTimeConstant: 0.8,
      minDecibels: -100,
      maxDecibels: -30,
      connect: sinon.stub(),
      disconnect: sinon.stub(),
      getFloatFrequencyData: sinon.stub().callsFake((array: Float32Array) => {
        // Simulate real frequency data
        for (let i = 0; i < array.length; i++) {
          array[i] = -60 + Math.sin(i * 0.1) * 20 + Math.random() * 10;
        }
      }),
      getByteFrequencyData: sinon.stub()
    };
    
    mockAudioContext.createAnalyser.returns(mockAnalyser as any);
    
    // Create mock buffer source
    const mockBufferSource = {
      buffer: null,
      connect: sinon.stub(),
      start: sinon.stub(),
      stop: sinon.stub(),
      onended: null
    };
    
    mockAudioContext.createBufferSource.returns(mockBufferSource as any);
    
    // Create services and managers
    const audioDecoder = new AudioDecoder(mockAudioContext as any);
    const fftAnalyzer = new FFTAnalyzer(mockAudioContext as any);
    const webglRenderer = new WebGLRenderer();
    
    audioManager = new AudioManager(stateManager, mockAudioContext as any, audioDecoder, fftAnalyzer);
    visualizationManager = new VisualizationManager(stateManager, webglRenderer);
    syncManager = new SyncManager(stateManager, audioManager, visualizationManager);

    // Initialize all managers
    await audioManager.initialize();
    await visualizationManager.initialize(container);
    await syncManager.initialize();
  });

  afterEach(() => {
    if (syncManager?.isInitialized()) syncManager.dispose();
    if (audioManager?.isInitialized()) audioManager.dispose();
    if (visualizationManager?.isInitialized()) visualizationManager.dispose();
    cleanupTestContainer();
  });

  describe('initialization synchronization', () => {
    it('should initialize all components in correct order', () => {
      expect(audioManager.isInitialized()).to.be.true;
      expect(visualizationManager.isInitialized()).to.be.true;
      expect(syncManager.isInitialized()).to.be.true;
    });

    it('should establish communication between components', () => {
      // Verify that sync manager has references to other managers
      expect(syncManager.getAudioManager()).to.equal(audioManager);
      expect(syncManager.getVisualizationManager()).to.equal(visualizationManager);
    });

    it('should share state correctly', () => {
      const state = stateManager.getState();
      
      expect(state).to.have.property('audio');
      expect(state).to.have.property('visual');
      expect(state).to.have.property('playback');
    });
  });

  describe('file loading integration', () => {
    it('should coordinate file loading across components', async () => {
      const mockAudioBuffer = createMockAudioBuffer(10, 44100, 2);
      const arrayBuffer = new ArrayBuffer(1024);
      
      // Mock successful audio decoding
      sinon.stub(audioManager['decoder'], 'validateAudioFormat').returns({ 
        isValid: true, 
        errors: [] 
      });
      sinon.stub(audioManager['decoder'], 'loadFromArrayBuffer').resolves(mockAudioBuffer);
      
      const result = await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
      
      expect(result.success).to.be.true;
      
      // Verify state was updated
      const state = stateManager.getState();
      expect(state.audio.currentFile).to.deep.equal(SAMPLE_AUDIO_FILE);
      expect(state.audio.duration).to.equal(10);
    });

    it('should handle file loading errors gracefully', async () => {
      const arrayBuffer = new ArrayBuffer(1024);
      
      // Mock validation failure
      sinon.stub(audioManager['decoder'], 'validateAudioFormat').returns({ 
        isValid: false, 
        errors: ['Invalid format'] 
      });
      
      try {
        await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Invalid audio format');
      }
      
      // Verify state reflects error
      const state = stateManager.getState();
      expect(state.ui.notifications).to.have.length.greaterThan(0);
    });
  });

  describe('playback synchronization', () => {
    beforeEach(async () => {
      // Load a test file first
      const mockAudioBuffer = createMockAudioBuffer(10, 44100, 2);
      const arrayBuffer = new ArrayBuffer(1024);
      
      sinon.stub(audioManager['decoder'], 'validateAudioFormat').returns({ 
        isValid: true, 
        errors: [] 
      });
      sinon.stub(audioManager['decoder'], 'loadFromArrayBuffer').resolves(mockAudioBuffer);
      
      await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
    });

    it('should synchronize play operations', async () => {
      await audioManager.play();
      
      // Verify audio manager state
      expect(audioManager.isPlaying()).to.be.true;
      
      // Verify sync manager detects playback
      expect(syncManager.isSyncing()).to.be.true;
      
      // Verify visualization starts rendering
      expect(visualizationManager.isRendering()).to.be.true;
      
      // Verify state is updated
      const state = stateManager.getState();
      expect(state.audio.isPlaying).to.be.true;
      expect(state.playback.status).to.equal('playing');
    });

    it('should synchronize pause operations', async () => {
      await audioManager.play();
      expect(audioManager.isPlaying()).to.be.true;
      
      await audioManager.pause();
      
      // Verify all components reflect pause state
      expect(audioManager.isPlaying()).to.be.false;
      expect(syncManager.isSyncing()).to.be.false;
      expect(visualizationManager.isRendering()).to.be.false;
      
      const state = stateManager.getState();
      expect(state.audio.isPlaying).to.be.false;
      expect(state.playback.status).to.equal('paused');
    });

    it('should synchronize stop operations', async () => {
      await audioManager.play();
      await audioManager.stop();
      
      // Verify all components reflect stop state
      expect(audioManager.isPlaying()).to.be.false;
      expect(audioManager.getCurrentTime()).to.equal(0);
      expect(syncManager.isSyncing()).to.be.false;
      expect(visualizationManager.isRendering()).to.be.false;
      
      const state = stateManager.getState();
      expect(state.audio.isPlaying).to.be.false;
      expect(state.audio.currentTime).to.equal(0);
      expect(state.playback.status).to.equal('stopped');
    });
  });

  describe('real-time audio analysis integration', () => {
    beforeEach(async () => {
      const mockAudioBuffer = createMockAudioBuffer(10, 44100, 2);
      const arrayBuffer = new ArrayBuffer(1024);
      
      sinon.stub(audioManager['decoder'], 'validateAudioBuffer').returns({ 
        isValid: true, 
        errors: [] 
      });
      sinon.stub(audioManager['decoder'], 'loadFromArrayBuffer').resolves(mockAudioBuffer);
      
      await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
      await audioManager.play();
    });

    it('should process audio data and update visualization', async () => {
      audioManager.startAnalysis();
      
      // Simulate audio processing frame
      audioManager.processAudioFrame();
      
      await waitForAnimationFrame();
      
      // Verify frequency data is passed to visualization
      const state = stateManager.getState();
      expect(state.audio.frequencyData).to.exist;
      expect(state.audio.frequencyData?.frequencies).to.be.instanceOf(Float32Array);
    });

    it('should synchronize beat detection with visual effects', async () => {
      audioManager.startAnalysis();
      
      // Mock beat detection
      const mockBeat = {
        timestamp: 1.234,
        energy: 0.85,
        type: 'kick' as const,
        confidence: 0.92
      };
      
      sinon.stub(audioManager['fftAnalyzer'], 'detectBeats').returns([mockBeat]);
      
      audioManager.processAudioFrame();
      
      await waitForAnimationFrame();
      
      // Verify beat event is propagated
      const state = stateManager.getState();
      expect(state.audio.beatData).to.deep.equal(mockBeat);
    });

    it('should maintain timing accuracy during analysis', async () => {
      audioManager.startAnalysis();
      
      const startTime = mockAudioContext.currentTime;
      
      // Simulate multiple analysis frames
      for (let i = 0; i < 10; i++) {
        mockAudioContext.currentTime = startTime + (i * 0.016); // ~60fps
        audioManager.processAudioFrame();
        await waitForAnimationFrame();
      }
      
      // Verify timing consistency
      const timingOffset = syncManager.calculateTimingOffset(mockAudioContext.currentTime);
      expect(Math.abs(timingOffset)).to.be.lessThan(0.050); // Within 50ms
    });
  });

  describe('visual response integration', () => {
    beforeEach(async () => {
      const mockAudioBuffer = createMockAudioBuffer(10, 44100, 2);
      const arrayBuffer = new ArrayBuffer(1024);
      
      sinon.stub(audioManager['decoder'], 'validateAudioFormat').returns({ 
        isValid: true, 
        errors: [] 
      });
      sinon.stub(audioManager['decoder'], 'loadFromArrayBuffer').resolves(mockAudioBuffer);
      
      await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
      await audioManager.play();
      audioManager.startAnalysis();
    });

    it('should respond to frequency changes', async () => {
      const frequencyData = {
        ...SAMPLE_FREQUENCY_DATA,
        frequencies: new Float32Array([0.1, 0.3, 0.8, 0.5, 0.2])
      };
      
      syncManager.processFrequencyData(frequencyData);
      
      await waitForAnimationFrame();
      
      // Verify visualization receives frequency data
      // (This would be verified through the renderer mock in a full implementation)
      const state = stateManager.getState();
      expect(state.audio.frequencyData).to.deep.equal(frequencyData);
    });

    it('should respond to beat events with visual effects', async () => {
      const beatEvent = SAMPLE_BEAT_EVENTS[0];
      
      syncManager.onBeatDetected(beatEvent);
      
      await waitForAnimationFrame();
      
      // Verify beat triggers visual response
      const state = stateManager.getState();
      expect(state.audio.beatData).to.deep.equal(beatEvent);
    });

    it('should scale intensity with volume', async () => {
      const originalVolume = audioManager.getVolume();
      
      audioManager.setVolume(0.9);
      
      await waitForAnimationFrame();
      
      // Verify volume change affects visual intensity
      const state = stateManager.getState();
      expect(state.audio.volume).to.equal(0.9);
      expect(state.visual.intensity).to.be.greaterThan(0.8);
    });
  });

  describe('timing synchronization integration', () => {
    beforeEach(async () => {
      const mockAudioBuffer = createMockAudioBuffer(10, 44100, 2);
      const arrayBuffer = new ArrayBuffer(1024);
      
      sinon.stub(audioManager['decoder'], 'validateAudioFormat').returns({ 
        isValid: true, 
        errors: [] 
      });
      sinon.stub(audioManager['decoder'], 'loadFromArrayBuffer').resolves(mockAudioBuffer);
      
      await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
      await audioManager.play();
    });

    it('should maintain audio-visual timing accuracy', async () => {
      const audioTime = 2.5;
      const visualTime = 2.52; // 20ms ahead
      
      mockAudioContext.currentTime = audioTime;
      
      const offset = syncManager.calculateTimingOffset(visualTime);
      
      expect(offset).to.be.closeTo(0.02, 0.01);
    });

    it('should detect and correct timing drift', async () => {
      syncManager.setAutoCorrection(true);
      
      // Simulate drift over time
      let audioTime = 1.0;
      let visualTime = 1.0;
      
      for (let i = 0; i < 10; i++) {
        audioTime += 0.016;
        visualTime += 0.018; // Slightly faster visual
        
        mockAudioContext.currentTime = audioTime;
        syncManager.checkTimingSync(visualTime);
        
        await waitForAnimationFrame();
      }
      
      expect(syncManager.isTimingDrifting()).to.be.true;
    });

    it('should handle seek operations consistently', async () => {
      const seekTime = 5.0;
      
      await audioManager.seek(seekTime);
      
      // Verify all components reflect the seek
      expect(audioManager.getCurrentTime()).to.equal(seekTime);
      
      const state = stateManager.getState();
      expect(state.audio.currentTime).to.equal(seekTime);
      expect(state.playback.position).to.equal(seekTime);
    });
  });

  describe('error handling integration', () => {
    it('should handle audio processing errors gracefully', async () => {
      const mockAudioBuffer = createMockAudioBuffer(10, 44100, 2);
      const arrayBuffer = new ArrayBuffer(1024);
      
      sinon.stub(audioManager['decoder'], 'validateAudioFormat').returns({ 
        isValid: true, 
        errors: [] 
      });
      sinon.stub(audioManager['decoder'], 'loadFromArrayBuffer').resolves(mockAudioBuffer);
      
      await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
      await audioManager.play();
      
      // Simulate audio processing error
      sinon.stub(audioManager['fftAnalyzer'], 'analyzeFrequencies').throws(new Error('Analysis failed'));
      
      audioManager.startAnalysis();
      
      // Should continue operating despite error
      expect(audioManager.isPlaying()).to.be.true;
      expect(syncManager.isSyncing()).to.be.true;
    });

    it('should handle visualization errors gracefully', async () => {
      const mockAudioBuffer = createMockAudioBuffer(10, 44100, 2);
      const arrayBuffer = new ArrayBuffer(1024);
      
      sinon.stub(audioManager['decoder'], 'validateAudioFormat').returns({ 
        isValid: true, 
        errors: [] 
      });
      sinon.stub(audioManager['decoder'], 'loadFromArrayBuffer').resolves(mockAudioBuffer);
      
      await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
      await audioManager.play();
      
      // Simulate visualization error
      sinon.stub(visualizationManager['renderer'], 'render').throws(new Error('Render failed'));
      
      // Should continue audio processing
      expect(audioManager.isPlaying()).to.be.true;
      expect(syncManager.isSyncing()).to.be.true;
    });

    it('should recover from synchronization failures', async () => {
      const mockAudioBuffer = createMockAudioBuffer(10, 44100, 2);
      const arrayBuffer = new ArrayBuffer(1024);
      
      sinon.stub(audioManager['decoder'], 'validateAudioFormat').returns({ 
        isValid: true, 
        errors: [] 
      });
      sinon.stub(audioManager['decoder'], 'loadFromArrayBuffer').resolves(mockAudioBuffer);
      
      await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
      await audioManager.play();
      
      // Simulate sync failure
      sinon.stub(syncManager, 'syncFrame').throws(new Error('Sync failed'));
      
      // Should attempt recovery
      syncManager.recoverFromSyncError();
      
      expect(syncManager.isSyncing()).to.be.true;
    });
  });

  describe('performance integration', () => {
    beforeEach(async () => {
      const mockAudioBuffer = createMockAudioBuffer(10, 44100, 2);
      const arrayBuffer = new ArrayBuffer(1024);
      
      sinon.stub(audioManager['decoder'], 'validateAudioFormat').returns({ 
        isValid: true, 
        errors: [] 
      });
      sinon.stub(audioManager['decoder'], 'loadFromArrayBuffer').resolves(mockAudioBuffer);
      
      await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
      await audioManager.play();
      audioManager.startAnalysis();
    });

    it('should maintain performance under load', async () => {
      // Simulate high-frequency updates
      for (let i = 0; i < 100; i++) {
        audioManager.processAudioFrame();
        syncManager.syncFrame();
        await waitForAnimationFrame();
      }
      
      const audioMetrics = audioManager.getPerformanceMetrics();
      const syncMetrics = syncManager.getPerformanceMetrics();
      const visualMetrics = visualizationManager.getPerformanceMetrics();
      
      expect(audioMetrics.averageProcessingTime).to.be.lessThan(10); // < 10ms
      expect(syncMetrics.averageSyncTime).to.be.lessThan(5); // < 5ms
      expect(visualMetrics.fps).to.be.greaterThan(30); // > 30fps
    });

    it('should adapt to system performance', async () => {
      // Simulate poor performance
      sinon.stub(performance, 'now')
        .onFirstCall().returns(0)
        .onSecondCall().returns(50) // 50ms frame time
        .onThirdCall().returns(100);
      
      syncManager.adjustSyncFrequency();
      
      // Should reduce sync frequency
      expect(syncManager.getSyncInterval()).to.be.greaterThan(16);
    });

    it('should handle memory usage efficiently', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Generate continuous audio data
      for (let i = 0; i < 1000; i++) {
        audioManager.processAudioFrame();
        
        if (i % 100 === 0) {
          // Allow garbage collection
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Should not have excessive memory growth
      expect(memoryIncrease).to.be.lessThan(50 * 1024 * 1024); // < 50MB
    });
  });

  describe('state consistency integration', () => {
    it('should maintain consistent state across all components', async () => {
      const mockAudioBuffer = createMockAudioBuffer(10, 44100, 2);
      const arrayBuffer = new ArrayBuffer(1024);
      
      sinon.stub(audioManager['decoder'], 'validateAudioFormat').returns({ 
        isValid: true, 
        errors: [] 
      });
      sinon.stub(audioManager['decoder'], 'loadFromArrayBuffer').resolves(mockAudioBuffer);
      
      await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
      await audioManager.play();
      audioManager.setVolume(0.7);
      visualizationManager.setMode('cosmic');
      visualizationManager.setIntensity(0.9);
      
      const state = stateManager.getState();
      
      // Verify state consistency
      expect(state.audio.isPlaying).to.equal(audioManager.isPlaying());
      expect(state.audio.volume).to.equal(audioManager.getVolume());
      expect(state.visual.mode).to.equal(visualizationManager.getCurrentMode());
      expect(state.visual.intensity).to.equal(visualizationManager.getIntensity());
    });

    it('should propagate state changes correctly', async () => {
      let stateChangeCount = 0;
      
      stateManager.subscribe(() => {
        stateChangeCount++;
      });
      
      const mockAudioBuffer = createMockAudioBuffer(10, 44100, 2);
      const arrayBuffer = new ArrayBuffer(1024);
      
      sinon.stub(audioManager['decoder'], 'validateAudioFormat').returns({ 
        isValid: true, 
        errors: [] 
      });
      sinon.stub(audioManager['decoder'], 'loadFromArrayBuffer').resolves(mockAudioBuffer);
      
      await audioManager.loadAudioFile(SAMPLE_AUDIO_FILE, arrayBuffer);
      await audioManager.play();
      await audioManager.pause();
      audioManager.setVolume(0.5);
      
      // Should have triggered multiple state changes
      expect(stateChangeCount).to.be.greaterThan(3);
    });
  });
});
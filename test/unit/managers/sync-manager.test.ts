/**
 * SyncManager Tests - Handles audio-visual synchronization
 */

import { expect, sinon } from '../../setup';
import { SyncManager } from '../../../src/renderer/managers/sync-manager';
import { StateManager } from '../../../src/renderer/managers/state-manager';
import { AudioManager } from '../../../src/renderer/managers/audio-manager';
import { VisualizationManager } from '../../../src/renderer/managers/visualization-manager';
import { 
  SAMPLE_FREQUENCY_DATA, 
  SAMPLE_BEAT_EVENTS,
  SAMPLE_AUDIO_FEATURES
} from '../../fixtures/audio-fixtures';

describe('SyncManager', () => {
  let syncManager: SyncManager;
  let mockStateManager: sinon.SinonStubbedInstance<StateManager>;
  let mockAudioManager: sinon.SinonStubbedInstance<AudioManager>;
  let mockVisualizationManager: sinon.SinonStubbedInstance<VisualizationManager>;

  beforeEach(() => {
    // Create mocks
    mockStateManager = sinon.createStubInstance(StateManager);
    mockAudioManager = sinon.createStubInstance(AudioManager);
    mockVisualizationManager = sinon.createStubInstance(VisualizationManager);
    
    // Setup mock state manager
    mockStateManager.getState.returns({
      audio: {
        isPlaying: false,
        currentTime: 0,
        frequencyData: SAMPLE_FREQUENCY_DATA,
        beatData: SAMPLE_BEAT_EVENTS[0],
        audioFeatures: SAMPLE_AUDIO_FEATURES
      },
      visual: {
        mode: 'cosmic',
        intensity: 0.8,
        colorPalette: 'cosmic'
      },
      playback: {
        status: 'stopped',
        position: 0
      }
    } as any);
    
    // Setup mock audio manager
    mockAudioManager.isInitialized.returns(true);
    mockAudioManager.isPlaying.returns(false);
    mockAudioManager.getCurrentTime.returns(0);
    mockAudioManager.getCurrentTempo.returns(120);
    mockAudioManager.getVolume.returns(0.8);
    
    // Setup mock visualization manager
    mockVisualizationManager.isInitialized.returns(true);
    mockVisualizationManager.isRendering.returns(false);
    mockVisualizationManager.getCurrentFPS.returns(60);
    
    syncManager = new SyncManager(
      mockStateManager as any,
      mockAudioManager as any,
      mockVisualizationManager as any
    );
  });

  afterEach(() => {
    if (syncManager && syncManager.isInitialized()) {
      syncManager.dispose();
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      expect(syncManager.isInitialized()).to.be.false;

      await syncManager.initialize();

      expect(syncManager.isInitialized()).to.be.true;
    });

    it('should set up event listeners during initialization', async () => {
      await syncManager.initialize();

      expect(mockAudioManager.on.called).to.be.true;
      expect(mockVisualizationManager.on.called).to.be.true;
    });

    it('should not initialize twice', async () => {
      await syncManager.initialize();
      expect(syncManager.isInitialized()).to.be.true;

      // Second initialization should not throw
      await syncManager.initialize();
      expect(syncManager.isInitialized()).to.be.true;
    });
  });

  describe('synchronization control', () => {
    beforeEach(async () => {
      await syncManager.initialize();
    });

    it('should start synchronization', () => {
      syncManager.startSync();

      expect(syncManager.isSyncing()).to.be.true;
    });

    it('should stop synchronization', () => {
      syncManager.startSync();
      expect(syncManager.isSyncing()).to.be.true;

      syncManager.stopSync();

      expect(syncManager.isSyncing()).to.be.false;
    });

    it('should sync audio and visual when playing', () => {
      mockAudioManager.isPlaying.returns(true);
      mockVisualizationManager.isRendering.returns(true);
      
      syncManager.startSync();
      syncManager.syncFrame();

      expect(mockVisualizationManager.updateAudioData.called).to.be.true;
    });

    it('should handle playback state changes', () => {
      // Simulate play event
      syncManager.onAudioPlay();

      expect(mockVisualizationManager.startRendering.calledOnce).to.be.true;
      expect(syncManager.isSyncing()).to.be.true;
    });

    it('should handle pause events', () => {
      syncManager.startSync();
      
      // Simulate pause event
      syncManager.onAudioPause();

      expect(mockVisualizationManager.stopRendering.calledOnce).to.be.true;
      expect(syncManager.isSyncing()).to.be.false;
    });

    it('should handle stop events', () => {
      syncManager.startSync();
      
      // Simulate stop event
      syncManager.onAudioStop();

      expect(mockVisualizationManager.stopRendering.calledOnce).to.be.true;
      expect(syncManager.isSyncing()).to.be.false;
    });
  });

  describe('timing synchronization', () => {
    beforeEach(async () => {
      await syncManager.initialize();
      syncManager.startSync();
    });

    it('should calculate timing offset', () => {
      const audioTime = 5.234;
      const visualTime = 5.240;
      
      mockAudioManager.getCurrentTime.returns(audioTime);
      
      const offset = syncManager.calculateTimingOffset(visualTime);
      
      expect(offset).to.be.closeTo(0.006, 0.001);
    });

    it('should apply timing corrections', () => {
      const offset = 0.050; // 50ms offset
      
      syncManager.applyTimingCorrection(offset);

      expect(mockVisualizationManager.setTimeOffset.calledWith(offset)).to.be.true;
    });

    it('should detect timing drift', () => {
      // Simulate drift over multiple frames
      const driftValues = [0.001, 0.005, 0.012, 0.025, 0.045];
      
      driftValues.forEach((drift, index) => {
        mockAudioManager.getCurrentTime.returns(index * 0.016 + drift);
        syncManager.syncFrame();
      });

      const isDrifting = syncManager.isTimingDrifting();
      expect(isDrifting).to.be.true;
    });

    it('should auto-correct timing drift', () => {
      syncManager.setAutoCorrection(true);
      
      // Simulate significant drift
      mockAudioManager.getCurrentTime.returns(5.100);
      const visualTime = 5.200; // 100ms ahead
      
      syncManager.checkTimingSync(visualTime);

      expect(mockVisualizationManager.setTimeOffset.called).to.be.true;
    });
  });

  describe('beat synchronization', () => {
    beforeEach(async () => {
      await syncManager.initialize();
      syncManager.startSync();
    });

    it('should handle beat events', () => {
      const beatEvent = SAMPLE_BEAT_EVENTS[0];
      
      syncManager.onBeatDetected(beatEvent);

      expect(mockVisualizationManager.onBeatDetected.calledWith(beatEvent)).to.be.true;
    });

    it('should sync visual effects to beat', () => {
      const beatEvent = {
        timestamp: 1.234,
        energy: 0.9,
        type: 'kick' as const,
        confidence: 0.95
      };
      
      syncManager.onBeatDetected(beatEvent);

      // Should trigger visual effects based on beat energy
      expect(mockVisualizationManager.setIntensity.called).to.be.true;
    });

    it('should handle tempo changes', () => {
      const oldTempo = 120;
      const newTempo = 140;
      
      mockAudioManager.getCurrentTempo.returns(newTempo);
      
      syncManager.onTempoChange(oldTempo, newTempo);

      expect(mockVisualizationManager.setAnimationSpeed.called).to.be.true;
    });

    it('should quantize beat timing', () => {
      const beatTime = 1.234567;
      const tempo = 120; // 0.5s per beat
      
      const quantized = syncManager.quantizeBeatTiming(beatTime, tempo);
      
      // Should snap to nearest beat boundary
      expect(quantized).to.be.closeTo(1.0, 0.1);
    });
  });

  describe('frequency analysis synchronization', () => {
    beforeEach(async () => {
      await syncManager.initialize();
      syncManager.startSync();
    });

    it('should process frequency data', () => {
      syncManager.processFrequencyData(SAMPLE_FREQUENCY_DATA);

      expect(mockVisualizationManager.updateAudioData.calledWith(SAMPLE_FREQUENCY_DATA)).to.be.true;
    });

    it('should map frequency ranges to visual elements', () => {
      const frequencyData = {
        ...SAMPLE_FREQUENCY_DATA,
        frequencies: new Float32Array([0.1, 0.3, 0.8, 0.5, 0.2])
      };
      
      const mapped = syncManager.mapFrequencyToVisual(frequencyData);

      expect(mapped).to.have.property('bass');
      expect(mapped).to.have.property('mid');
      expect(mapped).to.have.property('treble');
      expect(mapped.bass).to.be.within(0, 1);
      expect(mapped.mid).to.be.within(0, 1);
      expect(mapped.treble).to.be.within(0, 1);
    });

    it('should apply frequency smoothing', () => {
      const rawFreqs = new Float32Array([0.1, 0.9, 0.1, 0.9, 0.1]);
      const smoothingFactor = 0.8;
      
      const smoothed = syncManager.smoothFrequencyData(rawFreqs, smoothingFactor);

      // Should reduce rapid changes
      expect(smoothed[1]).to.be.lessThan(rawFreqs[1]);
      expect(smoothed[3]).to.be.lessThan(rawFreqs[3]);
    });

    it('should handle frequency data gaps', () => {
      // Simulate missing frequency data
      syncManager.processFrequencyData(null);

      // Should use interpolated or default values
      expect(mockVisualizationManager.updateAudioData.called).to.be.true;
    });
  });

  describe('volume synchronization', () => {
    beforeEach(async () => {
      await syncManager.initialize();
      syncManager.startSync();
    });

    it('should sync visual intensity to volume', () => {
      const volume = 0.7;
      mockAudioManager.getVolume.returns(volume);
      
      syncManager.onVolumeChange(volume);

      expect(mockVisualizationManager.setIntensity.called).to.be.true;
    });

    it('should handle volume normalization', () => {
      const volumes = [0.1, 0.3, 0.8, 0.5, 0.2];
      
      const normalized = syncManager.normalizeVolume(volumes);
      
      expect(Math.max(...normalized)).to.equal(1.0);
      expect(Math.min(...normalized)).to.be.greaterThanOrEqual(0.0);
    });

    it('should apply volume smoothing', () => {
      const previousVolume = 0.3;
      const currentVolume = 0.9;
      const smoothingFactor = 0.5;
      
      const smoothed = syncManager.smoothVolume(currentVolume, previousVolume, smoothingFactor);
      
      expect(smoothed).to.be.between(previousVolume, currentVolume);
    });
  });

  describe('performance optimization', () => {
    beforeEach(async () => {
      await syncManager.initialize();
      syncManager.startSync();
    });

    it('should monitor sync performance', () => {
      // Process several frames
      for (let i = 0; i < 10; i++) {
        syncManager.syncFrame();
      }

      const metrics = syncManager.getPerformanceMetrics();
      expect(metrics.averageSyncTime).to.be.a('number');
      expect(metrics.syncFrameCount).to.equal(10);
    });

    it('should adjust sync frequency based on performance', () => {
      // Simulate poor performance
      sinon.stub(syncManager, 'getSyncTime').returns(20); // 20ms sync time
      
      syncManager.adjustSyncFrequency();

      // Should reduce sync frequency
      expect(syncManager.getSyncInterval()).to.be.greaterThan(16); // > 60fps
    });

    it('should skip frames when necessary', () => {
      syncManager.setFrameSkipping(true);
      
      // Simulate high load
      sinon.stub(performance, 'now')
        .onFirstCall().returns(0)
        .onSecondCall().returns(50); // 50ms frame time

      syncManager.syncFrame();

      expect(syncManager.getSkippedFrames()).to.be.greaterThan(0);
    });

    it('should use adaptive sync rates', () => {
      syncManager.setAdaptiveSync(true);
      
      // Simulate varying performance
      const frameTimes = [16, 18, 25, 33, 16, 17];
      frameTimes.forEach(time => {
        sinon.stub(syncManager, 'getLastFrameTime').returns(time);
        syncManager.updateSyncRate();
      });

      // Should adapt to performance variations
      expect(syncManager.getCurrentSyncRate()).to.be.lessThan(60);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await syncManager.initialize();
    });

    it('should handle audio manager errors', () => {
      mockAudioManager.getCurrentTime.throws(new Error('Audio error'));
      
      syncManager.startSync();
      syncManager.syncFrame();

      // Should continue operating
      expect(syncManager.isSyncing()).to.be.true;
    });

    it('should handle visualization manager errors', () => {
      mockVisualizationManager.updateAudioData.throws(new Error('Render error'));
      
      syncManager.startSync();
      syncManager.syncFrame();

      // Should continue operating
      expect(syncManager.isSyncing()).to.be.true;
    });

    it('should recover from synchronization failures', () => {
      syncManager.startSync();
      
      // Simulate sync failure
      sinon.stub(syncManager, 'syncFrame').throws(new Error('Sync error'));
      
      // Should attempt recovery
      syncManager.recoverFromSyncError();
      
      expect(syncManager.isSyncing()).to.be.true;
    });

    it('should handle timing calculation errors', () => {
      // Simulate invalid timing data
      mockAudioManager.getCurrentTime.returns(NaN);
      
      const offset = syncManager.calculateTimingOffset(5.0);
      
      // Should return safe default
      expect(offset).to.equal(0);
    });
  });

  describe('configuration', () => {
    beforeEach(async () => {
      await syncManager.initialize();
    });

    it('should configure synchronization settings', () => {
      const config = {
        maxTimingOffset: 0.100, // 100ms
        beatSensitivity: 0.8,
        volumeSensitivity: 0.7,
        smoothingFactor: 0.5,
        adaptiveSync: true
      };
      
      syncManager.configure(config);

      expect(syncManager.getConfig()).to.deep.include(config);
    });

    it('should validate configuration values', () => {
      const invalidConfig = {
        maxTimingOffset: -1, // Invalid
        beatSensitivity: 2.0, // Invalid
        smoothingFactor: 1.5 // Invalid
      };
      
      syncManager.configure(invalidConfig);
      const config = syncManager.getConfig();

      // Should use safe defaults for invalid values
      expect(config.maxTimingOffset).to.be.greaterThan(0);
      expect(config.beatSensitivity).to.be.within(0, 1);
      expect(config.smoothingFactor).to.be.within(0, 1);
    });
  });

  describe('event handling', () => {
    let eventHandler: sinon.SinonSpy;

    beforeEach(async () => {
      eventHandler = sinon.spy();
      await syncManager.initialize();
    });

    it('should emit synchronization events', () => {
      syncManager.on('sync', eventHandler);
      syncManager.startSync();
      
      syncManager.syncFrame();

      expect(eventHandler.called).to.be.true;
    });

    it('should emit timing drift events', () => {
      syncManager.on('timingDrift', eventHandler);
      
      // Simulate timing drift
      mockAudioManager.getCurrentTime.returns(5.100);
      syncManager.checkTimingSync(5.200);

      expect(eventHandler.called).to.be.true;
    });

    it('should emit performance events', () => {
      syncManager.on('performance', eventHandler);
      
      // Process frames to generate performance data
      for (let i = 0; i < 5; i++) {
        syncManager.syncFrame();
      }

      expect(eventHandler.called).to.be.true;
    });

    it('should remove event listeners', () => {
      syncManager.on('sync', eventHandler);
      syncManager.off('sync', eventHandler);
      
      syncManager.emit('sync', {});
      expect(eventHandler.called).to.be.false;
    });
  });

  describe('disposal and cleanup', () => {
    it('should dispose correctly', async () => {
      await syncManager.initialize();
      expect(syncManager.isDisposed()).to.be.false;

      syncManager.dispose();

      expect(syncManager.isDisposed()).to.be.true;
    });

    it('should handle multiple dispose calls', async () => {
      await syncManager.initialize();

      syncManager.dispose();
      syncManager.dispose(); // Should not throw

      expect(syncManager.isDisposed()).to.be.true;
    });

    it('should stop synchronization on disposal', async () => {
      await syncManager.initialize();
      syncManager.startSync();
      
      expect(syncManager.isSyncing()).to.be.true;

      syncManager.dispose();

      expect(syncManager.isSyncing()).to.be.false;
    });

    it('should clean up event listeners on disposal', async () => {
      await syncManager.initialize();
      const eventHandler = sinon.spy();
      syncManager.on('sync', eventHandler);

      syncManager.dispose();

      syncManager.emit('sync', {});
      expect(eventHandler.called).to.be.false;
    });

    it('should clear performance data on disposal', async () => {
      await syncManager.initialize();
      syncManager.startSync();
      
      // Generate some performance data
      for (let i = 0; i < 5; i++) {
        syncManager.syncFrame();
      }

      syncManager.dispose();

      const metrics = syncManager.getPerformanceMetrics();
      expect(metrics.syncFrameCount).to.equal(0);
    });
  });
});
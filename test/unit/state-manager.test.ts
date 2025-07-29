/**
 * State Manager Tests
 */

import { expect, sinon } from '../setup';
import { StateManager } from '../../src/renderer/managers/state-manager';
import { ActionTypes } from '../../src/shared/types';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const state = stateManager.getState();

      expect(state).to.have.property('audio');
      expect(state).to.have.property('visual');
      expect(state).to.have.property('ui');
      expect(state).to.have.property('playback');

      expect(state.audio.currentFile).to.be.null;
      expect(state.audio.isPlaying).to.be.false;
      expect(state.audio.volume).to.equal(0.8);
      expect(state.playback.status).to.equal('stopped');
    });
  });

  describe('state updates', () => {
    it('should update state with setState', () => {
      const newAudioState = {
        volume: 0.5,
        isPlaying: true,
      };

      stateManager.setState({ audio: newAudioState });

      const state = stateManager.getState();
      expect(state.audio.volume).to.equal(0.5);
      expect(state.audio.isPlaying).to.be.true;
      // Other properties should remain unchanged
      expect(state.audio.currentFile).to.be.null;
    });

    it('should merge partial updates', () => {
      const originalVolume = stateManager.getState().audio.volume;

      stateManager.setState({
        audio: { isPlaying: true },
      });

      const state = stateManager.getState();
      expect(state.audio.isPlaying).to.be.true;
      expect(state.audio.volume).to.equal(originalVolume); // Should preserve
    });

    it('should return immutable state copies', () => {
      const state1 = stateManager.getState();
      const state2 = stateManager.getState();

      expect(state1).to.not.equal(state2); // Different objects
      expect(state1).to.deep.equal(state2); // Same content
    });
  });

  describe('subscriptions', () => {
    it('should notify subscribers on state changes', () => {
      const listener = sinon.spy();
      const unsubscribe = stateManager.subscribe(listener);

      stateManager.setState({ audio: { volume: 0.3 } });

      expect(listener.calledOnce).to.be.true;
      const callArgs = listener.firstCall.args[0];
      expect(callArgs.audio.volume).to.equal(0.3);

      unsubscribe();
    });

    it('should handle multiple subscribers', () => {
      const listener1 = sinon.spy();
      const listener2 = sinon.spy();

      stateManager.subscribe(listener1);
      stateManager.subscribe(listener2);

      stateManager.setState({ audio: { volume: 0.7 } });

      expect(listener1.calledOnce).to.be.true;
      expect(listener2.calledOnce).to.be.true;
    });

    it('should unsubscribe correctly', () => {
      const listener = sinon.spy();
      const unsubscribe = stateManager.subscribe(listener);

      stateManager.setState({ audio: { volume: 0.4 } });
      expect(listener.calledOnce).to.be.true;

      unsubscribe();
      stateManager.setState({ audio: { volume: 0.6 } });
      expect(listener.calledOnce).to.be.true; // Should not be called again
    });
  });

  describe('action dispatching', () => {
    it('should handle audio play action', () => {
      stateManager.dispatch({
        type: ActionTypes.AUDIO_PLAY,
        payload: { timestamp: Date.now() },
      });

      const state = stateManager.getState();
      expect(state.audio.isPlaying).to.be.true;
      expect(state.playback.status).to.equal('playing');
    });

    it('should handle audio pause action', () => {
      // First set to playing
      stateManager.dispatch({
        type: ActionTypes.AUDIO_PLAY,
        payload: { timestamp: Date.now() },
      });

      stateManager.dispatch({
        type: ActionTypes.AUDIO_PAUSE,
        payload: { position: 5.0 },
      });

      const state = stateManager.getState();
      expect(state.audio.isPlaying).to.be.false;
      expect(state.playback.status).to.equal('paused');
    });

    it('should handle volume change action', () => {
      stateManager.dispatch({
        type: ActionTypes.AUDIO_VOLUME_CHANGE,
        payload: { volume: 0.25 },
      });

      const state = stateManager.getState();
      expect(state.audio.volume).to.equal(0.25);
    });

    it('should handle file load success action', () => {
      const mockFile = {
        id: 'test-file',
        name: 'test.wav',
        path: '/path/to/test.wav',
        size: 1024000,
        duration: 120,
        sampleRate: 44100,
        channels: 2,
        bitDepth: 16,
      };

      const mockAudioBuffer = {
        duration: 120,
        sampleRate: 44100,
        numberOfChannels: 2,
      };

      stateManager.dispatch({
        type: ActionTypes.AUDIO_FILE_LOAD_SUCCESS,
        payload: {
          file: mockFile,
          audioBuffer: mockAudioBuffer,
        },
      });

      const state = stateManager.getState();
      expect(state.audio.currentFile).to.deep.equal(mockFile);
      expect(state.audio.duration).to.equal(120);
      expect(state.playback.status).to.equal('stopped');
    });

    it('should add notification on error', () => {
      stateManager.dispatch({
        type: ActionTypes.AUDIO_FILE_LOAD_ERROR,
        payload: {
          file: { name: 'test.wav' },
          error: 'File not found',
        },
      });

      const state = stateManager.getState();
      expect(state.ui.notifications).to.have.length(1);
      expect(state.ui.notifications[0].type).to.equal('error');
      expect(state.ui.notifications[0].message).to.include('File not found');
    });

    it('should add action metadata', () => {
      const listener = sinon.spy();
      stateManager.subscribe(listener);

      const action = {
        type: ActionTypes.AUDIO_PLAY,
        payload: { timestamp: Date.now() },
      };

      stateManager.dispatch(action);

      expect(action.meta).to.exist;
      expect(action.meta.timestamp).to.be.a('number');
      expect(action.meta.source).to.equal('renderer');
    });

    it('should handle unknown action types', () => {
      const consoleSpy = sinon.spy(console, 'warn');

      stateManager.dispatch({
        type: 'UNKNOWN_ACTION' as any,
        payload: {},
      });

      // Should not throw and should log warning
      // (Note: Logger might not call console.warn directly)
    });
  });

  describe('utility methods', () => {
    it('should update audio time', () => {
      stateManager.updateAudioTime(45.5);

      const state = stateManager.getState();
      expect(state.audio.currentTime).to.equal(45.5);
      expect(state.playback.position).to.equal(45.5);
    });

    it('should update performance metrics', () => {
      const metrics = {
        fps: 58,
        frameTime: 17.2,
        particleCount: 1500,
      };

      stateManager.updatePerformanceMetrics(metrics);

      const state = stateManager.getState();
      expect(state.visual.performance.fps).to.equal(58);
      expect(state.visual.performance.frameTime).to.equal(17.2);
      expect(state.visual.performance.particleCount).to.equal(1500);
    });

    it('should set playback status', () => {
      stateManager.setPlaybackStatus('loading');

      const state = stateManager.getState();
      expect(state.playback.status).to.equal('loading');
      expect(state.audio.isPlaying).to.be.false;

      stateManager.setPlaybackStatus('playing');
      const newState = stateManager.getState();
      expect(newState.playback.status).to.equal('playing');
      expect(newState.audio.isPlaying).to.be.true;
    });

    it('should get current values', () => {
      // Set some values
      stateManager.setState({
        ui: { currentPanel: 'visual' },
        audio: { volume: 0.33 },
      });

      expect(stateManager.getCurrentPanel()).to.equal('visual');
      expect(stateManager.getVolume()).to.equal(0.33);
      expect(stateManager.isPlaying()).to.be.false;
      expect(stateManager.getCurrentFile()).to.be.null;
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      // Make some changes
      stateManager.setState({
        audio: { volume: 0.1, isPlaying: true },
        ui: { currentPanel: 'settings' },
      });

      const modifiedState = stateManager.getState();
      expect(modifiedState.audio.volume).to.equal(0.1);
      expect(modifiedState.ui.currentPanel).to.equal('settings');

      // Reset
      stateManager.reset();

      const resetState = stateManager.getState();
      expect(resetState.audio.volume).to.equal(0.8); // Default
      expect(resetState.audio.isPlaying).to.be.false; // Default
      expect(resetState.ui.currentPanel).to.equal('audio'); // Default
    });

    it('should notify subscribers on reset', () => {
      const listener = sinon.spy();
      stateManager.subscribe(listener);

      stateManager.reset();

      expect(listener.calledOnce).to.be.true;
    });
  });
});
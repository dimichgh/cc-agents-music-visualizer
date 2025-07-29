/**
 * State selectors for easy access to specific parts of the application state
 */

import { 
  AppState, 
  AudioState, 
  VisualState, 
  UIState, 
  PlaybackState,
  AudioFile,
  Notification,
  PerformanceMetrics,
  StateSelectors as IStateSelectors
} from '@/shared/types';

export class StateSelectors implements IStateSelectors {
  // Basic state getters
  getAudioState(state: AppState): AudioState {
    return state.audio;
  }

  getVisualState(state: AppState): VisualState {
    return state.visual;
  }

  getUIState(state: AppState): UIState {
    return state.ui;
  }

  getPlaybackState(state: AppState): PlaybackState {
    return state.playback;
  }

  // Audio selectors
  isPlaying(state: AppState): boolean {
    return state.audio.isPlaying;
  }

  getCurrentFile(state: AppState): AudioFile | null {
    return state.audio.currentFile;
  }

  getCurrentTime(state: AppState): number {
    return state.audio.currentTime;
  }

  getDuration(state: AppState): number {
    return state.audio.duration;
  }

  getVolume(state: AppState): number {
    return state.audio.volume;
  }

  getAudioFeatures(state: AppState): any {
    return state.audio.audioFeatures;
  }

  getFrequencyData(state: AppState): any {
    return state.audio.frequencyData;
  }

  getInstrumentData(state: AppState): any[] {
    return state.audio.instrumentData;
  }

  getBeatData(state: AppState): any {
    return state.audio.beatData;
  }

  // Visual selectors
  getCurrentVisualization(state: AppState): string {
    return state.visual.currentVisualization;
  }

  getVisualEffects(state: AppState): any[] {
    return state.visual.effects;
  }

  getEnabledEffects(state: AppState): any[] {
    return state.visual.effects.filter(effect => effect.enabled);
  }

  getParticles(state: AppState): any[] {
    return state.visual.particles;
  }

  getVisualIntensity(state: AppState): number {
    return state.visual.intensity;
  }

  getColorPalette(state: AppState): any {
    return state.visual.colors;
  }

  getPerformanceMetrics(state: AppState): PerformanceMetrics {
    return state.visual.performance;
  }

  // UI selectors
  getCurrentPanel(state: AppState): string {
    return state.ui.currentPanel;
  }

  getTheme(state: AppState): string {
    return state.ui.theme;
  }

  isFileDialogOpen(state: AppState): boolean {
    return state.ui.isFileDialogOpen;
  }

  isSettingsOpen(state: AppState): boolean {
    return state.ui.isSettingsOpen;
  }

  isVisualizationFullscreen(state: AppState): boolean {
    return state.ui.isVisualizationFullscreen;
  }

  getNotifications(state: AppState): Notification[] {
    return state.ui.notifications;
  }

  getActiveNotifications(state: AppState): Notification[] {
    return state.ui.notifications.filter(notification => 
      !notification.autoHide || 
      (Date.now() - notification.timestamp) < (notification.duration || 0)
    );
  }

  getErrorNotifications(state: AppState): Notification[] {
    return state.ui.notifications.filter(notification => notification.type === 'error');
  }

  // Playback selectors
  getPlaybackStatus(state: AppState): string {
    return state.playback.status;
  }

  getPlaybackPosition(state: AppState): number {
    return state.playback.position;
  }

  isLooping(state: AppState): boolean {
    return state.playback.loop;
  }

  isShuffling(state: AppState): boolean {
    return state.playback.shuffle;
  }

  getPlaylist(state: AppState): string[] {
    return state.playback.playlist;
  }

  getCurrentPlaylistIndex(state: AppState): number {
    return state.playback.currentIndex;
  }

  // Computed selectors
  getPlaybackProgress(state: AppState): number {
    const duration = this.getDuration(state);
    const currentTime = this.getCurrentTime(state);
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  }

  getFormattedCurrentTime(state: AppState): string {
    return this.formatTime(this.getCurrentTime(state));
  }

  getFormattedDuration(state: AppState): string {
    return this.formatTime(this.getDuration(state));
  }

  getFormattedTimeRemaining(state: AppState): string {
    const remaining = this.getDuration(state) - this.getCurrentTime(state);
    return this.formatTime(Math.max(0, remaining));
  }

  hasAudioFile(state: AppState): boolean {
    return this.getCurrentFile(state) !== null;
  }

  canPlay(state: AppState): boolean {
    return this.hasAudioFile(state) && !this.isLoading(state);
  }

  isLoading(state: AppState): boolean {
    return this.getPlaybackStatus(state) === 'loading';
  }

  isError(state: AppState): boolean {
    return this.getPlaybackStatus(state) === 'error';
  }

  isStopped(state: AppState): boolean {
    return this.getPlaybackStatus(state) === 'stopped';
  }

  isPaused(state: AppState): boolean {
    return this.getPlaybackStatus(state) === 'paused';
  }

  getFPS(state: AppState): number {
    return this.getPerformanceMetrics(state).fps;
  }

  getFrameTime(state: AppState): number {
    return this.getPerformanceMetrics(state).frameTime;
  }

  getRenderTime(state: AppState): number {
    return this.getPerformanceMetrics(state).renderTime;
  }

  getParticleCount(state: AppState): number {
    return this.getPerformanceMetrics(state).particleCount;
  }

  getMemoryUsage(state: AppState): number {
    return this.getPerformanceMetrics(state).memoryUsage;
  }

  getGPUMemoryUsage(state: AppState): number {
    return this.getPerformanceMetrics(state).gpuMemoryUsage;
  }

  getDrawCalls(state: AppState): number {
    return this.getPerformanceMetrics(state).drawCalls;
  }

  // Audio analysis selectors
  getBassLevel(state: AppState): number {
    const frequencyData = this.getFrequencyData(state);
    if (!frequencyData?.frequencies) return 0;
    
    // Calculate bass level from low frequency bins (20-250 Hz)
    const bassRange = frequencyData.frequencies.slice(0, 32);
    return bassRange.reduce((sum: number, val: number) => sum + val, 0) / bassRange.length;
  }

  getMidLevel(state: AppState): number {
    const frequencyData = this.getFrequencyData(state);
    if (!frequencyData?.frequencies) return 0;
    
    // Calculate mid level from mid frequency bins (250-4000 Hz)
    const midRange = frequencyData.frequencies.slice(32, 256);
    return midRange.reduce((sum: number, val: number) => sum + val, 0) / midRange.length;
  }

  getTrebleLevel(state: AppState): number {
    const frequencyData = this.getFrequencyData(state);
    if (!frequencyData?.frequencies) return 0;
    
    // Calculate treble level from high frequency bins (4000+ Hz)
    const trebleRange = frequencyData.frequencies.slice(256);
    return trebleRange.reduce((sum: number, val: number) => sum + val, 0) / trebleRange.length;
  }

  getCurrentTempo(state: AppState): number {
    const beatData = this.getBeatData(state);
    return beatData?.tempo || 0;
  }

  getRecentBeats(state: AppState): any[] {
    const beatData = this.getBeatData(state);
    if (!beatData?.beats) return [];
    
    const currentTime = this.getCurrentTime(state);
    return beatData.beats.filter((beat: any) => 
      Math.abs(beat.time - currentTime) <= 2.0 // Last 2 seconds
    );
  }

  getDominantInstruments(state: AppState): any[] {
    const instrumentData = this.getInstrumentData(state);
    return instrumentData
      .filter((instrument: any) => instrument.confidence > 0.5)
      .sort((a: any, b: any) => b.confidence - a.confidence)
      .slice(0, 3); // Top 3 most confident instruments
  }

  // Utility methods
  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Create singleton instance
export const stateSelectors = new StateSelectors();
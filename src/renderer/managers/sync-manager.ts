/**
 * Audio-Visual Synchronization Manager - Ensures precise timing between audio and visuals
 */

import { 
  ServiceInterface, 
  AudioFeatures,
  VisualEvent,
  MusicVisualizerError 
} from '@/shared/types';
import { Logger, AppLogger } from '@/shared/utils/logger';

export interface SyncManager {
  synchronizeAudioVisual(audioTime: number, visualTime: number): void;
  compensateLatency(latencyMs: number): void;
  scheduleVisualEvents(events: VisualEvent[]): void;
  maintainFrameRate(targetFPS: number): void;
  getAudioLatency(): number;
  getVisualLatency(): number;
  getSyncAccuracy(): number;
}

export class AudioVisualSyncManager implements SyncManager, ServiceInterface {
  private logger: Logger;
  private _isInitialized = false;
  private _isDisposed = false;

  // Timing and synchronization
  private audioContext: AudioContext;
  private visualClock: number = 0;
  private baseLatency: number = 0;
  private additionalLatency: number = 0;
  private frameInterval: number = 16.67; // 60 FPS default

  // Performance monitoring
  private performanceMonitor = {
    frameHistory: [] as number[],
    audioTimestamps: [] as number[],
    visualTimestamps: [] as number[],
    syncErrors: [] as number[],
    historySize: 120, // 2 seconds at 60fps
  };

  // Scheduled events
  private scheduledEvents: VisualEvent[] = [];
  private eventTolerance = 0.005; // 5ms tolerance

  // Adaptive sync parameters
  private syncConfig = {
    targetFPS: 60,
    maxSyncError: 0.02, // 20ms
    compensationFactor: 0.5,
    adaptiveThreshold: 0.01, // 10ms
    smoothingFactor: 0.9,
  };

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.logger = new AppLogger('SyncManager');
  }

  async initialize(): Promise<void> {
    if (this._isInitialized) {
      this.logger.warn('SyncManager already initialized');
      return;
    }

    this.logger.info('Initializing AudioVisualSyncManager...');

    try {
      // Measure base audio latency
      await this.measureBaseLatency();

      // Set up high-precision timing
      this.setupHighPrecisionTiming();

      // Initialize performance monitoring
      this.initializePerformanceMonitoring();

      this._isInitialized = true;
      this.logger.info(`SyncManager initialized with ${this.baseLatency}ms base latency`);
    } catch (error) {
      throw new MusicVisualizerError(
        'Failed to initialize sync manager',
        'SYNC_MANAGER_INIT_FAILED',
        'system',
        'high',
        { error: (error as Error).message }
      );
    }
  }

  private async measureBaseLatency(): Promise<void> {
    return new Promise((resolve) => {
      // Create a test tone to measure audio output latency
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Measure the time between scheduling and actual output
      const startTime = performance.now();
      const audioStartTime = this.audioContext.currentTime;
      
      oscillator.start(audioStartTime);
      oscillator.stop(audioStartTime + 0.001); // Very short tone
      
      // Estimate latency based on audio context
      // This is a simplified approach - real implementations might use more sophisticated methods
      this.baseLatency = this.audioContext.baseLatency * 1000 + 
                        this.audioContext.outputLatency * 1000;
      
      // Add some buffer for processing overhead
      this.baseLatency += 10; // 10ms buffer
      
      this.logger.debug(`Measured base latency: ${this.baseLatency}ms`);
      resolve();
    });
  }

  private setupHighPrecisionTiming(): void {
    // Use performance.now() for high-precision timing
    this.visualClock = performance.now();
    
    // Set frame interval based on target FPS
    this.frameInterval = 1000 / this.syncConfig.targetFPS;
  }

  private initializePerformanceMonitoring(): void {
    // Clear performance history
    this.performanceMonitor.frameHistory = [];
    this.performanceMonitor.audioTimestamps = [];
    this.performanceMonitor.visualTimestamps = [];
    this.performanceMonitor.syncErrors = [];
  }

  /**
   * Main synchronization method called each frame
   */
  synchronizeAudioVisual(audioTime: number, visualTime: number): void {
    if (!this._isInitialized) return;

    const currentTime = performance.now();
    
    // Update visual clock
    this.visualClock = currentTime;

    // Calculate sync error
    const totalLatency = this.baseLatency + this.additionalLatency;
    const compensatedAudioTime = audioTime + (totalLatency / 1000);
    const syncError = Math.abs(compensatedAudioTime - (visualTime / 1000));

    // Store performance data
    this.updatePerformanceHistory(audioTime, visualTime, syncError);

    // Apply adaptive compensation if needed
    if (syncError > this.syncConfig.adaptiveThreshold) {
      this.applyAdaptiveCompensation(syncError);
    }

    // Process scheduled visual events
    this.processScheduledEvents(compensatedAudioTime);
  }

  /**
   * Compensate for additional latency sources
   */
  compensateLatency(latencyMs: number): void {
    this.additionalLatency = latencyMs;
    this.logger.debug(`Additional latency compensation: ${latencyMs}ms`);
  }

  /**
   * Schedule visual events to sync with audio
   */
  scheduleVisualEvents(events: VisualEvent[]): void {
    // Add events to the schedule, sorted by timestamp
    this.scheduledEvents.push(...events);
    this.scheduledEvents.sort((a, b) => a.timestamp - b.timestamp);

    // Clean up old events
    const currentTime = this.audioContext.currentTime;
    this.scheduledEvents = this.scheduledEvents.filter(
      event => event.timestamp + event.duration > currentTime
    );

    this.logger.debug(`Scheduled ${events.length} visual events`);
  }

  /**
   * Maintain target frame rate
   */
  maintainFrameRate(targetFPS: number): void {
    this.syncConfig.targetFPS = targetFPS;
    this.frameInterval = 1000 / targetFPS;
    
    this.logger.debug(`Target frame rate set to ${targetFPS} FPS`);
  }

  /**
   * Process scheduled events that should trigger now
   */
  private processScheduledEvents(currentAudioTime: number): void {
    const triggeredEvents: VisualEvent[] = [];

    for (let i = 0; i < this.scheduledEvents.length; i++) {
      const event = this.scheduledEvents[i];
      const eventTime = event?.timestamp;
      
      // Check if event should trigger (within tolerance)
      if (eventTime !== undefined && Math.abs(currentAudioTime - eventTime) <= this.eventTolerance) {
        if (event) triggeredEvents.push(event);
        this.scheduledEvents.splice(i, 1);
        i--; // Adjust index after removal
      } else if (eventTime !== undefined && eventTime > currentAudioTime + this.eventTolerance) {
        // Events are sorted, so we can stop checking
        break;
      }
    }

    // Trigger events (this would be handled by the visualization manager)
    if (triggeredEvents.length > 0) {
      this.logger.debug(`Triggered ${triggeredEvents.length} visual events`);
      // In a complete implementation, these would be dispatched to the visualization system
    }
  }

  /**
   * Apply adaptive compensation based on sync error
   */
  private applyAdaptiveCompensation(syncError: number): void {
    // Calculate compensation adjustment
    const adjustment = syncError * this.syncConfig.compensationFactor * 1000; // Convert to ms
    
    // Apply smoothing to avoid oscillation
    this.additionalLatency = this.additionalLatency * this.syncConfig.smoothingFactor + 
                            adjustment * (1 - this.syncConfig.smoothingFactor);

    this.logger.debug(`Applied adaptive compensation: ${adjustment}ms (total: ${this.additionalLatency}ms)`);
  }

  /**
   * Update performance monitoring history
   */
  private updatePerformanceHistory(audioTime: number, visualTime: number, syncError: number): void {
    const currentTime = performance.now();

    // Add to history
    this.performanceMonitor.audioTimestamps.push(audioTime);
    this.performanceMonitor.visualTimestamps.push(visualTime);
    this.performanceMonitor.syncErrors.push(syncError);
    this.performanceMonitor.frameHistory.push(currentTime);

    // Trim history to size
    const maxSize = this.performanceMonitor.historySize;
    if (this.performanceMonitor.audioTimestamps.length > maxSize) {
      this.performanceMonitor.audioTimestamps.shift();
      this.performanceMonitor.visualTimestamps.shift();
      this.performanceMonitor.syncErrors.shift();
      this.performanceMonitor.frameHistory.shift();
    }
  }

  /**
   * Get current audio latency
   */
  getAudioLatency(): number {
    return this.baseLatency + this.additionalLatency;
  }

  /**
   * Get current visual latency (estimated)
   */
  getVisualLatency(): number {
    // Estimate visual latency based on frame rate
    return this.frameInterval / 2; // Half frame interval on average
  }

  /**
   * Get sync accuracy metrics
   */
  getSyncAccuracy(): number {
    if (this.performanceMonitor.syncErrors.length === 0) return 1.0;

    const avgError = this.performanceMonitor.syncErrors.reduce((sum, error) => sum + error, 0) / 
                    this.performanceMonitor.syncErrors.length;

    // Convert to accuracy percentage (0-1)
    const accuracy = Math.max(0, 1 - (avgError / this.syncConfig.maxSyncError));
    return accuracy;
  }

  /**
   * Get frame rate statistics
   */
  getFrameRateStats(): { current: number; average: number; stability: number } {
    const frameHistory = this.performanceMonitor.frameHistory;
    if (frameHistory.length < 2) {
      return { current: 0, average: 0, stability: 0 };
    }

    // Calculate frame intervals
    const intervals: number[] = [];
    for (let i = 1; i < frameHistory.length; i++) {
      const prev = frameHistory[i - 1];
      const curr = frameHistory[i];
      if (prev !== undefined && curr !== undefined) {
        intervals.push(curr - prev);
      }
    }

    // Current FPS (based on last interval)
    const lastInterval = intervals[intervals.length - 1];
    const currentFPS = lastInterval !== undefined ? 1000 / lastInterval : 0;

    // Average FPS
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const averageFPS = 1000 / avgInterval;

    // Frame rate stability (inverse of variance)
    const variance = intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stability = Math.max(0, 1 - (Math.sqrt(variance) / avgInterval));

    return {
      current: Math.round(currentFPS),
      average: Math.round(averageFPS),
      stability: Math.round(stability * 100) / 100,
    };
  }

  /**
   * Get detailed synchronization metrics
   */
  getSyncMetrics(): {
    audioLatency: number;
    visualLatency: number;
    totalLatency: number;
    syncAccuracy: number;
    avgSyncError: number;
    maxSyncError: number;
  } {
    const syncErrors = this.performanceMonitor.syncErrors;
    const avgSyncError = syncErrors.length > 0 ? 
      syncErrors.reduce((sum, error) => sum + error, 0) / syncErrors.length : 0;
    const maxSyncError = syncErrors.length > 0 ? Math.max(...syncErrors) : 0;

    return {
      audioLatency: this.baseLatency,
      visualLatency: this.getVisualLatency(),
      totalLatency: this.getAudioLatency() + this.getVisualLatency(),
      syncAccuracy: this.getSyncAccuracy(),
      avgSyncError: avgSyncError * 1000, // Convert to ms
      maxSyncError: maxSyncError * 1000, // Convert to ms
    };
  }

  /**
   * Configure synchronization parameters
   */
  configure(config: Partial<typeof this.syncConfig>): void {
    this.syncConfig = { ...this.syncConfig, ...config };
    this.frameInterval = 1000 / this.syncConfig.targetFPS;
    this.logger.debug('Sync configuration updated', this.syncConfig);
  }

  /**
   * Reset synchronization state
   */
  reset(): void {
    this.additionalLatency = 0;
    this.scheduledEvents = [];
    this.initializePerformanceMonitoring();
    this.logger.debug('Sync state reset');
  }

  public isInitialized(): boolean {
    return this._isInitialized;
  }

  public isDisposed(): boolean {
    return this._isDisposed;
  }

  public dispose(): void {
    if (this._isDisposed) return;

    this.logger.info('Disposing SyncManager...');

    // Clear scheduled events
    this.scheduledEvents = [];

    // Clear performance history
    this.initializePerformanceMonitoring();

    this._isDisposed = true;
    this.logger.info('SyncManager disposed');
  }
}
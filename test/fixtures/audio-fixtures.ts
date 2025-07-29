/**
 * Audio test fixtures and mock data
 */

export const SAMPLE_AUDIO_FILE = {
  id: 'test-audio-001',
  name: 'cosmic-symphony.wav',
  path: '/test/fixtures/cosmic-symphony.wav',
  size: 5242880, // 5MB
  duration: 180.5,
  sampleRate: 44100,
  channels: 2,
  bitDepth: 16,
  format: 'wav' as const,
  dateModified: new Date('2024-01-15T10:30:00Z'),
};

export const SAMPLE_AUDIO_METADATA = {
  duration: 180.5,
  sampleRate: 44100,
  channels: 2,
  bitDepth: 16,
  format: 'wav' as const,
  title: 'Cosmic Symphony',
  artist: 'Ethereal Composer',
  album: 'Psychedelic Frequencies',
  year: 2024,
  genre: 'Electronic',
};

export const SAMPLE_FREQUENCY_DATA = {
  frequencies: new Float32Array(1024),
  magnitudes: new Float32Array(1024),
  phases: new Float32Array(1024),
  bins: 1024,
  sampleRate: 44100,
  timestamp: 1642238400000,
};

export const SAMPLE_BEAT_EVENTS = [
  {
    timestamp: 1.234,
    energy: 0.85,
    type: 'kick' as const,
    confidence: 0.92,
  },
  {
    timestamp: 1.567,
    energy: 0.65,
    type: 'snare' as const,
    confidence: 0.78,
  },
  {
    timestamp: 1.890,
    energy: 0.45,
    type: 'hihat' as const,
    confidence: 0.65,
  },
];

export const SAMPLE_INSTRUMENT_DATA = [
  {
    type: 'piano' as const,
    confidence: 0.89,
    frequency: 440.0,
    amplitude: 0.75,
    timestamp: 1.234,
  },
  {
    type: 'guitar' as const,
    confidence: 0.67,
    frequency: 329.6,
    amplitude: 0.55,
    timestamp: 1.567,
  },
];

export const SAMPLE_AUDIO_FEATURES = {
  tempo: 128.5,
  key: 'C major' as const,
  energy: 0.78,
  danceability: 0.82,
  valence: 0.65,
  loudness: -8.5,
  spectralCentroid: 2500.5,
  spectralRolloff: 8000.0,
  zeroCrossingRate: 0.15,
  mfcc: new Float32Array([12.5, 8.2, 5.1, 3.8, 2.9, 2.1, 1.8, 1.5, 1.2, 1.0, 0.8, 0.6, 0.4]),
  chroma: new Float32Array([0.8, 0.2, 0.1, 0.3, 0.7, 0.9, 0.4, 0.5, 0.6, 0.3, 0.2, 0.1]),
};

/**
 * Create a mock audio buffer with specified parameters
 */
export function createMockAudioBuffer(
  duration: number = 10,
  sampleRate: number = 44100,
  numberOfChannels: number = 2
): AudioBuffer {
  const length = Math.floor(duration * sampleRate);
  
  return {
    duration,
    sampleRate,
    numberOfChannels,
    length,
    getChannelData: (channel: number) => {
      const data = new Float32Array(length);
      // Generate simple sine wave test data
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        data[i] = 0.5 * Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 0.1);
      }
      return data;
    },
    copyFromChannel: () => {},
    copyToChannel: () => {},
  } as AudioBuffer;
}

/**
 * Create a mock WAV file header
 */
export function createMockWAVHeader(
  fileSize: number = 44100 * 2 * 2 * 10, // 10 seconds stereo 16-bit
  sampleRate: number = 44100,
  channels: number = 2,
  bitsPerSample: number = 16
): ArrayBuffer {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  
  // RIFF header
  view.setUint32(0, 0x52494646, false); // 'RIFF'
  view.setUint32(4, fileSize - 8, true); // File size - 8
  view.setUint32(8, 0x57415645, false); // 'WAVE'
  
  // fmt chunk
  view.setUint32(12, 0x666d7420, false); // 'fmt '
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // Audio format (PCM)
  view.setUint16(22, channels, true); // Number of channels
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, sampleRate * channels * (bitsPerSample / 8), true); // Byte rate
  view.setUint16(32, channels * (bitsPerSample / 8), true); // Block align
  view.setUint16(34, bitsPerSample, true); // Bits per sample
  
  // data chunk
  view.setUint32(36, 0x64617461, false); // 'data'
  view.setUint32(40, fileSize - 44, true); // Data size
  
  return buffer;
}

/**
 * Create mock frequency spectrum data
 */
export function createMockFrequencySpectrum(
  bins: number = 1024,
  peakFrequency: number = 440
): Float32Array {
  const spectrum = new Float32Array(bins);
  const sampleRate = 44100;
  const peakBin = Math.floor((peakFrequency * bins * 2) / sampleRate);
  
  for (let i = 0; i < bins; i++) {
    // Create a spectrum with a peak at the specified frequency
    const distance = Math.abs(i - peakBin);
    spectrum[i] = Math.max(0, 1 - distance / 50) * (0.5 + 0.5 * Math.random());
  }
  
  return spectrum;
}

/**
 * Performance test data
 */
export const PERFORMANCE_METRICS = {
  fps: 60,
  frameTime: 16.67,
  particleCount: 2000,
  memoryUsage: 45.6,
  gpuMemoryUsage: 123.4,
  renderTime: 12.5,
  audioProcessingTime: 2.1,
};

/**
 * UI state fixtures
 */
export const SAMPLE_UI_STATE = {
  currentPanel: 'audio' as const,
  theme: 'cosmic' as const,
  isLoading: false,
  error: null,
  notifications: [],
  settings: {
    autoPlay: true,
    showFPS: false,
    particleDensity: 'medium' as const,
    colorScheme: 'cosmic' as const,
  },
};

/**
 * Visual state fixtures
 */
export const SAMPLE_VISUAL_STATE = {
  mode: 'cosmic' as const,
  intensity: 0.8,
  colorPalette: 'cosmic' as const,
  particleCount: 2000,
  particleDensity: 0.75,
  cosmicScale: 1.2,
  performance: PERFORMANCE_METRICS,
  settings: {
    enableParticles: true,
    enablePostProcessing: true,
    enableBloom: true,
    enableMotionBlur: false,
    quality: 'high' as const,
  },
};
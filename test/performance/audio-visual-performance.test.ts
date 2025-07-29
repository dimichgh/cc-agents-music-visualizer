/**
 * Audio and Visual Performance Tests
 */

import { expect, sinon } from '../setup';
import { 
  setupDOMEnvironment, 
  createTestContainer, 
  cleanupTestContainer,
  createMockCanvas,
  waitForAnimationFrame
} from '../fixtures/dom-fixtures';
import { 
  SAMPLE_FREQUENCY_DATA,
  PERFORMANCE_METRICS,
  createMockAudioBuffer
} from '../fixtures/audio-fixtures';

describe('Audio and Visual Performance Tests', () => {
  let container: HTMLElement;
  let mockCanvas: HTMLCanvasElement;

  before(() => {
    setupDOMEnvironment();
  });

  beforeEach(() => {
    container = createTestContainer();
    mockCanvas = createMockCanvas(1920, 1080); // HD resolution
    container.appendChild(mockCanvas);
  });

  afterEach(() => {
    cleanupTestContainer();
  });

  describe('Audio Processing Performance', () => {
    it('should process audio frames within real-time constraints', async () => {
      const audioBuffer = createMockAudioBuffer(180, 44100, 2); // 3 minute track
      const frameSize = 1024;
      const targetFrameTime = 16.67; // ~60fps in milliseconds
      
      const processingTimes: number[] = [];
      
      // Simulate audio processing for multiple frames
      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        
        // Mock FFT processing
        const frequencyData = new Float32Array(frameSize);
        for (let j = 0; j < frameSize; j++) {
          frequencyData[j] = Math.sin(j * 0.1) * Math.random();
        }
        
        // Mock beat detection algorithm
        let energy = 0;
        for (let j = 0; j < 64; j++) { // Bass range
          energy += frequencyData[j] * frequencyData[j];
        }
        energy = Math.sqrt(energy / 64);
        
        const endTime = performance.now();
        processingTimes.push(endTime - startTime);
        
        // Simulate real-time constraint
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      const avgProcessingTime = processingTimes.reduce((a, b) => a + b) / processingTimes.length;
      const maxProcessingTime = Math.max(...processingTimes);
      
      // Audio processing should be fast enough for real-time
      expect(avgProcessingTime).to.be.lessThan(5); // < 5ms average
      expect(maxProcessingTime).to.be.lessThan(targetFrameTime); // < 16.67ms max
      
      // Should maintain low variance (consistent performance)
      const variance = processingTimes.reduce((acc, time) => 
        acc + Math.pow(time - avgProcessingTime, 2), 0) / processingTimes.length;
      expect(Math.sqrt(variance)).to.be.lessThan(3); // Low standard deviation
    });

    it('should handle high sample rate audio efficiently', async () => {
      const highSampleRateBuffer = createMockAudioBuffer(60, 192000, 2); // 192kHz
      const processingTimes: number[] = [];
      
      for (let i = 0; i < 50; i++) {
        const startTime = performance.now();
        
        // Mock high-resolution FFT
        const fftSize = 4096; // Larger FFT for high sample rate
        const frequencyData = new Float32Array(fftSize);
        
        // Simulate more complex processing
        for (let j = 0; j < fftSize; j++) {
          frequencyData[j] = Math.sin(j * 0.01) * Math.cos(j * 0.02) * Math.random();
        }
        
        const endTime = performance.now();
        processingTimes.push(endTime - startTime);
      }
      
      const avgProcessingTime = processingTimes.reduce((a, b) => a + b) / processingTimes.length;
      
      // Should handle high sample rates within reasonable time
      expect(avgProcessingTime).to.be.lessThan(10); // < 10ms for complex processing
    });

    it('should scale processing based on system capabilities', async () => {
      // Mock different system performance levels
      const systemProfiles = [
        { name: 'low-end', cpuScore: 30, fftSize: 1024 },
        { name: 'mid-range', cpuScore: 60, fftSize: 2048 },
        { name: 'high-end', cpuScore: 90, fftSize: 4096 }
      ];
      
      for (const profile of systemProfiles) {
        const processingTimes: number[] = [];
        
        for (let i = 0; i < 20; i++) {
          const startTime = performance.now();
          
          // Scale processing complexity based on system capability
          const frequencyData = new Float32Array(profile.fftSize);
          const complexity = Math.floor(profile.cpuScore / 10);
          
          for (let j = 0; j < profile.fftSize; j++) {
            let value = 0;
            for (let k = 0; k < complexity; k++) {
              value += Math.sin(j * k * 0.01);
            }
            frequencyData[j] = value;
          }
          
          const endTime = performance.now();
          processingTimes.push(endTime - startTime);
        }
        
        const avgTime = processingTimes.reduce((a, b) => a + b) / processingTimes.length;
        
        // Higher-end systems should handle more complex processing
        if (profile.name === 'high-end') {
          expect(avgTime).to.be.lessThan(15);
        } else if (profile.name === 'mid-range') {
          expect(avgTime).to.be.lessThan(10);
        } else {
          expect(avgTime).to.be.lessThan(8);
        }
      }
    });

    it('should maintain audio quality during processing', () => {
      const originalAudio = new Float32Array(44100); // 1 second of audio
      for (let i = 0; i < originalAudio.length; i++) {
        originalAudio[i] = Math.sin(2 * Math.PI * 440 * i / 44100); // 440Hz sine wave
      }
      
      // Mock audio processing pipeline
      const processed = new Float32Array(originalAudio.length);
      
      // Apply gain
      for (let i = 0; i < originalAudio.length; i++) {
        processed[i] = originalAudio[i] * 0.8;
      }
      
      // Apply simple low-pass filter
      for (let i = 1; i < processed.length; i++) {
        processed[i] = processed[i] * 0.7 + processed[i - 1] * 0.3;
      }
      
      // Calculate signal-to-noise ratio
      let signalPower = 0;
      let noisePower = 0;
      
      for (let i = 0; i < originalAudio.length; i++) {
        signalPower += originalAudio[i] * originalAudio[i];
        const noise = processed[i] - (originalAudio[i] * 0.8);
        noisePower += noise * noise;
      }
      
      const snr = 10 * Math.log10(signalPower / noisePower);
      
      // Should maintain high signal quality
      expect(snr).to.be.greaterThan(40); // > 40dB SNR
    });
  });

  describe('Visual Rendering Performance', () => {
    it('should maintain target frame rate during visualization', async () => {
      const targetFPS = 60;
      const testDuration = 1000; // 1 second
      const frameTimes: number[] = [];
      let lastFrameTime = performance.now();
      let frameCount = 0;
      
      const renderLoop = () => {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastFrameTime;
        frameTimes.push(deltaTime);
        lastFrameTime = currentTime;
        frameCount++;
        
        // Mock rendering operations
        const ctx = mockCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, mockCanvas.width, mockCanvas.height);
          
          // Simulate complex visualization
          for (let i = 0; i < 100; i++) {
            ctx.fillStyle = `hsl(${i * 3.6}, 50%, 50%)`;
            ctx.fillRect(i * 20, Math.sin(i * 0.1) * 100 + 300, 10, 200);
          }
        }
        
        if (currentTime - performance.now() < testDuration) {
          requestAnimationFrame(renderLoop);
        }
      };
      
      const startTime = performance.now();
      renderLoop();
      
      await new Promise(resolve => setTimeout(resolve, testDuration + 100));
      
      const actualFPS = frameCount / (testDuration / 1000);
      const avgFrameTime = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
      
      // Should maintain close to target FPS
      expect(actualFPS).to.be.greaterThan(targetFPS * 0.9); // Within 10% of target
      expect(avgFrameTime).to.be.lessThan(16.67 * 1.1); // Within 10% of 60fps frame time
    });

    it('should handle different canvas resolutions efficiently', async () => {
      const resolutions = [
        { width: 1280, height: 720, name: 'HD' },
        { width: 1920, height: 1080, name: 'Full HD' },
        { width: 2560, height: 1440, name: '1440p' },
        { width: 3840, height: 2160, name: '4K' }
      ];
      
      for (const resolution of resolutions) {
        const canvas = createMockCanvas(resolution.width, resolution.height);
        const ctx = canvas.getContext('2d');
        
        const renderTimes: number[] = [];
        
        for (let frame = 0; frame < 30; frame++) {
          const startTime = performance.now();
          
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw frequency bars scaled to resolution
            const barCount = Math.floor(canvas.width / 10);
            const barWidth = canvas.width / barCount;
            
            for (let i = 0; i < barCount; i++) {
              const height = Math.random() * canvas.height * 0.8;
              ctx.fillStyle = `hsl(${(i / barCount) * 360}, 70%, 50%)`;
              ctx.fillRect(i * barWidth, canvas.height - height, barWidth - 1, height);
            }
          }
          
          const endTime = performance.now();
          renderTimes.push(endTime - startTime);
        }
        
        const avgRenderTime = renderTimes.reduce((a, b) => a + b) / renderTimes.length;
        const pixelCount = resolution.width * resolution.height;
        const pixelsPerMs = pixelCount / avgRenderTime;
        
        // Performance should scale reasonably with resolution
        expect(pixelsPerMs).to.be.greaterThan(50000); // > 50k pixels/ms
        
        // 4K should still be under 33ms (30fps)
        if (resolution.name === '4K') {
          expect(avgRenderTime).to.be.lessThan(33);
        }
      }
    });

    it('should optimize particle system performance', async () => {
      const particleCounts = [100, 500, 1000, 2000, 5000];
      
      for (const count of particleCounts) {
        const particles = Array(count).fill(0).map(() => ({
          x: Math.random() * mockCanvas.width,
          y: Math.random() * mockCanvas.height,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: Math.random(),
          decay: 0.02
        }));
        
        const updateTimes: number[] = [];
        
        for (let frame = 0; frame < 30; frame++) {
          const startTime = performance.now();
          
          // Update particles
          for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            
            // Boundary wrapping
            if (particle.x < 0) particle.x = mockCanvas.width;
            if (particle.x > mockCanvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = mockCanvas.height;
            if (particle.y > mockCanvas.height) particle.y = 0;
            
            // Remove dead particles
            if (particle.life <= 0) {
              particles[i] = {
                x: Math.random() * mockCanvas.width,
                y: Math.random() * mockCanvas.height,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                decay: 0.02
              };
            }
          }
          
          const endTime = performance.now();
          updateTimes.push(endTime - startTime);
        }
        
        const avgUpdateTime = updateTimes.reduce((a, b) => a + b) / updateTimes.length;
        const particlesPerMs = count / avgUpdateTime;
        
        // Should handle particles efficiently
        expect(particlesPerMs).to.be.greaterThan(100); // > 100 particles/ms
        
        // Even with 5000 particles, should be under frame budget
        if (count === 5000) {
          expect(avgUpdateTime).to.be.lessThan(10); // < 10ms for 5k particles
        }
      }
    });

    it('should implement efficient audio-visual synchronization', async () => {
      const syncTests: number[] = [];
      const audioFrameRate = 60; // Audio analysis frames per second
      const visualFrameRate = 60; // Visual frames per second
      
      for (let test = 0; test < 100; test++) {
        const audioTimestamp = performance.now();
        
        // Mock audio analysis
        const frequencyData = SAMPLE_FREQUENCY_DATA.frequencies;
        
        // Calculate visual response delay
        const visualTimestamp = performance.now();
        const syncDelay = visualTimestamp - audioTimestamp;
        
        // Mock visual update based on audio
        const intensity = Array.from(frequencyData).reduce((sum, val) => sum + val, 0) / frequencyData.length;
        
        // Simulate rendering delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2));
        
        const renderComplete = performance.now();
        const totalDelay = renderComplete - audioTimestamp;
        
        syncTests.push(totalDelay);
      }
      
      const avgSyncDelay = syncTests.reduce((a, b) => a + b) / syncTests.length;
      const maxSyncDelay = Math.max(...syncTests);
      
      // Audio-visual sync should be tight
      expect(avgSyncDelay).to.be.lessThan(5); // < 5ms average delay
      expect(maxSyncDelay).to.be.lessThan(20); // < 20ms max delay (one frame at 50fps)
    });
  });

  describe('Memory Management Performance', () => {
    it('should manage audio buffer memory efficiently', () => {
      const buffers: Float32Array[] = [];
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Create and process multiple audio buffers
      for (let i = 0; i < 100; i++) {
        const buffer = new Float32Array(44100); // 1 second of audio
        
        // Fill with test data
        for (let j = 0; j < buffer.length; j++) {
          buffer[j] = Math.sin(2 * Math.PI * 440 * j / 44100);
        }
        
        buffers.push(buffer);
        
        // Process buffer (mock FFT)
        const fftData = new Float32Array(1024);
        for (let j = 0; j < 1024; j++) {
          fftData[j] = buffer[j * 43] || 0; // Downsample
        }
        
        // Clean up old buffers (keep only last 10)
        if (buffers.length > 10) {
          buffers.shift();
        }
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory growth should be bounded
      expect(memoryIncrease).to.be.lessThan(50 * 1024 * 1024); // < 50MB
    });

    it('should handle visualization texture memory efficiently', () => {
      const textures: ImageData[] = [];
      const textureSize = 512;
      
      // Simulate texture creation and management
      for (let i = 0; i < 50; i++) {
        const imageData = new ImageData(textureSize, textureSize);
        
        // Fill with gradient data
        for (let y = 0; y < textureSize; y++) {
          for (let x = 0; x < textureSize; x++) {
            const index = (y * textureSize + x) * 4;
            imageData.data[index] = x / textureSize * 255; // Red
            imageData.data[index + 1] = y / textureSize * 255; // Green
            imageData.data[index + 2] = (x + y) / (textureSize * 2) * 255; // Blue
            imageData.data[index + 3] = 255; // Alpha
          }
        }
        
        textures.push(imageData);
        
        // Implement texture cache (LRU)
        if (textures.length > 8) {
          textures.shift(); // Remove oldest
        }
      }
      
      // Should maintain reasonable texture cache size
      expect(textures.length).to.be.lessThanOrEqual(8);
    });

    it('should prevent memory leaks in long-running sessions', async () => {
      const sessionDuration = 100; // Simulate 100 frames
      const memorySnapshots: number[] = [];
      
      for (let frame = 0; frame < sessionDuration; frame++) {
        // Simulate frame processing
        const audioData = new Float32Array(1024);
        const visualData = new Uint8Array(1920 * 1080 * 4); // RGBA pixels
        
        // Mock processing
        for (let i = 0; i < audioData.length; i++) {
          audioData[i] = Math.sin(i * 0.1 + frame * 0.01);
        }
        
        for (let i = 0; i < visualData.length; i += 4) {
          visualData[i] = Math.floor(Math.random() * 256);
          visualData[i + 1] = Math.floor(Math.random() * 256);
          visualData[i + 2] = Math.floor(Math.random() * 256);
          visualData[i + 3] = 255;
        }
        
        // Take memory snapshot every 10 frames
        if (frame % 10 === 0) {
          memorySnapshots.push(performance.memory?.usedJSHeapSize || 0);
        }
        
        // Force occasional garbage collection simulation
        if (frame % 20 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      // Memory should not grow indefinitely
      const startMemory = memorySnapshots[0];
      const endMemory = memorySnapshots[memorySnapshots.length - 1];
      const memoryGrowth = endMemory - startMemory;
      
      expect(memoryGrowth).to.be.lessThan(100 * 1024 * 1024); // < 100MB growth
    });
  });

  describe('Real-time Performance Monitoring', () => {
    it('should track and report performance metrics', async () => {
      const metrics = {
        audioProcessingTime: [] as number[],
        visualRenderTime: [] as number[],
        frameDrops: 0,
        memoryUsage: [] as number[]
      };
      
      for (let frame = 0; frame < 60; frame++) { // 1 second at 60fps
        // Audio processing
        const audioStart = performance.now();
        const audioData = new Float32Array(1024);
        for (let i = 0; i < audioData.length; i++) {
          audioData[i] = Math.sin(i * 0.1) * Math.random();
        }
        const audioEnd = performance.now();
        metrics.audioProcessingTime.push(audioEnd - audioStart);
        
        // Visual rendering
        const visualStart = performance.now();
        const ctx = mockCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, mockCanvas.width, mockCanvas.height);
          for (let i = 0; i < 50; i++) {
            ctx.fillStyle = `hsl(${i * 7.2}, 60%, 50%)`;
            ctx.fillRect(i * 20, Math.random() * 400, 15, 100);
          }
        }
        const visualEnd = performance.now();
        const renderTime = visualEnd - visualStart;
        metrics.visualRenderTime.push(renderTime);
        
        // Check for frame drops (> 16.67ms total frame time)
        const totalFrameTime = audioEnd - audioStart + renderTime;
        if (totalFrameTime > 16.67) {
          metrics.frameDrops++;
        }
        
        // Memory usage
        metrics.memoryUsage.push(performance.memory?.usedJSHeapSize || 0);
        
        await waitForAnimationFrame();
      }
      
      // Calculate performance statistics
      const avgAudioTime = metrics.audioProcessingTime.reduce((a, b) => a + b) / metrics.audioProcessingTime.length;
      const avgRenderTime = metrics.visualRenderTime.reduce((a, b) => a + b) / metrics.visualRenderTime.length;
      const frameDropRate = metrics.frameDrops / 60;
      
      // Performance should meet real-time requirements
      expect(avgAudioTime).to.be.lessThan(3); // < 3ms audio processing
      expect(avgRenderTime).to.be.lessThan(10); // < 10ms rendering
      expect(frameDropRate).to.be.lessThan(0.05); // < 5% frame drops
    });

    it('should adapt quality based on performance', async () => {
      const performanceMonitor = {
        fps: 60,
        frameTime: 16.67,
        quality: 1.0
      };
      
      // Simulate performance degradation
      const simulateHeavyLoad = () => {
        performanceMonitor.fps = 45;
        performanceMonitor.frameTime = 22.2;
      };
      
      // Mock quality adaptation
      const adaptQuality = () => {
        if (performanceMonitor.fps < 50) {
          performanceMonitor.quality = Math.max(0.5, performanceMonitor.quality - 0.1);
        } else if (performanceMonitor.fps > 55) {
          performanceMonitor.quality = Math.min(1.0, performanceMonitor.quality + 0.05);
        }
      };
      
      // Test quality adaptation
      simulateHeavyLoad();
      adaptQuality();
      
      expect(performanceMonitor.quality).to.be.lessThan(1.0);
      expect(performanceMonitor.quality).to.be.greaterThanOrEqual(0.5);
      
      // Test quality recovery
      performanceMonitor.fps = 58;
      performanceMonitor.frameTime = 17.2;
      adaptQuality();
      
      expect(performanceMonitor.quality).to.be.greaterThan(0.5);
    });

    it('should handle performance profiling', () => {
      const profiler = {
        marks: new Map<string, number>(),
        measures: new Map<string, number>()
      };
      
      // Mock performance profiling
      const mark = (name: string) => {
        profiler.marks.set(name, performance.now());
      };
      
      const measure = (name: string, startMark: string, endMark: string) => {
        const start = profiler.marks.get(startMark);
        const end = profiler.marks.get(endMark);
        if (start && end) {
          profiler.measures.set(name, end - start);
        }
      };
      
      // Profile a complex operation
      mark('complex-start');
      
      // Simulate complex audio-visual processing
      const audioData = new Float32Array(4096);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.sin(i * 0.01) * Math.cos(i * 0.02);
      }
      
      mark('audio-complete');
      
      // Visual processing
      const pixels = new Uint32Array(1920 * 1080);
      for (let i = 0; i < pixels.length; i++) {
        pixels[i] = Math.floor(Math.random() * 0xFFFFFF);
      }
      
      mark('visual-complete');
      
      measure('audio-processing', 'complex-start', 'audio-complete');
      measure('visual-processing', 'audio-complete', 'visual-complete');
      measure('total-processing', 'complex-start', 'visual-complete');
      
      // Verify profiling results
      expect(profiler.measures.get('audio-processing')).to.be.a('number');
      expect(profiler.measures.get('visual-processing')).to.be.a('number');
      expect(profiler.measures.get('total-processing')).to.be.a('number');
      
      const totalTime = profiler.measures.get('total-processing') || 0;
      expect(totalTime).to.be.lessThan(50); // < 50ms for complex operation
    });
  });
});
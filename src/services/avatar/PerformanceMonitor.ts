export interface PerformanceMetrics {
  fps: number;
  cpuUsage: number;
  memoryUsage: number;
  renderTime: number;
  audioLatency: number;
}

export interface DeviceCapabilities {
  maxTextureSize: number;
  maxVertexUniforms: number;
  maxFragmentUniforms: number;
  supportedExtensions: string[];
  hardwareConcurrency: number;
  deviceMemory?: number;
  connectionType?: string;
}

export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private frameStartTime = 0;
  private fps = 60;
  private renderTimes: number[] = [];
  private memoryUsage = 0;
  private cpuUsage = 0;
  private audioLatency = 0;

  private readonly maxRenderTimesSamples = 60; // Keep last 60 frame times
  private readonly updateInterval = 1000; // Update metrics every second
  private lastMetricsUpdate = 0;

  constructor() {
    this.detectDeviceCapabilities();
  }

  /**
   * Call at the start of each frame
   */
  startFrame(): void {
    this.frameStartTime = performance.now();
  }

  /**
   * Call at the end of each frame
   */
  endFrame(): void {
    const now = performance.now();
    const renderTime = now - this.frameStartTime;

    // Track render times
    this.renderTimes.push(renderTime);
    if (this.renderTimes.length > this.maxRenderTimesSamples) {
      this.renderTimes.shift();
    }

    this.frameCount++;

    // Update metrics periodically
    if (now - this.lastMetricsUpdate > this.updateInterval) {
      this.updateMetrics(now);
      this.lastMetricsUpdate = now;
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(currentTime: number): void {
    // Calculate FPS
    const deltaTime = currentTime - this.lastTime;
    this.fps = Math.round((this.frameCount * 1000) / deltaTime);

    // Reset counters
    this.frameCount = 0;
    this.lastTime = currentTime;

    // Calculate average render time
    if (this.renderTimes.length > 0) {
      const avgRenderTime = this.renderTimes.reduce((sum, time) => sum + time, 0) / this.renderTimes.length;
      // Estimate CPU usage based on render time (simplified)
      this.cpuUsage = Math.min(100, (avgRenderTime / 16.67) * 100); // 16.67ms = 60fps target
    }

    // Update memory usage if available
    this.updateMemoryUsage();
  }

  /**
   * Update memory usage metrics
   */
  private updateMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.memoryUsage = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
    } else {
      // Fallback estimation based on frame complexity
      this.memoryUsage = Math.min(100, this.renderTimes.length * 2);
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      fps: this.fps,
      cpuUsage: this.cpuUsage,
      memoryUsage: this.memoryUsage,
      renderTime: this.renderTimes.length > 0
        ? this.renderTimes[this.renderTimes.length - 1]
        : 0,
      audioLatency: this.audioLatency
    };
  }

  /**
   * Detect device capabilities for performance optimization
   */
  detectDeviceCapabilities(): DeviceCapabilities {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    const capabilities: DeviceCapabilities = {
      maxTextureSize: 1024,
      maxVertexUniforms: 128,
      maxFragmentUniforms: 128,
      supportedExtensions: [],
      hardwareConcurrency: navigator.hardwareConcurrency || 4
    };

    if (gl) {
      capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      capabilities.maxVertexUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
      capabilities.maxFragmentUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
      capabilities.supportedExtensions = gl.getSupportedExtensions() || [];
    }

    // Device memory (if available)
    if ('deviceMemory' in navigator) {
      capabilities.deviceMemory = (navigator as any).deviceMemory;
    }

    // Connection type (if available)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      capabilities.connectionType = connection.effectiveType || connection.type;
    }

    return capabilities;
  }

  /**
   * Get recommended performance mode based on device capabilities and current performance
   */
  getRecommendedPerformanceMode(): 'high' | 'medium' | 'low' | 'off' {
    const metrics = this.getMetrics();
    const capabilities = this.detectDeviceCapabilities();

    // Check if device is struggling
    if (metrics.fps < 15 || metrics.cpuUsage > 90 || metrics.memoryUsage > 85) {
      return 'off';
    }

    if (metrics.fps < 25 || metrics.cpuUsage > 70 || metrics.memoryUsage > 70) {
      return 'low';
    }

    if (metrics.fps < 45 || metrics.cpuUsage > 50 || metrics.memoryUsage > 50) {
      return 'medium';
    }

    // Check device capabilities
    if (capabilities.hardwareConcurrency < 4 ||
      (capabilities.deviceMemory && capabilities.deviceMemory < 4) ||
      capabilities.maxTextureSize < 2048) {
      return 'medium';
    }

    return 'high';
  }

  /**
   * Set audio latency measurement
   */
  setAudioLatency(latency: number): void {
    this.audioLatency = latency;
  }

  /**
   * Check if performance is degrading
   */
  isPerformanceDegrading(): boolean {
    const metrics = this.getMetrics();
    return metrics.fps < 20 || metrics.cpuUsage > 80 || metrics.memoryUsage > 80;
  }

  /**
   * Get performance optimization suggestions
   */
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const metrics = this.getMetrics();

    if (metrics.fps < 30) {
      suggestions.push('Consider reducing avatar quality or disabling lip sync');
    }

    if (metrics.cpuUsage > 70) {
      suggestions.push('High CPU usage detected - try lowering the update rate');
    }

    if (metrics.memoryUsage > 70) {
      suggestions.push('High memory usage - consider restarting the avatar system');
    }

    if (metrics.renderTime > 20) {
      suggestions.push('Slow rendering detected - try reducing visual effects');
    }

    if (metrics.audioLatency > 100) {
      suggestions.push('High audio latency - check audio system settings');
    }

    return suggestions;
  }

  /**
   * Reset performance metrics
   */
  reset(): void {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.renderTimes = [];
    this.fps = 60;
    this.cpuUsage = 0;
    this.memoryUsage = 0;
    this.audioLatency = 0;
    this.lastMetricsUpdate = 0;
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(callback: (metrics: PerformanceMetrics) => void): void {
    const monitor = () => {
      callback(this.getMetrics());
      requestAnimationFrame(monitor);
    };
    requestAnimationFrame(monitor);
  }

  /**
   * Log current performance state
   */
  logPerformanceState(): void {
    const metrics = this.getMetrics();
    const capabilities = this.detectDeviceCapabilities();

    console.group('Avatar Performance Metrics');
    console.log('FPS:', metrics.fps);
    console.log('CPU Usage:', `${metrics.cpuUsage}%`);
    console.log('Memory Usage:', `${metrics.memoryUsage}%`);
    console.log('Render Time:', `${metrics.renderTime.toFixed(2)}ms`);
    console.log('Audio Latency:', `${metrics.audioLatency}ms`);
    console.log('Recommended Mode:', this.getRecommendedPerformanceMode());
    console.log('Device Capabilities:', capabilities);

    const suggestions = this.getOptimizationSuggestions();
    if (suggestions.length > 0) {
      console.log('Optimization Suggestions:', suggestions);
    }
    console.groupEnd();
  }
}
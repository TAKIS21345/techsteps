import { PerformanceMonitor, PerformanceMetrics, DeviceCapabilities } from './PerformanceMonitor';

export interface OptimizationSettings {
  enableAutoOptimization: boolean;
  targetFPS: number;
  maxCPUUsage: number;
  maxMemoryUsage: number;
  optimizationInterval: number; // milliseconds
  aggressiveOptimization: boolean;
}

export interface OptimizationAction {
  type: 'performance_mode' | 'quality_reduction' | 'feature_disable' | 'restart_required';
  value: string;
  reason: string;
  impact: 'low' | 'medium' | 'high';
  reversible: boolean;
}

export class AutoOptimizer {
  private performanceMonitor: PerformanceMonitor;
  private settings: OptimizationSettings;
  private isRunning = false;
  private optimizationInterval: number | null = null;
  private performanceHistory: PerformanceMetrics[] = [];
  private lastOptimization = 0;
  private optimizationCallbacks: Array<(action: OptimizationAction) => void> = [];

  constructor(performanceMonitor: PerformanceMonitor, settings?: Partial<OptimizationSettings>) {
    this.performanceMonitor = performanceMonitor;
    this.settings = {
      enableAutoOptimization: true,
      targetFPS: 30,
      maxCPUUsage: 70,
      maxMemoryUsage: 75,
      optimizationInterval: 5000, // 5 seconds
      aggressiveOptimization: false,
      ...settings
    };
  }

  /**
   * Start automatic optimization
   */
  start(): void {
    if (this.isRunning || !this.settings.enableAutoOptimization) return;

    this.isRunning = true;
    this.optimizationInterval = window.setInterval(() => {
      this.checkAndOptimize();
    }, this.settings.optimizationInterval);

    console.log('AutoOptimizer started');
  }

  /**
   * Stop automatic optimization
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }

    console.log('AutoOptimizer stopped');
  }

  /**
   * Add callback for optimization actions
   */
  onOptimization(callback: (action: OptimizationAction) => void): void {
    this.optimizationCallbacks.push(callback);
  }

  /**
   * Remove optimization callback
   */
  removeOptimizationCallback(callback: (action: OptimizationAction) => void): void {
    const index = this.optimizationCallbacks.indexOf(callback);
    if (index > -1) {
      this.optimizationCallbacks.splice(index, 1);
    }
  }

  /**
   * Check performance and apply optimizations if needed
   */
  private checkAndOptimize(): void {
    const metrics = this.performanceMonitor.getMetrics();
    this.performanceHistory.push(metrics);

    // Keep only last 10 measurements
    if (this.performanceHistory.length > 10) {
      this.performanceHistory.shift();
    }

    // Don't optimize too frequently
    const now = Date.now();
    if (now - this.lastOptimization < this.settings.optimizationInterval * 2) {
      return;
    }

    const optimizations = this.analyzePerformance(metrics);
    
    if (optimizations.length > 0) {
      this.applyOptimizations(optimizations);
      this.lastOptimization = now;
    }
  }

  /**
   * Analyze current performance and suggest optimizations
   */
  private analyzePerformance(metrics: PerformanceMetrics): OptimizationAction[] {
    const actions: OptimizationAction[] = [];
    const avgMetrics = this.getAverageMetrics();

    // Check FPS performance
    if (avgMetrics.fps < this.settings.targetFPS) {
      if (avgMetrics.fps < 15) {
        actions.push({
          type: 'performance_mode',
          value: 'low',
          reason: `FPS too low (${Math.round(avgMetrics.fps)}) - switching to low quality`,
          impact: 'high',
          reversible: true
        });
      } else if (avgMetrics.fps < 25) {
        actions.push({
          type: 'performance_mode',
          value: 'medium',
          reason: `FPS below target (${Math.round(avgMetrics.fps)}) - reducing quality`,
          impact: 'medium',
          reversible: true
        });
      }
    }

    // Check CPU usage
    if (avgMetrics.cpuUsage > this.settings.maxCPUUsage) {
      if (avgMetrics.cpuUsage > 90) {
        actions.push({
          type: 'feature_disable',
          value: 'lip_sync',
          reason: `CPU usage critical (${Math.round(avgMetrics.cpuUsage)}%) - disabling lip sync`,
          impact: 'medium',
          reversible: true
        });
      } else if (avgMetrics.cpuUsage > 80) {
        actions.push({
          type: 'quality_reduction',
          value: 'reduce_update_rate',
          reason: `High CPU usage (${Math.round(avgMetrics.cpuUsage)}%) - reducing update rate`,
          impact: 'low',
          reversible: true
        });
      }
    }

    // Check memory usage
    if (avgMetrics.memoryUsage > this.settings.maxMemoryUsage) {
      if (avgMetrics.memoryUsage > 90) {
        actions.push({
          type: 'restart_required',
          value: 'memory_cleanup',
          reason: `Memory usage critical (${Math.round(avgMetrics.memoryUsage)}%) - restart recommended`,
          impact: 'high',
          reversible: false
        });
      } else if (avgMetrics.memoryUsage > 85) {
        actions.push({
          type: 'quality_reduction',
          value: 'reduce_texture_quality',
          reason: `High memory usage (${Math.round(avgMetrics.memoryUsage)}%) - reducing textures`,
          impact: 'medium',
          reversible: true
        });
      }
    }

    // Check render time
    if (avgMetrics.renderTime > 33) { // More than 33ms = less than 30fps
      actions.push({
        type: 'quality_reduction',
        value: 'reduce_polygon_count',
        reason: `Slow rendering (${avgMetrics.renderTime.toFixed(1)}ms) - reducing model complexity`,
        impact: 'medium',
        reversible: true
      });
    }

    // Device-specific optimizations
    const deviceCapabilities = this.performanceMonitor.detectDeviceCapabilities();
    const deviceOptimizations = this.getDeviceSpecificOptimizations(deviceCapabilities, metrics);
    actions.push(...deviceOptimizations);

    return actions;
  }

  /**
   * Get device-specific optimization recommendations
   */
  private getDeviceSpecificOptimizations(
    capabilities: DeviceCapabilities, 
    metrics: PerformanceMetrics
  ): OptimizationAction[] {
    const actions: OptimizationAction[] = [];

    // Low-end device detection
    if (capabilities.hardwareConcurrency <= 2 || 
        (capabilities.deviceMemory && capabilities.deviceMemory <= 2)) {
      actions.push({
        type: 'performance_mode',
        value: 'low',
        reason: 'Low-end device detected - using performance mode',
        impact: 'high',
        reversible: true
      });
    }

    // Mobile device optimizations
    if (capabilities.connectionType && 
        ['slow-2g', '2g', '3g'].includes(capabilities.connectionType)) {
      actions.push({
        type: 'quality_reduction',
        value: 'reduce_network_features',
        reason: 'Slow network detected - reducing network-dependent features',
        impact: 'low',
        reversible: true
      });
    }

    // WebGL capability checks
    if (capabilities.maxTextureSize < 1024) {
      actions.push({
        type: 'quality_reduction',
        value: 'reduce_texture_resolution',
        reason: 'Limited texture support - reducing resolution',
        impact: 'medium',
        reversible: true
      });
    }

    return actions;
  }

  /**
   * Apply optimization actions
   */
  private applyOptimizations(actions: OptimizationAction[]): void {
    // Sort by impact (high impact first for aggressive mode, low impact first for gentle mode)
    const sortedActions = actions.sort((a, b) => {
      const impactOrder = { low: 1, medium: 2, high: 3 };
      const aOrder = impactOrder[a.impact];
      const bOrder = impactOrder[b.impact];
      
      return this.settings.aggressiveOptimization ? bOrder - aOrder : aOrder - bOrder;
    });

    // Apply optimizations
    for (const action of sortedActions) {
      this.notifyOptimization(action);
      
      // In aggressive mode, apply all optimizations
      // In gentle mode, apply only the first (least impactful) optimization
      if (!this.settings.aggressiveOptimization) {
        break;
      }
    }
  }

  /**
   * Notify callbacks about optimization actions
   */
  private notifyOptimization(action: OptimizationAction): void {
    console.log(`AutoOptimizer: ${action.reason}`);
    
    this.optimizationCallbacks.forEach(callback => {
      try {
        callback(action);
      } catch (error) {
        console.error('Error in optimization callback:', error);
      }
    });
  }

  /**
   * Get average metrics from recent history
   */
  private getAverageMetrics(): PerformanceMetrics {
    if (this.performanceHistory.length === 0) {
      return this.performanceMonitor.getMetrics();
    }

    const sum = this.performanceHistory.reduce((acc, metrics) => ({
      fps: acc.fps + metrics.fps,
      cpuUsage: acc.cpuUsage + metrics.cpuUsage,
      memoryUsage: acc.memoryUsage + metrics.memoryUsage,
      renderTime: acc.renderTime + metrics.renderTime,
      audioLatency: acc.audioLatency + metrics.audioLatency
    }), { fps: 0, cpuUsage: 0, memoryUsage: 0, renderTime: 0, audioLatency: 0 });

    const count = this.performanceHistory.length;
    return {
      fps: sum.fps / count,
      cpuUsage: sum.cpuUsage / count,
      memoryUsage: sum.memoryUsage / count,
      renderTime: sum.renderTime / count,
      audioLatency: sum.audioLatency / count
    };
  }

  /**
   * Update optimization settings
   */
  updateSettings(newSettings: Partial<OptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    // Restart if optimization interval changed
    if (newSettings.optimizationInterval && this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get current settings
   */
  getSettings(): OptimizationSettings {
    return { ...this.settings };
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(): PerformanceMetrics[] {
    return [...this.performanceHistory];
  }

  /**
   * Clear performance history
   */
  clearHistory(): void {
    this.performanceHistory = [];
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): {
    totalOptimizations: number;
    lastOptimization: number;
    averagePerformance: PerformanceMetrics;
    isOptimal: boolean;
  } {
    const avgMetrics = this.getAverageMetrics();
    const isOptimal = avgMetrics.fps >= this.settings.targetFPS &&
                     avgMetrics.cpuUsage <= this.settings.maxCPUUsage &&
                     avgMetrics.memoryUsage <= this.settings.maxMemoryUsage;

    return {
      totalOptimizations: this.optimizationCallbacks.length,
      lastOptimization: this.lastOptimization,
      averagePerformance: avgMetrics,
      isOptimal
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stop();
    this.optimizationCallbacks = [];
    this.performanceHistory = [];
  }
}
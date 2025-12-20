interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  deviceInfo?: {
    hardwareConcurrency: number;
    deviceMemory?: number;
    connection?: string;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isLowEndDevice: boolean;

  constructor() {
    this.isLowEndDevice = this.detectLowEndDevice();
    this.setupPerformanceObserver();
  }

  private detectLowEndDevice(): boolean {
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    const deviceMemory = (navigator as any).deviceMemory || 2;
    return hardwareConcurrency <= 2 || deviceMemory <= 2;
  }

  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric(entry.name, entry.duration || entry.startTime);
          }
        });

        observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }
  }

  recordMetric(name: string, value: number): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      deviceInfo: {
        hardwareConcurrency: navigator.hardwareConcurrency || 1,
        deviceMemory: (navigator as any).deviceMemory,
        connection: (navigator as any).connection?.effectiveType
      }
    };

    this.metrics.push(metric);

    // Log performance issues for low-end devices
    if (this.isLowEndDevice && value > 3000) {
      console.warn(`Performance issue detected on low-end device: ${name} took ${value}ms`);
    }

    // Keep only last 100 metrics to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  measureLandingPageLoad(): void {
    if (performance.mark) {
      performance.mark('landing-page-start');
      
      // Measure when all critical content is loaded
      window.addEventListener('load', () => {
        performance.mark('landing-page-end');
        performance.measure('landing-page-load', 'landing-page-start', 'landing-page-end');
      });
    }
  }

  measureAnimationPerformance(animationName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      this.recordMetric(`animation-${animationName}`, endTime - startTime);
    };
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getAverageLoadTime(): number {
    const loadMetrics = this.metrics.filter(m => m.name.includes('load'));
    if (loadMetrics.length === 0) return 0;
    
    const total = loadMetrics.reduce((sum, metric) => sum + metric.value, 0);
    return total / loadMetrics.length;
  }

  isSlowDevice(): boolean {
    return this.isLowEndDevice;
  }
}

export const performanceMonitor = new PerformanceMonitor();
export default PerformanceMonitor;
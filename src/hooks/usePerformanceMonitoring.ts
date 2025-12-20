import { useEffect, useRef } from 'react';
import { performanceMonitor } from '../utils/performanceMonitor';

/**
 * Hook for consistent performance monitoring across React components
 * Designed for senior-friendly applications where performance is critical
 */
export function usePerformanceMonitoring(componentName: string) {
  const renderStartTime = useRef<number>();
  const tracker = useRef(performanceMonitor.trackComponentPerformance());

  useEffect(() => {
    // Start tracking when component mounts
    tracker.current.startTracking(componentName);
    renderStartTime.current = performance.now();

    return () => {
      // End tracking when component unmounts
      tracker.current.endTracking(componentName);
    };
  }, [componentName]);

  // Function to manually track specific operations within the component
  const trackOperation = (operationName: string) => {
    const measure = performanceMonitor.measureAsyncOperation(`${componentName}_${operationName}`);
    return measure;
  };

  // Function to get current component metrics
  const getMetrics = () => {
    return tracker.current.getComponentMetrics(componentName);
  };

  // Function to mark render complete (useful for complex components)
  const markRenderComplete = () => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      if (renderTime > 50) { // 50ms threshold for senior-friendly performance
        console.log(`${componentName} render completed in ${renderTime.toFixed(2)}ms`);
      }
    }
  };

  return {
    trackOperation,
    getMetrics,
    markRenderComplete,
  };
}

/**
 * Hook for monitoring page-level performance
 */
export function usePagePerformanceMonitoring(pageName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    // Track page load performance
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      console.log(`Page ${pageName} loaded in ${loadTime.toFixed(2)}ms`);
      
      // Alert if page loads slowly (important for seniors)
      if (loadTime > 2000) {
        console.warn(`Slow page load detected for ${pageName}: ${loadTime.toFixed(2)}ms`);
      }
    };

    // Track when page becomes interactive
    const handleInteractive = () => {
      const interactiveTime = performance.now() - startTime;
      console.log(`Page ${pageName} became interactive in ${interactiveTime.toFixed(2)}ms`);
    };

    window.addEventListener('load', handleLoad);
    document.addEventListener('DOMContentLoaded', handleInteractive);

    return () => {
      window.removeEventListener('load', handleLoad);
      document.removeEventListener('DOMContentLoaded', handleInteractive);
    };
  }, [pageName]);
}
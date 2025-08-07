import { useCallback, useMemo, useRef, useEffect } from 'react';
import { LogiopsConfiguration, Device } from '../types/logiops';

interface PerformanceMetrics {
  renderTime: number;
  deviceCount: number;
  configSize: number;
  lastUpdate: Date;
}

export const usePerformanceOptimization = (configuration: LogiopsConfiguration | null) => {
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    deviceCount: 0,
    configSize: 0,
    lastUpdate: new Date()
  });

  const renderStartTime = useRef<number>(0);

  // Start performance measurement
  const startPerformanceMeasurement = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  // End performance measurement
  const endPerformanceMeasurement = useCallback(() => {
    if (renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      metricsRef.current = {
        ...metricsRef.current,
        renderTime,
        lastUpdate: new Date()
      };
      renderStartTime.current = 0;
    }
  }, []);

  // Memoized configuration metrics
  const configMetrics = useMemo(() => {
    if (!configuration) {
      return {
        deviceCount: 0,
        configSize: 0,
        isLargeConfig: false,
        shouldVirtualize: false
      };
    }

    const deviceCount = configuration.devices.length;
    const configSize = JSON.stringify(configuration).length;
    const isLargeConfig = deviceCount > 10 || configSize > 50000; // 50KB threshold
    const shouldVirtualize = deviceCount > 20;

    metricsRef.current = {
      ...metricsRef.current,
      deviceCount,
      configSize
    };

    return {
      deviceCount,
      configSize,
      isLargeConfig,
      shouldVirtualize
    };
  }, [configuration]);

  // Debounced update function for large configurations
  const debouncedUpdate = useCallback(
    debounce((callback: () => void) => {
      if (configMetrics.isLargeConfig) {
        // Use requestIdleCallback for large configs if available
        if ('requestIdleCallback' in window) {
          requestIdleCallback(callback);
        } else {
          setTimeout(callback, 0);
        }
      } else {
        callback();
      }
    }, configMetrics.isLargeConfig ? 300 : 100),
    [configMetrics.isLargeConfig]
  );

  // Virtualization helper for large device lists
  const getVisibleDevices = useCallback(
    (devices: Device[], startIndex: number = 0, count: number = 50): Device[] => {
      if (!configMetrics.shouldVirtualize) {
        return devices;
      }
      return devices.slice(startIndex, startIndex + count);
    },
    [configMetrics.shouldVirtualize]
  );

  // Memory usage optimization
  const optimizeMemoryUsage = useCallback(() => {
    if (configMetrics.isLargeConfig) {
      // Force garbage collection if available (development only)
      if (process.env.NODE_ENV === 'development' && 'gc' in window) {
        (window as any).gc();
      }
    }
  }, [configMetrics.isLargeConfig]);

  // Performance monitoring
  useEffect(() => {
    if (configMetrics.isLargeConfig) {
      console.log('Large configuration detected:', {
        deviceCount: configMetrics.deviceCount,
        configSize: `${(configMetrics.configSize / 1024).toFixed(2)}KB`,
        renderTime: `${metricsRef.current.renderTime.toFixed(2)}ms`
      });
    }
  }, [configMetrics]);

  return {
    metrics: metricsRef.current,
    configMetrics,
    startPerformanceMeasurement,
    endPerformanceMeasurement,
    debouncedUpdate,
    getVisibleDevices,
    optimizeMemoryUsage
  };
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Hook for optimized rendering of large lists
export const useVirtualizedList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const totalHeight = items.length * itemHeight;

  const getVisibleRange = useCallback(
    (scrollTop: number) => {
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const endIndex = Math.min(
        items.length - 1,
        startIndex + visibleCount + overscan * 2
      );
      return { startIndex, endIndex };
    },
    [items.length, itemHeight, visibleCount, overscan]
  );

  const getVisibleItems = useCallback(
    (scrollTop: number) => {
      const { startIndex, endIndex } = getVisibleRange(scrollTop);
      return {
        items: items.slice(startIndex, endIndex + 1),
        startIndex,
        endIndex,
        offsetY: startIndex * itemHeight
      };
    },
    [items, getVisibleRange, itemHeight]
  );

  return {
    totalHeight,
    getVisibleItems,
    getVisibleRange
  };
};
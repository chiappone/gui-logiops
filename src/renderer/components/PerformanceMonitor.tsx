import React, { useState, useEffect } from "react";
import { usePerformanceOptimization } from "../hooks/usePerformanceOptimization";
import { useConfiguration } from "../context/AppStateContext";

interface PerformanceMonitorProps {
  show?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  show = false,
}) => {
  const { configuration } = useConfiguration();
  const { metrics, configMetrics } = usePerformanceOptimization(configuration);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);

  useEffect(() => {
    // Monitor memory usage if available
    const updateMemoryUsage = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        setMemoryUsage(memory.usedJSHeapSize / 1024 / 1024); // Convert to MB
      }
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!show && !configMetrics.isLargeConfig) {
    return null;
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  const getPerformanceStatus = () => {
    if (metrics.renderTime > 100) return "warning";
    if (configMetrics.deviceCount > 20) return "warning";
    if (memoryUsage > 100) return "warning";
    return "good";
  };

  const status = getPerformanceStatus();

  return (
    <div
      className={`performance-indicator ${
        status === "warning" ? "performance-warning" : ""
      }`}
    >
      <div className="performance-metrics">
        <div>Devices: {configMetrics.deviceCount}</div>
        <div>Config: {formatSize(configMetrics.configSize)}</div>
        <div>Render: {metrics.renderTime.toFixed(1)}ms</div>
        {memoryUsage > 0 && <div>Memory: {memoryUsage.toFixed(1)}MB</div>}
        {configMetrics.isLargeConfig && (
          <div className="performance-warning">Large Config</div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor;

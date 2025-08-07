import React, { useState, useEffect } from "react";
import {
  systemIntegrationService,
  SystemStatus,
} from "../services/systemIntegration";
import { useConfiguration } from "../context/AppStateContext";

interface SystemStatusPanelProps {
  className?: string;
}

export const SystemStatusPanel: React.FC<SystemStatusPanelProps> = ({
  className,
}) => {
  const { configuration } = useConfiguration();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [operationInProgress, setOperationInProgress] = useState<string | null>(
    null
  );
  const [permissions, setPermissions] = useState<{
    hasPermissions: boolean;
    suggestions: string[];
  } | null>(null);

  useEffect(() => {
    checkSystemStatus();
    checkPermissions();
  }, []);

  const checkSystemStatus = async () => {
    setLoading(true);
    try {
      const status = await systemIntegrationService.checkSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error("Failed to check system status:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    try {
      const permissionResult =
        await systemIntegrationService.checkPermissions();
      setPermissions(permissionResult);
    } catch (error) {
      console.error("Failed to check permissions:", error);
    }
  };

  const handleStartService = async () => {
    setOperationInProgress("starting");
    try {
      const result = await systemIntegrationService.startLogidService();
      if (result.success) {
        await checkSystemStatus(); // Refresh status
      } else {
        alert(`Failed to start logid service: ${result.error}`);
      }
    } catch (error) {
      alert(`Failed to start logid service: ${error}`);
    } finally {
      setOperationInProgress(null);
    }
  };

  const handleStopService = async () => {
    setOperationInProgress("stopping");
    try {
      const result = await systemIntegrationService.stopLogidService();
      if (result.success) {
        await checkSystemStatus(); // Refresh status
      } else {
        alert(`Failed to stop logid service: ${result.error}`);
      }
    } catch (error) {
      alert(`Failed to stop logid service: ${error}`);
    } finally {
      setOperationInProgress(null);
    }
  };

  const handleRefresh = () => {
    checkSystemStatus();
    checkPermissions();
  };

  const handleDeployConfiguration = async () => {
    if (!configuration) {
      alert("No configuration to deploy");
      return;
    }

    setOperationInProgress("deploying");
    try {
      const result = await systemIntegrationService.deployConfiguration(
        configuration
      );
      if (result.success) {
        alert(`Configuration deployed successfully to ${result.deployedPath}`);
        await checkSystemStatus(); // Refresh status
      } else {
        alert(`Failed to deploy configuration: ${result.error}`);
      }
    } catch (error) {
      alert(`Failed to deploy configuration: ${error}`);
    } finally {
      setOperationInProgress(null);
    }
  };

  if (loading) {
    return (
      <div className={`system-status-panel ${className || ""}`}>
        <div className="system-status-header">
          <h3>System Status</h3>
        </div>
        <div className="system-status-loading">
          <div className="loading-spinner"></div>
          <span>Checking system status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`system-status-panel ${className || ""}`}>
      <div className="system-status-header">
        <h3>System Status</h3>
        <button
          className="refresh-button"
          onClick={handleRefresh}
          disabled={operationInProgress !== null}
        >
          🔄 Refresh
        </button>
      </div>

      {systemStatus && (
        <div className="system-status-content">
          {/* Logid Installation Status */}
          <div className="status-section">
            <h4>Logid Daemon</h4>
            <div className="status-item">
              <span className="status-label">Installed:</span>
              <span
                className={`status-value ${
                  systemStatus.logidInstalled ? "success" : "error"
                }`}
              >
                {systemStatus.logidInstalled ? "✓ Yes" : "✗ No"}
              </span>
            </div>

            {systemStatus.logidVersion && (
              <div className="status-item">
                <span className="status-label">Version:</span>
                <span className="status-value">
                  {systemStatus.logidVersion}
                </span>
              </div>
            )}

            <div className="status-item">
              <span className="status-label">Running:</span>
              <span
                className={`status-value ${
                  systemStatus.logidRunning ? "success" : "warning"
                }`}
              >
                {systemStatus.logidRunning ? "✓ Yes" : "✗ No"}
              </span>
            </div>

            {systemStatus.logidInstalled && (
              <div className="service-controls">
                <button
                  className="service-button start"
                  onClick={handleStartService}
                  disabled={
                    systemStatus.logidRunning ||
                    operationInProgress === "starting"
                  }
                >
                  {operationInProgress === "starting"
                    ? "Starting..."
                    : "Start Service"}
                </button>
                <button
                  className="service-button stop"
                  onClick={handleStopService}
                  disabled={
                    !systemStatus.logidRunning ||
                    operationInProgress === "stopping"
                  }
                >
                  {operationInProgress === "stopping"
                    ? "Stopping..."
                    : "Stop Service"}
                </button>
              </div>
            )}
          </div>

          {/* Configuration Path */}
          <div className="status-section">
            <h4>Configuration</h4>
            <div className="status-item">
              <span className="status-label">Config Path:</span>
              <span className="status-value config-path">
                {systemStatus.configPath}
              </span>
            </div>

            {configuration && (
              <div className="deploy-controls">
                <button
                  className="deploy-button"
                  onClick={handleDeployConfiguration}
                  disabled={operationInProgress === "deploying"}
                >
                  {operationInProgress === "deploying"
                    ? "Deploying..."
                    : "Deploy Configuration"}
                </button>
                <p className="deploy-help">
                  Deploy the current configuration to the system location where
                  logid can find it.
                </p>
              </div>
            )}
          </div>

          {/* System Integration */}
          <div className="status-section">
            <h4>System Integration</h4>
            <div className="status-item">
              <span className="status-label">Systemd Available:</span>
              <span
                className={`status-value ${
                  systemStatus.systemdAvailable ? "success" : "warning"
                }`}
              >
                {systemStatus.systemdAvailable ? "✓ Yes" : "✗ No"}
              </span>
            </div>

            <div className="status-item">
              <span className="status-label">Permissions:</span>
              <span
                className={`status-value ${
                  systemStatus.hasPermissions ? "success" : "error"
                }`}
              >
                {systemStatus.hasPermissions ? "✓ OK" : "✗ Limited"}
              </span>
            </div>
          </div>

          {/* Permission Issues and Suggestions */}
          {permissions &&
            !permissions.hasPermissions &&
            permissions.suggestions.length > 0 && (
              <div className="status-section">
                <h4>Permission Issues</h4>
                <div className="permission-suggestions">
                  {permissions.suggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion-item">
                      <span className="suggestion-icon">⚠️</span>
                      <span className="suggestion-text">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Installation Guide */}
          {!systemStatus.logidInstalled && (
            <div className="status-section">
              <h4>Installation Guide</h4>
              <div className="installation-guide">
                <p>
                  Logid is not installed on your system. To use this GUI, you
                  need to install logiops first:
                </p>
                <ol>
                  <li>
                    Visit the{" "}
                    <a
                      href="https://github.com/PixlOne/logiops"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      logiops GitHub repository
                    </a>
                  </li>
                  <li>
                    Follow the installation instructions for your Linux
                    distribution
                  </li>
                  <li>Restart this application after installation</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

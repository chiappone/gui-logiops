import React, { useState } from 'react';
import { ValidationError } from '../types/logiops';

interface ErrorSummaryPanelProps {
  errors: ValidationError[];
  warnings: ValidationError[];
  onErrorClick?: (error: ValidationError) => void;
  className?: string;
}

const ErrorSummaryPanel: React.FC<ErrorSummaryPanelProps> = ({
  errors,
  warnings,
  onErrorClick,
  className = ''
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'errors' | 'warnings'>('errors');

  const totalIssues = errors.length + warnings.length;

  if (totalIssues === 0) {
    return (
      <div className={`error-summary-panel success ${className}`}>
        <div className="summary-header">
          <span className="summary-icon success-icon">✅</span>
          <span className="summary-title">Configuration Valid</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`error-summary-panel ${className} ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="summary-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <span className="summary-icon">
          {errors.length > 0 ? '❌' : '⚠️'}
        </span>
        <span className="summary-title">
          {errors.length > 0 ? 'Configuration Issues' : 'Configuration Warnings'}
        </span>
        <span className="summary-count">
          {errors.length > 0 && `${errors.length} error${errors.length !== 1 ? 's' : ''}`}
          {errors.length > 0 && warnings.length > 0 && ', '}
          {warnings.length > 0 && `${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`}
        </span>
        <button className="collapse-button" type="button">
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="summary-content">
          <div className="summary-tabs">
            {errors.length > 0 && (
              <button
                className={`tab-button ${activeTab === 'errors' ? 'active' : ''}`}
                onClick={() => setActiveTab('errors')}
              >
                Errors ({errors.length})
              </button>
            )}
            {warnings.length > 0 && (
              <button
                className={`tab-button ${activeTab === 'warnings' ? 'active' : ''}`}
                onClick={() => setActiveTab('warnings')}
              >
                Warnings ({warnings.length})
              </button>
            )}
          </div>

          <div className="summary-list">
            {activeTab === 'errors' && errors.map((error, index) => (
              <div
                key={`error-${index}`}
                className="summary-item error-item"
                onClick={() => onErrorClick?.(error)}
              >
                <span className="item-icon">❌</span>
                <div className="item-content">
                  <div className="item-path">{error.path}</div>
                  <div className="item-message">{error.message}</div>
                </div>
              </div>
            ))}

            {activeTab === 'warnings' && warnings.map((warning, index) => (
              <div
                key={`warning-${index}`}
                className="summary-item warning-item"
                onClick={() => onErrorClick?.(warning)}
              >
                <span className="item-icon">⚠️</span>
                <div className="item-content">
                  <div className="item-path">{warning.path}</div>
                  <div className="item-message">{warning.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorSummaryPanel;
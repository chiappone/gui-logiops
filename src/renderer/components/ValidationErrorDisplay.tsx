import React from 'react';
import { ValidationError } from '../types/logiops';

interface ValidationErrorDisplayProps {
  errors: ValidationError[];
  warnings: ValidationError[];
  className?: string;
}

const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({
  errors,
  warnings,
  className = ''
}) => {
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className={`validation-display ${className}`}>
      {errors.length > 0 && (
        <div className="validation-errors">
          <div className="validation-header">
            <span className="validation-icon error-icon">⚠️</span>
            <h4>Configuration Errors ({errors.length})</h4>
          </div>
          <ul className="validation-list">
            {errors.map((error, index) => (
              <li key={index} className="validation-item error-item">
                <span className="validation-path">{error.path}:</span>
                <span className="validation-message">{error.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="validation-warnings">
          <div className="validation-header">
            <span className="validation-icon warning-icon">⚡</span>
            <h4>Configuration Warnings ({warnings.length})</h4>
          </div>
          <ul className="validation-list">
            {warnings.map((warning, index) => (
              <li key={index} className="validation-item warning-item">
                <span className="validation-path">{warning.path}:</span>
                <span className="validation-message">{warning.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ValidationErrorDisplay;
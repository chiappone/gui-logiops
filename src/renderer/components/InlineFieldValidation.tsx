import React from 'react';
import { ValidationError } from '../types/logiops';

interface InlineFieldValidationProps {
  fieldPath: string;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions?: string[];
  className?: string;
}

const InlineFieldValidation: React.FC<InlineFieldValidationProps> = ({
  fieldPath,
  errors,
  warnings,
  suggestions = [],
  className = ''
}) => {
  const fieldErrors = errors.filter(error => error.path.includes(fieldPath));
  const fieldWarnings = warnings.filter(warning => warning.path.includes(fieldPath));

  if (fieldErrors.length === 0 && fieldWarnings.length === 0 && suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`inline-validation ${className}`}>
      {fieldErrors.map((error, index) => (
        <div key={`error-${index}`} className="inline-error">
          <span className="inline-icon error-icon">❌</span>
          <span className="inline-message">{error.message}</span>
        </div>
      ))}
      
      {fieldWarnings.map((warning, index) => (
        <div key={`warning-${index}`} className="inline-warning">
          <span className="inline-icon warning-icon">⚠️</span>
          <span className="inline-message">{warning.message}</span>
        </div>
      ))}

      {suggestions.length > 0 && (
        <div className="inline-suggestions">
          <span className="inline-icon suggestion-icon">💡</span>
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="suggestion-item">
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineFieldValidation;
import React, { useState } from 'react';
import { ValidationError } from '../types/logiops';
import { getFieldHelp } from '../utils/validationSuggestions';
import InlineFieldValidation from './InlineFieldValidation';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ValidatedSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  fieldPath: string;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions?: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showHelp?: boolean;
}

const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  fieldPath,
  errors,
  warnings,
  suggestions = [],
  placeholder,
  required = false,
  disabled = false,
  className = '',
  showHelp = true
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const fieldErrors = errors.filter(error => 
    error.path === fieldPath || error.field === fieldPath.split('.').pop()
  );
  const fieldWarnings = warnings.filter(warning => 
    warning.path === fieldPath || warning.field === fieldPath.split('.').pop()
  );

  const hasErrors = fieldErrors.length > 0;
  const hasWarnings = fieldWarnings.length > 0;
  const helpText = showHelp ? getFieldHelp(fieldPath) : null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const selectClassName = [
    'validated-select',
    className,
    hasErrors ? 'has-errors' : '',
    hasWarnings ? 'has-warnings' : '',
    disabled ? 'disabled' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="validated-select-container">
      <div className="select-label-container">
        <label htmlFor={id} className="select-label">
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
        
        {helpText && (
          <div className="help-container">
            <button
              type="button"
              className="help-button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
            >
              ?
            </button>
            {showTooltip && (
              <div className="help-tooltip">
                {helpText}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="select-wrapper">
        <select
          id={id}
          value={value}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          className={selectClassName}
          aria-invalid={hasErrors}
          aria-describedby={hasErrors || hasWarnings ? `${id}-validation` : undefined}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {(hasErrors || hasWarnings) && (
          <div className="validation-indicator">
            {hasErrors ? '❌' : '⚠️'}
          </div>
        )}
      </div>

      <InlineFieldValidation
        fieldPath={fieldPath}
        errors={errors}
        warnings={warnings}
        suggestions={suggestions}
        className="select-validation"
      />
    </div>
  );
};

export default ValidatedSelect;
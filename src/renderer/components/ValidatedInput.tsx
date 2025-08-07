import React, { useState, useRef, useEffect } from 'react';
import { ValidationError } from '../types/logiops';
import { getFieldHelp } from '../utils/validationSuggestions';
import InlineFieldValidation from './InlineFieldValidation';

interface ValidatedInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  fieldPath: string;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions?: string[];
  type?: 'text' | 'number' | 'email' | 'password';
  placeholder?: string;
  pattern?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showHelp?: boolean;
}

const ValidatedInput: React.FC<ValidatedInputProps> = ({
  id,
  label,
  value,
  onChange,
  fieldPath,
  errors,
  warnings,
  suggestions = [],
  type = 'text',
  placeholder,
  pattern,
  min,
  max,
  step,
  required = false,
  disabled = false,
  className = '',
  showHelp = true
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fieldErrors = errors.filter(error => 
    error.path === fieldPath || error.field === fieldPath.split('.').pop()
  );
  const fieldWarnings = warnings.filter(warning => 
    warning.path === fieldPath || warning.field === fieldPath.split('.').pop()
  );

  const hasErrors = fieldErrors.length > 0;
  const hasWarnings = fieldWarnings.length > 0;
  const helpText = showHelp ? getFieldHelp(fieldPath) : null;

  // Auto-focus on error when validation fails
  useEffect(() => {
    if (hasErrors && fieldErrors.some(error => error.field === fieldPath.split('.').pop())) {
      // Small delay to ensure the component is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [hasErrors, fieldErrors, fieldPath]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const inputClassName = [
    'validated-input',
    className,
    hasErrors ? 'has-errors' : '',
    hasWarnings ? 'has-warnings' : '',
    isFocused ? 'focused' : '',
    disabled ? 'disabled' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="validated-input-container">
      <div className="input-label-container">
        <label htmlFor={id} className="input-label">
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

      <div className="input-wrapper">
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          pattern={pattern}
          min={min}
          max={max}
          step={step}
          required={required}
          disabled={disabled}
          className={inputClassName}
          aria-invalid={hasErrors}
          aria-describedby={hasErrors || hasWarnings ? `${id}-validation` : undefined}
        />
        
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
        className="input-validation"
      />
    </div>
  );
};

export default ValidatedInput;
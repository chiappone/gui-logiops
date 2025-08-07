import { useState, useEffect, useMemo } from 'react';
import { LogiopsConfiguration, Device, ValidationError, ValidationResult } from '../types/logiops';
import { validateConfiguration, validateDevice } from '../utils/validation';
import { generateSuggestions, ValidationSuggestion } from '../utils/validationSuggestions';

export interface ValidationState {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: Record<string, ValidationSuggestion[]>;
  isValidating: boolean;
}

/**
 * Hook for real-time validation of configurations
 */
export function useConfigurationValidation(
  configuration: LogiopsConfiguration | null,
  debounceMs: number = 300
): ValidationState {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: {},
    isValidating: false
  });

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!configuration) {
      setValidationState({
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: {},
        isValidating: false
      });
      return;
    }

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set validation as pending
    setValidationState(prev => ({ ...prev, isValidating: true }));

    // Debounce validation
    const timer = setTimeout(() => {
      const result = validateConfiguration(configuration);
      const suggestions = generateSuggestions(result.errors, result.warnings);

      setValidationState({
        isValid: result.isValid,
        errors: result.errors,
        warnings: result.warnings,
        suggestions,
        isValidating: false
      });
    }, debounceMs);

    setDebounceTimer(timer);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [configuration, debounceMs]);

  return validationState;
}

/**
 * Hook for real-time validation of a single device
 */
export function useDeviceValidation(
  device: Device | null,
  debounceMs: number = 300
): ValidationState {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: {},
    isValidating: false
  });

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!device) {
      setValidationState({
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: {},
        isValidating: false
      });
      return;
    }

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set validation as pending
    setValidationState(prev => ({ ...prev, isValidating: true }));

    // Debounce validation
    const timer = setTimeout(() => {
      const result = validateDevice(device);
      const suggestions = generateSuggestions(result.errors, result.warnings, device);

      setValidationState({
        isValid: result.isValid,
        errors: result.errors,
        warnings: result.warnings,
        suggestions,
        isValidating: false
      });
    }, debounceMs);

    setDebounceTimer(timer);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [device, debounceMs]);

  return validationState;
}

/**
 * Hook for field-specific validation
 */
export function useFieldValidation(
  fieldPath: string,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  return useMemo(() => {
    const fieldErrors = errors.filter(error => 
      error.path === fieldPath || error.path.startsWith(fieldPath + '.')
    );
    
    const fieldWarnings = warnings.filter(warning => 
      warning.path === fieldPath || warning.path.startsWith(fieldPath + '.')
    );

    return {
      hasErrors: fieldErrors.length > 0,
      hasWarnings: fieldWarnings.length > 0,
      errors: fieldErrors,
      warnings: fieldWarnings,
      isValid: fieldErrors.length === 0
    };
  }, [fieldPath, errors, warnings]);
}

/**
 * Hook for validation summary statistics
 */
export function useValidationSummary(validationState: ValidationState) {
  return useMemo(() => {
    const { errors, warnings } = validationState;
    
    // Group errors by category
    const errorsByCategory = errors.reduce((acc, error) => {
      const category = error.path.split('.')[0] || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(error);
      return acc;
    }, {} as Record<string, ValidationError[]>);

    // Group warnings by category
    const warningsByCategory = warnings.reduce((acc, warning) => {
      const category = warning.path.split('.')[0] || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(warning);
      return acc;
    }, {} as Record<string, ValidationError[]>);

    // Calculate severity score
    const severityScore = errors.length * 10 + warnings.length * 1;

    return {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      totalIssues: errors.length + warnings.length,
      errorsByCategory,
      warningsByCategory,
      severityScore,
      isValid: validationState.isValid,
      hasIssues: errors.length > 0 || warnings.length > 0
    };
  }, [validationState]);
}
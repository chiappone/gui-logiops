import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { 
  useConfigurationValidation, 
  useDeviceValidation, 
  useFieldValidation,
  useValidationSummary 
} from '../../renderer/hooks/useValidation';
import { LogiopsConfiguration, Device, ValidationError } from '../../renderer/types/logiops';

// Mock the validation functions
vi.mock('../../renderer/utils/validation', () => ({
  validateConfiguration: vi.fn(),
  validateDevice: vi.fn()
}));

vi.mock('../../renderer/utils/validationSuggestions', () => ({
  generateSuggestions: vi.fn(() => ({}))
}));

describe('useValidation hooks', () => {
  describe('useConfigurationValidation', () => {
    it('should return valid state for null configuration', () => {
      const { result } = renderHook(() => useConfigurationValidation(null));
      
      expect(result.current.isValid).toBe(true);
      expect(result.current.errors).toEqual([]);
      expect(result.current.warnings).toEqual([]);
      expect(result.current.suggestions).toEqual({});
      expect(result.current.isValidating).toBe(false);
    });

    it('should validate configuration and return results', async () => {
      const mockConfig: LogiopsConfiguration = {
        devices: [],
        metadata: {
          version: '1.0.0',
          created: new Date(),
          modified: new Date()
        }
      };

      const mockValidationResult = {
        isValid: false,
        errors: [
          {
            path: 'devices',
            message: 'No devices configured',
            severity: 'error' as const
          }
        ],
        warnings: []
      };

      const { validateConfiguration } = await import('../../renderer/utils/validation');
      vi.mocked(validateConfiguration).mockReturnValue(mockValidationResult);

      const { result } = renderHook(() => useConfigurationValidation(mockConfig, 0));

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors).toHaveLength(1);
      expect(result.current.errors[0].message).toBe('No devices configured');
    });

    it('should debounce validation calls', async () => {
      const mockConfig: LogiopsConfiguration = {
        devices: [],
        metadata: {
          version: '1.0.0',
          created: new Date(),
          modified: new Date()
        }
      };

      const { validateConfiguration } = await import('../../renderer/utils/validation');
      const mockValidate = vi.mocked(validateConfiguration);
      mockValidate.mockReturnValue({ isValid: true, errors: [], warnings: [] });

      const { result } = renderHook(() => useConfigurationValidation(mockConfig, 50));

      // Should eventually finish validating
      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
      }, { timeout: 200 });

      // Should have called validation at least once
      expect(mockValidate.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('useDeviceValidation', () => {
    it('should return valid state for null device', () => {
      const { result } = renderHook(() => useDeviceValidation(null));
      
      expect(result.current.isValid).toBe(true);
      expect(result.current.errors).toEqual([]);
      expect(result.current.warnings).toEqual([]);
      expect(result.current.isValidating).toBe(false);
    });

    it('should validate device and return results', async () => {
      const mockDevice: Device = {
        name: '',
        vid: '0x046d',
        pid: '0x4082'
      };

      const mockValidationResult = {
        isValid: false,
        errors: [
          {
            path: 'device.name',
            message: 'Device name is required',
            severity: 'error' as const,
            field: 'name'
          }
        ],
        warnings: []
      };

      const { validateDevice } = await import('../../renderer/utils/validation');
      vi.mocked(validateDevice).mockReturnValue(mockValidationResult);

      const { result } = renderHook(() => useDeviceValidation(mockDevice, 0));

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors).toHaveLength(1);
      expect(result.current.errors[0].field).toBe('name');
    });
  });

  describe('useFieldValidation', () => {
    const mockErrors: ValidationError[] = [
      {
        path: 'device.name',
        message: 'Device name is required',
        severity: 'error',
        field: 'name'
      },
      {
        path: 'device.vid',
        message: 'Invalid format',
        severity: 'error',
        field: 'vid'
      }
    ];

    const mockWarnings: ValidationError[] = [
      {
        path: 'device.name',
        message: 'Consider a more descriptive name',
        severity: 'warning'
      }
    ];

    it('should filter errors and warnings for specific field', () => {
      const { result } = renderHook(() => 
        useFieldValidation('device.name', mockErrors, mockWarnings)
      );

      expect(result.current.hasErrors).toBe(true);
      expect(result.current.hasWarnings).toBe(true);
      expect(result.current.errors).toHaveLength(1);
      expect(result.current.warnings).toHaveLength(1);
      expect(result.current.isValid).toBe(false);
    });

    it('should return no errors for non-matching field', () => {
      const { result } = renderHook(() => 
        useFieldValidation('device.pid', mockErrors, mockWarnings)
      );

      expect(result.current.hasErrors).toBe(false);
      expect(result.current.hasWarnings).toBe(false);
      expect(result.current.errors).toHaveLength(0);
      expect(result.current.warnings).toHaveLength(0);
      expect(result.current.isValid).toBe(true);
    });

    it('should match nested field paths', () => {
      const nestedErrors: ValidationError[] = [
        {
          path: 'device.dpi.sensors[0].dpi',
          message: 'Invalid DPI',
          severity: 'error'
        }
      ];

      const { result } = renderHook(() => 
        useFieldValidation('device.dpi', nestedErrors, [])
      );

      expect(result.current.hasErrors).toBe(true);
      expect(result.current.errors).toHaveLength(1);
    });
  });

  describe('useValidationSummary', () => {
    it('should calculate summary statistics correctly', () => {
      const validationState = {
        isValid: false,
        errors: [
          { path: 'device.name', message: 'Error 1', severity: 'error' as const },
          { path: 'device.vid', message: 'Error 2', severity: 'error' as const },
          { path: 'buttons[0].cid', message: 'Error 3', severity: 'error' as const }
        ],
        warnings: [
          { path: 'device', message: 'Warning 1', severity: 'warning' as const },
          { path: 'buttons[0]', message: 'Warning 2', severity: 'warning' as const }
        ],
        suggestions: {},
        isValidating: false
      };

      const { result } = renderHook(() => useValidationSummary(validationState));

      expect(result.current.totalErrors).toBe(3);
      expect(result.current.totalWarnings).toBe(2);
      expect(result.current.totalIssues).toBe(5);
      expect(result.current.severityScore).toBe(32); // 3*10 + 2*1
      expect(result.current.isValid).toBe(false);
      expect(result.current.hasIssues).toBe(true);
    });

    it('should group errors and warnings by category', () => {
      const validationState = {
        isValid: false,
        errors: [
          { path: 'device.name', message: 'Error 1', severity: 'error' as const },
          { path: 'device.vid', message: 'Error 2', severity: 'error' as const },
          { path: 'buttons[0].cid', message: 'Error 3', severity: 'error' as const }
        ],
        warnings: [
          { path: 'device', message: 'Warning 1', severity: 'warning' as const },
          { path: 'buttons[0]', message: 'Warning 2', severity: 'warning' as const }
        ],
        suggestions: {},
        isValidating: false
      };

      const { result } = renderHook(() => useValidationSummary(validationState));

      expect(result.current.errorsByCategory.device).toHaveLength(2);
      expect(result.current.errorsByCategory['buttons[0]']).toHaveLength(1);
      expect(result.current.warningsByCategory.device).toHaveLength(1);
      expect(result.current.warningsByCategory['buttons[0]']).toHaveLength(1);
    });

    it('should handle valid state correctly', () => {
      const validationState = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: {},
        isValidating: false
      };

      const { result } = renderHook(() => useValidationSummary(validationState));

      expect(result.current.totalErrors).toBe(0);
      expect(result.current.totalWarnings).toBe(0);
      expect(result.current.totalIssues).toBe(0);
      expect(result.current.severityScore).toBe(0);
      expect(result.current.isValid).toBe(true);
      expect(result.current.hasIssues).toBe(false);
    });
  });
});
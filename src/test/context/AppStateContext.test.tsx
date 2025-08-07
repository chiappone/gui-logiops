import React from 'react';
import { render, act, renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { 
  AppStateProvider, 
  useAppState, 
  useConfiguration, 
  useUndoRedo, 
  useFileState,
  useValidationState,
  usePreferences 
} from '../../renderer/context/AppStateContext';
import { LogiopsConfiguration, Device } from '../../renderer/types/logiops';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppStateProvider>{children}</AppStateProvider>
);

describe('AppStateContext', () => {
  describe('useAppState', () => {
    it('should provide initial state', () => {
      const { result } = renderHook(() => useAppState(), { wrapper: TestWrapper });
      
      expect(result.current.state.currentConfiguration).toBeNull();
      expect(result.current.state.selectedDevice).toBeNull();
      expect(result.current.state.activePanel).toBe('welcome');
      expect(result.current.state.isModified).toBe(false);
      expect(result.current.state.statusMessage).toBe('Ready');
      expect(result.current.state.currentFile).toBeNull();
      expect(result.current.state.recentFiles).toEqual([]);
      expect(result.current.state.validationErrors).toEqual([]);
      expect(result.current.state.validationWarnings).toEqual([]);
    });

    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useAppState());
      }).toThrow('useAppState must be used within an AppStateProvider');
    });
  });

  describe('useConfiguration', () => {
    it('should handle configuration updates', () => {
      const { result } = renderHook(() => useConfiguration(), { wrapper: TestWrapper });
      
      const testConfig: LogiopsConfiguration = {
        devices: [],
        metadata: {
          version: '1.0',
          created: new Date(),
          modified: new Date()
        }
      };

      act(() => {
        result.current.setConfiguration(testConfig);
      });

      expect(result.current.configuration).toEqual(testConfig);
    });

    it('should handle device updates', () => {
      const { result } = renderHook(() => useConfiguration(), { wrapper: TestWrapper });
      
      const testDevice: Device = {
        name: 'Test Mouse',
        vid: '0x046d',
        pid: '0x4082'
      };

      act(() => {
        result.current.updateDevice(testDevice);
      });

      expect(result.current.configuration?.devices).toContainEqual(testDevice);
    });

    it('should handle device removal', () => {
      const { result } = renderHook(() => useConfiguration(), { wrapper: TestWrapper });
      
      const testDevice: Device = {
        name: 'Test Mouse',
        vid: '0x046d',
        pid: '0x4082'
      };

      // First add a device
      act(() => {
        result.current.updateDevice(testDevice);
      });

      expect(result.current.configuration?.devices).toContainEqual(testDevice);

      // Then remove it
      act(() => {
        result.current.removeDevice('0x046d', '0x4082');
      });

      expect(result.current.configuration?.devices).not.toContainEqual(testDevice);
    });
  });

  describe('useUndoRedo', () => {
    it('should handle undo/redo operations', () => {
      const { result: appStateResult } = renderHook(() => useAppState(), { wrapper: TestWrapper });
      const { result: configResult } = renderHook(() => useConfiguration(), { wrapper: TestWrapper });
      const { result: undoRedoResult } = renderHook(() => useUndoRedo(), { wrapper: TestWrapper });

      const device1: Device = { name: 'Device 1', vid: '0x046d', pid: '0x4082' };
      const device1Updated: Device = { name: 'Device 1 Updated', vid: '0x046d', pid: '0x4082' };

      // Add first device (creates initial configuration)
      act(() => {
        configResult.current.updateDevice(device1);
      });

      // Check initial state - first device creation shouldn't have undo
      expect(undoRedoResult.current.canUndo).toBe(false);
      expect(undoRedoResult.current.canRedo).toBe(false);

      // Update the device (should create history entry)
      act(() => {
        configResult.current.updateDevice(device1Updated);
      });

      // Now we should be able to undo
      expect(undoRedoResult.current.canUndo).toBe(true);
      expect(undoRedoResult.current.canRedo).toBe(false);

      // Undo
      act(() => {
        undoRedoResult.current.undo();
      });

      expect(configResult.current.configuration?.devices).toHaveLength(1);
      expect(configResult.current.configuration?.devices[0]).toEqual(device1);
      expect(undoRedoResult.current.canUndo).toBe(false);
      expect(undoRedoResult.current.canRedo).toBe(true);

      // Redo
      act(() => {
        undoRedoResult.current.redo();
      });

      expect(configResult.current.configuration?.devices).toHaveLength(1);
      expect(configResult.current.configuration?.devices[0]).toEqual(device1Updated);
      expect(undoRedoResult.current.canUndo).toBe(true);
      expect(undoRedoResult.current.canRedo).toBe(false);
    });

    it('should clear history', () => {
      const { result: configResult } = renderHook(() => useConfiguration(), { wrapper: TestWrapper });
      const { result: undoRedoResult } = renderHook(() => useUndoRedo(), { wrapper: TestWrapper });

      const device1: Device = { name: 'Device 1', vid: '0x046d', pid: '0x4082' };
      const device1Updated: Device = { name: 'Device 1 Updated', vid: '0x046d', pid: '0x4082' };

      act(() => {
        configResult.current.updateDevice(device1);
      });

      act(() => {
        configResult.current.updateDevice(device1Updated);
      });

      expect(undoRedoResult.current.canUndo).toBe(true);

      act(() => {
        undoRedoResult.current.clearHistory();
      });

      expect(undoRedoResult.current.canUndo).toBe(false);
      expect(undoRedoResult.current.canRedo).toBe(false);
    });
  });

  describe('useFileState', () => {
    it('should handle file state updates', () => {
      const { result } = renderHook(() => useFileState(), { wrapper: TestWrapper });

      const testFile = {
        path: '/test/path.cfg',
        filename: 'test.cfg',
        lastSaved: new Date()
      };

      act(() => {
        result.current.setCurrentFile(testFile);
      });

      expect(result.current.currentFile).toEqual(testFile);
      expect(result.current.isModified).toBe(false);

      act(() => {
        result.current.setModified(true);
      });

      expect(result.current.isModified).toBe(true);
    });

    it('should handle recent files', () => {
      const { result } = renderHook(() => useFileState(), { wrapper: TestWrapper });

      act(() => {
        result.current.addRecentFile('/test/file1.cfg', 'file1.cfg');
      });

      expect(result.current.recentFiles).toHaveLength(1);
      expect(result.current.recentFiles[0].filename).toBe('file1.cfg');

      act(() => {
        result.current.addRecentFile('/test/file2.cfg', 'file2.cfg');
      });

      expect(result.current.recentFiles).toHaveLength(2);
      expect(result.current.recentFiles[0].filename).toBe('file2.cfg'); // Most recent first
    });
  });

  describe('useValidationState', () => {
    it('should handle validation errors and warnings', () => {
      const { result } = renderHook(() => useValidationState(), { wrapper: TestWrapper });

      const errors = [
        { path: 'device.dpi', message: 'Invalid DPI value', severity: 'error' as const }
      ];

      const warnings = [
        { path: 'device.buttons', message: 'Unused button mapping', severity: 'warning' as const }
      ];

      act(() => {
        result.current.setErrors(errors);
        result.current.setWarnings(warnings);
      });

      expect(result.current.errors).toEqual(errors);
      expect(result.current.warnings).toEqual(warnings);
    });
  });

  describe('usePreferences', () => {
    it('should handle preference updates', () => {
      const { result } = renderHook(() => usePreferences(), { wrapper: TestWrapper });

      expect(result.current.preferences.autoSave).toBe(false);
      expect(result.current.preferences.theme).toBe('system');

      act(() => {
        result.current.updatePreferences({
          autoSave: true,
          theme: 'dark'
        });
      });

      expect(result.current.preferences.autoSave).toBe(true);
      expect(result.current.preferences.theme).toBe('dark');
    });
  });

  describe('State persistence', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it('should persist preferences to localStorage', () => {
      const { result } = renderHook(() => usePreferences(), { wrapper: TestWrapper });

      act(() => {
        result.current.updatePreferences({
          autoSave: true,
          autoSaveInterval: 10
        });
      });

      // Check that preferences were saved to localStorage
      const savedPreferences = localStorage.getItem('logiops-gui-preferences');
      expect(savedPreferences).toBeTruthy();
      
      const parsed = JSON.parse(savedPreferences!);
      expect(parsed.autoSave).toBe(true);
      expect(parsed.autoSaveInterval).toBe(10);
    });

    it('should persist recent files to localStorage', () => {
      const { result } = renderHook(() => useFileState(), { wrapper: TestWrapper });

      act(() => {
        result.current.addRecentFile('/test/file.cfg', 'file.cfg');
      });

      // Check that recent files were saved to localStorage
      const savedRecentFiles = localStorage.getItem('logiops-gui-recent-files');
      expect(savedRecentFiles).toBeTruthy();
      
      const parsed = JSON.parse(savedRecentFiles!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].filename).toBe('file.cfg');
    });
  });
});
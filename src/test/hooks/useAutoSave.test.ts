import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAutoSave } from '../../renderer/hooks/useAutoSave';
import { AppStateProvider } from '../../renderer/context/AppStateContext';
import { fileManager } from '../../renderer/services/fileManager';
import React from 'react';

// Mock the file manager
vi.mock('../../renderer/services/fileManager', () => ({
  fileManager: {
    getInstance: vi.fn(() => ({
      saveFile: vi.fn()
    }))
  }
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppStateProvider>{children}</AppStateProvider>
);

describe('useAutoSave', () => {
  let mockSaveFile: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockSaveFile = vi.fn();
    (fileManager.getInstance as any).mockReturnValue({
      saveFile: mockSaveFile
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should provide auto-save functionality', () => {
    const { result } = renderHook(() => useAutoSave(), { wrapper: TestWrapper });

    expect(result.current.isAutoSaveEnabled).toBe(false);
    expect(result.current.autoSaveInterval).toBe(5);
    expect(typeof result.current.manualSave).toBe('function');
  });

  it('should not auto-save when disabled', async () => {
    renderHook(() => useAutoSave(), { wrapper: TestWrapper });

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
    });

    expect(mockSaveFile).not.toHaveBeenCalled();
  });

  it('should handle manual save', async () => {
    const { result } = renderHook(() => useAutoSave(), { wrapper: TestWrapper });

    mockSaveFile.mockResolvedValue({ filename: 'test.cfg', path: '/test/test.cfg' });

    await act(async () => {
      const success = await result.current.manualSave();
      expect(success).toBe(false); // No configuration to save
    });
  });

  it('should handle manual save errors', async () => {
    const { result } = renderHook(() => useAutoSave(), { wrapper: TestWrapper });

    mockSaveFile.mockRejectedValue(new Error('Save failed'));

    await act(async () => {
      try {
        await result.current.manualSave();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Save failed');
      }
    });
  });
});
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useKeyboardShortcuts } from '../../renderer/hooks/useKeyboardShortcuts';
import { AppStateProvider } from '../../renderer/context/AppStateContext';
import React from 'react';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppStateProvider>{children}</AppStateProvider>
);

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    // Mock console.log to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should provide undo/redo functionality', () => {
    const { result } = renderHook(() => useKeyboardShortcuts(), { wrapper: TestWrapper });

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(typeof result.current.undo).toBe('function');
    expect(typeof result.current.redo).toBe('function');
  });

  it('should handle Ctrl+Z for undo', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper: TestWrapper });

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true
    });

    // Spy on preventDefault
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    act(() => {
      document.dispatchEvent(event);
    });

    // Should not prevent default when can't undo
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('should handle Ctrl+Y for redo', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper: TestWrapper });

    const event = new KeyboardEvent('keydown', {
      key: 'y',
      ctrlKey: true,
      bubbles: true
    });

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    act(() => {
      document.dispatchEvent(event);
    });

    // Should not prevent default when can't redo
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('should handle Ctrl+Shift+Z for redo', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper: TestWrapper });

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    });

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    act(() => {
      document.dispatchEvent(event);
    });

    // Should not prevent default when can't redo
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('should handle Ctrl+S for save', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper: TestWrapper });

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true
    });

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    act(() => {
      document.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should handle Ctrl+N for new', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper: TestWrapper });

    const event = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      bubbles: true
    });

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    act(() => {
      document.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should handle Ctrl+O for open', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper: TestWrapper });

    const event = new KeyboardEvent('keydown', {
      key: 'o',
      ctrlKey: true,
      bubbles: true
    });

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    act(() => {
      document.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should handle Cmd key on Mac', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper: TestWrapper });

    const event = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true, // Cmd key on Mac
      bubbles: true
    });

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    act(() => {
      document.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should ignore non-modifier key combinations', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper: TestWrapper });

    const event = new KeyboardEvent('keydown', {
      key: 's',
      // No ctrl or meta key
      bubbles: true
    });

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    act(() => {
      document.dispatchEvent(event);
    });

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    
    const { unmount } = renderHook(() => useKeyboardShortcuts(), { wrapper: TestWrapper });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
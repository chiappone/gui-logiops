import { useEffect } from 'react';
import { useUndoRedo, useAppState } from '../context/AppStateContext';
import { useAutoSave } from './useAutoSave';

/**
 * Hook that handles keyboard shortcuts for the application
 */
export const useKeyboardShortcuts = () => {
  const { dispatch } = useAppState();
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  const { manualSave } = useAutoSave();

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      // Check for modifier keys (Ctrl on Windows/Linux, Cmd on Mac)
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      
      if (!isCtrlOrCmd) return;

      switch (event.key.toLowerCase()) {
        case 'z':
          if (event.shiftKey) {
            // Ctrl+Shift+Z or Cmd+Shift+Z for Redo
            if (canRedo) {
              event.preventDefault();
              redo();
              dispatch({ type: 'SET_STATUS_MESSAGE', payload: 'Redid last action' });
            }
          } else {
            // Ctrl+Z or Cmd+Z for Undo
            if (canUndo) {
              event.preventDefault();
              undo();
              dispatch({ type: 'SET_STATUS_MESSAGE', payload: 'Undid last action' });
            }
          }
          break;

        case 'y':
          // Ctrl+Y for Redo (Windows style)
          if (canRedo && !event.shiftKey) {
            event.preventDefault();
            redo();
            dispatch({ type: 'SET_STATUS_MESSAGE', payload: 'Redid last action' });
          }
          break;

        case 's':
          // Ctrl+S or Cmd+S for Save
          event.preventDefault();
          try {
            await manualSave();
            dispatch({ type: 'SET_STATUS_MESSAGE', payload: 'Configuration saved' });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            dispatch({ type: 'SET_STATUS_MESSAGE', payload: `Save failed: ${errorMessage}` });
          }
          break;

        case 'n':
          // Ctrl+N or Cmd+N for New
          event.preventDefault();
          dispatch({ type: 'SET_CONFIGURATION', payload: null });
          dispatch({ type: 'SET_SELECTED_DEVICE', payload: null });
          dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'device' });
          dispatch({ type: 'SET_STATUS_MESSAGE', payload: 'New configuration created' });
          break;

        case 'o':
          // Ctrl+O or Cmd+O for Open
          event.preventDefault();
          // Trigger file open - this would need to be handled by the main component
          // For now, just set a status message
          dispatch({ type: 'SET_STATUS_MESSAGE', payload: 'Open file dialog requested' });
          break;

        default:
          // No action for other keys
          break;
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, undo, redo, canUndo, canRedo, manualSave]);

  return {
    canUndo,
    canRedo,
    undo,
    redo
  };
};
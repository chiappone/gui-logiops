import { useEffect, useRef } from 'react';
import { useAppState, usePreferences, useFileState } from '../context/AppStateContext';
import { fileManager } from '../services/fileManager';

/**
 * Hook that provides auto-save functionality based on user preferences
 */
export const useAutoSave = () => {
  const { state } = useAppState();
  const { preferences } = usePreferences();
  const { currentFile, isModified } = useFileState();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<Date | null>(null);

  useEffect(() => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }

    // Only auto-save if enabled, there's a configuration, it's modified, and we have a current file
    if (!preferences.autoSave || 
        !state.currentConfiguration || 
        !isModified || 
        !currentFile) {
      return;
    }

    // Set up auto-save timeout
    const autoSaveDelay = preferences.autoSaveInterval * 60 * 1000; // Convert minutes to milliseconds
    
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        // Check if enough time has passed since last save to avoid too frequent saves
        const now = new Date();
        if (lastSaveRef.current && 
            (now.getTime() - lastSaveRef.current.getTime()) < 30000) { // 30 seconds minimum
          return;
        }

        // Perform auto-save
        if (state.currentConfiguration) {
          await fileManager.getInstance().saveFile(state.currentConfiguration, currentFile.path);
        }
        lastSaveRef.current = now;
        
        console.log('Auto-saved configuration at', now.toLocaleTimeString());
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Don't show error to user for auto-save failures, just log them
      }
    }, autoSaveDelay);

    // Cleanup function
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, [
    preferences.autoSave, 
    preferences.autoSaveInterval, 
    state.currentConfiguration, 
    isModified, 
    currentFile
  ]);

  // Manual save function that updates the last save time
  const manualSave = async () => {
    if (state.currentConfiguration) {
      try {
        await fileManager.getInstance().saveFile(state.currentConfiguration, currentFile?.path);
        lastSaveRef.current = new Date();
        return true;
      } catch (error) {
        console.error('Manual save failed:', error);
        throw error;
      }
    }
    return false;
  };

  return {
    manualSave,
    isAutoSaveEnabled: preferences.autoSave,
    autoSaveInterval: preferences.autoSaveInterval
  };
};
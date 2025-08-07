import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { LogiopsConfiguration, Device, ValidationError, UserPreferences } from '../types/logiops';

// State interface
export interface AppState {
  // Configuration data
  currentConfiguration: LogiopsConfiguration | null;
  selectedDevice: Device | null;
  
  // UI state
  activePanel: 'welcome' | 'device' | 'preview' | 'tree' | 'system';
  isModified: boolean;
  statusMessage: string;
  
  // File management
  currentFile: {
    path: string;
    filename: string;
    lastSaved: Date;
  } | null;
  recentFiles: Array<{
    path: string;
    filename: string;
    lastOpened: Date;
  }>;
  
  // Validation
  validationErrors: ValidationError[];
  validationWarnings: ValidationError[];
  
  // User preferences
  preferences: UserPreferences;
  
  // Undo/Redo system
  history: {
    past: LogiopsConfiguration[];
    present: LogiopsConfiguration | null;
    future: LogiopsConfiguration[];
  };
}

// Action types
export type AppAction =
  | { type: 'SET_CONFIGURATION'; payload: LogiopsConfiguration | null }
  | { type: 'UPDATE_DEVICE'; payload: Device }
  | { type: 'REMOVE_DEVICE'; payload: { vid: string; pid: string } }
  | { type: 'SET_SELECTED_DEVICE'; payload: Device | null }
  | { type: 'SET_ACTIVE_PANEL'; payload: AppState['activePanel'] }
  | { type: 'SET_MODIFIED'; payload: boolean }
  | { type: 'SET_STATUS_MESSAGE'; payload: string }
  | { type: 'SET_CURRENT_FILE'; payload: AppState['currentFile'] }
  | { type: 'ADD_RECENT_FILE'; payload: { path: string; filename: string } }
  | { type: 'SET_VALIDATION_ERRORS'; payload: ValidationError[] }
  | { type: 'SET_VALIDATION_WARNINGS'; payload: ValidationError[] }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'RESET_STATE' };

// Default preferences
const defaultPreferences: UserPreferences = {
  autoSave: false,
  autoSaveInterval: 5,
  theme: 'system',
  recentFilesLimit: 10,
  showTooltips: true,
  validateOnType: true
};

// Initial state
const initialState: AppState = {
  currentConfiguration: null,
  selectedDevice: null,
  activePanel: 'welcome',
  isModified: false,
  statusMessage: 'Ready',
  currentFile: null,
  recentFiles: [],
  validationErrors: [],
  validationWarnings: [],
  preferences: defaultPreferences,
  history: {
    past: [],
    present: null,
    future: []
  }
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CONFIGURATION': {
      const newConfig = action.payload;
      return {
        ...state,
        currentConfiguration: newConfig,
        history: {
          past: state.history.present ? [...state.history.past, state.history.present] : [],
          present: newConfig,
          future: []
        },
        isModified: true
      };
    }

    case 'UPDATE_DEVICE': {
      if (!state.currentConfiguration) {
        // Create new configuration with this device
        const newConfig: LogiopsConfiguration = {
          devices: [action.payload],
          metadata: {
            version: '1.0',
            created: new Date(),
            modified: new Date()
          }
        };
        return {
          ...state,
          currentConfiguration: newConfig,
          selectedDevice: action.payload,
          history: {
            past: [], // No history for initial configuration
            present: newConfig,
            future: []
          },
          isModified: true
        };
      }

      // Update existing device or add new one
      const existingDeviceIndex = state.currentConfiguration.devices.findIndex(
        d => d.vid === action.payload.vid && d.pid === action.payload.pid
      );

      let updatedDevices: Device[];
      if (existingDeviceIndex >= 0) {
        updatedDevices = [...state.currentConfiguration.devices];
        updatedDevices[existingDeviceIndex] = action.payload;
      } else {
        updatedDevices = [...state.currentConfiguration.devices, action.payload];
      }

      const updatedConfig: LogiopsConfiguration = {
        ...state.currentConfiguration,
        devices: updatedDevices,
        metadata: {
          ...state.currentConfiguration.metadata,
          modified: new Date()
        }
      };

      return {
        ...state,
        currentConfiguration: updatedConfig,
        selectedDevice: action.payload,
        history: {
          past: [...state.history.past, state.currentConfiguration], // Always add current config to history
          present: updatedConfig,
          future: []
        },
        isModified: true
      };
    }

    case 'REMOVE_DEVICE': {
      if (!state.currentConfiguration) return state;

      const updatedDevices = state.currentConfiguration.devices.filter(
        d => !(d.vid === action.payload.vid && d.pid === action.payload.pid)
      );

      const updatedConfig: LogiopsConfiguration = {
        ...state.currentConfiguration,
        devices: updatedDevices,
        metadata: {
          ...state.currentConfiguration.metadata,
          modified: new Date()
        }
      };

      return {
        ...state,
        currentConfiguration: updatedConfig,
        selectedDevice: state.selectedDevice?.vid === action.payload.vid && 
                       state.selectedDevice?.pid === action.payload.pid ? null : state.selectedDevice,
        history: {
          past: state.history.present ? [...state.history.past, state.history.present] : [],
          present: updatedConfig,
          future: []
        },
        isModified: true
      };
    }

    case 'SET_SELECTED_DEVICE':
      return {
        ...state,
        selectedDevice: action.payload
      };

    case 'SET_ACTIVE_PANEL':
      return {
        ...state,
        activePanel: action.payload
      };

    case 'SET_MODIFIED':
      return {
        ...state,
        isModified: action.payload
      };

    case 'SET_STATUS_MESSAGE':
      return {
        ...state,
        statusMessage: action.payload
      };

    case 'SET_CURRENT_FILE':
      return {
        ...state,
        currentFile: action.payload,
        isModified: false // File was just loaded/saved
      };

    case 'ADD_RECENT_FILE': {
      const newRecentFile = {
        ...action.payload,
        lastOpened: new Date()
      };

      // Remove existing entry if it exists
      const filteredRecentFiles = state.recentFiles.filter(
        file => file.path !== action.payload.path
      );

      // Add to beginning and limit to preferences limit
      const updatedRecentFiles = [newRecentFile, ...filteredRecentFiles]
        .slice(0, state.preferences.recentFilesLimit);

      return {
        ...state,
        recentFiles: updatedRecentFiles
      };
    }

    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: action.payload
      };

    case 'SET_VALIDATION_WARNINGS':
      return {
        ...state,
        validationWarnings: action.payload
      };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload
        }
      };

    case 'UNDO': {
      if (state.history.past.length === 0) return state;

      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, state.history.past.length - 1);

      return {
        ...state,
        currentConfiguration: previous,
        history: {
          past: newPast,
          present: previous,
          future: state.history.present ? [state.history.present, ...state.history.future] : state.history.future
        },
        isModified: true
      };
    }

    case 'REDO': {
      if (state.history.future.length === 0) return state;

      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);

      return {
        ...state,
        currentConfiguration: next,
        history: {
          past: state.history.present ? [...state.history.past, state.history.present] : state.history.past,
          present: next,
          future: newFuture
        },
        isModified: true
      };
    }

    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: {
          past: [],
          present: state.currentConfiguration,
          future: []
        }
      };

    case 'RESET_STATE':
      return {
        ...initialState,
        preferences: state.preferences, // Keep user preferences
        recentFiles: state.recentFiles   // Keep recent files
      };

    default:
      return state;
  }
}

// Context
const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider component
interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load persisted state on mount
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        // Load preferences
        const savedPreferences = localStorage.getItem('logiops-gui-preferences');
        if (savedPreferences) {
          const preferences = JSON.parse(savedPreferences);
          dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
        }

        // Load recent files
        const savedRecentFiles = localStorage.getItem('logiops-gui-recent-files');
        if (savedRecentFiles) {
          const recentFiles = JSON.parse(savedRecentFiles).map((file: any) => ({
            ...file,
            lastOpened: new Date(file.lastOpened)
          }));
          
          // Set recent files by dispatching multiple ADD_RECENT_FILE actions
          recentFiles.forEach((file: any) => {
            dispatch({ 
              type: 'ADD_RECENT_FILE', 
              payload: { path: file.path, filename: file.filename }
            });
          });
        }
      } catch (error) {
        console.error('Failed to load persisted state:', error);
      }
    };

    loadPersistedState();
  }, []);

  // Persist state changes
  useEffect(() => {
    try {
      localStorage.setItem('logiops-gui-preferences', JSON.stringify(state.preferences));
    } catch (error) {
      console.error('Failed to persist preferences:', error);
    }
  }, [state.preferences]);

  useEffect(() => {
    try {
      localStorage.setItem('logiops-gui-recent-files', JSON.stringify(state.recentFiles));
    } catch (error) {
      console.error('Failed to persist recent files:', error);
    }
  }, [state.recentFiles]);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};

// Hook to use the context
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

// Convenience hooks for specific state slices
export const useConfiguration = () => {
  const { state, dispatch } = useAppState();
  return {
    configuration: state.currentConfiguration,
    setConfiguration: (config: LogiopsConfiguration | null) => 
      dispatch({ type: 'SET_CONFIGURATION', payload: config }),
    updateDevice: (device: Device) => 
      dispatch({ type: 'UPDATE_DEVICE', payload: device }),
    removeDevice: (vid: string, pid: string) => 
      dispatch({ type: 'REMOVE_DEVICE', payload: { vid, pid } })
  };
};

export const useUndoRedo = () => {
  const { state, dispatch } = useAppState();
  return {
    canUndo: state.history.past.length > 0,
    canRedo: state.history.future.length > 0,
    undo: () => dispatch({ type: 'UNDO' }),
    redo: () => dispatch({ type: 'REDO' }),
    clearHistory: () => dispatch({ type: 'CLEAR_HISTORY' })
  };
};

export const useFileState = () => {
  const { state, dispatch } = useAppState();
  return {
    currentFile: state.currentFile,
    recentFiles: state.recentFiles,
    isModified: state.isModified,
    setCurrentFile: (file: AppState['currentFile']) => 
      dispatch({ type: 'SET_CURRENT_FILE', payload: file }),
    addRecentFile: (path: string, filename: string) => 
      dispatch({ type: 'ADD_RECENT_FILE', payload: { path, filename } }),
    setModified: (modified: boolean) => 
      dispatch({ type: 'SET_MODIFIED', payload: modified })
  };
};

export const useValidationState = () => {
  const { state, dispatch } = useAppState();
  return {
    errors: state.validationErrors,
    warnings: state.validationWarnings,
    setErrors: (errors: ValidationError[]) => 
      dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors }),
    setWarnings: (warnings: ValidationError[]) => 
      dispatch({ type: 'SET_VALIDATION_WARNINGS', payload: warnings })
  };
};

export const usePreferences = () => {
  const { state, dispatch } = useAppState();
  return {
    preferences: state.preferences,
    updatePreferences: (updates: Partial<UserPreferences>) => 
      dispatch({ type: 'UPDATE_PREFERENCES', payload: updates })
  };
};
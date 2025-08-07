import React, { useEffect, useCallback, useState } from "react";
import { fileManager, FileInfo } from "./services/fileManager";
import { LogiopsConfiguration, Device } from "./types/logiops";
import DeviceConfigurationPanel from "./components/DeviceConfigurationPanel";
import ConfigurationPreview from "./components/ConfigurationPreview";
import ErrorSummaryPanel from "./components/ErrorSummaryPanel";
import PreferencesDialog from "./components/PreferencesDialog";
import { SystemStatusPanel } from "./components/SystemStatusPanel";
import LoadingSpinner from "./components/LoadingSpinner";
import ProgressBar from "./components/ProgressBar";
import PerformanceMonitor from "./components/PerformanceMonitor";
import { ThemeProvider } from "./components/ThemeProvider";
import { useConfigurationValidation } from "./hooks/useValidation";
import {
  useAppState,
  useConfiguration,
  useUndoRedo,
  useFileState,
  useValidationState,
} from "./context/AppStateContext";
import { useAutoSave } from "./hooks/useAutoSave";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { usePerformanceOptimization } from "./hooks/usePerformanceOptimization";

const App: React.FC = () => {
  const { state, dispatch } = useAppState();
  const { configuration, setConfiguration, updateDevice } = useConfiguration();
  const { canUndo, canRedo } = useUndoRedo();
  
  // Debug: Log current theme
  useEffect(() => {
    console.log('Current theme:', document.documentElement.getAttribute('data-theme'));
    console.log('Computed styles:', getComputedStyle(document.documentElement).getPropertyValue('--text-primary'));
  }, []);
  const {
    currentFile,
    recentFiles,
    isModified,
    setCurrentFile,
    addRecentFile,
    setModified,
  } = useFileState();
  const { errors, warnings, setErrors, setWarnings } = useValidationState();
  const [showPreferences, setShowPreferences] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [operationProgress, setOperationProgress] = useState<
    number | undefined
  >(undefined);

  // Hooks for additional functionality
  useAutoSave();
  useKeyboardShortcuts();

  // Performance optimization for large configurations
  const {
    configMetrics,
    startPerformanceMeasurement,
    endPerformanceMeasurement,
    debouncedUpdate,
    optimizeMemoryUsage,
  } = usePerformanceOptimization(configuration);

  // Real-time validation with performance optimization
  const validationState = useConfigurationValidation(
    configuration,
    configMetrics.isLargeConfig ? 500 : 300
  );

  // Handle file changes and updates
  const handleFileChange = useCallback(
    (hasChanges: boolean) => {
      setModified(hasChanges);
    },
    [setModified]
  );

  const handleFileLoad = useCallback(
    (file: FileInfo | null) => {
      if (file) {
        setCurrentFile({
          path: file.path,
          filename: file.filename,
          lastSaved: new Date(),
        });
        addRecentFile(file.path, file.filename);
      } else {
        setCurrentFile(null);
      }
    },
    [setCurrentFile, addRecentFile]
  );

  // Handle menu events from main process
  useEffect(() => {
    const handleMenuEvent = (event: string) => {
      switch (event) {
        case "menu-new-config":
          handleNewConfig();
          break;
        case "menu-open-config":
          handleOpenConfig();
          break;
        case "menu-save-config":
          handleSaveConfig();
          break;
        case "menu-about":
          handleAbout();
          break;
        case "menu-preferences":
          setShowPreferences(true);
          break;
      }
    };

    // Listen for menu events from main process
    if (window.electronAPI) {
      window.electronAPI.onMenuEvent(handleMenuEvent);
    }

    // Set up file manager listeners
    const fm = fileManager.getInstance();
    fm.addChangeListener(handleFileChange);
    fm.addFileLoadListener(handleFileLoad);

    return () => {
      // Cleanup listeners
      fm.removeChangeListener(handleFileChange);
      fm.removeFileLoadListener(handleFileLoad);
    };
  }, [handleFileChange, handleFileLoad]);

  const handleNewConfig = () => {
    fileManager.getInstance().createNewFile();
    setConfiguration(null);
    dispatch({ type: "SET_SELECTED_DEVICE", payload: null });
    dispatch({ type: "SET_ACTIVE_PANEL", payload: "device" });
    dispatch({
      type: "SET_STATUS_MESSAGE",
      payload: "New configuration created",
    });
  };

  const handleOpenConfig = async () => {
    try {
      setIsLoading(true);
      setLoadingText("Opening configuration file...");
      setOperationProgress(undefined);
      dispatch({
        type: "SET_STATUS_MESSAGE",
        payload: "Opening configuration file...",
      });

      startPerformanceMeasurement();
      const result = await fileManager.getInstance().openFile();

      if (result) {
        setLoadingText("Processing configuration...");
        setOperationProgress(50);

        // Use debounced update for large configurations
        debouncedUpdate(() => {
          setConfiguration(result.config);
          dispatch({
            type: "SET_SELECTED_DEVICE",
            payload: result.config.devices[0] || null,
          });
          dispatch({ type: "SET_ACTIVE_PANEL", payload: "device" });
          dispatch({
            type: "SET_STATUS_MESSAGE",
            payload: `Opened: ${result.file.filename}`,
          });

          setOperationProgress(100);
          setTimeout(() => {
            setIsLoading(false);
            setOperationProgress(undefined);
            endPerformanceMeasurement();
          }, 200);
        });
      } else {
        setIsLoading(false);
        setOperationProgress(undefined);
        dispatch({ type: "SET_STATUS_MESSAGE", payload: "File open canceled" });
      }
    } catch (error) {
      setIsLoading(false);
      setOperationProgress(undefined);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "SET_STATUS_MESSAGE",
        payload: `Failed to open file: ${errorMessage}`,
      });
      console.error("Failed to open file:", error);
    }
  };

  const handleSaveConfig = async () => {
    if (!configuration) {
      dispatch({
        type: "SET_STATUS_MESSAGE",
        payload: "No configuration to save",
      });
      return;
    }

    try {
      setIsLoading(true);
      setLoadingText("Saving configuration...");
      setOperationProgress(25);
      dispatch({
        type: "SET_STATUS_MESSAGE",
        payload: "Saving configuration...",
      });

      setOperationProgress(50);
      const fileInfo = await fileManager
        .getInstance()
        .saveFile(configuration, currentFile?.path);

      setOperationProgress(75);
      setCurrentFile({
        path: fileInfo.path,
        filename: fileInfo.filename,
        lastSaved: new Date(),
      });

      setOperationProgress(100);
      dispatch({
        type: "SET_STATUS_MESSAGE",
        payload: `Saved: ${fileInfo.filename}`,
      });

      setTimeout(() => {
        setIsLoading(false);
        setOperationProgress(undefined);
        optimizeMemoryUsage();
      }, 200);
    } catch (error) {
      setIsLoading(false);
      setOperationProgress(undefined);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "SET_STATUS_MESSAGE",
        payload: `Failed to save file: ${errorMessage}`,
      });
      console.error("Failed to save file:", error);
    }
  };

  const handleOpenRecentFile = async (filePath: string) => {
    try {
      dispatch({
        type: "SET_STATUS_MESSAGE",
        payload: "Opening recent file...",
      });
      const result = await fileManager.getInstance().openRecentFile(filePath);

      if (result) {
        setConfiguration(result.config);
        dispatch({
          type: "SET_SELECTED_DEVICE",
          payload: result.config.devices[0] || null,
        });
        dispatch({ type: "SET_ACTIVE_PANEL", payload: "device" });
        dispatch({
          type: "SET_STATUS_MESSAGE",
          payload: `Opened: ${result.file.filename}`,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "SET_STATUS_MESSAGE",
        payload: `Failed to open recent file: ${errorMessage}`,
      });
      console.error("Failed to open recent file:", error);
    }
  };

  const handlePreview = () => {
    dispatch({ type: "SET_ACTIVE_PANEL", payload: "preview" });
    dispatch({
      type: "SET_STATUS_MESSAGE",
      payload: "Showing configuration preview",
    });
  };

  const handleAbout = () => {
    // TODO: Implement about dialog
    dispatch({ type: "SET_STATUS_MESSAGE", payload: "About Logiops GUI" });
  };

  const handleExportConfiguration = useCallback(
    async (content: string, format: "cfg" | "json") => {
      try {
        dispatch({
          type: "SET_STATUS_MESSAGE",
          payload: "Exporting configuration...",
        });

        // Determine the default filename
        const extension = format === "cfg" ? ".cfg" : ".json";
        const defaultFilename = currentFile?.filename
          ? currentFile.filename.replace(/\.[^.]+$/, extension)
          : `configuration${extension}`;

        // Use electron's save dialog directly for both formats
        if (window.electronAPI && window.electronAPI.saveFile) {
          const result = await window.electronAPI.saveFile(
            content,
            undefined,
            defaultFilename
          );

          if (result.canceled) {
            dispatch({
              type: "SET_STATUS_MESSAGE",
              payload: "Export canceled",
            });
          } else if (result.error) {
            dispatch({
              type: "SET_STATUS_MESSAGE",
              payload: `Export failed: ${result.error}`,
            });
          } else if (result.filename) {
            dispatch({
              type: "SET_STATUS_MESSAGE",
              payload: `Exported as ${result.filename}`,
            });
          }
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(content);
          dispatch({
            type: "SET_STATUS_MESSAGE",
            payload:
              "Configuration copied to clipboard (export dialog not available)",
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        dispatch({
          type: "SET_STATUS_MESSAGE",
          payload: `Export failed: ${errorMessage}`,
        });
        console.error("Export failed:", error);
      }
    },
    [currentFile, dispatch]
  );

  // Device configuration handlers
  const handleDeviceChange = useCallback(
    (device: Device) => {
      updateDevice(device);
      dispatch({ type: "SET_SELECTED_DEVICE", payload: device });
      dispatch({
        type: "SET_STATUS_MESSAGE",
        payload: "Device configuration updated",
      });
    },
    [updateDevice, dispatch]
  );

  const handleValidationChange = useCallback(
    (isValid: boolean, errors: string[]) => {
      if (errors.length > 0) {
        dispatch({
          type: "SET_STATUS_MESSAGE",
          payload: `Validation errors: ${errors.length}`,
        });
      } else if (validationState.warnings.length > 0) {
        dispatch({
          type: "SET_STATUS_MESSAGE",
          payload: `Configuration valid with ${validationState.warnings.length} warnings`,
        });
      } else {
        dispatch({
          type: "SET_STATUS_MESSAGE",
          payload: "Configuration is valid",
        });
      }
    },
    [validationState.warnings.length, dispatch]
  );

  // Tree view handlers
  const handleTreeNodeSelect = useCallback(
    (nodeId: string, node: any) => {
      dispatch({
        type: "SET_STATUS_MESSAGE",
        payload: `Selected: ${node.label}`,
      });

      // If a device node is selected, switch to device panel and select that device
      if (node.type === "device" && node.data) {
        dispatch({ type: "SET_SELECTED_DEVICE", payload: node.data });
        dispatch({ type: "SET_ACTIVE_PANEL", payload: "device" });
      }
    },
    [dispatch]
  );

  const handleTreeNodeAdd = useCallback(
    (parentNodeId: string, nodeType: string) => {
      dispatch({
        type: "SET_STATUS_MESSAGE",
        payload: `Adding ${nodeType} to ${parentNodeId}`,
      });
      // TODO: Implement node addition logic
      // This would involve updating the configuration and refreshing the tree
    },
    [dispatch]
  );

  const handleTreeNodeRemove = useCallback(
    (nodeId: string) => {
      dispatch({
        type: "SET_STATUS_MESSAGE",
        payload: `Removing node ${nodeId}`,
      });
      // TODO: Implement node removal logic
      // This would involve updating the configuration and refreshing the tree
    },
    [dispatch]
  );

  const handleTreeNodeEdit = useCallback(
    (nodeId: string, node: any) => {
      dispatch({
        type: "SET_STATUS_MESSAGE",
        payload: `Editing ${node.label}`,
      });
      // TODO: Implement node editing logic
      // This could open a modal or switch to the appropriate panel for editing
    },
    [dispatch]
  );

  const handlePanelChange = useCallback(
    (panel: "welcome" | "device" | "preview" | "system") => {
      dispatch({ type: "SET_ACTIVE_PANEL", payload: panel });
    },
    [dispatch]
  );

  return (
    <div className="app fade-in">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-group">
          <button
            className="toolbar-button"
            onClick={handleNewConfig}
            title="New Configuration (Ctrl+N)"
          >
            <span className="toolbar-icon">📄</span>
            <span className="toolbar-label">New</span>
          </button>
          <button
            className="toolbar-button"
            onClick={handleOpenConfig}
            title="Open Configuration (Ctrl+O)"
          >
            <span className="toolbar-icon">📁</span>
            <span className="toolbar-label">Open</span>
          </button>
          <button
            className="toolbar-button"
            onClick={handleSaveConfig}
            title="Save Configuration (Ctrl+S)"
            disabled={!isModified}
          >
            <span className="toolbar-icon">💾</span>
            <span className="toolbar-label">Save</span>
          </button>
        </div>
        <div className="toolbar-separator"></div>
        <div className="toolbar-group">
          <button
            className="toolbar-button"
            onClick={() => dispatch({ type: "UNDO" })}
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
          >
            <span className="toolbar-icon">↶</span>
            <span className="toolbar-label">Undo</span>
          </button>
          <button
            className="toolbar-button"
            onClick={() => dispatch({ type: "REDO" })}
            title="Redo (Ctrl+Y)"
            disabled={!canRedo}
          >
            <span className="toolbar-icon">↷</span>
            <span className="toolbar-label">Redo</span>
          </button>
        </div>
        <div className="toolbar-separator"></div>
        <div className="toolbar-group">
          <button
            className={`toolbar-button ${
              state.activePanel === "welcome" ? "active" : ""
            }`}
            onClick={() => handlePanelChange("welcome")}
            title="Welcome"
          >
            <span className="toolbar-icon">🏠</span>
            <span className="toolbar-label">Welcome</span>
          </button>
          <button
            className={`toolbar-button ${
              state.activePanel === "device" ? "active" : ""
            }`}
            onClick={() => handlePanelChange("device")}
            title="Device Configuration"
          >
            <span className="toolbar-icon">⚙️</span>
            <span className="toolbar-label">Device</span>
          </button>
          <button
            className={`toolbar-button ${
              state.activePanel === "preview" ? "active" : ""
            }`}
            onClick={() => handlePanelChange("preview")}
            title="Configuration Preview"
          >
            <span className="toolbar-icon">👁️</span>
            <span className="toolbar-label">Preview</span>
          </button>
        </div>
        <div className="toolbar-separator"></div>
        <div className="toolbar-group">
          <button
            className={`toolbar-button ${
              state.activePanel === "system" ? "active" : ""
            }`}
            onClick={() => handlePanelChange("system")}
            title="System Status"
          >
            <span className="toolbar-icon">🖥️</span>
            <span className="toolbar-label">System</span>
          </button>
          <button
            className="toolbar-button"
            onClick={() => setShowPreferences(true)}
            title="Preferences"
          >
            <span className="toolbar-icon">⚙️</span>
            <span className="toolbar-label">Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-container">
        {/* Global validation summary - only show when there are issues */}
        {configuration &&
          (validationState.errors.length > 0 ||
            validationState.warnings.length > 0) && (
            <ErrorSummaryPanel
              errors={validationState.errors}
              warnings={validationState.warnings}
              className="global-validation-summary"
            />
          )}

        <main className="app-main">
          {state.activePanel === "welcome" && (
            <div className="welcome-message fade-in">
              <h2>Welcome to Logiops GUI</h2>
              <p>
                This application helps you configure your Logitech devices
                through an intuitive interface.
              </p>
              <p>Use the toolbar above or the File menu to get started.</p>
              {currentFile && (
                <div className="current-file-info">
                  <p>
                    <strong>Current file:</strong> {currentFile.filename}
                  </p>
                  <p>
                    <strong>Path:</strong> {currentFile.path}
                  </p>
                  {isModified && (
                    <p className="modified-indicator">• Unsaved changes</p>
                  )}
                </div>
              )}

              {recentFiles.length > 0 && (
                <div className="recent-files">
                  <h3>Recent Files</h3>
                  <ul>
                    {recentFiles.slice(0, 5).map((file, index) => (
                      <li key={index}>
                        <button
                          className="recent-file-button"
                          onClick={() => handleOpenRecentFile(file.path)}
                          title={file.path}
                        >
                          {file.filename}
                        </button>
                        <span className="recent-file-date">
                          {file.lastOpened.toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {state.activePanel === "device" && (
            <div className="slide-in-right">
              <DeviceConfigurationPanel
                device={state.selectedDevice}
                onDeviceChange={handleDeviceChange}
                onValidationChange={handleValidationChange}
              />
            </div>
          )}

          {state.activePanel === "preview" && (
            <div className="preview-panel slide-in-up">
              <ConfigurationPreview
                configuration={configuration}
                onExport={handleExportConfiguration}
              />
            </div>
          )}

          {state.activePanel === "system" && (
            <div className="system-panel fade-in">
              <SystemStatusPanel />
            </div>
          )}
        </main>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <span className="status-message">{state.statusMessage}</span>
        </div>
        <div className="status-right">
          <span className="status-info">
            {currentFile ? `File: ${currentFile.filename}` : "No file loaded"}
            {isModified && " •"}
          </span>
        </div>
      </div>

      {/* Preferences Dialog */}
      <PreferencesDialog
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <LoadingSpinner
          overlay={true}
          text={loadingText}
          className="scale-in"
        />
      )}

      {/* Progress Bar for Operations */}
      {operationProgress !== undefined && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <ProgressBar
            progress={operationProgress}
            size="small"
            color="primary"
          />
        </div>
      )}

      {/* Performance Monitor */}
      <PerformanceMonitor show={process.env.NODE_ENV === "development"} />
    </div>
  );
};

export default App;

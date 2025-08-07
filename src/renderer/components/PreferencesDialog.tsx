import React, { useState } from "react";
import { usePreferences } from "../context/AppStateContext";
import { UserPreferences } from "../types/logiops";

interface PreferencesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const PreferencesDialog: React.FC<PreferencesDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { preferences, updatePreferences } = usePreferences();
  const [localPreferences, setLocalPreferences] =
    useState<UserPreferences>(preferences);

  if (!isOpen) return null;

  const handleSave = () => {
    updatePreferences(localPreferences);
    onClose();
  };

  const handleCancel = () => {
    setLocalPreferences(preferences); // Reset to original values
    onClose();
  };

  const handleChange = (key: keyof UserPreferences, value: any) => {
    setLocalPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="preferences-dialog-overlay">
      <div className="preferences-dialog">
        <div className="preferences-header">
          <h2>Preferences</h2>
          <button className="close-button" onClick={handleCancel}>
            ×
          </button>
        </div>

        <div className="preferences-content">
          {/* Auto-save settings */}
          <div className="preference-section">
            <h3>Auto-save</h3>
            <div className="preference-item">
              <label>
                <input
                  type="checkbox"
                  checked={localPreferences.autoSave}
                  onChange={(e) => handleChange("autoSave", e.target.checked)}
                />
                Enable auto-save
              </label>
            </div>
            <div className="preference-item">
              <label>
                Auto-save interval (minutes):
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={localPreferences.autoSaveInterval}
                  onChange={(e) =>
                    handleChange("autoSaveInterval", parseInt(e.target.value))
                  }
                  disabled={!localPreferences.autoSave}
                />
              </label>
            </div>
          </div>

          {/* Theme settings */}
          <div className="preference-section">
            <h3>Appearance</h3>
            <div className="preference-item">
              <label>Theme:</label>
              <div className="theme-selector">
                <div className="theme-options">
                  <label className="theme-option">
                    <input
                      type="radio"
                      name="theme"
                      value="system"
                      checked={localPreferences.theme === "system"}
                      onChange={(e) =>
                        handleChange(
                          "theme",
                          e.target.value as "light" | "dark" | "system"
                        )
                      }
                    />
                    <div className="theme-preview system">
                      <div className="theme-preview-content">
                        <div className="theme-preview-header"></div>
                        <div className="theme-preview-body"></div>
                      </div>
                    </div>
                    <span>System</span>
                  </label>
                  <label className="theme-option">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={localPreferences.theme === "light"}
                      onChange={(e) =>
                        handleChange(
                          "theme",
                          e.target.value as "light" | "dark" | "system"
                        )
                      }
                    />
                    <div className="theme-preview light">
                      <div className="theme-preview-content">
                        <div className="theme-preview-header"></div>
                        <div className="theme-preview-body"></div>
                      </div>
                    </div>
                    <span>Light</span>
                  </label>
                  <label className="theme-option">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={localPreferences.theme === "dark"}
                      onChange={(e) =>
                        handleChange(
                          "theme",
                          e.target.value as "light" | "dark" | "system"
                        )
                      }
                    />
                    <div className="theme-preview dark">
                      <div className="theme-preview-content">
                        <div className="theme-preview-header"></div>
                        <div className="theme-preview-body"></div>
                      </div>
                    </div>
                    <span>Dark</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* UI settings */}
          <div className="preference-section">
            <h3>User Interface</h3>
            <div className="preference-item">
              <label>
                <input
                  type="checkbox"
                  checked={localPreferences.showTooltips}
                  onChange={(e) =>
                    handleChange("showTooltips", e.target.checked)
                  }
                />
                Show tooltips
              </label>
            </div>
            <div className="preference-item">
              <label>
                <input
                  type="checkbox"
                  checked={localPreferences.validateOnType}
                  onChange={(e) =>
                    handleChange("validateOnType", e.target.checked)
                  }
                />
                Validate while typing
              </label>
            </div>
          </div>

          {/* File management settings */}
          <div className="preference-section">
            <h3>File Management</h3>
            <div className="preference-item">
              <label>
                Recent files limit:
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={localPreferences.recentFilesLimit}
                  onChange={(e) =>
                    handleChange("recentFilesLimit", parseInt(e.target.value))
                  }
                />
              </label>
            </div>
          </div>
        </div>

        <div className="preferences-footer">
          <button className="button-secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button className="button-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesDialog;

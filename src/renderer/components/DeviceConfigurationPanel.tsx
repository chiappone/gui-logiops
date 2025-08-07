import React, { useState, useCallback } from "react";
import {
  Device,
  DPISettings,
  ButtonMapping,
  GestureMapping,
  ScrollWheelSettings,
  ButtonAction,
  COMMON_LOGITECH_DEVICES,
  VALIDATION_CONSTANTS,
} from "../types/logiops";
import { validateDevice } from "../utils/validation";
import { useDeviceValidation } from "../hooks/useValidation";
import ErrorSummaryPanel from "./ErrorSummaryPanel";
import ValidatedInput from "./ValidatedInput";
import ValidatedSelect from "./ValidatedSelect";
import KeyRecorder from "./KeyRecorder";
import LoadingSpinner from "./LoadingSpinner";

interface DeviceConfigurationPanelProps {
  device: Device | null;
  onDeviceChange: (device: Device) => void;
  onValidationChange: (isValid: boolean, errors: string[]) => void;
}

const DeviceConfigurationPanel: React.FC<DeviceConfigurationPanelProps> = ({
  device,
  onDeviceChange,
  onValidationChange,
}) => {
  const validationState = useDeviceValidation(device, 300);
  const [isProcessing, setIsProcessing] = useState(false);

  // Notify parent of validation changes
  React.useEffect(() => {
    const errors = validationState.errors.map((error) => error.message);
    onValidationChange(validationState.isValid, errors);
  }, [validationState.isValid, validationState.errors, onValidationChange]);

  // Handle device selection change
  const handleDeviceSelect = useCallback(
    (selectedDevice: (typeof COMMON_LOGITECH_DEVICES)[0] | null) => {
      if (!selectedDevice) return;

      const newDevice: Device = {
        name: selectedDevice.name,
        vid: selectedDevice.vid,
        pid: selectedDevice.pid,
        timeout: 1500, // Default timeout
        dpi: {
          sensors: [{ dpi: VALIDATION_CONSTANTS.DPI.DEFAULT, default: true }],
        },
        buttons: [],
        scrollWheel: {
          hires: false,
          invert: false,
          target: false,
        },
      };

      onDeviceChange(newDevice);
    },
    [onDeviceChange]
  );

  // Handle custom device creation
  const handleCustomDevice = useCallback(() => {
    const newDevice: Device = {
      name: "Custom Device",
      vid: "0x046d",
      pid: "0x0000",
      timeout: 1500, // Default timeout
      dpi: {
        sensors: [{ dpi: VALIDATION_CONSTANTS.DPI.DEFAULT, default: true }],
      },
      buttons: [],
      scrollWheel: {
        hires: false,
        invert: false,
        target: false,
      },
    };

    onDeviceChange(newDevice);
  }, [onDeviceChange]);

  // Handle field changes
  const handleFieldChange = useCallback(
    (field: keyof Device, value: any) => {
      if (!device) return;

      const updatedDevice = {
        ...device,
        [field]: value,
      };

      onDeviceChange(updatedDevice);
    },
    [device, onDeviceChange]
  );

  if (!device) {
    return (
      <div className="device-config-panel">
        <div className="device-selection-section">
          <h2>Select a Device</h2>
          <p>Choose a device to configure or create a custom configuration.</p>

          <div className="device-options">
            <div className="common-devices">
              <h3>Common Devices</h3>
              <div className="device-grid">
                {COMMON_LOGITECH_DEVICES.map((deviceInfo) => (
                  <button
                    key={`${deviceInfo.vid}:${deviceInfo.pid}`}
                    className="device-option-button"
                    onClick={() => handleDeviceSelect(deviceInfo)}
                  >
                    <div className="device-name">{deviceInfo.name}</div>
                    <div className="device-id">
                      {deviceInfo.vid}:{deviceInfo.pid}
                    </div>
                    <div className="device-description">
                      {deviceInfo.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="custom-device-section">
              <h3>Custom Device</h3>
              <button
                className="custom-device-button"
                onClick={handleCustomDevice}
              >
                Create Custom Device Configuration
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="device-config-panel">
      <ErrorSummaryPanel
        errors={validationState.errors}
        warnings={validationState.warnings}
      />

      {/* Device Information */}
      <div className="config-section">
        <h3>Device Information</h3>
        <div className="form-grid">
          <ValidatedInput
            id="device-name"
            label="Device Name"
            value={device.name}
            onChange={(value) => handleFieldChange("name", value)}
            fieldPath="device.name"
            errors={validationState.errors}
            warnings={validationState.warnings}
            required
          />

          <ValidatedInput
            id="device-vid"
            label="Vendor ID (VID)"
            value={device.vid || ""}
            onChange={(value) => handleFieldChange("vid", value)}
            fieldPath="device.vid"
            errors={validationState.errors}
            warnings={validationState.warnings}
            placeholder="0x046d"
            pattern="0x[0-9a-fA-F]{4}"
            required
          />

          <ValidatedInput
            id="device-pid"
            label="Product ID (PID)"
            value={device.pid || ""}
            onChange={(value) => handleFieldChange("pid", value)}
            fieldPath="device.pid"
            errors={validationState.errors}
            warnings={validationState.warnings}
            placeholder="0x4082"
            pattern="0x[0-9a-fA-F]{4}"
            required
          />

          <ValidatedInput
            id="device-timeout"
            label="Timeout (ms)"
            type="number"
            value={device.timeout?.toString() || ""}
            onChange={(value) =>
              handleFieldChange("timeout", value ? parseInt(value) : undefined)
            }
            fieldPath="device.timeout"
            errors={validationState.errors}
            warnings={validationState.warnings}
            placeholder="1500"
          />
        </div>
      </div>

      {/* SmartShift Configuration */}
      <SmartShiftSection
        device={device}
        onDeviceChange={onDeviceChange}
        validationState={validationState}
      />

      {/* Button Mapping */}
      <ButtonMappingSection
        device={device}
        onDeviceChange={onDeviceChange}
        validationState={validationState}
      />

      {/* Scroll Wheel Configuration */}
      <ScrollWheelSection
        device={device}
        onDeviceChange={onDeviceChange}
        validationState={validationState}
      />
    </div>
  );
};

export default DeviceConfigurationPanel;

// Button Mapping Section Component
interface ButtonMappingSectionProps {
  device: Device;
  onDeviceChange: (device: Device) => void;
  validationState: any;
}

const ButtonMappingSection: React.FC<ButtonMappingSectionProps> = ({
  device,
  onDeviceChange,
  validationState,
}) => {
  const buttonMappings = device.buttons || [];

  const handleButtonMappingChange = useCallback(
    (index: number, mapping: ButtonMapping) => {
      const updatedMappings = [...buttonMappings];
      updatedMappings[index] = mapping;

      const updatedDevice = {
        ...device,
        buttons: updatedMappings,
      };

      onDeviceChange(updatedDevice);
    },
    [device, buttonMappings, onDeviceChange]
  );

  const addButtonMapping = useCallback(() => {
    console.log("Adding button mapping...", {
      currentButtons: buttonMappings.length,
    });
    const newMapping: ButtonMapping = {
      cid: "0x50",
      action: { type: "key", parameters: { keys: [] } },
    };

    const updatedDevice = {
      ...device,
      buttons: [...buttonMappings, newMapping],
    };

    console.log("New device with button mapping:", updatedDevice);
    onDeviceChange(updatedDevice);
  }, [device, buttonMappings, onDeviceChange]);

  const removeButtonMapping = useCallback(
    (index: number) => {
      const updatedMappings = buttonMappings.filter((_, i) => i !== index);

      const updatedDevice = {
        ...device,
        buttons: updatedMappings,
      };

      onDeviceChange(updatedDevice);
    },
    [device, buttonMappings, onDeviceChange]
  );

  return (
    <div className="config-section">
      <h3>Button Mapping</h3>
      <p>
        Configure button actions. For gestures, set Button ID to 0xc3 and Action
        Type to "Gestures".
      </p>

      <div className="button-mappings">
        {buttonMappings.map((mapping, index) => (
          <ButtonMappingItem
            key={index}
            mapping={mapping}
            index={index}
            onChange={(updatedMapping) =>
              handleButtonMappingChange(index, updatedMapping)
            }
            onRemove={() => removeButtonMapping(index)}
          />
        ))}
      </div>

      <button type="button" className="add-button" onClick={addButtonMapping}>
        Add Button Mapping
      </button>
    </div>
  );
};

// Individual Button Mapping Item Component
interface ButtonMappingItemProps {
  mapping: ButtonMapping;
  index: number;
  onChange: (mapping: ButtonMapping) => void;
  onRemove: () => void;
}

const ButtonMappingItem: React.FC<ButtonMappingItemProps> = ({
  mapping,
  index,
  onChange,
  onRemove,
}) => {
  const handleCidChange = useCallback(
    (cid: string) => {
      onChange({ ...mapping, cid });
    },
    [mapping, onChange]
  );

  const handleActionTypeChange = useCallback(
    (type: ButtonAction["type"]) => {
      console.log("Changing action type to:", type);
      const newAction: ButtonAction = { type, parameters: {} };

      // Set default parameters based on action type
      switch (type) {
        case "key":
          newAction.parameters = { keys: [] };
          break;
        case "gesture":
          newAction.parameters = {
            gestures: [
              {
                direction: "up",
                mode: "OnRelease",
                action: { type: "key", parameters: { keys: [] } },
              },
            ],
          };
          console.log("Set gesture parameters:", newAction.parameters);
          break;
        case "changeDPI":
          newAction.parameters = { sensor: 0 };
          break;
        default:
          newAction.parameters = {};
      }

      console.log("New action:", newAction);
      onChange({ ...mapping, action: newAction });
    },
    [mapping, onChange]
  );

  const handleParameterChange = useCallback(
    (key: string, value: any) => {
      const updatedParameters = { ...mapping.action.parameters, [key]: value };
      onChange({
        ...mapping,
        action: { ...mapping.action, parameters: updatedParameters },
      });
    },
    [mapping, onChange]
  );

  return (
    <div className="button-mapping-item">
      <div className="mapping-header">
        <h4>Button {index + 1}</h4>
        <button type="button" className="remove-button" onClick={onRemove}>
          Remove
        </button>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor={`cid-${index}`}>Button ID (CID)</label>
          <select
            id={`cid-${index}`}
            value={mapping.cid}
            onChange={(e) => handleCidChange(e.target.value)}
          >
            <option value="0x50">Left Click (0x50)</option>
            <option value="0x51">Right Click (0x51)</option>
            <option value="0x52">Middle Click (0x52)</option>
            <option value="0x53">Back Button (0x53)</option>
            <option value="0x56">Forward Button (0x56)</option>
            <option value="0xc3">Gesture Button (0xc3)</option>
            <option value="0xc4">Smart Shift (0xc4)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor={`action-type-${index}`}>Action Type</label>
          <select
            id={`action-type-${index}`}
            value={mapping.action.type}
            onChange={(e) =>
              handleActionTypeChange(e.target.value as ButtonAction["type"])
            }
          >
            <option value="key">Key Press</option>
            <option value="gesture">Gestures</option>
            <option value="changeDPI">Change DPI</option>
            <option value="toggleSmartShift">Toggle Smart Shift</option>
            <option value="cycleHiRes">Cycle Hi-Res</option>
            <option value="toggleHiRes">Toggle Hi-Res</option>
          </select>
        </div>
      </div>

      {/* Action-specific parameters */}
      {mapping.action.type === "key" && (
        <KeyRecorder
          id={`keys-${index}`}
          label="Keys"
          value={(mapping.action.parameters?.keys as string[]) || []}
          onChange={(keys) => handleParameterChange("keys", keys)}
          placeholder="Click Record to capture keys, or type manually (e.g., KEY_LEFTCTRL, KEY_C)"
        />
      )}

      {mapping.action.type === "gesture" && (
        <div className="gesture-config">
          <h5>Gesture Configuration</h5>
          {(
            (mapping.action.parameters?.gestures as GestureMapping[]) || []
          ).map((gesture, gestureIndex) => (
            <div key={gestureIndex} className="gesture-item">
              <div className="form-grid">
                <div className="form-group">
                  <label>Direction</label>
                  <select
                    value={gesture.direction}
                    onChange={(e) => {
                      const updatedGestures = [
                        ...((mapping.action.parameters
                          ?.gestures as GestureMapping[]) || []),
                      ];
                      updatedGestures[gestureIndex] = {
                        ...gesture,
                        direction: e.target.value as any,
                      };
                      handleParameterChange("gestures", updatedGestures);
                    }}
                  >
                    <option value="up">Up</option>
                    <option value="down">Down</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Mode</label>
                  <select
                    value={gesture.mode}
                    onChange={(e) => {
                      const updatedGestures = [
                        ...((mapping.action.parameters
                          ?.gestures as GestureMapping[]) || []),
                      ];
                      updatedGestures[gestureIndex] = {
                        ...gesture,
                        mode: e.target.value as any,
                      };
                      handleParameterChange("gestures", updatedGestures);
                    }}
                  >
                    <option value="OnRelease">On Release</option>
                    <option value="OnFewPixels">On Few Pixels</option>
                    <option value="OnInterval">On Interval</option>
                  </select>
                </div>
              </div>
              <KeyRecorder
                id={`gesture-keys-${index}-${gestureIndex}`}
                label="Keys"
                value={(gesture.action.parameters?.keys as string[]) || []}
                onChange={(keys) => {
                  const updatedGestures = [
                    ...((mapping.action.parameters
                      ?.gestures as GestureMapping[]) || []),
                  ];
                  updatedGestures[gestureIndex] = {
                    ...gesture,
                    action: {
                      ...gesture.action,
                      parameters: { ...gesture.action.parameters, keys },
                    },
                  };
                  handleParameterChange("gestures", updatedGestures);
                }}
                placeholder="Keys for this gesture direction"
              />
              <button
                type="button"
                className="remove-button"
                onClick={() => {
                  const updatedGestures = (
                    (mapping.action.parameters?.gestures as GestureMapping[]) ||
                    []
                  ).filter((_, i) => i !== gestureIndex);
                  handleParameterChange("gestures", updatedGestures);
                }}
              >
                Remove Gesture
              </button>
            </div>
          ))}
          <button
            type="button"
            className="add-button"
            onClick={() => {
              const currentGestures =
                (mapping.action.parameters?.gestures as GestureMapping[]) || [];
              const newGesture: GestureMapping = {
                direction: "up",
                mode: "OnRelease",
                action: { type: "key", parameters: { keys: [] } },
              };
              handleParameterChange("gestures", [
                ...currentGestures,
                newGesture,
              ]);
            }}
          >
            Add Gesture Direction
          </button>
        </div>
      )}

      {mapping.action.type === "changeDPI" && (
        <div className="form-group">
          <label htmlFor={`sensor-${index}`}>Sensor Index</label>
          <input
            id={`sensor-${index}`}
            type="number"
            min="0"
            value={mapping.action.parameters?.sensor || 0}
            onChange={(e) =>
              handleParameterChange("sensor", parseInt(e.target.value) || 0)
            }
          />
        </div>
      )}
    </div>
  );
};

// SmartShift Section Component
interface SmartShiftSectionProps {
  device: Device;
  onDeviceChange: (device: Device) => void;
  validationState: any;
}

const SmartShiftSection: React.FC<SmartShiftSectionProps> = ({
  device,
  onDeviceChange,
  validationState,
}) => {
  const smartshift = device.smartshift;

  const handleSmartShiftToggle = useCallback(
    (enabled: boolean) => {
      const updatedDevice = {
        ...device,
        smartshift: enabled ? { on: true, threshold: 20 } : undefined,
      };

      onDeviceChange(updatedDevice);
    },
    [device, onDeviceChange]
  );

  const handleThresholdChange = useCallback(
    (threshold: number) => {
      if (!smartshift) return;

      const updatedDevice = {
        ...device,
        smartshift: { ...smartshift, threshold },
      };

      onDeviceChange(updatedDevice);
    },
    [device, smartshift, onDeviceChange]
  );

  return (
    <div className="config-section">
      <h3>SmartShift Configuration</h3>
      <p>
        SmartShift automatically switches between ratcheted and free-spinning
        scroll modes.
      </p>

      <div className="form-grid">
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={!!smartshift}
              onChange={(e) => handleSmartShiftToggle(e.target.checked)}
            />
            Enable SmartShift
          </label>
        </div>

        {smartshift && (
          <div className="form-group">
            <label htmlFor="smartshift-threshold">Threshold</label>
            <input
              id="smartshift-threshold"
              type="number"
              min="1"
              max="100"
              value={smartshift.threshold}
              onChange={(e) =>
                handleThresholdChange(parseInt(e.target.value) || 20)
              }
            />
            <small>
              Sensitivity threshold for switching modes (1-100, recommended: 20)
            </small>
          </div>
        )}
      </div>

      {smartshift && (
        <div className="smartshift-preview">
          <h5>Current Configuration:</h5>
          <div className="config-preview">
            <code>
              smartshift: {"{"}
              <br />
              &nbsp;&nbsp;on: {smartshift.on ? "true" : "false"};
              <br />
              &nbsp;&nbsp;threshold: {smartshift.threshold};
              <br />
              {"};"}
            </code>
          </div>
        </div>
      )}
    </div>
  );
};

// Scroll Wheel Section Component
interface ScrollWheelSectionProps {
  device: Device;
  onDeviceChange: (device: Device) => void;
  validationState: any;
}

const ScrollWheelSection: React.FC<ScrollWheelSectionProps> = ({
  device,
  onDeviceChange,
  validationState,
}) => {
  const scrollWheel = device.scrollWheel || {
    hires: false,
    invert: false,
    target: false,
  };

  const handleScrollWheelChange = useCallback(
    (key: keyof ScrollWheelSettings, value: any) => {
      const updatedScrollWheel = { ...scrollWheel, [key]: value };

      const updatedDevice = {
        ...device,
        scrollWheel: updatedScrollWheel,
      };

      onDeviceChange(updatedDevice);
    },
    [device, scrollWheel, onDeviceChange]
  );

  const handleAxisMultiplierChange = useCallback(
    (direction: "up" | "down", multiplier: number) => {
      const axisAction: ButtonAction = {
        type: "Axis",
        parameters: {
          axis: "REL_WHEEL",
          axis_multiplier: multiplier,
        },
      };

      handleScrollWheelChange(direction, axisAction);
    },
    [handleScrollWheelChange]
  );

  const setDefaultAxisActions = useCallback(() => {
    const upAction: ButtonAction = {
      type: "Axis",
      parameters: {
        axis: "REL_WHEEL",
        axis_multiplier: 0.3,
      },
    };

    const downAction: ButtonAction = {
      type: "Axis",
      parameters: {
        axis: "REL_WHEEL",
        axis_multiplier: -0.3,
      },
    };

    const updatedScrollWheel = {
      ...scrollWheel,
      up: upAction,
      down: downAction,
    };

    const updatedDevice = {
      ...device,
      scrollWheel: updatedScrollWheel,
    };

    onDeviceChange(updatedDevice);
  }, [device, scrollWheel, onDeviceChange]);

  return (
    <div className="config-section">
      <h3>Scroll Wheel Configuration</h3>

      <div className="form-grid">
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={scrollWheel.hires || false}
              onChange={(e) =>
                handleScrollWheelChange("hires", e.target.checked)
              }
            />
            High Resolution Scrolling
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={scrollWheel.invert || false}
              onChange={(e) =>
                handleScrollWheelChange("invert", e.target.checked)
              }
            />
            Invert Scroll Direction
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={scrollWheel.target || false}
              onChange={(e) =>
                handleScrollWheelChange("target", e.target.checked)
              }
            />
            Target Window Under Cursor
          </label>
        </div>
      </div>

      {/* Axis Actions Configuration */}
      <div className="axis-actions-section">
        <h4>Axis Actions</h4>
        <p>Configure scroll wheel axis multipliers for smooth scrolling.</p>

        {(!scrollWheel.up || !scrollWheel.down) && (
          <div className="axis-setup">
            <p>
              No axis actions configured. Click below to set up default axis
              actions:
            </p>
            <button
              type="button"
              className="setup-axis-button"
              onClick={setDefaultAxisActions}
            >
              Setup Default Axis Actions
            </button>
          </div>
        )}

        {(scrollWheel.up || scrollWheel.down) && (
          <div className="axis-config">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="up-multiplier">Up Axis Multiplier</label>
                <input
                  id="up-multiplier"
                  type="number"
                  step="0.1"
                  min="-5"
                  max="5"
                  value={scrollWheel.up?.parameters?.axis_multiplier || 0.3}
                  onChange={(e) =>
                    handleAxisMultiplierChange(
                      "up",
                      parseFloat(e.target.value) || 0.3
                    )
                  }
                />
                <small>
                  Positive values for normal up scrolling (recommended: 0.3)
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="down-multiplier">Down Axis Multiplier</label>
                <input
                  id="down-multiplier"
                  type="number"
                  step="0.1"
                  min="-5"
                  max="5"
                  value={scrollWheel.down?.parameters?.axis_multiplier || -0.3}
                  onChange={(e) =>
                    handleAxisMultiplierChange(
                      "down",
                      parseFloat(e.target.value) || -0.3
                    )
                  }
                />
                <small>
                  Negative values for normal down scrolling (recommended: -0.3)
                </small>
              </div>
            </div>

            <div className="axis-info">
              <h5>Current Configuration:</h5>
              <div className="config-preview">
                <code>
                  hiresscroll: {"{"}
                  <br />
                  &nbsp;&nbsp;hires: {scrollWheel.hires ? "true" : "false"};
                  <br />
                  &nbsp;&nbsp;invert: {scrollWheel.invert ? "true" : "false"};
                  <br />
                  &nbsp;&nbsp;target: {scrollWheel.target ? "true" : "false"};
                  <br />
                  {scrollWheel.up && (
                    <>
                      &nbsp;&nbsp;up: {"{"}
                      <br />
                      &nbsp;&nbsp;&nbsp;&nbsp;mode: "Axis";
                      <br />
                      &nbsp;&nbsp;&nbsp;&nbsp;axis: "REL_WHEEL";
                      <br />
                      &nbsp;&nbsp;&nbsp;&nbsp;axis_multiplier:{" "}
                      {scrollWheel.up.parameters?.axis_multiplier};
                      <br />
                      &nbsp;&nbsp;{"},"}
                      <br />
                    </>
                  )}
                  {scrollWheel.down && (
                    <>
                      &nbsp;&nbsp;down: {"{"}
                      <br />
                      &nbsp;&nbsp;&nbsp;&nbsp;mode: "Axis";
                      <br />
                      &nbsp;&nbsp;&nbsp;&nbsp;axis: "REL_WHEEL";
                      <br />
                      &nbsp;&nbsp;&nbsp;&nbsp;axis_multiplier:{" "}
                      {scrollWheel.down.parameters?.axis_multiplier};
                      <br />
                      &nbsp;&nbsp;{"},"}
                      <br />
                    </>
                  )}
                  {"};"}
                </code>
              </div>
            </div>

            <button
              type="button"
              className="remove-axis-button"
              onClick={() => {
                const updatedScrollWheel = { ...scrollWheel };
                delete updatedScrollWheel.up;
                delete updatedScrollWheel.down;
                const updatedDevice = {
                  ...device,
                  scrollWheel: updatedScrollWheel,
                };
                onDeviceChange(updatedDevice);
              }}
            >
              Remove Axis Actions
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Validation utilities for logiops configuration data
 */

import {
  LogiopsConfiguration,
  Device,
  DPISettings,
  DPISensor,
  ButtonMapping,
  ButtonAction,
  GestureMapping,
  ScrollWheelSettings,
  ValidationError,
  ValidationResult,
  VALIDATION_CONSTANTS,
  COMMON_LOGITECH_DEVICES
} from '../types/logiops';

/**
 * Validates a complete logiops configuration
 */
export function validateConfiguration(config: LogiopsConfiguration): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate metadata
  if (!config.metadata) {
    errors.push({
      path: 'metadata',
      message: 'Configuration metadata is required',
      severity: 'error'
    });
  }

  // Validate devices array
  if (!config.devices || !Array.isArray(config.devices)) {
    errors.push({
      path: 'devices',
      message: 'Devices array is required',
      severity: 'error'
    });
  } else if (config.devices.length === 0) {
    warnings.push({
      path: 'devices',
      message: 'No devices configured',
      severity: 'warning'
    });
  } else {
    // Validate each device
    config.devices.forEach((device, index) => {
      const deviceErrors = validateDevice(device, `devices[${index}]`);
      errors.push(...deviceErrors.errors);
      warnings.push(...deviceErrors.warnings);
    });

    // Check for duplicate devices
    const deviceIds = config.devices.map(d => `${d.vid}:${d.pid}`);
    const duplicates = deviceIds.filter((id, index) => deviceIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push({
        path: 'devices',
        message: `Duplicate devices found: ${duplicates.join(', ')}`,
        severity: 'error'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates a single device configuration
 */
export function validateDevice(device: Device, basePath: string = 'device'): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate required fields
  if (!device.name || device.name.trim() === '') {
    errors.push({
      path: `${basePath}.name`,
      message: 'Device name is required',
      severity: 'error',
      field: 'name'
    });
  }

  if (!device.vid) {
    errors.push({
      path: `${basePath}.vid`,
      message: 'Vendor ID (vid) is required',
      severity: 'error',
      field: 'vid'
    });
  } else if (!VALIDATION_CONSTANTS.DEVICE_ID_PATTERN.test(device.vid)) {
    errors.push({
      path: `${basePath}.vid`,
      message: 'Vendor ID must be in hexadecimal format (e.g., 0x046d)',
      severity: 'error',
      field: 'vid'
    });
  }

  if (!device.pid) {
    errors.push({
      path: `${basePath}.pid`,
      message: 'Product ID (pid) is required',
      severity: 'error',
      field: 'pid'
    });
  } else if (!VALIDATION_CONSTANTS.DEVICE_ID_PATTERN.test(device.pid)) {
    errors.push({
      path: `${basePath}.pid`,
      message: 'Product ID must be in hexadecimal format (e.g., 0x4082)',
      severity: 'error',
      field: 'pid'
    });
  }

  // Check if device is a known Logitech device
  if (device.vid && device.pid) {
    const knownDevice = COMMON_LOGITECH_DEVICES.find(d => d.vid === device.vid && d.pid === device.pid);
    if (!knownDevice) {
      warnings.push({
        path: `${basePath}`,
        message: `Device ${device.vid}:${device.pid} is not in the known devices list`,
        severity: 'warning'
      });
    }
  }

  // Validate optional sections
  if (device.dpi) {
    const dpiResult = validateDPISettings(device.dpi, `${basePath}.dpi`);
    errors.push(...dpiResult.errors);
    warnings.push(...dpiResult.warnings);
  }

  if (device.buttons) {
    device.buttons.forEach((button, index) => {
      const buttonResult = validateButtonMapping(button, `${basePath}.buttons[${index}]`);
      errors.push(...buttonResult.errors);
      warnings.push(...buttonResult.warnings);
    });
  }

  if (device.gestures) {
    device.gestures.forEach((gesture, index) => {
      const gestureResult = validateGestureMapping(gesture, `${basePath}.gestures[${index}]`);
      errors.push(...gestureResult.errors);
      warnings.push(...gestureResult.warnings);
    });
  }

  if (device.scrollWheel) {
    const scrollResult = validateScrollWheelSettings(device.scrollWheel, `${basePath}.scrollWheel`);
    errors.push(...scrollResult.errors);
    warnings.push(...scrollResult.warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates DPI settings
 */
export function validateDPISettings(dpi: DPISettings, basePath: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!dpi.sensors || !Array.isArray(dpi.sensors)) {
    errors.push({
      path: `${basePath}.sensors`,
      message: 'DPI sensors array is required',
      severity: 'error'
    });
  } else if (dpi.sensors.length === 0) {
    errors.push({
      path: `${basePath}.sensors`,
      message: 'At least one DPI sensor must be configured',
      severity: 'error'
    });
  } else {
    let defaultCount = 0;
    dpi.sensors.forEach((sensor, index) => {
      const sensorResult = validateDPISensor(sensor, `${basePath}.sensors[${index}]`);
      errors.push(...sensorResult.errors);
      warnings.push(...sensorResult.warnings);
      
      if (sensor.default) {
        defaultCount++;
      }
    });

    if (defaultCount === 0) {
      warnings.push({
        path: `${basePath}.sensors`,
        message: 'No default DPI sensor specified',
        severity: 'warning'
      });
    } else if (defaultCount > 1) {
      errors.push({
        path: `${basePath}.sensors`,
        message: 'Only one DPI sensor can be marked as default',
        severity: 'error'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates a single DPI sensor
 */
export function validateDPISensor(sensor: DPISensor, basePath: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (typeof sensor.dpi !== 'number') {
    errors.push({
      path: `${basePath}.dpi`,
      message: 'DPI value must be a number',
      severity: 'error',
      field: 'dpi'
    });
  } else if (sensor.dpi < VALIDATION_CONSTANTS.DPI.MIN || sensor.dpi > VALIDATION_CONSTANTS.DPI.MAX) {
    errors.push({
      path: `${basePath}.dpi`,
      message: `DPI must be between ${VALIDATION_CONSTANTS.DPI.MIN} and ${VALIDATION_CONSTANTS.DPI.MAX}`,
      severity: 'error',
      field: 'dpi'
    });
  } else if (sensor.dpi % 50 !== 0) {
    warnings.push({
      path: `${basePath}.dpi`,
      message: 'DPI values are typically multiples of 50',
      severity: 'warning',
      field: 'dpi'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates button mapping
 */
export function validateButtonMapping(button: ButtonMapping, basePath: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!button.cid) {
    errors.push({
      path: `${basePath}.cid`,
      message: 'Button control ID (cid) is required',
      severity: 'error',
      field: 'cid'
    });
  } else if (!VALIDATION_CONSTANTS.BUTTON_CID_PATTERN.test(button.cid)) {
    errors.push({
      path: `${basePath}.cid`,
      message: 'Button control ID must be in hexadecimal format (e.g., 0x52)',
      severity: 'error',
      field: 'cid'
    });
  }

  if (!button.action) {
    errors.push({
      path: `${basePath}.action`,
      message: 'Button action is required',
      severity: 'error'
    });
  } else {
    const actionResult = validateButtonAction(button.action, `${basePath}.action`);
    errors.push(...actionResult.errors);
    warnings.push(...actionResult.warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates button action
 */
export function validateButtonAction(action: ButtonAction, basePath: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const validTypes = ["key", "gesture", "changeDPI", "toggleSmartShift", "cycleHiRes", "toggleHiRes"];
  
  if (!action.type) {
    errors.push({
      path: `${basePath}.type`,
      message: 'Action type is required',
      severity: 'error',
      field: 'type'
    });
  } else if (!validTypes.includes(action.type)) {
    errors.push({
      path: `${basePath}.type`,
      message: `Action type must be one of: ${validTypes.join(', ')}`,
      severity: 'error',
      field: 'type'
    });
  }

  // Validate type-specific parameters
  if (action.type === 'key' && action.parameters?.keys) {
    if (!Array.isArray(action.parameters.keys) || action.parameters.keys.length === 0) {
      errors.push({
        path: `${basePath}.parameters.keys`,
        message: 'Key action requires at least one key',
        severity: 'error'
      });
    }
  }

  if (action.type === 'changeDPI' && action.parameters?.sensor !== undefined) {
    if (typeof action.parameters.sensor !== 'number' || action.parameters.sensor < 0) {
      errors.push({
        path: `${basePath}.parameters.sensor`,
        message: 'Sensor index must be a non-negative number',
        severity: 'error'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates gesture mapping
 */
export function validateGestureMapping(gesture: GestureMapping, basePath: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const validDirections = ["up", "down", "left", "right", "none"];
  const validModes = ["OnRelease", "OnFewPixels", "OnInterval"];

  if (!gesture.direction) {
    errors.push({
      path: `${basePath}.direction`,
      message: 'Gesture direction is required',
      severity: 'error',
      field: 'direction'
    });
  } else if (!validDirections.includes(gesture.direction)) {
    errors.push({
      path: `${basePath}.direction`,
      message: `Gesture direction must be one of: ${validDirections.join(', ')}`,
      severity: 'error',
      field: 'direction'
    });
  }

  if (!gesture.mode) {
    errors.push({
      path: `${basePath}.mode`,
      message: 'Gesture mode is required',
      severity: 'error',
      field: 'mode'
    });
  } else if (!validModes.includes(gesture.mode)) {
    errors.push({
      path: `${basePath}.mode`,
      message: `Gesture mode must be one of: ${validModes.join(', ')}`,
      severity: 'error',
      field: 'mode'
    });
  }

  // Validate mode-specific parameters
  if (gesture.mode === 'OnFewPixels' && gesture.threshold !== undefined) {
    if (typeof gesture.threshold !== 'number' || 
        gesture.threshold < VALIDATION_CONSTANTS.GESTURE_THRESHOLD.MIN || 
        gesture.threshold > VALIDATION_CONSTANTS.GESTURE_THRESHOLD.MAX) {
      errors.push({
        path: `${basePath}.threshold`,
        message: `Threshold must be between ${VALIDATION_CONSTANTS.GESTURE_THRESHOLD.MIN} and ${VALIDATION_CONSTANTS.GESTURE_THRESHOLD.MAX}`,
        severity: 'error',
        field: 'threshold'
      });
    }
  }

  if (gesture.mode === 'OnInterval' && gesture.interval !== undefined) {
    if (typeof gesture.interval !== 'number' || 
        gesture.interval < VALIDATION_CONSTANTS.GESTURE_INTERVAL.MIN || 
        gesture.interval > VALIDATION_CONSTANTS.GESTURE_INTERVAL.MAX) {
      errors.push({
        path: `${basePath}.interval`,
        message: `Interval must be between ${VALIDATION_CONSTANTS.GESTURE_INTERVAL.MIN} and ${VALIDATION_CONSTANTS.GESTURE_INTERVAL.MAX}`,
        severity: 'error',
        field: 'interval'
      });
    }
  }

  if (!gesture.action) {
    errors.push({
      path: `${basePath}.action`,
      message: 'Gesture action is required',
      severity: 'error'
    });
  } else {
    const actionResult = validateButtonAction(gesture.action, `${basePath}.action`);
    errors.push(...actionResult.errors);
    warnings.push(...actionResult.warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates scroll wheel settings
 */
export function validateScrollWheelSettings(scrollWheel: ScrollWheelSettings, basePath: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate boolean properties
  if (scrollWheel.hires !== undefined && typeof scrollWheel.hires !== 'boolean') {
    errors.push({
      path: `${basePath}.hires`,
      message: 'HiRes setting must be a boolean',
      severity: 'error',
      field: 'hires'
    });
  }

  if (scrollWheel.invert !== undefined && typeof scrollWheel.invert !== 'boolean') {
    errors.push({
      path: `${basePath}.invert`,
      message: 'Invert setting must be a boolean',
      severity: 'error',
      field: 'invert'
    });
  }

  if (scrollWheel.target !== undefined && typeof scrollWheel.target !== 'boolean') {
    errors.push({
      path: `${basePath}.target`,
      message: 'Target setting must be a boolean',
      severity: 'error',
      field: 'target'
    });
  }

  // Validate directional actions
  const directions = ['up', 'down', 'left', 'right'] as const;
  directions.forEach(direction => {
    if (scrollWheel[direction]) {
      const actionResult = validateButtonAction(scrollWheel[direction]!, `${basePath}.${direction}`);
      errors.push(...actionResult.errors);
      warnings.push(...actionResult.warnings);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Creates a default configuration
 */
export function createDefaultConfiguration(): LogiopsConfiguration {
  return {
    devices: [],
    metadata: {
      version: '1.0.0',
      created: new Date(),
      modified: new Date()
    }
  };
}

/**
 * Creates a default device
 */
export function createDefaultDevice(): Device {
  return {
    name: 'New Device',
    vid: '0x046d',
    pid: '0x0000'
  };
}
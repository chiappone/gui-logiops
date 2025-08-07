import { ValidationError, Device, COMMON_LOGITECH_DEVICES, VALIDATION_CONSTANTS } from '../types/logiops';

export interface ValidationSuggestion {
  message: string;
  action?: () => void;
  actionLabel?: string;
}

/**
 * Generate suggestions for fixing validation errors
 */
export function generateSuggestions(
  errors: ValidationError[],
  warnings: ValidationError[],
  device?: Device
): Record<string, ValidationSuggestion[]> {
  const suggestions: Record<string, ValidationSuggestion[]> = {};

  // Process errors
  errors.forEach(error => {
    const errorSuggestions = getSuggestionsForError(error, device);
    if (errorSuggestions.length > 0) {
      suggestions[error.path] = errorSuggestions;
    }
  });

  // Process warnings
  warnings.forEach(warning => {
    const warningSuggestions = getSuggestionsForWarning(warning, device);
    if (warningSuggestions.length > 0) {
      if (suggestions[warning.path]) {
        suggestions[warning.path].push(...warningSuggestions);
      } else {
        suggestions[warning.path] = warningSuggestions;
      }
    }
  });

  return suggestions;
}

/**
 * Get suggestions for a specific error
 */
function getSuggestionsForError(error: ValidationError, device?: Device): ValidationSuggestion[] {
  const suggestions: ValidationSuggestion[] = [];

  // Device name errors
  if (error.field === 'name' && error.message.includes('required')) {
    suggestions.push({
      message: 'Enter a descriptive name for your device (e.g., "My Gaming Mouse")'
    });
  }

  // VID/PID format errors
  if (error.field === 'vid' && error.message.includes('hexadecimal format')) {
    suggestions.push({
      message: 'Use hexadecimal format starting with 0x (e.g., 0x046d for Logitech)'
    });
    
    // Suggest common Logitech VID
    if (device && device.vid && !device.vid.startsWith('0x046d')) {
      suggestions.push({
        message: 'Most Logitech devices use VID 0x046d'
      });
    }
  }

  if (error.field === 'pid' && error.message.includes('hexadecimal format')) {
    suggestions.push({
      message: 'Use hexadecimal format starting with 0x (e.g., 0x4082)'
    });
    
    // Suggest looking up the device
    suggestions.push({
      message: 'Check your device documentation or use a USB device scanner to find the correct PID'
    });
  }

  // DPI errors
  if (error.field === 'dpi' && error.message.includes('must be between')) {
    suggestions.push({
      message: `Use a DPI value between ${VALIDATION_CONSTANTS.DPI.MIN} and ${VALIDATION_CONSTANTS.DPI.MAX}`
    });
    
    suggestions.push({
      message: 'Common DPI values: 800, 1000, 1200, 1600, 2400, 3200'
    });
  }

  // Button CID errors
  if (error.field === 'cid' && error.message.includes('hexadecimal format')) {
    suggestions.push({
      message: 'Use 2-digit hexadecimal format (e.g., 0x50 for left click, 0x51 for right click)'
    });
    
    suggestions.push({
      message: 'Common button CIDs: 0x50 (left), 0x51 (right), 0x52 (middle), 0x53 (back), 0x56 (forward)'
    });
  }

  // Action type errors
  if (error.field === 'type' && error.message.includes('must be one of')) {
    suggestions.push({
      message: 'Choose from: key, gesture, changeDPI, toggleSmartShift, cycleHiRes, toggleHiRes'
    });
    
    suggestions.push({
      message: 'Most common action type is "key" for keyboard shortcuts'
    });
  }

  // Key action errors
  if (error.message.includes('Key action requires at least one key')) {
    suggestions.push({
      message: 'Add at least one key (e.g., KEY_C, KEY_LEFTCTRL)'
    });
    
    suggestions.push({
      message: 'Use Linux key codes like KEY_LEFTCTRL, KEY_LEFTALT, KEY_TAB'
    });
  }

  // Gesture errors
  if (error.field === 'direction' && error.message.includes('must be one of')) {
    suggestions.push({
      message: 'Choose from: up, down, left, right, none'
    });
  }

  if (error.field === 'mode' && error.message.includes('must be one of')) {
    suggestions.push({
      message: 'Choose from: OnRelease, OnFewPixels, OnInterval'
    });
    
    suggestions.push({
      message: 'OnRelease is most common for simple gestures'
    });
  }

  // Threshold/interval errors
  if (error.field === 'threshold') {
    suggestions.push({
      message: `Use a threshold between ${VALIDATION_CONSTANTS.GESTURE_THRESHOLD.MIN} and ${VALIDATION_CONSTANTS.GESTURE_THRESHOLD.MAX} pixels`
    });
    
    suggestions.push({
      message: 'Typical values: 10-30 pixels for sensitive gestures, 50+ for less sensitive'
    });
  }

  if (error.field === 'interval') {
    suggestions.push({
      message: `Use an interval between ${VALIDATION_CONSTANTS.GESTURE_INTERVAL.MIN} and ${VALIDATION_CONSTANTS.GESTURE_INTERVAL.MAX} milliseconds`
    });
    
    suggestions.push({
      message: 'Typical values: 100ms for responsive actions, 500ms+ for slower repetition'
    });
  }

  // Sensor index errors
  if (error.message.includes('Sensor index must be a non-negative number')) {
    suggestions.push({
      message: 'Use 0 for the first DPI sensor, 1 for the second, etc.'
    });
  }

  // Multiple default DPI sensors
  if (error.message.includes('Only one DPI sensor can be marked as default')) {
    suggestions.push({
      message: 'Select only one DPI sensor as the default'
    });
  }

  // Empty sensors array
  if (error.message.includes('At least one DPI sensor must be configured')) {
    suggestions.push({
      message: 'Add at least one DPI sensor with a valid DPI value'
    });
  }

  return suggestions;
}

/**
 * Get suggestions for a specific warning
 */
function getSuggestionsForWarning(warning: ValidationError, device?: Device): ValidationSuggestion[] {
  const suggestions: ValidationSuggestion[] = [];

  // Unknown device warning
  if (warning.message.includes('not in the known devices list')) {
    suggestions.push({
      message: 'This device is not in our database. Double-check the VID and PID values.'
    });
    
    // Suggest similar devices
    if (device?.vid === '0x046d') {
      const similarDevices = COMMON_LOGITECH_DEVICES.filter(d => 
        d.name.toLowerCase().includes('mx') || 
        d.name.toLowerCase().includes('g502')
      ).slice(0, 3);
      
      if (similarDevices.length > 0) {
        suggestions.push({
          message: `Similar devices: ${similarDevices.map(d => `${d.name} (${d.pid})`).join(', ')}`
        });
      }
    }
  }

  // No default DPI sensor
  if (warning.message.includes('No default DPI sensor specified')) {
    suggestions.push({
      message: 'Mark one DPI sensor as default for better user experience'
    });
  }

  // DPI not multiple of 50
  if (warning.message.includes('multiples of 50')) {
    suggestions.push({
      message: 'Consider using DPI values that are multiples of 50 (e.g., 1000, 1600, 2400)'
    });
  }

  // No devices configured
  if (warning.message.includes('No devices configured')) {
    suggestions.push({
      message: 'Add at least one device to create a useful configuration'
    });
  }

  return suggestions;
}

/**
 * Get quick fix suggestions for common configuration issues
 */
export function getQuickFixSuggestions(device: Device): ValidationSuggestion[] {
  const suggestions: ValidationSuggestion[] = [];

  // Suggest adding common button mappings if none exist
  if (!device.buttons || device.buttons.length === 0) {
    suggestions.push({
      message: 'Add button mappings to customize your mouse buttons'
    });
  }

  // Suggest enabling DPI if not configured
  if (!device.dpi || device.dpi.sensors.length === 0) {
    suggestions.push({
      message: 'Configure DPI settings for better cursor control'
    });
  }

  // Suggest scroll wheel configuration for supported devices
  const knownDevice = COMMON_LOGITECH_DEVICES.find(d => d.vid === device.vid && d.pid === device.pid);
  if (knownDevice?.supportedFeatures.includes('scrollWheel') && !device.scrollWheel) {
    suggestions.push({
      message: 'This device supports advanced scroll wheel features'
    });
  }

  // Suggest gestures for supported devices
  if (knownDevice?.supportedFeatures.includes('gestures') && (!device.gestures || device.gestures.length === 0)) {
    suggestions.push({
      message: 'This device supports gesture controls for enhanced productivity'
    });
  }

  return suggestions;
}

/**
 * Get contextual help for specific fields
 */
export function getFieldHelp(fieldPath: string): string | null {
  const helpTexts: Record<string, string> = {
    'name': 'A descriptive name for your device that will help you identify it',
    'vid': 'Vendor ID in hexadecimal format (0x046d for Logitech devices)',
    'pid': 'Product ID in hexadecimal format (unique for each device model)',
    'dpi': 'Dots Per Inch - higher values mean faster cursor movement',
    'cid': 'Control ID in hexadecimal format identifying the specific button',
    'action.type': 'The type of action to perform when the button is pressed',
    'direction': 'The direction of the gesture movement',
    'mode': 'When the gesture action should be triggered',
    'threshold': 'Number of pixels the cursor must move before triggering (OnFewPixels mode)',
    'interval': 'Time in milliseconds between repeated actions (OnInterval mode)',
    'hires': 'Enable high-resolution scrolling for smoother scroll wheel operation',
    'invert': 'Reverse the scroll direction',
    'target': 'Enable target-based scrolling'
  };

  // Find the most specific help text
  const pathParts = fieldPath.split('.');
  for (let i = pathParts.length; i > 0; i--) {
    const partialPath = pathParts.slice(-i).join('.');
    if (helpTexts[partialPath]) {
      return helpTexts[partialPath];
    }
  }

  return null;
}
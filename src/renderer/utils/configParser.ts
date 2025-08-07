/**
 * Configuration file parser and generator for logiops .cfg format
 * Uses a custom libconfig parser for reliable parsing
 */

import {
  LogiopsConfiguration,
  Device,
  ButtonMapping,
  GestureMapping,
  ScrollWheelSettings,
  ButtonAction,
  ConfigurationMetadata
} from '../types/logiops';

import { parseLibconfig } from './libconfigParser';

/**
 * Error thrown when parsing fails
 */
export class ConfigParseError extends Error {
  constructor(message: string, public line?: number, public column?: number) {
    super(message);
    this.name = 'ConfigParseError';
  }
}

/**
 * Parses a logiops .cfg file content into internal data model
 */
export function parseConfigFile(content: string, filename?: string): LogiopsConfiguration {
  try {
    // Parse using our custom libconfig parser
    const parsed = parseLibconfig(content);

    // Extract devices array
    const devicesData = parsed.devices || [];
    const devices = parseDevicesFromData(devicesData);

    const metadata: ConfigurationMetadata = {
      version: '1.0.0',
      created: new Date(),
      modified: new Date(),
      filename,
      originalContent: content
    };

    return {
      devices,
      metadata
    };
  } catch (error) {
    if (error instanceof ConfigParseError) {
      throw error;
    }
    throw new ConfigParseError(`Failed to parse configuration file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parses device configurations from parsed data
 */
function parseDevicesFromData(devicesData: any[]): Device[] {
  const devices: Device[] = [];

  for (const deviceData of devicesData) {
    const device = parseDeviceFromData(deviceData);
    if (device) {
      devices.push(device);
    }
  }

  return devices;
}

/**
 * Parses a single device from parsed data
 */
function parseDeviceFromData(data: any): Device | null {
  if (!data.name) {
    return null;
  }

  const device: Device = {
    name: typeof data.name === 'string' ? data.name : String(data.name),
    vid: data.vid ? normalizeHexValue(String(data.vid)) : '',
    pid: data.pid ? normalizeHexValue(String(data.pid)) : ''
  };

  // Parse optional properties
  if (data.timeout !== undefined) {
    device.timeout = Number(data.timeout);
  }

  if (data.dpi !== undefined) {
    if (typeof data.dpi === 'number') {
      device.dpi = {
        sensors: [{ dpi: data.dpi, default: true }]
      };
    } else if (data.dpi && data.dpi.sensors) {
      device.dpi = data.dpi;
    }
  }

  if (data.smartshift) {
    device.smartshift = {
      on: Boolean(data.smartshift.on),
      threshold: data.smartshift.threshold ? Number(data.smartshift.threshold) : 20
    };
  }

  if (data.hiresscroll || data.scrollwheel || data.scroll_wheel) {
    const scrollData = data.hiresscroll || data.scrollwheel || data.scroll_wheel;
    device.scrollWheel = parseScrollWheelFromData(scrollData);
  }

  if (data.buttons && Array.isArray(data.buttons)) {
    device.buttons = data.buttons.map((buttonData: any) => {
      if (!buttonData.cid || !buttonData.action) return null;

      // Normalize the action data recursively
      const normalizedAction = normalizeActionData(buttonData.action);

      return {
        cid: normalizeHexValue(String(buttonData.cid)),
        action: normalizedAction
      };
    }).filter(Boolean);
  }

  if (data.gestures && Array.isArray(data.gestures)) {
    device.gestures = data.gestures.map(parseGestureFromData).filter(Boolean);
  }

  return device;
}

/**
 * Parses a button mapping from parsed data
 */
function parseButtonFromData(data: any): ButtonMapping | null {
  if (!data.cid) {
    return null;
  }

  const action = parseActionFromData(data.action);
  if (!action) {
    return null;
  }

  return {
    cid: normalizeHexValue(String(data.cid)),
    action
  };
}

/**
 * Parses a gesture mapping from parsed data
 */
function parseGestureFromData(data: any): GestureMapping | null {
  if (!data.direction || !data.mode) {
    return null;
  }

  const action = parseActionFromData(data.action);
  if (!action) {
    return null;
  }

  const gesture: GestureMapping = {
    direction: String(data.direction) as any,
    mode: String(data.mode) as any,
    action
  };

  if (data.threshold !== undefined) {
    gesture.threshold = Number(data.threshold);
  }

  if (data.interval !== undefined) {
    gesture.interval = Number(data.interval);
  }

  return gesture;
}

/**
 * Parses scroll wheel settings from parsed data
 */
function parseScrollWheelFromData(data: any): ScrollWheelSettings {
  const settings: ScrollWheelSettings = {};

  if (data.hires !== undefined) {
    settings.hires = Boolean(data.hires);
  }

  if (data.invert !== undefined) {
    settings.invert = Boolean(data.invert);
  }

  if (data.target !== undefined) {
    settings.target = Boolean(data.target);
  }

  // Parse directional actions
  const directions = ['up', 'down', 'left', 'right'] as const;
  for (const direction of directions) {
    if (data[direction]) {
      const directionData = data[direction];

      // Handle axis actions that don't have a type field but have mode and axis
      if (!directionData.type && directionData.mode && directionData.axis) {
        // This is an axis action, but GUI expects specific action types
        // Map axis actions to cycleHiRes for scroll wheel compatibility
        const axisAction: ButtonAction = {
          type: 'cycleHiRes',
          parameters: {
            mode: String(directionData.mode),
            axis: String(directionData.axis)
          }
        };

        if (directionData.axis_multiplier !== undefined) {
          axisAction.parameters!.axis_multiplier = Number(directionData.axis_multiplier);
        }

        settings[direction] = axisAction;
      } else {
        // Use the normal parsing for actions with type field
        const action = parseActionFromData(directionData);
        if (action) {
          settings[direction] = action;
        }
      }
    }
  }

  return settings;
}

/**
 * Parses an action from parsed data
 */
function parseActionFromData(data: any): ButtonAction | null {

  if (!data || !data.type) {
    return null;
  }

  // Normalize action type to expected format
  const originalType = String(data.type);
  const normalizedType = originalType.toLowerCase();

  let actionType: string;
  if (normalizedType === 'keypress') {
    actionType = 'key';
  } else if (normalizedType === 'gestures') {
    actionType = 'gesture';
  } else if (normalizedType === 'changedpi') {
    actionType = 'changeDPI';
  } else {
    actionType = normalizedType;
  }



  const action: ButtonAction = {
    type: actionType as any
  };

  // Parse parameters based on action type
  switch (action.type.toLowerCase()) {
    case 'keypress':
    case 'key':
      if (data.keys) {
        let keys: string[];
        if (Array.isArray(data.keys)) {
          keys = data.keys.map((k: any) => String(k));
        } else {
          keys = [String(data.keys)];
        }
        action.parameters = { keys };
      }
      break;

    case 'gestures':
    case 'gesture':
      if (data.gestures && Array.isArray(data.gestures)) {
        const gestures = data.gestures.map(parseGestureFromData).filter(Boolean);
        action.parameters = { gestures };
      }
      break;

    case 'axis':
      if (data.mode && data.axis) {
        action.parameters = {
          mode: String(data.mode),
          axis: String(data.axis)
        };

        if (data.axis_multiplier !== undefined) {
          action.parameters.axis_multiplier = Number(data.axis_multiplier);
        }
      }
      break;

    case 'changedpi':
      if (data.sensor !== undefined) {
        action.parameters = { sensor: Number(data.sensor) };
      }
      break;
  }

  return action;
}

/**
 * Normalizes action data recursively
 */
function normalizeActionData(actionData: any): ButtonAction {
  // Normalize action type
  const originalType = String(actionData.type);
  const normalizedType = originalType.toLowerCase();

  let actionType: string;
  if (normalizedType === 'keypress') {
    actionType = 'key';
  } else if (normalizedType === 'gestures') {
    actionType = 'gesture';
  } else if (normalizedType === 'changedpi') {
    actionType = 'changeDPI';
  } else {
    actionType = normalizedType;
  }

  const action: ButtonAction = {
    type: actionType as any
  };

  // Process parameters based on action type
  if (actionType === 'key' && actionData.keys) {
    let keys: string[];
    if (Array.isArray(actionData.keys)) {
      keys = actionData.keys.map((k: any) => String(k));
    } else {
      keys = [String(actionData.keys)];
    }
    action.parameters = { keys };
  } else if (actionType === 'gesture' && actionData.gestures && Array.isArray(actionData.gestures)) {
    const gestures = actionData.gestures.map((gestureData: any) => ({
      direction: String(gestureData.direction),
      mode: String(gestureData.mode),
      action: normalizeActionData(gestureData.action) // Recursive normalization
    }));
    action.parameters = { gestures };
  } else if (actionType === 'axis' && actionData.mode && actionData.axis) {
    action.parameters = {
      mode: String(actionData.mode),
      axis: String(actionData.axis)
    };
    if (actionData.axis_multiplier !== undefined) {
      action.parameters.axis_multiplier = Number(actionData.axis_multiplier);
    }
  } else if (actionType === 'changeDPI' && actionData.sensor !== undefined) {
    action.parameters = { sensor: Number(actionData.sensor) };
  }

  return action;
}

/**
 * Normalizes hex values to consistent format
 */
function normalizeHexValue(value: string): string {
  const cleaned = value.trim().toLowerCase();
  if (cleaned.startsWith('0x')) {
    return cleaned;
  }
  return `0x${cleaned}`;
}

/**
 * Generates a logiops .cfg file content from internal data model
 */
export function generateConfigFile(config: LogiopsConfiguration): string {
  const lines: string[] = [];

  // Add header comment
  lines.push('// Generated by logiops-gui');
  lines.push(`// Created: ${config.metadata.created.toISOString()}`);
  lines.push(`// Modified: ${config.metadata.modified.toISOString()}`);
  lines.push('');

  // Generate devices array
  if (config.devices.length > 0) {
    lines.push('devices: (');
    lines.push('{');

    config.devices.forEach((device, index) => {
      lines.push(...generateDeviceConfig(device, '  '));
      if (index < config.devices.length - 1) {
        lines.push('},');
        lines.push('{'); // Separator between devices
      }
    });

    lines.push('});');
  }

  return lines.join('\n');
}

/**
 * Generates configuration for a single device
 */
function generateDeviceConfig(device: Device, indent: string = ''): string[] {
  const lines: string[] = [];

  lines.push(`${indent}// For the ${device.name}`);
  lines.push(`${indent}name: "${device.name}";`);

  // Add vid/pid if present
  if (device.vid) {
    lines.push(`${indent}vid: ${device.vid};`);
  }
  if (device.pid) {
    lines.push(`${indent}pid: ${device.pid};`);
  }

  // Add timeout if available
  if (device.timeout !== undefined) {
    lines.push(`${indent}timeout: ${device.timeout};`);
  }

  // Generate smartshift settings (if available)
  if (device.smartshift) {
    lines.push(`${indent}smartshift:`);
    lines.push(`${indent}{`);
    lines.push(`${indent}  on: ${device.smartshift.on};`);
    lines.push(`${indent}  threshold: ${device.smartshift.threshold};`);
    lines.push(`${indent}};`);
  }

  // Generate hiresscroll settings (renamed from scrollWheel)
  if (device.scrollWheel) {
    lines.push(`${indent}hiresscroll:`);
    lines.push(`${indent}{`);
    if (device.scrollWheel.hires !== undefined) {
      lines.push(`${indent}  hires: ${device.scrollWheel.hires};`);
    }
    if (device.scrollWheel.invert !== undefined) {
      lines.push(`${indent}  invert: ${device.scrollWheel.invert};`);
    }
    if (device.scrollWheel.target !== undefined) {
      lines.push(`${indent}  target: ${device.scrollWheel.target};`);
    }

    // Generate directional actions
    const directions = ['up', 'down', 'left', 'right'] as const;
    directions.forEach(direction => {
      const action = device.scrollWheel![direction];
      if (action) {
        lines.push(`${indent}  ${direction}: {`);
        lines.push(...generateActionConfig(action, `${indent}      `));
        lines.push(`${indent}  },`);
      }
    });

    lines.push(`${indent}};`);
  }

  // Generate DPI settings (simplified)
  if (device.dpi && device.dpi.sensors.length > 0) {
    const defaultSensor = device.dpi.sensors.find(s => s.default) || device.dpi.sensors[0];
    lines.push(`${indent}dpi: ${defaultSensor.dpi};`);
  }

  // Generate button mappings as array
  if (device.buttons && device.buttons.length > 0) {
    lines.push(`${indent}buttons: (`);
    device.buttons.forEach((button, index) => {
      lines.push(`${indent}  {`);
      lines.push(`${indent}    # ${getButtonComment(button.cid)}`);
      lines.push(`${indent}    cid: ${button.cid};`);
      lines.push(`${indent}    action =`);
      lines.push(`${indent}    {`);
      lines.push(...generateActionConfig(button.action, `${indent}      `));
      lines.push(`${indent}    };`);
      lines.push(`${indent}  }${index < (device.buttons?.length || 0) - 1 ? ',' : ''}`);
    });
    lines.push(`${indent});`);
  }

  return lines;
}

/**
 * Generates configuration for an action
 */
function generateActionConfig(action: ButtonAction, indent: string): string[] {
  const lines: string[] = [];

  // Normalize action type to proper format
  let actionType = action.type;
  switch (action.type.toLowerCase()) {
    case 'key':
    case 'keypress':
      actionType = 'Keypress';
      break;
    case 'gesture':
    case 'gestures':
      actionType = 'Gestures';
      break;
    case 'changedpi':
      actionType = 'ChangeDPI';
      break;
    case 'axis':
      actionType = 'Axis';
      break;
    case 'cyclehires':
      actionType = 'cycleHiRes';
      break;
  }

  lines.push(`${indent}type: "${actionType}";`);

  switch (actionType) {
    case 'Keypress':
      if (action.parameters?.keys && Array.isArray(action.parameters.keys)) {
        const keysStr = action.parameters.keys.map(key => `"${key}"`).join(', ');
        lines.push(`${indent}keys: [${keysStr}];`);
      }
      break;

    case 'Gestures':
      if (action.parameters?.gestures && Array.isArray(action.parameters.gestures)) {
        lines.push(`${indent}gestures: (`);
        action.parameters.gestures.forEach((gesture, index) => {
          lines.push(`${indent}  {`);
          const capitalizedDirection = gesture.direction.charAt(0).toUpperCase() + gesture.direction.slice(1);
          lines.push(`${indent}    direction: "${capitalizedDirection}";`);
          lines.push(`${indent}    mode: "${gesture.mode}";`);
          lines.push(`${indent}    action =`);
          lines.push(`${indent}    {`);
          lines.push(...generateActionConfig(gesture.action, `${indent}      `));
          lines.push(`${indent}    };`);
          lines.push(`${indent}  }${index < (action.parameters?.gestures?.length || 0) - 1 ? ',' : ''}`);
        });
        lines.push(`${indent});`);
      }
      break;

    case 'Axis':
      if (action.parameters?.axis) {
        lines.pop(); // Remove the type line we just added
        lines.push(`${indent}mode: "Axis";`);
        lines.push(`${indent}axis: "${action.parameters.axis}";`);
        if (action.parameters?.axis_multiplier !== undefined) {
          lines.push(`${indent}axis_multiplier: ${action.parameters.axis_multiplier};`);
        }
      }
      break;

    case 'cycleHiRes':
      // cycleHiRes is used as a substitute for Axis to satisfy GUI validation
      // Generate the same axis format as the Axis case
      if (action.parameters?.axis) {
        lines.pop(); // Remove the type line we just added
        lines.push(`${indent}mode: "Axis";`);
        lines.push(`${indent}axis: "${action.parameters.axis}";`);
        if (action.parameters?.axis_multiplier !== undefined) {
          lines.push(`${indent}axis_multiplier: ${action.parameters.axis_multiplier};`);
        }
      }
      break;
  }

  return lines;
}

/**
 * Gets a comment for a button based on its CID
 */
function getButtonComment(cid: string): string {
  const buttonComments: Record<string, string> = {
    '0xc3': 'Thumb button',
    '0xc4': 'Forward button',
    '0xc5': 'Back button',
    '0x53': 'Scroll wheel button',
    '0x56': 'Gesture button'
  };

  return buttonComments[cid.toLowerCase()] || 'Button';
}

/**
 * Validates that a configuration file content is well-formed
 */
export function validateConfigSyntax(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    parseConfigFile(content);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof ConfigParseError) {
      errors.push(error.message);
    } else {
      errors.push(`Syntax validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { isValid: false, errors };
  }
}

/**
 * Extracts device information from config content without full parsing
 */
export function extractDeviceInfo(content: string): Array<{ name: string; vid: string; pid: string }> {
  const devices: Array<{ name: string; vid: string; pid: string }> = [];

  try {
    const parsed = parseLibconfig(content);
    const devicesData = parsed.devices || [];

    for (const deviceData of devicesData) {
      if (deviceData.name) {
        devices.push({
          name: String(deviceData.name),
          vid: deviceData.vid ? normalizeHexValue(String(deviceData.vid)) : '',
          pid: deviceData.pid ? normalizeHexValue(String(deviceData.pid)) : ''
        });
      }
    }
  } catch {
    // Ignore errors for info extraction
  }

  return devices;
}
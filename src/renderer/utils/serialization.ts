/**
 * Serialization utilities for converting between internal data models and external formats
 */

import {
  LogiopsConfiguration,
  Device
} from '../types/logiops';

/**
 * Serializes a LogiopsConfiguration to JSON string
 */
export function serializeConfiguration(config: LogiopsConfiguration): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Deserializes a JSON string to LogiopsConfiguration
 */
export function deserializeConfiguration(json: string): LogiopsConfiguration {
  const parsed = JSON.parse(json);
  
  // Convert date strings back to Date objects
  if (parsed.metadata) {
    if (parsed.metadata.created) {
      parsed.metadata.created = new Date(parsed.metadata.created);
    }
    if (parsed.metadata.modified) {
      parsed.metadata.modified = new Date(parsed.metadata.modified);
    }
  }
  
  return parsed as LogiopsConfiguration;
}

/**
 * Creates a deep copy of a configuration
 */
export function cloneConfiguration(config: LogiopsConfiguration): LogiopsConfiguration {
  return deserializeConfiguration(serializeConfiguration(config));
}

/**
 * Creates a deep copy of a device
 */
export function cloneDevice(device: Device): Device {
  return JSON.parse(JSON.stringify(device));
}

/**
 * Converts internal data model to a simplified format for display
 */
export function toDisplayFormat(config: LogiopsConfiguration): {
  deviceCount: number;
  devices: Array<{
    name: string;
    id: string;
    features: {
      dpi: boolean;
      buttons: number;
      gestures: number;
      scrollWheel: boolean;
    };
  }>;
  metadata: {
    version: string;
    created: string;
    modified: string;
    filename?: string;
  };
} {
  return {
    deviceCount: config.devices.length,
    devices: config.devices.map(device => ({
      name: device.name,
      id: `${device.vid}:${device.pid}`,
      features: {
        dpi: !!device.dpi,
        buttons: device.buttons?.length || 0,
        gestures: device.gestures?.length || 0,
        scrollWheel: !!device.scrollWheel
      }
    })),
    metadata: {
      version: config.metadata.version,
      created: config.metadata.created.toISOString(),
      modified: config.metadata.modified.toISOString(),
      filename: config.metadata.filename
    }
  };
}

/**
 * Extracts summary information from a configuration
 */
export function getConfigurationSummary(config: LogiopsConfiguration): {
  deviceCount: number;
  totalButtons: number;
  totalGestures: number;
  devicesWithDPI: number;
  devicesWithScrollWheel: number;
} {
  let totalButtons = 0;
  let totalGestures = 0;
  let devicesWithDPI = 0;
  let devicesWithScrollWheel = 0;

  config.devices.forEach(device => {
    totalButtons += device.buttons?.length || 0;
    totalGestures += device.gestures?.length || 0;
    if (device.dpi) devicesWithDPI++;
    if (device.scrollWheel) devicesWithScrollWheel++;
  });

  return {
    deviceCount: config.devices.length,
    totalButtons,
    totalGestures,
    devicesWithDPI,
    devicesWithScrollWheel
  };
}

/**
 * Validates that a configuration can be safely serialized and deserialized
 */
export function validateSerialization(config: LogiopsConfiguration): boolean {
  try {
    const serialized = serializeConfiguration(config);
    const deserialized = deserializeConfiguration(serialized);
    
    // Basic structure validation
    return (
      deserialized.devices.length === config.devices.length &&
      deserialized.metadata.version === config.metadata.version &&
      deserialized.metadata.created instanceof Date &&
      deserialized.metadata.modified instanceof Date
    );
  } catch {
    return false;
  }
}

/**
 * Merges two configurations, with the second taking precedence for conflicts
 */
export function mergeConfigurations(
  base: LogiopsConfiguration, 
  override: LogiopsConfiguration
): LogiopsConfiguration {
  const merged = cloneConfiguration(base);
  
  // Merge devices by vid:pid, with override taking precedence
  const deviceMap = new Map<string, Device>();
  
  // Add base devices
  base.devices.forEach(device => {
    deviceMap.set(`${device.vid}:${device.pid}`, device);
  });
  
  // Override with new devices
  override.devices.forEach(device => {
    deviceMap.set(`${device.vid}:${device.pid}`, device);
  });
  
  merged.devices = Array.from(deviceMap.values());
  
  // Use override metadata
  merged.metadata = {
    ...base.metadata,
    ...override.metadata,
    modified: new Date()
  };
  
  return merged;
}

/**
 * Extracts device-specific configuration
 */
export function extractDeviceConfiguration(
  config: LogiopsConfiguration, 
  vid: string, 
  pid: string
): Device | null {
  return config.devices.find(device => device.vid === vid && device.pid === pid) || null;
}

/**
 * Updates a specific device in the configuration
 */
export function updateDeviceInConfiguration(
  config: LogiopsConfiguration,
  updatedDevice: Device
): LogiopsConfiguration {
  const updated = cloneConfiguration(config);
  const deviceIndex = updated.devices.findIndex(
    device => device.vid === updatedDevice.vid && device.pid === updatedDevice.pid
  );
  
  if (deviceIndex >= 0) {
    updated.devices[deviceIndex] = cloneDevice(updatedDevice);
  } else {
    updated.devices.push(cloneDevice(updatedDevice));
  }
  
  updated.metadata.modified = new Date();
  return updated;
}

/**
 * Removes a device from the configuration
 */
export function removeDeviceFromConfiguration(
  config: LogiopsConfiguration,
  vid: string,
  pid: string
): LogiopsConfiguration {
  const updated = cloneConfiguration(config);
  updated.devices = updated.devices.filter(
    device => !(device.vid === vid && device.pid === pid)
  );
  updated.metadata.modified = new Date();
  return updated;
}
/**
 * Unit tests for serialization utilities
 */

import { describe, it, expect } from 'vitest';
import {
  serializeConfiguration,
  deserializeConfiguration,
  cloneConfiguration,
  cloneDevice,
  toDisplayFormat,
  getConfigurationSummary,
  validateSerialization,
  mergeConfigurations,
  extractDeviceConfiguration,
  updateDeviceInConfiguration,
  removeDeviceFromConfiguration
} from '../../renderer/utils/serialization';
import { LogiopsConfiguration, Device } from '../../renderer/types/logiops';

describe('Serialization Utils', () => {
  const sampleConfig: LogiopsConfiguration = {
    devices: [
      {
        name: 'MX Master 3',
        vid: '0x046d',
        pid: '0x4082',
        dpi: {
          sensors: [
            { dpi: 1000, default: true },
            { dpi: 1600 }
          ]
        },
        buttons: [
          {
            cid: '0x52',
            action: {
              type: 'key',
              parameters: { keys: ['KEY_C'] }
            }
          }
        ],
        gestures: [
          {
            direction: 'up',
            mode: 'OnRelease',
            action: {
              type: 'key',
              parameters: { keys: ['KEY_UP'] }
            }
          }
        ],
        scrollWheel: {
          hires: true,
          invert: false
        }
      }
    ],
    metadata: {
      version: '1.0.0',
      created: new Date('2024-01-01T00:00:00Z'),
      modified: new Date('2024-01-02T00:00:00Z'),
      filename: 'test.cfg'
    }
  };

  describe('serializeConfiguration', () => {
    it('should serialize configuration to JSON string', () => {
      const json = serializeConfiguration(sampleConfig);
      
      expect(typeof json).toBe('string');
      expect(json).toContain('MX Master 3');
      expect(json).toContain('0x046d');
      expect(json).toContain('0x4082');
      
      // Should be valid JSON
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should create formatted JSON with proper indentation', () => {
      const json = serializeConfiguration(sampleConfig);
      
      // Should contain newlines and spaces for formatting
      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });
  });

  describe('deserializeConfiguration', () => {
    it('should deserialize JSON string to configuration', () => {
      const json = serializeConfiguration(sampleConfig);
      const deserialized = deserializeConfiguration(json);
      
      expect(deserialized.devices).toHaveLength(1);
      expect(deserialized.devices[0].name).toBe('MX Master 3');
      expect(deserialized.devices[0].vid).toBe('0x046d');
      expect(deserialized.metadata.version).toBe('1.0.0');
    });

    it('should convert date strings back to Date objects', () => {
      const json = serializeConfiguration(sampleConfig);
      const deserialized = deserializeConfiguration(json);
      
      expect(deserialized.metadata.created).toBeInstanceOf(Date);
      expect(deserialized.metadata.modified).toBeInstanceOf(Date);
      expect(deserialized.metadata.created.getTime()).toBe(sampleConfig.metadata.created.getTime());
    });

    it('should throw error for invalid JSON', () => {
      expect(() => deserializeConfiguration('invalid json')).toThrow();
    });
  });

  describe('cloneConfiguration', () => {
    it('should create a deep copy of configuration', () => {
      const cloned = cloneConfiguration(sampleConfig);
      
      expect(cloned).toEqual(sampleConfig);
      expect(cloned).not.toBe(sampleConfig);
      expect(cloned.devices).not.toBe(sampleConfig.devices);
      expect(cloned.devices[0]).not.toBe(sampleConfig.devices[0]);
    });

    it('should allow independent modification of cloned configuration', () => {
      const cloned = cloneConfiguration(sampleConfig);
      cloned.devices[0].name = 'Modified Name';
      
      expect(cloned.devices[0].name).toBe('Modified Name');
      expect(sampleConfig.devices[0].name).toBe('MX Master 3');
    });
  });

  describe('cloneDevice', () => {
    it('should create a deep copy of device', () => {
      const device = sampleConfig.devices[0];
      const cloned = cloneDevice(device);
      
      expect(cloned).toEqual(device);
      expect(cloned).not.toBe(device);
      expect(cloned.dpi).not.toBe(device.dpi);
    });
  });

  describe('toDisplayFormat', () => {
    it('should convert configuration to display format', () => {
      const display = toDisplayFormat(sampleConfig);
      
      expect(display.deviceCount).toBe(1);
      expect(display.devices).toHaveLength(1);
      expect(display.devices[0].name).toBe('MX Master 3');
      expect(display.devices[0].id).toBe('0x046d:0x4082');
      expect(display.devices[0].features.dpi).toBe(true);
      expect(display.devices[0].features.buttons).toBe(1);
      expect(display.devices[0].features.gestures).toBe(1);
      expect(display.devices[0].features.scrollWheel).toBe(true);
    });

    it('should handle devices without optional features', () => {
      const minimalConfig: LogiopsConfiguration = {
        devices: [
          {
            name: 'Simple Device',
            vid: '0x1234',
            pid: '0x5678'
          }
        ],
        metadata: {
          version: '1.0.0',
          created: new Date(),
          modified: new Date()
        }
      };

      const display = toDisplayFormat(minimalConfig);
      
      expect(display.devices[0].features.dpi).toBe(false);
      expect(display.devices[0].features.buttons).toBe(0);
      expect(display.devices[0].features.gestures).toBe(0);
      expect(display.devices[0].features.scrollWheel).toBe(false);
    });
  });

  describe('getConfigurationSummary', () => {
    it('should return correct summary statistics', () => {
      const summary = getConfigurationSummary(sampleConfig);
      
      expect(summary.deviceCount).toBe(1);
      expect(summary.totalButtons).toBe(1);
      expect(summary.totalGestures).toBe(1);
      expect(summary.devicesWithDPI).toBe(1);
      expect(summary.devicesWithScrollWheel).toBe(1);
    });

    it('should handle empty configuration', () => {
      const emptyConfig: LogiopsConfiguration = {
        devices: [],
        metadata: {
          version: '1.0.0',
          created: new Date(),
          modified: new Date()
        }
      };

      const summary = getConfigurationSummary(emptyConfig);
      
      expect(summary.deviceCount).toBe(0);
      expect(summary.totalButtons).toBe(0);
      expect(summary.totalGestures).toBe(0);
      expect(summary.devicesWithDPI).toBe(0);
      expect(summary.devicesWithScrollWheel).toBe(0);
    });
  });

  describe('validateSerialization', () => {
    it('should return true for valid configuration', () => {
      const isValid = validateSerialization(sampleConfig);
      expect(isValid).toBe(true);
    });

    it('should handle configuration with circular references', () => {
      const circularConfig = cloneConfiguration(sampleConfig);
      // Create a circular reference (this would normally be prevented by TypeScript)
      (circularConfig as unknown as { circular: LogiopsConfiguration }).circular = circularConfig;
      
      const isValid = validateSerialization(circularConfig);
      expect(isValid).toBe(false);
    });
  });

  describe('mergeConfigurations', () => {
    it('should merge two configurations', () => {
      const baseConfig = cloneConfiguration(sampleConfig);
      const overrideConfig: LogiopsConfiguration = {
        devices: [
          {
            name: 'G502 HERO',
            vid: '0x046d',
            pid: '0xc08b'
          }
        ],
        metadata: {
          version: '2.0.0',
          created: new Date('2024-02-01'),
          modified: new Date('2024-02-02')
        }
      };

      const merged = mergeConfigurations(baseConfig, overrideConfig);
      
      expect(merged.devices).toHaveLength(2);
      expect(merged.metadata.version).toBe('2.0.0');
      expect(merged.metadata.modified).toBeInstanceOf(Date);
    });

    it('should override devices with same vid:pid', () => {
      const baseConfig = cloneConfiguration(sampleConfig);
      const overrideConfig: LogiopsConfiguration = {
        devices: [
          {
            name: 'Updated MX Master 3',
            vid: '0x046d',
            pid: '0x4082'
          }
        ],
        metadata: {
          version: '1.0.0',
          created: new Date(),
          modified: new Date()
        }
      };

      const merged = mergeConfigurations(baseConfig, overrideConfig);
      
      expect(merged.devices).toHaveLength(1);
      expect(merged.devices[0].name).toBe('Updated MX Master 3');
    });
  });

  describe('extractDeviceConfiguration', () => {
    it('should extract existing device configuration', () => {
      const device = extractDeviceConfiguration(sampleConfig, '0x046d', '0x4082');
      
      expect(device).not.toBeNull();
      expect(device?.name).toBe('MX Master 3');
      expect(device?.vid).toBe('0x046d');
      expect(device?.pid).toBe('0x4082');
    });

    it('should return null for non-existing device', () => {
      const device = extractDeviceConfiguration(sampleConfig, '0x1234', '0x5678');
      
      expect(device).toBeNull();
    });
  });

  describe('updateDeviceInConfiguration', () => {
    it('should update existing device', () => {
      const updatedDevice: Device = {
        name: 'Updated MX Master 3',
        vid: '0x046d',
        pid: '0x4082'
      };

      const updated = updateDeviceInConfiguration(sampleConfig, updatedDevice);
      
      expect(updated.devices).toHaveLength(1);
      expect(updated.devices[0].name).toBe('Updated MX Master 3');
      expect(updated.metadata.modified).toBeInstanceOf(Date);
      
      // Original should be unchanged
      expect(sampleConfig.devices[0].name).toBe('MX Master 3');
    });

    it('should add new device if not exists', () => {
      const newDevice: Device = {
        name: 'G502 HERO',
        vid: '0x046d',
        pid: '0xc08b'
      };

      const updated = updateDeviceInConfiguration(sampleConfig, newDevice);
      
      expect(updated.devices).toHaveLength(2);
      expect(updated.devices[1].name).toBe('G502 HERO');
    });
  });

  describe('removeDeviceFromConfiguration', () => {
    it('should remove existing device', () => {
      const updated = removeDeviceFromConfiguration(sampleConfig, '0x046d', '0x4082');
      
      expect(updated.devices).toHaveLength(0);
      expect(updated.metadata.modified).toBeInstanceOf(Date);
      
      // Original should be unchanged
      expect(sampleConfig.devices).toHaveLength(1);
    });

    it('should handle removal of non-existing device', () => {
      const updated = removeDeviceFromConfiguration(sampleConfig, '0x1234', '0x5678');
      
      expect(updated.devices).toHaveLength(1);
      expect(updated.devices[0].name).toBe('MX Master 3');
    });
  });
});
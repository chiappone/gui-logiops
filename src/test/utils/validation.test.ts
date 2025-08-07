/**
 * Unit tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateConfiguration,
  validateDevice,
  validateDPISettings,
  validateDPISensor,
  validateButtonMapping,
  validateButtonAction,
  validateGestureMapping,
  validateScrollWheelSettings,
  createDefaultConfiguration,
  createDefaultDevice
} from '../../renderer/utils/validation';
import {
  LogiopsConfiguration,
  Device,
  DPISettings,
  DPISensor,
  ButtonMapping,
  ButtonAction,
  GestureMapping,
  ScrollWheelSettings
} from '../../renderer/types/logiops';

describe('Validation Utils', () => {
  describe('validateConfiguration', () => {
    it('should validate a valid configuration', () => {
      const config: LogiopsConfiguration = {
        devices: [
          {
            name: 'Test Device',
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

      const result = validateConfiguration(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing metadata', () => {
      const config = {
        devices: []
      } as LogiopsConfiguration;

      const result = validateConfiguration(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.path === 'metadata')).toBe(true);
    });

    it('should fail validation for missing devices array', () => {
      const config = {
        metadata: {
          version: '1.0.0',
          created: new Date(),
          modified: new Date()
        }
      } as LogiopsConfiguration;

      const result = validateConfiguration(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.path === 'devices')).toBe(true);
    });

    it('should warn for empty devices array', () => {
      const config: LogiopsConfiguration = {
        devices: [],
        metadata: {
          version: '1.0.0',
          created: new Date(),
          modified: new Date()
        }
      };

      const result = validateConfiguration(config);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.path === 'devices')).toBe(true);
    });

    it('should detect duplicate devices', () => {
      const config: LogiopsConfiguration = {
        devices: [
          { name: 'Device 1', vid: '0x046d', pid: '0x4082' },
          { name: 'Device 2', vid: '0x046d', pid: '0x4082' }
        ],
        metadata: {
          version: '1.0.0',
          created: new Date(),
          modified: new Date()
        }
      };

      const result = validateConfiguration(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Duplicate devices'))).toBe(true);
    });
  });

  describe('validateDevice', () => {
    it('should validate a valid device', () => {
      const device: Device = {
        name: 'Test Device',
        vid: '0x046d',
        pid: '0x4082'
      };

      const result = validateDevice(device);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing name', () => {
      const device: Device = {
        name: '',
        vid: '0x046d',
        pid: '0x4082'
      };

      const result = validateDevice(device);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should fail validation for invalid vid format', () => {
      const device: Device = {
        name: 'Test Device',
        vid: '046d',
        pid: '0x4082'
      };

      const result = validateDevice(device);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'vid')).toBe(true);
    });

    it('should fail validation for invalid pid format', () => {
      const device: Device = {
        name: 'Test Device',
        vid: '0x046d',
        pid: '4082'
      };

      const result = validateDevice(device);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'pid')).toBe(true);
    });

    it('should warn for unknown device', () => {
      const device: Device = {
        name: 'Unknown Device',
        vid: '0x1234',
        pid: '0x5678'
      };

      const result = validateDevice(device);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.message.includes('not in the known devices list'))).toBe(true);
    });
  });

  describe('validateDPISettings', () => {
    it('should validate valid DPI settings', () => {
      const dpi: DPISettings = {
        sensors: [
          { dpi: 1000, default: true },
          { dpi: 1600 }
        ]
      };

      const result = validateDPISettings(dpi, 'dpi');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing sensors', () => {
      const dpi = {} as DPISettings;

      const result = validateDPISettings(dpi, 'dpi');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('sensors array is required'))).toBe(true);
    });

    it('should fail validation for empty sensors array', () => {
      const dpi: DPISettings = {
        sensors: []
      };

      const result = validateDPISettings(dpi, 'dpi');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('At least one DPI sensor'))).toBe(true);
    });

    it('should warn for no default sensor', () => {
      const dpi: DPISettings = {
        sensors: [
          { dpi: 1000 },
          { dpi: 1600 }
        ]
      };

      const result = validateDPISettings(dpi, 'dpi');
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.message.includes('No default DPI sensor'))).toBe(true);
    });

    it('should fail validation for multiple default sensors', () => {
      const dpi: DPISettings = {
        sensors: [
          { dpi: 1000, default: true },
          { dpi: 1600, default: true }
        ]
      };

      const result = validateDPISettings(dpi, 'dpi');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Only one DPI sensor can be marked as default'))).toBe(true);
    });
  });

  describe('validateDPISensor', () => {
    it('should validate valid DPI sensor', () => {
      const sensor: DPISensor = { dpi: 1000 };

      const result = validateDPISensor(sensor, 'sensor');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for non-numeric DPI', () => {
      const sensor = { dpi: 'invalid' } as unknown as DPISensor;

      const result = validateDPISensor(sensor, 'sensor');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('DPI value must be a number'))).toBe(true);
    });

    it('should fail validation for DPI out of range', () => {
      const sensor: DPISensor = { dpi: 30000 };

      const result = validateDPISensor(sensor, 'sensor');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('DPI must be between'))).toBe(true);
    });

    it('should warn for DPI not multiple of 50', () => {
      const sensor: DPISensor = { dpi: 1023 };

      const result = validateDPISensor(sensor, 'sensor');
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.message.includes('multiples of 50'))).toBe(true);
    });
  });

  describe('validateButtonMapping', () => {
    it('should validate valid button mapping', () => {
      const button: ButtonMapping = {
        cid: '0x52',
        action: {
          type: 'key',
          parameters: { keys: ['KEY_C'] }
        }
      };

      const result = validateButtonMapping(button, 'button');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing cid', () => {
      const button = {
        action: { type: 'key' }
      } as ButtonMapping;

      const result = validateButtonMapping(button, 'button');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'cid')).toBe(true);
    });

    it('should fail validation for invalid cid format', () => {
      const button: ButtonMapping = {
        cid: '0x123',
        action: { type: 'key' }
      };

      const result = validateButtonMapping(button, 'button');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'cid')).toBe(true);
    });

    it('should fail validation for missing action', () => {
      const button = {
        cid: '0x52'
      } as ButtonMapping;

      const result = validateButtonMapping(button, 'button');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Button action is required'))).toBe(true);
    });
  });

  describe('validateButtonAction', () => {
    it('should validate valid key action', () => {
      const action: ButtonAction = {
        type: 'key',
        parameters: { keys: ['KEY_C'] }
      };

      const result = validateButtonAction(action, 'action');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing type', () => {
      const action = {} as ButtonAction;

      const result = validateButtonAction(action, 'action');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('should fail validation for invalid type', () => {
      const action = {
        type: 'invalid'
      } as unknown as ButtonAction;

      const result = validateButtonAction(action, 'action');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('should fail validation for key action without keys', () => {
      const action: ButtonAction = {
        type: 'key',
        parameters: { keys: [] }
      };

      const result = validateButtonAction(action, 'action');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Key action requires at least one key'))).toBe(true);
    });

    it('should fail validation for changeDPI action with invalid sensor', () => {
      const action: ButtonAction = {
        type: 'changeDPI',
        parameters: { sensor: -1 }
      };

      const result = validateButtonAction(action, 'action');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Sensor index must be a non-negative number'))).toBe(true);
    });
  });

  describe('validateGestureMapping', () => {
    it('should validate valid gesture mapping', () => {
      const gesture: GestureMapping = {
        direction: 'up',
        mode: 'OnRelease',
        action: {
          type: 'key',
          parameters: { keys: ['KEY_UP'] }
        }
      };

      const result = validateGestureMapping(gesture, 'gesture');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for invalid direction', () => {
      const gesture = {
        direction: 'invalid',
        mode: 'OnRelease',
        action: { type: 'key' }
      } as unknown as GestureMapping;

      const result = validateGestureMapping(gesture, 'gesture');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'direction')).toBe(true);
    });

    it('should fail validation for invalid mode', () => {
      const gesture = {
        direction: 'up',
        mode: 'invalid',
        action: { type: 'key' }
      } as unknown as GestureMapping;

      const result = validateGestureMapping(gesture, 'gesture');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'mode')).toBe(true);
    });

    it('should fail validation for invalid threshold in OnFewPixels mode', () => {
      const gesture: GestureMapping = {
        direction: 'up',
        mode: 'OnFewPixels',
        threshold: 200,
        action: { type: 'key' }
      };

      const result = validateGestureMapping(gesture, 'gesture');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'threshold')).toBe(true);
    });

    it('should fail validation for invalid interval in OnInterval mode', () => {
      const gesture: GestureMapping = {
        direction: 'up',
        mode: 'OnInterval',
        interval: 2000,
        action: { type: 'key' }
      };

      const result = validateGestureMapping(gesture, 'gesture');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'interval')).toBe(true);
    });
  });

  describe('validateScrollWheelSettings', () => {
    it('should validate valid scroll wheel settings', () => {
      const scrollWheel: ScrollWheelSettings = {
        hires: true,
        invert: false,
        target: true
      };

      const result = validateScrollWheelSettings(scrollWheel, 'scrollWheel');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for non-boolean hires', () => {
      const scrollWheel = {
        hires: 'true'
      } as unknown as ScrollWheelSettings;

      const result = validateScrollWheelSettings(scrollWheel, 'scrollWheel');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'hires')).toBe(true);
    });

    it('should validate directional actions', () => {
      const scrollWheel: ScrollWheelSettings = {
        up: {
          type: 'key',
          parameters: { keys: ['KEY_UP'] }
        },
        down: {
          type: 'invalid'
        } as unknown as ButtonAction
      };

      const result = validateScrollWheelSettings(scrollWheel, 'scrollWheel');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.path.includes('down'))).toBe(true);
    });
  });

  describe('createDefaultConfiguration', () => {
    it('should create a valid default configuration', () => {
      const config = createDefaultConfiguration();
      
      expect(config.devices).toEqual([]);
      expect(config.metadata.version).toBe('1.0.0');
      expect(config.metadata.created).toBeInstanceOf(Date);
      expect(config.metadata.modified).toBeInstanceOf(Date);

      const result = validateConfiguration(config);
      expect(result.isValid).toBe(true);
    });
  });

  describe('createDefaultDevice', () => {
    it('should create a valid default device', () => {
      const device = createDefaultDevice();
      
      expect(device.name).toBe('New Device');
      expect(device.vid).toBe('0x046d');
      expect(device.pid).toBe('0x0000');

      // Note: This will have warnings for unknown device, but should be structurally valid
      const result = validateDevice(device);
      expect(result.errors).toHaveLength(0);
    });
  });
});
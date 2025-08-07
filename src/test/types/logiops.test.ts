/**
 * Unit tests for logiops data types and interfaces
 */

import { describe, it, expect } from 'vitest';
import {
  LogiopsConfiguration,
  Device,
  DPISettings,
  ButtonMapping,
  GestureMapping,
  ScrollWheelSettings,
  VALIDATION_CONSTANTS,
  COMMON_LOGITECH_DEVICES
} from '../../renderer/types/logiops';

describe('Logiops Data Types', () => {
  describe('VALIDATION_CONSTANTS', () => {
    it('should have correct DPI validation constants', () => {
      expect(VALIDATION_CONSTANTS.DPI.MIN).toBe(50);
      expect(VALIDATION_CONSTANTS.DPI.MAX).toBe(25600);
      expect(VALIDATION_CONSTANTS.DPI.DEFAULT).toBe(1000);
    });

    it('should have correct regex patterns', () => {
      expect(VALIDATION_CONSTANTS.HEX_PATTERN.test('0x046d')).toBe(true);
      expect(VALIDATION_CONSTANTS.HEX_PATTERN.test('0x4082')).toBe(true);
      expect(VALIDATION_CONSTANTS.HEX_PATTERN.test('046d')).toBe(false);
      expect(VALIDATION_CONSTANTS.HEX_PATTERN.test('0xGGGG')).toBe(false);
    });

    it('should validate button CID pattern', () => {
      expect(VALIDATION_CONSTANTS.BUTTON_CID_PATTERN.test('0x52')).toBe(true);
      expect(VALIDATION_CONSTANTS.BUTTON_CID_PATTERN.test('0xFF')).toBe(true);
      expect(VALIDATION_CONSTANTS.BUTTON_CID_PATTERN.test('0x5')).toBe(false);
      expect(VALIDATION_CONSTANTS.BUTTON_CID_PATTERN.test('0x123')).toBe(false);
    });

    it('should validate device ID pattern', () => {
      expect(VALIDATION_CONSTANTS.DEVICE_ID_PATTERN.test('0x046d')).toBe(true);
      expect(VALIDATION_CONSTANTS.DEVICE_ID_PATTERN.test('0x4082')).toBe(true);
      expect(VALIDATION_CONSTANTS.DEVICE_ID_PATTERN.test('0x46d')).toBe(false);
      expect(VALIDATION_CONSTANTS.DEVICE_ID_PATTERN.test('0x12345')).toBe(false);
    });
  });

  describe('COMMON_LOGITECH_DEVICES', () => {
    it('should contain known Logitech devices', () => {
      expect(COMMON_LOGITECH_DEVICES.length).toBeGreaterThan(0);
      
      const mxMaster3 = COMMON_LOGITECH_DEVICES.find(d => d.name === 'MX Master 3');
      expect(mxMaster3).toBeDefined();
      expect(mxMaster3?.vid).toBe('0x046d');
      expect(mxMaster3?.pid).toBe('0x4082');
      expect(mxMaster3?.supportedFeatures).toContain('dpi');
      expect(mxMaster3?.supportedFeatures).toContain('buttons');
    });

    it('should have valid device IDs for all devices', () => {
      COMMON_LOGITECH_DEVICES.forEach(device => {
        expect(VALIDATION_CONSTANTS.DEVICE_ID_PATTERN.test(device.vid)).toBe(true);
        expect(VALIDATION_CONSTANTS.DEVICE_ID_PATTERN.test(device.pid)).toBe(true);
      });
    });
  });

  describe('Type Structure Validation', () => {
    it('should create valid LogiopsConfiguration', () => {
      const config: LogiopsConfiguration = {
        devices: [],
        metadata: {
          version: '1.0.0',
          created: new Date(),
          modified: new Date()
        }
      };

      expect(config.devices).toEqual([]);
      expect(config.metadata.version).toBe('1.0.0');
      expect(config.metadata.created).toBeInstanceOf(Date);
    });

    it('should create valid Device', () => {
      const device: Device = {
        name: 'Test Device',
        vid: '0x046d',
        pid: '0x4082'
      };

      expect(device.name).toBe('Test Device');
      expect(device.vid).toBe('0x046d');
      expect(device.pid).toBe('0x4082');
    });

    it('should create valid DPISettings', () => {
      const dpiSettings: DPISettings = {
        sensors: [
          { dpi: 1000, default: true },
          { dpi: 1600 }
        ]
      };

      expect(dpiSettings.sensors).toHaveLength(2);
      expect(dpiSettings.sensors[0].default).toBe(true);
      expect(dpiSettings.sensors[1].default).toBeUndefined();
    });

    it('should create valid ButtonMapping', () => {
      const buttonMapping: ButtonMapping = {
        cid: '0x52',
        action: {
          type: 'key',
          parameters: {
            keys: ['KEY_LEFTCTRL', 'KEY_C']
          }
        }
      };

      expect(buttonMapping.cid).toBe('0x52');
      expect(buttonMapping.action.type).toBe('key');
      expect(buttonMapping.action.parameters?.keys).toEqual(['KEY_LEFTCTRL', 'KEY_C']);
    });

    it('should create valid GestureMapping', () => {
      const gestureMapping: GestureMapping = {
        direction: 'up',
        mode: 'OnRelease',
        action: {
          type: 'key',
          parameters: {
            keys: ['KEY_UP']
          }
        }
      };

      expect(gestureMapping.direction).toBe('up');
      expect(gestureMapping.mode).toBe('OnRelease');
      expect(gestureMapping.action.type).toBe('key');
    });

    it('should create valid ScrollWheelSettings', () => {
      const scrollWheel: ScrollWheelSettings = {
        hires: true,
        invert: false,
        target: true,
        up: {
          type: 'key',
          parameters: { keys: ['KEY_UP'] }
        }
      };

      expect(scrollWheel.hires).toBe(true);
      expect(scrollWheel.invert).toBe(false);
      expect(scrollWheel.up?.type).toBe('key');
    });
  });

  describe('Complex Configuration Structure', () => {
    it('should create a complete configuration with all features', () => {
      const config: LogiopsConfiguration = {
        devices: [
          {
            name: 'MX Master 3',
            vid: '0x046d',
            pid: '0x4082',
            dpi: {
              sensors: [
                { dpi: 1000, default: true },
                { dpi: 1600 },
                { dpi: 3200 }
              ]
            },
            buttons: [
              {
                cid: '0x52',
                action: {
                  type: 'key',
                  parameters: { keys: ['KEY_LEFTCTRL', 'KEY_C'] }
                }
              },
              {
                cid: '0x53',
                action: {
                  type: 'changeDPI',
                  parameters: { sensor: 1 }
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
              },
              {
                direction: 'left',
                mode: 'OnFewPixels',
                threshold: 10,
                action: {
                  type: 'key',
                  parameters: { keys: ['KEY_LEFT'] }
                }
              }
            ],
            scrollWheel: {
              hires: true,
              invert: false,
              target: true,
              up: {
                type: 'key',
                parameters: { keys: ['KEY_VOLUMEUP'] }
              },
              down: {
                type: 'key',
                parameters: { keys: ['KEY_VOLUMEDOWN'] }
              }
            }
          }
        ],
        metadata: {
          version: '1.0.0',
          created: new Date('2024-01-01'),
          modified: new Date('2024-01-02'),
          filename: 'test-config.cfg'
        }
      };

      expect(config.devices).toHaveLength(1);
      expect(config.devices[0].name).toBe('MX Master 3');
      expect(config.devices[0].dpi?.sensors).toHaveLength(3);
      expect(config.devices[0].buttons).toHaveLength(2);
      expect(config.devices[0].gestures).toHaveLength(2);
      expect(config.devices[0].scrollWheel?.hires).toBe(true);
      expect(config.metadata.filename).toBe('test-config.cfg');
    });
  });
});
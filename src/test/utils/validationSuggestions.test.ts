import { describe, it, expect } from 'vitest';
import { 
  generateSuggestions, 
  getQuickFixSuggestions, 
  getFieldHelp 
} from '../../renderer/utils/validationSuggestions';
import { ValidationError, Device } from '../../renderer/types/logiops';

describe('ValidationSuggestions', () => {
  describe('generateSuggestions', () => {
    it('should generate suggestions for device name errors', () => {
      const errors: ValidationError[] = [
        {
          path: 'device.name',
          message: 'Device name is required',
          severity: 'error',
          field: 'name'
        }
      ];

      const suggestions = generateSuggestions(errors, []);
      expect(suggestions['device.name']).toBeDefined();
      expect(suggestions['device.name'][0].message).toContain('descriptive name');
    });

    it('should generate suggestions for VID format errors', () => {
      const errors: ValidationError[] = [
        {
          path: 'device.vid',
          message: 'Vendor ID must be in hexadecimal format',
          severity: 'error',
          field: 'vid'
        }
      ];

      const suggestions = generateSuggestions(errors, []);
      expect(suggestions['device.vid']).toBeDefined();
      expect(suggestions['device.vid'][0].message).toContain('hexadecimal format');
    });

    it('should generate suggestions for DPI range errors', () => {
      const errors: ValidationError[] = [
        {
          path: 'device.dpi.sensors[0].dpi',
          message: 'DPI must be between 50 and 25600',
          severity: 'error',
          field: 'dpi'
        }
      ];

      const suggestions = generateSuggestions(errors, []);
      expect(suggestions['device.dpi.sensors[0].dpi']).toBeDefined();
      expect(suggestions['device.dpi.sensors[0].dpi'].some(s => 
        s.message.includes('Common DPI values')
      )).toBe(true);
    });

    it('should generate suggestions for button CID errors', () => {
      const errors: ValidationError[] = [
        {
          path: 'device.buttons[0].cid',
          message: 'Button control ID must be in hexadecimal format',
          severity: 'error',
          field: 'cid'
        }
      ];

      const suggestions = generateSuggestions(errors, []);
      expect(suggestions['device.buttons[0].cid']).toBeDefined();
      expect(suggestions['device.buttons[0].cid'].some(s => 
        s.message.includes('Common button CIDs')
      )).toBe(true);
    });

    it('should generate suggestions for key action errors', () => {
      const errors: ValidationError[] = [
        {
          path: 'device.buttons[0].action.parameters.keys',
          message: 'Key action requires at least one key',
          severity: 'error'
        }
      ];

      const suggestions = generateSuggestions(errors, []);
      expect(suggestions['device.buttons[0].action.parameters.keys']).toBeDefined();
      expect(suggestions['device.buttons[0].action.parameters.keys'].some(s => 
        s.message.includes('Linux key codes')
      )).toBe(true);
    });

    it('should generate suggestions for unknown device warnings', () => {
      const warnings: ValidationError[] = [
        {
          path: 'device',
          message: 'Device 0x1234:0x5678 is not in the known devices list',
          severity: 'warning'
        }
      ];

      const device: Device = {
        name: 'Unknown Device',
        vid: '0x1234',
        pid: '0x5678'
      };

      const suggestions = generateSuggestions([], warnings, device);
      expect(suggestions['device']).toBeDefined();
      expect(suggestions['device'][0].message).toContain('not in our database');
    });

    it('should generate suggestions for DPI not multiple of 50 warnings', () => {
      const warnings: ValidationError[] = [
        {
          path: 'device.dpi.sensors[0].dpi',
          message: 'DPI values are typically multiples of 50',
          severity: 'warning',
          field: 'dpi'
        }
      ];

      const suggestions = generateSuggestions([], warnings);
      expect(suggestions['device.dpi.sensors[0].dpi']).toBeDefined();
      expect(suggestions['device.dpi.sensors[0].dpi'][0].message).toContain('multiples of 50');
    });
  });

  describe('getQuickFixSuggestions', () => {
    it('should suggest adding button mappings when none exist', () => {
      const device: Device = {
        name: 'Test Device',
        vid: '0x046d',
        pid: '0x4082'
      };

      const suggestions = getQuickFixSuggestions(device);
      expect(suggestions.some(s => s.message.includes('button mappings'))).toBe(true);
    });

    it('should suggest configuring DPI when not set', () => {
      const device: Device = {
        name: 'Test Device',
        vid: '0x046d',
        pid: '0x4082'
      };

      const suggestions = getQuickFixSuggestions(device);
      expect(suggestions.some(s => s.message.includes('DPI settings'))).toBe(true);
    });

    it('should suggest scroll wheel features for supported devices', () => {
      const device: Device = {
        name: 'MX Master 3',
        vid: '0x046d',
        pid: '0x4082'
      };

      const suggestions = getQuickFixSuggestions(device);
      expect(suggestions.some(s => s.message.includes('scroll wheel features'))).toBe(true);
    });

    it('should suggest gestures for supported devices', () => {
      const device: Device = {
        name: 'MX Master 3',
        vid: '0x046d',
        pid: '0x4082'
      };

      const suggestions = getQuickFixSuggestions(device);
      expect(suggestions.some(s => s.message.includes('gesture controls'))).toBe(true);
    });
  });

  describe('getFieldHelp', () => {
    it('should return help text for device name field', () => {
      const help = getFieldHelp('name');
      expect(help).toContain('descriptive name');
    });

    it('should return help text for VID field', () => {
      const help = getFieldHelp('vid');
      expect(help).toContain('Vendor ID');
      expect(help).toContain('0x046d');
    });

    it('should return help text for PID field', () => {
      const help = getFieldHelp('pid');
      expect(help).toContain('Product ID');
    });

    it('should return help text for DPI field', () => {
      const help = getFieldHelp('dpi');
      expect(help).toContain('Dots Per Inch');
    });

    it('should return help text for action type field', () => {
      const help = getFieldHelp('action.type');
      expect(help).toContain('type of action');
    });

    it('should return help text for gesture direction', () => {
      const help = getFieldHelp('direction');
      expect(help).toContain('direction of the gesture');
    });

    it('should return help text for gesture mode', () => {
      const help = getFieldHelp('mode');
      expect(help).toContain('When the gesture action should be triggered');
    });

    it('should return null for unknown fields', () => {
      const help = getFieldHelp('unknown.field');
      expect(help).toBeNull();
    });

    it('should handle nested field paths', () => {
      const help = getFieldHelp('device.buttons[0].action.type');
      expect(help).toContain('type of action');
    });
  });
});
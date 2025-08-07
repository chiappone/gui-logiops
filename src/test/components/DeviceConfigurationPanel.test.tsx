import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DeviceConfigurationPanel from '../../renderer/components/DeviceConfigurationPanel';
import { Device } from '../../renderer/types/logiops';

describe('DeviceConfigurationPanel', () => {
  const mockOnDeviceChange = vi.fn();
  const mockOnValidationChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders device selection when no device is provided', () => {
    render(
      <DeviceConfigurationPanel
        device={null}
        onDeviceChange={mockOnDeviceChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    expect(screen.getByText('Select a Device')).toBeInTheDocument();
    expect(screen.getByText('Common Logitech Devices')).toBeInTheDocument();
    expect(screen.getByText('MX Master 3')).toBeInTheDocument();
    expect(screen.getByText('MX Master 2S')).toBeInTheDocument();
    expect(screen.getByText('G502 HERO')).toBeInTheDocument();
    expect(screen.getByText('Create Custom Configuration')).toBeInTheDocument();
  });

  it('calls onDeviceChange when a common device is selected', () => {
    render(
      <DeviceConfigurationPanel
        device={null}
        onDeviceChange={mockOnDeviceChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    const mxMaster3Button = screen.getByText('MX Master 3').closest('button');
    fireEvent.click(mxMaster3Button!);

    expect(mockOnDeviceChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'MX Master 3',
        vid: '0x046d',
        pid: '0x4082'
      })
    );
  });

  it('calls onDeviceChange when custom device is selected', () => {
    render(
      <DeviceConfigurationPanel
        device={null}
        onDeviceChange={mockOnDeviceChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    const customButton = screen.getByText('Create Custom Configuration');
    fireEvent.click(customButton);

    expect(mockOnDeviceChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Custom Device',
        vid: '0x046d',
        pid: '0x0000'
      })
    );
  });

  it('renders device configuration sections when device is provided', () => {
    const mockDevice: Device = {
      name: 'Test Device',
      vid: '0x046d',
      pid: '0x4082',
      dpi: {
        sensors: [{ dpi: 1000, default: true }]
      },
      buttons: [],
      gestures: [],
      scrollWheel: {
        hires: false,
        invert: false,
        target: false
      }
    };

    render(
      <DeviceConfigurationPanel
        device={mockDevice}
        onDeviceChange={mockOnDeviceChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    expect(screen.getByText('Device Information')).toBeInTheDocument();
    expect(screen.getByText('DPI Configuration')).toBeInTheDocument();
    expect(screen.getByText('Button Mapping')).toBeInTheDocument();
    expect(screen.getByText('Gesture Configuration')).toBeInTheDocument();
    expect(screen.getByText('Scroll Wheel Settings')).toBeInTheDocument();
  });

  it('displays device information correctly', () => {
    const mockDevice: Device = {
      name: 'Test Device',
      vid: '0x046d',
      pid: '0x4082',
      dpi: {
        sensors: [{ dpi: 1000, default: true }]
      },
      buttons: [],
      gestures: [],
      scrollWheel: {
        hires: false,
        invert: false,
        target: false
      }
    };

    render(
      <DeviceConfigurationPanel
        device={mockDevice}
        onDeviceChange={mockOnDeviceChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    expect(screen.getByDisplayValue('Test Device')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0x046d')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0x4082')).toBeInTheDocument();
  });

  it('displays DPI configuration correctly', () => {
    const mockDevice: Device = {
      name: 'Test Device',
      vid: '0x046d',
      pid: '0x4082',
      dpi: {
        sensors: [
          { dpi: 1000, default: true },
          { dpi: 2000, default: false }
        ]
      },
      buttons: [],
      gestures: [],
      scrollWheel: {
        hires: false,
        invert: false,
        target: false
      }
    };

    render(
      <DeviceConfigurationPanel
        device={mockDevice}
        onDeviceChange={mockOnDeviceChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2000')).toBeInTheDocument();
    expect(screen.getByText('Add DPI Sensor')).toBeInTheDocument();
  });

  it('displays scroll wheel settings correctly', () => {
    const mockDevice: Device = {
      name: 'Test Device',
      vid: '0x046d',
      pid: '0x4082',
      dpi: {
        sensors: [{ dpi: 1000, default: true }]
      },
      buttons: [],
      gestures: [],
      scrollWheel: {
        hires: true,
        invert: false,
        target: true
      }
    };

    render(
      <DeviceConfigurationPanel
        device={mockDevice}
        onDeviceChange={mockOnDeviceChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    const hiresCheckbox = screen.getByLabelText('High Resolution Scrolling') as HTMLInputElement;
    const targetCheckbox = screen.getByLabelText('Target Scrolling') as HTMLInputElement;
    const invertCheckbox = screen.getByLabelText('Invert Scroll Direction') as HTMLInputElement;

    expect(hiresCheckbox.checked).toBe(true);
    expect(targetCheckbox.checked).toBe(true);
    expect(invertCheckbox.checked).toBe(false);
  });
});
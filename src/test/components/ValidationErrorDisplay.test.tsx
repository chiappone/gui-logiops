import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ValidationErrorDisplay from '../../renderer/components/ValidationErrorDisplay';
import { ValidationError } from '../../renderer/types/logiops';

describe('ValidationErrorDisplay', () => {
  const mockErrors: ValidationError[] = [
    {
      path: 'device.name',
      message: 'Device name is required',
      severity: 'error',
      field: 'name'
    },
    {
      path: 'device.vid',
      message: 'Vendor ID must be in hexadecimal format',
      severity: 'error',
      field: 'vid'
    }
  ];

  const mockWarnings: ValidationError[] = [
    {
      path: 'device',
      message: 'Device is not in the known devices list',
      severity: 'warning'
    }
  ];

  it('should render nothing when no errors or warnings', () => {
    const { container } = render(
      <ValidationErrorDisplay errors={[]} warnings={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render errors section when errors exist', () => {
    render(<ValidationErrorDisplay errors={mockErrors} warnings={[]} />);
    
    expect(screen.getByText('Configuration Errors (2)')).toBeInTheDocument();
    expect(screen.getByText('Device name is required')).toBeInTheDocument();
    expect(screen.getByText('Vendor ID must be in hexadecimal format')).toBeInTheDocument();
  });

  it('should render warnings section when warnings exist', () => {
    render(<ValidationErrorDisplay errors={[]} warnings={mockWarnings} />);
    
    expect(screen.getByText('Configuration Warnings (1)')).toBeInTheDocument();
    expect(screen.getByText('Device is not in the known devices list')).toBeInTheDocument();
  });

  it('should render both errors and warnings', () => {
    render(<ValidationErrorDisplay errors={mockErrors} warnings={mockWarnings} />);
    
    expect(screen.getByText('Configuration Errors (2)')).toBeInTheDocument();
    expect(screen.getByText('Configuration Warnings (1)')).toBeInTheDocument();
  });

  it('should display error paths and messages correctly', () => {
    render(<ValidationErrorDisplay errors={mockErrors} warnings={[]} />);
    
    expect(screen.getByText('device.name:')).toBeInTheDocument();
    expect(screen.getByText('device.vid:')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ValidationErrorDisplay 
        errors={mockErrors} 
        warnings={[]} 
        className="custom-class" 
      />
    );
    
    expect(container.firstChild).toHaveClass('validation-display', 'custom-class');
  });
});
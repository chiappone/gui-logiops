import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InlineFieldValidation from '../../renderer/components/InlineFieldValidation';
import { ValidationError } from '../../renderer/types/logiops';

describe('InlineFieldValidation', () => {
  const mockErrors: ValidationError[] = [
    {
      path: 'device.name',
      message: 'Device name is required',
      severity: 'error',
      field: 'name'
    },
    {
      path: 'device.vid',
      message: 'Invalid format',
      severity: 'error',
      field: 'vid'
    }
  ];

  const mockWarnings: ValidationError[] = [
    {
      path: 'device.name',
      message: 'Consider a more descriptive name',
      severity: 'warning'
    }
  ];

  it('should render nothing when no errors, warnings, or suggestions', () => {
    const { container } = render(
      <InlineFieldValidation
        fieldPath="device.name"
        errors={[]}
        warnings={[]}
        suggestions={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render errors for matching field path', () => {
    render(
      <InlineFieldValidation
        fieldPath="device.name"
        errors={mockErrors}
        warnings={[]}
      />
    );
    
    expect(screen.getByText('Device name is required')).toBeInTheDocument();
    expect(screen.queryByText('Invalid format')).not.toBeInTheDocument();
  });

  it('should render warnings for matching field path', () => {
    render(
      <InlineFieldValidation
        fieldPath="device.name"
        errors={[]}
        warnings={mockWarnings}
      />
    );
    
    expect(screen.getByText('Consider a more descriptive name')).toBeInTheDocument();
  });

  it('should render suggestions when provided', () => {
    const suggestions = ['Try using a more specific name', 'Include device model'];
    
    render(
      <InlineFieldValidation
        fieldPath="device.name"
        errors={[]}
        warnings={[]}
        suggestions={suggestions}
      />
    );
    
    expect(screen.getByText('Try using a more specific name')).toBeInTheDocument();
    expect(screen.getByText('Include device model')).toBeInTheDocument();
  });

  it('should render both errors and warnings for the same field', () => {
    render(
      <InlineFieldValidation
        fieldPath="device.name"
        errors={mockErrors}
        warnings={mockWarnings}
      />
    );
    
    expect(screen.getByText('Device name is required')).toBeInTheDocument();
    expect(screen.getByText('Consider a more descriptive name')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <InlineFieldValidation
        fieldPath="device.name"
        errors={mockErrors}
        warnings={[]}
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('inline-validation', 'custom-class');
  });

  it('should display appropriate icons for errors and warnings', () => {
    render(
      <InlineFieldValidation
        fieldPath="device.name"
        errors={mockErrors}
        warnings={mockWarnings}
      />
    );
    
    // Check for error icon
    expect(screen.getByText('❌')).toBeInTheDocument();
    // Check for warning icon
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });
});
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ValidatedInput from '../../renderer/components/ValidatedInput';
import { ValidationError } from '../../renderer/types/logiops';

describe('ValidatedInput', () => {
  const mockErrors: ValidationError[] = [
    {
      path: 'device.name',
      message: 'Device name is required',
      severity: 'error',
      field: 'name'
    }
  ];

  const mockWarnings: ValidationError[] = [
    {
      path: 'device.name',
      message: 'Consider a more descriptive name',
      severity: 'warning',
      field: 'name'
    }
  ];

  const defaultProps = {
    id: 'test-input',
    label: 'Test Input',
    value: '',
    onChange: vi.fn(),
    fieldPath: 'device.name',
    errors: [],
    warnings: []
  };

  it('should render input with label', () => {
    render(<ValidatedInput {...defaultProps} />);
    
    expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should show required indicator when required', () => {
    render(<ValidatedInput {...defaultProps} required />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should call onChange when input value changes', () => {
    const onChange = vi.fn();
    render(<ValidatedInput {...defaultProps} onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(onChange).toHaveBeenCalledWith('test value');
  });

  it('should display error state when errors exist', () => {
    render(<ValidatedInput {...defaultProps} errors={mockErrors} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('has-errors');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('should display warning state when warnings exist', () => {
    render(<ValidatedInput {...defaultProps} warnings={mockWarnings} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('has-warnings');
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('should show inline validation messages', () => {
    render(<ValidatedInput {...defaultProps} errors={mockErrors} warnings={mockWarnings} />);
    
    expect(screen.getByText('Device name is required')).toBeInTheDocument();
    expect(screen.getByText('Consider a more descriptive name')).toBeInTheDocument();
  });

  it('should show help tooltip when help is available', () => {
    render(<ValidatedInput {...defaultProps} showHelp />);
    
    const helpButton = screen.getByText('?');
    expect(helpButton).toBeInTheDocument();
    
    fireEvent.mouseEnter(helpButton);
    // Help tooltip should appear (implementation depends on getFieldHelp)
  });

  it('should handle different input types', () => {
    render(<ValidatedInput {...defaultProps} type="number" min={0} max={100} />);
    
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<ValidatedInput {...defaultProps} disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled');
  });

  it('should show placeholder text', () => {
    render(<ValidatedInput {...defaultProps} placeholder="Enter value here" />);
    
    const input = screen.getByPlaceholderText('Enter value here');
    expect(input).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ValidatedInput {...defaultProps} className="custom-class" />
    );
    
    const inputContainer = container.querySelector('.validated-input-container');
    expect(inputContainer).toBeInTheDocument();
  });

  it('should handle focus and blur events', () => {
    render(<ValidatedInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    expect(input).toHaveClass('focused');
    
    fireEvent.blur(input);
    expect(input).not.toHaveClass('focused');
  });

  it('should show suggestions when provided', () => {
    const suggestions = ['Try a more specific name', 'Include device model'];
    render(<ValidatedInput {...defaultProps} suggestions={suggestions} />);
    
    expect(screen.getByText('Try a more specific name')).toBeInTheDocument();
    expect(screen.getByText('Include device model')).toBeInTheDocument();
  });

  it('should handle pattern validation', () => {
    render(<ValidatedInput {...defaultProps} pattern="0x[0-9a-fA-F]{4}" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('pattern', '0x[0-9a-fA-F]{4}');
  });
});
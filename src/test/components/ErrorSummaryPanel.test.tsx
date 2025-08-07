import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorSummaryPanel from '../../renderer/components/ErrorSummaryPanel';
import { ValidationError } from '../../renderer/types/logiops';

describe('ErrorSummaryPanel', () => {
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
      path: 'device',
      message: 'Device not in known list',
      severity: 'warning'
    }
  ];

  it('should show success state when no errors or warnings', () => {
    render(<ErrorSummaryPanel errors={[]} warnings={[]} />);
    
    expect(screen.getByText('Configuration Valid')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('should show error state when errors exist', () => {
    render(<ErrorSummaryPanel errors={mockErrors} warnings={[]} />);
    
    expect(screen.getByText('Configuration Issues')).toBeInTheDocument();
    expect(screen.getByText('2 errors')).toBeInTheDocument();
    expect(screen.getAllByText('❌')).toHaveLength(3); // header + 2 items
  });

  it('should show warning state when only warnings exist', () => {
    render(<ErrorSummaryPanel errors={[]} warnings={mockWarnings} />);
    
    expect(screen.getByText('Configuration Warnings')).toBeInTheDocument();
    expect(screen.getByText('1 warning')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('should show both errors and warnings count', () => {
    render(<ErrorSummaryPanel errors={mockErrors} warnings={mockWarnings} />);
    
    expect(screen.getByText('2 errors, 1 warning')).toBeInTheDocument();
  });

  it('should be collapsible', () => {
    render(<ErrorSummaryPanel errors={mockErrors} warnings={[]} />);
    
    const collapseButton = screen.getByText('▲');
    expect(screen.getByText('Device name is required')).toBeInTheDocument();
    
    fireEvent.click(collapseButton);
    expect(screen.queryByText('Device name is required')).not.toBeInTheDocument();
  });

  it('should show tabs when both errors and warnings exist', () => {
    render(<ErrorSummaryPanel errors={mockErrors} warnings={mockWarnings} />);
    
    expect(screen.getByText('Errors (2)')).toBeInTheDocument();
    expect(screen.getByText('Warnings (1)')).toBeInTheDocument();
  });

  it('should switch between error and warning tabs', () => {
    render(<ErrorSummaryPanel errors={mockErrors} warnings={mockWarnings} />);
    
    // Should show errors by default
    expect(screen.getByText('Device name is required')).toBeInTheDocument();
    expect(screen.queryByText('Device not in known list')).not.toBeInTheDocument();
    
    // Click warnings tab
    fireEvent.click(screen.getByText('Warnings (1)'));
    expect(screen.queryByText('Device name is required')).not.toBeInTheDocument();
    expect(screen.getByText('Device not in known list')).toBeInTheDocument();
  });

  it('should call onErrorClick when error item is clicked', () => {
    const onErrorClick = vi.fn();
    render(
      <ErrorSummaryPanel 
        errors={mockErrors} 
        warnings={[]} 
        onErrorClick={onErrorClick}
      />
    );
    
    fireEvent.click(screen.getByText('Device name is required'));
    expect(onErrorClick).toHaveBeenCalledWith(mockErrors[0]);
  });

  it('should display error paths correctly', () => {
    render(<ErrorSummaryPanel errors={mockErrors} warnings={[]} />);
    
    expect(screen.getByText('device.name')).toBeInTheDocument();
    expect(screen.getByText('device.vid')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ErrorSummaryPanel 
        errors={[]} 
        warnings={[]} 
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('error-summary-panel', 'custom-class');
  });

  it('should handle singular vs plural correctly', () => {
    const singleError: ValidationError[] = [mockErrors[0]];
    const singleWarning: ValidationError[] = [mockWarnings[0]];
    
    render(<ErrorSummaryPanel errors={singleError} warnings={singleWarning} />);
    
    expect(screen.getByText('1 error, 1 warning')).toBeInTheDocument();
  });
});
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ButtonComponent } from '../button-component';

describe('ButtonComponent', () => {
  const defaultProps = {
    id: 'test-button',
    text: 'Click me',
    variant: 'default' as const,
    size: 'default' as const,
  };

  it('renders correctly with default props', () => {
    render(<ButtonComponent {...defaultProps} />);
    
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies correct classes for different variants', () => {
    const { rerender } = render(<ButtonComponent {...defaultProps} variant="destructive" />);
    
    expect(screen.getByText('Click me')).toHaveClass('bg-destructive');
    
    rerender(<ButtonComponent {...defaultProps} variant="outline" />);
    expect(screen.getByText('Click me')).toHaveClass('border');
  });

  it('applies correct classes for different sizes', () => {
    const { rerender } = render(<ButtonComponent {...defaultProps} size="sm" />);
    
    expect(screen.getByText('Click me')).toHaveClass('h-8');
    
    rerender(<ButtonComponent {...defaultProps} size="lg" />);
    expect(screen.getByText('Click me')).toHaveClass('h-10');
  });

  it('renders as a link when href is provided', () => {
    render(<ButtonComponent {...defaultProps} href="https://example.com" />);
    
    const button = screen.getByText('Click me');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('A');
    expect(button).toHaveAttribute('href', 'https://example.com');
  });

  it('is disabled when disabled prop is true', () => {
    render(<ButtonComponent {...defaultProps} disabled={true} />);
    
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
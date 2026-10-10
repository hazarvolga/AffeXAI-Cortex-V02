import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextComponent } from '../text-component';

// Mock the editor context
jest.mock('../editor/editor-context', () => ({
  useEditor: () => ({
    isEditMode: true,
    updateComponentProps: jest.fn(),
  }),
}));

describe('TextComponent', () => {
  const defaultProps = {
    id: 'test-text',
    content: 'Test content',
    variant: 'body' as const,
    align: 'left' as const,
  };

  it('renders correctly with default props', () => {
    render(<TextComponent {...defaultProps} />);
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toHaveClass('text-base');
  });

  it('applies correct classes for heading variants', () => {
    render(<TextComponent {...defaultProps} variant="heading1" />);
    
    expect(screen.getByText('Test content')).toHaveClass('text-4xl', 'font-bold');
  });

  it('applies correct classes for alignment', () => {
    render(<TextComponent {...defaultProps} align="center" />);
    
    expect(screen.getByText('Test content')).toHaveClass('text-center');
  });

  it('shows placeholder in edit mode when content is empty', () => {
    render(<TextComponent {...defaultProps} content="" />);
    
    expect(screen.getByText('Click to edit...')).toBeInTheDocument();
  });

  it('handles content updates in edit mode', () => {
    render(<TextComponent {...defaultProps} />);
    
    const textElement = screen.getByText('Test content');
    fireEvent.doubleClick(textElement);
    
    expect(textElement).toHaveAttribute('contentEditable', 'true');
  });
});
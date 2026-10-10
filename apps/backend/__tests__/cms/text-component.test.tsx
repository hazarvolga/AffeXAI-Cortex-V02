import React from 'react';
import { render, screen } from '@testing-library/react';
import { TextComponent } from '@/components/cms/text-component';

describe('TextComponent', () => {
  test('renders content correctly', () => {
    render(<TextComponent id="test" content="Hello World" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  test('renders as h1 for heading1 variant', () => {
    render(<TextComponent id="test" content="Heading" variant="heading1" />);
    const heading = screen.getByText('Heading');
    expect(heading.tagName).toBe('H1');
  });

  test('renders as h2 for heading2 variant', () => {
    render(<TextComponent id="test" content="Heading" variant="heading2" />);
    const heading = screen.getByText('Heading');
    expect(heading.tagName).toBe('H2');
  });

  test('renders as h3 for heading3 variant', () => {
    render(<TextComponent id="test" content="Heading" variant="heading3" />);
    const heading = screen.getByText('Heading');
    expect(heading.tagName).toBe('H3');
  });

  test('renders as p for body variant', () => {
    render(<TextComponent id="test" content="Body text" variant="body" />);
    const paragraph = screen.getByText('Body text');
    expect(paragraph.tagName).toBe('P');
  });

  test('applies correct alignment classes', () => {
    render(<TextComponent id="test" content="Centered text" align="center" />);
    const text = screen.getByText('Centered text');
    expect(text).toHaveClass('text-center');
  });

  test('applies custom className', () => {
    render(<TextComponent id="test" content="Styled text" className="custom-class" />);
    const text = screen.getByText('Styled text');
    expect(text).toHaveClass('custom-class');
  });
});
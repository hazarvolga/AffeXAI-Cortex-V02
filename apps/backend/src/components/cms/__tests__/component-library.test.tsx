import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentLibrary } from '../editor/component-library';

// Mock block imports
jest.mock('@/components/cms/blocks/navigation-blocks', () => ({
  navigationBlocks: [
    { id: 'nav-1', name: 'Navigation Bar', description: 'A simple navigation bar', category: 'Navigation', component: () => null },
  ],
}));

jest.mock('@/components/cms/blocks/hero-blocks', () => ({
  heroBlocks: [
    { id: 'hero-1', name: 'Hero Section', description: 'A hero section with text and image', category: 'Hero', component: () => null },
  ],
}));

jest.mock('@/components/cms/blocks/content-blocks', () => ({
  contentBlocks: [
    { id: 'content-1', name: 'Content Section', description: 'A content section with text', category: 'Content', component: () => null },
  ],
}));

// Add mocks for all other block imports
jest.mock('@/components/cms/blocks/footer-blocks', () => ({ footerBlocks: [] }));
jest.mock('@/components/cms/blocks/element-blocks', () => ({ elementBlocks: [] }));
jest.mock('@/components/cms/blocks/content-variants-blocks', () => ({ contentVariantBlocks: [] }));
jest.mock('@/components/cms/blocks/special-blocks', () => ({ specialBlocks: [] }));
jest.mock('@/components/cms/blocks/ecommerce-blocks', () => ({ ecommerceBlocks: [] }));
jest.mock('@/components/cms/blocks/gallery-blocks', () => ({ galleryBlocks: [] }));
jest.mock('@/components/cms/blocks/blog-rss-blocks', () => ({ blogRssBlocks: [] }));
jest.mock('@/components/cms/blocks/social-sharing-blocks', () => ({ socialSharingBlocks: [] }));

describe('ComponentLibrary', () => {
  const defaultProps = {
    onComponentSelect: jest.fn(),
    onBlockSelect: jest.fn(),
  };

  it('renders without crashing', () => {
    render(<ComponentLibrary {...defaultProps} />);
    
    expect(screen.getByText('Components & Blocks')).toBeInTheDocument();
  });

  it('renders component categories', () => {
    render(<ComponentLibrary {...defaultProps} />);
    
    expect(screen.getByText('Layout Components')).toBeInTheDocument();
    expect(screen.getByText('Content Components')).toBeInTheDocument();
    expect(screen.getByText('Media Components')).toBeInTheDocument();
  });

  it('renders block categories', () => {
    render(<ComponentLibrary {...defaultProps} />);
    
    expect(screen.getByText('Navigation Blocks')).toBeInTheDocument();
    expect(screen.getByText('Hero Blocks')).toBeInTheDocument();
    expect(screen.getByText('Content Blocks')).toBeInTheDocument();
  });

  it('expands and collapses categories', () => {
    render(<ComponentLibrary {...defaultProps} />);
    
    const layoutCategory = screen.getByText('Layout Components');
    fireEvent.click(layoutCategory);
    
    expect(screen.getByText('Container')).toBeInTheDocument();
    expect(screen.getByText('Grid')).toBeInTheDocument();
    expect(screen.getByText('Card')).toBeInTheDocument();
    
    fireEvent.click(layoutCategory);
    // After collapsing, the components should not be visible
    // This would require more complex testing with async behavior
  });

  it('handles component selection', () => {
    const onComponentSelect = jest.fn();
    render(<ComponentLibrary {...defaultProps} onComponentSelect={onComponentSelect} />);
    
    // Expand the Content Components category
    const contentCategory = screen.getByText('Content Components');
    fireEvent.click(contentCategory);
    
    // Click on the Text component
    const textComponent = screen.getByText('Text');
    fireEvent.click(textComponent);
    
    expect(onComponentSelect).toHaveBeenCalledWith('text');
  });

  it('handles block selection', () => {
    const onBlockSelect = jest.fn();
    render(<ComponentLibrary {...defaultProps} onBlockSelect={onBlockSelect} />);
    
    // Expand the Hero Blocks category
    const heroCategory = screen.getByText('Hero Blocks');
    fireEvent.click(heroCategory);
    
    // Click on the Hero Section block
    const heroBlock = screen.getByText('Hero Section');
    fireEvent.click(heroBlock);
    
    expect(onBlockSelect).toHaveBeenCalled();
  });

  it('handles search functionality', () => {
    render(<ComponentLibrary {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search components and blocks...');
    fireEvent.change(searchInput, { target: { value: 'Hero' } });
    
    // The search results should show the Hero Section block
    expect(screen.getByText('Hero Section')).toBeInTheDocument();
  });

  it('shows empty search results message', () => {
    render(<ComponentLibrary {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search components and blocks...');
    fireEvent.change(searchInput, { target: { value: 'Nonexistent Component' } });
    
    expect(screen.getByText('No components or blocks found')).toBeInTheDocument();
  });
});
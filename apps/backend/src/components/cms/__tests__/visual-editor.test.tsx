import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VisualEditor } from '../editor/visual-editor';

// Mock the cmsService
jest.mock('@/lib/cms/cms-service', () => ({
  cmsService: {
    getPage: jest.fn(),
    getComponents: jest.fn(),
    updatePage: jest.fn(),
    createComponent: jest.fn(),
    updateComponent: jest.fn(),
    deleteComponent: jest.fn(),
  },
}));

// Mock child components
jest.mock('../editor/component-library', () => ({
  ComponentLibrary: () => <div data-testid="component-library">Component Library</div>,
}));

jest.mock('../editor/editor-canvas', () => ({
  EditorCanvas: () => <div data-testid="editor-canvas">Editor Canvas</div>,
}));

jest.mock('../editor/properties-panel', () => ({
  PropertiesPanel: () => <div data-testid="properties-panel">Properties Panel</div>,
}));

jest.mock('../editor/history-panel', () => ({
  HistoryPanel: () => <div data-testid="history-panel">History Panel</div>,
}));

jest.mock('../editor/media-library', () => ({
  MediaLibrary: () => <div data-testid="media-library">Media Library</div>,
}));

jest.mock('../editor/layout-options-panel', () => ({
  LayoutOptionsPanel: () => <div data-testid="layout-options-panel">Layout Options Panel</div>,
}));

jest.mock('../editor/debug-panel', () => ({
  DebugPanel: () => <div data-testid="debug-panel">Debug Panel</div>,
}));

jest.mock('../editor/template-manager', () => ({
  TemplateManager: () => <div data-testid="template-manager">Template Manager</div>,
}));

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('VisualEditor', () => {
  const mockPageId = 'test-page-id';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<VisualEditor pageId={mockPageId} />);
    
    expect(screen.getByText('Visual CMS Editor')).toBeInTheDocument();
  });

  it('displays the component library by default', () => {
    render(<VisualEditor pageId={mockPageId} />);
    
    expect(screen.getByTestId('component-library')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    render(<VisualEditor pageId={mockPageId} />);
    
    // Click on the Media tab
    const mediaTab = screen.getByText('Media');
    fireEvent.click(mediaTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('media-library')).toBeInTheDocument();
    });
    
    // Click on the Layout tab
    const layoutTab = screen.getByText('Layout');
    fireEvent.click(layoutTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('layout-options-panel')).toBeInTheDocument();
    });
  });

  it('shows save button and handles save action', () => {
    render(<VisualEditor pageId={mockPageId} />);
    
    const saveButton = screen.getByText('Save Draft');
    expect(saveButton).toBeInTheDocument();
  });

  it('shows preview button and handles preview toggle', () => {
    render(<VisualEditor pageId={mockPageId} />);
    
    const previewButton = screen.getByText('Preview');
    expect(previewButton).toBeInTheDocument();
  });

  it('renders editor canvas', () => {
    render(<VisualEditor pageId={mockPageId} />);
    
    expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();
  });

  it('renders properties panel', () => {
    render(<VisualEditor pageId={mockPageId} />);
    
    expect(screen.getByTestId('properties-panel')).toBeInTheDocument();
  });

  it('handles keyboard shortcuts', () => {
    render(<VisualEditor pageId={mockPageId} />);
    
    // Simulate Ctrl+Z (undo)
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    
    // Simulate Ctrl+Shift+Z (redo)
    fireEvent.keyDown(window, { key: 'Z', ctrlKey: true, shiftKey: true });
  });
});
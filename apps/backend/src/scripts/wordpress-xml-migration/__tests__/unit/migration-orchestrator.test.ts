/**
 * Unit tests for MigrationOrchestrator
 */

import { DataSource } from 'typeorm';
import { MigrationOrchestrator } from '../../orchestrator/migration-orchestrator';
import { MigrationConfig } from '../../types/migration.types';

describe('MigrationOrchestrator', () => {
  let orchestrator: MigrationOrchestrator;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    // Create mock DataSource
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
      }),
      transaction: jest.fn(),
    } as any;

    orchestrator = new MigrationOrchestrator(mockDataSource);
  });

  describe('constructor', () => {
    it('should initialize all components', () => {
      expect(orchestrator).toBeDefined();
      expect(mockDataSource.getRepository).toHaveBeenCalled();
    });
  });

  describe('migrate', () => {
    // These tests require complex mocking of internal components
    // The actual migration is tested in integration tests
    it.skip('should handle empty XML file', async () => {
      // Skipped: requires mocking internal XMLParser instance
      // Covered by integration tests
    });

    it.skip('should track migration statistics', async () => {
      // Skipped: requires full migration setup with real files
      // Covered by integration tests
    });
  });

  describe('mapElementToComponent', () => {
    it('should map image element correctly', () => {
      const element = {
        type: 'image',
        tagName: 'img',
        content: 'Test image',
        attributes: {
          src: 'https://example.com/image.jpg',
          alt: 'Test alt',
        },
        children: [],
      };

      const component = (orchestrator as any).mapElementToComponent(element, 0, null);

      expect(component).toBeDefined();
      expect(component.blockId).toBe('gallery-single-image');
      expect(component.blockType).toBe('gallery');
      expect(component.blockCategory).toBe('content');
      expect(component.props.imageUrl).toBe('https://example.com/image.jpg');
      expect(component.props.alt).toBe('Test alt');
      expect(component.props.caption).toBe('Test image');
      expect(component.order).toBe(0);
      expect(component.parentId).toBeNull();
    });

    it('should map heading element to rich text', () => {
      const element = {
        type: 'heading',
        tagName: 'h1',
        content: '<h1>Test Heading</h1>',
        attributes: {},
        children: [],
      };

      const component = (orchestrator as any).mapElementToComponent(element, 1, null);

      expect(component).toBeDefined();
      expect(component.blockId).toBe('content-rich-text');
      expect(component.blockType).toBe('content');
      expect(component.props.htmlContent).toBeDefined();
      expect(component.order).toBe(1);
    });

    it('should map button element correctly', () => {
      const element = {
        type: 'button',
        tagName: 'a',
        content: 'Click Me',
        attributes: {
          href: 'https://example.com',
          variant: 'primary',
        },
        children: [],
      };

      const component = (orchestrator as any).mapElementToComponent(element, 2, null);

      expect(component).toBeDefined();
      expect(component.blockId).toBe('element-button-group');
      expect(component.blockType).toBe('element');
      expect(component.props.buttons).toHaveLength(1);
      expect(component.props.buttons[0].text).toBe('Click Me');
      expect(component.props.buttons[0].href).toBe('https://example.com');
      expect(component.props.buttons[0].variant).toBe('primary');
    });

    it('should map video element correctly', () => {
      const element = {
        type: 'video',
        tagName: 'iframe',
        content: 'Video Title',
        attributes: {
          src: 'https://www.youtube.com/embed/VIDEO_ID',
          provider: 'youtube',
        },
        children: [],
      };

      const component = (orchestrator as any).mapElementToComponent(element, 3, null);

      expect(component).toBeDefined();
      expect(component.blockId).toBe('video-embed-section');
      expect(component.blockType).toBe('video');
      expect(component.props.videoUrl).toBe('https://www.youtube.com/embed/VIDEO_ID');
      expect(component.props.provider).toBe('youtube');
      expect(component.props.title).toBe('Video Title');
    });

    it('should map section element correctly', () => {
      const element = {
        type: 'section',
        tagName: 'section',
        content: 'Section Title',
        attributes: {},
        children: [],
      };

      const component = (orchestrator as any).mapElementToComponent(element, 4, null);

      expect(component).toBeDefined();
      expect(component.blockId).toBe('content-section-with-title');
      expect(component.blockType).toBe('content');
      expect(component.props.title).toBe('Section Title');
    });

    it('should handle unknown element type', () => {
      const element = {
        type: 'unknown',
        tagName: 'unknown',
        content: 'Unknown content',
        attributes: {},
        children: [],
      };

      const component = (orchestrator as any).mapElementToComponent(element, 5, null);

      expect(component).toBeNull();
    });

    it('should preserve parentId in mapped component', () => {
      const element = {
        type: 'paragraph',
        tagName: 'p',
        content: '<p>Nested paragraph</p>',
        attributes: {},
        children: [],
      };

      const component = (orchestrator as any).mapElementToComponent(element, 0, 'parent-123');

      expect(component).toBeDefined();
      expect(component.parentId).toBe('parent-123');
    });

    it('should handle missing attributes gracefully', () => {
      const element = {
        type: 'image',
        tagName: 'img',
        content: '',
        attributes: {},
        children: [],
      };

      const component = (orchestrator as any).mapElementToComponent(element, 0, null);

      expect(component).toBeDefined();
      expect(component.props.imageUrl).toBe('');
      expect(component.props.alt).toBe('');
      expect(component.props.caption).toBe('');
    });

    it('should use default button text when content is empty', () => {
      const element = {
        type: 'button',
        tagName: 'a',
        content: '',
        attributes: {
          href: 'https://example.com',
        },
        children: [],
      };

      const component = (orchestrator as any).mapElementToComponent(element, 0, null);

      expect(component).toBeDefined();
      expect(component.props.buttons[0].text).toBe('Button');
    });

    it('should use default href when missing', () => {
      const element = {
        type: 'button',
        tagName: 'a',
        content: 'Click Me',
        attributes: {},
        children: [],
      };

      const component = (orchestrator as any).mapElementToComponent(element, 0, null);

      expect(component).toBeDefined();
      expect(component.props.buttons[0].href).toBe('#');
    });

    it('should use default variant when missing', () => {
      const element = {
        type: 'button',
        tagName: 'a',
        content: 'Click Me',
        attributes: {
          href: 'https://example.com',
        },
        children: [],
      };

      const component = (orchestrator as any).mapElementToComponent(element, 0, null);

      expect(component).toBeDefined();
      expect(component.props.buttons[0].variant).toBe('primary');
    });
  });

  describe('printMigrationSummary', () => {
    it('should print summary without errors', () => {
      const result = {
        totalPages: 10,
        successfulPages: 10,
        failedPages: 0,
        totalComponents: 50,
        totalMediaEntities: 20,
        totalVideos: 5,
        errors: [],
        duration: 5000,
      };

      // Should not throw
      expect(() => {
        (orchestrator as any).printMigrationSummary(result);
      }).not.toThrow();
    });

    it('should print summary with errors', () => {
      const result = {
        totalPages: 10,
        successfulPages: 8,
        failedPages: 2,
        totalComponents: 40,
        totalMediaEntities: 15,
        totalVideos: 3,
        errors: [
          { page: 'Page 1', message: 'Error 1' },
          { page: 'Page 2', message: 'Error 2' },
        ],
        duration: 5000,
      };

      // Should not throw
      expect(() => {
        (orchestrator as any).printMigrationSummary(result);
      }).not.toThrow();
    });
  });
});

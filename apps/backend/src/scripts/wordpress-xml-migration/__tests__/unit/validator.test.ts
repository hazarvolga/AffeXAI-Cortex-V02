/**
 * Validator Unit Tests
 */

import { DataSource } from 'typeorm';
import { Validator } from '../../validators/validator';

describe('Validator', () => {
  let dataSource: DataSource;
  let validator: Validator;
  let mockQueryResponses: any[] = [];

  beforeEach(() => {
    mockQueryResponses = [];

    dataSource = {
      query: jest.fn().mockImplementation(() => {
        if (mockQueryResponses.length > 0) {
          return Promise.resolve(mockQueryResponses.shift());
        }
        return Promise.resolve([{ count: '0' }]);
      }),
    } as any;

    validator = new Validator(dataSource);
  });

  describe('Page Validation', () => {
    it('should detect pages with empty title', async () => {
      mockQueryResponses = [
        [{ id: '1', title: '', slug: 'test', layout_options: { templateId: 't1' } }],
        [], [], [], [], [], [],
        [{ count: '1' }], [{ count: '0' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'title')).toBe(true);
    });

    it('should detect pages with empty slug', async () => {
      mockQueryResponses = [
        [{ id: '1', title: 'Test', slug: '', layout_options: { templateId: 't1' } }],
        [], [], [], [], [], [],
        [{ count: '1' }], [{ count: '0' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'slug')).toBe(true);
    });

    it('should detect pages without template', async () => {
      mockQueryResponses = [
        [{ id: '1', title: 'Test', slug: 'test', layout_options: {} }],
        [], [], [], [], [], [],
        [{ count: '1' }], [{ count: '0' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'layout_options.templateId')).toBe(true);
    });

    it('should pass for valid pages', async () => {
      mockQueryResponses = [
        [{ id: '1', title: 'Test', slug: 'test', layout_options: { templateId: 't1' } }],
        [], [], [], [], [], [],
        [{ count: '1' }], [{ count: '0' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      const pageErrors = result.errors.filter(e => e.type === 'page');
      expect(pageErrors).toHaveLength(0);
    });
  });

  describe('Component Structure Validation', () => {
    it('should detect incorrect type', async () => {
      mockQueryResponses = [
        [],
        [{ id: '1', type: 'custom', block_id: 'content-rich-text', block_type: 'content', block_category: 'content', props: {} }],
        [], [], [], [], [],
        [{ count: '0' }], [{ count: '1' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('should detect empty block_id', async () => {
      mockQueryResponses = [
        [],
        [{ id: '1', type: 'block', block_id: '', block_type: 'content', block_category: 'content', props: {} }],
        [], [], [], [], [],
        [{ count: '0' }], [{ count: '1' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'block_id')).toBe(true);
    });

    it('should detect invalid block_id', async () => {
      mockQueryResponses = [
        [],
        [{ id: '1', type: 'block', block_id: 'invalid', block_type: 'content', block_category: 'content', props: {} }],
        [], [], [], [], [],
        [{ count: '0' }], [{ count: '1' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('not found in block registry'))).toBe(true);
    });

    it('should detect empty block_type', async () => {
      mockQueryResponses = [
        [],
        [{ id: '1', type: 'block', block_id: 'content-rich-text', block_type: '', block_category: 'content', props: {} }],
        [], [], [], [], [],
        [{ count: '0' }], [{ count: '1' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'block_type')).toBe(true);
    });

    it('should detect empty block_category', async () => {
      mockQueryResponses = [
        [],
        [{ id: '1', type: 'block', block_id: 'content-rich-text', block_type: 'content', block_category: '', props: {} }],
        [], [], [], [], [],
        [{ count: '0' }], [{ count: '1' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'block_category')).toBe(true);
    });

    it('should pass for valid components', async () => {
      mockQueryResponses = [
        [],
        [{ id: '1', type: 'block', block_id: 'content-rich-text', block_type: 'content', block_category: 'content', props: {} }],
        [], [], [], [], [],
        [{ count: '0' }], [{ count: '1' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      const componentErrors = result.errors.filter(e => e.type === 'component');
      expect(componentErrors).toHaveLength(0);
    });
  });

  describe('Media Entity Validation', () => {
    it('should detect non-relative URLs', async () => {
      mockQueryResponses = [
        [], [],
        [{ id: '1', filename: 'img.jpg', url: 'http://localhost/img.jpg', mime_type: 'image/jpeg' }],
        [], [], [], [],
        [{ count: '0' }], [{ count: '0' }], [{ count: '1' }],
      ];

      const result = await validator.validateMigration();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'url')).toBe(true);
    });

    it('should detect empty filename', async () => {
      mockQueryResponses = [
        [], [],
        [{ id: '1', filename: '', url: '/cms-media/img.jpg', mime_type: 'image/jpeg' }],
        [], [], [], [],
        [{ count: '0' }], [{ count: '0' }], [{ count: '1' }],
      ];

      const result = await validator.validateMigration();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'filename')).toBe(true);
    });

    it('should warn about missing mime_type', async () => {
      mockQueryResponses = [
        [], [],
        [{ id: '1', filename: 'img.jpg', url: '/cms-media/img.jpg', mime_type: '' }],
        [], [], [], [],
        [{ count: '0' }], [{ count: '0' }], [{ count: '1' }],
      ];

      const result = await validator.validateMigration();
      expect(result.warnings.some(e => e.field === 'mime_type')).toBe(true);
    });

    it('should pass for valid media', async () => {
      mockQueryResponses = [
        [], [],
        [{ id: '1', filename: 'img.jpg', url: '/cms-media/img.jpg', mime_type: 'image/jpeg' }],
        [], [], [], [],
        [{ count: '0' }], [{ count: '0' }], [{ count: '1' }],
      ];

      const result = await validator.validateMigration();
      const mediaErrors = result.errors.filter(e => e.type === 'media');
      expect(mediaErrors).toHaveLength(0);
    });
  });

  describe('Reference Validation', () => {
    it('should detect invalid imageMediaId', async () => {
      mockQueryResponses = [
        [], [], [],
        [{ id: '1', props: { imageMediaId: 'bad-id' } }],
        [], // Media not found
        [], [], [],
        [{ count: '0' }], [{ count: '0' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'props.imageMediaId')).toBe(true);
    });

    it('should detect invalid parentId', async () => {
      mockQueryResponses = [
        [], [], [],
        [],
        [{ id: '1', parent_id: 'bad-parent' }],
        [], // Parent not found
        [], [],
        [{ count: '0' }], [{ count: '0' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'parent_id')).toBe(true);
    });

    it('should detect invalid pageId', async () => {
      mockQueryResponses = [
        [], [], [], [], [],
        [{ id: '1', page_id: 'bad-page' }],
        [], // Page not found
        [],
        [{ count: '0' }], [{ count: '0' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'page_id')).toBe(true);
    });
  });

  describe('Props Validation', () => {
    it('should detect incorrect src property', async () => {
      mockQueryResponses = [
        [], [], [], [], [], [],
        [{ id: '1', block_id: 'gallery-single-image', props: { src: '/img.jpg' } }],
        [{ count: '0' }], [{ count: '0' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'props.src')).toBe(true);
    });

    it('should detect incorrect content property', async () => {
      mockQueryResponses = [
        [], [], [], [], [], [],
        [{ id: '1', block_id: 'content-rich-text', props: { content: '<p>Test</p>' } }],
        [{ count: '0' }], [{ count: '0' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'props.content')).toBe(true);
    });

    it('should warn about undefined values', async () => {
      mockQueryResponses = [
        [], [], [], [], [], [],
        [{ id: '1', block_id: 'content-rich-text', props: { htmlContent: '<p>Test</p>', title: undefined } }],
        [{ count: '0' }], [{ count: '0' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.warnings.some(e => e.message.includes('undefined'))).toBe(true);
    });

    it('should warn about null values', async () => {
      mockQueryResponses = [
        [], [], [], [], [], [],
        [{ id: '1', block_id: 'content-rich-text', props: { htmlContent: '<p>Test</p>', caption: null } }],
        [{ count: '0' }], [{ count: '0' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.warnings.some(e => e.message.includes('null'))).toBe(true);
    });

    it('should warn about unexpected props', async () => {
      mockQueryResponses = [
        [], [], [], [], [], [],
        [{ id: '1', block_id: 'content-rich-text', props: { htmlContent: '<p>Test</p>', unexpected: 'value' } }],
        [{ count: '0' }], [{ count: '0' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.warnings.some(e => e.message.includes('unexpected props'))).toBe(true);
    });
  });

  describe('Validation Report', () => {
    it('should generate summary', async () => {
      mockQueryResponses = [
        [], [], [], [], [], [], [],
        [{ count: '5' }], [{ count: '10' }], [{ count: '3' }],
      ];

      const result = await validator.validateMigration();
      expect(result.summary.totalPages).toBe(5);
      expect(result.summary.totalComponents).toBe(10);
      expect(result.summary.totalMediaEntities).toBe(3);
    });

    it('should generate JSON report', async () => {
      mockQueryResponses = [
        [], [], [], [], [], [], [],
        [{ count: '0' }], [{ count: '0' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      const json = validator.generateJSONReport(result);
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should mark as failed when errors exist', async () => {
      mockQueryResponses = [
        [{ id: '1', title: '', slug: 'test', layout_options: {} }],
        [], [], [], [], [], [],
        [{ count: '1' }], [{ count: '0' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.valid).toBe(false);
    });

    it('should mark as passed when no errors', async () => {
      mockQueryResponses = [
        [], [], [], [], [], [], [],
        [{ count: '0' }], [{ count: '0' }], [{ count: '0' }],
      ];

      const result = await validator.validateMigration();
      expect(result.valid).toBe(true);
    });
  });
});

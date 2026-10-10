/**
 * Unit tests for HierarchyManager
 */

import { HierarchyManager } from '../../managers/hierarchy-manager';
import { ParsedElement } from '../../types/migration.types';

describe('HierarchyManager', () => {
  let hierarchyManager: HierarchyManager;

  beforeEach(() => {
    hierarchyManager = new HierarchyManager();
  });

  describe('buildHierarchy', () => {
    it('should build hierarchy from flat elements', () => {
      const elements: ParsedElement[] = [
        { type: 'heading', tagName: 'h1', content: 'Title', attributes: {}, children: [] },
        { type: 'paragraph', tagName: 'p', content: 'Content', attributes: {}, children: [] },
      ];

      const hierarchy = hierarchyManager.buildHierarchy(elements);

      expect(hierarchy).toHaveLength(2);
      expect(hierarchy[0].element.type).toBe('heading');
      expect(hierarchy[1].element.type).toBe('paragraph');
    });

    it('should handle nested elements', () => {
      const elements: ParsedElement[] = [
        {
          type: 'section',
          tagName: 'section',
          content: '',
          attributes: {},
          children: [
            { type: 'heading', tagName: 'h2', content: 'Section Title', attributes: {}, children: [] },
            { type: 'paragraph', tagName: 'p', content: 'Section content', attributes: {}, children: [] },
          ],
        },
      ];

      const hierarchy = hierarchyManager.buildHierarchy(elements);

      expect(hierarchy).toHaveLength(1);
      expect(hierarchy[0].children).toHaveLength(2);
      expect(hierarchy[0].children[0].element.content).toBe('Section Title');
    });

    it('should assign unique IDs to nodes', () => {
      const elements: ParsedElement[] = [
        { type: 'paragraph', tagName: 'p', content: 'First', attributes: {}, children: [] },
        { type: 'paragraph', tagName: 'p', content: 'Second', attributes: {}, children: [] },
      ];

      const hierarchy = hierarchyManager.buildHierarchy(elements);

      expect(hierarchy[0].id).toBe('node-0');
      expect(hierarchy[1].id).toBe('node-1');
    });

    it('should set parentId correctly for nested elements', () => {
      const elements: ParsedElement[] = [
        {
          type: 'section',
          tagName: 'section',
          content: '',
          attributes: {},
          children: [
            { type: 'heading', tagName: 'h2', content: 'Title', attributes: {}, children: [] },
            { type: 'paragraph', tagName: 'p', content: 'Content', attributes: {}, children: [] },
          ],
        },
      ];

      const hierarchy = hierarchyManager.buildHierarchy(elements);

      expect(hierarchy[0].parentId).toBeNull();
      expect(hierarchy[0].children[0].parentId).toBe('node-0');
      expect(hierarchy[0].children[1].parentId).toBe('node-0');
    });
  });

  describe('flattenHierarchy', () => {
    it('should flatten hierarchy to flat list', () => {
      const elements: ParsedElement[] = [
        { type: 'paragraph', tagName: 'p', content: 'First', attributes: {}, children: [] },
        { type: 'paragraph', tagName: 'p', content: 'Second', attributes: {}, children: [] },
        { type: 'paragraph', tagName: 'p', content: 'Third', attributes: {}, children: [] },
      ];

      const hierarchy = hierarchyManager.buildHierarchy(elements);
      const flat = hierarchyManager.flattenHierarchy(hierarchy);

      expect(flat).toHaveLength(3);
      expect(flat[0].element.content).toBe('First');
      expect(flat[1].element.content).toBe('Second');
      expect(flat[2].element.content).toBe('Third');
    });

    it('should flatten nested hierarchy', () => {
      const elements: ParsedElement[] = [
        {
          type: 'section',
          tagName: 'section',
          content: '',
          attributes: {},
          children: [
            { type: 'paragraph', tagName: 'p', content: 'Content', attributes: {}, children: [] },
          ],
        },
      ];

      const hierarchy = hierarchyManager.buildHierarchy(elements);
      const flat = hierarchyManager.flattenHierarchy(hierarchy);

      expect(flat).toHaveLength(2); // section + paragraph
      expect(flat[0].element.type).toBe('section');
      expect(flat[1].element.type).toBe('paragraph');
    });

    it('should preserve order in flattened list', () => {
      const elements: ParsedElement[] = [
        { type: 'heading', tagName: 'h1', content: 'Title', attributes: {}, children: [] },
        { type: 'paragraph', tagName: 'p', content: 'Paragraph', attributes: {}, children: [] },
      ];

      const hierarchy = hierarchyManager.buildHierarchy(elements);
      const flat = hierarchyManager.flattenHierarchy(hierarchy);

      expect(flat[0].order).toBe(0);
      expect(flat[1].order).toBe(1);
    });
  });

  describe('detectHierarchy', () => {
    it('should detect hierarchy when section elements present', () => {
      const elements: ParsedElement[] = [
        {
          type: 'section',
          tagName: 'section',
          content: '',
          attributes: {},
          children: [
            { type: 'paragraph', tagName: 'p', content: 'Content', attributes: {}, children: [] },
          ],
        },
      ];

      const hasHierarchy = hierarchyManager.detectHierarchy(elements);

      expect(hasHierarchy).toBe(true);
    });

    it('should return false for flat structure', () => {
      const elements: ParsedElement[] = [
        { type: 'heading', tagName: 'h1', content: 'Title', attributes: {}, children: [] },
        { type: 'paragraph', tagName: 'p', content: 'Paragraph', attributes: {}, children: [] },
        { type: 'image', tagName: 'img', content: '', attributes: { src: 'image.jpg' }, children: [] },
      ];

      const hasHierarchy = hierarchyManager.detectHierarchy(elements);

      expect(hasHierarchy).toBe(false);
    });
  });

  describe('createFlatStructure', () => {
    it('should create flat structure with all elements at root', () => {
      const elements: ParsedElement[] = [
        { type: 'paragraph', tagName: 'p', content: 'First', attributes: {}, children: [] },
        { type: 'paragraph', tagName: 'p', content: 'Second', attributes: {}, children: [] },
        { type: 'paragraph', tagName: 'p', content: 'Third', attributes: {}, children: [] },
      ];

      const flat = hierarchyManager.createFlatStructure(elements);

      expect(flat).toHaveLength(3);
      expect(flat[0].parentId).toBeNull();
      expect(flat[1].parentId).toBeNull();
      expect(flat[2].parentId).toBeNull();
    });
  });

  describe('validateHierarchy', () => {
    it('should validate correct hierarchy', () => {
      const components = [
        { element: { type: 'paragraph', tagName: 'p', content: '', attributes: {}, children: [] } as ParsedElement, parentId: null, order: 0 },
        { element: { type: 'paragraph', tagName: 'p', content: '', attributes: {}, children: [] } as ParsedElement, parentId: null, order: 1 },
      ];

      const result = hierarchyManager.validateHierarchy(components);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect non-sequential order values', () => {
      const components = [
        { element: { type: 'paragraph', tagName: 'p', content: '', attributes: {}, children: [] } as ParsedElement, parentId: null, order: 0 },
        { element: { type: 'paragraph', tagName: 'p', content: '', attributes: {}, children: [] } as ParsedElement, parentId: null, order: 2 }, // Skip 1
      ];

      const result = hierarchyManager.validateHierarchy(components);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect order not starting from 0', () => {
      const components = [
        { element: { type: 'paragraph', tagName: 'p', content: '', attributes: {}, children: [] } as ParsedElement, parentId: null, order: 1 }, // Should start from 0
        { element: { type: 'paragraph', tagName: 'p', content: '', attributes: {}, children: [] } as ParsedElement, parentId: null, order: 2 },
      ];

      const result = hierarchyManager.validateHierarchy(components);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate hierarchy with nested components', () => {
      const components = [
        { element: { type: 'paragraph', tagName: 'p', content: '', attributes: {}, children: [] } as ParsedElement, parentId: 'node-0', order: 0 },
        { element: { type: 'paragraph', tagName: 'p', content: '', attributes: {}, children: [] } as ParsedElement, parentId: 'node-0', order: 1 },
        { element: { type: 'section', tagName: 'section', content: '', attributes: {}, children: [] } as ParsedElement, parentId: null, order: 1 },
      ];

      const result = hierarchyManager.validateHierarchy(components);

      expect(result.valid).toBe(false); // Missing order 0 at root level
    });
  });

  describe('getHierarchyStats', () => {
    it('should calculate hierarchy statistics', () => {
      const components = [
        { element: { type: 'paragraph', tagName: 'p', content: '', attributes: {}, children: [] } as ParsedElement, parentId: null, order: 0 },
        { element: { type: 'paragraph', tagName: 'p', content: '', attributes: {}, children: [] } as ParsedElement, parentId: null, order: 1 },
        { element: { type: 'paragraph', tagName: 'p', content: '', attributes: {}, children: [] } as ParsedElement, parentId: null, order: 2 },
      ];

      const stats = hierarchyManager.getHierarchyStats(components);

      expect(stats.total).toBe(3);
      expect(stats.rootLevel).toBe(3);
      expect(stats.nested).toBe(0);
      expect(stats.maxDepth).toBe(1);
    });

    it('should calculate stats for nested hierarchy', () => {
      const components = [
        { element: { type: 'paragraph', tagName: 'p', content: '', attributes: {}, children: [] } as ParsedElement, parentId: 'node-0', order: 0 },
        { element: { type: 'paragraph', tagName: 'p', content: '', attributes: {}, children: [] } as ParsedElement, parentId: 'node-0', order: 1 },
      ];

      const stats = hierarchyManager.getHierarchyStats(components);

      expect(stats.total).toBe(2);
      expect(stats.rootLevel).toBe(0);
      expect(stats.nested).toBe(2);
      expect(stats.maxDepth).toBe(2);
    });
  });
});

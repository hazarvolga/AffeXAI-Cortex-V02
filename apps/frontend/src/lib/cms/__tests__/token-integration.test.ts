/**
 * Token Resolution and Validation Integration Tests
 *
 * Tests the complete token integration workflow:
 * 1. Token resolution in block properties
 * 2. Token validation against design system
 * 3. Template validation with design tokens
 * 4. Context compatibility checking
 */

import { describe, it, expect } from '@jest/globals';
import type { DesignTokens } from '@/types/design-tokens';
import type { PageTemplate } from '@/types/cms-template';
import {
  getTokenValue,
  resolveBlockTokens,
  resolveBlockInstance,
  extractUsedTokens,
  usesTokenReference,
} from '../token-resolver';
import {
  validateTemplateTokens,
  validateBlockTokens,
  validateTemplateContext,
  getTokenUsageReport,
  checkTemplateSafety,
} from '../token-validator';

// Mock design tokens for testing
const mockDesignTokens: DesignTokens = {
  color: {
    primary: { $type: 'color', $value: '222 47% 11%' },
    secondary: { $type: 'color', $value: '210 40% 96%' },
    background: { $type: 'color', $value: '0 0% 100%' },
    foreground: { $type: 'color', $value: '222 47% 11%' },
    muted: { $type: 'color', $value: '210 40% 96%' },
    'muted-foreground': { $type: 'color', $value: '215 16% 47%' },
    accent: { $type: 'color', $value: '210 40% 96%' },
    border: { $type: 'color', $value: '214 32% 91%' },
    card: { $type: 'color', $value: '0 0% 100%' },
  },
  spacing: {
    xs: { $type: 'dimension', $value: '4px' },
    sm: { $type: 'dimension', $value: '8px' },
    md: { $type: 'dimension', $value: '16px' },
    lg: { $type: 'dimension', $value: '32px' },
    xl: { $type: 'dimension', $value: '64px' },
    section: { $type: 'dimension', $value: '80px' },
    component: { $type: 'dimension', $value: '24px' },
  },
  typography: {
    heading1: {
      $type: 'typography',
      fontSize: { $value: '48px' },
      lineHeight: { $value: '1.2' },
      fontWeight: { $value: '700' },
    },
    body: {
      $type: 'typography',
      fontSize: { $value: '16px' },
      lineHeight: { $value: '1.5' },
      fontWeight: { $value: '400' },
    },
  },
  shadow: {
    card: {
      $type: 'shadow',
      $value: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    },
  },
};

describe('Token Resolution', () => {
  describe('getTokenValue', () => {
    it('should resolve simple token path', () => {
      const value = getTokenValue(mockDesignTokens, 'color.primary');
      expect(value).toBe('222 47% 11%');
    });

    it('should resolve nested token path', () => {
      const value = getTokenValue(mockDesignTokens, 'spacing.section');
      expect(value).toBe('80px');
    });

    it('should return undefined for non-existent token', () => {
      const value = getTokenValue(mockDesignTokens, 'color.nonexistent');
      expect(value).toBeUndefined();
    });

    it('should resolve composite token', () => {
      const value = getTokenValue(mockDesignTokens, 'typography.heading1');
      expect(value).toEqual({
        $type: 'typography',
        fontSize: '48px',
        lineHeight: '1.2',
        fontWeight: '700',
      });
    });
  });

  describe('resolveBlockTokens', () => {
    it('should resolve token aliases in block properties', () => {
      const properties = {
        backgroundColor: '{color.background}',
        textColor: '{color.foreground}',
        padding: '{spacing.md}',
        title: 'Test Title',
      };

      const resolved = resolveBlockTokens(properties, mockDesignTokens);

      expect(resolved).toEqual({
        backgroundColor: '0 0% 100%',
        textColor: '222 47% 11%',
        padding: '16px',
        title: 'Test Title',
      });
    });

    it('should handle nested objects', () => {
      const properties = {
        style: {
          color: '{color.primary}',
          margin: '{spacing.lg}',
        },
        title: 'Nested Test',
      };

      const resolved = resolveBlockTokens(properties, mockDesignTokens);

      expect(resolved.style).toEqual({
        color: '222 47% 11%',
        margin: '32px',
      });
    });

    it('should handle arrays with token references', () => {
      const properties = {
        items: [
          { color: '{color.primary}' },
          { color: '{color.secondary}' },
        ],
      };

      const resolved = resolveBlockTokens(properties, mockDesignTokens);

      expect(resolved.items).toEqual([
        { color: '222 47% 11%' },
        { color: '210 40% 96%' },
      ]);
    });

    it('should preserve non-token values', () => {
      const properties = {
        tokenValue: '{color.primary}',
        directValue: '#ff0000',
        numberValue: 42,
        booleanValue: true,
      };

      const resolved = resolveBlockTokens(properties, mockDesignTokens);

      expect(resolved).toEqual({
        tokenValue: '222 47% 11%',
        directValue: '#ff0000',
        numberValue: 42,
        booleanValue: true,
      });
    });
  });

  describe('extractUsedTokens', () => {
    it('should extract all unique token paths', () => {
      const properties = {
        backgroundColor: '{color.background}',
        textColor: '{color.foreground}',
        padding: '{spacing.md}',
        nested: {
          color: '{color.primary}',
          margin: '{spacing.lg}',
        },
      };

      const tokens = extractUsedTokens(properties);

      expect(tokens).toContain('color.background');
      expect(tokens).toContain('color.foreground');
      expect(tokens).toContain('spacing.md');
      expect(tokens).toContain('color.primary');
      expect(tokens).toContain('spacing.lg');
      expect(tokens).toHaveLength(5);
    });
  });

  describe('usesTokenReference', () => {
    it('should detect token aliases in strings', () => {
      expect(usesTokenReference('{color.primary}')).toBe(true);
      expect(usesTokenReference('#ff0000')).toBe(false);
    });

    it('should detect token aliases in objects', () => {
      expect(usesTokenReference({ color: '{color.primary}' })).toBe(true);
      expect(usesTokenReference({ color: '#ff0000' })).toBe(false);
    });

    it('should detect token aliases in arrays', () => {
      expect(usesTokenReference(['{color.primary}', '#ff0000'])).toBe(true);
      expect(usesTokenReference(['#ff0000', '#00ff00'])).toBe(false);
    });
  });
});

describe('Token Validation', () => {
  describe('validateBlockTokens', () => {
    it('should validate block with valid tokens', () => {
      const block = {
        id: 'test-block',
        type: 'hero',
        category: 'hero',
        properties: {
          backgroundColor: '{color.background}',
          textColor: '{color.foreground}',
        },
      };

      const errors = validateBlockTokens(block, mockDesignTokens);
      expect(errors).toHaveLength(0);
    });

    it('should detect missing tokens', () => {
      const block = {
        id: 'test-block',
        type: 'hero',
        category: 'hero',
        properties: {
          backgroundColor: '{color.nonexistent}',
          textColor: '{color.foreground}',
        },
      };

      const errors = validateBlockTokens(block, mockDesignTokens);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('token_not_found');
      expect(errors[0].tokenPath).toBe('color.nonexistent');
    });
  });

  describe('validateTemplateTokens', () => {
    it('should validate template with valid design system', () => {
      const template: PageTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'Test',
        category: 'landing',
        blocks: [],
        layoutOptions: { maxWidth: 'wide' },
        designSystem: {
          supportedContexts: ['public'],
          colorScheme: {
            primary: '{color.primary}',
            background: '{color.background}',
            foreground: '{color.foreground}',
            accent: '{color.accent}',
          },
          typography: {
            heading: '{typography.heading1}',
            body: '{typography.body}',
          },
          spacing: {
            section: '{spacing.section}',
            component: '{spacing.component}',
          },
        },
        preview: { thumbnail: '' },
        usageCount: 0,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublished: false,
      };

      const result = validateTemplateTokens(template, mockDesignTokens);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing design system tokens', () => {
      const template: PageTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'Test',
        category: 'landing',
        blocks: [],
        layoutOptions: { maxWidth: 'wide' },
        designSystem: {
          supportedContexts: ['public'],
          colorScheme: {
            primary: '{color.nonexistent}',
            background: '{color.background}',
            foreground: '{color.foreground}',
            accent: '{color.accent}',
          },
          typography: {
            heading: '{typography.heading1}',
            body: '{typography.body}',
          },
          spacing: {
            section: '{spacing.section}',
            component: '{spacing.component}',
          },
        },
        preview: { thumbnail: '' },
        usageCount: 0,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublished: false,
      };

      const result = validateTemplateTokens(template, mockDesignTokens);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('token_not_found');
    });
  });

  describe('getTokenUsageReport', () => {
    it('should generate comprehensive token usage report', () => {
      const template: PageTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'Test',
        category: 'landing',
        blocks: [
          {
            id: 'block-1',
            type: 'hero',
            category: 'hero',
            properties: {
              backgroundColor: '{color.background}',
              textColor: '{color.foreground}',
              padding: '{spacing.section}',
            },
          },
        ],
        layoutOptions: { maxWidth: 'wide' },
        designSystem: {
          supportedContexts: ['public'],
          colorScheme: {
            primary: '{color.primary}',
            background: '{color.background}',
            foreground: '{color.foreground}',
            accent: '{color.accent}',
          },
          typography: {
            heading: '{typography.heading1}',
            body: '{typography.body}',
          },
          spacing: {
            section: '{spacing.section}',
            component: '{spacing.component}',
          },
        },
        preview: { thumbnail: '' },
        usageCount: 0,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublished: false,
      };

      const report = getTokenUsageReport(template);

      expect(report.uniqueTokens.length).toBeGreaterThan(0);
      expect(report.tokensByCategory.color).toBeDefined();
      expect(report.tokensByCategory.spacing).toBeDefined();
      expect(report.tokensByCategory.typography).toBeDefined();
      expect(report.blocksUsingTokens).toHaveLength(1);
      expect(report.blocksUsingTokens[0].blockId).toBe('block-1');
    });
  });

  describe('checkTemplateSafety', () => {
    it('should pass safety check for valid template', () => {
      const template: PageTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'Test',
        category: 'landing',
        blocks: [],
        layoutOptions: { maxWidth: 'wide' },
        designSystem: {
          supportedContexts: ['public'],
          colorScheme: {
            primary: '{color.primary}',
            background: '{color.background}',
            foreground: '{color.foreground}',
            accent: '{color.accent}',
          },
          typography: {
            heading: '{typography.heading1}',
            body: '{typography.body}',
          },
          spacing: {
            section: '{spacing.section}',
            component: '{spacing.component}',
          },
        },
        preview: { thumbnail: '' },
        usageCount: 0,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublished: false,
      };

      const safetyCheck = checkTemplateSafety(template, mockDesignTokens);

      expect(safetyCheck.isSafe).toBe(true);
      expect(safetyCheck.missingTokens).toHaveLength(0);
    });

    it('should fail safety check for template with missing tokens', () => {
      const template: PageTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'Test',
        category: 'landing',
        blocks: [],
        layoutOptions: { maxWidth: 'wide' },
        designSystem: {
          supportedContexts: ['public'],
          colorScheme: {
            primary: '{color.missing}',
            background: '{color.background}',
            foreground: '{color.foreground}',
            accent: '{color.accent}',
          },
          typography: {
            heading: '{typography.heading1}',
            body: '{typography.body}',
          },
          spacing: {
            section: '{spacing.section}',
            component: '{spacing.component}',
          },
        },
        preview: { thumbnail: '' },
        usageCount: 0,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublished: false,
      };

      const safetyCheck = checkTemplateSafety(template, mockDesignTokens);

      expect(safetyCheck.isSafe).toBe(false);
      expect(safetyCheck.missingTokens).toContain('color.missing');
      expect(safetyCheck.recommendations.length).toBeGreaterThan(0);
    });
  });
});

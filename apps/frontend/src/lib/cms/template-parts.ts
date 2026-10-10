/**
 * Template Parts Utilities
 *
 * Utilities for managing reusable template sections (header, footer, sidebar, etc.)
 */

import type { TemplatePart, BlockInstance, PageTemplate } from '@/types/cms-template';
import type { DesignTokens } from '@/types/design-tokens';
import { resolveBlocks } from './token-resolver';
import { validateBlockTokens } from './token-validator';

/**
 * Create a new template part
 */
export function createTemplatePart(
  name: string,
  type: TemplatePart['type'],
  blocks: BlockInstance[],
  options?: {
    description?: string;
    designSystem?: TemplatePart['designSystem'];
    preview?: TemplatePart['preview'];
  }
): TemplatePart {
  return {
    id: `part-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: options?.description || `${type} template part`,
    type,
    blocks,
    designSystem: options?.designSystem,
    preview: options?.preview,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Extract template part from existing template
 */
export function extractPartFromTemplate(
  template: PageTemplate,
  blockIds: string[],
  partName: string,
  partType: TemplatePart['type']
): TemplatePart {
  // Find blocks by IDs
  const extractedBlocks: BlockInstance[] = [];

  const findBlocks = (blocks: BlockInstance[]): void => {
    blocks.forEach((block) => {
      if (blockIds.includes(block.id)) {
        extractedBlocks.push(block);
      }
      if (block.children) {
        findBlocks(block.children);
      }
    });
  };

  findBlocks(template.blocks);

  if (extractedBlocks.length === 0) {
    throw new Error(`No blocks found with IDs: ${blockIds.join(', ')}`);
  }

  return createTemplatePart(partName, partType, extractedBlocks, {
    description: `Extracted from ${template.name}`,
    designSystem: {
      colorScheme: template.designSystem.colorScheme,
      typography: template.designSystem.typography,
      spacing: template.designSystem.spacing,
    },
  });
}

/**
 * Insert template part into template
 */
export function insertPartIntoTemplate(
  template: PageTemplate,
  part: TemplatePart,
  position: 'start' | 'end' | number
): PageTemplate {
  const newBlocks = [...template.blocks];

  if (position === 'start') {
    newBlocks.unshift(...part.blocks);
  } else if (position === 'end') {
    newBlocks.push(...part.blocks);
  } else if (typeof position === 'number') {
    newBlocks.splice(position, 0, ...part.blocks);
  }

  return {
    ...template,
    blocks: newBlocks,
    updatedAt: new Date(),
  };
}

/**
 * Replace blocks in template with template part
 */
export function replaceBlocksWithPart(
  template: PageTemplate,
  blockIds: string[],
  part: TemplatePart
): PageTemplate {
  const newBlocks: BlockInstance[] = [];
  let replaced = false;

  template.blocks.forEach((block) => {
    if (blockIds.includes(block.id)) {
      if (!replaced) {
        newBlocks.push(...part.blocks);
        replaced = true;
      }
      // Skip this block (it's being replaced)
    } else {
      newBlocks.push(block);
    }
  });

  return {
    ...template,
    blocks: newBlocks,
    updatedAt: new Date(),
  };
}

/**
 * Validate template part compatibility with template
 */
export function validatePartCompatibility(
  part: TemplatePart,
  template: PageTemplate,
  tokens: DesignTokens
): { isCompatible: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if contexts match
  if (part.designSystem && template.designSystem) {
    // Color scheme compatibility
    const partColors = Object.keys(part.designSystem.colorScheme || {});
    const templateColors = Object.keys(template.designSystem.colorScheme);

    const missingColors = partColors.filter((c) => !templateColors.includes(c));
    if (missingColors.length > 0) {
      warnings.push(`Part uses colors not in template: ${missingColors.join(', ')}`);
    }
  }

  // Validate tokens in part blocks
  part.blocks.forEach((block) => {
    const blockErrors = validateBlockTokens(block, tokens);
    errors.push(...blockErrors.map((e) => e.message));
  });

  return {
    isCompatible: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Duplicate template part
 */
export function duplicateTemplatePart(
  part: TemplatePart,
  nameSuffix: string = ' (Copy)'
): TemplatePart {
  return {
    ...part,
    id: `part-${part.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: `${part.name}${nameSuffix}`,
    blocks: part.blocks.map((block) => ({
      ...block,
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    })),
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Merge multiple parts into single part
 */
export function mergeTemplateParts(
  parts: TemplatePart[],
  name: string,
  type: TemplatePart['type']
): TemplatePart {
  if (parts.length === 0) {
    throw new Error('Cannot merge empty parts array');
  }

  const allBlocks = parts.flatMap((part) => part.blocks);

  // Merge design systems
  const mergedDesignSystem = parts.reduce(
    (acc, part) => {
      if (part.designSystem) {
        return {
          colorScheme: { ...acc.colorScheme, ...part.designSystem.colorScheme },
          typography: { ...acc.typography, ...part.designSystem.typography },
          spacing: { ...acc.spacing, ...part.designSystem.spacing },
        };
      }
      return acc;
    },
    {
      colorScheme: {
        primary: '',
        background: '',
        foreground: '',
        accent: '',
      },
      typography: {
        heading: '',
        body: '',
      },
      spacing: {
        section: '',
        component: '',
      },
    }
  );

  return createTemplatePart(name, type, allBlocks, {
    description: `Merged from ${parts.length} parts`,
    designSystem: mergedDesignSystem,
  });
}

/**
 * Find parts by type
 */
export function filterPartsByType(
  parts: TemplatePart[],
  type: TemplatePart['type'] | TemplatePart['type'][]
): TemplatePart[] {
  const types = Array.isArray(type) ? type : [type];
  return parts.filter((part) => types.includes(part.type));
}

/**
 * Search parts by name or description
 */
export function searchParts(parts: TemplatePart[], query: string): TemplatePart[] {
  const lowerQuery = query.toLowerCase();
  return parts.filter(
    (part) =>
      part.name.toLowerCase().includes(lowerQuery) ||
      part.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Sort parts by usage count
 */
export function sortPartsByPopularity(parts: TemplatePart[]): TemplatePart[] {
  return [...parts].sort((a, b) => b.usageCount - a.usageCount);
}

/**
 * Sort parts by creation date
 */
export function sortPartsByDate(parts: TemplatePart[], order: 'asc' | 'desc' = 'desc'): TemplatePart[] {
  return [...parts].sort((a, b) => {
    const comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return order === 'desc' ? comparison : -comparison;
  });
}

/**
 * Get part statistics
 */
export function getPartStatistics(part: TemplatePart): {
  blockCount: number;
  tokenReferences: number;
  hasDesignSystem: boolean;
  hasPreview: boolean;
} {
  let tokenReferences = 0;

  const countTokens = (value: any): void => {
    if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
      tokenReferences++;
    } else if (Array.isArray(value)) {
      value.forEach(countTokens);
    } else if (typeof value === 'object' && value !== null) {
      Object.values(value).forEach(countTokens);
    }
  };

  part.blocks.forEach((block) => {
    countTokens(block.properties);
    if (block.children) {
      block.children.forEach((child) => countTokens(child.properties));
    }
  });

  return {
    blockCount: part.blocks.length,
    tokenReferences,
    hasDesignSystem: !!part.designSystem,
    hasPreview: !!part.preview?.thumbnail,
  };
}

/**
 * Apply design system tokens to part
 */
export function applyTokensToPart(
  part: TemplatePart,
  tokens: DesignTokens
): TemplatePart {
  const resolvedBlocks = resolveBlocks(part.blocks, tokens);

  return {
    ...part,
    blocks: resolvedBlocks,
    updatedAt: new Date(),
  };
}

/**
 * Convert template part to template
 */
export function partToTemplate(
  part: TemplatePart,
  category: PageTemplate['category'],
  additionalOptions?: Partial<Omit<PageTemplate, 'id' | 'blocks' | 'designSystem'>>
): PageTemplate {
  return {
    id: `template-from-part-${Date.now()}`,
    name: part.name,
    description: part.description,
    category,
    blocks: part.blocks,
    layoutOptions: { maxWidth: 'wide' },
    designSystem: {
      supportedContexts: ['public'],
      colorScheme: part.designSystem?.colorScheme || {
        primary: '{color.primary}',
        background: '{color.background}',
        foreground: '{color.foreground}',
        accent: '{color.accent}',
      },
      typography: part.designSystem?.typography || {
        heading: '{typography.heading1}',
        body: '{typography.body}',
      },
      spacing: part.designSystem?.spacing || {
        section: '{spacing.section}',
        component: '{spacing.component}',
      },
    },
    preview: part.preview || { thumbnail: '' },
    usageCount: 0,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublished: false,
    ...additionalOptions,
  };
}

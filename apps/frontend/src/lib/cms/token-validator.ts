/**
 * Design Token Validation Utilities for CMS Templates
 *
 * Validates token references in templates to ensure:
 * - All token references exist in the design system
 * - Token types match expected usage
 * - Template constraints are satisfied
 * - Context compatibility is maintained
 */

import type { DesignTokens, ThemeContext, ThemeMode } from '@/types/design-tokens';
import type {
  PageTemplate,
  BlockInstance,
  TemplateValidationResult,
  TemplateValidationError,
  TemplateValidationWarning,
  TemplateConstraints,
} from '@/types/cms-template';
import { extractTokenPath, isTokenAlias } from '@/types/cms-template';
import { getTokenValue, extractUsedTokens } from './token-resolver';

/**
 * Validate all token references in a template
 *
 * @param template - Page template to validate
 * @param tokens - Design tokens to validate against
 * @returns Validation result with errors and warnings
 */
export function validateTemplateTokens(
  template: PageTemplate,
  tokens: DesignTokens
): TemplateValidationResult {
  const errors: TemplateValidationError[] = [];
  const warnings: TemplateValidationWarning[] = [];

  // Validate design system color scheme
  if (template.designSystem?.colorScheme) {
    for (const [key, tokenRef] of Object.entries(template.designSystem.colorScheme)) {
      if (typeof tokenRef === 'string' && isTokenAlias(tokenRef)) {
        const path = extractTokenPath(tokenRef);
        const value = getTokenValue(tokens, path);

        if (value === undefined) {
          errors.push({
            type: 'token_not_found',
            message: `Color scheme token not found: ${tokenRef}`,
            tokenPath: path,
            severity: 'error',
          });
        } else if (!path.startsWith('color.')) {
          warnings.push({
            type: 'best_practice',
            message: `Color scheme "${key}" references non-color token: ${tokenRef}`,
            suggestion: `Use color tokens like {color.primary} instead`,
          });
        }
      }
    }
  }

  // Validate design system typography
  if (template.designSystem?.typography) {
    for (const [key, tokenRef] of Object.entries(template.designSystem.typography)) {
      if (typeof tokenRef === 'string' && isTokenAlias(tokenRef)) {
        const path = extractTokenPath(tokenRef);
        const value = getTokenValue(tokens, path);

        if (value === undefined) {
          errors.push({
            type: 'token_not_found',
            message: `Typography token not found: ${tokenRef}`,
            tokenPath: path,
            severity: 'error',
          });
        }
      }
    }
  }

  // Validate design system spacing
  if (template.designSystem?.spacing) {
    for (const [key, tokenRef] of Object.entries(template.designSystem.spacing)) {
      if (typeof tokenRef === 'string' && isTokenAlias(tokenRef)) {
        const path = extractTokenPath(tokenRef);
        const value = getTokenValue(tokens, path);

        if (value === undefined) {
          errors.push({
            type: 'token_not_found',
            message: `Spacing token not found: ${tokenRef}`,
            tokenPath: path,
            severity: 'error',
          });
        }
      }
    }
  }

  // Validate all blocks
  for (const block of template.blocks) {
    const blockErrors = validateBlockTokens(block, tokens);
    errors.push(...blockErrors);
  }

  // Check for performance concerns
  const totalTokenReferences = countTokenReferences(template);
  if (totalTokenReferences > 100) {
    warnings.push({
      type: 'performance',
      message: `Template uses ${totalTokenReferences} token references, which may impact render performance`,
      suggestion: 'Consider consolidating repeated token references or using direct values for non-theme-dependent properties',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate token references in a single block
 *
 * @param block - Block instance to validate
 * @param tokens - Design tokens to validate against
 * @returns Array of validation errors
 */
export function validateBlockTokens(
  block: BlockInstance,
  tokens: DesignTokens
): TemplateValidationError[] {
  const errors: TemplateValidationError[] = [];

  // Extract all token paths used in this block
  const usedTokens = extractUsedTokens(block.properties);

  // Validate each token exists
  for (const tokenPath of usedTokens) {
    const value = getTokenValue(tokens, tokenPath);

    if (value === undefined) {
      errors.push({
        type: 'token_not_found',
        message: `Token not found in block "${block.type}": {${tokenPath}}`,
        blockId: block.id,
        tokenPath: tokenPath,
        severity: 'error',
      });
    }
  }

  // Recursively validate child blocks
  if (block.children) {
    for (const child of block.children) {
      const childErrors = validateBlockTokens(child, tokens);
      errors.push(...childErrors);
    }
  }

  return errors;
}

/**
 * Validate template constraints
 *
 * @param template - Page template to validate
 * @returns Validation result
 */
export function validateTemplateConstraints(
  template: PageTemplate
): TemplateValidationResult {
  const errors: TemplateValidationError[] = [];
  const warnings: TemplateValidationWarning[] = [];
  const constraints = template.constraints;

  if (!constraints) {
    return { isValid: true, errors: [], warnings: [] };
  }

  // Validate required blocks
  if (constraints.requiredBlocks && constraints.requiredBlocks.length > 0) {
    const blockTypes = new Set(template.blocks.map(b => b.type));

    for (const requiredType of constraints.requiredBlocks) {
      if (!blockTypes.has(requiredType)) {
        errors.push({
          type: 'missing_required_block',
          message: `Template is missing required block type: ${requiredType}`,
          severity: 'error',
        });
      }
    }
  }

  // Validate max blocks
  if (constraints.maxBlocks && template.blocks.length > constraints.maxBlocks) {
    errors.push({
      type: 'constraint_violation',
      message: `Template exceeds maximum block count: ${template.blocks.length} > ${constraints.maxBlocks}`,
      severity: 'error',
    });
  }

  // Validate min blocks
  if (constraints.minBlocks && template.blocks.length < constraints.minBlocks) {
    errors.push({
      type: 'constraint_violation',
      message: `Template has fewer blocks than minimum: ${template.blocks.length} < ${constraints.minBlocks}`,
      severity: 'error',
    });
  }

  // Validate allowed categories
  if (constraints.allowedCategories && constraints.allowedCategories.length > 0) {
    const allowedSet = new Set(constraints.allowedCategories);

    for (const block of template.blocks) {
      if (!allowedSet.has(block.category)) {
        errors.push({
          type: 'constraint_violation',
          message: `Block category "${block.category}" is not allowed in this template`,
          blockId: block.id,
          severity: 'error',
        });
      }
    }
  }

  // Validate forbidden blocks
  if (constraints.forbiddenBlocks && constraints.forbiddenBlocks.length > 0) {
    const forbiddenSet = new Set(constraints.forbiddenBlocks);

    for (const block of template.blocks) {
      if (forbiddenSet.has(block.type)) {
        errors.push({
          type: 'constraint_violation',
          message: `Forbidden block type found in template: ${block.type}`,
          blockId: block.id,
          severity: 'error',
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate template compatibility with a specific context
 *
 * @param template - Page template
 * @param context - Theme context to check
 * @param mode - Theme mode to check
 * @param tokens - Design tokens for the context/mode
 * @returns Validation result
 */
export function validateTemplateContext(
  template: PageTemplate,
  context: ThemeContext,
  mode: ThemeMode,
  tokens: DesignTokens
): TemplateValidationResult {
  const errors: TemplateValidationError[] = [];
  const warnings: TemplateValidationWarning[] = [];

  // Check if context is supported
  if (!template.designSystem.supportedContexts.includes(context)) {
    errors.push({
      type: 'constraint_violation',
      message: `Template does not support context "${context}". Supported contexts: ${template.designSystem.supportedContexts.join(', ')}`,
      severity: 'error',
    });
  }

  // Check if mode matches preferred mode
  if (template.designSystem.preferredMode && template.designSystem.preferredMode !== mode) {
    warnings.push({
      type: 'best_practice',
      message: `Template is optimized for "${template.designSystem.preferredMode}" mode but being applied in "${mode}" mode`,
      suggestion: `Consider using ${template.designSystem.preferredMode} mode for optimal appearance`,
    });
  }

  // Validate all tokens exist in the provided context tokens
  const tokenValidation = validateTemplateTokens(template, tokens);
  errors.push(...tokenValidation.errors);
  warnings.push(...tokenValidation.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Count total token references in template
 *
 * @param template - Page template
 * @returns Number of token references
 */
function countTokenReferences(template: PageTemplate): number {
  let count = 0;

  // Count design system tokens
  if (template.designSystem?.colorScheme) {
    count += Object.values(template.designSystem.colorScheme).filter(isTokenAlias).length;
  }
  if (template.designSystem?.typography) {
    count += Object.values(template.designSystem.typography).filter(isTokenAlias).length;
  }
  if (template.designSystem?.spacing) {
    count += Object.values(template.designSystem.spacing).filter(isTokenAlias).length;
  }

  // Count block tokens
  for (const block of template.blocks) {
    count += countBlockTokenReferences(block);
  }

  return count;
}

/**
 * Count token references in a block
 */
function countBlockTokenReferences(block: BlockInstance): number {
  let count = extractUsedTokens(block.properties).length;

  if (block.children) {
    for (const child of block.children) {
      count += countBlockTokenReferences(child);
    }
  }

  return count;
}

/**
 * Get detailed token usage report for a template
 *
 * @param template - Page template
 * @returns Token usage report
 */
export interface TokenUsageReport {
  totalReferences: number;
  uniqueTokens: string[];
  tokensByCategory: Record<string, string[]>;
  blocksUsingTokens: Array<{
    blockId: string;
    blockType: string;
    tokenCount: number;
    tokens: string[];
  }>;
}

export function getTokenUsageReport(template: PageTemplate): TokenUsageReport {
  const allTokens = new Set<string>();
  const tokensByCategory: Record<string, Set<string>> = {};
  const blocksUsingTokens: Array<{
    blockId: string;
    blockType: string;
    tokenCount: number;
    tokens: string[];
  }> = [];

  // Collect from design system
  const collectTokensFromValue = (value: any) => {
    if (typeof value === 'string' && isTokenAlias(value)) {
      const path = extractTokenPath(value);
      allTokens.add(path);

      const category = path.split('.')[0];
      if (!tokensByCategory[category]) {
        tokensByCategory[category] = new Set();
      }
      tokensByCategory[category].add(path);
    }
  };

  if (template.designSystem?.colorScheme) {
    Object.values(template.designSystem.colorScheme).forEach(collectTokensFromValue);
  }
  if (template.designSystem?.typography) {
    Object.values(template.designSystem.typography).forEach(collectTokensFromValue);
  }
  if (template.designSystem?.spacing) {
    Object.values(template.designSystem.spacing).forEach(collectTokensFromValue);
  }

  // Collect from blocks
  for (const block of template.blocks) {
    const blockTokens = extractUsedTokens(block.properties);

    if (blockTokens.length > 0) {
      blocksUsingTokens.push({
        blockId: block.id,
        blockType: block.type,
        tokenCount: blockTokens.length,
        tokens: blockTokens,
      });

      blockTokens.forEach(token => {
        allTokens.add(token);
        const category = token.split('.')[0];
        if (!tokensByCategory[category]) {
          tokensByCategory[category] = new Set();
        }
        tokensByCategory[category].add(token);
      });
    }
  }

  return {
    totalReferences: countTokenReferences(template),
    uniqueTokens: Array.from(allTokens),
    tokensByCategory: Object.fromEntries(
      Object.entries(tokensByCategory).map(([k, v]) => [k, Array.from(v)])
    ),
    blocksUsingTokens,
  };
}

/**
 * Check if template can be safely applied without token conflicts
 *
 * @param template - Page template
 * @param tokens - Target design tokens
 * @returns Safety check result
 */
export interface TemplateSafetyCheck {
  isSafe: boolean;
  missingTokens: string[];
  recommendations: string[];
}

export function checkTemplateSafety(
  template: PageTemplate,
  tokens: DesignTokens
): TemplateSafetyCheck {
  const validation = validateTemplateTokens(template, tokens);
  const missingTokens = validation.errors
    .filter(e => e.type === 'token_not_found' && e.tokenPath)
    .map(e => e.tokenPath!);

  const recommendations: string[] = [];

  if (missingTokens.length > 0) {
    recommendations.push(
      `Add missing tokens to your design system: ${missingTokens.join(', ')}`
    );
  }

  if (validation.warnings.some(w => w.type === 'performance')) {
    recommendations.push('Consider optimizing token usage for better performance');
  }

  if (validation.warnings.some(w => w.type === 'best_practice')) {
    recommendations.push('Review best practice warnings for optimal template design');
  }

  return {
    isSafe: validation.isValid,
    missingTokens,
    recommendations,
  };
}

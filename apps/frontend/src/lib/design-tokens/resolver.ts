/**
 * Design Tokens Resolver & Transformer Utilities
 * Handles alias resolution, format conversion, and token transformations
 */

import type {
  DesignTokens,
  DesignToken,
  TokenGroup,
  TokenAlias,
  TokenType,
  ResolverOptions,
  ResolvedToken,
  CSSExportOptions,
  SCSSExportOptions,
  TokenExportFormat,
} from '@/types/design-tokens';

// ============================================================================
// TOKEN RESOLUTION (Alias Resolution)
// ============================================================================

/**
 * Check if a value is a token alias
 */
export function isAlias(value: unknown): value is TokenAlias {
  return typeof value === 'string' && value.startsWith('{') && value.endsWith('}');
}

/**
 * Extract path from alias
 * {color.primary} -> color.primary
 */
export function getAliasPath(alias: TokenAlias): string {
  return alias.slice(1, -1);
}

/**
 * Get nested token value by path
 * getTokenByPath(tokens, 'color.primary.500')
 */
export function getTokenByPath(tokens: DesignTokens, path: string): DesignToken | undefined {
  const parts = path.split('.');
  let current: any = tokens;

  for (const part of parts) {
    if (!current || typeof current !== 'object') return undefined;
    current = current[part];
  }

  return current as DesignToken | undefined;
}

/**
 * Resolve token aliases recursively
 */
export function resolveToken(
  value: any,
  tokens: DesignTokens,
  visited: Set<string> = new Set()
): any {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Handle alias
  if (isAlias(value)) {
    const path = getAliasPath(value);

    // Circular reference detection
    if (visited.has(path)) {
      console.warn(`Circular token reference detected: ${path}, returning original value`);
      return value; // Return the alias itself instead of throwing
    }
    visited.add(path);

    const token = getTokenByPath(tokens, path);
    if (!token) {
      console.warn(`Token not found: ${path}, returning original value`);
      return value; // Return the alias itself instead of throwing
    }

    return resolveToken(token.$value, tokens, visited);
  }

  // Handle object values (composite tokens)
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const resolved: any = {};
    for (const [key, val] of Object.entries(value)) {
      resolved[key] = resolveToken(val, tokens, new Set(visited));
    }
    return resolved;
  }

  // Handle array values
  if (Array.isArray(value)) {
    return value.map((item) => resolveToken(item, tokens, new Set(visited)));
  }

  // Primitive value
  return value;
}

/**
 * Resolve all tokens in a token collection
 */
export function resolveAllTokens(tokens: DesignTokens): DesignTokens {
  const resolved: DesignTokens = {};

  function traverse(obj: any, path: string[] = []): any {
    // Null/undefined check
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (obj.$type && obj.$value !== undefined) {
      // It's a token
      return {
        ...obj,
        $value: resolveToken(obj.$value, tokens),
      };
    }

    // It's a group
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) {
        result[key] = value; // Preserve metadata
      } else if (value !== undefined && value !== null) {
        result[key] = traverse(value, [...path, key]);
      }
    }
    return result;
  }

  return traverse(tokens);
}

// ============================================================================
// CSS TRANSFORMATION
// ============================================================================

/**
 * Convert token path to CSS variable name
 * color.primary -> --color-primary
 * spacing.base -> --spacing-base
 */
export function toCSSVariableName(path: string, prefix?: string): string {
  // Remove "color." prefix to match globals.css naming
  // e.g., "color.background" -> "--background"
  // e.g., "color.primary.background" -> "--primary" (NOT --primary-background)
  // e.g., "color.card.foreground" -> "--card-foreground"
  let name = path;
  
  if (name.startsWith('color.')) {
    name = name.replace('color.', '');
  }
  
  // For nested tokens ending with .background, remove it
  // "primary.background" -> "primary"
  // "card.background" -> "card"
  // But keep "card.foreground" -> "card-foreground"
  if (name.endsWith('.background')) {
    name = name.replace('.background', '');
  }
  
  name = name.replace(/\./g, '-');
  return prefix ? `--${prefix}-${name}` : `--${name}`;
}

/**
 * Convert token value to CSS value
 */
export function toCSSValue(token: DesignToken, tokens: DesignTokens): string {
  try {
    const value = resolveToken(token.$value, tokens);

    // If resolution failed, return empty string
    if (value === undefined || value === null) {
      return '';
    }

    switch (token.$type) {
      case 'color':
        // Check if value is already in HSL format without hsl() wrapper
        const colorStr = String(value);
        if (colorStr.includes('hsl(') || colorStr.includes('rgb(') || colorStr.startsWith('#')) {
          return colorStr;
        }
        // If it's bare HSL values like "220 13% 9%", return as-is for CSS variable compatibility
        // Tailwind and other systems expect bare HSL values in custom properties
        return colorStr;

      case 'dimension':
        return String(value);

      case 'fontFamily':
        return Array.isArray(value) ? value.join(', ') : String(value);

      case 'fontWeight':
        return String(value);

      case 'duration':
        return String(value);

      case 'number':
        return String(value);

      case 'cubicBezier':
        return Array.isArray(value) ? `cubic-bezier(${value.join(', ')})` : String(value);

      case 'typography': {
        if (typeof value !== 'object') return String(value);
        const { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing } = value;
        return `${fontWeight} ${fontSize}/${lineHeight} ${fontFamily}${
          letterSpacing ? ` ${letterSpacing}` : ''
        }`;
      }

      case 'shadow': {
        if (typeof value !== 'object') return String(value);
        if (Array.isArray(value)) {
          return value
            .map(
              (s) =>
                `${s.offsetX} ${s.offsetY} ${s.blur}${s.spread ? ` ${s.spread}` : ''} ${s.color}`
            )
            .join(', ');
        }
        return `${value.offsetX} ${value.offsetY} ${value.blur}${
          value.spread ? ` ${value.spread}` : ''
        } ${value.color}`;
      }

      case 'border':
        if (typeof value !== 'object') return String(value);
        return `${value.width} ${value.style} ${value.color}`;

      case 'transition':
        if (typeof value !== 'object') return String(value);
        return `all ${value.duration}${value.delay ? ` ${value.delay}` : ''} ${
          Array.isArray(value.timingFunction)
            ? `cubic-bezier(${value.timingFunction.join(', ')})`
            : value.timingFunction
        }`;

      default:
        return String(value);
    }
  } catch (error) {
    console.warn('Error converting token to CSS:', error);
    return '';
  }
}

/**
 * Export tokens to CSS custom properties
 */
export function exportToCSS(tokens: DesignTokens, options: CSSExportOptions = {}): string {
  const { prefix, selector = ':root' } = options;
  const resolved = resolveAllTokens(tokens);
  const cssVars: string[] = [];

  function traverse(obj: any, path: string[] = []): void {
    try {
      if (!obj || typeof obj !== 'object') return;

      if (obj.$type && obj.$value !== undefined) {
        const varName = toCSSVariableName(path.join('.'), prefix);
        const value = toCSSValue(obj, tokens);
        
        // Only add if value is not empty
        if (value) {
          cssVars.push(`  ${varName}: ${value};`);
        }
      } else {
        for (const [key, value] of Object.entries(obj)) {
          if (!key.startsWith('$') && typeof value === 'object' && value !== null) {
            traverse(value, [...path, key]);
          }
        }
      }
    } catch (error) {
      console.warn(`Error processing token at ${path.join('.')}:`, error);
    }
  }

  traverse(resolved);

  return `${selector} {\n${cssVars.join('\n')}\n}`;
}

// ============================================================================
// SCSS TRANSFORMATION
// ============================================================================

/**
 * Convert to SCSS variable name
 */
export function toSCSSVariableName(path: string, prefix?: string): string {
  const name = path.replace(/\./g, '-');
  return prefix ? `$${prefix}-${name}` : `$${name}`;
}

/**
 * Export tokens to SCSS variables
 */
export function exportToSCSS(tokens: DesignTokens, options: SCSSExportOptions = {}): string {
  const { prefix, useVariables = true } = options;
  const resolved = resolveAllTokens(tokens);
  const scssVars: string[] = [];

  function traverse(obj: any, path: string[] = []): void {
    if (obj.$type && obj.$value !== undefined) {
      const value = toCSSValue(obj, tokens);

      if (useVariables) {
        const varName = toSCSSVariableName(path.join('.'), prefix);
        scssVars.push(`${varName}: ${value};`);
      } else {
        const varName = toCSSVariableName(path.join('.'), prefix);
        scssVars.push(`${varName}: ${value};`);
      }
    } else {
      for (const [key, value] of Object.entries(obj)) {
        if (!key.startsWith('$') && typeof value === 'object') {
          traverse(value, [...path, key]);
        }
      }
    }
  }

  traverse(resolved);

  if (useVariables) {
    return scssVars.join('\n');
  } else {
    return `:root {\n  ${scssVars.join('\n  ')}\n}`;
  }
}

// ============================================================================
// JSON TRANSFORMATION
// ============================================================================

/**
 * Export tokens to W3C JSON format
 */
export function exportToJSON(
  tokens: DesignTokens,
  metadata: TokenExportFormat['metadata']
): TokenExportFormat {
  return {
    version: '1.0.0',
    format: 'w3c-design-tokens',
    tokens,
    metadata: {
      ...metadata,
      exportedAt: new Date().toISOString(),
    },
  };
}

/**
 * Import tokens from W3C JSON format
 */
export function importFromJSON(json: TokenExportFormat): DesignTokens {
  if (json.format !== 'w3c-design-tokens') {
    throw new Error('Invalid token format');
  }
  return json.tokens;
}

// ============================================================================
// TOKEN VALIDATION
// ============================================================================

/**
 * Validate token structure
 */
export function validateToken(token: any): token is DesignToken {
  if (typeof token !== 'object' || token === null) return false;
  if (!token.$type || !token.$value) return false;

  const validTypes: TokenType[] = [
    'color',
    'dimension',
    'fontFamily',
    'fontWeight',
    'duration',
    'cubicBezier',
    'number',
    'strokeStyle',
    'border',
    'transition',
    'shadow',
    'gradient',
    'typography',
  ];

  return validTypes.includes(token.$type);
}

/**
 * Validate entire token collection
 */
export function validateTokens(tokens: DesignTokens): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  function traverse(obj: any, path: string[] = []): void {
    if (obj.$type !== undefined) {
      if (!validateToken(obj)) {
        errors.push(`Invalid token at ${path.join('.')}`);
      }
    } else {
      for (const [key, value] of Object.entries(obj)) {
        if (!key.startsWith('$') && typeof value === 'object') {
          traverse(value, [...path, key]);
        }
      }
    }
  }

  traverse(tokens);

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// TOKEN FLATTENING (for database storage)
// ============================================================================

/**
 * Flatten tokens to path-value pairs
 */
export function flattenTokens(
  tokens: DesignTokens
): Array<{ path: string; token: DesignToken }> {
  const flattened: Array<{ path: string; token: DesignToken }> = [];

  function traverse(obj: any, path: string[] = []): void {
    if (obj.$type && obj.$value !== undefined) {
      flattened.push({
        path: path.join('.'),
        token: obj as DesignToken,
      });
    } else {
      for (const [key, value] of Object.entries(obj)) {
        if (!key.startsWith('$') && typeof value === 'object') {
          traverse(value, [...path, key]);
        }
      }
    }
  }

  traverse(tokens);
  return flattened;
}

/**
 * Unflatten tokens from path-value pairs
 */
export function unflattenTokens(
  flattened: Array<{ path: string; token: DesignToken }>
): DesignTokens {
  const tokens: DesignTokens = {};

  for (const { path, token } of flattened) {
    const parts = path.split('.');
    let current: any = tokens;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    const lastPart = parts[parts.length - 1];
    current[lastPart] = token;
  }

  return tokens;
}

// ============================================================================
// THEME UTILITIES
// ============================================================================

/**
 * Merge multiple token collections (for theme composition)
 */
export function mergeTokens(...tokenSets: DesignTokens[]): DesignTokens {
  const merged: DesignTokens = {};

  for (const tokens of tokenSets) {
    for (const [key, value] of Object.entries(tokens)) {
      if (typeof value === 'object' && !value.$type) {
        // It's a group - deep merge
        merged[key] = {
          ...(merged[key] as TokenGroup),
          ...(value as TokenGroup),
        };
      } else {
        // It's a token - override
        merged[key] = value;
      }
    }
  }

  return merged;
}

/**
 * Filter tokens by type
 */
export function filterTokensByType(tokens: DesignTokens, type: TokenType): DesignTokens {
  const filtered: DesignTokens = {};

  function traverse(obj: any, parentKey?: string): any {
    if (obj.$type && obj.$value !== undefined) {
      return obj.$type === type ? obj : null;
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!key.startsWith('$') && typeof value === 'object') {
        const filtered = traverse(value, key);
        if (filtered && Object.keys(filtered).length > 0) {
          result[key] = filtered;
        }
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  const result = traverse(tokens);
  return result || {};
}

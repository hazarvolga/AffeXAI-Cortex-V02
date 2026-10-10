/**
 * W3C Design Tokens Community Group Specification Implementation
 * @see https://www.w3.org/community/design-tokens/
 * @see https://tr.designtokens.org/format/
 */

// ============================================================================
// BASE TOKEN TYPES (W3C Spec Compliant)
// ============================================================================

/**
 * Base token type according to W3C DTCG specification
 */
export type TokenType =
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontWeight'
  | 'duration'
  | 'cubicBezier'
  | 'number'
  | 'strokeStyle'
  | 'border'
  | 'transition'
  | 'shadow'
  | 'gradient'
  | 'typography';

/**
 * Color token value (supports hex, rgb, hsl)
 */
export interface ColorToken {
  $type: 'color';
  $value: string;
  $description?: string;
}

/**
 * Dimension token (size, spacing, etc.)
 */
export interface DimensionToken {
  $type: 'dimension';
  $value: string; // e.g., "16px", "1rem", "0.5em"
  $description?: string;
}

/**
 * Font family token
 */
export interface FontFamilyToken {
  $type: 'fontFamily';
  $value: string | string[]; // e.g., "Inter" or ["Inter", "system-ui", "sans-serif"]
  $description?: string;
}

/**
 * Font weight token
 */
export interface FontWeightToken {
  $type: 'fontWeight';
  $value: number | string; // 100-900 or "normal", "bold"
  $description?: string;
}

/**
 * Duration token (for animations)
 */
export interface DurationToken {
  $type: 'duration';
  $value: string; // e.g., "200ms", "0.3s"
  $description?: string;
}

/**
 * Cubic bezier token (easing functions)
 */
export interface CubicBezierToken {
  $type: 'cubicBezier';
  $value: [number, number, number, number]; // e.g., [0.4, 0.0, 0.2, 1]
  $description?: string;
}

/**
 * Number token (opacity, scale, etc.)
 */
export interface NumberToken {
  $type: 'number';
  $value: number;
  $description?: string;
}

// ============================================================================
// COMPOSITE TOKEN TYPES
// ============================================================================

/**
 * Typography composite token
 */
export interface TypographyToken {
  $type: 'typography';
  $value: {
    fontFamily: string;
    fontSize: string;
    fontWeight: number | string;
    lineHeight: string;
    letterSpacing?: string;
  };
  $description?: string;
}

/**
 * Shadow token
 */
export interface ShadowToken {
  $type: 'shadow';
  $value: {
    color: string;
    offsetX: string;
    offsetY: string;
    blur: string;
    spread?: string;
  } | Array<{
    color: string;
    offsetX: string;
    offsetY: string;
    blur: string;
    spread?: string;
  }>;
  $description?: string;
}

/**
 * Border token
 */
export interface BorderToken {
  $type: 'border';
  $value: {
    color: string;
    width: string;
    style: 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset';
  };
  $description?: string;
}

/**
 * Transition token
 */
export interface TransitionToken {
  $type: 'transition';
  $value: {
    duration: string;
    delay?: string;
    timingFunction: string | [number, number, number, number];
  };
  $description?: string;
}

// ============================================================================
// ALIAS / REFERENCE SYSTEM
// ============================================================================

/**
 * Token alias (references another token)
 * Format: {tokenPath} where tokenPath is dot-separated
 * Example: "{color.primary}" or "{spacing.base}"
 */
export type TokenAlias = string;

export function isTokenAlias(value: unknown): value is TokenAlias {
  return typeof value === 'string' && value.startsWith('{') && value.endsWith('}');
}

export function resolveTokenPath(alias: TokenAlias): string {
  return alias.slice(1, -1); // Remove { and }
}

// ============================================================================
// TOKEN GROUP STRUCTURE
// ============================================================================

/**
 * Token with metadata
 */
export interface DesignToken {
  $type: TokenType;
  $value: any;
  $description?: string;
  $extensions?: Record<string, any>; // Allow custom metadata
}

/**
 * Token group (can contain nested groups and tokens)
 */
export interface TokenGroup {
  $description?: string;
  [key: string]: DesignToken | TokenGroup | string | undefined;
}

/**
 * Root token collection (W3C format)
 */
export interface DesignTokens {
  [groupName: string]: TokenGroup | DesignToken;
}

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Theme context (which area of the app)
 */
export type ThemeContext = 'public' | 'admin' | 'portal';

/**
 * Theme configuration
 */
export interface ThemeConfig {
  id: string;
  name: string;
  context: ThemeContext;
  mode: ThemeMode;
  tokens: DesignTokens;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

/**
 * Database model for design tokens
 */
export interface DesignTokenModel {
  id: string;
  path: string; // e.g., "color.primary" or "spacing.base"
  type: TokenType;
  value: any; // JSON value
  description?: string;
  context: ThemeContext;
  mode: ThemeMode;
  isAlias: boolean;
  aliasTo?: string; // If alias, path to referenced token
  extensions?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract token value type based on token type
 */
export type TokenValue<T extends TokenType> = 
  T extends 'color' ? string :
  T extends 'dimension' ? string :
  T extends 'fontFamily' ? string | string[] :
  T extends 'fontWeight' ? number | string :
  T extends 'duration' ? string :
  T extends 'cubicBezier' ? [number, number, number, number] :
  T extends 'number' ? number :
  T extends 'typography' ? TypographyToken['$value'] :
  T extends 'shadow' ? ShadowToken['$value'] :
  T extends 'border' ? BorderToken['$value'] :
  T extends 'transition' ? TransitionToken['$value'] :
  any;

/**
 * Token resolver options
 */
export interface ResolverOptions {
  tokens: DesignTokens;
  context?: ThemeContext;
  mode?: ThemeMode;
}

/**
 * Resolved token (with all aliases resolved)
 */
export interface ResolvedToken<T extends TokenType = TokenType> {
  type: T;
  value: TokenValue<T>;
  path: string;
  description?: string;
}

// ============================================================================
// SEMANTIC TOKEN NAMING CONVENTIONS
// ============================================================================

/**
 * Semantic color roles
 */
export type ColorRole =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'background'
  | 'foreground'
  | 'muted'
  | 'border'
  | 'input'
  | 'ring'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

/**
 * Semantic spacing scale
 */
export type SpacingScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

/**
 * Semantic font size scale
 */
export type FontSizeScale = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

/**
 * Component-specific token paths
 */
export interface ComponentTokenPaths {
  button: {
    background: string;
    foreground: string;
    border: string;
    hover: {
      background: string;
      foreground: string;
    };
  };
  card: {
    background: string;
    foreground: string;
    border: string;
    shadow: string;
  };
  input: {
    background: string;
    foreground: string;
    border: string;
    placeholder: string;
    ring: string;
  };
}

// ============================================================================
// EXPORT/IMPORT FORMATS
// ============================================================================

/**
 * Token export format
 */
export interface TokenExportFormat {
  version: '1.0.0';
  format: 'w3c-design-tokens';
  tokens: DesignTokens;
  metadata: {
    name: string;
    description?: string;
    author?: string;
    exportedAt: string;
  };
}

/**
 * CSS variables export options
 */
export interface CSSExportOptions {
  prefix?: string; // e.g., "--app" -> "--app-color-primary"
  theme?: ThemeContext;
  mode?: ThemeMode;
  selector?: string; // e.g., ":root", ".theme-admin"
}

/**
 * SCSS export options
 */
export interface SCSSExportOptions {
  prefix?: string;
  theme?: ThemeContext;
  mode?: ThemeMode;
  useVariables?: boolean; // Use $var vs CSS custom properties
}

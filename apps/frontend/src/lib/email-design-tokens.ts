/**
 * Email Design Tokens Service
 * Provides dynamic design token integration for email templates
 * Syncs with the main Design System for consistent branding
 */

import type { DesignTokens } from '@/types/design-tokens';
import { publicLightTokensProduction } from '@/lib/design-tokens/production-tokens';

// Cache for design tokens
let cachedTokens: DesignTokens | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Email-safe color conversion utilities
 */
export function hslToHex(hsl: string): string {
  // Handle various HSL formats
  if (!hsl || hsl.trim() === '') {
    return '#000000'; // Default to black for empty values
  }

  // Parse HSL string "39 100% 54%" or "hsl(39, 100%, 54%)" format
  let parts: string[];

  if (hsl.includes('hsl')) {
    // Format: hsl(39, 100%, 54%) or hsla(39, 100%, 54%, 1)
    const match = hsl.match(/hsl[a]?\(([^)]+)\)/);
    if (!match) return '#000000';
    parts = match[1].split(',').map(p => p.trim());
  } else {
    // Format: "39 100% 54%"
    parts = hsl.trim().split(/\s+/);
  }

  // Ensure we have at least 3 parts
  if (parts.length < 3) {
    console.warn(`Invalid HSL format: ${hsl}`);
    return '#000000';
  }

  const h = parseFloat(parts[0]) / 360;
  const s = parts[1] ? parseFloat(parts[1].replace('%', '')) / 100 : 0;
  const l = parts[2] ? parseFloat(parts[2].replace('%', '')) / 100 : 0;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Fetch design tokens from API or database
 * Falls back to production defaults if API is unavailable
 */
export async function fetchDesignTokens(
  context: 'public' | 'admin' | 'portal' = 'public',
  mode: 'light' | 'dark' = 'light'
): Promise<DesignTokens> {
  // Check cache first
  const now = Date.now();
  if (cachedTokens && now - cacheTimestamp < CACHE_DURATION) {
    return cachedTokens;
  }

  try {
    // Try to fetch from API
    const response = await fetch(`/api/design-tokens?context=${context}&mode=${mode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      cachedTokens = data.data as DesignTokens;
      cacheTimestamp = now;
      return cachedTokens;
    }
  } catch (error) {
    console.warn('Failed to fetch design tokens, using defaults:', error);
  }

  // Fallback to production tokens
  cachedTokens = publicLightTokensProduction;
  cacheTimestamp = now;
  return cachedTokens;
}

/**
 * Email-specific color palette interface
 */
export interface EmailColorPalette {
  // Primary colors
  primary: string;
  primaryForeground: string;

  // Secondary colors
  secondary: string;
  secondaryForeground: string;

  // Background and foreground
  background: string;
  foreground: string;

  // Muted colors
  muted: string;
  mutedForeground: string;

  // Accent colors
  accent: string;
  accentForeground: string;

  // Semantic colors
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  error: string;
  errorForeground: string;
  info: string;
  infoForeground: string;

  // Border and input
  border: string;
  input: string;
  ring: string;

  // Card colors
  cardBackground: string;
  cardForeground: string;
}

/**
 * Convert design tokens to email-safe hex colors
 */
export async function getEmailColorPalette(
  context: 'public' | 'admin' | 'portal' = 'public',
  mode: 'light' | 'dark' = 'light'
): Promise<EmailColorPalette> {
  const tokens = await fetchDesignTokens(context, mode);
  const colors = tokens.color;

  if (!colors) {
    // Return default palette if no colors are defined
    return getDefaultEmailPalette();
  }

  return {
    // Primary colors
    primary: hslToHex((colors as any).primary?.background?.$value || '39 100% 54%'),
    primaryForeground: hslToHex((colors as any).primary?.foreground?.$value || '220 13% 9%'),

    // Secondary colors
    secondary: hslToHex((colors as any).secondary?.background?.$value || '210 20% 94%'),
    secondaryForeground: hslToHex((colors as any).secondary?.foreground?.$value || '220 13% 9%'),

    // Background and foreground
    background: hslToHex((colors as any).background?.$value || '0 0% 98%'),
    foreground: hslToHex((colors as any).foreground?.$value || '220 13% 9%'),

    // Muted colors
    muted: hslToHex((colors as any).muted?.background?.$value || '0 0% 94%'),
    mutedForeground: hslToHex((colors as any).muted?.foreground?.$value || '220 9% 46%'),

    // Accent colors
    accent: hslToHex((colors as any).accent?.background?.$value || '39 100% 54%'),
    accentForeground: hslToHex((colors as any).accent?.foreground?.$value || '220 13% 9%'),

    // Semantic colors
    success: hslToHex((colors as any).success?.background?.$value || '142 76% 36%'),
    successForeground: hslToHex((colors as any).success?.foreground?.$value || '0 0% 100%'),
    warning: hslToHex((colors as any).warning?.background?.$value || '38 92% 50%'),
    warningForeground: hslToHex((colors as any).warning?.foreground?.$value || '26 83% 14%'),
    error: hslToHex((colors as any).destructive?.background?.$value || '0 84% 60%'),
    errorForeground: hslToHex((colors as any).destructive?.foreground?.$value || '0 0% 98%'),
    info: hslToHex((colors as any).info?.background?.$value || '199 89% 48%'),
    infoForeground: hslToHex((colors as any).info?.foreground?.$value || '0 0% 100%'),

    // Border and input
    border: hslToHex((colors as any).border?.$value || '210 20% 87%'),
    input: hslToHex((colors as any).input?.$value || '210 20% 87%'),
    ring: hslToHex((colors as any).ring?.$value || '39 100% 54%'),

    // Card colors
    cardBackground: hslToHex((colors as any).card?.background?.$value || '0 0% 100%'),
    cardForeground: hslToHex((colors as any).card?.foreground?.$value || '220 13% 9%'),
  };
}

/**
 * Get default email color palette (fallback)
 */
function getDefaultEmailPalette(): EmailColorPalette {
  return {
    // Orange theme colors
    primary: '#ff9500',
    primaryForeground: '#171717',

    secondary: '#e8edf2',
    secondaryForeground: '#171717',

    background: '#fafafa',
    foreground: '#171717',

    muted: '#f0f0f0',
    mutedForeground: '#6b7280',

    accent: '#ff9500',
    accentForeground: '#171717',

    success: '#22c55e',
    successForeground: '#ffffff',
    warning: '#f59e0b',
    warningForeground: '#451a03',
    error: '#ef4444',
    errorForeground: '#fafafa',
    info: '#0ea5e9',
    infoForeground: '#ffffff',

    border: '#d6dee6',
    input: '#d6dee6',
    ring: '#ff9500',

    cardBackground: '#ffffff',
    cardForeground: '#171717',
  };
}

/**
 * Typography tokens for emails
 */
export interface EmailTypography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

/**
 * Get typography settings for emails
 */
export async function getEmailTypography(): Promise<EmailTypography> {
  const tokens = await fetchDesignTokens('public', 'light');

  return {
    fontFamily: (tokens.fontFamily as any)?.sans?.$value ||
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

    fontSize: {
      xs: (tokens.fontSize as any)?.xs?.$value || '12px',
      sm: (tokens.fontSize as any)?.sm?.$value || '14px',
      base: (tokens.fontSize as any)?.base?.$value || '16px',
      lg: (tokens.fontSize as any)?.lg?.$value || '18px',
      xl: (tokens.fontSize as any)?.xl?.$value || '20px',
      '2xl': (tokens.fontSize as any)?.['2xl']?.$value || '24px',
      '3xl': (tokens.fontSize as any)?.['3xl']?.$value || '30px',
    },

    fontWeight: {
      light: parseInt((tokens.fontWeight as any)?.light?.$value || '300'),
      normal: parseInt((tokens.fontWeight as any)?.normal?.$value || '400'),
      medium: parseInt((tokens.fontWeight as any)?.medium?.$value || '500'),
      semibold: parseInt((tokens.fontWeight as any)?.semibold?.$value || '600'),
      bold: parseInt((tokens.fontWeight as any)?.bold?.$value || '700'),
    },

    lineHeight: {
      tight: parseFloat((tokens.lineHeight as any)?.tight?.$value || '1.25'),
      normal: parseFloat((tokens.lineHeight as any)?.normal?.$value || '1.5'),
      relaxed: parseFloat((tokens.lineHeight as any)?.relaxed?.$value || '1.75'),
    },
  };
}

/**
 * Spacing tokens for emails
 */
export interface EmailSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

/**
 * Get spacing values for emails
 */
export async function getEmailSpacing(): Promise<EmailSpacing> {
  const tokens = await fetchDesignTokens('public', 'light');

  return {
    xs: (tokens.spacing as any)?.xs?.$value || '8px',
    sm: (tokens.spacing as any)?.sm?.$value || '16px',
    md: (tokens.spacing as any)?.md?.$value || '24px',
    lg: (tokens.spacing as any)?.lg?.$value || '32px',
    xl: (tokens.spacing as any)?.xl?.$value || '48px',
    '2xl': (tokens.spacing as any)?.['2xl']?.$value || '64px',
    '3xl': (tokens.spacing as any)?.['3xl']?.$value || '96px',
  };
}

/**
 * Border radius tokens for emails
 */
export interface EmailRadius {
  none: string;
  sm: string;
  default: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

/**
 * Get border radius values for emails
 */
export async function getEmailRadius(): Promise<EmailRadius> {
  const tokens = await fetchDesignTokens('public', 'light');

  return {
    none: (tokens.radius as any)?.none?.$value || '0',
    sm: (tokens.radius as any)?.sm?.$value || '4px',
    default: (tokens.radius as any)?.default?.$value || '8px',
    md: (tokens.radius as any)?.md?.$value || '12px',
    lg: (tokens.radius as any)?.lg?.$value || '16px',
    xl: (tokens.radius as any)?.xl?.$value || '24px',
    full: (tokens.radius as any)?.full?.$value || '9999px',
  };
}

/**
 * Complete email design system
 */
export interface EmailDesignSystem {
  colors: EmailColorPalette;
  typography: EmailTypography;
  spacing: EmailSpacing;
  radius: EmailRadius;
}

/**
 * Get complete design system for emails
 * This is the main function to use in email templates
 */
export async function getEmailDesignSystem(
  context: 'public' | 'admin' | 'portal' = 'public',
  mode: 'light' | 'dark' = 'light'
): Promise<EmailDesignSystem> {
  const [colors, typography, spacing, radius] = await Promise.all([
    getEmailColorPalette(context, mode),
    getEmailTypography(),
    getEmailSpacing(),
    getEmailRadius(),
  ]);

  return {
    colors,
    typography,
    spacing,
    radius,
  };
}

/**
 * Generate email-safe CSS from design tokens
 */
export function generateEmailStyles(design: EmailDesignSystem): string {
  const { colors, typography, spacing, radius } = design;

  return `
    /* Email Design System Styles */
    body {
      font-family: ${typography.fontFamily};
      font-size: ${typography.fontSize.base};
      line-height: ${typography.lineHeight.normal};
      color: ${colors.foreground};
      background-color: ${colors.background};
    }

    /* Typography */
    h1 { font-size: ${typography.fontSize['3xl']}; font-weight: ${typography.fontWeight.bold}; }
    h2 { font-size: ${typography.fontSize['2xl']}; font-weight: ${typography.fontWeight.semibold}; }
    h3 { font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; }
    h4 { font-size: ${typography.fontSize.lg}; font-weight: ${typography.fontWeight.medium}; }
    p { font-size: ${typography.fontSize.base}; line-height: ${typography.lineHeight.normal}; }
    small { font-size: ${typography.fontSize.sm}; }

    /* Colors */
    .text-primary { color: ${colors.primary}; }
    .text-secondary { color: ${colors.secondary}; }
    .text-muted { color: ${colors.mutedForeground}; }
    .text-success { color: ${colors.success}; }
    .text-warning { color: ${colors.warning}; }
    .text-error { color: ${colors.error}; }
    .text-info { color: ${colors.info}; }

    .bg-primary { background-color: ${colors.primary}; color: ${colors.primaryForeground}; }
    .bg-secondary { background-color: ${colors.secondary}; color: ${colors.secondaryForeground}; }
    .bg-muted { background-color: ${colors.muted}; color: ${colors.mutedForeground}; }
    .bg-success { background-color: ${colors.success}; color: ${colors.successForeground}; }
    .bg-warning { background-color: ${colors.warning}; color: ${colors.warningForeground}; }
    .bg-error { background-color: ${colors.error}; color: ${colors.errorForeground}; }
    .bg-info { background-color: ${colors.info}; color: ${colors.infoForeground}; }

    /* Buttons */
    .btn {
      display: inline-block;
      padding: ${spacing.sm} ${spacing.md};
      font-size: ${typography.fontSize.base};
      font-weight: ${typography.fontWeight.medium};
      text-align: center;
      text-decoration: none;
      border-radius: ${radius.default};
    }

    .btn-primary {
      background-color: ${colors.primary};
      color: ${colors.primaryForeground};
    }

    .btn-secondary {
      background-color: ${colors.secondary};
      color: ${colors.secondaryForeground};
    }

    /* Cards */
    .card {
      background-color: ${colors.cardBackground};
      color: ${colors.cardForeground};
      border: 1px solid ${colors.border};
      border-radius: ${radius.md};
      padding: ${spacing.md};
    }

    /* Spacing utilities */
    .p-xs { padding: ${spacing.xs}; }
    .p-sm { padding: ${spacing.sm}; }
    .p-md { padding: ${spacing.md}; }
    .p-lg { padding: ${spacing.lg}; }
    .p-xl { padding: ${spacing.xl}; }

    .m-xs { margin: ${spacing.xs}; }
    .m-sm { margin: ${spacing.sm}; }
    .m-md { margin: ${spacing.md}; }
    .m-lg { margin: ${spacing.lg}; }
    .m-xl { margin: ${spacing.xl}; }

    /* Border radius utilities */
    .rounded-none { border-radius: ${radius.none}; }
    .rounded-sm { border-radius: ${radius.sm}; }
    .rounded { border-radius: ${radius.default}; }
    .rounded-md { border-radius: ${radius.md}; }
    .rounded-lg { border-radius: ${radius.lg}; }
    .rounded-xl { border-radius: ${radius.xl}; }
    .rounded-full { border-radius: ${radius.full}; }
  `.trim();
}
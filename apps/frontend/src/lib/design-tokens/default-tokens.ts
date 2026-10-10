/**
 * Default Design Tokens
 * Migrated from globals.css and enhanced with W3C compliance
 */

import type { DesignTokens } from '@/types/design-tokens';

/**
 * Base color tokens (primitives)
 */
export const baseColors: DesignTokens = {
  color: {
    // Neutrals
    white: { $type: 'color', $value: '#ffffff', $description: 'Pure white' },
    black: { $type: 'color', $value: '#000000', $description: 'Pure black' },
    
    // Gray scale
    gray: {
      50: { $type: 'color', $value: 'hsl(0 0% 98%)', $description: 'Lightest gray' },
      100: { $type: 'color', $value: 'hsl(0 0% 96%)' },
      200: { $type: 'color', $value: 'hsl(0 0% 90%)' },
      300: { $type: 'color', $value: 'hsl(0 0% 80%)' },
      400: { $type: 'color', $value: 'hsl(0 0% 64%)' },
      500: { $type: 'color', $value: 'hsl(0 0% 45%)' },
      600: { $type: 'color', $value: 'hsl(0 0% 32%)' },
      700: { $type: 'color', $value: 'hsl(0 0% 25%)' },
      800: { $type: 'color', $value: 'hsl(0 0% 15%)' },
      900: { $type: 'color', $value: 'hsl(0 0% 9%)', $description: 'Darkest gray' },
    },

    // Brand colors
    primary: {
      50: { $type: 'color', $value: 'hsl(222.2 84% 95%)' },
      100: { $type: 'color', $value: 'hsl(222.2 84% 90%)' },
      200: { $type: 'color', $value: 'hsl(222.2 84% 80%)' },
      300: { $type: 'color', $value: 'hsl(222.2 84% 70%)' },
      400: { $type: 'color', $value: 'hsl(222.2 84% 60%)' },
      500: { $type: 'color', $value: 'hsl(222.2 47.4% 11.2%)', $description: 'Main brand color' },
      600: { $type: 'color', $value: 'hsl(222.2 47.4% 9%)' },
      700: { $type: 'color', $value: 'hsl(222.2 47.4% 7%)' },
      800: { $type: 'color', $value: 'hsl(222.2 47.4% 5%)' },
      900: { $type: 'color', $value: 'hsl(222.2 47.4% 3%)' },
    },

    // Semantic colors
    success: { $type: 'color', $value: 'hsl(142 76% 36%)' },
    warning: { $type: 'color', $value: 'hsl(38 92% 50%)' },
    error: { $type: 'color', $value: 'hsl(0 84% 60%)' },
    info: { $type: 'color', $value: 'hsl(199 89% 48%)' },
  },
};

/**
 * Semantic color tokens (PUBLIC theme - LIGHT mode)
 */
export const publicLightColors: DesignTokens = {
  color: {
    background: { $type: 'color', $value: '{color.gray.50}', $description: 'Main background' },
    foreground: { $type: 'color', $value: '{color.primary.500}', $description: 'Main text color' },

    card: {
      background: { $type: 'color', $value: '{color.white}' },
      foreground: { $type: 'color', $value: '{color.primary.500}' },
    },

    popover: {
      background: { $type: 'color', $value: '{color.white}' },
      foreground: { $type: 'color', $value: '{color.primary.500}' },
    },

    primary: {
      background: { $type: 'color', $value: '{color.primary.500}' },
      foreground: { $type: 'color', $value: 'hsl(210 40% 98%)' },
    },

    secondary: {
      background: { $type: 'color', $value: 'hsl(210 40% 96.1%)' },
      foreground: { $type: 'color', $value: '{color.primary.500}' },
    },

    muted: {
      background: { $type: 'color', $value: 'hsl(210 40% 96.1%)' },
      foreground: { $type: 'color', $value: 'hsl(215.4 16.3% 46.9%)' },
    },

    accent: {
      background: { $type: 'color', $value: 'hsl(210 40% 96.1%)' },
      foreground: { $type: 'color', $value: '{color.primary.500}' },
    },

    destructive: {
      background: { $type: 'color', $value: '{color.error}' },
      foreground: { $type: 'color', $value: 'hsl(210 40% 98%)' },
    },

    border: { $type: 'color', $value: 'hsl(214.3 31.8% 91.4%)' },
    input: { $type: 'color', $value: 'hsl(214.3 31.8% 91.4%)' },
    ring: { $type: 'color', $value: '{color.primary.500}' },
  },
};

/**
 * Semantic color tokens (PUBLIC theme - DARK mode)
 */
export const publicDarkColors: DesignTokens = {
  color: {
    background: { $type: 'color', $value: 'hsl(225 6% 9%)', $description: 'Main background' },
    foreground: { $type: 'color', $value: 'hsl(210 40% 98%)', $description: 'Main text color' },

    card: {
      background: { $type: 'color', $value: 'hsl(222.2 47.4% 11.2%)' },
      foreground: { $type: 'color', $value: 'hsl(210 40% 98%)' },
    },

    popover: {
      background: { $type: 'color', $value: 'hsl(222.2 47.4% 11.2%)' },
      foreground: { $type: 'color', $value: 'hsl(210 40% 98%)' },
    },

    primary: {
      background: { $type: 'color', $value: 'hsl(210 40% 98%)' },
      foreground: { $type: 'color', $value: '{color.primary.500}' },
    },

    secondary: {
      background: { $type: 'color', $value: 'hsl(217.2 32.6% 17.5%)' },
      foreground: { $type: 'color', $value: 'hsl(210 40% 98%)' },
    },

    muted: {
      background: { $type: 'color', $value: 'hsl(217.2 32.6% 17.5%)' },
      foreground: { $type: 'color', $value: 'hsl(215 20.2% 65.1%)' },
    },

    accent: {
      background: { $type: 'color', $value: 'hsl(217.2 32.6% 17.5%)' },
      foreground: { $type: 'color', $value: 'hsl(210 40% 98%)' },
    },

    destructive: {
      background: { $type: 'color', $value: 'hsl(0 62.8% 30.6%)' },
      foreground: { $type: 'color', $value: 'hsl(210 40% 98%)' },
    },

    border: { $type: 'color', $value: 'hsl(217.2 32.6% 17.5%)' },
    input: { $type: 'color', $value: 'hsl(217.2 32.6% 17.5%)' },
    ring: { $type: 'color', $value: 'hsl(212.7 26.8% 83.9%)' },
  },
};

/**
 * Spacing tokens
 */
export const spacing: DesignTokens = {
  spacing: {
    xs: { $type: 'dimension', $value: '0.25rem', $description: '4px' },
    sm: { $type: 'dimension', $value: '0.5rem', $description: '8px' },
    md: { $type: 'dimension', $value: '1rem', $description: '16px - Base spacing' },
    lg: { $type: 'dimension', $value: '1.5rem', $description: '24px' },
    xl: { $type: 'dimension', $value: '2rem', $description: '32px' },
    '2xl': { $type: 'dimension', $value: '3rem', $description: '48px' },
    '3xl': { $type: 'dimension', $value: '4rem', $description: '64px' },
  },
};

/**
 * Border radius tokens
 */
export const borderRadius: DesignTokens = {
  radius: {
    none: { $type: 'dimension', $value: '0', $description: 'No radius' },
    sm: { $type: 'dimension', $value: '0.125rem', $description: '2px' },
    md: { $type: 'dimension', $value: '0.375rem', $description: '6px' },
    lg: { $type: 'dimension', $value: '0.5rem', $description: '8px - Default radius' },
    xl: { $type: 'dimension', $value: '0.75rem', $description: '12px' },
    '2xl': { $type: 'dimension', $value: '1rem', $description: '16px' },
    full: { $type: 'dimension', $value: '9999px', $description: 'Fully rounded' },
  },
};

/**
 * Typography tokens
 */
export const typography: DesignTokens = {
  fontFamily: {
    sans: {
      $type: 'fontFamily',
      $value: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      $description: 'Main sans-serif font',
    },
    mono: {
      $type: 'fontFamily',
      $value: ['Fira Code', 'Consolas', 'Monaco', 'monospace'],
      $description: 'Monospace font',
    },
  },

  fontWeight: {
    light: { $type: 'fontWeight', $value: 300 },
    normal: { $type: 'fontWeight', $value: 400 },
    medium: { $type: 'fontWeight', $value: 500 },
    semibold: { $type: 'fontWeight', $value: 600 },
    bold: { $type: 'fontWeight', $value: 700 },
  },

  fontSize: {
    xs: { $type: 'dimension', $value: '0.75rem', $description: '12px' },
    sm: { $type: 'dimension', $value: '0.875rem', $description: '14px' },
    base: { $type: 'dimension', $value: '1rem', $description: '16px' },
    lg: { $type: 'dimension', $value: '1.125rem', $description: '18px' },
    xl: { $type: 'dimension', $value: '1.25rem', $description: '20px' },
    '2xl': { $type: 'dimension', $value: '1.5rem', $description: '24px' },
    '3xl': { $type: 'dimension', $value: '1.875rem', $description: '30px' },
    '4xl': { $type: 'dimension', $value: '2.25rem', $description: '36px' },
  },

  lineHeight: {
    tight: { $type: 'number', $value: 1.25 },
    normal: { $type: 'number', $value: 1.5 },
    relaxed: { $type: 'number', $value: 1.75 },
  },
};

/**
 * Shadow tokens
 */
export const shadows: DesignTokens = {
  shadow: {
    sm: {
      $type: 'shadow',
      $value: {
        color: 'hsl(220 3% 15% / 0.1)',
        offsetX: '0',
        offsetY: '1px',
        blur: '2px',
        spread: '0',
      },
    },
    md: {
      $type: 'shadow',
      $value: {
        color: 'hsl(220 3% 15% / 0.1)',
        offsetX: '0',
        offsetY: '4px',
        blur: '6px',
        spread: '-1px',
      },
    },
    lg: {
      $type: 'shadow',
      $value: {
        color: 'hsl(220 3% 15% / 0.1)',
        offsetX: '0',
        offsetY: '10px',
        blur: '15px',
        spread: '-3px',
      },
    },
    xl: {
      $type: 'shadow',
      $value: {
        color: 'hsl(220 3% 15% / 0.25)',
        offsetX: '0',
        offsetY: '20px',
        blur: '25px',
        spread: '-5px',
      },
    },
  },
};

/**
 * Animation tokens
 */
export const animations: DesignTokens = {
  duration: {
    fast: { $type: 'duration', $value: '150ms' },
    normal: { $type: 'duration', $value: '250ms' },
    slow: { $type: 'duration', $value: '350ms' },
  },

  easing: {
    linear: { $type: 'cubicBezier', $value: [0, 0, 1, 1] },
    easeIn: { $type: 'cubicBezier', $value: [0.4, 0, 1, 1] },
    easeOut: { $type: 'cubicBezier', $value: [0, 0, 0.2, 1] },
    easeInOut: { $type: 'cubicBezier', $value: [0.4, 0, 0.2, 1] },
  },
};

/**
 * Component-specific tokens
 */
export const components: DesignTokens = {
  button: {
    borderRadius: { $type: 'dimension', $value: '{radius.md}' },
    paddingX: { $type: 'dimension', $value: '{spacing.md}' },
    paddingY: { $type: 'dimension', $value: '{spacing.sm}' },
    fontSize: { $type: 'dimension', $value: '{fontSize.sm}' },
    fontWeight: { $type: 'fontWeight', $value: '{fontWeight.medium}' },
    transition: {
      $type: 'transition',
      $value: {
        duration: '{duration.fast}',
        timingFunction: '{easing.easeInOut}',
      },
    },
  },

  card: {
    borderRadius: { $type: 'dimension', $value: '{radius.lg}' },
    padding: { $type: 'dimension', $value: '{spacing.lg}' },
    shadow: { $type: 'shadow', $value: '{shadow.md}' },
  },

  input: {
    borderRadius: { $type: 'dimension', $value: '{radius.md}' },
    paddingX: { $type: 'dimension', $value: '{spacing.md}' },
    paddingY: { $type: 'dimension', $value: '{spacing.sm}' },
    fontSize: { $type: 'dimension', $value: '{fontSize.sm}' },
  },
};

/**
 * Complete default token set (PUBLIC - LIGHT)
 */
export const defaultTokens: DesignTokens = {
  color: {
    ...baseColors.color,
    ...publicLightColors.color,
  },
  spacing: spacing.spacing,
  radius: borderRadius.radius,
  fontFamily: typography.fontFamily,
  fontWeight: typography.fontWeight,
  fontSize: typography.fontSize,
  lineHeight: typography.lineHeight,
  shadow: shadows.shadow,
  duration: animations.duration,
  easing: animations.easing,
  button: components.button,
  card: components.card,
  input: components.input,
};

/**
 * Admin theme tokens (LIGHT mode)
 */
export const adminLightTokens: DesignTokens = {
  color: {
    ...baseColors.color,
    ...publicLightColors.color,
  },
  spacing: spacing.spacing,
  radius: borderRadius.radius,
  fontFamily: typography.fontFamily,
  fontWeight: typography.fontWeight,
  fontSize: typography.fontSize,
  lineHeight: typography.lineHeight,
  shadow: shadows.shadow,
  duration: animations.duration,
  easing: animations.easing,
  button: components.button,
  card: components.card,
  input: components.input,
};

/**
 * Admin theme tokens (DARK mode)
 */
export const adminDarkTokens: DesignTokens = {
  color: {
    ...baseColors.color,
    ...publicDarkColors.color,
  },
  spacing: spacing.spacing,
  radius: borderRadius.radius,
  fontFamily: typography.fontFamily,
  fontWeight: typography.fontWeight,
  fontSize: typography.fontSize,
  lineHeight: typography.lineHeight,
  shadow: shadows.shadow,
  duration: animations.duration,
  easing: animations.easing,
  button: components.button,
  card: components.card,
  input: components.input,
};

/**
 * Portal theme tokens (LIGHT mode)
 */
export const portalLightTokens: DesignTokens = {
  color: {
    ...baseColors.color,
    ...publicLightColors.color,
  },
  spacing: spacing.spacing,
  radius: borderRadius.radius,
  fontFamily: typography.fontFamily,
  fontWeight: typography.fontWeight,
  fontSize: typography.fontSize,
  lineHeight: typography.lineHeight,
  shadow: shadows.shadow,
  duration: animations.duration,
  easing: animations.easing,
  button: components.button,
  card: components.card,
  input: components.input,
};

/**
 * Portal theme tokens (DARK mode)
 */
export const portalDarkTokens: DesignTokens = {
  color: {
    ...baseColors.color,
    ...publicDarkColors.color,
  },
  spacing: spacing.spacing,
  radius: borderRadius.radius,
  fontFamily: typography.fontFamily,
  fontWeight: typography.fontWeight,
  fontSize: typography.fontSize,
  lineHeight: typography.lineHeight,
  shadow: shadows.shadow,
  duration: animations.duration,
  easing: animations.easing,
  button: components.button,
  card: components.card,
  input: components.input,
};

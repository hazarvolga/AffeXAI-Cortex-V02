/**
 * CMS Style Utilities
 * Converts Advanced tab properties to Tailwind CSS classes
 */

/**
 * Convert Advanced tab properties to Tailwind classes
 * These properties come from the Advanced tab in PropertiesPanel
 */
export function convertAdvancedPropsToClasses(props: Record<string, any>): string {
  const classes: string[] = [];

  // Margin utilities
  if (props.marginTop) {
    const mt = convertSpacingToTailwind(props.marginTop, 'mt');
    if (mt) classes.push(mt);
  }
  if (props.marginBottom) {
    const mb = convertSpacingToTailwind(props.marginBottom, 'mb');
    if (mb) classes.push(mb);
  }
  if (props.marginLeft) {
    const ml = convertSpacingToTailwind(props.marginLeft, 'ml');
    if (ml) classes.push(ml);
  }
  if (props.marginRight) {
    const mr = convertSpacingToTailwind(props.marginRight, 'mr');
    if (mr) classes.push(mr);
  }

  // Padding utilities
  if (props.paddingTop) {
    const pt = convertSpacingToTailwind(props.paddingTop, 'pt');
    if (pt) classes.push(pt);
  }
  if (props.paddingBottom) {
    const pb = convertSpacingToTailwind(props.paddingBottom, 'pb');
    if (pb) classes.push(pb);
  }
  if (props.paddingLeft) {
    const pl = convertSpacingToTailwind(props.paddingLeft, 'pl');
    if (pl) classes.push(pl);
  }
  if (props.paddingRight) {
    const pr = convertSpacingToTailwind(props.paddingRight, 'pr');
    if (pr) classes.push(pr);
  }

  // Display
  if (props.display) {
    const displayClass = convertDisplayToTailwind(props.display);
    if (displayClass) classes.push(displayClass);
  }

  // Max width
  if (props.maxWidth) {
    const maxW = convertMaxWidthToTailwind(props.maxWidth);
    if (maxW) classes.push(maxW);
  }

  // Min height
  if (props.minHeight) {
    const minH = convertMinHeightToTailwind(props.minHeight);
    if (minH) classes.push(minH);
  }

  // Shadow
  if (props.shadow && props.shadow !== 'none') {
    classes.push(`shadow-${props.shadow}`);
  }

  // Opacity
  if (props.opacity && props.opacity !== '100') {
    classes.push(`opacity-${props.opacity}`);
  }

  // Width & Height (if specified)
  if (props.width) {
    const w = convertSizeToTailwind(props.width, 'w');
    if (w) classes.push(w);
  }
  if (props.height) {
    const h = convertSizeToTailwind(props.height, 'h');
    if (h) classes.push(h);
  }

  return classes.join(' ');
}

/**
 * Convert spacing value to Tailwind class
 * Handles: "0", "4", "8", "16", "auto", "1rem", "2rem", etc.
 */
function convertSpacingToTailwind(value: string, prefix: string): string | null {
  if (!value) return null;

  const trimmed = value.trim();

  // Auto
  if (trimmed === 'auto') {
    return `${prefix}-auto`;
  }

  // Tailwind spacing scale (0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96)
  // User can input: "4", "8", "16", "32", etc. (these are Tailwind scale values)
  const spacingMap: Record<string, string> = {
    '0': '0',
    '1': '0.5', // 2px
    '2': '1',   // 4px
    '4': '1',   // 4px
    '8': '2',   // 8px
    '12': '3',  // 12px
    '16': '4',  // 16px
    '20': '5',  // 20px
    '24': '6',  // 24px
    '32': '8',  // 32px
    '40': '10', // 40px
    '48': '12', // 48px
    '56': '14', // 56px
    '64': '16', // 64px
    '80': '20', // 80px
    '96': '24', // 96px
  };

  if (spacingMap[trimmed]) {
    return `${prefix}-${spacingMap[trimmed]}`;
  }

  // If it's a number, treat as Tailwind scale directly
  if (/^\d+$/.test(trimmed)) {
    return `${prefix}-${trimmed}`;
  }

  // rem values (1rem, 2rem, etc.)
  if (trimmed.endsWith('rem')) {
    const remValue = parseFloat(trimmed);
    if (!isNaN(remValue)) {
      // 1rem = 4 in Tailwind scale (16px)
      const scale = Math.round(remValue * 4);
      return `${prefix}-${scale}`;
    }
  }

  // px values (16px, 32px, etc.) - convert to Tailwind scale
  if (trimmed.endsWith('px')) {
    const pxValue = parseInt(trimmed);
    if (!isNaN(pxValue)) {
      // Convert px to Tailwind scale (divide by 4)
      const scale = Math.round(pxValue / 4);
      return `${prefix}-${scale}`;
    }
  }

  return null;
}

/**
 * Convert display value to Tailwind class
 */
function convertDisplayToTailwind(value: string): string | null {
  const displayMap: Record<string, string> = {
    'block': 'block',
    'inline-block': 'inline-block',
    'flex': 'flex',
    'inline-flex': 'inline-flex',
    'grid': 'grid',
    'inline-grid': 'inline-grid',
    'hidden': 'hidden',
    'none': 'hidden',
  };

  return displayMap[value] || null;
}

/**
 * Convert max-width value to Tailwind class
 */
function convertMaxWidthToTailwind(value: string): string | null {
  if (!value) return null;

  const trimmed = value.trim();

  // Tailwind container values
  const containerMap: Record<string, string> = {
    'container': 'max-w-screen-xl',
    'xs': 'max-w-xs',
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full',
    'screen-sm': 'max-w-screen-sm',
    'screen-md': 'max-w-screen-md',
    'screen-lg': 'max-w-screen-lg',
    'screen-xl': 'max-w-screen-xl',
    'screen-2xl': 'max-w-screen-2xl',
  };

  if (containerMap[trimmed]) {
    return containerMap[trimmed];
  }

  // px values
  if (trimmed.endsWith('px')) {
    return `max-w-[${trimmed}]`;
  }

  // rem/em values
  if (trimmed.endsWith('rem') || trimmed.endsWith('em') || trimmed.endsWith('%')) {
    return `max-w-[${trimmed}]`;
  }

  return null;
}

/**
 * Convert min-height value to Tailwind class
 */
function convertMinHeightToTailwind(value: string): string | null {
  if (!value) return null;

  const trimmed = value.trim();

  // Common values
  const heightMap: Record<string, string> = {
    'screen': 'min-h-screen',
    'full': 'min-h-full',
    'fit': 'min-h-fit',
  };

  if (heightMap[trimmed]) {
    return heightMap[trimmed];
  }

  // px values
  if (trimmed.endsWith('px')) {
    return `min-h-[${trimmed}]`;
  }

  // rem/em/vh values
  if (trimmed.endsWith('rem') || trimmed.endsWith('em') || trimmed.endsWith('vh') || trimmed.endsWith('%')) {
    return `min-h-[${trimmed}]`;
  }

  return null;
}

/**
 * Convert size (width/height) value to Tailwind class
 */
function convertSizeToTailwind(value: string, prefix: 'w' | 'h'): string | null {
  if (!value) return null;
  
  // Ensure value is a string
  const stringValue = typeof value === 'string' ? value : String(value);
  const trimmed = stringValue.trim();

  // Common values
  const sizeMap: Record<string, string> = {
    'auto': 'auto',
    'full': 'full',
    'screen': 'screen',
    'min': 'min',
    'max': 'max',
    'fit': 'fit',
  };

  if (sizeMap[trimmed]) {
    return `${prefix}-${sizeMap[trimmed]}`;
  }

  // Fractions (1/2, 1/3, 2/3, 1/4, etc.)
  if (trimmed.includes('/')) {
    return `${prefix}-${trimmed}`;
  }

  // Percentage
  if (trimmed.endsWith('%')) {
    return `${prefix}-[${trimmed}]`;
  }

  // px values
  if (trimmed.endsWith('px')) {
    return `${prefix}-[${trimmed}]`;
  }

  // rem/em values
  if (trimmed.endsWith('rem') || trimmed.endsWith('em') || trimmed.endsWith('vh') || trimmed.endsWith('vw')) {
    return `${prefix}-[${trimmed}]`;
  }

  return null;
}

/**
 * Merge component's className prop with Advanced tab classes
 */
export function mergeComponentClasses(
  baseClasses: string = '',
  advancedProps: Record<string, any> = {},
  additionalClasses: string = ''
): string {
  const classes: string[] = [];

  // Base component classes (from component definition)
  if (baseClasses) {
    classes.push(baseClasses);
  }

  // Advanced tab classes
  const advancedClasses = convertAdvancedPropsToClasses(advancedProps);
  if (advancedClasses) {
    classes.push(advancedClasses);
  }

  // Additional custom classes (from className prop or cssClasses)
  if (additionalClasses) {
    classes.push(additionalClasses);
  }

  return classes.filter(Boolean).join(' ');
}

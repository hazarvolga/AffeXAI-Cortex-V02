/**
 * PRODUCTION Token Set - Complete & Synced with globals.css
 * Includes colors from globals.css + full design system tokens
 */

import type { DesignTokens } from '@/types/design-tokens';

// ============================================================================
// SHARED TOKENS (Used by all themes)
// ============================================================================

/**
 * Spacing scale - Consistent across all themes
 */
const spacingTokens: DesignTokens = {
  spacing: {
    xs: { $type: 'dimension', $value: '0.5rem', $description: '8px' },
    sm: { $type: 'dimension', $value: '1rem', $description: '16px' },
    md: { $type: 'dimension', $value: '1.5rem', $description: '24px' },
    lg: { $type: 'dimension', $value: '2rem', $description: '32px' },
    xl: { $type: 'dimension', $value: '3rem', $description: '48px' },
    '2xl': { $type: 'dimension', $value: '4rem', $description: '64px' },
    '3xl': { $type: 'dimension', $value: '6rem', $description: '96px' },
  },
};

/**
 * Typography scale - Consistent across all themes
 */
const typographyTokens: DesignTokens = {
  fontFamily: {
    sans: { 
      $type: 'fontFamily', 
      $value: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      $description: 'Sans-serif font stack'
    },
    mono: { 
      $type: 'fontFamily', 
      $value: '"Fira Code", "Courier New", monospace',
      $description: 'Monospace font stack'
    },
  },
  
  fontWeight: {
    light: { $type: 'fontWeight', $value: '300' },
    normal: { $type: 'fontWeight', $value: '400' },
    medium: { $type: 'fontWeight', $value: '500' },
    semibold: { $type: 'fontWeight', $value: '600' },
    bold: { $type: 'fontWeight', $value: '700' },
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
const shadowTokens: DesignTokens = {
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
      $description: 'Small shadow'
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
      $description: 'Medium shadow'
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
      $description: 'Large shadow'
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
      $description: 'Extra large shadow'
    },
  },
};

/**
 * Animation tokens
 */
const animationTokens: DesignTokens = {
  duration: {
    fast: { $type: 'duration', $value: '150ms' },
    normal: { $type: 'duration', $value: '250ms' },
    slow: { $type: 'duration', $value: '350ms' },
  },
  easing: {
    ease: { $type: 'cubicBezier', $value: [0.25, 0.1, 0.25, 1.0] },
    easeIn: { $type: 'cubicBezier', $value: [0.42, 0.0, 1.0, 1.0] },
    easeOut: { $type: 'cubicBezier', $value: [0.0, 0.0, 0.58, 1.0] },
    easeInOut: { $type: 'cubicBezier', $value: [0.42, 0.0, 0.58, 1.0] },
  },
};

/**
 * Border radius tokens
 */
const radiusTokens: DesignTokens = {
  radius: {
    none: { $type: 'dimension', $value: '0' },
    sm: { $type: 'dimension', $value: '0.25rem' },
    default: { $type: 'dimension', $value: '0.5rem' },
    md: { $type: 'dimension', $value: '0.75rem' },
    lg: { $type: 'dimension', $value: '1rem' },
    xl: { $type: 'dimension', $value: '1.5rem' },
    full: { $type: 'dimension', $value: '9999px' },
  },
};

/**
 * Semantic color tokens - LIGHT mode
 * Used for success, warning, info states
 */
const semanticColorsLight: DesignTokens = {
  color: {
    success: {
      background: { $type: 'color', $value: '142 76% 36%', $description: 'Success green' },
      foreground: { $type: 'color', $value: '0 0% 100%', $description: 'Success text (white)' },
    },
    warning: {
      background: { $type: 'color', $value: '38 92% 50%', $description: 'Warning amber' },
      foreground: { $type: 'color', $value: '26 83% 14%', $description: 'Warning text (dark)' },
    },
    info: {
      background: { $type: 'color', $value: '199 89% 48%', $description: 'Info blue' },
      foreground: { $type: 'color', $value: '0 0% 100%', $description: 'Info text (white)' },
    },
  },
};

/**
 * Semantic color tokens - DARK mode
 * Adjusted for dark backgrounds
 */
const semanticColorsDark: DesignTokens = {
  color: {
    success: {
      background: { $type: 'color', $value: '142 71% 45%', $description: 'Success green (lighter)' },
      foreground: { $type: 'color', $value: '144 61% 20%', $description: 'Success text (dark green)' },
    },
    warning: {
      background: { $type: 'color', $value: '38 92% 50%', $description: 'Warning amber' },
      foreground: { $type: 'color', $value: '26 83% 14%', $description: 'Warning text (dark)' },
    },
    info: {
      background: { $type: 'color', $value: '199 89% 48%', $description: 'Info blue' },
      foreground: { $type: 'color', $value: '0 0% 100%', $description: 'Info text (white)' },
    },
  },
};

// ============================================================================
// ADMIN THEME - LIGHT MODE
// ============================================================================

const adminLightColors: DesignTokens = {
  color: {
    background: { $type: 'color', $value: '0 0% 98%', $description: 'Ana sayfa arka planı (tüm sayfa)' },
    foreground: { $type: 'color', $value: '220 13% 9%', $description: 'Ana metin rengi (paragraflar, başlıklar)' },
    
    card: {
      background: { $type: 'color', $value: '0 0% 100%', $description: 'Kart arka planı (card, panel bileşenleri)' },
      foreground: { $type: 'color', $value: '220 13% 9%', $description: 'Kart içi metinler' },
    },
    
    popover: {
      background: { $type: 'color', $value: '0 0% 100%', $description: 'Açılır menü arka planı (dropdown, tooltip)' },
      foreground: { $type: 'color', $value: '220 13% 9%', $description: 'Açılır menü metinleri' },
    },
    
    primary: {
      background: { $type: 'color', $value: '39 100% 54%', $description: 'Ana buton arka planı (CTA butonlar) - ORANGE' },
      foreground: { $type: 'color', $value: '220 13% 9%', $description: 'Ana buton metni' },
    },
    
    secondary: {
      background: { $type: 'color', $value: '210 20% 94%', $description: 'İkincil buton arka planı (geri dön, iptal)' },
      foreground: { $type: 'color', $value: '220 13% 9%', $description: 'İkincil buton metni' },
    },
    
    muted: {
      background: { $type: 'color', $value: '0 0% 94%', $description: 'Soluk arka plan (disabled, inactive)' },
      foreground: { $type: 'color', $value: '220 9% 46%', $description: 'Soluk metin (yardımcı açıklamalar)' },
    },
    
    accent: {
      background: { $type: 'color', $value: '39 100% 54%', $description: 'Vurgu rengi (öne çıkan öğeler) - ORANGE' },
      foreground: { $type: 'color', $value: '220 13% 9%', $description: 'Vurgu metni' },
    },
    
    destructive: {
      background: { $type: 'color', $value: '0 84% 60%', $description: 'Hata/silme butonu arka planı (delete, error)' },
      foreground: { $type: 'color', $value: '0 0% 98%', $description: 'Hata butonu metni' },
    },
    
    success: {
      background: { $type: 'color', $value: '142 76% 36%', $description: 'Başarı bildirimi arka planı (onay, tamamlandı)' },
      foreground: { $type: 'color', $value: '0 0% 100%', $description: 'Başarı bildirimi metni' },
    },
    
    warning: {
      background: { $type: 'color', $value: '38 92% 50%', $description: 'Uyarı bildirimi arka planı (dikkat, beklemede)' },
      foreground: { $type: 'color', $value: '26 83% 14%', $description: 'Uyarı bildirimi metni' },
    },
    
    info: {
      background: { $type: 'color', $value: '199 89% 48%', $description: 'Bilgi bildirimi arka planı (ipucu, açıklama)' },
      foreground: { $type: 'color', $value: '0 0% 100%', $description: 'Bilgi bildirimi metni' },
    },
    
    border: { $type: 'color', $value: '210 20% 87%', $description: 'Kenarlık rengi (card, input çerçeveleri)' },
    input: { $type: 'color', $value: '210 20% 87%', $description: 'Input kenarlığı (text field, textarea)' },
    ring: { $type: 'color', $value: '39 100% 54%', $description: 'Odaklanma halkası (tab ile gezinme) - ORANGE' },
    
    chart: {
      1: { $type: 'color', $value: '12 76% 61%', $description: 'Grafik rengi 1 (kırmızı-turuncu)' },
      2: { $type: 'color', $value: '173 58% 39%', $description: 'Grafik rengi 2 (deniz yeşili)' },
      3: { $type: 'color', $value: '197 37% 24%', $description: 'Grafik rengi 3 (koyu mavi)' },
      4: { $type: 'color', $value: '43 74% 66%', $description: 'Grafik rengi 4 (sarı)' },
      5: { $type: 'color', $value: '27 87% 67%', $description: 'Grafik rengi 5 (turuncu)' },
    },
  },
};

export const adminLightTokensProduction: DesignTokens = {
  ...adminLightColors,
  ...spacingTokens,
  ...typographyTokens,
  ...shadowTokens,
  ...animationTokens,
  ...radiusTokens,
};

// ============================================================================
// ADMIN THEME - DARK MODE
// ============================================================================

const adminDarkColors: DesignTokens = {
  color: {
    background: { $type: 'color', $value: '225 6% 9%', $description: 'Ana sayfa arka planı (koyu tema)' },
    foreground: { $type: 'color', $value: '216 14% 90%', $description: 'Ana metin rengi (açık gri)' },
    
    card: {
      background: { $type: 'color', $value: '225 6% 9%', $description: 'Kart arka planı (koyu)' },
      foreground: { $type: 'color', $value: '216 14% 90%', $description: 'Kart içi metinler (açık)' },
    },
    
    popover: {
      background: { $type: 'color', $value: '225 6% 9%', $description: 'Açılır menü arka planı (koyu)' },
      foreground: { $type: 'color', $value: '216 14% 90%', $description: 'Açılır menü metinleri' },
    },
    
    primary: {
      background: { $type: 'color', $value: '39 100% 54%', $description: 'Ana buton arka planı (koyu temada parlak) - ORANGE' },
      foreground: { $type: 'color', $value: '220 13% 9%', $description: 'Ana buton metni (koyu metin)' },
    },
    
    secondary: {
      background: { $type: 'color', $value: '228 5% 13%', $description: 'İkincil buton arka planı (koyu gri)' },
      foreground: { $type: 'color', $value: '216 14% 90%', $description: 'İkincil buton metni' },
    },
    
    muted: {
      background: { $type: 'color', $value: '228 6% 10%', $description: 'Soluk arka plan (daha koyu)' },
      foreground: { $type: 'color', $value: '216 10% 55%', $description: 'Soluk metin (orta gri)' },
    },
    
    accent: {
      background: { $type: 'color', $value: '39 100% 54%', $description: 'Vurgu rengi (koyu temada parlak) - ORANGE' },
      foreground: { $type: 'color', $value: '220 13% 9%', $description: 'Vurgu metni (koyu)' },
    },
    
    destructive: {
      background: { $type: 'color', $value: '0 63% 31%', $description: 'Hata/silme butonu (koyu kırmızı)' },
      foreground: { $type: 'color', $value: '0 0% 98%', $description: 'Hata butonu metni (beyaz)' },
    },
    
    success: {
      background: { $type: 'color', $value: '142 71% 45%', $description: 'Başarı bildirimi (açık yeşil)' },
      foreground: { $type: 'color', $value: '144 61% 20%', $description: 'Başarı metni (koyu yeşil)' },
    },
    
    warning: {
      background: { $type: 'color', $value: '38 92% 50%', $description: 'Uyarı bildirimi (parlak amber)' },
      foreground: { $type: 'color', $value: '26 83% 14%', $description: 'Uyarı metni (koyu kahve)' },
    },
    
    info: {
      background: { $type: 'color', $value: '199 89% 48%', $description: 'Bilgi bildirimi (parlak mavi)' },
      foreground: { $type: 'color', $value: '0 0% 100%', $description: 'Bilgi metni (beyaz)' },
    },
    
    border: { $type: 'color', $value: '228 5% 13%', $description: 'Kenarlık rengi (koyu gri)' },
    input: { $type: 'color', $value: '228 5% 13%', $description: 'Input kenarlığı (koyu)' },
    ring: { $type: 'color', $value: '39 100% 54%', $description: 'Odaklanma halkası (parlak turuncu) - ORANGE' },
    
    chart: {
      1: { $type: 'color', $value: '220 70% 50%', $description: 'Grafik rengi 1 (mavi - koyu tema)' },
      2: { $type: 'color', $value: '160 60% 45%', $description: 'Grafik rengi 2 (yeşil - koyu tema)' },
      3: { $type: 'color', $value: '30 80% 55%', $description: 'Grafik rengi 3 (turuncu - koyu tema)' },
      4: { $type: 'color', $value: '280 65% 60%', $description: 'Grafik rengi 4 (mor - koyu tema)' },
      5: { $type: 'color', $value: '340 75% 55%', $description: 'Grafik rengi 5 (pembe - koyu tema)' },
    },
  },
};

export const adminDarkTokensProduction: DesignTokens = {
  ...adminDarkColors,
  ...spacingTokens,
  ...typographyTokens,
  ...shadowTokens,
  ...animationTokens,
  ...radiusTokens,
};

// ============================================================================
// PUBLIC THEME - LIGHT MODE
// ============================================================================

const publicLightColors: DesignTokens = {
  color: {
    background: { $type: 'color', $value: '0 0% 98%', $description: 'Sayfa arka planı' },
    foreground: { $type: 'color', $value: '220 13% 9%', $description: 'Metin rengi' },
    
    card: {
      background: { $type: 'color', $value: '0 0% 100%', $description: 'Kart arka planı' },
      foreground: { $type: 'color', $value: '220 13% 9%', $description: 'Kart metni' },
    },
    
    popover: {
      background: { $type: 'color', $value: '0 0% 100%', $description: 'Açılır menü arka planı' },
      foreground: { $type: 'color', $value: '220 13% 9%', $description: 'Menü metni' },
    },
    
    primary: {
      background: { $type: 'color', $value: '39 100% 54%', $description: 'Ana buton (CTA) - ORANGE' },
      foreground: { $type: 'color', $value: '220 13% 9%', $description: 'Buton metni' },
    },
    
    secondary: {
      background: { $type: 'color', $value: '210 20% 94%', $description: 'İkincil buton' },
      foreground: { $type: 'color', $value: '220 13% 9%', $description: 'İkincil metin' },
    },
    
    muted: {
      background: { $type: 'color', $value: '0 0% 94%', $description: 'Soluk arka plan' },
      foreground: { $type: 'color', $value: '220 9% 46%', $description: 'Yardımcı metin' },
    },
    
    accent: {
      background: { $type: 'color', $value: '39 100% 54%', $description: 'Vurgu rengi - ORANGE' },
      foreground: { $type: 'color', $value: '220 13% 9%', $description: 'Vurgu metni' },
    },
    
    destructive: {
      background: { $type: 'color', $value: '0 84% 60%', $description: 'Hata/silme butonu' },
      foreground: { $type: 'color', $value: '0 0% 98%', $description: 'Hata metni' },
    },
    
    success: {
      background: { $type: 'color', $value: '142 76% 36%', $description: 'Başarı bildirimi (yeşil)' },
      foreground: { $type: 'color', $value: '0 0% 100%', $description: 'Başarı metni (beyaz)' },
    },
    
    warning: {
      background: { $type: 'color', $value: '38 92% 50%', $description: 'Uyarı bildirimi (sarı-turuncu)' },
      foreground: { $type: 'color', $value: '26 83% 14%', $description: 'Uyarı metni (koyu)' },
    },
    
    info: {
      background: { $type: 'color', $value: '199 89% 48%', $description: 'Bilgi bildirimi (mavi)' },
      foreground: { $type: 'color', $value: '0 0% 100%', $description: 'Bilgi metni (beyaz)' },
    },
    
    border: { $type: 'color', $value: '210 20% 87%', $description: 'Kenarlıklar' },
    input: { $type: 'color', $value: '210 20% 87%', $description: 'Input çerçevesi' },
    ring: { $type: 'color', $value: '39 100% 54%', $description: 'Odaklanma (focus) - ORANGE' },
    
    chart: {
      1: { $type: 'color', $value: '12 76% 61%', $description: 'Grafik 1 (kırmızı-turuncu)' },
      2: { $type: 'color', $value: '173 58% 39%', $description: 'Grafik 2 (deniz yeşili)' },
      3: { $type: 'color', $value: '197 37% 24%', $description: 'Grafik 3 (koyu mavi)' },
      4: { $type: 'color', $value: '43 74% 66%', $description: 'Grafik 4 (sarı)' },
      5: { $type: 'color', $value: '27 87% 67%', $description: 'Grafik 5 (turuncu)' },
    },
  },
};

export const publicLightTokensProduction: DesignTokens = {
  ...publicLightColors,
  ...spacingTokens,
  ...typographyTokens,
  ...shadowTokens,
  ...animationTokens,
  ...radiusTokens,
};

// ============================================================================
// PUBLIC THEME - DARK MODE
// ============================================================================

const publicDarkColors: DesignTokens = {
  color: {
    background: { $type: 'color', $value: '225 6% 9%', $description: 'Sayfa arka planı (koyu)' },
    foreground: { $type: 'color', $value: '216 14% 90%', $description: 'Metin rengi (açık)' },
    
    card: {
      background: { $type: 'color', $value: '225 6% 9%', $description: 'Kart arka planı (koyu)' },
      foreground: { $type: 'color', $value: '216 14% 90%', $description: 'Kart metni (açık)' },
    },
    
    popover: {
      background: { $type: 'color', $value: '225 6% 9%', $description: 'Açılır menü (koyu)' },
      foreground: { $type: 'color', $value: '216 14% 90%', $description: 'Menü metni (açık)' },
    },
    
    primary: {
      background: { $type: 'color', $value: '39 100% 54%', $description: 'Ana buton (parlak) - ORANGE' },
      foreground: { $type: 'color', $value: '220 13% 9%', $description: 'Buton metni (koyu)' },
    },
    
    secondary: {
      background: { $type: 'color', $value: '228 5% 13%', $description: 'İkincil buton (koyu gri)' },
      foreground: { $type: 'color', $value: '216 14% 90%', $description: 'İkincil metin' },
    },
    
    muted: {
      background: { $type: 'color', $value: '228 6% 10%', $description: 'Soluk arka plan (daha koyu)' },
      foreground: { $type: 'color', $value: '216 10% 55%', $description: 'Yardımcı metin (orta)' },
    },
    
    accent: {
      background: { $type: 'color', $value: '39 100% 54%', $description: 'Vurgu (parlak) - ORANGE' },
      foreground: { $type: 'color', $value: '220 13% 9%', $description: 'Vurgu metni (koyu)' },
    },
    
    destructive: {
      background: { $type: 'color', $value: '0 63% 31%', $description: 'Hata/silme (koyu kırmızı)' },
      foreground: { $type: 'color', $value: '0 0% 98%', $description: 'Hata metni (beyaz)' },
    },
    
    success: {
      background: { $type: 'color', $value: '142 71% 45%', $description: 'Başarı (açık yeşil)' },
      foreground: { $type: 'color', $value: '144 61% 20%', $description: 'Başarı metni (koyu yeşil)' },
    },
    
    warning: {
      background: { $type: 'color', $value: '38 92% 50%', $description: 'Uyarı (parlak amber)' },
      foreground: { $type: 'color', $value: '26 83% 14%', $description: 'Uyarı metni (koyu)' },
    },
    
    info: {
      background: { $type: 'color', $value: '199 89% 48%', $description: 'Bilgi (parlak mavi)' },
      foreground: { $type: 'color', $value: '0 0% 100%', $description: 'Bilgi metni (beyaz)' },
    },
    
    border: { $type: 'color', $value: '228 5% 13%', $description: 'Kenarlıklar (koyu)' },
    input: { $type: 'color', $value: '228 5% 13%', $description: 'Input çerçevesi (koyu)' },
    ring: { $type: 'color', $value: '39 100% 54%', $description: 'Odaklanma (parlak) - ORANGE' },
    
    chart: {
      1: { $type: 'color', $value: '220 70% 50%', $description: 'Grafik 1 (mavi - koyu)' },
      2: { $type: 'color', $value: '160 60% 45%', $description: 'Grafik 2 (yeşil - koyu)' },
      3: { $type: 'color', $value: '30 80% 55%', $description: 'Grafik 3 (turuncu - koyu)' },
      4: { $type: 'color', $value: '280 65% 60%', $description: 'Grafik 4 (mor - koyu)' },
      5: { $type: 'color', $value: '340 75% 55%', $description: 'Grafik 5 (pembe - koyu)' },
    },
  },
};

export const publicDarkTokensProduction: DesignTokens = {
  ...publicDarkColors,
  ...spacingTokens,
  ...typographyTokens,
  ...shadowTokens,
  ...animationTokens,
  ...radiusTokens,
};

// ============================================================================
// PORTAL THEME (Same as Public for now)
// ============================================================================

export const portalLightTokensProduction = publicLightTokensProduction;
export const portalDarkTokensProduction = publicDarkTokensProduction;

// Export summary: All 6 theme token sets with complete design system tokens
// - Admin Light/Dark: Full color palette + shared tokens
// - Public Light/Dark: Full color palette + shared tokens
// - Portal Light/Dark: Aliases to Public themes

/**
 * Email Template Helper
 * Provides utilities for creating standardized email templates with design system integration
 */

import { getEmailDesignSystem } from '@/lib/email-design-tokens';
import { getSiteSettings } from '@/lib/server/siteSettings';
import type { EmailDesignSystem } from '@/lib/email-design-tokens';

export interface EmailTemplateConfig {
  // Email metadata
  preview: string;
  subject: string;

  // Design settings
  theme?: 'light' | 'dark';
  context?: 'public' | 'admin' | 'portal';

  // Display options
  showUnsubscribeLink?: boolean;
  unsubscribeToken?: string;
  showTagline?: boolean;
  locale?: 'tr' | 'en';
}

/**
 * Get complete email template data including site settings and design system
 */
export async function getEmailTemplateData(config: EmailTemplateConfig) {
  // Fetch site settings
  const siteSettings = await getSiteSettings();

  // Fetch design system
  const designSystem = await getEmailDesignSystem(
    config.context || 'public',
    config.theme || 'light'
  );

  // Build logo URL
  const logoUrl = config.theme === 'dark' && siteSettings.logoDarkUrl
    ? siteSettings.logoDarkUrl
    : siteSettings.logoUrl || '/logo.png';

  // Build contact info
  const contactInfo = {
    address: siteSettings.address || '',
    phone: siteSettings.phone || '',
    email: siteSettings.contactEmail || siteSettings.email || '',
  };

  // Build social media links
  const socialMediaLinks: Record<string, string> = {};
  if (siteSettings.socialMedia) {
    const social = siteSettings.socialMedia;
    if (social.facebook) socialMediaLinks.facebook = social.facebook;
    if (social.twitter) socialMediaLinks.twitter = social.twitter;
    if (social.instagram) socialMediaLinks.instagram = social.instagram;
    if (social.linkedin) socialMediaLinks.linkedin = social.linkedin;
    if (social.youtube) socialMediaLinks.youtube = social.youtube;
  }

  return {
    // Site settings
    companyName: siteSettings.companyName || 'XYZ Company',
    logoUrl,
    contactInfo,
    socialMediaLinks,
    tagline: siteSettings.tagline,

    // Email config
    preview: config.preview,
    showUnsubscribeLink: config.showUnsubscribeLink ?? true,
    unsubscribeToken: config.unsubscribeToken,
    showTagline: config.showTagline ?? false,
    locale: config.locale || 'tr',

    // Design system
    designSystem,
    theme: config.theme || 'light',
  };
}

/**
 * Generate inline styles for email content based on design system
 */
export function getEmailStyles(designSystem: EmailDesignSystem) {
  const { colors, typography, spacing, radius } = designSystem;

  return {
    // Typography styles
    h1: {
      color: colors.foreground,
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      marginTop: 0,
      marginBottom: spacing.md,
    },
    h2: {
      color: colors.foreground,
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.tight,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    h3: {
      color: colors.foreground,
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.normal,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    h4: {
      color: colors.foreground,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.normal,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    p: {
      color: colors.foreground,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.normal,
      marginTop: 0,
      marginBottom: spacing.sm,
    },
    small: {
      color: colors.mutedForeground,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.normal,
    },
    strong: {
      fontWeight: typography.fontWeight.bold,
    },

    // Link styles
    link: {
      color: colors.primary,
      textDecoration: 'underline',
    },

    // Button styles
    button: {
      primary: {
        backgroundColor: colors.primary,
        color: colors.primaryForeground,
        padding: `12px 24px`,
        borderRadius: radius.default,
        textDecoration: 'none',
        display: 'inline-block',
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
      },
      secondary: {
        backgroundColor: colors.secondary,
        color: colors.secondaryForeground,
        padding: `12px 24px`,
        borderRadius: radius.default,
        textDecoration: 'none',
        display: 'inline-block',
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
      },
      outline: {
        backgroundColor: 'transparent',
        color: colors.primary,
        border: `2px solid ${colors.primary}`,
        padding: `10px 22px`,
        borderRadius: radius.default,
        textDecoration: 'none',
        display: 'inline-block',
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
      },
    },

    // Container styles
    container: {
      maxWidth: '600px',
      margin: '0 auto',
      padding: spacing.md,
    },

    // Card styles
    card: {
      backgroundColor: colors.cardBackground,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },

    // Alert styles
    alert: {
      success: {
        backgroundColor: colors.success,
        color: colors.successForeground,
        padding: spacing.sm,
        borderRadius: radius.default,
        marginBottom: spacing.md,
      },
      warning: {
        backgroundColor: colors.warning,
        color: colors.warningForeground,
        padding: spacing.sm,
        borderRadius: radius.default,
        marginBottom: spacing.md,
      },
      error: {
        backgroundColor: colors.error,
        color: colors.errorForeground,
        padding: spacing.sm,
        borderRadius: radius.default,
        marginBottom: spacing.md,
      },
      info: {
        backgroundColor: colors.info,
        color: colors.infoForeground,
        padding: spacing.sm,
        borderRadius: radius.default,
        marginBottom: spacing.md,
      },
    },

    // Table styles
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginBottom: spacing.md,
    },
    th: {
      backgroundColor: colors.muted,
      color: colors.foreground,
      padding: spacing.sm,
      borderBottom: `2px solid ${colors.border}`,
      textAlign: 'left' as const,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
    },
    td: {
      padding: spacing.sm,
      borderBottom: `1px solid ${colors.border}`,
      fontSize: typography.fontSize.base,
      color: colors.foreground,
    },

    // List styles
    ul: {
      marginTop: 0,
      marginBottom: spacing.md,
      paddingLeft: spacing.md,
      color: colors.foreground,
    },
    ol: {
      marginTop: 0,
      marginBottom: spacing.md,
      paddingLeft: spacing.md,
      color: colors.foreground,
    },
    li: {
      marginBottom: spacing.xs,
      fontSize: typography.fontSize.base,
      lineHeight: typography.lineHeight.normal,
    },

    // Divider styles
    hr: {
      border: 'none',
      borderTop: `1px solid ${colors.border}`,
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
    },

    // Code styles
    code: {
      backgroundColor: colors.muted,
      color: colors.foreground,
      padding: '2px 4px',
      borderRadius: radius.sm,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize.sm,
    },
    pre: {
      backgroundColor: colors.muted,
      color: colors.foreground,
      padding: spacing.sm,
      borderRadius: radius.default,
      overflow: 'auto',
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize.sm,
      lineHeight: typography.lineHeight.normal,
    },

    // Utility styles
    textCenter: {
      textAlign: 'center' as const,
    },
    textLeft: {
      textAlign: 'left' as const,
    },
    textRight: {
      textAlign: 'right' as const,
    },
    textMuted: {
      color: colors.mutedForeground,
    },
    textPrimary: {
      color: colors.primary,
    },
    textSuccess: {
      color: colors.success,
    },
    textWarning: {
      color: colors.warning,
    },
    textError: {
      color: colors.error,
    },
    textInfo: {
      color: colors.info,
    },

    // Spacing utilities
    mt: {
      xs: { marginTop: spacing.xs },
      sm: { marginTop: spacing.sm },
      md: { marginTop: spacing.md },
      lg: { marginTop: spacing.lg },
      xl: { marginTop: spacing.xl },
    },
    mb: {
      xs: { marginBottom: spacing.xs },
      sm: { marginBottom: spacing.sm },
      md: { marginBottom: spacing.md },
      lg: { marginBottom: spacing.lg },
      xl: { marginBottom: spacing.xl },
    },
    pt: {
      xs: { paddingTop: spacing.xs },
      sm: { paddingTop: spacing.sm },
      md: { paddingTop: spacing.md },
      lg: { paddingTop: spacing.lg },
      xl: { paddingTop: spacing.xl },
    },
    pb: {
      xs: { paddingBottom: spacing.xs },
      sm: { paddingBottom: spacing.sm },
      md: { paddingBottom: spacing.md },
      lg: { paddingBottom: spacing.lg },
      xl: { paddingBottom: spacing.xl },
    },
  };
}

/**
 * Format currency for emails
 */
export function formatCurrency(amount: number, locale: 'tr' | 'en' = 'tr'): string {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: locale === 'tr' ? 'TRY' : 'USD',
  }).format(amount);
}

/**
 * Format date for emails
 */
export function formatDate(date: Date | string, locale: 'tr' | 'en' = 'tr'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Format time for emails
 */
export function formatTime(date: Date | string, locale: 'tr' | 'en' = 'tr'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Generate greeting based on time of day
 */
export function getGreeting(locale: 'tr' | 'en' = 'tr'): string {
  const hour = new Date().getHours();

  if (locale === 'tr') {
    if (hour < 6) return 'İyi geceler';
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    if (hour < 22) return 'İyi akşamlar';
    return 'İyi geceler';
  } else {
    if (hour < 6) return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    if (hour < 22) return 'Good evening';
    return 'Good night';
  }
}
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Button,
  Link,
  Img,
  Hr,
} from "@react-email/components";
import * as React from "react";
import type { EmailDesignSystem, EmailColorPalette } from "@/lib/email-design-tokens";

export interface EmailTemplateWithDesignProps {
  preview: string;
  children: React.ReactNode;

  // Company info
  companyName: string;
  logoUrl: string;
  contactInfo: {
    address: string;
    phone: string;
    email: string;
  };
  socialMediaLinks?: {
    [key: string]: string;
  };

  // Email settings
  showUnsubscribeLink?: boolean;
  unsubscribeToken?: string;
  showTagline?: boolean;
  tagline?: string;
  locale?: 'tr' | 'en';

  // Design System
  designSystem: EmailDesignSystem;
  theme?: 'light' | 'dark';
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002";

export const EmailTemplateWithDesign = ({
  preview,
  children,
  companyName,
  logoUrl,
  contactInfo,
  socialMediaLinks = {},
  showUnsubscribeLink = true,
  unsubscribeToken,
  showTagline = false,
  tagline,
  locale = 'tr',
  designSystem,
  theme = 'light',
}: EmailTemplateWithDesignProps) => {
  const { colors, typography, spacing, radius } = designSystem;

  // Translations
  const t = {
    unsubscribe: locale === 'tr' ? 'Abonelikten çık' : 'Unsubscribe',
    preferences: locale === 'tr' ? 'E-posta Tercihlerim' : 'Email Preferences',
    viewInBrowser: locale === 'tr' ? 'Bu e-postayı tarayıcıda görüntüle' : 'View this email in browser',
    emailLabel: locale === 'tr' ? 'Email: ' : 'Email: ',
    phoneLabel: locale === 'tr' ? 'Telefon: ' : 'Phone: ',
  };

  // Dynamic styles based on design tokens
  const styles = {
    body: {
      backgroundColor: colors.background,
      fontFamily: typography.fontFamily,
    },
    container: {
      backgroundColor: colors.cardBackground,
      margin: '0 auto',
      padding: '20px 0 48px',
    },
    header: {
      textAlign: 'center' as const,
      padding: `${spacing.lg} ${spacing.md}`,
    },
    logo: {
      margin: '0 auto',
      marginBottom: spacing.md,
    },
    tagline: {
      fontSize: typography.fontSize.sm,
      color: colors.mutedForeground,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.normal,
      margin: `${spacing.sm} 0`,
    },
    main: {
      backgroundColor: colors.cardBackground,
      borderRadius: radius.md,
      padding: spacing.lg,
    },
    h1: {
      color: colors.foreground,
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      margin: `0 0 ${spacing.md}`,
      textAlign: 'center' as const,
    },
    h2: {
      color: colors.foreground,
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      margin: `${spacing.md} 0 ${spacing.sm}`,
    },
    h3: {
      color: colors.foreground,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.medium,
      margin: `${spacing.sm} 0`,
    },
    paragraph: {
      color: colors.foreground,
      fontSize: typography.fontSize.base,
      lineHeight: typography.lineHeight.normal,
      margin: `0 0 ${spacing.sm}`,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.default,
      color: colors.primaryForeground,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      textDecoration: 'none',
      textAlign: 'center' as const,
      display: 'block',
      padding: `12px 24px`,
      margin: `${spacing.md} 0`,
    },
    buttonSecondary: {
      backgroundColor: colors.secondary,
      borderRadius: radius.default,
      color: colors.secondaryForeground,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      textDecoration: 'none',
      textAlign: 'center' as const,
      display: 'block',
      padding: `12px 24px`,
      margin: `${spacing.md} 0`,
    },
    link: {
      color: colors.primary,
      textDecoration: 'underline',
    },
    hr: {
      borderColor: colors.border,
      margin: `${spacing.lg} 0`,
    },
    footer: {
      color: colors.mutedForeground,
      fontSize: typography.fontSize.xs,
      lineHeight: typography.lineHeight.normal,
      textAlign: 'center' as const,
      marginTop: spacing.lg,
    },
    footerLink: {
      color: colors.mutedForeground,
      textDecoration: 'underline',
    },
    socialContainer: {
      textAlign: 'center' as const,
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
    socialIcon: {
      display: 'inline-block',
      margin: `0 ${spacing.xs}`,
    },
    viewInBrowser: {
      textAlign: 'center' as const,
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      marginBottom: spacing.md,
    },
    card: {
      backgroundColor: colors.cardBackground,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    alert: {
      padding: spacing.sm,
      borderRadius: radius.default,
      marginBottom: spacing.md,
    },
    alertSuccess: {
      backgroundColor: colors.success,
      color: colors.successForeground,
    },
    alertWarning: {
      backgroundColor: colors.warning,
      color: colors.warningForeground,
    },
    alertError: {
      backgroundColor: colors.error,
      color: colors.errorForeground,
    },
    alertInfo: {
      backgroundColor: colors.info,
      color: colors.infoForeground,
    },
  };

  return (
    <Html>
      <Head>
        <style>{`
          /* Email Design System Styles */
          body {
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }

          table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
          }

          img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            -ms-interpolation-mode: bicubic;
          }

          /* Mobile styles */
          @media only screen and (max-width: 600px) {
            .container {
              width: 100% !important;
              padding: 10px !important;
            }
            .main {
              padding: 20px !important;
            }
            h1 {
              font-size: 24px !important;
            }
            h2 {
              font-size: 20px !important;
            }
            .button {
              width: 100% !important;
            }
          }

          /* Dark mode support */
          @media (prefers-color-scheme: dark) {
            ${theme === 'dark' ? `
              body {
                background-color: ${colors.background} !important;
                color: ${colors.foreground} !important;
              }
              .container {
                background-color: ${colors.cardBackground} !important;
              }
              .card {
                background-color: ${colors.cardBackground} !important;
                border-color: ${colors.border} !important;
              }
            ` : ''}
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container className="container" style={styles.container}>
          {/* View in browser link */}
          <Section style={styles.viewInBrowser}>
            <Link href={`${baseUrl}/email/view`} style={styles.footerLink}>
              {t.viewInBrowser}
            </Link>
          </Section>

          {/* Header with logo */}
          <Section style={styles.header}>
            <Img
              src={logoUrl}
              width="150"
              height="50"
              alt={companyName}
              style={styles.logo}
            />
            {showTagline && tagline && (
              <Text style={styles.tagline}>{tagline}</Text>
            )}
          </Section>

          {/* Main content area */}
          <Section className="main" style={styles.main}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            {/* Social Media Icons */}
            {Object.keys(socialMediaLinks).length > 0 && (
              <Section style={styles.socialContainer}>
                <Row>
                  {Object.entries(socialMediaLinks)
                    .filter(([_, url]) => url)
                    .map(([platform, url]) => (
                      <Column key={platform} align="center" style={styles.socialIcon}>
                        <Link href={url as string}>
                          <Img
                            src={`https://static.cdn.person.io/images/social/${platform.toLowerCase()}-logo-2x.png`}
                            width="24"
                            height="24"
                            alt={platform}
                          />
                        </Link>
                      </Column>
                    ))}
                </Row>
              </Section>
            )}

            <Hr style={styles.hr} />

            {/* Contact Information */}
            <Text style={styles.footer}>
              {companyName} • {contactInfo.address}
            </Text>
            <Text style={styles.footer}>
              {t.emailLabel}
              <Link href={`mailto:${contactInfo.email}`} style={styles.footerLink}>
                {contactInfo.email}
              </Link>
              {' • '}
              {t.phoneLabel}
              {contactInfo.phone}
            </Text>

            {/* Unsubscribe and Preferences Links */}
            {showUnsubscribeLink && (
              <Text style={styles.footer}>
                <Link
                  href={unsubscribeToken
                    ? `${baseUrl}/unsubscribe?token=${unsubscribeToken}`
                    : `${baseUrl}/preferences`
                  }
                  style={styles.footerLink}
                >
                  {t.unsubscribe}
                </Link>
                {' • '}
                <Link href={`${baseUrl}/preferences`} style={styles.footerLink}>
                  {t.preferences}
                </Link>
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

/**
 * Utility components for common email patterns
 */

// Primary Button Component
export const EmailButton = ({
  href,
  children,
  variant = 'primary',
  designSystem,
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  designSystem: EmailDesignSystem;
}) => {
  const { colors, typography, radius } = designSystem;

  const style = variant === 'primary'
    ? {
        backgroundColor: colors.primary,
        color: colors.primaryForeground,
      }
    : {
        backgroundColor: colors.secondary,
        color: colors.secondaryForeground,
      };

  return (
    <Button
      href={href}
      style={{
        ...style,
        borderRadius: radius.default,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        textDecoration: 'none',
        textAlign: 'center' as const,
        display: 'inline-block',
        padding: '12px 24px',
      }}
    >
      {children}
    </Button>
  );
};

// Alert Component
export const EmailAlert = ({
  children,
  variant = 'info',
  designSystem,
}: {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info';
  designSystem: EmailDesignSystem;
}) => {
  const { colors, spacing, radius } = designSystem;

  const variantStyles = {
    success: {
      backgroundColor: colors.success,
      color: colors.successForeground,
    },
    warning: {
      backgroundColor: colors.warning,
      color: colors.warningForeground,
    },
    error: {
      backgroundColor: colors.error,
      color: colors.errorForeground,
    },
    info: {
      backgroundColor: colors.info,
      color: colors.infoForeground,
    },
  };

  return (
    <Section
      style={{
        ...variantStyles[variant],
        padding: spacing.sm,
        borderRadius: radius.default,
        marginBottom: spacing.md,
      }}
    >
      {children}
    </Section>
  );
};

// Card Component
export const EmailCard = ({
  children,
  designSystem,
}: {
  children: React.ReactNode;
  designSystem: EmailDesignSystem;
}) => {
  const { colors, spacing, radius } = designSystem;

  return (
    <Section
      style={{
        backgroundColor: colors.cardBackground,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
      }}
    >
      {children}
    </Section>
  );
};
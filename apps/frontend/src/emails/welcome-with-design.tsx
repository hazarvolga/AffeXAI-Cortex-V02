import { Text, Section, Button, Heading, Hr, Link, Row, Column, Img } from "@react-email/components";
import * as React from "react";
import { EmailTemplateWithDesign, EmailAlert, EmailCard, EmailButton } from "./components/EmailTemplateWithDesignSystem";
import { getEmailTemplateData, getEmailStyles, getGreeting } from "./helpers/email-template-helper";

export interface WelcomeEmailProps {
  userName: string;
  userEmail: string;
  dashboardUrl?: string;
  unsubscribeToken?: string;
  locale?: 'tr' | 'en';
}

export const WelcomeEmailWithDesign = async ({
  userName,
  userEmail,
  dashboardUrl = '/dashboard',
  unsubscribeToken,
  locale = 'tr',
}: WelcomeEmailProps) => {
  // Get template data with design system
  const templateData = await getEmailTemplateData({
    preview: locale === 'tr'
      ? "Aramıza hoş geldiniz!"
      : "Welcome aboard!",
    subject: locale === 'tr'
      ? `Hoş Geldiniz ${userName}!`
      : `Welcome ${userName}!`,
    theme: 'light',
    context: 'public',
    showUnsubscribeLink: true, // Marketing email
    unsubscribeToken,
    locale,
  });

  const { designSystem, socialMediaLinks } = templateData;
  const styles = getEmailStyles(designSystem);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002";

  // Translations
  const t = {
    greeting: getGreeting(locale),
    title: locale === 'tr' ? "Aramıza Hoş Geldiniz!" : "Welcome to Our Community!",
    intro: locale === 'tr'
      ? "Ailemize katıldığınız için çok mutluyuz! Sizin için hazırladığımız harika özellikleri keşfetmeye hazır mısınız?"
      : "We're thrilled to have you join our family! Ready to explore the amazing features we've prepared for you?",
    getStarted: locale === 'tr' ? "Başlangıç Rehberi" : "Getting Started",
    step1Title: locale === 'tr' ? "Profilinizi Tamamlayın" : "Complete Your Profile",
    step1Desc: locale === 'tr'
      ? "Kişiselleştirilmiş deneyim için profilinizi güncelleyin"
      : "Update your profile for a personalized experience",
    step2Title: locale === 'tr' ? "İlk Projenizi Oluşturun" : "Create Your First Project",
    step2Desc: locale === 'tr'
      ? "Hemen ilk projenizi oluşturup çalışmaya başlayın"
      : "Start working by creating your first project",
    step3Title: locale === 'tr' ? "Ekibinizi Davet Edin" : "Invite Your Team",
    step3Desc: locale === 'tr'
      ? "Ekip arkadaşlarınızı davet ederek birlikte çalışın"
      : "Collaborate by inviting your team members",
    features: locale === 'tr' ? "Öne Çıkan Özellikler" : "Key Features",
    feature1: locale === 'tr' ? "🚀 Hızlı ve güvenli altyapı" : "🚀 Fast and secure infrastructure",
    feature2: locale === 'tr' ? "📊 Detaylı analiz ve raporlama" : "📊 Detailed analytics and reporting",
    feature3: locale === 'tr' ? "🔧 Kolay entegrasyon" : "🔧 Easy integration",
    feature4: locale === 'tr' ? "💬 7/24 destek" : "💬 24/7 support",
    ctaButton: locale === 'tr' ? "Dashboard'a Git" : "Go to Dashboard",
    needHelp: locale === 'tr' ? "Yardıma mı İhtiyacınız Var?" : "Need Help?",
    helpText: locale === 'tr'
      ? "Sorularınız veya önerileriniz için bizimle iletişime geçebilirsiniz:"
      : "Feel free to contact us with any questions or suggestions:",
    documentation: locale === 'tr' ? "Dokümantasyon" : "Documentation",
    support: locale === 'tr' ? "Destek Merkezi" : "Support Center",
    community: locale === 'tr' ? "Topluluk" : "Community",
    followUs: locale === 'tr' ? "Bizi Takip Edin" : "Follow Us",
    thankYou: locale === 'tr'
      ? "Bizi tercih ettiğiniz için teşekkür ederiz!"
      : "Thank you for choosing us!",
  };

  return (
    <EmailTemplateWithDesign {...templateData}>
      {/* Welcome Banner - Improved spacing and padding */}
      <Section style={{ 
        textAlign: 'center', 
        marginBottom: designSystem.spacing.xl,
        padding: `${designSystem.spacing.md} ${designSystem.spacing.sm}`,
      }}>
        <Text style={{ fontSize: '48px', margin: 0, lineHeight: '1' }}>🎉</Text>
        <Heading as="h1" style={{ 
          ...styles.h1, 
          fontSize: '32px', 
          marginTop: designSystem.spacing.md,
          marginBottom: 0,
          color: designSystem.colors.foreground, // Dark mode safe
        }}>
          {t.title}
        </Heading>
      </Section>

      {/* Greeting - Added padding for edge spacing */}
      <Section style={{ padding: `0 ${designSystem.spacing.md}` }}>
        <Text style={{
          ...styles.p,
          color: designSystem.colors.foreground, // Dark mode safe
          marginBottom: designSystem.spacing.sm,
        }}>
          {t.greeting} {userName},
        </Text>

        {/* Introduction - Improved readability */}
        <Text style={{ 
          ...styles.p, 
          fontSize: designSystem.typography.fontSize.base, 
          lineHeight: designSystem.typography.lineHeight.relaxed,
          color: designSystem.colors.foreground, // Dark mode safe
          marginBottom: designSystem.spacing.lg,
        }}>
          {t.intro}
        </Text>
      </Section>

      {/* Getting Started Steps - Improved spacing and contrast */}
      <Section style={{ 
        marginTop: designSystem.spacing.lg,
        marginBottom: designSystem.spacing.lg,
        padding: `0 ${designSystem.spacing.md}`,
      }}>
        <Heading as="h2" style={{
          ...styles.h2,
          color: designSystem.colors.foreground,
          marginBottom: designSystem.spacing.md,
        }}>
          📝 {t.getStarted}
        </Heading>

        <EmailCard designSystem={designSystem}>
          <div style={{ marginBottom: designSystem.spacing.md }}>
            <Text style={{ 
              ...styles.p, 
              fontWeight: designSystem.typography.fontWeight.semibold,
              marginBottom: designSystem.spacing.xs,
              color: designSystem.colors.foreground,
            }}>
              1. {t.step1Title}
            </Text>
            <Text style={{ 
              ...styles.small, 
              color: designSystem.colors.mutedForeground,
              margin: 0,
              lineHeight: designSystem.typography.lineHeight.normal,
            }}>
              {t.step1Desc}
            </Text>
          </div>

          <div style={{ marginBottom: designSystem.spacing.md }}>
            <Text style={{ 
              ...styles.p, 
              fontWeight: designSystem.typography.fontWeight.semibold,
              marginBottom: designSystem.spacing.xs,
              color: designSystem.colors.foreground,
            }}>
              2. {t.step2Title}
            </Text>
            <Text style={{ 
              ...styles.small, 
              color: designSystem.colors.mutedForeground,
              margin: 0,
              lineHeight: designSystem.typography.lineHeight.normal,
            }}>
              {t.step2Desc}
            </Text>
          </div>

          <div>
            <Text style={{ 
              ...styles.p, 
              fontWeight: designSystem.typography.fontWeight.semibold,
              marginBottom: designSystem.spacing.xs,
              color: designSystem.colors.foreground,
            }}>
              3. {t.step3Title}
            </Text>
            <Text style={{ 
              ...styles.small, 
              color: designSystem.colors.mutedForeground,
              margin: 0,
              lineHeight: designSystem.typography.lineHeight.normal,
            }}>
              {t.step3Desc}
            </Text>
          </div>
        </EmailCard>
      </Section>

      {/* Key Features - Better padding and list styling */}
      <Section style={{ 
        marginBottom: designSystem.spacing.xl,
        padding: `0 ${designSystem.spacing.md}`,
      }}>
        <Heading as="h2" style={{
          ...styles.h2,
          color: designSystem.colors.foreground,
          marginBottom: designSystem.spacing.md,
        }}>
          ⭐ {t.features}
        </Heading>

        <EmailAlert variant="info" designSystem={designSystem}>
          <ul style={{ 
            margin: 0, 
            paddingLeft: designSystem.spacing.md,
            color: 'inherit',
            lineHeight: designSystem.typography.lineHeight.relaxed,
          }}>
            <li style={{ marginBottom: designSystem.spacing.xs }}>{t.feature1}</li>
            <li style={{ marginBottom: designSystem.spacing.xs }}>{t.feature2}</li>
            <li style={{ marginBottom: designSystem.spacing.xs }}>{t.feature3}</li>
            <li>{t.feature4}</li>
          </ul>
        </EmailAlert>
      </Section>

      {/* CTA Button - Responsive padding */}
      <Section style={{ 
        textAlign: 'center', 
        marginTop: designSystem.spacing['2xl'],
        marginBottom: designSystem.spacing['2xl'],
        padding: `0 ${designSystem.spacing.md}`,
      }}>
        <Button
          href={`${baseUrl}${dashboardUrl}`}
          style={{
            ...styles.button.primary,
            padding: `${designSystem.spacing.md} ${designSystem.spacing['2xl']}`,
            fontSize: designSystem.typography.fontSize.lg,
            fontWeight: designSystem.typography.fontWeight.bold,
            width: '100%',
            maxWidth: '300px',
            boxSizing: 'border-box' as const,
          }}
        >
          {t.ctaButton} →
        </Button>
      </Section>

      <Hr style={{
        ...styles.hr,
        borderColor: designSystem.colors.border,
        margin: `${designSystem.spacing.xl} ${designSystem.spacing.md}`,
      }} />

      {/* Help Resources - Improved spacing and readability */}
      <Section style={{ 
        marginTop: designSystem.spacing.lg,
        padding: `0 ${designSystem.spacing.md}`,
      }}>
        <Heading as="h3" style={{ 
          ...styles.h3, 
          textAlign: 'center' as const,
          color: designSystem.colors.foreground,
          marginBottom: designSystem.spacing.sm,
        }}>
          {t.needHelp}
        </Heading>
        <Text style={{ 
          ...styles.p, 
          textAlign: 'center' as const,
          color: designSystem.colors.foreground,
          marginBottom: designSystem.spacing.md,
        }}>
          {t.helpText}
        </Text>

        <Section style={{ 
          textAlign: 'center', 
          marginTop: designSystem.spacing.md,
        }}>
          <Link
            href={`${baseUrl}/docs`}
            style={{
              ...styles.link,
              marginRight: designSystem.spacing.md,
              fontSize: designSystem.typography.fontSize.sm,
              display: 'inline-block',
              marginBottom: designSystem.spacing.xs,
            }}
          >
            📚 {t.documentation}
          </Link>
          <Link
            href={`${baseUrl}/support`}
            style={{
              ...styles.link,
              marginRight: designSystem.spacing.md,
              fontSize: designSystem.typography.fontSize.sm,
              display: 'inline-block',
              marginBottom: designSystem.spacing.xs,
            }}
          >
            💬 {t.support}
          </Link>
          <Link
            href={`${baseUrl}/community`}
            style={{
              ...styles.link,
              fontSize: designSystem.typography.fontSize.sm,
              display: 'inline-block',
              marginBottom: designSystem.spacing.xs,
            }}
          >
            👥 {t.community}
          </Link>
        </Section>
      </Section>

      {/* Social Media Section - NEW */}
      <Section style={{
        marginTop: designSystem.spacing.xl,
        marginBottom: designSystem.spacing.lg,
        textAlign: 'center',
        padding: `0 ${designSystem.spacing.md}`,
      }}>
        <Heading as="h3" style={{
          ...styles.h3,
          textAlign: 'center' as const,
          color: designSystem.colors.foreground,
          marginBottom: designSystem.spacing.md,
          fontSize: designSystem.typography.fontSize.base,
        }}>
          {t.followUs}
        </Heading>
        
        {/* Social Media Icons */}
        <Row style={{ textAlign: 'center' }}>
          {socialMediaLinks.linkedin && (
            <Column style={{ 
              display: 'inline-block',
              padding: `0 ${designSystem.spacing.sm}`,
            }}>
              <Link href={socialMediaLinks.linkedin}>
                <Img
                  src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                  width="32"
                  height="32"
                  alt="LinkedIn"
                  style={{
                    display: 'block',
                    margin: '0 auto',
                  }}
                />
              </Link>
            </Column>
          )}
          {socialMediaLinks.instagram && (
            <Column style={{ 
              display: 'inline-block',
              padding: `0 ${designSystem.spacing.sm}`,
            }}>
              <Link href={socialMediaLinks.instagram}>
                <Img
                  src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
                  width="32"
                  height="32"
                  alt="Instagram"
                  style={{
                    display: 'block',
                    margin: '0 auto',
                  }}
                />
              </Link>
            </Column>
          )}
          {socialMediaLinks.twitter && (
            <Column style={{ 
              display: 'inline-block',
              padding: `0 ${designSystem.spacing.sm}`,
            }}>
              <Link href={socialMediaLinks.twitter}>
                <Img
                  src="https://cdn-icons-png.flaticon.com/512/5969/5969020.png"
                  width="32"
                  height="32"
                  alt="X (Twitter)"
                  style={{
                    display: 'block',
                    margin: '0 auto',
                  }}
                />
              </Link>
            </Column>
          )}
        </Row>
      </Section>

      {/* Thank You - Improved contrast for dark mode */}
      <Section style={{ 
        marginTop: designSystem.spacing.xl,
        marginBottom: designSystem.spacing.md,
        textAlign: 'center',
        padding: `0 ${designSystem.spacing.md}`,
      }}>
        <Text style={{
          ...styles.p,
          fontSize: designSystem.typography.fontSize.lg,
          fontWeight: designSystem.typography.fontWeight.bold,
          color: designSystem.colors.primary,
          marginBottom: designSystem.spacing.xs,
        }}>
          {t.thankYou}
        </Text>
        <Text style={{ 
          fontSize: designSystem.typography.fontSize.sm,
          color: designSystem.colors.mutedForeground,
          margin: 0,
        }}>
          {templateData.companyName} Team
        </Text>
      </Section>
    </EmailTemplateWithDesign>
  );
};

// Default export for testing
export default WelcomeEmailWithDesign;

import { Text, Section, Button, Heading, Hr } from "@react-email/components";
import * as React from "react";
import { EmailTemplateWithDesign, EmailAlert, EmailCard } from "./components/EmailTemplateWithDesignSystem";
import { getEmailTemplateData, getEmailStyles, getGreeting } from "./helpers/email-template-helper";

export interface PasswordResetEmailProps {
  resetUrl: string;
  userEmail?: string;
  userName?: string;
  locale?: 'tr' | 'en';
}

export const PasswordResetEmailWithDesign = async ({
  resetUrl,
  userEmail,
  userName,
  locale = 'tr',
}: PasswordResetEmailProps) => {
  // Get template data with design system
  const templateData = await getEmailTemplateData({
    preview: locale === 'tr'
      ? "Şifrenizi sıfırlayın"
      : "Reset your password",
    subject: locale === 'tr'
      ? "Şifre Sıfırlama Talebi"
      : "Password Reset Request",
    theme: 'light',
    context: 'public',
    showUnsubscribeLink: false, // Transactional email
    locale,
  });

  const { designSystem } = templateData;
  const styles = getEmailStyles(designSystem);

  // Translations
  const t = {
    greeting: getGreeting(locale),
    title: locale === 'tr' ? "Şifre Sıfırlama Talebi" : "Password Reset Request",
    hello: locale === 'tr' ? "Merhaba" : "Hello",
    intro: locale === 'tr'
      ? "Hesabınız için şifre sıfırlama talebinde bulunuldu. Aşağıdaki butona tıklayarak yeni şifrenizi oluşturabilirsiniz."
      : "A password reset was requested for your account. Click the button below to create your new password.",
    button: locale === 'tr' ? "Şifremi Sıfırla" : "Reset Password",
    linkText: locale === 'tr'
      ? "Butona tıklayamıyorsanız, aşağıdaki bağlantıyı tarayıcınıza kopyalayın:"
      : "If you can't click the button, copy this link to your browser:",
    warning: locale === 'tr'
      ? "Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz. Şifreniz değiştirilmeyecektir."
      : "If you didn't request this, you can safely ignore this email. Your password won't be changed.",
    expiry: locale === 'tr'
      ? "Bu bağlantı 24 saat içinde geçerliliğini yitirecektir."
      : "This link will expire in 24 hours.",
    security: locale === 'tr' ? "Güvenlik İpucu" : "Security Tip",
    securityText: locale === 'tr'
      ? "Güvenliğiniz için, şifrenizi düzenli olarak değiştirin ve başkalarıyla paylaşmayın."
      : "For your security, change your password regularly and never share it with others.",
    questions: locale === 'tr'
      ? "Sorularınız mı var?"
      : "Have questions?",
    contact: locale === 'tr'
      ? "Yardıma ihtiyacınız varsa, destek ekibimizle iletişime geçebilirsiniz."
      : "If you need help, contact our support team.",
  };

  return (
    <EmailTemplateWithDesign {...templateData}>
      {/* Greeting */}
      <Heading as="h1" style={styles.h1}>
        {t.greeting} {userName || userEmail || ''}
      </Heading>

      {/* Title */}
      <Heading as="h2" style={{ ...styles.h2, ...styles.textCenter }}>
        {t.title}
      </Heading>

      {/* Introduction */}
      <Text style={styles.p}>
        {t.intro}
      </Text>

      {/* Expiry Notice */}
      <EmailAlert variant="warning" designSystem={designSystem}>
        <Text style={{ margin: 0, color: 'inherit' }}>
          <strong>{locale === 'tr' ? "Önemli:" : "Important:"}</strong> {t.expiry}
        </Text>
      </EmailAlert>

      {/* Reset Button */}
      <Section style={{ textAlign: 'center', marginTop: '32px', marginBottom: '32px' }}>
        <Button
          href={resetUrl}
          style={{
            ...styles.button.primary,
            padding: '14px 32px',
            fontSize: '16px',
          }}
        >
          {t.button}
        </Button>
      </Section>

      {/* Alternative Link */}
      <EmailCard designSystem={designSystem}>
        <Text style={{ ...styles.small, marginBottom: '8px' }}>
          {t.linkText}
        </Text>
        <Text style={{
          ...styles.code,
          wordBreak: 'break-all',
          display: 'block',
          padding: '8px',
        }}>
          {resetUrl}
        </Text>
      </EmailCard>

      <Hr style={styles.hr} />

      {/* Security Notice */}
      <Section>
        <Heading as="h3" style={styles.h3}>
          🔒 {t.security}
        </Heading>
        <Text style={{ ...styles.p, ...styles.textMuted }}>
          {t.securityText}
        </Text>
      </Section>

      {/* Ignore Notice */}
      <EmailAlert variant="info" designSystem={designSystem}>
        <Text style={{ margin: 0, color: 'inherit' }}>
          {t.warning}
        </Text>
      </EmailAlert>

      {/* Support */}
      <Section style={{ marginTop: '32px' }}>
        <Text style={{ ...styles.small, ...styles.textCenter, ...styles.textMuted }}>
          {t.questions} {t.contact}
        </Text>
      </Section>
    </EmailTemplateWithDesign>
  );
};

// Default export for testing
export default PasswordResetEmailWithDesign;
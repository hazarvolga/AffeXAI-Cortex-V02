import { Text, Section, Button, Heading, Hr } from "@react-email/components";
import * as React from "react";
import { EmailTemplateWithDesign, EmailAlert, EmailCard } from "./components/EmailTemplateWithDesignSystem";
import { getEmailTemplateData, getEmailStyles, getGreeting } from "./helpers/email-template-helper";

export interface EmailVerificationProps {
  verificationUrl: string;
  userEmail: string;
  userName?: string;
  verificationCode?: string;
  locale?: 'tr' | 'en';
}

export const EmailVerificationWithDesign = async ({
  verificationUrl,
  userEmail,
  userName,
  verificationCode,
  locale = 'tr',
}: EmailVerificationProps) => {
  // Get template data with design system
  const templateData = await getEmailTemplateData({
    preview: locale === 'tr'
      ? "E-posta adresinizi doğrulayın"
      : "Verify your email address",
    subject: locale === 'tr'
      ? "E-posta Doğrulama"
      : "Email Verification",
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
    title: locale === 'tr' ? "E-posta Adresinizi Doğrulayın" : "Verify Your Email Address",
    hello: locale === 'tr' ? "Merhaba" : "Hello",
    intro: locale === 'tr'
      ? "Hesabınızı aktifleştirmek için e-posta adresinizi doğrulamanız gerekmektedir."
      : "Please verify your email address to activate your account.",
    button: locale === 'tr' ? "E-postamı Doğrula" : "Verify Email",
    codeTitle: locale === 'tr' ? "Doğrulama Kodu" : "Verification Code",
    codeIntro: locale === 'tr'
      ? "Alternatif olarak, aşağıdaki doğrulama kodunu kullanabilirsiniz:"
      : "Alternatively, you can use the verification code below:",
    linkText: locale === 'tr'
      ? "Butona tıklayamıyorsanız, aşağıdaki bağlantıyı tarayıcınıza kopyalayın:"
      : "If you can't click the button, copy this link to your browser:",
    expiry: locale === 'tr'
      ? "Bu doğrulama bağlantısı 48 saat içinde geçerliliğini yitirecektir."
      : "This verification link will expire in 48 hours.",
    benefits: locale === 'tr' ? "Hesabınızı doğruladıktan sonra:" : "After verifying your account:",
    benefit1: locale === 'tr'
      ? "Tüm özelliklere erişebileceksiniz"
      : "Access all features",
    benefit2: locale === 'tr'
      ? "Güvenlik bildirimleri alabileceksiniz"
      : "Receive security notifications",
    benefit3: locale === 'tr'
      ? "Kişiselleştirilmiş deneyim yaşayacaksınız"
      : "Enjoy a personalized experience",
    notYou: locale === 'tr'
      ? "Bu hesabı siz oluşturmadıysanız, bu e-postayı görmezden gelebilirsiniz."
      : "If you didn't create this account, you can safely ignore this email.",
    security: locale === 'tr' ? "Güvenlik Notu" : "Security Note",
    securityText: locale === 'tr'
      ? "Bu doğrulama işlemi hesabınızın güvenliği için zorunludur. Doğrulama linki veya kodu kimseyle paylaşmayın."
      : "This verification is required for your account security. Never share your verification link or code.",
  };

  return (
    <EmailTemplateWithDesign {...templateData}>
      {/* Greeting */}
      <Heading as="h1" style={styles.h1}>
        {t.greeting} {userName || userEmail}!
      </Heading>

      {/* Title */}
      <Heading as="h2" style={{ ...styles.h2, ...styles.textCenter }}>
        ✉️ {t.title}
      </Heading>

      {/* Introduction */}
      <Text style={styles.p}>
        {t.intro}
      </Text>

      {/* Benefits */}
      <EmailCard designSystem={designSystem}>
        <Text style={{ ...styles.p, fontWeight: styles.strong.fontWeight, marginBottom: '12px' }}>
          {t.benefits}
        </Text>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>✅ {t.benefit1}</li>
          <li style={{ marginBottom: '8px' }}>🔔 {t.benefit2}</li>
          <li style={{ marginBottom: '8px' }}>⭐ {t.benefit3}</li>
        </ul>
      </EmailCard>

      {/* Verify Button */}
      <Section style={{ textAlign: 'center', marginTop: '32px', marginBottom: '32px' }}>
        <Button
          href={verificationUrl}
          style={{
            ...styles.button.primary,
            padding: '14px 32px',
            fontSize: '16px',
          }}
        >
          {t.button}
        </Button>
      </Section>

      {/* Verification Code (if provided) */}
      {verificationCode && (
        <EmailAlert variant="info" designSystem={designSystem}>
          <Text style={{ margin: 0, fontWeight: 'bold', marginBottom: '8px' }}>
            {t.codeTitle}
          </Text>
          <Text style={{ margin: 0, fontSize: '12px', marginBottom: '8px' }}>
            {t.codeIntro}
          </Text>
          <Text style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            textAlign: 'center' as const,
          }}>
            {verificationCode}
          </Text>
        </EmailAlert>
      )}

      {/* Alternative Link */}
      <Section style={{ marginTop: '24px' }}>
        <Text style={{ ...styles.small, marginBottom: '8px', color: styles.textMuted.color }}>
          {t.linkText}
        </Text>
        <Text style={{
          ...styles.code,
          wordBreak: 'break-all',
          display: 'block',
          padding: '8px',
        }}>
          {verificationUrl}
        </Text>
      </Section>

      {/* Expiry Notice */}
      <EmailAlert variant="warning" designSystem={designSystem}>
        <Text style={{ margin: 0, color: 'inherit' }}>
          ⏰ {t.expiry}
        </Text>
      </EmailAlert>

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
      <Section style={{ marginTop: '24px' }}>
        <Text style={{ ...styles.small, ...styles.textCenter, ...styles.textMuted }}>
          {t.notYou}
        </Text>
      </Section>
    </EmailTemplateWithDesign>
  );
};

// Default export for testing
export default EmailVerificationWithDesign;
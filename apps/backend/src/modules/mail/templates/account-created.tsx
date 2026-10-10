import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";
import { EmailFooter } from "../components/EmailFooter";

interface AccountCreatedEmailProps {
  userName?: string;
  userEmail?: string;
  resetPasswordUrl?: string;
  siteSettings?: {
    companyName: string;
    logoUrl: string;
    contact: {
      address: string;
      phone: string;
      email: string;
    };
    socialMedia: {
      [key: string]: string;
    };
  };
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9003";

export const AccountCreatedEmail = ({
  userName = 'Değerli Kullanıcı',
  userEmail = 'kullanici@example.com',
  resetPasswordUrl = `${baseUrl}/reset-password`,
  siteSettings,
}: AccountCreatedEmailProps) => {
  const companyName = siteSettings?.companyName || 'AffeXAI Cortex';
  const logoUrl = siteSettings?.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || { email: 'support@affexai.com', phone: '', address: '' };
  const socialMediaLinks = siteSettings?.socialMedia || {};

  const previewText = `${companyName} hesabınız oluşturuldu`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src={logoUrl}
              width="150"
              height="auto"
              alt={companyName}
            />
          </Section>
          <Section style={content}>
            <Text style={title}>
              Hesabınız Oluşturuldu
            </Text>
            <Text style={paragraph}>
              Merhaba {userName},
            </Text>
            <Text style={paragraph}>
              {companyName} platformunda sizin için bir hesap oluşturuldu. Hesabınıza giriş yapmak için önce şifrenizi belirlemeniz gerekmektedir.
            </Text>

            <Section style={infoBox}>
              <Text style={infoLabel}>E-posta Adresiniz:</Text>
              <Text style={infoValue}>{userEmail}</Text>
            </Section>

            <Text style={paragraph}>
              Şifrenizi belirlemek için aşağıdaki butona tıklayın:
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={resetPasswordUrl}>
                Şifremi Belirle
              </Button>
            </Section>

            <Text style={smallText}>
              Veya bu linki tarayıcınıza kopyalayın:
              <br />
              <Link href={resetPasswordUrl} style={link}>
                {resetPasswordUrl}
              </Link>
            </Text>

            <Hr style={hr} />

            <Text style={paragraph}>
              Şifrenizi belirledikten sonra platformumuza giriş yapabilir ve tüm özelliklerden yararlanabilirsiniz.
            </Text>

            <Text style={paragraph}>
              Eğer bu e-postayı siz talep etmediyseniz, lütfen görmezden gelin veya {contactInfo.email} adresinden bizimle iletişime geçin.
            </Text>

            <Text style={paragraph}>
              İyi çalışmalar,
              <br />
              {companyName} Ekibi
            </Text>
          </Section>

          <EmailFooter
            companyName={companyName}
            contactInfo={contactInfo}
            socialMediaLinks={socialMediaLinks}
            baseUrl={baseUrl}
            showUnsubscribeLink={false}
          />
        </Container>
      </Body>
    </Html>
  );
};

export default AccountCreatedEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: "0 auto",
  padding: "0",
  marginBottom: '64px',
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
  maxWidth: '580px',
  overflow: 'hidden',
};

const logoContainer = {
  padding: '32px 0',
  textAlign: 'center' as const,
  backgroundColor: '#ffffff',
};

const content = {
  padding: '0 32px 32px',
};

const title = {
  fontSize: "24px",
  fontWeight: "600" as const,
  lineHeight: "32px",
  color: '#1a1a1a',
  margin: '16px 0 24px',
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: '#3c4043',
  margin: '16px 0',
};

const infoBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const infoLabel = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: '#5f6368',
  margin: '0 0 8px 0',
};

const infoValue = {
  fontSize: "16px",
  fontWeight: "500" as const,
  color: '#1a1a1a',
  margin: '0',
  fontFamily: 'monospace',
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#ED7D31",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  fontWeight: '600' as const,
};

const hr = {
  borderColor: '#e0e0e0',
  margin: '32px 0',
};

const smallText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: '#5f6368',
  margin: '16px 0',
};

const link = {
  color: '#ED7D31',
  textDecoration: 'none',
  fontSize: "14px",
  wordBreak: 'break-all' as const,
};

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
} from "@react-email/components";
import * as React from "react";
import { siteSettingsData } from "@/lib/site-settings-data";
import { getCompanyName, getContactInfo } from "@/lib/server/siteSettings";
import { EmailFooter } from "./components/EmailFooter";

interface PasswordResetEmailProps {
  userName?: string;
  resetLink?: string;
  // Add site settings as props for server-side rendering
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

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002";

export const PasswordResetEmail = ({
  userName = 'Değerli Kullanıcı',
  resetLink = `${baseUrl}/portal/login`,
  siteSettings,
}: PasswordResetEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || getContactInfo();
  // For templates that previously didn't have social media, we'll still include it for consistency
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `${companyName} için parolanızı sıfırlayın`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src={`${baseUrl}${logoUrl}`}
              width="150"
              height="auto"
              alt={companyName}
            />
          </Section>
          <Section style={content}>
            <Text style={title}>
              Parolanızı Sıfırlayın
            </Text>
            <Text style={paragraph}>
              Merhaba {userName},
            </Text>
            <Text style={paragraph}>
              Hesabınız için bir parola sıfırlama talebi aldık. Parolanızı yenilemek için aşağıdaki butona tıklayabilirsiniz. Bu işlem 10 dakika için geçerlidir.
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={resetLink}>
                Parolayı Sıfırla
              </Button>
            </Section>
            <Text style={paragraph}>
              Eğer bu talebi siz yapmadıysanız, bu e-postayı güvenle görmezden gelebilirsiniz. Hesabınız güvendedir.
            </Text>
          </Section>
          
          <EmailFooter
            companyName={companyName}
            contactInfo={contactInfo}
            socialMediaLinks={socialMediaLinks}
            baseUrl={baseUrl}
            showUnsubscribeLink={true}
          />
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordResetEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: '64px',
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
  maxWidth: '580px',
};

const logoContainer = {
  padding: '20px 0',
  textAlign: 'center' as const,
};

const content = {
  padding: '0 32px',
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
  padding: "14px 24px",
  fontWeight: '600' as const,
};

const hr = {
  borderColor: "#f0f0f0",
  margin: "20px 0",
};

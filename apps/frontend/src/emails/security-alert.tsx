import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Heading,
} from "@react-email/components";
import * as React from "react";
import { siteSettingsData } from "@/lib/site-settings-data";
import { getCompanyName } from "@/lib/server/siteSettings";
import { EmailFooter } from "./components/EmailFooter";

interface SecurityAlertEmailProps {
  userName?: string;
  alertDetails?: {
    time: string;
    ipAddress: string;
    location: string;
  };
  passwordResetLink?: string;
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

export const SecurityAlertEmail = ({
  userName = 'Kullanıcı',
  alertDetails = {
      time: new Date().toLocaleString('tr-TR'),
      ipAddress: '192.168.1.100',
      location: 'Ankara, Türkiye (Tahmini)'
  },
  passwordResetLink = `${baseUrl}/portal/profile`,
  siteSettings,
}: SecurityAlertEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || { address: '', phone: '', email: '' };
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = "Hesabınız için önemli güvenlik uyarısı";

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
            <Heading style={heading}>Güvenlik Uyarısı</Heading>
            <Text style={paragraph}>
              Merhaba {userName},
            </Text>
            <Text style={paragraph}>
              Hesabınızda yeni bir konumdan veya cihazdan bir giriş denemesi tespit ettik. Bu işlemi siz gerçekleştirdiyseniz, bu e-postayı görmezden gelebilirsiniz.
            </Text>
            
            <Section style={detailsSection}>
                <Text style={detailText}><strong>Zaman:</strong> {alertDetails.time}</Text>
                <Text style={detailText}><strong>IP Adresi:</strong> {alertDetails.ipAddress}</Text>
                <Text style={detailText}><strong>Tahmini Konum:</strong> {alertDetails.location}</Text>
            </Section>

            <Text style={paragraph}>
              Eğer bu işlemi siz yapmadıysanız, hesabınızın güvenliğini sağlamak için parolanızı hemen sıfırlamanızı öneririz.
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={passwordResetLink}>
                Parolamı Değiştir
              </Button>
            </Section>
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

export default SecurityAlertEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: "0 auto",
  padding: "20px 48px 48px 48px",
  marginBottom: '64px',
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
  maxWidth: '580px',
};

const logoContainer = {
  padding: '0 0 20px 0',
  textAlign: 'center' as const,
};

const content = {
  padding: '0',
};

const heading = {
    fontSize: "24px",
    fontWeight: "600" as const,
    lineHeight: "32px",
    color: '#d94848',
    textAlign: 'center' as const,
    margin: '16px 0 24px',
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: '#3c4043',
};

const detailsSection = {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
};

const detailText = {
    margin: '4px 0',
    fontSize: '14px',
    color: '#7f1d1d',
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
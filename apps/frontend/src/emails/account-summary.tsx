import {
  Body,
  Button,
  Container,
  Head,
  Hr,
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

interface AccountSummaryEmailProps {
  userName?: string;
  month?: string;
  newTickets?: number;
  resolvedTickets?: number;
  newCertificates?: number;
  ctaLink?: string;
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

export const AccountSummaryEmail = ({
  userName = "Ahmet",
  month = "Ağustos 2024",
  newTickets = 2,
  resolvedTickets = 1,
  newCertificates = 1,
  ctaLink = `${baseUrl}/portal/dashboard`,
  siteSettings,
}: AccountSummaryEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  // For templates that previously didn't have contact info, we'll include it for consistency
  const contactInfo = siteSettings?.contact || { address: '', phone: '', email: '' };
  // For templates that previously didn't have social media, we'll still include it for consistency
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `${month} ayı hesap özetiniz burada.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={`${baseUrl}${logoUrl}`}
              width="150"
              height="auto"
              alt={companyName}
            />
          </Section>

          <Section style={content}>
            <Heading style={heading}>{month} Özeti</Heading>
            <Text style={paragraph}>
              Merhaba {userName},
            </Text>
            <Text style={paragraph}>
              İşte bu ayki portal aktivitelerinizin bir özeti.
            </Text>
            
            <Section style={summarySection}>
                <div style={summaryItem}>
                    <Text style={summaryValue}>{newTickets}</Text>
                    <Text style={summaryLabel}>Yeni Destek Talebi</Text>
                </div>
                 <div style={summaryItem}>
                    <Text style={summaryValue}>{resolvedTickets}</Text>
                    <Text style={summaryLabel}>Çözülen Destek Talebi</Text>
                </div>
                 <div style={summaryItem}>
                    <Text style={summaryValue}>{newCertificates}</Text>
                    <Text style={summaryLabel}>Kazanılan Sertifika</Text>
                </div>
            </Section>

            <Text style={paragraph}>
              Hesabınızla ilgili tüm detayları ve daha fazlasını görmek için kullanıcı portalınıza giriş yapabilirsiniz.
            </Text>
            
            <Section style={buttonContainer}>
              <Button style={button} href={ctaLink}>
                Portal'a Git
              </Button>
            </Section>
            
          </Section>

          <EmailFooter
            companyName={companyName}
            contactInfo={contactInfo}
            socialMediaLinks={socialMediaLinks}
            baseUrl={baseUrl}
            showUnsubscribeLink={false} // This is an informational email, so no unsubscribe link
          />
        </Container>
      </Body>
    </Html>
  );
};

export default AccountSummaryEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: "0 auto",
  padding: "20px 0 48px",
  border: '1px solid #e5e5e5',
  borderRadius: '4px',
  maxWidth: '600px',
  overflow: 'hidden'
};

const header = {
    padding: '0 32px',
    textAlign: 'center' as const,
    marginBottom: '20px',
};

const content = {
    padding: '0 32px',
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: '#333333',
  lineHeight: '32px',
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: '#445354',
};

const summarySection = {
    margin: '32px 0',
    display: 'flex',
    justifyContent: 'space-around',
    textAlign: 'center' as const,
};

const summaryItem = {
    padding: '0 10px',
};

const summaryValue = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ED7D31',
    margin: '0 0 4px 0',
};

const summaryLabel = {
    fontSize: '14px',
    color: '#6a7380',
    margin: 0,
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
  padding: "14px 28px",
  fontWeight: 'bold' as const,
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "30px 0",
};
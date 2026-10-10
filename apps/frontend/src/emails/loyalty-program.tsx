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
  Link,
} from "@react-email/components";
import * as React from "react";
import { siteSettingsData } from "@/lib/site-settings-data";
import { getCompanyName } from "@/lib/server/siteSettings";
import { EmailFooter } from "./components/EmailFooter";

interface LoyaltyProgramEmailProps {
  userName?: string;
  points?: number;
  level?: string;
  rewardsLink?: string;
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

export const LoyaltyProgramEmail = ({
  userName = "Ahmet",
  points = 1250,
  level = "Altın Üye",
  rewardsLink = `${baseUrl}/portal/rewards`,
  siteSettings,
}: LoyaltyProgramEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || { address: '', phone: '', email: '' };
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `Puan durumunuz ve yeni ödüller sizi bekliyor!`;

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
            <Heading style={heading}>Sadakatiniz İçin Teşekkürler!</Heading>
            <Text style={paragraph}>
              Merhaba {userName},
            </Text>
            <Text style={paragraph}>
              {companyName} ailesinin değerli bir parçasısınız. Mevcut puan durumunuz ve sizi bekleyen özel ödüllere aşağıdan göz atabilirsiniz.
            </Text>

            <Section style={pointsSection}>
                <Text style={pointsLabel}>Mevcut Puanınız</Text>
                <Text style={pointsValue}>{points} Puan</Text>
                <Text style={levelText}>Seviye: <strong>{level}</strong></Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={rewardsLink}>
                Ödülleri Keşfet
              </Button>
            </Section>
            <Text style={paragraph}>
              Bizi tercih ettiğiniz için teşekkür ederiz.
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

export default LoyaltyProgramEmail;

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
  textAlign: 'center' as const,
};

const heading = {
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

const pointsSection = {
    padding: '24px',
    backgroundColor: '#fef9c3',
    border: '1px solid #fde047',
    borderRadius: '8px',
    margin: '32px 0',
};

const pointsLabel = {
    fontSize: '14px',
    color: '#ca8a04',
    margin: 0,
};

const pointsValue = {
    fontSize: '36px',
    fontWeight: 700,
    color: '#a16207',
    margin: '4px 0 0 0',
};

const levelText = {
    fontSize: '14px',
    color: '#ca8a04',
    margin: '8px 0 0 0',
}

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
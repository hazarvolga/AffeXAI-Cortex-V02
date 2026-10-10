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
  Link,
} from "@react-email/components";
import * as React from "react";
import { siteSettingsData } from "@/lib/site-settings-data";
import { getCompanyName } from "@/lib/server/siteSettings";
import { EmailFooter } from "./components/EmailFooter";

interface FeatureUpdateEmailProps {
  userName?: string;
  featureName?: string;
  featureDescription?: string;
  featureImageUrl?: string;
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

export const FeatureUpdateEmail = ({
  userName = "Kullanıcı",
  featureName = "AI Destekli Özetleme Aracı",
  featureDescription = "Artık destek taleplerinizi oluştururken, yapay zeka sizin için probleminizi analiz edip bir özet ve çözüm önerisi sunacak. Bu, destek ekibimizin size daha hızlı yardımcı olmasını sağlayacak.",
  featureImageUrl = "https://picsum.photos/seed/feature-update/600/300",
  ctaLink = `${baseUrl}/portal/support/new`,
  siteSettings,
}: FeatureUpdateEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || { address: '', phone: '', email: '' };
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `Yeni Özellik: ${featureName} şimdi yayında!`;

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
            <Heading style={heading}>Platformumuza Yeni Bir Güç Katıldı</Heading>
            <Text style={paragraph}>
              Merhaba {userName},
            </Text>
            <Text style={paragraph}>
              Size harika bir haberimiz var! Deneyiminizi daha da iyileştirmek için platformumuza yeni bir özellik ekledik.
            </Text>

            <Section style={featureSection}>
                <Heading as="h2" style={featureTitle}>{featureName}</Heading>
                <Img src={featureImageUrl} width="100%" style={featureImage} />
                <Text style={featureText}>{featureDescription}</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={ctaLink}>
                Yeni Özelliği Deneyin
              </Button>
            </Section>
          </Section>
           <Hr style={hr} />
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

export default FeatureUpdateEmail;

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
    color: '#1a1a1a',
    textAlign: 'center' as const,
    margin: '16px 0 24px',
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: '#3c4043',
};

const featureSection = {
    margin: '32px 0',
    padding: '24px',
    backgroundColor: '#f6f9fc',
    borderRadius: '8px',
};

const featureTitle = {
    fontSize: '20px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    textAlign: 'center' as const,
    color: '#1a1a1a',
};

const featureImage = {
    borderRadius: '4px',
    marginBottom: '16px',
};

const featureText = {
    fontSize: '14px',
    lineHeight: '22px',
    color: '#3c4043',
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
  padding: "14px 24px",
  fontWeight: '600' as const,
};

const hr = {
  borderColor: "#f0f0f0",
  margin: "20px 0",
};

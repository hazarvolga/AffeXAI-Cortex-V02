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

interface OnboardingSeriesEmailProps {
  userName?: string;
  stepNumber?: number;
  totalSteps?: number;
  tipTitle?: string;
  tipDescription?: string;
  tipImageUrl?: string;
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

export const OnboardingSeriesEmail = ({
  userName = "Kullanıcı",
  stepNumber = 1,
  totalSteps = 5,
  tipTitle = "İlk Adım: Proje Yapınızı Oluşturun",
  tipDescription = "Her başarılı projenin temeli, iyi organize edilmiş bir yapıdan geçer. Kat Yöneticisi'ni kullanarak projenizin katlarını ve seviyelerini kolayca oluşturun. Bu, modelinizin düzenli ve yönetilebilir olmasını sağlar.",
  tipImageUrl = "https://picsum.photos/seed/onboarding-1/600/300",
  ctaLink = `${baseUrl}/portal/kb/kat-yoneticisi-kullanimi`,
  siteSettings,
}: OnboardingSeriesEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || { address: '', phone: '', email: '' };
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `Adım ${stepNumber}: ${tipTitle}`;

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
            <Text style={stepIndicator}>Adım {stepNumber} / {totalSteps}</Text>
            <Heading style={heading}>{tipTitle}</Heading>
            <Text style={paragraph}>
              Merhaba {userName}, {companyName} dünyasına hoş geldiniz! Projelerinizden en iyi şekilde yararlanmanıza yardımcı olacak ipuçları serimize başlıyoruz.
            </Text>
            
            <Img
              src={tipImageUrl}
              width="100%"
              style={mainImage}
            />

            <Text style={paragraph}>{tipDescription}</Text>
            
            <Section style={buttonContainer}>
              <Button style={button} href={ctaLink}>
                Daha Fazla Bilgi Edinin
              </Button>
            </Section>
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
            showUnsubscribeLink={true}
          />
        </Container>
      </Body>
    </Html>
  );
};

export default OnboardingSeriesEmail;

// Styles
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

const stepIndicator = {
    fontSize: '12px',
    fontWeight: 'bold' as const,
    color: '#6a7380',
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
};

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: '#333333',
  lineHeight: '36px',
  margin: '12px 0 24px 0',
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: '#445354',
};

const mainImage = {
    borderRadius: '4px',
    margin: '24px 0',
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
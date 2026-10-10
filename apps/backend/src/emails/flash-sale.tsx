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
import { getCompanyName, getContactInfo } from "@/lib/server/siteSettings";
import { EmailFooter } from "./components/EmailFooter";

interface FlashSaleEmailProps {
  userName?: string;
  saleTitle?: string;
  saleDescription?: string;
  discountPercentage?: number;
  countdown?: string;
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

export const FlashSaleEmail = ({
  userName = "Kullanıcı",
  saleTitle = "Sadece 24 Saat: %30 İndirim!",
  saleDescription = "Tüm Allplan eğitim paketlerinde geçerli, kaçırılmayacak flaş indirim başladı. Bilginizi artırmanın tam zamanı!",
  discountPercentage = 30,
  countdown = "23:59:59",
  ctaLink = `${baseUrl}/education/training`,
  siteSettings,
}: FlashSaleEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || getContactInfo();
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `Hızlı Davran! %${discountPercentage} İndirim İçin Son Saatler!`;

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
            <Heading style={heading}>{saleTitle}</Heading>
            <Text style={paragraph}>{saleDescription}</Text>
            
            <Section style={countdownSection}>
                <Text style={countdownText}>Kalan Süre: {countdown}</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={ctaLink}>
                İndirimi Yakala
              </Button>
            </Section>
            
            <Text style={paragraphSmall}>
              Bu fırsat sadece 24 saat için geçerlidir ve stoklarla sınırlıdır.
            </Text>
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

export default FlashSaleEmail;

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
    textAlign: 'center' as const,
};

const heading = {
  fontSize: "32px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: '#d94848', // A more urgent color
  lineHeight: '40px',
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: '#445354',
  textAlign: 'center' as const,
};

const paragraphSmall = {
    ...paragraph,
    fontSize: '12px',
    color: '#6a7380',
};

const countdownSection = {
    margin: '32px 0',
    padding: '16px',
    backgroundColor: '#fffbeb',
    border: '1px dashed #facc15',
    borderRadius: '8px',
};

const countdownText = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#b45309',
    margin: 0,
    letterSpacing: '1px'
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#dc2626",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "18px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 32px",
  fontWeight: 'bold' as const,
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "30px 0",
};
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
import { getCompanyName, getContactInfo } from "@/lib/server/siteSettings";
import { EmailFooter } from "./components/EmailFooter";

interface ThankYouEmailProps {
  userName?: string;
  thankYouFor?: string;
  message?: string;
  ctaText?: string;
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

export const ThankYouEmail = ({
  userName = "Ahmet",
  thankYouFor = "yeni siparişiniz",
  message = "Aluplan Digital ailesini tercih ettiğiniz için mutluluk duyuyoruz. Siparişiniz en kısa sürede işleme alınacaktır.",
  ctaText = "Sipariş Detaylarını Gör",
  ctaLink = `${baseUrl}/portal/orders/AL-12345-TR`,
  siteSettings,
}: ThankYouEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || getContactInfo();
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `Teşekkürler!`;

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
            <Heading style={heading}>Teşekkür Ederiz!</Heading>
            <Text style={paragraph}>
              Merhaba {userName},
            </Text>
            <Text style={paragraph}>
              {thankYouFor} için teşekkür ederiz. {message}
            </Text>
            
            {ctaText && ctaLink && (
              <Section style={buttonContainer}>
                <Button style={button} href={ctaLink}>
                  {ctaText}
                </Button>
              </Section>
            )}
            
            <Text style={paragraph}>
              İyi günler dileriz,
              <br/>
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

export default ThankYouEmail;

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
  fontSize: "28px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: '#333333',
  lineHeight: '36px',
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: '#445354',
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
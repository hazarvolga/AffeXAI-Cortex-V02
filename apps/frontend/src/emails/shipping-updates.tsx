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

interface ShippingUpdatesEmailProps {
  userName?: string;
  orderId?: string;
  trackingNumber?: string;
  trackingLink?: string;
  estimatedDeliveryDate?: string;
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

export const ShippingUpdatesEmail = ({
  userName = "Ahmet Yılmaz",
  orderId = "AL-12345-TR",
  trackingNumber = "1Z9999W99999999999",
  trackingLink = "#",
  estimatedDeliveryDate = "30 Ağustos 2024",
  siteSettings,
}: ShippingUpdatesEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || getContactInfo();
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `Siparişiniz #${orderId} yola çıktı!`;

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
            <Heading style={heading}>Siparişiniz Yola Çıktı!</Heading>
            <Text style={paragraph}>
              Merhaba {userName},
            </Text>
            <Text style={paragraph}>
              Harika haber! #{orderId} numaralı siparişiniz kargoya verildi ve şu anda size doğru geliyor.
            </Text>
            <Text style={paragraph}>
              Tahmini teslimat tarihi: <strong>{estimatedDeliveryDate}</strong>
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={trackingLink}>
                Kargoyu Takip Et
              </Button>
            </Section>

             <Section style={trackingInfoSection}>
                <Text style={trackingInfoText}>
                    Veya takip numarasını kullanın:
                </Text>
                <Text style={trackingNumberText}>
                    {trackingNumber}
                </Text>
             </Section>

            <Text style={paragraph}>
              Siparişiniz için tekrar teşekkür ederiz.
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

export default ShippingUpdatesEmail;

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

const trackingInfoSection = {
    textAlign: 'center' as const,
    padding: '16px',
    backgroundColor: '#f6f9fc',
    borderRadius: '4px',
    margin: '24px 0',
};

const trackingInfoText = {
    margin: 0,
    fontSize: '14px',
    color: '#6a7380',
};

const trackingNumberText = {
    margin: '4px 0 0 0',
    fontSize: '18px',
    fontWeight: 'bold',
    letterSpacing: '1px',
    color: '#1a1a1a',
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
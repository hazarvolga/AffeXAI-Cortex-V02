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

interface PriceDropAlertEmailProps {
  userName?: string;
  productName?: string;
  productImageUrl?: string;
  oldPrice?: string;
  newPrice?: string;
  productLink?: string;
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

export const PriceDropAlertEmail = ({
  userName = "Kullanıcı",
  productName = "Allplan Mimari Paketi",
  productImageUrl = "https://picsum.photos/seed/price-drop/200/200",
  oldPrice = "2.499 TL",
  newPrice = "1.999 TL",
  productLink = `${baseUrl}/products/allplan`,
  siteSettings,
}: PriceDropAlertEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || { address: '', phone: '', email: '' };
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `Fiyat Düştü: ${productName} şimdi daha ucuz!`;

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
            <Heading style={heading}>Fiyat Düştü!</Heading>
            <Text style={paragraph}>
              Merhaba {userName},
            </Text>
            <Text style={paragraph}>
              Takip ettiğiniz ürünün fiyatı düştü. Bu harika fırsatı kaçırmayın!
            </Text>

            <Section style={productSection}>
                <Img src={productImageUrl} width="120" height="120" alt={productName} style={productImage} />
                <Heading as="h2" style={productNameStyle}>{productName}</Heading>
                <Section style={priceSection}>
                    <Text style={oldPriceStyle}>{oldPrice}</Text>
                    <Text style={newPriceStyle}>{newPrice}</Text>
                </Section>
                 <Button style={button} href={productLink}>
                    Fırsatı Yakala
                </Button>
            </Section>

            <Text style={paragraph}>
              Stoklar tükenmeden acele edin!
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

export default PriceDropAlertEmail;

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

const productSection = {
    padding: '24px 0',
}

const productImage = {
    borderRadius: '8px',
    margin: '0 auto'
};

const productNameStyle = {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1a1a1a',
    margin: '16px 0 8px 0',
};

const priceSection = {
    margin: '8px 0 16px',
};

const oldPriceStyle = {
    fontSize: '16px',
    color: '#9ca3af',
    textDecoration: 'line-through',
    margin: 0,
};

const newPriceStyle = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#16a34a',
    margin: '4px 0 0 0',
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
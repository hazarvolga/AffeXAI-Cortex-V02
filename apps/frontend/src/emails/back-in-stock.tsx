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

interface BackInStockEmailProps {
  userName?: string;
  productName?: string;
  productImageUrl?: string;
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

export const BackInStockEmail = ({
  userName = "Kullanıcı",
  productName = "Allplan Mimari Paketi",
  productImageUrl = "https://picsum.photos/seed/back-in-stock/200/200",
  productLink = `${baseUrl}/products/allplan`,
  siteSettings,
}: BackInStockEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || { address: '', phone: '', email: '' };
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `Beklediğiniz ürün tekrar stokta: ${productName}`;

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
            <Heading style={heading}>Harika Haber!</Heading>
            <Text style={paragraph}>
              Merhaba {userName},
            </Text>
            <Text style={paragraph}>
              Beklediğiniz ürün tekrar stoklarımızda! Fırsatı kaçırmadan hemen inceleyin.
            </Text>

            <Section style={productSection}>
                <Img src={productImageUrl} width="120" height="120" alt={productName} style={productImage} />
                <Heading as="h2" style={productNameStyle}>{productName}</Heading>
                 <Button style={button} href={productLink}>
                    Şimdi İncele
                </Button>
            </Section>

            <Text style={paragraph}>
              İlginiz için teşekkür ederiz.
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

export default BackInStockEmail;

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

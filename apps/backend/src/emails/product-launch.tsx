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
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";
import { siteSettingsData } from "@/lib/site-settings-data";
import { getCompanyName } from "@/lib/server/siteSettings";
import { EmailFooter } from "./components/EmailFooter";

interface ProductLaunchEmailProps {
  productName?: string;
  productDescription?: string;
  productImageUrl?: string;
  ctaLink?: string;
  features?: {
    icon: string; // URL to an icon
    title: string;
    description: string;
  }[];
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

export const ProductLaunchEmail = ({
  productName = "Allplan 2025",
  productDescription = "Tasarım, mühendislik ve inşaat dünyasını yeniden şekillendirecek olan devrim niteliğindeki yeni sürümümüzle tanışın. Daha akıllı, daha hızlı ve daha entegre.",
  productImageUrl = "https://picsum.photos/seed/product-launch/600/350",
  ctaLink = `${baseUrl}/products/allplan`,
  features = [
    { icon: "✨", title: "AI Destekli Modelleme", description: "Yapay zeka ile tasarım süreçlerinizi hızlandırın." },
    { icon: "🔗", title: "Gelişmiş İşbirliği", description: "Bimplus ile proje paydaşlarınızla sorunsuz çalışın." },
    { icon: "🌿", title: "Sürdürülebilirlik Araçları", description: "Yeşil bina projeleri için entegre analizler yapın." },
  ],
  siteSettings,
}: ProductLaunchEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || { address: '', phone: '', email: '' };
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `Tanıtıyoruz: ${productName} - Geleceğin Aracı`;

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
            <Text style={introText}>YENİ ÜRÜN</Text>
            <Heading style={heading}>Tanıtıyoruz: {productName}</Heading>
            <Text style={paragraph}>{productDescription}</Text>
            
            <Img
              src={productImageUrl}
              width="100%"
              style={mainImage}
            />
            
            <Section style={buttonContainer}>
              <Button style={button} href={ctaLink}>
                Şimdi Keşfet
              </Button>
            </Section>

            <Heading as="h2" style={featuresHeading}>Öne Çıkan Özellikler</Heading>

            <Section>
              {features.map((feature, index) => (
                 <Row key={index} style={featureRow}>
                    <Column style={featureIconColumn}>
                        <Text style={featureIcon}>{feature.icon}</Text>
                    </Column>
                    <Column>
                        <Heading as="h3" style={featureTitle}>{feature.title}</Heading>
                        <Text style={featureDescription}>{feature.description}</Text>
                    </Column>
                 </Row>
              ))}
            </Section>
            
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

export default ProductLaunchEmail;

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

const introText = {
    fontSize: '12px',
    fontWeight: 'bold' as const,
    color: '#ED7D31',
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
};

const heading = {
  fontSize: "32px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: '#333333',
  lineHeight: '40px',
  margin: '8px 0 16px 0',
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: '#445354',
  textAlign: 'center' as const,
};

const mainImage = {
    borderRadius: '8px',
    margin: '32px 0',
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "0 0 32px 0",
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

const featuresHeading = {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    color: '#333333',
    textAlign: 'center' as const,
    margin: '32px 0 24px 0',
};

const featureRow = {
    marginBottom: '20px',
};

const featureIconColumn = {
    width: '48px',
};

const featureIcon = {
    fontSize: '24px',
};

const featureTitle = {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    margin: '0 0 4px 0',
    color: '#333333',
};

const featureDescription = {
    fontSize: '14px',
    lineHeight: '22px',
    color: '#6a7380',
    margin: 0,
};
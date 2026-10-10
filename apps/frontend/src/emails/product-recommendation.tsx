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
  Link
} from "@react-email/components";
import * as React from "react";
import { siteSettingsData } from "@/lib/site-settings-data";
import { getCompanyName } from "@/lib/server/siteSettings";
import { EmailFooter } from "./components/EmailFooter";

interface ProductRecommendationEmailProps {
  userName?: string;
  recommendations?: {
    name: string;
    description: string;
    imageUrl: string;
    link: string;
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

export const ProductRecommendationEmail = ({
  userName = "Zeynep",
  recommendations = [
    { name: "Allplan Bridge 2024", description: "Karmaşık köprü projeleri için hepsi bir arada çözüm.", imageUrl: "https://picsum.photos/seed/rec-1/200/200", link: `${baseUrl}/products/building-infrastructure/allplan-bridge`},
    { name: "İleri Düzey Workshop", description: "Yapısal mühendislikte uzmanlaşmak için atölye çalışmamız.", imageUrl: "https://picsum.photos/seed/rec-2/200/200", link: `${baseUrl}/education/training`}
  ],
  siteSettings,
}: ProductRecommendationEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || { address: '', phone: '', email: '' };
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = "Sizin için seçtiklerimiz var!";

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
            <Heading style={heading}>İlginizi Çekebilecekler</Heading>
            <Text style={paragraph}>
              Merhaba {userName},
            </Text>
            <Text style={paragraph}>
              Son aktivitelerinize dayanarak, ilginizi çekeceğini düşündüğümüz bazı ürün ve hizmetleri sizin için seçtik.
            </Text>
            
            <Section style={{marginTop: '32px'}}>
              {recommendations.map((item, index) => (
                <Row key={index} style={{marginBottom: '24px'}}>
                    <Column style={{width: '120px', paddingRight: '20px'}}>
                        <Img src={item.imageUrl} width="100" height="100" alt={item.name} style={itemImage} />
                    </Column>
                    <Column>
                        <Heading as="h3" style={itemName}>{item.name}</Heading>
                        <Text style={itemDescription}>{item.description}</Text>
                        <Link href={item.link} style={itemLink}>Daha Fazla Bilgi &rarr;</Link>
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

export default ProductRecommendationEmail;

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

const itemImage = {
    borderRadius: '8px'
};

const itemName = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a1a',
    margin: '0 0 4px 0',
};

const itemDescription = {
    fontSize: '14px',
    color: '#6a7380',
    margin: '0 0 12px 0',
    lineHeight: '20px'
};

const itemLink = {
    fontSize: '14px',
    color: '#ED7D31',
    textDecoration: 'none',
    fontWeight: 500,
}
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
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";
import { siteSettingsData } from "@/lib/site-settings-data";
import { getCompanyName } from "@/lib/server/siteSettings";
import { EmailFooter } from "./components/EmailFooter";

interface AbandonedCartEmailProps {
  userName?: string;
  cartItems?: {
    name: string;
    imageUrl: string;
    price: string;
  }[];
  checkoutLink?: string;
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

export const AbandonedCartEmail = ({
  userName = "Ahmet",
  cartItems = [
    { name: "Allplan Professional Lisansı (1 Yıl)", imageUrl: "https://picsum.photos/seed/cart-item-1/100/100", price: "1,999.00 TL" }
  ],
  checkoutLink = `${baseUrl}/cart`,
  siteSettings,
}: AbandonedCartEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || { address: '', phone: '', email: '' };
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = "Sepetinizde bir şeyler unuttunuz!";

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
            <Heading style={heading}>Alışverişe Devam Edin</Heading>
            <Text style={paragraph}>
              Merhaba {userName},
            </Text>
            <Text style={paragraph}>
              Sepetinizde harika ürünler bıraktığınızı fark ettik. Alışverişinizi tamamlamaya hazır mısınız?
            </Text>
            
            <Section style={{marginTop: '24px'}}>
              {cartItems.map((item, index) => (
                <Row key={index} style={itemRow}>
                    <Column style={{width: '80px'}}>
                         <Img src={item.imageUrl} width="64" height="64" alt={item.name} style={itemImage} />
                    </Column>
                    <Column>
                        <Text style={itemName}>{item.name}</Text>
                        <Text style={itemPrice}>{item.price}</Text>
                    </Column>
                </Row>
              ))}
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={checkoutLink}>
                Sepetime Geri Dön
              </Button>
            </Section>
            <Text style={paragraph}>
              Herhangi bir sorunuz varsa, size yardımcı olmaktan memnuniyet duyarız.
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

export default AbandonedCartEmail;

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

const itemRow = {
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0'
};

const itemImage = {
    borderRadius: '4px'
};

const itemName = {
    fontSize: '14px',
    fontWeight: 500,
    color: '#3c4043',
    margin: 0,
};

const itemPrice = {
    fontSize: '14px',
    color: '#6a7380',
    margin: '4px 0 0 0',
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

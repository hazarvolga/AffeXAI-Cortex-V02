import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Heading,
} from "@react-email/components";
import * as React from "react";
import { siteSettingsData } from "@/lib/site-settings-data";
import { getCompanyName, getContactInfo } from "@/lib/server/siteSettings";
import { EmailFooter } from "./components/EmailFooter";

interface GoodbyeEmailProps {
  userName?: string;
  feedbackLink?: string;
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

export const GoodbyeEmail = ({
  userName = 'Değerli Kullanıcı',
  feedbackLink = `${baseUrl}/contact`,
  siteSettings,
}: GoodbyeEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || getContactInfo();
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `Abonelikten ayrıldığınız için üzgünüz.`;

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
            <Heading style={heading}>Hoşça Kalın</Heading>
            <Text style={paragraph}>
              Merhaba {userName},
            </Text>
            <Text style={paragraph}>
              E-posta bültenimizden ayrıldığınızı onaylıyoruz. Artık bizden pazarlama e-postaları almayacaksınız.
            </Text>
            <Text style={paragraph}>
              Ayrılma nedeniniz hakkında geri bildirimde bulunmak isterseniz, düşüncelerinizi duymaktan memnuniyet duyarız.
            </Text>
             <Section style={buttonContainer}>
                <Link href={feedbackLink} style={feedbackLinkStyle}>Geri Bildirimde Bulun</Link>
            </Section>
            <Text style={paragraph}>
              Yolunuzun tekrar bizimle kesişmesi dileğiyle.
              <br />
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

export default GoodbyeEmail;

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

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const feedbackLinkStyle = {
  color: '#ED7D31',
  textDecoration: 'underline',
  fontSize: '14px',
};
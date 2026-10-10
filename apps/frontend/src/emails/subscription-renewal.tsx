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

interface SubscriptionRenewalEmailProps {
  userName?: string;
  subscriptionName?: string;
  renewalDate?: string;
  renewalPrice?: string;
  manageLink?: string;
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

export const SubscriptionRenewalEmail = ({
  userName = "Ayşe",
  subscriptionName = "Allplan Professional Lisansı",
  renewalDate = "30 Eylül 2024",
  renewalPrice = "1,999.00 TL",
  manageLink = `${baseUrl}/portal/licenses`,
  siteSettings,
}: SubscriptionRenewalEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || getContactInfo();
  // For templates that previously didn't have social media, we'll still include it for consistency
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `Aboneliğiniz yakında yenileniyor: ${subscriptionName}`;

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
            <Heading style={heading}>Aboneliğiniz Yakında Yenileniyor</Heading>
            <Text style={paragraph}>
              Merhaba {userName},
            </Text>
            <Text style={paragraph}>
              Bu, {subscriptionName} aboneliğinizin <strong>{renewalDate}</strong> tarihinde <strong>{renewalPrice}</strong> bedelle otomatik olarak yenileneceğini bildiren bir hatırlatmadır.
            </Text>
            
             <Section style={renewalInfoSection}>
                <Text style={renewalInfoText}><strong>Ürün:</strong> {subscriptionName}</Text>
                <Text style={renewalInfoText}><strong>Yenileme Tarihi:</strong> {renewalDate}</Text>
                <Text style={renewalInfoText}><strong>Tutar:</strong> {renewalPrice}</Text>
            </Section>

            <Text style={paragraph}>
              Herhangi bir işlem yapmanıza gerek yoktur. Ödeme, kayıtlı kartınızdan otomatik olarak alınacaktır. Aboneliğinizi yönetmek veya ödeme bilgilerinizi güncellemek isterseniz, aşağıdaki butonu kullanabilirsiniz.
            </Text>
            
            <Section style={buttonContainer}>
              <Button style={button} href={manageLink}>
                Aboneliği Yönet
              </Button>
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

export default SubscriptionRenewalEmail;

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
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: '#333333',
  lineHeight: '32px',
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: '#445354',
};

const renewalInfoSection = {
    margin: '24px 0',
    padding: '16px',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    backgroundColor: '#fafafa',
};

const renewalInfoText = {
    margin: '4px 0',
    fontSize: '14px',
    color: '#333333',
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

const hr = {
  borderColor: "#e5e5e5",
  margin: "30px 0",
};

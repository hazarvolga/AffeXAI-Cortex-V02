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
import { getCompanyName } from "@/lib/server/siteSettings";
import { EmailFooter } from "./components/EmailFooter";

interface MilestoneCelebrationEmailProps {
  userName?: string;
  milestone?: string;
  milestoneDescription?: string;
  rewardText?: string;
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

export const MilestoneCelebrationEmail = ({
  userName = "Ayşe",
  milestone = "1. Yılınız Kutlu Olsun!",
  milestoneDescription = `Bizimle geçirdiğiniz bir yıl için teşekkür ederiz! {companyName} topluluğunun değerli bir üyesi oldunuz.`,
  rewardText = "Bu özel günü kutlamak için, bir sonraki eğitiminize özel %15 indirim kuponu hesabınıza tanımladık.",
  ctaLink = `${baseUrl}/portal/rewards`,
  siteSettings,
}: MilestoneCelebrationEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || { address: '', phone: '', email: '' };
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  // Update milestoneDescription with dynamic company name
  const dynamicMilestoneDescription = milestoneDescription.replace('{companyName}', companyName);
  
  const previewText = `Bizimle 1. yılınız! Size özel bir hediyemiz var.`;

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
            <Heading style={heading}>{milestone}</Heading>
            <Text style={paragraph}>
              Merhaba {userName},
            </Text>
            <Text style={paragraph}>
              {dynamicMilestoneDescription}
            </Text>
            
            <Section style={rewardSection}>
                <Text style={rewardTextStyle}>{rewardText}</Text>
            </Section>
            
            <Section style={buttonContainer}>
              <Button style={button} href={ctaLink}>
                Ödülünüzü Görün
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

export default MilestoneCelebrationEmail;

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

const rewardSection = {
    margin: '32px 0',
    padding: '24px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    textAlign: 'center' as const,
};

const rewardTextStyle = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#0369a1',
    margin: 0,
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
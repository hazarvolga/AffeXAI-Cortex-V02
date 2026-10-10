import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";
import { siteSettingsData } from "@/lib/site-settings-data";
import { getCompanyName } from "@/lib/server/siteSettings";
import { EmailFooter } from "./components/EmailFooter";

interface TestSocialLinksEmailProps {
  userName?: string;
  // Add site settings as props for server-side rendering
  siteSettings?: {
    companyName: string;
    socialMedia: {
      [key: string]: string;
    };
    contact: {
      address: string;
      phone: string;
      email: string;
    };
  };
}

export const TestSocialLinksEmail = ({
  userName = 'Test User',
  siteSettings,
}: TestSocialLinksEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const socialMediaLinks = siteSettings?.socialMedia || {};
  const contactInfo = siteSettings?.contact || { address: '', phone: '', email: '' };
  
  const previewText = `Social Media Links Test for ${companyName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Text style={title}>
              Social Media Links Test
            </Text>
            <Text style={paragraph}>
              Hello {userName},
            </Text>
            <Text style={paragraph}>
              This is a test email to verify that social media links are working correctly.
            </Text>
            
            <Section style={socialContainer}>
              <Text style={sectionTitle}>Social Media Links:</Text>
              <Row>
                {Object.entries(socialMediaLinks).filter(([_,url]) => url).map(([platform, url]) => (
                  <Column key={platform} style={socialLinkColumn}>
                    <Text style={socialLink}>
                      {platform}: {url}
                    </Text>
                  </Column>
                ))}
              </Row>
            </Section>
            
            <Text style={paragraph}>
              Best regards,
              <br />
              {companyName} Team
            </Text>
          </Section>

          <EmailFooter
            companyName={companyName}
            contactInfo={contactInfo}
            socialMediaLinks={socialMediaLinks}
            baseUrl={""}
            showUnsubscribeLink={false}
          />
        </Container>
      </Body>
    </Html>
  );
};

export default TestSocialLinksEmail;

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
  marginBottom: '64px',
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
  maxWidth: '580px',
};

const content = {
  padding: '0 32px',
};

const title = {
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
  margin: '0 0 16px 0',
};

const socialContainer = {
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#f8f9fa',
  borderRadius: '4px',
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "600" as const,
  lineHeight: "24px",
  color: '#1a1a1a',
  margin: '0 0 16px 0',
};

const socialLinkColumn = {
  padding: '4px 0',
};

const socialLink = {
  color: '#007bff',
  fontSize: "14px",
};
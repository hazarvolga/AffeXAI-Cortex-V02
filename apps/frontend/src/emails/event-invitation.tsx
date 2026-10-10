import {
  Body,
  Button,
  Container,
  Head,
  Hr,
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

interface EventInvitationEmailProps {
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
  eventDescription?: string;
  eventImageUrl?: string;
  registrationLink?: string;
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

export const EventInvitationEmail = ({
  eventName = "Allplan 2025 Lansmanı ve Yenilikler",
  eventDate = "15 Eylül 2024, 10:00",
  eventLocation = "Swissôtel The Bosphorus, İstanbul",
  eventDescription = "Allplan'ın en yeni sürümünün getirdiği çığır açan özellikleri ve performans iyileştirmelerini ilk öğrenen siz olun. Uzmanlarımızdan canlı demolar izleyin, sorularınızı sorun ve sektör liderleriyle tanışın.",
  eventImageUrl = "https://picsum.photos/seed/event-invite/600/300",
  registrationLink = `${baseUrl}/portal/events/evt-001`,
  siteSettings,
}: EventInvitationEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || getContactInfo();
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `Davetlisiniz: ${eventName}`;

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
            <Img
              src={eventImageUrl}
              width="100%"
              style={mainImage}
            />
            <Heading style={heading}>{eventName}</Heading>
            <Section style={eventDetailsSection}>
                <Text style={eventDetailText}>
                    <strong>Tarih:</strong> {eventDate}
                </Text>
                 <Text style={eventDetailText}>
                    <strong>Mekan:</strong> {eventLocation}
                </Text>
            </Section>
            <Text style={paragraph}>{eventDescription}</Text>
            <Section style={buttonContainer}>
              <Button style={button} href={registrationLink}>
                Şimdi Kayıt Ol
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />
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

export default EventInvitationEmail;

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

const mainImage = {
    borderRadius: '4px',
    marginBottom: '24px',
};

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: '#333333',
  lineHeight: '36px',
};

const eventDetailsSection = {
    textAlign: 'center' as const,
    margin: '16px 0',
};

const eventDetailText = {
    fontSize: '14px',
    color: '#6a7380',
    margin: '4px 0',
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: '#445354',
  textAlign: 'center' as const,
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

import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
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

interface TicketAssignedEmailProps {
  ticketId?: string;
  ticketNumber?: string;
  subject?: string;
  assignedToName?: string;
  assignedToEmail?: string;
  customerName?: string;
  ticketUrl?: string;
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

export const TicketAssignedEmail = ({
  ticketId = "07a6cc03-5ed9-483e-b26c-da0f3c4a4b83",
  ticketNumber = "#12345",
  subject = "Test Destek Talebi",
  assignedToName = "Ahmet Yılmaz",
  assignedToEmail = "ahmet.yilmaz@example.com",
  customerName = "Değerli Müşterimiz",
  ticketUrl = `${baseUrl}/portal/support/tickets/07a6cc03-5ed9-483e-b26c-da0f3c4a4b83`,
  siteSettings,
}: TicketAssignedEmailProps) => {
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || getContactInfo();
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `Talebiniz ${assignedToName} tarafından üstlenildi`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={heading}>{companyName}</Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>Destek Talebiniz Üstlenildi</Heading>
            
            <Text style={text}>
              Merhaba {customerName},
            </Text>
            
            <Text style={text}>
              <strong>{ticketNumber}</strong> numaralı destek talebiniz ekibimizden <strong>{assignedToName}</strong> tarafından üstlenildi.
            </Text>

            {/* Ticket Details Box */}
            <Section style={ticketBox}>
              <Text style={ticketLabel}>Konu:</Text>
              <Text style={ticketValue}>{subject}</Text>
              
              <Hr style={ticketDivider} />
              
              <Text style={ticketLabel}>Sorumlu Destek Uzmanı:</Text>
              <Text style={ticketValue}>{assignedToName}</Text>
              <Text style={emailText}>{assignedToEmail}</Text>
            </Section>

            <Text style={text}>
              {assignedToName}, talebinizi inceleyecek ve size en kısa sürede dönüş yapacaktır.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={ticketUrl}>
                Talebi Görüntüle
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={footer}>
              Bu e-posta {companyName} destek sistemi tarafından otomatik olarak gönderilmiştir.
              <br />
              Talep numaranızı her zaman belirtiniz: {ticketNumber}
            </Text>
          </Section>

          {/* Footer */}
          <EmailFooter
            companyName={companyName}
            contactInfo={contactInfo}
            socialMediaLinks={socialMediaLinks}
          />
        </Container>
      </Body>
    </Html>
  );
};

export default TicketAssignedEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const header = {
  padding: "32px 24px",
  backgroundColor: "#1e40af",
  textAlign: "center" as const,
};

const heading = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "700",
  margin: "0",
};

const content = {
  padding: "0 48px",
};

const h1 = {
  color: "#1e293b",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.4",
  marginBottom: "24px",
};

const text = {
  color: "#334155",
  fontSize: "16px",
  lineHeight: "1.6",
  marginBottom: "16px",
};

const ticketBox = {
  backgroundColor: "#f1f5f9",
  borderRadius: "8px",
  padding: "24px",
  marginTop: "24px",
  marginBottom: "24px",
};

const ticketLabel = {
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0 0 4px 0",
};

const ticketValue = {
  color: "#1e293b",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 4px 0",
};

const emailText = {
  color: "#64748b",
  fontSize: "14px",
  margin: "0 0 16px 0",
};

const ticketDivider = {
  borderColor: "#cbd5e1",
  margin: "16px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

const button = {
  backgroundColor: "#1e40af",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "32px 0",
};

const footer = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "1.6",
  textAlign: "center" as const,
};

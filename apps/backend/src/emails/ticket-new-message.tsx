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

interface TicketNewMessageEmailProps {
  ticketId?: string;
  ticketNumber?: string;
  subject?: string;
  authorName?: string;
  messageContent?: string;
  isFromSupport?: boolean;
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

export const TicketNewMessageEmail = ({
  ticketId = "07a6cc03-5ed9-483e-b26c-da0f3c4a4b83",
  ticketNumber = "#12345",
  subject = "Test Destek Talebi",
  authorName = "Destek Ekibi",
  messageContent = "Merhaba, sorununuz için gerekli incelemeleri yapıyoruz. Detaylı bilgi için size en kısa sürede dönüş yapacağız.",
  isFromSupport = true,
  ticketUrl = `${baseUrl}/portal/support/tickets/07a6cc03-5ed9-483e-b26c-da0f3c4a4b83`,
  siteSettings,
}: TicketNewMessageEmailProps) => {
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || getContactInfo();
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = isFromSupport 
    ? `Destek ekibinden yeni mesaj: ${messageContent.substring(0, 50)}...`
    : `Yeni mesaj: ${messageContent.substring(0, 50)}...`;

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
            <Heading style={h1}>
              {isFromSupport ? 'Destek Ekibinden Yeni Mesaj' : 'Talebinize Yeni Mesaj'}
            </Heading>
            
            <Text style={text}>
              <strong>{ticketNumber}</strong> numaralı destek talebinize yeni bir mesaj eklendi.
            </Text>

            {/* Ticket Info */}
            <Section style={infoBox}>
              <Text style={infoLabel}>Konu:</Text>
              <Text style={infoValue}>{subject}</Text>
              
              <Hr style={infoDivider} />
              
              <Text style={infoLabel}>Gönderen:</Text>
              <Text style={infoValue}>{authorName}</Text>
            </Section>

            {/* Message Content */}
            <Section style={messageBox}>
              <Text style={messageLabel}>Mesaj:</Text>
              <Text style={messageContent}>{messageContent}</Text>
            </Section>

            <Text style={text}>
              {isFromSupport 
                ? 'Yanıtlamak için aşağıdaki butona tıklayın:'
                : 'Mesajı görüntülemek için aşağıdaki butona tıklayın:'}
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={ticketUrl}>
                {isFromSupport ? 'Yanıtla' : 'Mesajı Görüntüle'}
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

export default TicketNewMessageEmail;

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

const infoBox = {
  backgroundColor: "#f1f5f9",
  borderRadius: "8px",
  padding: "20px",
  marginTop: "20px",
  marginBottom: "20px",
};

const infoLabel = {
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0 0 4px 0",
};

const infoValue = {
  color: "#1e293b",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px 0",
};

const infoDivider = {
  borderColor: "#cbd5e1",
  margin: "12px 0",
};

const messageBox = {
  backgroundColor: "#ffffff",
  border: "2px solid #e2e8f0",
  borderRadius: "8px",
  padding: "24px",
  marginTop: "24px",
  marginBottom: "24px",
};

const messageLabel = {
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  marginBottom: "12px",
};

const messageContent = {
  color: "#1e293b",
  fontSize: "16px",
  lineHeight: "1.8",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
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

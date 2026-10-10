import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Section,
  Text,
  Heading,
  Preview,
} from "@react-email/components";
import * as React from "react";
import { EmailHeader } from "../../mail/components/EmailHeader";
import { EmailFooter } from "../../mail/components/EmailFooter";

interface TicketNewMessageEmailProps {
  ticketId?: string;
  displayNumber?: string;
  subject?: string;
  recipientName?: string;
  senderName?: string;
  messageContent?: string;
  ticketUrl?: string;
  isCustomer?: boolean;
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
  displayNumber = "SUP-00001",
  subject = "Test Destek Talebi",
  recipientName = "Değerli Kullanıcı",
  senderName = "Destek Ekibi",
  messageContent = "Test mesaj içeriği",
  ticketUrl = `${baseUrl}/portal/support/tickets/07a6cc03-5ed9-483e-b26c-da0f3c4a4b83`,
  isCustomer = true,
  siteSettings,
}: TicketNewMessageEmailProps) => {
  const companyName = siteSettings?.companyName || 'Aluplan';
  const logoUrl = siteSettings?.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || {
    email: 'support@affexai.com',
    phone: '',
    address: ''
  };
  const socialMediaLinks = siteSettings?.socialMedia || {};

  const previewText = `${senderName} tarafından yeni mesaj: ${messageContent.substring(0, 100)}...`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <EmailHeader
            companyName={companyName}
            logoUrl={logoUrl}
            baseUrl={baseUrl}
            showTagline={false}
          />

          <Section style={content}>
            <Heading style={h1}>
              💬 {displayNumber} - Yeni Mesaj
            </Heading>

            <Text style={text}>
              Merhaba {recipientName},
            </Text>

            <Text style={text}>
              <strong>{senderName}</strong> tarafından talebinize yeni bir mesaj eklendi:
            </Text>

            <Section style={ticketInfoBox}>
              <Text style={ticketLabel}>📋 Talep:</Text>
              <Text style={ticketValue}>{displayNumber} - {subject}</Text>
            </Section>

            <Section style={messageBox}>
              <Text style={messageSender}>
                👤 {senderName}
              </Text>
              <Hr style={messageDivider} />
              <Text style={messageText}>
                {messageContent}
              </Text>
            </Section>

            <Text style={text}>
              Mesajı görüntülemek ve yanıt vermek için:
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={ticketUrl}>
                💬 Mesajı Görüntüle ve Yanıtla
              </Button>
            </Section>

            {isCustomer && (
              <Text style={helpText}>
                💡 Destek ekibimiz size en kısa sürede yanıt verecektir.
              </Text>
            )}

            <Hr style={hr} />

            <Text style={footer}>
              Bu e-posta {companyName} destek sistemi tarafından otomatik olarak gönderilmiştir.
              <br />
              Talep numarası: {displayNumber}
            </Text>
          </Section>

          <EmailFooter
            companyName={companyName}
            contactInfo={contactInfo}
            socialMediaLinks={socialMediaLinks}
            baseUrl={baseUrl}
          />
        </Container>
      </Body>
    </Html>
  );
};

export default TicketNewMessageEmail;

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

const ticketInfoBox = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "16px",
  marginTop: "20px",
  marginBottom: "20px",
};

const ticketLabel = {
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "500",
  margin: "0 0 4px 0",
  textTransform: "uppercase" as const,
};

const ticketValue = {
  color: "#1e293b",
  fontSize: "15px",
  fontWeight: "600",
  margin: "0",
};

const messageBox = {
  backgroundColor: "#ffffff",
  border: "2px solid #e2e8f0",
  borderLeft: "4px solid #1e40af",
  borderRadius: "8px",
  padding: "20px",
  marginTop: "24px",
  marginBottom: "24px",
};

const messageSender = {
  color: "#1e40af",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const messageDivider = {
  borderColor: "#e2e8f0",
  margin: "12px 0",
};

const messageText = {
  color: "#1e293b",
  fontSize: "15px",
  lineHeight: "1.6",
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

const helpText = {
  color: "#64748b",
  fontSize: "14px",
  textAlign: "center" as const,
  fontStyle: "italic",
  marginTop: "24px",
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

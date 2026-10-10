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

interface TicketResolvedEmailProps {
  ticketId?: string;
  ticketNumber?: string;
  subject?: string;
  customerName?: string;
  resolvedByName?: string;
  resolutionNotes?: string;
  ticketUrl?: string;
  feedbackUrl?: string;
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

export const TicketResolvedEmail = ({
  ticketId = "07a6cc03-5ed9-483e-b26c-da0f3c4a4b83",
  ticketNumber = "#12345",
  subject = "Test Destek Talebi",
  customerName = "Değerli Müşterimiz",
  resolvedByName = "Ahmet Yılmaz",
  resolutionNotes = "Sorununuz çözümlendi. Yapılan işlemler hakkında detaylı bilgi talep mesajlarından ulaşabilirsiniz.",
  ticketUrl = `${baseUrl}/portal/support/tickets/07a6cc03-5ed9-483e-b26c-da0f3c4a4b83`,
  feedbackUrl = `${baseUrl}/portal/support/tickets/07a6cc03-5ed9-483e-b26c-da0f3c4a4b83/feedback`,
  siteSettings,
}: TicketResolvedEmailProps) => {
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || getContactInfo();
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `Destek talebiniz çözümlendi: ${subject}`;

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
            {/* Success Icon */}
            <Section style={iconContainer}>
              <div style={successIcon}>✓</div>
            </Section>

            <Heading style={h1}>Destek Talebiniz Çözümlendi</Heading>
            
            <Text style={text}>
              Merhaba {customerName},
            </Text>
            
            <Text style={text}>
              <strong>{ticketNumber}</strong> numaralı destek talebiniz başarıyla çözümlendi.
            </Text>

            {/* Ticket Details Box */}
            <Section style={ticketBox}>
              <Text style={ticketLabel}>Konu:</Text>
              <Text style={ticketValue}>{subject}</Text>
              
              <Hr style={ticketDivider} />
              
              <Text style={ticketLabel}>Çözümleyen:</Text>
              <Text style={ticketValue}>{resolvedByName}</Text>
              
              {resolutionNotes && (
                <>
                  <Hr style={ticketDivider} />
                  <Text style={ticketLabel}>Çözüm Notları:</Text>
                  <Text style={resolutionText}>{resolutionNotes}</Text>
                </>
              )}
            </Section>

            <Text style={text}>
              Eğer sorununuz tam olarak çözülmediyse, talebi yeniden açabilir veya yeni bir destek talebi oluşturabilirsiniz.
            </Text>

            <Section style={buttonContainer}>
              <Button style={buttonPrimary} href={ticketUrl}>
                Talebi Görüntüle
              </Button>
            </Section>

            <Hr style={hr} />

            {/* Feedback Section */}
            <Section style={feedbackSection}>
              <Heading style={h2}>Hizmetimizi Değerlendirin</Heading>
              
              <Text style={feedbackText}>
                Aldığınız hizmet hakkında görüşleriniz bizim için çok değerli. Lütfen birkaç dakikanızı ayırarak bizi değerlendirin.
              </Text>

              <Section style={buttonContainer}>
                <Button style={buttonSecondary} href={feedbackUrl}>
                  Geri Bildirim Verin
                </Button>
              </Section>
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

export default TicketResolvedEmail;

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

const iconContainer = {
  textAlign: "center" as const,
  marginTop: "24px",
  marginBottom: "24px",
};

const successIcon = {
  display: "inline-block",
  width: "64px",
  height: "64px",
  borderRadius: "50%",
  backgroundColor: "#10b981",
  color: "#ffffff",
  fontSize: "36px",
  lineHeight: "64px",
  fontWeight: "700",
};

const h1 = {
  color: "#1e293b",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.4",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const h2 = {
  color: "#1e293b",
  fontSize: "20px",
  fontWeight: "600",
  lineHeight: "1.4",
  marginBottom: "16px",
  textAlign: "center" as const,
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
  margin: "0 0 16px 0",
};

const resolutionText = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
};

const ticketDivider = {
  borderColor: "#cbd5e1",
  margin: "16px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "24px",
  marginBottom: "24px",
};

const buttonPrimary = {
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

const buttonSecondary = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const feedbackSection = {
  backgroundColor: "#fefce8",
  borderRadius: "8px",
  padding: "32px 24px",
  marginTop: "32px",
};

const feedbackText = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "1.6",
  textAlign: "center" as const,
  marginBottom: "20px",
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

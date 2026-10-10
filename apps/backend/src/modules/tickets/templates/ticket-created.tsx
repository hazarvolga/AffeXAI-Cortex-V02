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
import { EmailHeader } from "../../mail/components/EmailHeader";
import { EmailFooter } from "../../mail/components/EmailFooter";

interface TicketCreatedEmailProps {
  ticketId?: string;
  ticketNumber?: string; // Deprecated: use displayNumber
  displayNumber?: string; // Human-readable number (SUP-00001)
  subject?: string;
  priority?: string;
  customerName?: string;
  ticketUrl?: string;
  // New fields for support team
  isAssignedUser?: boolean;
  isSupportManager?: boolean;
  customerEmail?: string;
  categoryName?: string;
  ticketDescription?: string;
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

const priorityLabels: Record<string, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  urgent: 'Acil',
};

export const TicketCreatedEmail = ({
  ticketId = "07a6cc03-5ed9-483e-b26c-da0f3c4a4b83",
  ticketNumber = "#12345", // Deprecated: use displayNumber
  displayNumber = "SUP-00001",
  subject = "Test Destek Talebi",
  priority = "medium",
  customerName = "Değerli Müşterimiz",
  ticketUrl = `${baseUrl}/portal/support/tickets/07a6cc03-5ed9-483e-b26c-da0f3c4a4b83`,
  isAssignedUser = false,
  isSupportManager = false,
  customerEmail = "",
  categoryName = "",
  ticketDescription = "",
  siteSettings,
}: TicketCreatedEmailProps) => {
  const companyName = siteSettings?.companyName || 'Aluplan';
  const logoUrl = siteSettings?.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || {
    email: 'support@affexai.com',
    phone: '',
    address: ''
  };
  const socialMediaLinks = siteSettings?.socialMedia || {};

  // Use displayNumber if available, fallback to ticketNumber for backward compatibility
  const ticketDisplayNumber = displayNumber || ticketNumber;

  // Determine if this is for support team
  const isSupportTeam = isAssignedUser || isSupportManager;

  const previewText = isSupportTeam
    ? `Yeni Destek Talebi: ${subject}`
    : `Destek talebiniz oluşturuldu: ${subject}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <EmailHeader
            companyName={companyName}
            logoUrl={logoUrl}
            baseUrl={baseUrl}
            showTagline={false}
          />

          {/* Main Content */}
          <Section style={content}>
            {isSupportTeam ? (
              <>
                <Heading style={h1}>
                  {isAssignedUser ? '🎯 Size Yeni Bir Destek Talebi Atandı' : '📢 Yeni Destek Talebi Geldi'}
                </Heading>

                <Text style={text}>
                  Merhaba {customerName},
                </Text>

                <Text style={text}>
                  {isAssignedUser
                    ? 'Size yeni bir destek talebi atandı. Lütfen müşteriye en kısa sürede geri dönüş yapın.'
                    : 'Sistemde yeni bir destek talebi oluşturuldu. Aşağıda talebin detaylarını bulabilirsiniz.'}
                </Text>

                {/* Customer Info for Support Team */}
                <Section style={customerInfoBox}>
                  <Text style={ticketLabel}>👤 Müşteri Bilgileri:</Text>
                  <Text style={ticketValue}>{customerName}</Text>
                  {customerEmail && (
                    <Text style={customerEmailText}>📧 {customerEmail}</Text>
                  )}
                </Section>
              </>
            ) : (
              <>
                <Heading style={h1}>Destek Talebiniz Alındı</Heading>

                <Text style={text}>
                  Merhaba {customerName},
                </Text>

                <Text style={text}>
                  Destek talebiniz başarıyla oluşturuldu ve ekibimiz en kısa sürede size dönüş yapacaktır.
                </Text>
              </>
            )}

            {/* Ticket Details Box */}
            <Section style={ticketBox}>
              <Text style={ticketLabel}>Talep Numarası:</Text>
              <Text style={ticketValue}>{ticketDisplayNumber}</Text>

              <Hr style={ticketDivider} />

              {isSupportTeam && categoryName && (
                <>
                  <Text style={ticketLabel}>📁 Kategori:</Text>
                  <Text style={ticketValue}>{categoryName}</Text>
                  <Hr style={ticketDivider} />
                </>
              )}

              <Text style={ticketLabel}>Konu:</Text>
              <Text style={ticketValue}>{subject}</Text>

              <Hr style={ticketDivider} />

              <Text style={ticketLabel}>Öncelik:</Text>
              <Text style={ticketValue}>{priorityLabels[priority] || priority}</Text>

              {isSupportTeam && ticketDescription && (
                <>
                  <Hr style={ticketDivider} />
                  <Text style={ticketLabel}>📝 Sorun Detayı:</Text>
                  <Text style={descriptionText}>{ticketDescription}</Text>
                </>
              )}
            </Section>

            <Text style={text}>
              {isSupportTeam
                ? 'Talebin tüm detaylarını görüntülemek ve müşteriye yanıt vermek için:'
                : 'Talebinizin detaylarını görüntülemek ve mesajlaşmak için aşağıdaki butona tıklayabilirsiniz:'}
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={ticketUrl}>
                {isSupportTeam ? '🎫 Talebi Görüntüle ve Yanıtla' : 'Talebi Görüntüle'}
              </Button>
            </Section>

            {!isSupportTeam && (
              <Text style={helpText}>
                Ortalama yanıt süresi: {priority === 'urgent' ? '1-2 saat' : priority === 'high' ? '4-6 saat' : '24 saat'}
              </Text>
            )}

            <Hr style={hr} />

            <Text style={footer}>
              Bu e-posta {companyName} destek sistemi tarafından otomatik olarak gönderilmiştir.
              <br />
              Talep numaranızı her zaman belirtiniz: {ticketDisplayNumber}
            </Text>
          </Section>

          {/* Footer */}
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

export default TicketCreatedEmail;

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

const customerInfoBox = {
  backgroundColor: "#eff6ff",
  borderLeft: "4px solid #1e40af",
  borderRadius: "8px",
  padding: "16px 20px",
  marginTop: "20px",
  marginBottom: "20px",
};

const customerEmailText = {
  color: "#475569",
  fontSize: "14px",
  margin: "8px 0 0 0",
};

const descriptionText = {
  color: "#1e293b",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "8px 0 0 0",
  whiteSpace: "pre-wrap" as const,
};

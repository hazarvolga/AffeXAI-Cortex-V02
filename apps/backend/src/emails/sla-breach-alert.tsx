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

interface SlaBreachAlertEmailProps {
  ticketNumber?: string;
  ticketTitle?: string;
  priority?: string;
  customerName?: string;
  assignedAgent?: string;
  breachTime?: string;
  responseTime?: string;
  resolutionTime?: string;
  ticketUrl?: string;
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

export const SlaBreachAlertEmail = ({
  ticketNumber = '#12345',
  ticketTitle = 'Destek Talebi',
  priority = 'High',
  customerName = 'Müşteri',
  assignedAgent = 'Atanmamış',
  breachTime = new Date().toLocaleString('tr-TR'),
  responseTime = '4 saat',
  resolutionTime = '24 saat',
  ticketUrl = `${baseUrl}/admin/support/12345`,
  siteSettings,
}: SlaBreachAlertEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || { address: '', phone: '', email: '' };
  const socialMediaLinks = siteSettings?.socialMedia || {};

  const previewText = `SLA İhlali: ${ticketNumber} - ${ticketTitle}`;

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
            <Heading style={heading}>⚠️ SLA İhlali Uyarısı</Heading>
            <Text style={paragraph}>
              Destek Ekibi,
            </Text>
            <Text style={paragraph}>
              Aşağıdaki destek talebi için SLA (Hizmet Seviyesi Anlaşması) ihlali tespit edildi ve acil müdahale gerekiyor.
            </Text>

            <Section style={criticalSection}>
              <Text style={sectionTitle}>Talep Bilgileri</Text>
              <Text style={detailText}><strong>Talep No:</strong> {ticketNumber}</Text>
              <Text style={detailText}><strong>Başlık:</strong> {ticketTitle}</Text>
              <Text style={detailText}><strong>Öncelik:</strong> <span style={priorityBadge}>{priority}</span></Text>
              <Text style={detailText}><strong>Müşteri:</strong> {customerName}</Text>
              <Text style={detailText}><strong>Atanan:</strong> {assignedAgent}</Text>
            </Section>

            <Section style={slaSection}>
              <Text style={sectionTitle}>SLA Detayları</Text>
              <Text style={detailText}><strong>İhlal Zamanı:</strong> {breachTime}</Text>
              <Text style={detailText}><strong>Yanıt Süresi Hedefi:</strong> {responseTime}</Text>
              <Text style={detailText}><strong>Çözüm Süresi Hedefi:</strong> {resolutionTime}</Text>
            </Section>

            <Text style={urgentText}>
              Bu talep acil müdahale gerektiriyor. Lütfen derhal talebe öncelik verin ve gerekli aksiyonu alın.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={ticketUrl}>
                Talebi Görüntüle
              </Button>
            </Section>

            <Text style={footerNote}>
              Bu otomatik bir uyarı mesajıdır. SLA ihlalleri müşteri memnuniyetini doğrudan etkiler.
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

export default SlaBreachAlertEmail;

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
  color: '#dc2626',
  textAlign: 'center' as const,
  margin: '16px 0 24px',
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: '#3c4043',
  margin: '12px 0',
};

const criticalSection = {
  backgroundColor: '#fef2f2',
  border: '2px solid #dc2626',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const slaSection = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fbbf24',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};

const sectionTitle = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#1f2937',
  margin: '0 0 12px 0',
};

const detailText = {
  margin: '8px 0',
  fontSize: '14px',
  color: '#374151',
};

const priorityBadge = {
  backgroundColor: '#dc2626',
  color: '#ffffff',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '600' as const,
};

const urgentText = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#dc2626',
  fontWeight: '600' as const,
  margin: '20px 0',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#dc2626",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  fontWeight: '600' as const,
};

const footerNote = {
  fontSize: '13px',
  color: '#6b7280',
  textAlign: 'center' as const,
  fontStyle: 'italic' as const,
  margin: '24px 0 0 0',
};

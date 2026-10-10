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

interface SlaApproachingAlertEmailProps {
  ticketNumber?: string;
  ticketTitle?: string;
  priority?: string;
  customerName?: string;
  assignedAgent?: string;
  remainingTime?: string;
  slaDeadline?: string;
  responseTime?: string;
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

export const SlaApproachingAlertEmail = ({
  ticketNumber = '#12345',
  ticketTitle = 'Destek Talebi',
  priority = 'High',
  customerName = 'Müşteri',
  assignedAgent = 'Atanmamış',
  remainingTime = '30 dakika',
  slaDeadline = new Date(Date.now() + 30 * 60000).toLocaleString('tr-TR'),
  responseTime = '4 saat',
  ticketUrl = `${baseUrl}/admin/support/12345`,
  siteSettings,
}: SlaApproachingAlertEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || { address: '', phone: '', email: '' };
  const socialMediaLinks = siteSettings?.socialMedia || {};

  const previewText = `SLA Uyarısı: ${ticketNumber} - ${remainingTime} kaldı`;

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
            <Heading style={heading}>⏰ SLA Süresi Dolmak Üzere</Heading>
            <Text style={paragraph}>
              Merhaba {assignedAgent},
            </Text>
            <Text style={paragraph}>
              Sorumlu olduğunuz bir destek talebi için SLA (Hizmet Seviyesi Anlaşması) süresi dolmak üzere. İhlali önlemek için acil aksiyon gerekiyor.
            </Text>

            <Section style={warningSection}>
              <Text style={sectionTitle}>Talep Bilgileri</Text>
              <Text style={detailText}><strong>Talep No:</strong> {ticketNumber}</Text>
              <Text style={detailText}><strong>Başlık:</strong> {ticketTitle}</Text>
              <Text style={detailText}><strong>Öncelik:</strong> <span style={priorityBadge}>{priority}</span></Text>
              <Text style={detailText}><strong>Müşteri:</strong> {customerName}</Text>
            </Section>

            <Section style={timeSection}>
              <Text style={countdownTitle}>⏰ Kalan Süre</Text>
              <Text style={countdownText}>{remainingTime}</Text>
              <Text style={deadlineText}>Son Tarih: {slaDeadline}</Text>
              <Text style={targetText}>Yanıt Hedefi: {responseTime}</Text>
            </Section>

            <Text style={actionText}>
              Lütfen talebi inceleyin ve müşteriye ilk yanıtınızı en kısa sürede verin.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={ticketUrl}>
                Talebi Yanıtla
              </Button>
            </Section>

            <Section style={tipsSection}>
              <Text style={tipsTitle}>💡 Hızlı İpuçları</Text>
              <Text style={tipText}>• Müşteriye durumu bildirin (işlem devam ediyor)</Text>
              <Text style={tipText}>• Gerekirse yöneticinizden destek isteyin</Text>
              <Text style={tipText}>• İlk yanıtınız detaylı olmak zorunda değil</Text>
            </Section>

            <Text style={footerNote}>
              Bu proaktif bir uyarı mesajıdır. SLA hedeflerimize ulaşmak için birlikte çalışıyoruz.
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

export default SlaApproachingAlertEmail;

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
  color: '#f59e0b',
  textAlign: 'center' as const,
  margin: '16px 0 24px',
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: '#3c4043',
  margin: '12px 0',
};

const warningSection = {
  backgroundColor: '#fffbeb',
  border: '2px solid #fbbf24',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const timeSection = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fca5a5',
  borderRadius: '8px',
  padding: '24px',
  margin: '20px 0',
  textAlign: 'center' as const,
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
  backgroundColor: '#f59e0b',
  color: '#ffffff',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '600' as const,
};

const countdownTitle = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#6b7280',
  margin: '0 0 8px 0',
};

const countdownText = {
  fontSize: '32px',
  fontWeight: '700' as const,
  color: '#dc2626',
  margin: '8px 0',
};

const deadlineText = {
  fontSize: '14px',
  color: '#4b5563',
  margin: '12px 0 4px 0',
};

const targetText = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '4px 0 0 0',
};

const actionText = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#f59e0b',
  fontWeight: '600' as const,
  margin: '20px 0',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#f59e0b",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  fontWeight: '600' as const,
};

const tipsSection = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #86efac',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const tipsTitle = {
  fontSize: '15px',
  fontWeight: '600' as const,
  color: '#166534',
  margin: '0 0 12px 0',
};

const tipText = {
  fontSize: '13px',
  color: '#166534',
  margin: '6px 0',
  lineHeight: '20px',
};

const footerNote = {
  fontSize: '13px',
  color: '#6b7280',
  textAlign: 'center' as const,
  fontStyle: 'italic' as const,
  margin: '24px 0 0 0',
};

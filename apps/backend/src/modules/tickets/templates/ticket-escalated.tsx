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
import { EmailFooter } from "../../mail/components/EmailFooter";

interface TicketEscalatedEmailProps {
  recipientName?: string;
  ticketNumber?: string;
  ticketTitle?: string;
  priority?: string;
  customerName?: string;
  escalationReason?: string;
  previousAgent?: string;
  createdAt?: string;
  lastUpdate?: string;
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

export const TicketEscalatedEmail = ({
  recipientName = 'Yönetici',
  ticketNumber = '#12345',
  ticketTitle = 'Destek Talebi',
  priority = 'High',
  customerName = 'Müşteri',
  escalationReason = 'SLA ihlali ve müşteri memnuniyetsizliği',
  previousAgent = 'Destek Ekibi',
  createdAt = new Date(Date.now() - 48 * 3600000).toLocaleString('tr-TR'),
  lastUpdate = new Date(Date.now() - 2 * 3600000).toLocaleString('tr-TR'),
  ticketUrl = `${baseUrl}/admin/support/12345`,
  siteSettings,
}: TicketEscalatedEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || 'Aluplan';
  const logoUrl = siteSettings?.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || {
    email: 'support@affexai.com',
    phone: '',
    address: ''
  };
  const socialMediaLinks = siteSettings?.socialMedia || {};

  const previewText = `Talep Yükseltildi: ${ticketNumber} - ${ticketTitle}`;

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
            <Heading style={heading}>🚨 Talep Yükseltildi</Heading>
            <Text style={paragraph}>
              Sayın {recipientName},
            </Text>
            <Text style={paragraph}>
              Bir destek talebi, üst düzey yönetim müdahalesi gerektirdiği için size yükseltildi. Acil incelemeniz ve müdahaleniz beklenmektedir.
            </Text>

            <Section style={escalationSection}>
              <Text style={sectionTitle}>📋 Talep Bilgileri</Text>
              <Text style={detailText}><strong>Talep No:</strong> {ticketNumber}</Text>
              <Text style={detailText}><strong>Başlık:</strong> {ticketTitle}</Text>
              <Text style={detailText}><strong>Öncelik:</strong> <span style={priorityBadge}>{priority}</span></Text>
              <Text style={detailText}><strong>Müşteri:</strong> {customerName}</Text>
              <Text style={detailText}><strong>Önceki Sorumlu:</strong> {previousAgent}</Text>
            </Section>

            <Section style={reasonSection}>
              <Text style={reasonTitle}>⚠️ Yükseltme Nedeni</Text>
              <Text style={reasonText}>{escalationReason}</Text>
            </Section>

            <Section style={timelineSection}>
              <Text style={sectionTitle}>⏱️ Zaman Çizelgesi</Text>
              <Text style={detailText}><strong>Talep Oluşturulma:</strong> {createdAt}</Text>
              <Text style={detailText}><strong>Son Güncelleme:</strong> {lastUpdate}</Text>
            </Section>

            <Text style={urgentText}>
              Bu talep yüksek önceliklidir ve acil müdahale gerektirir. Lütfen derhal talebi inceleyin ve gerekli aksiyonu belirleyin.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={ticketUrl}>
                Talebi İncele
              </Button>
            </Section>

            <Section style={actionsSection}>
              <Text style={actionsTitle}>📌 Önerilen Aksiyonlar</Text>
              <Text style={actionItem}>✓ Talebin detaylı geçmişini inceleyin</Text>
              <Text style={actionItem}>✓ Müşteriyle doğrudan iletişime geçmeyi düşünün</Text>
              <Text style={actionItem}>✓ Uygun ekip üyesine yeniden atayın veya kendiniz üstlenin</Text>
              <Text style={actionItem}>✓ Gerekirse ek kaynaklar tahsis edin</Text>
              <Text style={actionItem}>✓ Müşteriye durumu bildirin ve beklentileri netleştirin</Text>
            </Section>

            <Text style={footerNote}>
              Yükseltilmiş talepler müşteri memnuniyeti ve şirket itibarı için kritik öneme sahiptir.
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

export default TicketEscalatedEmail;

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
  color: '#7c3aed',
  textAlign: 'center' as const,
  margin: '16px 0 24px',
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: '#3c4043',
  margin: '12px 0',
};

const escalationSection = {
  backgroundColor: '#faf5ff',
  border: '2px solid #a78bfa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const reasonSection = {
  backgroundColor: '#fef3c7',
  border: '2px solid #fbbf24',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 0',
};

const timelineSection = {
  backgroundColor: '#f3f4f6',
  border: '1px solid #d1d5db',
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
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '600' as const,
};

const reasonTitle = {
  fontSize: '15px',
  fontWeight: '600' as const,
  color: '#92400e',
  margin: '0 0 8px 0',
};

const reasonText = {
  fontSize: '14px',
  color: '#78350f',
  lineHeight: '22px',
  margin: '0',
};

const urgentText = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#7c3aed',
  fontWeight: '600' as const,
  margin: '24px 0',
  textAlign: 'center' as const,
  padding: '16px',
  backgroundColor: '#f5f3ff',
  borderRadius: '6px',
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#7c3aed",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  fontWeight: '600' as const,
};

const actionsSection = {
  backgroundColor: '#ecfdf5',
  border: '1px solid #6ee7b7',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const actionsTitle = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#065f46',
  margin: '0 0 16px 0',
};

const actionItem = {
  fontSize: '14px',
  color: '#047857',
  margin: '10px 0',
  lineHeight: '22px',
  paddingLeft: '8px',
};

const footerNote = {
  fontSize: '13px',
  color: '#6b7280',
  textAlign: 'center' as const,
  fontStyle: 'italic' as const,
  margin: '24px 0 0 0',
  padding: '16px',
  backgroundColor: '#f9fafb',
  borderRadius: '4px',
};

import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import { EmailFooter } from '../../mail/components/EmailFooter';

interface CSATSurveyEmailProps {
  customerName: string;
  ticketTitle: string;
  ticketId: string;
  surveyUrl: string;
  agentName?: string;
  siteSettings: {
    siteName: string;
    siteUrl: string;
    supportEmail: string;
  };
}

export const CSATSurveyEmail: React.FC<CSATSurveyEmailProps> = ({
  customerName = 'Değerli Müşterimiz',
  ticketTitle = 'Destek Talebi',
  ticketId = '#12345',
  surveyUrl = 'https://example.com/survey/token',
  agentName = 'Destek Ekibi',
  siteSettings = {
    siteName: 'Aluplan',
    siteUrl: 'https://aluplan.com',
    supportEmail: 'support@aluplan.com',
  },
}) => {
  return (
    <Html>
      <Head />
      <Preview>
        {siteSettings.siteName} - Memnuniyet Anketi: {ticketTitle}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={heading}>💬 Memnuniyet Anketi</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={greeting}>Merhaba {customerName},</Text>

            <Text style={paragraph}>
              <strong>{ticketId}</strong> numaralı destek talebiniz çözümlendi.
              Hizmetimizden memnuniyetinizi öğrenmek isteriz.
            </Text>

            {/* Ticket Info Box */}
            <Section style={infoBox}>
              <Text style={infoLabel}>Destek Talebi:</Text>
              <Text style={infoValue}>{ticketTitle}</Text>
              {agentName && (
                <>
                  <Text style={infoLabel}>Çözüme Yardımcı Olan:</Text>
                  <Text style={infoValue}>{agentName}</Text>
                </>
              )}
            </Section>

            {/* Survey Questions Preview */}
            <Section style={surveyPreview}>
              <Text style={surveyTitle}>⭐ Ankete Katılın (30 saniye)</Text>
              <Text style={surveyQuestion}>
                1. Aldığınız hizmetten ne kadar memnunsunuz? (1-5 yıldız)
              </Text>
              <Text style={surveyQuestion}>
                2. Çözüm süresi beklentilerinizi karşıladı mı?
              </Text>
              <Text style={surveyQuestion}>
                3. Ek görüşlerinizi paylaşın (opsiyonel)
              </Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button href={surveyUrl} style={button}>
                Ankete Katıl
              </Button>
            </Section>

            <Text style={smallText}>
              Alternatif olarak bu linki kullanabilirsiniz:
              <br />
              <a href={surveyUrl} style={link}>
                {surveyUrl}
              </a>
            </Text>

            <Hr style={divider} />

            {/* Why Surveys Matter */}
            <Section style={whySurveysSection}>
              <Text style={whySurveysTitle}>🎯 Neden Önemli?</Text>
              <Text style={paragraph}>
                • Geri bildiriminiz hizmet kalitemizi artırır
                <br />
                • Süreçlerimizi geliştirmemize yardımcı olur
                <br />
                • Müşteri deneyimini iyileştirir
                <br />• Sadece 30 saniye sürer
              </Text>
            </Section>

            <Text style={thanksText}>
              Zamanınız için teşekkür ederiz!
              <br />
              {siteSettings.siteName} Destek Ekibi
            </Text>
          </Section>

          {/* Footer */}
          <EmailFooter
            companyName={siteSettings.siteName}
            contactInfo={{ email: siteSettings.supportEmail, phone: '', address: '' }}
            socialMediaLinks={{}}
            baseUrl={siteSettings.siteUrl}
          />
        </Container>
      </Body>
    </Html>
  );
};

export default CSATSurveyEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#667eea',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '0',
};

const content = {
  padding: '0 48px',
};

const greeting = {
  fontSize: '18px',
  lineHeight: '1.4',
  color: '#484848',
  fontWeight: '500',
  marginBottom: '16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#484848',
  marginBottom: '16px',
};

const infoBox = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #e9ecef',
  marginBottom: '24px',
};

const infoLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#6c757d',
  textTransform: 'uppercase' as const,
  marginBottom: '4px',
  marginTop: '0',
};

const infoValue = {
  fontSize: '16px',
  color: '#212529',
  marginTop: '0',
  marginBottom: '12px',
  fontWeight: '500',
};

const surveyPreview = {
  backgroundColor: '#f0f4ff',
  padding: '24px',
  borderRadius: '8px',
  border: '2px dashed #667eea',
  marginBottom: '24px',
};

const surveyTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#667eea',
  marginTop: '0',
  marginBottom: '16px',
};

const surveyQuestion = {
  fontSize: '14px',
  color: '#484848',
  marginBottom: '8px',
  paddingLeft: '4px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '24px',
};

const button = {
  backgroundColor: '#667eea',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
};

const smallText = {
  fontSize: '13px',
  color: '#6c757d',
  lineHeight: '1.6',
  textAlign: 'center' as const,
  marginTop: '16px',
};

const link = {
  color: '#667eea',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const divider = {
  borderColor: '#e9ecef',
  margin: '32px 0',
};

const whySurveysSection = {
  backgroundColor: '#fff3cd',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #ffc107',
  marginBottom: '24px',
};

const whySurveysTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#856404',
  marginTop: '0',
  marginBottom: '12px',
};

const thanksText = {
  fontSize: '16px',
  color: '#484848',
  lineHeight: '1.6',
  marginTop: '24px',
  textAlign: 'center' as const,
  fontWeight: '500',
};

import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Heading,
  Hr,
} from "@react-email/components";
import * as React from "react";
import { EmailFooter } from "../../mail/components/EmailFooter";

interface CertificateIssuedEmailProps {
  recipientName?: string;
  trainingTitle?: string;
  certificateNumber?: string;
  issueDate?: string;
  verificationUrl?: string;
  baseUrl?: string;
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

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9003";

export const CertificateIssuedEmail = ({
  recipientName = "Ahmet Yılmaz",
  trainingTitle = "İleri Seviye Teknik Eğitim",
  certificateNumber = "ALP-TR-2025-01-ABC123",
  issueDate = "15 Ocak 2025",
  verificationUrl = `${baseUrl}/certificates/verify/ABC123`,
  siteSettings,
}: CertificateIssuedEmailProps) => {
  const companyName = siteSettings?.companyName || "XYZ Company";
  const contactInfo = siteSettings?.contact || {
    email: "support@affexai.com",
    phone: "",
    address: "",
  };
  const socialMediaLinks = siteSettings?.socialMedia || {};

  const previewText = `Sertifikanız hazır: ${trainingTitle}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={heading}>{companyName}</Heading>
            <Text style={headerSubtitle}>Sertifika Sistemi</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading as="h2" style={h2}>
              🎓 Sertifikanız Hazır!
            </Heading>

            <Text style={paragraph}>
              Sayın <strong>{recipientName}</strong>,
            </Text>

            <Text style={paragraph}>
              Tebrikler! <strong>{trainingTitle}</strong> eğitimini başarıyla
              tamamladınız. Sertifikanız ekte yer almaktadır.
            </Text>

            {/* Certificate Info Box */}
            <Section style={certificateInfo}>
              <Text style={infoLabel}>Sertifika Bilgileri:</Text>
              <Hr style={hr} />

              <Text style={infoItem}>
                <strong>Sertifika No:</strong> {certificateNumber}
              </Text>
              <Text style={infoItem}>
                <strong>Eğitim:</strong> {trainingTitle}
              </Text>
              <Text style={infoItem}>
                <strong>Düzenleme Tarihi:</strong> {issueDate}
              </Text>
            </Section>

            <Text style={paragraph}>
              Sertifikanızı PDF formatında ekte bulabilirsiniz. Ayrıca
              sertifikanızın geçerliliğini aşağıdaki doğrulama bağlantısı ile
              kontrol edebilirsiniz:
            </Text>

            {/* Verification Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={verificationUrl}>
                Sertifikayı Doğrula
              </Button>
            </Section>

            <Text style={noteText}>
              <strong>Not:</strong> Bu sertifika numarası ile sertifikanızın
              özgünlüğünü istediğiniz zaman doğrulayabilirsiniz.
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              Eğitimlerimiz hakkında daha fazla bilgi için{" "}
              <Link href={`${baseUrl}/egitim`} style={link}>
                eğitim sayfamızı
              </Link>{" "}
              ziyaret edebilirsiniz.
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

export default CertificateIssuedEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  padding: "30px",
  textAlign: "center" as const,
  borderRadius: "8px 8px 0 0",
};

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#ffffff",
  margin: "0",
};

const headerSubtitle = {
  fontSize: "14px",
  color: "#ffffff",
  opacity: 0.9,
  margin: "8px 0 0 0",
};

const content = {
  padding: "30px",
};

const h2 = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#333",
  marginBottom: "16px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#333",
  marginBottom: "16px",
};

const certificateInfo = {
  backgroundColor: "#f9f9f9",
  padding: "24px",
  borderRadius: "8px",
  margin: "24px 0",
  borderLeft: "4px solid #667eea",
};

const infoLabel = {
  fontSize: "14px",
  fontWeight: "bold",
  color: "#667eea",
  marginBottom: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const infoItem = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#333",
  margin: "8px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#667eea",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const noteText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#666",
  backgroundColor: "#f0f4ff",
  padding: "16px",
  borderRadius: "6px",
  margin: "24px 0",
  borderLeft: "3px solid #667eea",
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "20px 0",
};

const footer = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#666",
  marginTop: "24px",
};

const link = {
  color: "#667eea",
  textDecoration: "underline",
};

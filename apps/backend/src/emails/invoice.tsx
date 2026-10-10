import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Heading,
} from "@react-email/components";
import * as React from "react";
import { siteSettingsData } from "@/lib/site-settings-data";
import { getCompanyName } from "@/lib/server/siteSettings";
import { EmailFooter } from "./components/EmailFooter";

interface InvoiceEmailProps {
  userName?: string;
  invoiceId?: string;
  invoiceDate?: string;
  paymentMethod?: string;
  totalAmount?: string;
  items?: {
    description: string;
    amount: string;
  }[];
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

export const InvoiceEmail = ({
  userName = "Ahmet Yılmaz",
  invoiceId = "INV-2024-08-001",
  invoiceDate = new Date().toLocaleDateString('tr-TR'),
  paymentMethod = "Kredi Kartı (**** **** **** 1234)",
  totalAmount = "450.00 TL",
  items = [
      { description: "Allplan Temel Eğitim (Mimari)", amount: "450.00 TL" },
  ],
  siteSettings,
}: InvoiceEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || { address: '', phone: '', email: '' };
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `Ödemeniz alındı. Fatura #${invoiceId}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={`${baseUrl}${logoUrl}`}
              width="150"
              height="auto"
              alt={companyName}
            />
          </Section>

          <Section style={content}>
            <Heading style={heading}>Ödemeniz Alındı</Heading>
            <Text style={paragraph}>
              Merhaba {userName}, ödemeniz için teşekkür ederiz. İşte faturanızın bir özeti.
            </Text>

            <Section style={invoiceInfoSection}>
              <Row>
                <Column>
                  <Text style={invoiceInfoLabel}>Fatura No</Text>
                  <Text style={invoiceInfoValue}>#{invoiceId}</Text>
                </Column>
                <Column>
                  <Text style={invoiceInfoLabel}>Fatura Tarihi</Text>
                  <Text style={invoiceInfoValue}>{invoiceDate}</Text>
                </Column>
              </Row>
            </Section>

            <Hr style={hr} />

            <Section>
              <Heading as="h2" style={sectionHeading}>
                Fatura Detayları
              </Heading>
              {items.map((item) => (
                <Row key={item.description} style={itemRow}>
                  <Column>
                    <Text style={itemText}>{item.description}</Text>
                  </Column>
                  <Column align="right">
                    <Text style={itemPrice}>{item.amount}</Text>
                  </Column>
                </Row>
              ))}
            </Section>

            <Hr style={hr} />

            <Section>
              <Row style={totalRow}>
                <Column>
                  <Text style={totalLabel}>Genel Toplam</Text>
                </Column>
                <Column align="right">
                  <Text style={totalValue}>{totalAmount}</Text>
                </Column>
              </Row>
            </Section>

             <Hr style={hr} />

            <Section>
              <Row>
                <Column>
                  <Heading as="h2" style={sectionHeading}>
                    Ödeme Bilgisi
                  </Heading>
                  <Text style={addressText}>
                    {paymentMethod}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Section style={{ textAlign: "center", marginTop: "32px" }}>
              <Button style={button} href={`${baseUrl}/portal/invoices/${invoiceId}`}>
                Faturanın Tamamını Görüntüle
              </Button>
            </Section>

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

export default InvoiceEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: "0 auto",
  padding: "20px 0 48px",
  border: '1px solid #e5e5e5',
  borderRadius: '4px',
  maxWidth: '600px',
};

const header = {
  padding: '0 32px',
  textAlign: 'center' as const,
  marginBottom: '20px',
};

const content = {
  padding: '0 32px',
};

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: '#333333'
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: '#445354',
};

const invoiceInfoSection = {
    padding: '16px',
    backgroundColor: '#f6f9fc',
    borderRadius: '4px',
    margin: '20px 0',
}

const invoiceInfoLabel = {
    margin: 0,
    fontSize: '12px',
    color: '#6a7380',
    textTransform: 'uppercase' as const,
}

const invoiceInfoValue = {
    margin: '4px 0 0 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333333',
}


const sectionHeading = {
  fontSize: "20px",
  fontWeight: "bold",
  color: '#333333',
  margin: '24px 0 12px 0',
};

const itemRow = {
    padding: '8px 0',
};

const itemText = {
    margin: 0,
    fontSize: '14px',
    color: '#333333',
};

const itemPrice = {
    margin: 0,
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333333',
};

const totalRow = {
    padding: '8px 0',
};

const totalLabel = {
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333333',
};

const totalValue = {
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ED7D31',
};


const addressText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: '#445354',
};


const button = {
  backgroundColor: "#ED7D31",
  borderRadius: "4px",
  color: "#ffffff",
  fontSize: "15px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
  fontWeight: 'bold',
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "30px 0",
};
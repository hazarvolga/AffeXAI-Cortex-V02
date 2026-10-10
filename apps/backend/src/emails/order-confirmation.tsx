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
import { getCompanyName, getContactInfo } from "@/lib/server/siteSettings";
import { EmailFooter } from "./components/EmailFooter";

interface OrderConfirmationEmailProps {
  userName?: string;
  orderId?: string;
  orderDate?: string;
  totalPrice?: string;
  shippingAddress?: {
    street: string;
    city: string;
    zipCode: string;
  };
  items?: {
    name: string;
    quantity: number;
    price: string;
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

export const OrderConfirmationEmail = ({
  userName = "Ahmet Yılmaz",
  orderId = "AL-12345-TR",
  orderDate = new Date().toLocaleDateString('tr-TR'),
  totalPrice = "1,999.00 TL",
  shippingAddress = {
    street: "Örnek Mah. Teknoloji Cad. No:123, Kat:4 D:12",
    city: "Ataşehir, İstanbul",
    zipCode: "34750",
  },
  items = [
      { name: "Allplan Professional Lisansı (1 Yıl)", quantity: 1, price: "1,999.00 TL" },
  ],
  siteSettings,
}: OrderConfirmationEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || getContactInfo();
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = `Siparişiniz alındı: #${orderId}`;

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
            <Heading style={heading}>Siparişiniz için teşekkürler!</Heading>
            <Text style={paragraph}>
              Merhaba {userName}, siparişiniz başarıyla oluşturuldu. Sipariş detaylarını aşağıda bulabilirsiniz.
            </Text>

            <Section style={orderInfoSection}>
              <Row>
                <Column>
                  <Text style={orderInfoLabel}>Sipariş No</Text>
                  <Text style={orderInfoValue}>#{orderId}</Text>
                </Column>
                <Column>
                  <Text style={orderInfoLabel}>Sipariş Tarihi</Text>
                  <Text style={orderInfoValue}>{orderDate}</Text>
                </Column>
              </Row>
            </Section>

            <Hr style={hr} />

            <Section>
              <Heading as="h2" style={sectionHeading}>
                Sipariş Özeti
              </Heading>
              {items.map((item) => (
                <Row key={item.name} style={itemRow}>
                  <Column>
                    <Text style={itemText}>{item.name} (x{item.quantity})</Text>
                  </Column>
                  <Column align="right">
                    <Text style={itemPrice}>{item.price}</Text>
                  </Column>
                </Row>
              ))}
            </Section>

            <Hr style={hr} />

            <Section>
              <Row style={totalRow}>
                <Column>
                  <Text style={totalLabel}>Toplam</Text>
                </Column>
                <Column align="right">
                  <Text style={totalValue}>{totalPrice}</Text>
                </Column>
              </Row>
            </Section>

             <Hr style={hr} />

            <Section>
              <Row>
                <Column>
                  <Heading as="h2" style={sectionHeading}>
                    Teslimat Adresi
                  </Heading>
                  <Text style={addressText}>
                    {userName}<br />
                    {shippingAddress.street}<br />
                    {shippingAddress.city}<br />
                    {shippingAddress.zipCode}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Section style={{ textAlign: "center", marginTop: "32px" }}>
              <Button style={button} href={`${baseUrl}/portal/orders/${orderId}`}>
                Sipariş Detaylarını Görüntüle
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

export default OrderConfirmationEmail;

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

const orderInfoSection = {
    padding: '16px',
    backgroundColor: '#f6f9fc',
    borderRadius: '4px',
    margin: '20px 0',
}

const orderInfoLabel = {
    margin: 0,
    fontSize: '12px',
    color: '#6a7380',
    textTransform: 'uppercase' as const,
}

const orderInfoValue = {
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
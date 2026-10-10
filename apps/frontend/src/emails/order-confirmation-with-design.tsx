import { Text, Section, Button, Heading, Hr, Row, Column } from "@react-email/components";
import * as React from "react";
import { EmailTemplateWithDesign, EmailCard } from "./components/EmailTemplateWithDesignSystem";
import { getEmailTemplateData, getEmailStyles, formatCurrency, formatDate } from "./helpers/email-template-helper";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface OrderConfirmationEmailProps {
  orderId: string;
  orderDate: Date | string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
  };
  estimatedDelivery?: string;
  trackingUrl?: string;
  locale?: 'tr' | 'en';
}

export const OrderConfirmationWithDesign = async ({
  orderId,
  orderDate,
  customerName,
  customerEmail,
  items,
  subtotal,
  tax,
  shipping,
  total,
  shippingAddress,
  estimatedDelivery,
  trackingUrl,
  locale = 'tr',
}: OrderConfirmationEmailProps) => {
  // Get template data with design system
  const templateData = await getEmailTemplateData({
    preview: locale === 'tr'
      ? `Sipariş #${orderId} onaylandı`
      : `Order #${orderId} confirmed`,
    subject: locale === 'tr'
      ? "Siparişiniz Onaylandı!"
      : "Your Order is Confirmed!",
    theme: 'light',
    context: 'public',
    showUnsubscribeLink: false, // Transactional email
    locale,
  });

  const { designSystem } = templateData;
  const styles = getEmailStyles(designSystem);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002";

  // Translations
  const t = {
    title: locale === 'tr' ? "Siparişiniz Onaylandı!" : "Order Confirmed!",
    thankYou: locale === 'tr' ? "Teşekkür ederiz!" : "Thank you!",
    intro: locale === 'tr'
      ? "Siparişinizi aldık ve hazırlanmaya başladı. Aşağıda sipariş detaylarınızı bulabilirsiniz."
      : "We've received your order and it's being processed. Find your order details below.",
    orderNumber: locale === 'tr' ? "Sipariş Numarası" : "Order Number",
    orderDate: locale === 'tr' ? "Sipariş Tarihi" : "Order Date",
    orderSummary: locale === 'tr' ? "Sipariş Özeti" : "Order Summary",
    product: locale === 'tr' ? "Ürün" : "Product",
    quantity: locale === 'tr' ? "Adet" : "Qty",
    price: locale === 'tr' ? "Fiyat" : "Price",
    subtotal: locale === 'tr' ? "Ara Toplam" : "Subtotal",
    tax: locale === 'tr' ? "KDV" : "Tax",
    shipping: locale === 'tr' ? "Kargo" : "Shipping",
    total: locale === 'tr' ? "Toplam" : "Total",
    shippingAddress: locale === 'tr' ? "Teslimat Adresi" : "Shipping Address",
    estimatedDelivery: locale === 'tr' ? "Tahmini Teslimat" : "Estimated Delivery",
    trackOrder: locale === 'tr' ? "Siparişimi Takip Et" : "Track Order",
    viewOrder: locale === 'tr' ? "Siparişi Görüntüle" : "View Order",
    nextSteps: locale === 'tr' ? "Sonraki Adımlar" : "Next Steps",
    step1: locale === 'tr'
      ? "Siparişiniz hazırlandığında e-posta ile bilgilendirileceksiniz"
      : "You'll receive an email when your order is ready for shipping",
    step2: locale === 'tr'
      ? "Kargo takip numaranız size SMS ve e-posta ile gönderilecek"
      : "Tracking number will be sent via SMS and email",
    step3: locale === 'tr'
      ? "Teslimat sırasında kurye sizi arayacaktır"
      : "Our courier will contact you during delivery",
    needHelp: locale === 'tr' ? "Yardıma mı ihtiyacınız var?" : "Need help?",
    contact: locale === 'tr'
      ? "Müşteri hizmetlerimizle iletişime geçin"
      : "Contact our customer service",
    free: locale === 'tr' ? "Ücretsiz" : "Free",
  };

  return (
    <EmailTemplateWithDesign {...templateData}>
      {/* Success Banner */}
      <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Text style={{ fontSize: '48px', margin: 0 }}>✅</Text>
        <Heading as="h1" style={{ ...styles.h1, fontSize: '28px', marginTop: '16px' }}>
          {t.title}
        </Heading>
        <Text style={{ ...styles.p, fontSize: '18px', fontWeight: 'bold' }}>
          {t.thankYou}
        </Text>
      </Section>

      {/* Introduction */}
      <Text style={styles.p}>
        {locale === 'tr' ? 'Sayın' : 'Dear'} {customerName},
      </Text>
      <Text style={styles.p}>
        {t.intro}
      </Text>

      {/* Order Info */}
      <EmailCard designSystem={designSystem}>
        <Row>
          <Column>
            <Text style={{ ...styles.small, ...styles.textMuted, margin: 0 }}>
              {t.orderNumber}
            </Text>
            <Text style={{ ...styles.p, fontWeight: 'bold', margin: 0 }}>
              #{orderId}
            </Text>
          </Column>
          <Column align="right">
            <Text style={{ ...styles.small, ...styles.textMuted, margin: 0 }}>
              {t.orderDate}
            </Text>
            <Text style={{ ...styles.p, fontWeight: 'bold', margin: 0 }}>
              {formatDate(orderDate, locale)}
            </Text>
          </Column>
        </Row>
      </EmailCard>

      {/* Order Items */}
      <Section style={{ marginTop: '32px', marginBottom: '32px' }}>
        <Heading as="h2" style={styles.h2}>
          {t.orderSummary}
        </Heading>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${designSystem.colors.border}` }}>
              <th style={{ ...styles.th, textAlign: 'left', paddingBottom: '12px' }}>
                {t.product}
              </th>
              <th style={{ ...styles.th, textAlign: 'center', paddingBottom: '12px' }}>
                {t.quantity}
              </th>
              <th style={{ ...styles.th, textAlign: 'right', paddingBottom: '12px' }}>
                {t.price}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ borderBottom: `1px solid ${designSystem.colors.border}` }}>
                <td style={{ ...styles.td, padding: '12px 0' }}>
                  <Text style={{ margin: 0, fontWeight: 500 }}>{item.name}</Text>
                </td>
                <td style={{ ...styles.td, textAlign: 'center', padding: '12px 0' }}>
                  {item.quantity}
                </td>
                <td style={{ ...styles.td, textAlign: 'right', padding: '12px 0' }}>
                  {formatCurrency(item.price, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Price Summary */}
        <Section style={{ marginTop: '24px', borderTop: `2px solid ${designSystem.colors.border}`, paddingTop: '16px' }}>
          <Row style={{ marginBottom: '8px' }}>
            <Column>
              <Text style={{ ...styles.p, margin: 0 }}>{t.subtotal}:</Text>
            </Column>
            <Column align="right">
              <Text style={{ ...styles.p, margin: 0 }}>{formatCurrency(subtotal, locale)}</Text>
            </Column>
          </Row>
          <Row style={{ marginBottom: '8px' }}>
            <Column>
              <Text style={{ ...styles.p, margin: 0 }}>{t.tax}:</Text>
            </Column>
            <Column align="right">
              <Text style={{ ...styles.p, margin: 0 }}>{formatCurrency(tax, locale)}</Text>
            </Column>
          </Row>
          <Row style={{ marginBottom: '8px' }}>
            <Column>
              <Text style={{ ...styles.p, margin: 0 }}>{t.shipping}:</Text>
            </Column>
            <Column align="right">
              <Text style={{ ...styles.p, margin: 0 }}>
                {shipping === 0 ? t.free : formatCurrency(shipping, locale)}
              </Text>
            </Column>
          </Row>
          <Row style={{ borderTop: `2px solid ${designSystem.colors.border}`, paddingTop: '8px', marginTop: '8px' }}>
            <Column>
              <Text style={{ ...styles.p, fontWeight: 'bold', fontSize: '18px', margin: 0 }}>
                {t.total}:
              </Text>
            </Column>
            <Column align="right">
              <Text style={{
                ...styles.p,
                fontWeight: 'bold',
                fontSize: '18px',
                color: designSystem.colors.primary,
                margin: 0
              }}>
                {formatCurrency(total, locale)}
              </Text>
            </Column>
          </Row>
        </Section>
      </Section>

      {/* Shipping Info */}
      <Section style={{ marginBottom: '32px' }}>
        <Row>
          <Column>
            <EmailCard designSystem={designSystem}>
              <Heading as="h3" style={{ ...styles.h3, marginTop: 0 }}>
                📍 {t.shippingAddress}
              </Heading>
              <Text style={{ ...styles.p, margin: 0 }}>
                {customerName}<br />
                {shippingAddress.street}<br />
                {shippingAddress.city}{shippingAddress.state ? `, ${shippingAddress.state}` : ''} {shippingAddress.zipCode}<br />
                {shippingAddress.country}
              </Text>
            </EmailCard>
          </Column>
          {estimatedDelivery && (
            <Column>
              <EmailCard designSystem={designSystem}>
                <Heading as="h3" style={{ ...styles.h3, marginTop: 0 }}>
                  📦 {t.estimatedDelivery}
                </Heading>
                <Text style={{ ...styles.p, fontWeight: 'bold', fontSize: '18px', margin: 0 }}>
                  {estimatedDelivery}
                </Text>
              </EmailCard>
            </Column>
          )}
        </Row>
      </Section>

      {/* Action Buttons */}
      <Section style={{ textAlign: 'center', marginTop: '40px', marginBottom: '40px' }}>
        <Row>
          <Column align="center">
            {trackingUrl && (
              <Button
                href={trackingUrl}
                style={{
                  ...styles.button.primary,
                  padding: '14px 32px',
                  marginRight: '12px',
                }}
              >
                {t.trackOrder}
              </Button>
            )}
            <Button
              href={`${baseUrl}/orders/${orderId}`}
              style={{
                ...styles.button.secondary,
                padding: '14px 32px',
              }}
            >
              {t.viewOrder}
            </Button>
          </Column>
        </Row>
      </Section>

      <Hr style={styles.hr} />

      {/* Next Steps */}
      <Section>
        <Heading as="h3" style={styles.h3}>
          {t.nextSteps}
        </Heading>
        <ul style={{ paddingLeft: '20px', margin: 0 }}>
          <li style={{ marginBottom: '8px' }}>
            <Text style={{ ...styles.p, margin: 0 }}>{t.step1}</Text>
          </li>
          <li style={{ marginBottom: '8px' }}>
            <Text style={{ ...styles.p, margin: 0 }}>{t.step2}</Text>
          </li>
          <li>
            <Text style={{ ...styles.p, margin: 0 }}>{t.step3}</Text>
          </li>
        </ul>
      </Section>

      {/* Help */}
      <Section style={{ marginTop: '32px', textAlign: 'center' }}>
        <Text style={{ ...styles.small, ...styles.textMuted }}>
          {t.needHelp} {t.contact}
        </Text>
      </Section>
    </EmailTemplateWithDesign>
  );
};

// Default export for testing
export default OrderConfirmationWithDesign;
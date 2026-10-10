import { Text, Section, Button, Heading, Hr, Row, Column, Img } from "@react-email/components";
import * as React from "react";
import { EmailTemplateWithDesign, EmailAlert, EmailCard } from "./components/EmailTemplateWithDesignSystem";
import { getEmailTemplateData, getEmailStyles, formatCurrency, getGreeting } from "./helpers/email-template-helper";

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  description?: string;
}

export interface AbandonedCartEmailProps {
  customerName: string;
  customerEmail: string;
  cartItems: CartItem[];
  cartTotal: number;
  cartUrl: string;
  discountCode?: string;
  discountAmount?: number;
  unsubscribeToken?: string;
  locale?: 'tr' | 'en';
}

export const AbandonedCartWithDesign = async ({
  customerName,
  customerEmail,
  cartItems,
  cartTotal,
  cartUrl,
  discountCode,
  discountAmount,
  unsubscribeToken,
  locale = 'tr',
}: AbandonedCartEmailProps) => {
  // Get template data with design system
  const templateData = await getEmailTemplateData({
    preview: locale === 'tr'
      ? "Sepetinizde ürünler sizi bekliyor!"
      : "Items in your cart are waiting!",
    subject: locale === 'tr'
      ? `${customerName}, sepetinizi unuttunuz mu?`
      : `${customerName}, forgot something?`,
    theme: 'light',
    context: 'public',
    showUnsubscribeLink: true, // Marketing email
    unsubscribeToken,
    locale,
  });

  const { designSystem } = templateData;
  const styles = getEmailStyles(designSystem);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002";

  // Calculate final price with discount
  const finalTotal = discountAmount ? cartTotal - discountAmount : cartTotal;

  // Translations
  const t = {
    greeting: getGreeting(locale),
    title: locale === 'tr'
      ? "Sepetinizdeki Ürünler Sizi Bekliyor!"
      : "Your Cart Items Are Waiting!",
    intro: locale === 'tr'
      ? "Sepetinizde bıraktığınız harika ürünler hala sizin için ayrılmış durumda. Stoklar tükenmeden alışverişinizi tamamlamak ister misiniz?"
      : "The amazing items you left in your cart are still reserved for you. Would you like to complete your purchase before stocks run out?",
    yourCart: locale === 'tr' ? "Sepetinizdeki Ürünler" : "Items in Your Cart",
    quantity: locale === 'tr' ? "Adet" : "Qty",
    price: locale === 'tr' ? "Fiyat" : "Price",
    total: locale === 'tr' ? "Toplam" : "Total",
    discount: locale === 'tr' ? "İndirim" : "Discount",
    finalTotal: locale === 'tr' ? "Ödenecek Tutar" : "Final Total",
    completeOrder: locale === 'tr' ? "Alışverişi Tamamla" : "Complete Purchase",
    specialOffer: locale === 'tr' ? "Özel Teklif!" : "Special Offer!",
    discountMessage: locale === 'tr'
      ? `Size özel ${formatCurrency(discountAmount || 0, locale)} indirim kazandınız! Kod: ${discountCode}`
      : `You've earned ${formatCurrency(discountAmount || 0, locale)} off! Code: ${discountCode}`,
    whyComplete: locale === 'tr' ? "Neden Şimdi Tamamlamalısınız?" : "Why Complete Now?",
    reason1: locale === 'tr' ? "🚚 Ücretsiz kargo fırsatı" : "🚚 Free shipping available",
    reason2: locale === 'tr' ? "⏰ Sınırlı stok - Hızlı tükeniyor" : "⏰ Limited stock - Running out fast",
    reason3: locale === 'tr' ? "🔒 Güvenli ödeme garantisi" : "🔒 Secure payment guaranteed",
    reason4: locale === 'tr' ? "💳 Taksit imkanları mevcut" : "💳 Installment options available",
    needHelp: locale === 'tr' ? "Yardıma mı ihtiyacınız var?" : "Need help?",
    helpText: locale === 'tr'
      ? "Alışverişinizi tamamlarken sorun mu yaşıyorsunuz? Müşteri hizmetlerimiz size yardımcı olmaya hazır."
      : "Having trouble completing your purchase? Our customer service is ready to help.",
    contactUs: locale === 'tr' ? "Bize Ulaşın" : "Contact Us",
    stockWarning: locale === 'tr'
      ? "Sepetinizdeki ürünler 24 saat boyunca rezerve edilir"
      : "Items in your cart are reserved for 24 hours",
  };

  return (
    <EmailTemplateWithDesign {...templateData}>
      {/* Greeting */}
      <Text style={styles.p}>
        {t.greeting} {customerName},
      </Text>

      {/* Title with Icon */}
      <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Text style={{ fontSize: '48px', margin: 0 }}>🛒</Text>
        <Heading as="h1" style={{ ...styles.h1, fontSize: '26px', marginTop: '16px' }}>
          {t.title}
        </Heading>
      </Section>

      {/* Introduction */}
      <Text style={{ ...styles.p, fontSize: '16px', lineHeight: '1.6' }}>
        {t.intro}
      </Text>

      {/* Special Discount Alert */}
      {discountCode && discountAmount && (
        <EmailAlert variant="success" designSystem={designSystem}>
          <Text style={{
            margin: 0,
            fontWeight: 'bold',
            fontSize: '16px',
            color: 'inherit',
            marginBottom: '8px'
          }}>
            🎁 {t.specialOffer}
          </Text>
          <Text style={{ margin: 0, color: 'inherit' }}>
            {t.discountMessage}
          </Text>
        </EmailAlert>
      )}

      {/* Cart Items */}
      <Section style={{ marginTop: '32px', marginBottom: '32px' }}>
        <Heading as="h2" style={styles.h2}>
          {t.yourCart}
        </Heading>

        {cartItems.map((item) => (
          <EmailCard key={item.id} designSystem={designSystem}>
            <Row>
              {item.image && (
                <Column width="100">
                  <Img
                    src={item.image}
                    width="80"
                    height="80"
                    alt={item.name}
                    style={{ borderRadius: designSystem.radius.default }}
                  />
                </Column>
              )}
              <Column>
                <Text style={{ ...styles.p, fontWeight: 'bold', marginBottom: '4px' }}>
                  {item.name}
                </Text>
                {item.description && (
                  <Text style={{ ...styles.small, ...styles.textMuted, margin: 0 }}>
                    {item.description}
                  </Text>
                )}
                <Text style={{ ...styles.small, marginTop: '8px', margin: 0 }}>
                  {t.quantity}: {item.quantity} × {formatCurrency(item.price, locale)}
                </Text>
              </Column>
              <Column align="right" width="120">
                <Text style={{
                  ...styles.p,
                  fontWeight: 'bold',
                  fontSize: '18px',
                  margin: 0,
                  color: designSystem.colors.primary
                }}>
                  {formatCurrency(item.price * item.quantity, locale)}
                </Text>
              </Column>
            </Row>
          </EmailCard>
        ))}

        {/* Price Summary */}
        <Section style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: designSystem.colors.muted,
          borderRadius: designSystem.radius.default
        }}>
          <Row style={{ marginBottom: '8px' }}>
            <Column>
              <Text style={{ ...styles.p, margin: 0 }}>{t.total}:</Text>
            </Column>
            <Column align="right">
              <Text style={{ ...styles.p, margin: 0 }}>
                {formatCurrency(cartTotal, locale)}
              </Text>
            </Column>
          </Row>
          {discountAmount && (
            <Row style={{ marginBottom: '8px' }}>
              <Column>
                <Text style={{ ...styles.p, margin: 0, color: designSystem.colors.success }}>
                  {t.discount} ({discountCode}):
                </Text>
              </Column>
              <Column align="right">
                <Text style={{ ...styles.p, margin: 0, color: designSystem.colors.success }}>
                  -{formatCurrency(discountAmount, locale)}
                </Text>
              </Column>
            </Row>
          )}
          <Row style={{
            borderTop: `2px solid ${designSystem.colors.border}`,
            paddingTop: '8px',
            marginTop: '8px'
          }}>
            <Column>
              <Text style={{
                ...styles.p,
                fontWeight: 'bold',
                fontSize: '20px',
                margin: 0
              }}>
                {t.finalTotal}:
              </Text>
            </Column>
            <Column align="right">
              <Text style={{
                ...styles.p,
                fontWeight: 'bold',
                fontSize: '20px',
                color: designSystem.colors.primary,
                margin: 0
              }}>
                {formatCurrency(finalTotal, locale)}
              </Text>
            </Column>
          </Row>
        </Section>
      </Section>

      {/* CTA Button */}
      <Section style={{ textAlign: 'center', marginTop: '40px', marginBottom: '40px' }}>
        <Button
          href={cartUrl}
          style={{
            ...styles.button.primary,
            padding: '16px 48px',
            fontSize: '18px',
            fontWeight: 'bold',
          }}
        >
          {t.completeOrder} →
        </Button>
      </Section>

      {/* Stock Warning */}
      <EmailAlert variant="warning" designSystem={designSystem}>
        <Text style={{ margin: 0, color: 'inherit', textAlign: 'center' as const }}>
          ⏰ {t.stockWarning}
        </Text>
      </EmailAlert>

      {/* Why Complete Now */}
      <Section style={{ marginTop: '32px', marginBottom: '32px' }}>
        <Heading as="h3" style={styles.h3}>
          {t.whyComplete}
        </Heading>
        <ul style={{ paddingLeft: '20px', margin: 0 }}>
          <li style={{ marginBottom: '8px' }}>
            <Text style={{ ...styles.p, margin: 0 }}>{t.reason1}</Text>
          </li>
          <li style={{ marginBottom: '8px' }}>
            <Text style={{ ...styles.p, margin: 0 }}>{t.reason2}</Text>
          </li>
          <li style={{ marginBottom: '8px' }}>
            <Text style={{ ...styles.p, margin: 0 }}>{t.reason3}</Text>
          </li>
          <li>
            <Text style={{ ...styles.p, margin: 0 }}>{t.reason4}</Text>
          </li>
        </ul>
      </Section>

      <Hr style={styles.hr} />

      {/* Help Section */}
      <Section style={{ textAlign: 'center' }}>
        <Heading as="h3" style={{ ...styles.h3, ...styles.textCenter }}>
          {t.needHelp}
        </Heading>
        <Text style={{ ...styles.p, ...styles.textCenter }}>
          {t.helpText}
        </Text>
        <Button
          href={`${baseUrl}/contact`}
          style={{
            ...styles.button.secondary,
            padding: '12px 24px',
            marginTop: '16px',
          }}
        >
          {t.contactUs}
        </Button>
      </Section>
    </EmailTemplateWithDesign>
  );
};

// Default export for testing
export default AbandonedCartWithDesign;
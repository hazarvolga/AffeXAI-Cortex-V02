/**
 * Smart Email Template Designer
 * Generates context-aware Email Builder structures based on template name/type
 */

interface TemplateContext {
  name: string;
  type?: string;
  description?: string;
}

/**
 * Generate Email Builder structure based on template context
 */
export function generateSmartStructure(context: TemplateContext): any {
  const normalizedName = context.name.toLowerCase();

  // Welcome Email
  if (normalizedName.includes('welcome') || normalizedName.includes('hoş geldin')) {
    return generateWelcomeStructure(context);
  }

  // Password Reset
  if (normalizedName.includes('password') || normalizedName.includes('şifre') || normalizedName.includes('reset')) {
    return generatePasswordResetStructure(context);
  }

  // Order Confirmation
  if (normalizedName.includes('order') || normalizedName.includes('sipariş') || normalizedName.includes('confirmation')) {
    return generateOrderConfirmationStructure(context);
  }

  // Newsletter
  if (normalizedName.includes('newsletter') || normalizedName.includes('bülten') || normalizedName.includes('haber')) {
    return generateNewsletterStructure(context);
  }

  // Promotional
  if (normalizedName.includes('promo') || normalizedName.includes('sale') || normalizedName.includes('kampanya') || normalizedName.includes('indirim')) {
    return generatePromotionalStructure(context);
  }

  // Invoice
  if (normalizedName.includes('invoice') || normalizedName.includes('fatura') || normalizedName.includes('receipt')) {
    return generateInvoiceStructure(context);
  }

  // Account Verification
  if (normalizedName.includes('verify') || normalizedName.includes('activation') || normalizedName.includes('doğrula')) {
    return generateVerificationStructure(context);
  }

  // Event/Meeting
  if (normalizedName.includes('event') || normalizedName.includes('meeting') || normalizedName.includes('etkinlik') || normalizedName.includes('toplantı')) {
    return generateEventStructure(context);
  }

  // Generic/Default
  return generateDefaultStructure(context);
}

// Welcome Email Structure
function generateWelcomeStructure(context: TemplateContext) {
  return {
    rows: [
      {
        id: 'row-logo',
        type: 'section',
        columns: [{
          id: 'col-logo',
          width: '100%',
          blocks: [{
            id: 'block-logo',
            type: 'image',
            properties: {
              src: 'https://via.placeholder.com/200x60?text=Logo',
              alt: 'Company Logo',
              width: '200',
            },
            styles: { align: 'center', borderRadius: '0' },
          }],
        }],
        settings: { padding: '32px 24px', backgroundColor: '#ffffff' },
      },
      {
        id: 'row-welcome',
        type: 'section',
        columns: [{
          id: 'col-welcome',
          width: '100%',
          blocks: [
            {
              id: 'block-heading',
              type: 'heading',
              properties: { level: 1, content: 'Hoş Geldiniz! 🎉' },
              styles: {
                color: '#1a202c',
                fontSize: '32px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginTop: '0',
                marginBottom: '16px',
              },
            },
            {
              id: 'block-text',
              type: 'text',
              properties: { content: 'Aramıza katıldığınız için teşekkür ederiz. Başlamak için heyecanlıyız!' },
              styles: {
                color: '#4a5568',
                fontSize: '16px',
                textAlign: 'center',
                lineHeight: '1.6',
              },
            },
          ],
        }],
        settings: { padding: '32px 24px', backgroundColor: '#f7fafc' },
      },
      {
        id: 'row-steps',
        type: 'section',
        columns: [{
          id: 'col-steps',
          width: '100%',
          blocks: [
            {
              id: 'block-steps-heading',
              type: 'heading',
              properties: { level: 2, content: '3 Basit Adımda Başlayın' },
              styles: { color: '#2d3748', fontSize: '24px', textAlign: 'left' },
            },
            {
              id: 'block-steps-list',
              type: 'text',
              properties: { content: '✅ Profilinizi tamamlayın\n✅ Özelliklerimizi keşfedin\n✅ Ekibinizle bağlantı kurun' },
              styles: { color: '#4a5568', fontSize: '16px', lineHeight: '2' },
            },
          ],
        }],
        settings: { padding: '24px', backgroundColor: '#ffffff' },
      },
      {
        id: 'row-cta',
        type: 'section',
        columns: [{
          id: 'col-cta',
          width: '100%',
          blocks: [{
            id: 'block-button',
            type: 'button',
            properties: { text: 'Profilimi Tamamla', url: '{{profileUrl}}' },
            styles: {
              backgroundColor: '#3182ce',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '8px',
              paddingX: '32px',
              paddingY: '14px',
              align: 'center',
            },
          }],
        }],
        settings: { padding: '24px', backgroundColor: '#ffffff' },
      },
      generateFooterRow(),
    ],
    settings: {
      backgroundColor: '#f5f5f5',
      contentWidth: '600px',
      fonts: ['Inter', 'Roboto'],
    },
  };
}

// Password Reset Structure
function generatePasswordResetStructure(context: TemplateContext) {
  return {
    rows: [
      {
        id: 'row-header',
        type: 'section',
        columns: [{
          id: 'col-header',
          width: '100%',
          blocks: [{
            id: 'block-heading',
            type: 'heading',
            properties: { level: 1, content: 'Şifre Sıfırlama 🔐' },
            styles: {
              color: '#1a202c',
              fontSize: '28px',
              fontWeight: 'bold',
              textAlign: 'center',
            },
          }],
        }],
        settings: { padding: '32px 24px', backgroundColor: '#f7fafc' },
      },
      {
        id: 'row-content',
        type: 'section',
        columns: [{
          id: 'col-content',
          width: '100%',
          blocks: [{
            id: 'block-text',
            type: 'text',
            properties: { content: 'Şifrenizi sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak yeni bir şifre oluşturabilirsiniz.' },
            styles: { color: '#4a5568', fontSize: '16px', lineHeight: '1.6' },
          }],
        }],
        settings: { padding: '24px', backgroundColor: '#ffffff' },
      },
      {
        id: 'row-cta',
        type: 'section',
        columns: [{
          id: 'col-cta',
          width: '100%',
          blocks: [{
            id: 'block-button',
            type: 'button',
            properties: { text: 'Şifremi Sıfırla', url: '{{resetUrl}}' },
            styles: {
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '6px',
              paddingX: '32px',
              paddingY: '14px',
              align: 'center',
            },
          }],
        }],
        settings: { padding: '24px', backgroundColor: '#ffffff' },
      },
      {
        id: 'row-warning',
        type: 'section',
        columns: [{
          id: 'col-warning',
          width: '100%',
          blocks: [{
            id: 'block-warning',
            type: 'text',
            properties: { content: '⚠️ Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.' },
            styles: {
              color: '#d97706',
              fontSize: '14px',
              textAlign: 'center',
              lineHeight: '1.5',
            },
          }],
        }],
        settings: { padding: '24px', backgroundColor: '#fef3c7' },
      },
      generateFooterRow(),
    ],
    settings: {
      backgroundColor: '#f5f5f5',
      contentWidth: '600px',
      fonts: ['Inter'],
    },
  };
}

// Promotional Structure
function generatePromotionalStructure(context: TemplateContext) {
  return {
    rows: [
      {
        id: 'row-hero',
        type: 'section',
        columns: [{
          id: 'col-hero',
          width: '100%',
          blocks: [
            {
              id: 'block-heading',
              type: 'heading',
              properties: { level: 1, content: '🎁 Özel Kampanya!' },
              styles: {
                color: '#ffffff',
                fontSize: '36px',
                fontWeight: 'bold',
                textAlign: 'center',
              },
            },
            {
              id: 'block-subheading',
              type: 'heading',
              properties: { level: 2, content: '%50 İndirim - Sınırlı Süre' },
              styles: {
                color: '#fef3c7',
                fontSize: '24px',
                textAlign: 'center',
              },
            },
          ],
        }],
        settings: { padding: '48px 24px', backgroundColor: '#dc2626' },
      },
      {
        id: 'row-content',
        type: 'section',
        columns: [{
          id: 'col-content',
          width: '100%',
          blocks: [{
            id: 'block-text',
            type: 'text',
            properties: { content: 'Tüm ürünlerde %50\'ye varan indirimler! Bu fırsat kaçmaz. Hemen alışverişe başlayın.' },
            styles: { color: '#4a5568', fontSize: '18px', textAlign: 'center', lineHeight: '1.6' },
          }],
        }],
        settings: { padding: '32px 24px', backgroundColor: '#ffffff' },
      },
      {
        id: 'row-cta',
        type: 'section',
        columns: [{
          id: 'col-cta',
          width: '100%',
          blocks: [{
            id: 'block-button',
            type: 'button',
            properties: { text: 'Hemen Alışveriş Yap', url: '{{shopUrl}}' },
            styles: {
              backgroundColor: '#059669',
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: '700',
              borderRadius: '8px',
              paddingX: '40px',
              paddingY: '16px',
              align: 'center',
            },
          }],
        }],
        settings: { padding: '24px', backgroundColor: '#ffffff' },
      },
      generateFooterRow(),
    ],
    settings: {
      backgroundColor: '#f5f5f5',
      contentWidth: '600px',
      fonts: ['Inter'],
    },
  };
}

// Default/Generic Structure
function generateDefaultStructure(context: TemplateContext) {
  return {
    rows: [
      {
        id: 'row-header',
        type: 'section',
        columns: [{
          id: 'col-header',
          width: '100%',
          blocks: [{
            id: 'block-heading',
            type: 'heading',
            properties: { level: 1, content: context.name || 'Email Şablonu' },
            styles: {
              color: '#1a202c',
              fontSize: '28px',
              fontWeight: 'bold',
              textAlign: 'center',
            },
          }],
        }],
        settings: { padding: '32px 24px', backgroundColor: '#f7fafc' },
      },
      {
        id: 'row-content',
        type: 'section',
        columns: [{
          id: 'col-content',
          width: '100%',
          blocks: [{
            id: 'block-text',
            type: 'text',
            properties: { content: '{{content}}' },
            styles: { color: '#4a5568', fontSize: '16px', lineHeight: '1.6' },
          }],
        }],
        settings: { padding: '24px', backgroundColor: '#ffffff' },
      },
      {
        id: 'row-cta',
        type: 'section',
        columns: [{
          id: 'col-cta',
          width: '100%',
          blocks: [{
            id: 'block-button',
            type: 'button',
            properties: { text: 'İşleme Devam Et', url: '#' },
            styles: {
              backgroundColor: '#3182ce',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '6px',
              paddingX: '32px',
              paddingY: '14px',
              align: 'center',
            },
          }],
        }],
        settings: { padding: '24px', backgroundColor: '#ffffff' },
      },
      generateFooterRow(),
    ],
    settings: {
      backgroundColor: '#f5f5f5',
      contentWidth: '600px',
      fonts: ['Inter'],
    },
  };
}

// Additional template generators (shorter versions)
function generateOrderConfirmationStructure(context: TemplateContext) {
  return { ...generateDefaultStructure(context), /* Custom order confirmation design */ };
}

function generateNewsletterStructure(context: TemplateContext) {
  return { ...generateDefaultStructure(context), /* Custom newsletter design */ };
}

function generateInvoiceStructure(context: TemplateContext) {
  return { ...generateDefaultStructure(context), /* Custom invoice design */ };
}

function generateVerificationStructure(context: TemplateContext) {
  return { ...generateDefaultStructure(context), /* Custom verification design */ };
}

function generateEventStructure(context: TemplateContext) {
  return { ...generateDefaultStructure(context), /* Custom event design */ };
}

// Reusable Footer Row
function generateFooterRow() {
  return {
    id: 'row-footer',
    type: 'section',
    columns: [{
      id: 'col-footer',
      width: '100%',
      blocks: [
        {
          id: 'block-divider',
          type: 'divider',
          properties: {},
          styles: {
            color: '#e2e8f0',
            height: '1px',
            marginTop: '24px',
            marginBottom: '24px',
            borderStyle: 'solid',
          },
        },
        {
          id: 'block-footer-text',
          type: 'text',
          properties: { content: '© 2025 Your Company. All rights reserved.' },
          styles: {
            color: '#a0aec0',
            fontSize: '12px',
            textAlign: 'center',
            lineHeight: '1.5',
          },
        },
      ],
    }],
    settings: { padding: '24px', backgroundColor: '#f7fafc' },
  };
}

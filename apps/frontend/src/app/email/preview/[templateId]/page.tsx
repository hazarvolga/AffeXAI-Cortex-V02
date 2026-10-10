'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Monitor, Smartphone, Download, Send, Palette } from 'lucide-react';
import Link from 'next/link';

// Import all email templates with design system
const emailTemplates: Record<string, any> = {
  'password-reset': async () => {
    const { PasswordResetEmailWithDesign } = await import('@/emails/password-reset-with-design');
    return PasswordResetEmailWithDesign({
      resetUrl: 'https://example.com/reset-password?token=sample-token',
      userEmail: 'user@example.com',
      userName: 'John Doe',
      locale: 'tr'
    });
  },
  'email-verification': async () => {
    const { EmailVerificationWithDesign } = await import('@/emails/email-verification-with-design');
    return EmailVerificationWithDesign({
      verificationUrl: 'https://example.com/verify?token=sample-token',
      userEmail: 'user@example.com',
      userName: 'John Doe',
      verificationCode: '123456',
      locale: 'tr'
    });
  },
  'welcome': async () => {
    const { WelcomeEmailWithDesign } = await import('@/emails/welcome-with-design');
    return WelcomeEmailWithDesign({
      userName: 'John Doe',
      userEmail: 'user@example.com',
      dashboardUrl: '/dashboard',
      unsubscribeToken: 'sample-token',
      locale: 'tr'
    });
  },
  'order-confirmation': async () => {
    const { OrderConfirmationWithDesign } = await import('@/emails/order-confirmation-with-design');
    return OrderConfirmationWithDesign({
      orderId: 'ORD-12345',
      orderDate: new Date(),
      customerName: 'John Doe',
      customerEmail: 'user@example.com',
      items: [
        { id: '1', name: 'Ürün 1', quantity: 2, price: 100 },
        { id: '2', name: 'Ürün 2', quantity: 1, price: 200 }
      ],
      subtotal: 400,
      tax: 72,
      shipping: 0,
      total: 472,
      shippingAddress: {
        street: 'Örnek Mahallesi, Test Sokak No: 123',
        city: 'İstanbul',
        state: 'Türkiye',
        zipCode: '34000',
        country: 'Türkiye'
      },
      estimatedDelivery: '3-5 iş günü',
      trackingUrl: 'https://example.com/tracking',
      locale: 'tr'
    });
  },
  'abandoned-cart': async () => {
    const { AbandonedCartWithDesign } = await import('@/emails/abandoned-cart-with-design');
    return AbandonedCartWithDesign({
      customerName: 'John Doe',
      customerEmail: 'user@example.com',
      cartItems: [
        { id: '1', name: 'Ürün 1', quantity: 2, price: 100, description: 'Harika bir ürün' },
        { id: '2', name: 'Ürün 2', quantity: 1, price: 200, description: 'Başka bir ürün' }
      ],
      cartTotal: 400,
      cartUrl: 'https://example.com/cart',
      discountCode: 'SAVE10',
      discountAmount: 40,
      unsubscribeToken: 'sample-token',
      locale: 'tr'
    });
  },
  'newsletter': async () => {
    const { NewsletterWithDesign } = await import('@/emails/newsletter-with-design');
    return NewsletterWithDesign({
      subscriberName: 'John Doe',
      subscriberEmail: 'user@example.com',
      newsletterTitle: 'Haftalık Bülten',
      newsletterDate: new Date(),
      introText: 'Bu haftanın en önemli haberleri ve güncellemeleri sizler için derledik.',
      featuredArticle: {
        title: 'Öne Çıkan Haber Başlığı',
        description: 'Bu haberde çok önemli gelişmeleri paylaşıyoruz. Detaylı bilgi için okumaya devam edin.',
        link: 'https://example.com/article-1',
        category: 'Teknoloji',
        readTime: '5 dakika'
      },
      articles: [
        {
          title: 'İkinci Haber',
          description: 'Kısa açıklama metni.',
          link: 'https://example.com/article-2',
          category: 'İnovasyon',
          readTime: '3 dakika'
        },
        {
          title: 'Üçüncü Haber',
          description: 'Başka bir haber açıklaması.',
          link: 'https://example.com/article-3',
          category: 'Güncel',
          readTime: '4 dakika'
        }
      ],
      tips: [
        'İpucu 1: Verimliliğinizi artırın',
        'İpucu 2: Yeni özellikleri keşfedin',
        'İpucu 3: Güvenliğinizi koruyun'
      ],
      unsubscribeToken: 'sample-token',
      locale: 'tr'
    });
  }
};

// Legacy templates (without design system)
const legacyTemplates = [
  'invoice',
  'shipping-updates',
  'security-alert',
  'account-summary',
  'product-launch',
  'flash-sale',
  'price-drop-alert',
  'seasonal-campaign',
  'event-invitation',
  're-engagement',
  'feedback-request',
  'survey-nps',
  'thank-you',
  'loyalty-program',
  'milestone-celebration',
  'back-in-stock',
  'feature-update',
  'subscription-renewal',
  'goodbye',
  'onboarding-series',
  'ticket-created',
  'ticket-assigned',
  'ticket-new-message',
  'ticket-resolved'
];

export default function EmailPreviewPage() {
  const params = useParams();
  const templateId = params.templateId as string;
  const [emailContent, setEmailContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    const loadTemplate = async () => {
      setLoading(true);
      setError(null);

      try {
        if (emailTemplates[templateId]) {
          // Load template with design system
          const content = await emailTemplates[templateId]();
          setEmailContent(content);
        } else if (legacyTemplates.includes(templateId)) {
          // Load legacy template
          setError(`Template "${templateId}" henüz Design System ile güncellenmedi.`);
        } else {
          setError('Template bulunamadı.');
        }
      } catch (err) {
        console.error('Error loading template:', err);
        setError('Template yüklenirken hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId]);

  const handleDownload = () => {
    const blob = new Blob([emailContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateId}-email.html`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSendTest = () => {
    // TODO: Implement test email sending
    alert('Test email gönderme özelliği yakında eklenecek!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/email-marketing/templates">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold capitalize">
                  {templateId.replace('-', ' ')} Template Preview
                </h1>
                <p className="text-sm text-gray-500">
                  {emailTemplates[templateId] ? (
                    <span className="flex items-center gap-1">
                      <Palette className="w-3 h-3" />
                      Design System Entegreli
                    </span>
                  ) : (
                    'Legacy Template'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('desktop')}
                  className="rounded-r-none"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('mobile')}
                  className="rounded-l-none"
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>

              {/* Actions */}
              <Button variant="outline" onClick={handleDownload} disabled={!emailContent}>
                <Download className="h-4 w-4 mr-2" />
                HTML İndir
              </Button>
              <Button onClick={handleSendTest} disabled={!emailContent}>
                <Send className="h-4 w-4 mr-2" />
                Test Gönder
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading && (
          <Card className="p-12 text-center">
            <p className="text-gray-500">Template yükleniyor...</p>
          </Card>
        )}

        {error && (
          <Card className="p-12 text-center">
            <p className="text-red-500">{error}</p>
            {legacyTemplates.includes(templateId) && (
              <p className="text-sm text-gray-500 mt-2">
                Bu template henüz Design System ile güncellenmemiş.
                Güncellendiğinde dinamik renk desteği eklenecek.
              </p>
            )}
          </Card>
        )}

        {!loading && !error && emailContent && (
          <div className="bg-gray-100 rounded-lg p-8">
            <div
              className={`mx-auto transition-all duration-300 ${
                viewMode === 'mobile' ? 'max-w-sm' : 'max-w-3xl'
              }`}
            >
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <iframe
                  srcDoc={emailContent}
                  className="w-full"
                  style={{ height: '800px' }}
                  title="Email Preview"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
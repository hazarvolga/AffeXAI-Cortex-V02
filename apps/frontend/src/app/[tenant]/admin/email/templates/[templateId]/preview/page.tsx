'use client';

import { useEffect, useState, useRef, Suspense } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { render } from "@react-email/components";
import templatesService from "@/lib/api/templatesService";
import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import settingsService from "@/lib/api/settingsService";

// Import all email templates
import { WelcomeEmail } from "@/emails/welcome";
import { MonthlyNewsletterEmail } from "@/emails/monthly-newsletter";
import { PasswordResetEmail } from "@/emails/password-reset";
import { EmailVerificationEmail } from "@/emails/email-verification";
import { OrderConfirmationEmail } from "@/emails/order-confirmation";
import { AbandonedCartEmail } from "@/emails/abandoned-cart";
import { AccountSummaryEmail } from "@/emails/account-summary";
import { BackInStockEmail } from "@/emails/back-in-stock";
import { EventInvitationEmail } from "@/emails/event-invitation";
import { FeatureUpdateEmail } from "@/emails/feature-update";
import { FeedbackRequestEmail } from "@/emails/feedback-request";
import { FlashSaleEmail } from "@/emails/flash-sale";
import { GoodbyeEmail } from "@/emails/goodbye";
import { InvoiceEmail } from "@/emails/invoice";
import { LoyaltyProgramEmail } from "@/emails/loyalty-program";
import { MilestoneCelebrationEmail } from "@/emails/milestone-celebration";
import { OnboardingSeriesEmail } from "@/emails/onboarding-series";
import { PriceDropAlertEmail } from "@/emails/price-drop-alert";
import { ProductLaunchEmail } from "@/emails/product-launch";
import { ProductRecommendationEmail } from "@/emails/product-recommendation";
import { ReEngagementEmail } from "@/emails/re-engagement";
import { SeasonalCampaignEmail } from "@/emails/seasonal-campaign";
import { SecurityAlertEmail } from "@/emails/security-alert";
import { ShippingUpdatesEmail } from "@/emails/shipping-updates";
import { SubscriptionRenewalEmail } from "@/emails/subscription-renewal";
import { NpsSurveyEmail } from "@/emails/survey-nps";
import { ThankYouEmail } from "@/emails/thank-you";
import { TestSocialLinksEmail } from "@/emails/test-social-links";

function EmailPreviewContent({ params }: { params: Promise<{ templateId: string }> }) {
  // Unwrap the params promise using React.use()
  const unwrappedParams = use(params);
  const { templateId } = unwrappedParams;
  const searchParams = useSearchParams();
  // Database-Only Architecture: default to 'db' (was 'file' before migration)
  const templateType = searchParams.get('type') || 'db';
  
  const [emailHtml, setEmailHtml] = useState<string>('');
  const [templateName, setTemplateName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedTemplate = useRef(false);

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedTemplate.current) return;
    hasFetchedTemplate.current = true;
    
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        
        // Fetch current site settings
        let siteSettings = null;
        try {
          const fetchedSettings = await settingsService.getSiteSettings();
          // Transform the settings to match the expected structure
          siteSettings = {
            companyName: fetchedSettings.companyName,
            logoUrl: fetchedSettings.logoUrl,
            contact: fetchedSettings.contact,
            socialMedia: fetchedSettings.socialMedia,
          };
        } catch (settingsError) {
          console.error('Error fetching site settings:', settingsError);
        }
        
        if (templateType === 'file') {
          // Render file-based templates
          let html = '';
          
          // Map template IDs to components
          // Check if Design System version exists first
          const designSystemTemplates: Record<string, () => Promise<string>> = {
            'password-reset': async () => {
              const { PasswordResetEmailWithDesign } = await import('@/emails/password-reset-with-design');
              const component = await PasswordResetEmailWithDesign({
                resetUrl: 'https://example.com/reset-password?token=sample-token',
                userEmail: 'user@example.com',
                userName: 'Test Kullanıcı',
                locale: 'tr'
              });
              // Render the React component to HTML string
              return render(component);
            },
            'email-verification': async () => {
              const { EmailVerificationWithDesign } = await import('@/emails/email-verification-with-design');
              const component = await EmailVerificationWithDesign({
                verificationUrl: 'https://example.com/verify?token=sample-token',
                userEmail: 'user@example.com',
                userName: 'Test Kullanıcı',
                verificationCode: '123456',
                locale: 'tr'
              });
              // Render the React component to HTML string
              return render(component);
            },
            'welcome': async () => {
              const { WelcomeEmailWithDesign } = await import('@/emails/welcome-with-design');
              const component = await WelcomeEmailWithDesign({
                userName: 'Test Kullanıcı',
                userEmail: 'user@example.com',
                dashboardUrl: '/dashboard',
                unsubscribeToken: 'sample-token',
                locale: 'tr'
              });
              // Render the React component to HTML string
              return render(component);
            },
            'order-confirmation': async () => {
              const { OrderConfirmationWithDesign } = await import('@/emails/order-confirmation-with-design');
              const component = await OrderConfirmationWithDesign({
                orderId: 'ORD-12345',
                orderDate: new Date(),
                customerName: 'Test Kullanıcı',
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
              // Render the React component to HTML string
              return render(component);
            },
            'abandoned-cart': async () => {
              const { AbandonedCartWithDesign } = await import('@/emails/abandoned-cart-with-design');
              const component = await AbandonedCartWithDesign({
                customerName: 'Test Kullanıcı',
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
              // Render the React component to HTML string
              return render(component);
            },
            'newsletter': async () => {
              const { NewsletterWithDesign } = await import('@/emails/newsletter-with-design');
              const component = await NewsletterWithDesign({
                subscriberName: 'Test Kullanıcı',
                subscriberEmail: 'user@example.com',
                newsletterTitle: 'Haftalık Bülten',
                newsletterDate: new Date(),
                introText: 'Bu haftanın en önemli haberleri ve güncellemeleri sizler için derledik.',
                featuredArticle: {
                  title: 'Öne Çıkan Haber Başlığı',
                  description: 'Bu haberde çok önemli gelişmeleri paylaşıyoruz.',
                  link: 'https://example.com/article-1',
                  category: 'Teknoloji',
                  readTime: '5 dakika'
                },
                articles: [
                  {
                    title: 'İkinci Haber',
                    description: 'Kısa açıklama.',
                    link: 'https://example.com/article-2',
                    category: 'İnovasyon'
                  }
                ],
                tips: ['İpucu 1', 'İpucu 2'],
                unsubscribeToken: 'sample-token',
                locale: 'tr'
              });
              // Render the React component to HTML string
              return render(component);
            }
          };

          // Check if Design System template exists
          if (designSystemTemplates[templateId]) {
            try {
              html = await designSystemTemplates[templateId]();
              // Check if html is a React element that needs rendering
              if (typeof html === 'object' && html !== null) {
                console.error('Template returned an object instead of HTML string');
                html = '<div>Template render hatası - Object döndü</div>';
              }
            } catch (dsError) {
              console.error('Error rendering Design System template:', dsError);
              html = `<div>Design System template render hatası: ${dsError}</div>`;
            }
          } else {
            // Fallback to legacy templates
            const templateComponents: Record<string, React.ComponentType<any>> = {
              'welcome': WelcomeEmail,
              'monthly-newsletter': MonthlyNewsletterEmail,
              'password-reset': PasswordResetEmail,
              'email-verification': EmailVerificationEmail,
              'order-confirmation': OrderConfirmationEmail,
              'abandoned-cart': AbandonedCartEmail,
            'account-summary': AccountSummaryEmail,
            'back-in-stock': BackInStockEmail,
            'event-invitation': EventInvitationEmail,
            'feature-update': FeatureUpdateEmail,
            'feedback-request': FeedbackRequestEmail,
            'flash-sale': FlashSaleEmail,
            'goodbye': GoodbyeEmail,
            'invoice': InvoiceEmail,
            'loyalty-program': LoyaltyProgramEmail,
            'milestone-celebration': MilestoneCelebrationEmail,
            'onboarding-series': OnboardingSeriesEmail,
            'price-drop-alert': PriceDropAlertEmail,
            'product-launch': ProductLaunchEmail,
            'product-recommendation': ProductRecommendationEmail,
            're-engagement': ReEngagementEmail,
            'seasonal-campaign': SeasonalCampaignEmail,
            'security-alert': SecurityAlertEmail,
            'shipping-updates': ShippingUpdatesEmail,
            'subscription-renewal': SubscriptionRenewalEmail,
            'survey-nps': NpsSurveyEmail,
            'thank-you': ThankYouEmail,
            'test-social-links': TestSocialLinksEmail, // Add our test template
          };
          
            const Component = templateComponents[templateId];
            if (Component) {
              // Render with sample props and site settings
              html = render(<Component siteSettings={siteSettings} />);
            } else {
              html = `<div>Şablon bulunamadı: ${templateId}</div>`;
            }
          }

          setEmailHtml(html);
        } else {
          // For database templates, use UnifiedTemplateService
          try {
            // Fetch template metadata first
            const templateResponse = await templatesService.getById(templateId);
            setTemplateName(templateResponse.name || templateId);

            // NEW: Unified template API call
            const response = await fetch(`http://localhost:9006/api/email-templates/unified/${templateId}/preview-html`);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            // Handle wrapped response format: { success, data: { html }, meta }
            const html = result.data?.html || result.html;
            setEmailHtml(html);
          } catch (apiError) {
            console.error('Unified template API error:', apiError);
            // Fallback to file-based template if DB template not found
            let html = '';
            const templateComponents: Record<string, React.ComponentType<any>> = {
              'welcome': WelcomeEmail,
              'monthly-newsletter': MonthlyNewsletterEmail,
              'password-reset': PasswordResetEmail,
              'email-verification': EmailVerificationEmail,
              'order-confirmation': OrderConfirmationEmail,
              'abandoned-cart': AbandonedCartEmail,
              'account-summary': AccountSummaryEmail,
              'back-in-stock': BackInStockEmail,
              'event-invitation': EventInvitationEmail,
              'feature-update': FeatureUpdateEmail,
              'feedback-request': FeedbackRequestEmail,
              'flash-sale': FlashSaleEmail,
              'goodbye': GoodbyeEmail,
              'invoice': InvoiceEmail,
              'loyalty-program': LoyaltyProgramEmail,
              'milestone-celebration': MilestoneCelebrationEmail,
              'onboarding-series': OnboardingSeriesEmail,
              'price-drop-alert': PriceDropAlertEmail,
              'product-launch': ProductLaunchEmail,
              'product-recommendation': ProductRecommendationEmail,
              're-engagement': ReEngagementEmail,
              'seasonal-campaign': SeasonalCampaignEmail,
              'security-alert': SecurityAlertEmail,
              'shipping-updates': ShippingUpdatesEmail,
              'subscription-renewal': SubscriptionRenewalEmail,
              'survey-nps': NpsSurveyEmail,
              'thank-you': ThankYouEmail,
              'test-social-links': TestSocialLinksEmail, // Add our test template
            };

            const Component = templateComponents[templateId];
            if (Component) {
              html = render(<Component siteSettings={siteSettings} />);
            } else {
              html = `<div class="p-8 text-center">
                <h2 class="text-xl font-semibold text-red-600 mb-2">Şablon Bulunamadı</h2>
                <p class="text-gray-600">Template ID: ${templateId}</p>
                <p class="text-sm text-gray-500 mt-4">Bu şablon database'de veya dosya sisteminde bulunamadı.</p>
              </div>`;
            }

            setEmailHtml(html);
          }
        }
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching template:', err);
        setError('Şablon bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId, templateType]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-12">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/email-marketing/templates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Şablonlara Geri Dön
            </Link>
          </Button>
          <div className="text-sm font-medium text-gray-700">
            {templateName || 'Şablon Önizleme'}
          </div>
        </div>
      </div>
      
      {/* Email Content */}
      <div className="p-4">
        <div 
          dangerouslySetInnerHTML={{ __html: emailHtml }} 
          className="w-full bg-white shadow-sm rounded-lg overflow-hidden mx-auto"
          style={{ maxWidth: '800px' }}
        />
      </div>
    </div>
  );
}

export default function EmailPreviewPage({ params }: { params: Promise<{ templateId: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Şablon yükleniyor...</p>
        </div>
      </div>
    }>
      <EmailPreviewContent params={params} />
    </Suspense>
  );
}
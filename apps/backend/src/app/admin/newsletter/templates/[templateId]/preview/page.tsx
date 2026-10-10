'use client';

import { useEffect, useState, useRef } from "react";
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

export default function EmailPreviewPage({ params }: { params: Promise<{ templateId: string }> }) {
  // Unwrap the params promise using React.use()
  const unwrappedParams = use(params);
  const { templateId } = unwrappedParams;
  const searchParams = useSearchParams();
  const templateType = searchParams.get('type') || 'file';
  
  const [emailHtml, setEmailHtml] = useState<string>('');
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
          
          setEmailHtml(html);
        } else {
          // For database templates, fetch from API
          try {
            // Note: In a real implementation, you would have a preview endpoint
            // For now, we'll use a placeholder
            const response = await templatesService.getTemplateById(templateId);
            // In a real implementation, you would render the template content
            setEmailHtml(`<div>Özel şablon önizlemesi: ${response.name}</div>`);
          } catch (apiError) {
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
              html = `<div>Şablon bulunamadı: ${templateId}</div>`;
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
            <Link href="/admin/newsletter/templates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Şablonlara Geri Dön
            </Link>
          </Button>
          <div className="text-sm text-gray-500">
            Şablon Önizleme: {templateId}
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
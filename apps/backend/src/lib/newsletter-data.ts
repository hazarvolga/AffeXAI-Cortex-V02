
import type { Subscriber, Campaign, Segment, Group, EmailTemplate } from './types';

export const subscribers: Subscriber[] = [
  { id: 'sub-001', email: 'ahmet.yilmaz@example.com', subscribedAt: '2024-07-20T10:00:00.000Z', status: 'aktif', groups: ['grp-001'], segments: ['Etkileşimli Aboneler'] },
  { id: 'sub-002', email: 'zeynep.kaya@example.com', subscribedAt: '2024-07-21T11:30:00.000Z', status: 'aktif', groups: [], segments: ['Etkileşimli Aboneler'] },
  { id: 'sub-003', email: 'mehmet.ozturk@example.com', subscribedAt: '2024-07-22T09:15:00.000Z', status: 'onay bekliyor', groups: [], segments: [] },
  { id: 'sub-004', email: 'elif.demir@example.com', subscribedAt: '2024-06-15T14:00:00.000Z', status: 'iptal edilmiş', groups: [], segments: [] },
  { id: 'sub-005', email: 'can.ersoy@example.com', subscribedAt: '2024-07-25T18:00:00.000Z', status: 'aktif', groups: ['grp-002'], segments: [] },
  { id: 'sub-006', email: 'deniz.arslan@example.com', subscribedAt: '2024-07-28T12:00:00.000Z', status: 'onay bekliyor', groups: [], segments: [] },
];

export const campaigns: Campaign[] = [
  {
    id: 'camp-001',
    title: 'Ağustos 2024 Bülteni',
    subject: 'Allplan\'daki Son Gelişmeler ve Yeni Eğitimler',
    content: '<h1>Ağustos Bülteni</h1><p>Bu ayki bültenimizde Allplan 2025\'in yeni özelliklerini ve yaklaşan webinar takvimini bulabilirsiniz.</p>',
    status: 'gönderildi',
    createdAt: '2024-08-01T09:00:00.000Z',
    sentAt: '2024-08-01T10:00:00.000Z',
    recipientCount: 1250,
    openRate: 25.5,
    clickRate: 4.2,
  },
  {
    id: 'camp-002',
    title: 'Eylül Lansman Daveti',
    subject: 'Özel Davet: Allplan 2025 Lansmanı',
    content: '<h1>Allplan 2025 Lansmanına Davetlisiniz!</h1><p>Sektör liderleriyle tanışmak ve en yeni teknolojileri görmek için bize katılın.</p>',
    status: 'planlandı',
    createdAt: '2024-08-15T14:00:00.000Z',
    scheduledFor: '2024-09-01T10:00:00.000Z',
  },
  {
    id: 'camp-003',
    title: 'Bayram Tebriği',
    subject: 'İyi Bayramlar Dileriz!',
    content: '<h1>İyi Bayramlar!</h1><p>Aluplan Digital ailesi olarak bayramınızı en içten dileklerimizle kutlarız.</p>',
    status: 'taslak',
    createdAt: '2024-07-28T16:00:00.000Z',
  },
];

export const segments: Segment[] = [
    {
        id: 'seg-001',
        name: 'Etkileşimli Aboneler',
        description: 'Son 3 kampanyadan en az birini açmış olan aboneler.',
        subscriberCount: 820,
        criteria: 'Son 3 Kampanyayı Açanlar',
    },
    {
        id: 'seg-002',
        name: 'Potansiyel Müşteriler (Webinar)',
        description: 'Webinarlara katılmış ancak henüz müşteri olmamış aboneler.',
        subscriberCount: 150,
        criteria: 'Etiket: "webinar-katılımcısı" VE Etiket DEĞİL: "müşteri"',
    }
];

export const groups: Group[] = [
    {
        id: 'grp-001',
        name: 'VIP Müşteriler',
        description: 'Özel indirim ve erken erişim hakkı olan müşteriler.',
        subscriberCount: 50,
    },
    {
        id: 'grp-002',
        name: 'Allplan Bridge Kullanıcıları',
        description: 'Allplan Bridge ürününe sahip olan kullanıcılar.',
        subscriberCount: 120,
    },
];

export const templates: EmailTemplate[] = [
    {
        id: 'template-welcome',
        name: 'Hoş Geldiniz E-postası',
        description: 'Yeni abonelere gönderilen standart karşılama şablonu.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-1/200/150',
        createdAt: '2024-07-30T10:00:00.000Z',
        content: 'welcome.tsx'
    },
    {
        id: 'template-monthly-newsletter',
        name: 'Aylık Bülten Şablonu',
        description: 'Haberler, güncellemeler ve makaleler için genel bülten formatı.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-2/200/150',
        createdAt: '2024-07-25T14:30:00.000Z',
        content: 'monthly-newsletter.tsx'
    },
    {
        id: 'template-password-reset',
        name: 'Parola Sıfırlama',
        description: 'Kullanıcıların parolalarını sıfırlaması için gönderilen işlem e-postası.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-3/200/150',
        createdAt: '2024-08-01T11:00:00.000Z',
        content: 'password-reset.tsx'
    },
    {
        id: 'template-email-verification',
        name: 'E-posta Doğrulama',
        description: 'Yeni kullanıcıların e-posta adreslerini doğrulaması için gönderilir.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-4/200/150',
        createdAt: '2024-08-02T12:00:00.000Z',
        content: 'email-verification.tsx'
    },
     {
        id: 'template-order-confirmation',
        name: 'Sipariş Onayı',
        description: 'Müşterilere siparişlerinin başarıyla alındığını bildiren e-posta.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-5/200/150',
        createdAt: '2024-08-03T10:00:00.000Z',
        content: 'order-confirmation.tsx'
    },
    {
        id: 'template-event-invitation',
        name: 'Etkinlik Davetiyesi',
        description: 'Webinar, lansman veya atölye gibi etkinlikler için davetiye şablonu.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-6/200/150',
        createdAt: '2024-08-04T11:00:00.000Z',
        content: 'event-invitation.tsx'
    },
     {
        id: 'template-re-engagement',
        name: 'Geri Kazanma E-postası',
        description: 'Uzun süredir aktif olmayan kullanıcıları geri kazanma amaçlı.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-7/200/150',
        createdAt: '2024-08-05T10:00:00.000Z',
        content: 're-engagement.tsx'
    },
    {
        id: 'template-goodbye',
        name: 'Veda E-postası',
        description: 'Abonelikten çıkan kullanıcılara gönderilen veda mesajı.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-8/200/150',
        createdAt: '2024-08-05T11:00:00.000Z',
        content: 'goodbye.tsx'
    },
    {
        id: 'template-abandoned-cart',
        name: 'Sepet Hatırlatma',
        description: 'Sepetini terk eden kullanıcılara gönderilen hatırlatma.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-9/200/150',
        createdAt: '2024-08-05T12:00:00.000Z',
        content: 'abandoned-cart.tsx'
    },
    {
        id: 'template-product-recommendation',
        name: 'Ürün Önerisi',
        description: 'Kullanıcının ilgisine göre kişiselleştirilmiş ürün önerileri.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-10/200/150',
        createdAt: '2024-08-05T13:00:00.000Z',
        content: 'product-recommendation.tsx'
    },
    {
        id: 'template-feature-update',
        name: 'Yeni Özellik Duyurusu',
        description: 'Ürüne eklenen yeni özellikler hakkında bilgilendirme.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-11/200/150',
        createdAt: '2024-08-05T14:00:00.000Z',
        content: 'feature-update.tsx'
    },
    {
        id: 'template-security-alert',
        name: 'Güvenlik Uyarısı',
        description: 'Hesapla ilgili şüpheli aktiviteler hakkında bilgilendirme.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-12/200/150',
        createdAt: '2024-08-05T15:00:00.000Z',
        content: 'security-alert.tsx'
    },
    {
        id: 'template-feedback-request',
        name: 'Geri Bildirim Talebi',
        description: 'Kullanıcıdan ürün veya hizmet hakkında geri bildirim isteme.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-13/200/150',
        createdAt: '2024-08-05T16:00:00.000Z',
        content: 'feedback-request.tsx'
    },
    {
        id: 'template-onboarding-series',
        name: 'Onboarding Serisi',
        description: 'Yeni kullanıcılara ürün özelliklerini adım adım tanıtan e-posta serisi.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-14/200/150',
        createdAt: '2024-08-06T10:00:00.000Z',
        content: 'onboarding-series.tsx'
    },
     {
        id: 'template-shipping-updates',
        name: 'Kargo & Teslimat Güncellemeleri',
        description: 'Müşterilere kargolarının durumu hakkında bilgi veren şablon.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-15/200/150',
        createdAt: '2024-08-07T09:00:00.000Z',
        content: 'shipping-updates.tsx'
    },
    {
        id: 'template-back-in-stock',
        name: 'Stoğa Gelenler Bildirimi',
        description: 'Bir ürün tekrar stoğa girdiğinde kullanıcıları bilgilendirir.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-16/200/150',
        createdAt: '2024-08-08T09:00:00.000Z',
        content: 'back-in-stock.tsx'
    },
    {
        id: 'template-price-drop-alert',
        name: 'Fiyat Düşüşü Uyarısı',
        description: 'Bir ürünün fiyatı düştüğünde kullanıcıları bilgilendirme.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-17/200/150',
        createdAt: '2024-08-09T09:00:00.000Z',
        content: 'price-drop-alert.tsx'
    },
    {
        id: 'template-loyalty-program',
        name: 'Sadakat Programı Bildirimi',
        description: 'Kullanıcının sadakat puanları ve ödülleri hakkında bilgilendirme.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-18/200/150',
        createdAt: '2024-08-10T10:00:00.000Z',
        content: 'loyalty-program.tsx'
    },
    {
        id: 'template-product-launch',
        name: 'Ürün Lansmanı',
        description: 'Yeni bir ürün veya hizmetin lansmanını duyurmak için.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-19/200/150',
        createdAt: '2024-08-11T10:00:00.000Z',
        content: 'product-launch.tsx'
    },
    {
        id: 'template-seasonal-campaign',
        name: 'Sezonluk Kampanya',
        description: 'Özel günler (Yılbaşı, Bayram vb.) için kampanya şablonu.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-20/200/150',
        createdAt: '2024-08-12T10:00:00.000Z',
        content: 'seasonal-campaign.tsx'
    },
    {
        id: 'template-flash-sale',
        name: 'Hızlı Satış / Flaş İndirim',
        description: 'Zaman sınırlı, aciliyet hissi yaratan indirim duyuruları.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-21/200/150',
        createdAt: '2024-08-12T11:00:00.000Z',
        content: 'flash-sale.tsx'
    },
    {
        id: 'template-invoice',
        name: 'Fatura / Ödeme Onayı',
        description: 'Yapılan bir ödeme sonrası müşteriye gönderilen fatura ve onay.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-22/200/150',
        createdAt: '2024-08-13T10:00:00.000Z',
        content: 'invoice.tsx'
    },
    {
        id: 'template-subscription-renewal',
        name: 'Abonelik Yenileme Hatırlatıcısı',
        description: 'Yaklaşan abonelik yenileme tarihini kullanıcıya bildirme.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-23/200/150',
        createdAt: '2024-08-13T11:00:00.000Z',
        content: 'subscription-renewal.tsx'
    },
    {
        id: 'template-account-summary',
        name: 'Hesap Özeti / Aylık Rapor',
        description: 'Kullanıcının aylık aktivite ve istatistiklerinin özeti.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-24/200/150',
        createdAt: '2024-08-14T10:00:00.000Z',
        content: 'account-summary.tsx'
    },
    {
        id: 'template-survey-nps',
        name: 'Anket / NPS',
        description: 'Net Promoter Score (NPS) veya genel memnuniyet anketi.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-25/200/150',
        createdAt: '2024-08-15T10:00:00.000Z',
        content: 'survey-nps.tsx'
    },
    {
        id: 'template-thank-you',
        name: 'Teşekkür E-postası',
        description: 'Satın alma, etkinlik katılımı vb. sonrası genel teşekkür.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-26/200/150',
        createdAt: '2024-08-16T10:00:00.000Z',
        content: 'thank-you.tsx'
    },
    {
        id: 'template-milestone-celebration',
        name: 'Dönüm Noktası Kutlaması',
        description: 'Kullanıcının 1. yıl üyeliği gibi özel anlarını kutlama.',
        thumbnailUrl: 'https://picsum.photos/seed/email-thumb-27/200/150',
        createdAt: '2024-08-17T10:00:00.000Z',
        content: 'milestone-celebration.tsx'
    }
];

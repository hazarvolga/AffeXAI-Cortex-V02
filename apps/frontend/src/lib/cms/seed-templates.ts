/**
 * Seed Templates
 * Pre-built templates using V2 blocks for the CMS Template Library
 */

import type { PageTemplate, BlockInstance } from '@/types/cms-template';

/**
 * Helper to create block instances
 */
function createBlock(
    type: string,
    category: string,
    properties: Record<string, any>,
    id?: string
): BlockInstance {
    return {
        id: id || `block-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        category,
        properties,
        locked: false,
    };
}

/**
 * Default design system for templates
 */
const defaultDesignSystem = {
    supportedContexts: ['public', 'portal'] as ('public' | 'portal' | 'admin')[],
    preferredMode: 'light' as const,
    colorScheme: {
        primary: '{color.primary}',
        secondary: '{color.secondary}',
        accent: '{color.accent}',
        background: '{color.background}',
        foreground: '{color.foreground}',
        muted: '{color.muted}',
        card: '{color.card}',
        border: '{color.border}',
    },
    typography: {
        heading: '{typography.heading1}',
        subheading: '{typography.heading2}',
        body: '{typography.body}',
        caption: '{typography.caption}',
    },
    spacing: {
        section: '{spacing.xl}',
        component: '{spacing.md}',
        element: '{spacing.sm}',
    },
    effects: {
        shadow: '{shadow.card}',
        border: '{border.default}',
        radius: '{radius.md}',
    },
};

/**
 * 1. Landing Page Template - Modern SaaS landing page
 */
export const landingPageTemplate: Omit<PageTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Modern Landing Page',
    description: 'SaaS ve ürün tanıtımı için modern landing page. Hero, özellikler, logo cloud, testimonials, CTA ve footer içerir.',
    category: 'Landing Page',
    blocks: [
        createBlock('v2-hero-simple', 'hero', {
            title: 'Daha Akıllı Çalışın, Daha Hızlı Büyüyün',
            subtitle: 'Yapay zeka destekli platformumuzla iş süreçlerinizi otomatikleştirin ve verimliliğinizi %300 artırın.',
            ctaText: '14 Gün Ücretsiz Dene',
            ctaLink: '/signup',
            alignment: 'center',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
        }, 'hero-1'),
        createBlock('v2-logo-cloud', 'content', {
            heading: 'Güvendikleri Markalar',
            subheading: '',
            variant: 'simple',
            grayscale: true,
            backgroundColor: '#ffffff',
        }, 'logos-1'),
        createBlock('v2-feature-grid', 'content', {
            heading: 'Neden Bizi Tercih Etmelisiniz?',
            subheading: 'Rakiplerimizden farklı kılan özellikler',
            columns: 3,
            features: [
                { icon: 'Zap', title: 'Anlık Sonuçlar', description: 'Gerçek zamanlı veri analizi ve raporlama' },
                { icon: 'Shield', title: 'Kurumsal Güvenlik', description: 'SOC2, GDPR ve ISO 27001 sertifikalı' },
                { icon: 'Users', title: 'Sınırsız Kullanıcı', description: 'Tüm ekibinizi dahil edin' },
                { icon: 'Cpu', title: 'AI Destekli', description: 'Yapay zeka ile akıllı öneriler' },
                { icon: 'Globe', title: 'Global Erişim', description: '99.9% uptime garantisi' },
                { icon: 'Headphones', title: '7/24 Destek', description: 'Türkçe teknik destek' },
            ],
            backgroundColor: '#f8fafc',
        }, 'features-1'),
        createBlock('v2-stats-grid', 'content', {
            heading: 'Rakamlarla Biz',
            stats: [
                { value: '10M', label: 'İşlem/Gün', suffix: '+' },
                { value: '99.9', label: 'Uptime', suffix: '%' },
                { value: '50K', label: 'Aktif Kullanıcı', suffix: '+' },
                { value: '4.9', label: 'Müşteri Puanı', suffix: '/5' },
            ],
            columns: 4,
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
            accentColor: '#6366f1',
        }, 'stats-1'),
        createBlock('v2-testimonials', 'content', {
            heading: 'Müşterilerimiz Ne Diyor?',
            subheading: 'Binlerce mutlu müşterimizden bazıları',
            testimonials: [
                {
                    quote: 'Bu platform sayesinde müşteri hizmetleri yanıt süremiz %60 azaldı. Kesinlikle tavsiye ediyorum.',
                    author: 'Zeynep Kaya',
                    role: 'Müşteri Hizmetleri Direktörü',
                    company: 'TechStart',
                },
                {
                    quote: 'Entegrasyon sürecimiz sadece 2 gün sürdü. Ekip desteği muhteşemdi.',
                    author: 'Ahmet Yıldırım',
                    role: 'CTO',
                    company: 'FinanceHub',
                },
            ],
            backgroundColor: '#ffffff',
        }, 'testimonials-1'),
        createBlock('v2-cta-banner', 'cta', {
            heading: 'Hemen Ücretsiz Başlayın',
            description: '14 gün ücretsiz deneme. Kredi kartı gerekmez. İstediğiniz zaman iptal edin.',
            buttonText: 'Ücretsiz Deneyin',
            buttonLink: '/signup',
            backgroundColor: '#6366f1',
            textColor: '#ffffff',
        }, 'cta-1'),
        createBlock('v2-newsletter', 'content', {
            heading: 'Güncel Kalın',
            subheading: 'En son haberler ve güncellemeler için bültenimize abone olun.',
            buttonText: 'Abone Ol',
            variant: 'inline',
            backgroundColor: '#1e293b',
            textColor: '#ffffff',
        }, 'newsletter-1'),
        createBlock('v2-footer', 'navigation', {
            logoText: 'Şirket',
            description: 'Yapay zeka destekli iş çözümleri.',
            columns: [
                {
                    title: 'Ürün',
                    links: [
                        { label: 'Özellikler', href: '/features' },
                        { label: 'Fiyatlandırma', href: '/pricing' },
                        { label: 'Entegrasyonlar', href: '/integrations' },
                    ],
                },
                {
                    title: 'Şirket',
                    links: [
                        { label: 'Hakkımızda', href: '/about' },
                        { label: 'Blog', href: '/blog' },
                        { label: 'Kariyer', href: '/careers' },
                    ],
                },
                {
                    title: 'Destek',
                    links: [
                        { label: 'Yardım Merkezi', href: '/help' },
                        { label: 'İletişim', href: '/contact' },
                        { label: 'Gizlilik', href: '/privacy' },
                    ],
                },
            ],
            copyright: '© 2024 Şirket. Tüm hakları saklıdır.',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
        }, 'footer-1'),
    ],
    layoutOptions: {
        maxWidth: 'wide',
        spacing: 'normal',
    },
    designSystem: defaultDesignSystem,
    preview: {
        thumbnail: '/images/templates/landing-page.png',
    },
    usageCount: 0,
    version: 1,
    isPublished: true,
    isFeatured: true,
};

/**
 * 2. About Us Template - Company introduction
 */
export const aboutUsTemplate: Omit<PageTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Kurumsal Hakkımızda',
    description: 'Şirket tanıtımı için kapsamlı hakkımızda sayfası. Hikaye, ekip, istatistikler ve değerler.',
    category: 'Team',
    blocks: [
        createBlock('v2-hero-with-image', 'hero', {
            title: 'Geleceği Birlikte İnşa Ediyoruz',
            subtitle: 'Hikayemiz',
            description: '2015 yılında küçük bir ekip olarak başladık. Bugün 50+ ülkede 10.000+ müşteriye hizmet veriyoruz.',
            imageUrl: '/images/placeholder-about.jpg',
            imagePosition: 'right',
            ctaText: 'Ekibimizle Tanışın',
            ctaLink: '#team',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
        }, 'hero-about-1'),
        createBlock('v2-content-split', 'content', {
            heading: 'Vizyonumuz',
            subheading: 'Neden Buradayız',
            content: 'Teknolojinin gücünü herkesin erişebileceği, anlaşılabilir ve kullanılabilir hale getirmek için yola çıktık. Her gün bu misyonumuz doğrultusunda çalışıyoruz.',
            imageUrl: '/images/placeholder-vision.jpg',
            imagePosition: 'left',
            backgroundColor: '#ffffff',
        }, 'vision-1'),
        createBlock('v2-stats-grid', 'content', {
            heading: 'Rakamlarla Biz',
            subheading: 'Başarımızın arkasındaki sayılar',
            stats: [
                { value: '8', label: 'Yıllık Deneyim', suffix: '+' },
                { value: '10K', label: 'Mutlu Müşteri', suffix: '+' },
                { value: '50', label: 'Ülke', suffix: '+' },
                { value: '100', label: 'Ekip Üyesi', suffix: '+' },
            ],
            columns: 4,
            backgroundColor: '#f8fafc',
        }, 'stats-about-1'),
        createBlock('v2-team-grid', 'content', {
            heading: 'Liderlik Ekibimiz',
            subheading: 'Başarımızın arkasındaki isimler',
            columns: 3,
            members: [
                {
                    name: 'Mehmet Öztürk',
                    role: 'CEO & Kurucu',
                    bio: '15+ yıl teknoloji sektörü deneyimi',
                    social: { linkedin: '#', twitter: '#' },
                },
                {
                    name: 'Ayşe Demir',
                    role: 'CTO',
                    bio: 'Büyük veri ve yapay zeka uzmanı',
                    social: { linkedin: '#' },
                },
                {
                    name: 'Emre Yılmaz',
                    role: 'CPO',
                    bio: 'Kullanıcı deneyimi odaklı ürün geliştirme',
                    social: { linkedin: '#', twitter: '#' },
                },
            ],
            backgroundColor: '#ffffff',
        }, 'team-1'),
        createBlock('v2-cta-banner', 'cta', {
            heading: 'Ekibimize Katılın',
            description: 'Yetenekli profesyonellerle birlikte geleceği şekillendirin.',
            buttonText: 'Açık Pozisyonlar',
            buttonLink: '/careers',
            backgroundColor: '#6366f1',
        }, 'cta-about-1'),
        createBlock('v2-footer', 'navigation', {
            logoText: 'Şirket',
            description: 'Teknoloji ile geleceği şekillendiriyoruz.',
            columns: [],
            copyright: '© 2024 Şirket. Tüm hakları saklıdır.',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
        }, 'footer-about-1'),
    ],
    layoutOptions: {
        maxWidth: 'standard',
        spacing: 'spacious',
    },
    designSystem: defaultDesignSystem,
    preview: {
        thumbnail: '/images/templates/about-us.png',
    },
    usageCount: 0,
    version: 1,
    isPublished: true,
    isFeatured: false,
};

/**
 * 3. Pricing Page Template
 */
export const pricingPageTemplate: Omit<PageTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Fiyatlandırma Sayfası',
    description: 'Profesyonel fiyatlandırma sayfası. Pricing kartları, özellik karşılaştırma ve SSS.',
    category: 'Pricing',
    blocks: [
        createBlock('v2-hero-simple', 'hero', {
            title: 'Basit, Şeffaf Fiyatlandırma',
            subtitle: 'Gizli ücret yok. İstediğiniz zaman plan değiştirin veya iptal edin.',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
            alignment: 'center',
        }, 'hero-pricing-1'),
        createBlock('v2-pricing', 'content', {
            heading: '',
            subheading: '',
            plans: [
                {
                    name: 'Başlangıç',
                    price: '₺199',
                    period: '/ay',
                    description: 'Küçük ekipler için',
                    features: ['5 kullanıcı', '10 GB depolama', 'E-posta destek', 'Temel raporlar'],
                    ctaText: 'Başla',
                    ctaLink: '/signup?plan=starter',
                    featured: false,
                },
                {
                    name: 'Profesyonel',
                    price: '₺499',
                    period: '/ay',
                    description: 'Büyüyen işletmeler için',
                    features: ['25 kullanıcı', '100 GB depolama', 'Öncelikli destek', 'Gelişmiş raporlar', 'API erişimi', 'SSO'],
                    ctaText: 'Başla',
                    ctaLink: '/signup?plan=pro',
                    featured: true,
                },
                {
                    name: 'Kurumsal',
                    price: 'Özel',
                    period: '',
                    description: 'Büyük organizasyonlar için',
                    features: ['Sınırsız kullanıcı', 'Sınırsız depolama', '7/24 VIP destek', 'Özel entegrasyon', 'SLA garantisi', 'Özel eğitim'],
                    ctaText: 'İletişime Geç',
                    ctaLink: '/contact?plan=enterprise',
                    featured: false,
                },
            ],
            backgroundColor: '#ffffff',
        }, 'pricing-1'),
        createBlock('v2-faq', 'content', {
            heading: 'Sıkça Sorulan Sorular',
            subheading: 'Fiyatlandırma hakkında merak ettikleriniz',
            faqs: [
                {
                    question: 'Ücretsiz deneme süresi var mı?',
                    answer: 'Evet! Tüm planlarımız için 14 gün ücretsiz deneme sunuyoruz. Kredi kartı gerekmez.',
                },
                {
                    question: 'Plan değiştirebilir miyim?',
                    answer: 'Evet, istediğiniz zaman planınızı yükseltebilir veya düşürebilirsiniz. Fark iade edilir veya sonraki faturaya yansıtılır.',
                },
                {
                    question: 'İptal politikanız nedir?',
                    answer: 'İstediğiniz zaman iptal edebilirsiniz. Kalan süre için iade yapılır.',
                },
                {
                    question: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
                    answer: 'Kredi kartı, banka kartı, havale/EFT ve kurumsal fatura kabul ediyoruz.',
                },
            ],
            backgroundColor: '#f8fafc',
        }, 'faq-pricing-1'),
        createBlock('v2-cta-banner', 'cta', {
            heading: 'Hala Kararsız mısınız?',
            description: 'Uzmanlarımızla görüşün, size en uygun planı birlikte belirleyelim.',
            buttonText: 'Demo Talep Et',
            buttonLink: '/demo',
            backgroundColor: '#1e293b',
        }, 'cta-pricing-1'),
        createBlock('v2-footer', 'navigation', {
            logoText: 'Şirket',
            description: 'Her bütçeye uygun çözümler.',
            columns: [],
            copyright: '© 2024 Şirket. Tüm hakları saklıdır.',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
        }, 'footer-pricing-1'),
    ],
    layoutOptions: {
        maxWidth: 'wide',
        spacing: 'normal',
    },
    designSystem: defaultDesignSystem,
    preview: {
        thumbnail: '/images/templates/pricing.png',
    },
    usageCount: 0,
    version: 1,
    isPublished: true,
    isFeatured: true,
};

/**
 * 4. Portfolio / Gallery Template
 */
export const portfolioTemplate: Omit<PageTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Portfolyo Sayfası',
    description: 'Çalışmalarınızı sergileyin. Galeri, proje detayları ve müşteri yorumları.',
    category: 'Portfolio',
    blocks: [
        createBlock('v2-hero-with-image', 'hero', {
            title: 'Çalışmalarımız',
            subtitle: 'Portfolyo',
            description: 'Dünya çapındaki markalar için ürettiğimiz çözümleri keşfedin.',
            imageUrl: '/images/placeholder-portfolio.jpg',
            imagePosition: 'right',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
        }, 'hero-portfolio-1'),
        createBlock('v2-logo-cloud', 'content', {
            heading: 'Birlikte Çalıştığımız Markalar',
            variant: 'grid',
            columns: 6,
            grayscale: true,
            backgroundColor: '#ffffff',
        }, 'logos-portfolio-1'),
        createBlock('v2-gallery', 'content', {
            heading: 'Son Projelerimiz',
            subheading: 'En beğenilen çalışmalarımızdan örnekler',
            columns: 3,
            images: [
                { url: '', alt: 'E-ticaret Projesi', caption: 'E-ticaret Yeniden Tasarım' },
                { url: '', alt: 'Mobil Uygulama', caption: 'Fintech Mobil App' },
                { url: '', alt: 'Kurumsal Website', caption: 'Kurumsal Kimlik' },
                { url: '', alt: 'Dashboard', caption: 'Analytics Dashboard' },
                { url: '', alt: 'Landing Page', caption: 'SaaS Landing Page' },
                { url: '', alt: 'Branding', caption: 'Brand Identity' },
            ],
            backgroundColor: '#f8fafc',
        }, 'gallery-1'),
        createBlock('v2-testimonials', 'content', {
            heading: 'Müşteri Yorumları',
            testimonials: [
                {
                    quote: 'İnanılmaz profesyonel bir ekip. Projemizi zamanında ve bütçe dahilinde teslim ettiler.',
                    author: 'Selin Arslan',
                    role: 'Marketing Director',
                    company: 'StartupXYZ',
                },
                {
                    quote: 'Yaratıcılık ve teknik uzmanlığın mükemmel birleşimi. Sonuçlar beklentilerimizin üzerindeydi.',
                    author: 'Murat Özkan',
                    role: 'CEO',
                    company: 'TechCorp',
                },
            ],
            backgroundColor: '#ffffff',
        }, 'testimonials-portfolio-1'),
        createBlock('v2-cta-banner', 'cta', {
            heading: 'Projenizi Birlikte Yapalım',
            description: 'Fikrinizi hayata geçirmek için bizimle iletişime geçin.',
            buttonText: 'Teklif Al',
            buttonLink: '/contact',
            backgroundColor: '#6366f1',
        }, 'cta-portfolio-1'),
        createBlock('v2-footer', 'navigation', {
            logoText: 'Şirket',
            description: 'Yaratıcı çözümler.',
            columns: [],
            copyright: '© 2024 Şirket. Tüm hakları saklıdır.',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
        }, 'footer-portfolio-1'),
    ],
    layoutOptions: {
        maxWidth: 'full',
        spacing: 'spacious',
    },
    designSystem: defaultDesignSystem,
    preview: {
        thumbnail: '/images/templates/portfolio.png',
    },
    usageCount: 0,
    version: 1,
    isPublished: true,
    isFeatured: false,
};

/**
 * 5. Contact Page Template
 */
export const contactPageTemplate: Omit<PageTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'İletişim Sayfası',
    description: 'Profesyonel iletişim sayfası. Form, harita ve iletişim bilgileri.',
    category: 'Contact',
    blocks: [
        createBlock('v2-hero-simple', 'hero', {
            title: 'Bizimle İletişime Geçin',
            subtitle: 'Sorularınız, önerileriniz veya iş birliği teklifleriniz için bize ulaşın.',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
            alignment: 'center',
        }, 'hero-contact-1'),
        createBlock('v2-contact-form', 'content', {
            heading: 'Mesaj Gönderin',
            subheading: 'Formu doldurun, 24 saat içinde size dönüş yapalım.',
            showContactInfo: true,
            contactInfo: [
                { icon: 'mail', label: 'E-posta', value: 'info@sirket.com', href: 'mailto:info@sirket.com' },
                { icon: 'phone', label: 'Telefon', value: '+90 212 123 45 67', href: 'tel:+902121234567' },
                { icon: 'location', label: 'Adres', value: 'Maslak, İstanbul', href: '' },
            ],
            submitButtonText: 'Mesaj Gönder',
            backgroundColor: '#ffffff',
            accentColor: '#6366f1',
        }, 'contact-form-1'),
        createBlock('v2-faq', 'content', {
            heading: 'Sıkça Sorulan Sorular',
            faqs: [
                {
                    question: 'Ne kadar sürede dönüş yapıyorsunuz?',
                    answer: 'İş günlerinde 24 saat içinde dönüş yapıyoruz.',
                },
                {
                    question: 'Ücretsiz danışmanlık veriyor musunuz?',
                    answer: 'Evet, ilk görüşmemiz ücretsizdir. İhtiyaçlarınızı anlamak için 30 dakikalık bir görüşme yapıyoruz.',
                },
            ],
            backgroundColor: '#f8fafc',
        }, 'faq-contact-1'),
        createBlock('v2-footer', 'navigation', {
            logoText: 'Şirket',
            description: 'Her zaman yanınızdayız.',
            columns: [],
            copyright: '© 2024 Şirket. Tüm hakları saklıdır.',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
        }, 'footer-contact-1'),
    ],
    layoutOptions: {
        maxWidth: 'standard',
        spacing: 'normal',
    },
    designSystem: defaultDesignSystem,
    preview: {
        thumbnail: '/images/templates/contact.png',
    },
    usageCount: 0,
    version: 1,
    isPublished: true,
    isFeatured: false,
};

/**
 * 6. Blog / News Page Template
 */
export const blogPageTemplate: Omit<PageTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Blog Sayfası',
    description: 'Blog ve haberler için içerik sayfası. Hero, içerik alanı ve newsletter.',
    category: 'Blog',
    blocks: [
        createBlock('v2-hero-simple', 'hero', {
            title: 'Blog & Haberler',
            subtitle: 'Sektör trendleri, ürün güncellemeleri ve en iyi pratikler.',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
            alignment: 'center',
        }, 'hero-blog-1'),
        createBlock('v2-content-text', 'content', {
            heading: '',
            content: '<p class="text-center text-muted-foreground">Blog yazıları buraya yüklenecek. CMS entegrasyonu ile dinamik içerik gösterilecek.</p>',
            alignment: 'center',
            maxWidth: 'lg',
            backgroundColor: '#ffffff',
        }, 'content-blog-1'),
        createBlock('v2-newsletter', 'content', {
            heading: 'Haftalık Bülten',
            subheading: 'Her hafta en güncel içerikleri e-posta kutunuzda bulun.',
            variant: 'card',
            backgroundColor: '#f8fafc',
            accentColor: '#6366f1',
        }, 'newsletter-blog-1'),
        createBlock('v2-footer', 'navigation', {
            logoText: 'Şirket',
            description: 'Bilgi paylaştıkça çoğalır.',
            columns: [],
            copyright: '© 2024 Şirket. Tüm hakları saklıdır.',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
        }, 'footer-blog-1'),
    ],
    layoutOptions: {
        maxWidth: 'standard',
        spacing: 'normal',
    },
    designSystem: defaultDesignSystem,
    preview: {
        thumbnail: '/images/templates/blog.png',
    },
    usageCount: 0,
    version: 1,
    isPublished: true,
    isFeatured: false,
};

/**
 * 7. Services Page Template
 */
export const servicesPageTemplate: Omit<PageTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Hizmetler Sayfası',
    description: 'Sunduğunuz hizmetleri detaylı şekilde tanıtın. Özellikler, süreç ve CTA.',
    category: 'Services' as any,
    blocks: [
        createBlock('v2-hero-with-image', 'hero', {
            title: 'Hizmetlerimiz',
            subtitle: 'Uzmanlık Alanlarımız',
            description: 'İşletmenizi bir sonraki seviyeye taşıyacak profesyonel çözümler sunuyoruz.',
            imageUrl: '/images/placeholder-services.jpg',
            imagePosition: 'right',
            ctaText: 'Hizmetleri İncele',
            ctaLink: '#services',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
        }, 'hero-services-1'),
        createBlock('v2-feature-grid', 'content', {
            heading: 'Sunduğumuz Hizmetler',
            subheading: 'Her ihtiyaca özel çözümler',
            columns: 3,
            features: [
                { icon: 'Code', title: 'Web Geliştirme', description: 'Modern, hızlı ve responsive web uygulamaları' },
                { icon: 'Smartphone', title: 'Mobil Uygulama', description: 'iOS ve Android için native uygulamalar' },
                { icon: 'Cloud', title: 'Cloud Çözümleri', description: 'AWS, GCP ve Azure entegrasyonları' },
                { icon: 'BarChart', title: 'Veri Analitiği', description: 'İş zekası ve raporlama çözümleri' },
                { icon: 'Lock', title: 'Siber Güvenlik', description: 'Kurumsal güvenlik danışmanlığı' },
                { icon: 'Puzzle', title: 'Entegrasyon', description: 'Sistemler arası entegrasyon hizmetleri' },
            ],
            backgroundColor: '#ffffff',
        }, 'services-1'),
        createBlock('v2-stats-grid', 'content', {
            heading: 'Deneyimimiz',
            stats: [
                { value: '500', label: 'Proje Tamamlandı', suffix: '+' },
                { value: '8', label: 'Yıllık Deneyim', suffix: '' },
                { value: '50', label: 'Uzman Ekip', suffix: '+' },
                { value: '98', label: 'Müşteri Memnuniyeti', suffix: '%' },
            ],
            columns: 4,
            backgroundColor: '#f8fafc',
        }, 'stats-services-1'),
        createBlock('v2-cta-banner', 'cta', {
            heading: 'Projenizi Konuşalım',
            description: 'Ücretsiz danışmanlık için hemen iletişime geçin.',
            buttonText: 'Randevu Al',
            buttonLink: '/contact',
            backgroundColor: '#6366f1',
        }, 'cta-services-1'),
        createBlock('v2-footer', 'navigation', {
            logoText: 'Şirket',
            description: 'Profesyonel çözüm ortağınız.',
            columns: [],
            copyright: '© 2024 Şirket. Tüm hakları saklıdır.',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
        }, 'footer-services-1'),
    ],
    layoutOptions: {
        maxWidth: 'wide',
        spacing: 'normal',
    },
    designSystem: defaultDesignSystem,
    preview: {
        thumbnail: '/images/templates/services.png',
    },
    usageCount: 0,
    version: 1,
    isPublished: true,
    isFeatured: true,
};

/**
 * All seed templates
 */
export const seedTemplates = [
    landingPageTemplate,
    aboutUsTemplate,
    pricingPageTemplate,
    portfolioTemplate,
    contactPageTemplate,
    blogPageTemplate,
    servicesPageTemplate,
];

/**
 * Get seed templates with generated IDs and timestamps
 */
export function getSeedTemplatesWithIds(): PageTemplate[] {
    const now = new Date();
    return seedTemplates.map((template, index) => ({
        ...template,
        id: `seed-template-${index + 1}`,
        createdAt: now,
        updatedAt: now,
    }));
}

export default seedTemplates;

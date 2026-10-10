/**
 * CMS Page Templates Seed Data
 * 
 * Pre-configured page templates using V2 blocks
 * Categories: Landing Page, Business, Education, Portfolio, Blog, Product, Solutions, Event, Contact
 * 
 * Available V2 Blocks:
 * - v2-hero-simple, v2-hero-with-image
 * - v2-cta-banner
 * - v2-feature-grid
 * - v2-content-text, v2-content-split
 * - v2-stats-grid
 * - v2-testimonials
 * - v2-pricing
 * - v2-faq
 * - v2-gallery
 * - v2-footer
 * - v2-contact-form
 * - v2-team-grid
 * - v2-logo-cloud
 * - v2-newsletter
 */

export const templatesData = [
  // ==================== LANDING PAGES ====================
  {
    name: 'Minimal Landing Page',
    description: 'Clean and modern landing page with hero, features, and CTA',
    category: 'Landing Page',
    isFeatured: true,
    designSystem: {
      colors: {
        primary: '#ff7f1e',
        secondary: '#1e40ff',
        background: '#ffffff',
        text: '#171717',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
      },
      supportedContexts: ['public'],
    },
    blocks: [
      {
        id: 'hero',
        type: 'v2-hero-simple',
        props: {
          title: 'Modern İş Çözümleri',
          subtitle: 'İşinizi dijital dünyada büyütün. Güçlü araçlar ve kolay kullanım ile işinizi bir üst seviyeye taşıyın.',
          ctaText: 'Ücretsiz Dene',
          ctaLink: '/trial',
          alignment: 'center',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
      {
        id: 'logos',
        type: 'v2-logo-cloud',
        props: {
          heading: 'Güvenilen Markalar',
          variant: 'simple',
          grayscale: true,
          backgroundColor: '#ffffff',
        },
      },
      {
        id: 'features',
        type: 'v2-feature-grid',
        props: {
          heading: 'Güçlü Özellikler',
          subheading: 'İhtiyacınız olan her şey bir arada',
          columns: 3,
          features: [
            { icon: 'Zap', title: 'Hızlı ve Verimli', description: 'Saniyeler içinde işlerinizi halledin' },
            { icon: 'Shield', title: 'Güvenli', description: 'Verileriniz en yüksek güvenlik standartlarıyla korunur' },
            { icon: 'Users', title: 'Ekip İşbirliği', description: 'Takımınızla sorunsuz bir şekilde çalışın' },
          ],
          backgroundColor: '#f8fafc',
        },
      },
      {
        id: 'pricing',
        type: 'v2-pricing',
        props: {
          heading: 'Basit Fiyatlandırma',
          subheading: 'İhtiyaçlarınıza uygun planı seçin',
          plans: [
            {
              name: 'Başlangıç',
              price: '₺99',
              period: '/ay',
              description: 'Küçük ekipler için',
              features: ['5 Kullanıcı', '10 GB Depolama', 'Temel Özellikler', 'Email Destek'],
              ctaText: 'Başla',
              ctaLink: '/signup?plan=starter',
            },
            {
              name: 'Profesyonel',
              price: '₺299',
              period: '/ay',
              description: 'Büyüyen ekipler için',
              features: ['20 Kullanıcı', '100 GB Depolama', 'Gelişmiş Özellikler', 'Öncelikli Destek'],
              ctaText: 'Başla',
              ctaLink: '/signup?plan=pro',
              featured: true,
            },
            {
              name: 'Kurumsal',
              price: '₺999',
              period: '/ay',
              description: 'Büyük organizasyonlar için',
              features: ['Sınırsız Kullanıcı', 'Sınırsız Depolama', 'Tüm Özellikler', '7/24 Destek'],
              ctaText: 'İletişime Geç',
              ctaLink: '/contact',
            },
          ],
          backgroundColor: '#ffffff',
        },
      },
      {
        id: 'cta',
        type: 'v2-cta-banner',
        props: {
          heading: 'Hemen Başlayın',
          description: '14 gün ücretsiz deneme - Kredi kartı gerekmez',
          buttonText: 'Ücretsiz Deneyin',
          buttonLink: '/trial',
          backgroundColor: '#6366f1',
          textColor: '#ffffff',
        },
      },
      {
        id: 'footer',
        type: 'v2-footer',
        props: {
          logoText: 'Şirket Adı',
          description: 'Modern iş çözümleri ile dijital dönüşümünüzü tamamlayın',
          columns: [
            {
              title: 'Ürün',
              links: [
                { label: 'Özellikler', href: '/features' },
                { label: 'Fiyatlandırma', href: '/pricing' },
                { label: 'Güvenlik', href: '/security' },
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
                { label: 'Durum', href: '/status' },
              ],
            },
          ],
          copyright: '© 2024 Şirket Adı. Tüm hakları saklıdır.',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
    ],
    layoutOptions: {
      maxWidth: '1280px',
      spacing: 'comfortable',
    },
    metadata: {
      tags: ['landing', 'minimal', 'business'],
      difficulty: 'beginner',
      estimatedSetupTime: '5 minutes',
    },
    preview: {
      thumbnail: '/templates/minimal-landing.jpg',
    },
  },

  // ==================== EDUCATION ====================
  {
    name: 'Education Platform',
    description: 'Modern eğitim platformu için öğrenci dostu tasarım',
    category: 'Education',
    isFeatured: true,
    designSystem: {
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        background: '#ffffff',
        text: '#1f2937',
      },
      typography: {
        headingFont: 'Poppins',
        bodyFont: 'Inter',
      },
      supportedContexts: ['public'],
    },
    blocks: [
      {
        id: 'hero',
        type: 'v2-hero-with-image',
        props: {
          title: 'Geleceğini İnşa Et',
          subtitle: 'Online Eğitimle Kendini Geliştir',
          description: 'Uzman eğitmenlerden, kendi hızında öğren. 1000+ kurs, sertifika programları ve daha fazlası.',
          imageUrl: '/images/education-hero.jpg',
          imagePosition: 'right',
          ctaText: 'Kurslara Göz At',
          ctaLink: '/courses',
          secondaryCtaText: 'Ücretsiz Deneme',
          secondaryCtaLink: '/trial',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
      {
        id: 'features',
        type: 'v2-feature-grid',
        props: {
          heading: 'Neden Bizi Seçmelisiniz?',
          subheading: 'Eğitimde fark yaratan özellikler',
          columns: 4,
          features: [
            { icon: 'BookOpen', title: 'Kapsamlı Kurs Kütüphanesi', description: '50+ kategoride 1000+ kurs' },
            { icon: 'Users', title: 'Uzman Eğitmenler', description: 'Alanında uzman, deneyimli eğitmenler' },
            { icon: 'Award', title: 'Sertifika Programları', description: 'Geçerli sertifikalarla kariyerinizi güçlendirin' },
            { icon: 'Headphones', title: '7/24 Destek', description: 'Her zaman yanınızdayız' },
          ],
          backgroundColor: '#ffffff',
        },
      },
      {
        id: 'stats',
        type: 'v2-stats-grid',
        props: {
          heading: 'Rakamlarla Biz',
          stats: [
            { value: '10K', label: 'Aktif Öğrenci', suffix: '+' },
            { value: '1K', label: 'Online Kurs', suffix: '+' },
            { value: '50', label: 'Uzman Eğitmen', suffix: '+' },
            { value: '98', label: 'Memnuniyet Oranı', suffix: '%' },
          ],
          columns: 4,
          backgroundColor: '#f8fafc',
        },
      },
      {
        id: 'testimonials',
        type: 'v2-testimonials',
        props: {
          heading: 'Öğrencilerimiz Ne Diyor?',
          subheading: 'Binlerce mutlu öğrenciden bazıları',
          testimonials: [
            {
              quote: 'Bu platform sayesinde kariyerimde büyük ilerleme kaydettim. Kurslar çok kapsamlı ve anlaşılır.',
              author: 'Ahmet Yılmaz',
              role: 'Yazılım Geliştirici',
              company: 'TechCorp',
            },
            {
              quote: 'Eğitmenler gerçekten işinin uzmanı. Projelerimde öğrendiklerimi hemen uygulayabiliyorum.',
              author: 'Ayşe Demir',
              role: 'Grafik Tasarımcı',
              company: 'Creative Studio',
            },
          ],
          backgroundColor: '#ffffff',
        },
      },
      {
        id: 'cta',
        type: 'v2-cta-banner',
        props: {
          heading: 'Bugün Başla, Yarın Fark Yarat',
          description: '14 gün ücretsiz deneme ile tüm kurslara sınırsız erişim',
          buttonText: 'Ücretsiz Başla',
          buttonLink: '/signup',
          backgroundColor: '#6366f1',
          textColor: '#ffffff',
        },
      },
      {
        id: 'newsletter',
        type: 'v2-newsletter',
        props: {
          heading: 'Bültenimize Abone Olun',
          subheading: 'Yeni kurslar ve fırsatlardan haberdar olun',
          variant: 'inline',
          backgroundColor: '#1e293b',
          textColor: '#ffffff',
        },
      },
      {
        id: 'footer',
        type: 'v2-footer',
        props: {
          logoText: 'EduPlatform',
          description: 'Geleceğinizi inşa edin, hayallerinize ulaşın',
          columns: [
            {
              title: 'Platform',
              links: [
                { label: 'Kurslar', href: '/courses' },
                { label: 'Eğitmenler', href: '/instructors' },
                { label: 'Sertifikalar', href: '/certificates' },
              ],
            },
            {
              title: 'Destek',
              links: [
                { label: 'Yardım Merkezi', href: '/help' },
                { label: 'SSS', href: '/faq' },
                { label: 'İletişim', href: '/contact' },
              ],
            },
          ],
          copyright: '© 2024 EduPlatform. Tüm hakları saklıdır.',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
    ],
    layoutOptions: {
      maxWidth: '1440px',
      spacing: 'relaxed',
    },
    metadata: {
      tags: ['education', 'learning', 'courses'],
      difficulty: 'intermediate',
      estimatedSetupTime: '10 minutes',
    },
  },

  // ==================== BUSINESS ====================
  {
    name: 'Corporate Business',
    description: 'Clean enterprise-level corporate website template',
    category: 'Business',
    isFeatured: false,
    designSystem: {
      colors: {
        primary: '#1e40af',
        secondary: '#64748b',
        background: '#ffffff',
        text: '#111827',
      },
      typography: {
        headingFont: 'Montserrat',
        bodyFont: 'Open Sans',
      },
      supportedContexts: ['public'],
    },
    blocks: [
      {
        id: 'hero',
        type: 'v2-hero-with-image',
        props: {
          title: 'Building Excellence Since 2000',
          subtitle: '20+ Years of Trust',
          description: 'Enterprise-level services driving businesses forward. International standards, proven results.',
          imageUrl: '/images/corporate-hero.jpg',
          imagePosition: 'right',
          ctaText: 'Our Services',
          ctaLink: '#services',
          secondaryCtaText: 'Learn More',
          secondaryCtaLink: '#about',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
      {
        id: 'stats',
        type: 'v2-stats-grid',
        props: {
          heading: 'Our Track Record',
          stats: [
            { value: '20', label: 'Years Experience', suffix: '+' },
            { value: '500', label: 'Satisfied Clients', suffix: '+' },
            { value: '1000', label: 'Successful Projects', suffix: '+' },
            { value: '50', label: 'Countries Served', suffix: '+' },
          ],
          columns: 4,
          backgroundColor: '#f8fafc',
        },
      },
      {
        id: 'about',
        type: 'v2-content-split',
        props: {
          heading: 'Our Mission',
          subheading: 'Who We Are',
          content: 'To empower organizations with innovative solutions that drive sustainable growth and digital transformation. We are committed to delivering excellence through every project, partnership, and innovation.',
          imageUrl: '/images/mission.jpg',
          imagePosition: 'left',
          ctaText: 'Learn More',
          ctaLink: '/about',
          backgroundColor: '#ffffff',
        },
      },
      {
        id: 'services',
        type: 'v2-feature-grid',
        props: {
          heading: 'Our Core Values',
          subheading: 'Principles that guide every decision we make',
          columns: 4,
          features: [
            { icon: 'Shield', title: 'Integrity', description: 'Transparency and honesty in all our dealings' },
            { icon: 'Lightbulb', title: 'Innovation', description: 'Continuous improvement and creative thinking' },
            { icon: 'Star', title: 'Excellence', description: 'Uncompromising quality in everything we do' },
            { icon: 'Users', title: 'Collaboration', description: 'Partnership approach with clients and teams' },
          ],
          backgroundColor: '#f8fafc',
        },
      },
      {
        id: 'logos',
        type: 'v2-logo-cloud',
        props: {
          heading: 'Trusted by Industry Leaders',
          subheading: 'Fortune 500 companies choose us as their partner',
          variant: 'grid',
          columns: 6,
          grayscale: true,
          backgroundColor: '#ffffff',
        },
      },
      {
        id: 'testimonials',
        type: 'v2-testimonials',
        props: {
          heading: 'Client Testimonials',
          subheading: 'What our partners say about us',
          testimonials: [
            {
              quote: 'Professional approach and quality service took our business to the next level.',
              author: 'Robert Anderson',
              role: 'CEO',
              company: 'Tech Corp International',
            },
            {
              quote: 'Our trusted partner for years. Their customer satisfaction approach is commendable.',
              author: 'Jennifer Martinez',
              role: 'CTO',
              company: 'Innovation Labs',
            },
          ],
          backgroundColor: '#f8fafc',
        },
      },
      {
        id: 'cta',
        type: 'v2-cta-banner',
        props: {
          heading: 'Partner with Excellence',
          description: 'Let our experienced team help transform your business for the digital age',
          buttonText: 'Schedule Consultation',
          buttonLink: '/consultation',
          backgroundColor: '#1e40af',
          textColor: '#ffffff',
        },
      },
      {
        id: 'footer',
        type: 'v2-footer',
        props: {
          logoText: 'Corporate Solutions',
          description: 'Your trusted solution partner in business',
          columns: [
            {
              title: 'Company',
              links: [
                { label: 'About Us', href: '/about' },
                { label: 'Leadership', href: '/leadership' },
                { label: 'Careers', href: '/careers' },
              ],
            },
            {
              title: 'Services',
              links: [
                { label: 'Consulting', href: '/consulting' },
                { label: 'Digital Transformation', href: '/transformation' },
                { label: 'Cloud Solutions', href: '/cloud' },
              ],
            },
            {
              title: 'Contact',
              links: [
                { label: 'Get in Touch', href: '/contact' },
                { label: 'Locations', href: '/locations' },
                { label: 'Support', href: '/support' },
              ],
            },
          ],
          copyright: '© 2024 Corporate Solutions. All rights reserved.',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
    ],
    layoutOptions: {
      maxWidth: '1280px',
      spacing: 'comfortable',
    },
    metadata: {
      tags: ['business', 'corporate', 'professional'],
      difficulty: 'intermediate',
      estimatedSetupTime: '15 minutes',
    },
  },

  // ==================== PORTFOLIO ====================
  {
    name: 'Creative Portfolio',
    description: 'Yaratıcı profesyoneller için modern portföy sitesi',
    category: 'Portfolio',
    isFeatured: false,
    designSystem: {
      colors: {
        primary: '#ec4899',
        secondary: '#8b5cf6',
        background: '#0f172a',
        text: '#f1f5f9',
      },
      typography: {
        headingFont: 'Playfair Display',
        bodyFont: 'Lato',
      },
      supportedContexts: ['public'],
    },
    blocks: [
      {
        id: 'hero',
        type: 'v2-hero-simple',
        props: {
          title: 'Creative Designer',
          subtitle: 'Turning Ideas Into Reality. Graphic Design • Web Design • Branding',
          ctaText: 'View Portfolio',
          ctaLink: '#portfolio',
          alignment: 'center',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
      {
        id: 'portfolio',
        type: 'v2-gallery',
        props: {
          heading: 'Recent Works',
          subheading: 'A showcase of my best projects',
          columns: 3,
          images: [
            { url: '/portfolio/1.jpg', alt: 'Brand Identity', caption: 'Brand Identity Design' },
            { url: '/portfolio/2.jpg', alt: 'Web Design', caption: 'E-commerce Website' },
            { url: '/portfolio/3.jpg', alt: 'UI/UX', caption: 'Mobile App UI' },
            { url: '/portfolio/4.jpg', alt: 'Illustration', caption: 'Digital Illustration' },
            { url: '/portfolio/5.jpg', alt: 'Packaging', caption: 'Product Packaging' },
            { url: '/portfolio/6.jpg', alt: 'Social Media', caption: 'Social Media Campaign' },
          ],
          backgroundColor: '#1e293b',
          textColor: '#ffffff',
        },
      },
      {
        id: 'about',
        type: 'v2-content-split',
        props: {
          heading: 'About Me',
          subheading: 'Your Creative Partner',
          content: "I'm a creative designer with 5+ years of experience in digital design. I specialize in brand identity, web design, and UI/UX. Let's create something amazing together.",
          imageUrl: '/images/portrait.jpg',
          imagePosition: 'left',
          ctaText: 'Download Resume',
          ctaLink: '/resume.pdf',
          backgroundColor: '#0f172a',
          textColor: '#f1f5f9',
        },
      },
      {
        id: 'testimonials',
        type: 'v2-testimonials',
        props: {
          heading: 'Client Reviews',
          testimonials: [
            {
              quote: 'Exceptional creativity and attention to detail. Delivered beyond expectations!',
              author: 'Emma Wilson',
              role: 'Marketing Director',
              company: 'Brand Agency',
            },
            {
              quote: 'Working with John was a pleasure. Professional, creative, and on-time delivery.',
              author: 'Michael Brown',
              role: 'Startup Founder',
              company: 'TechStartup',
            },
          ],
          backgroundColor: '#1e293b',
          textColor: '#ffffff',
        },
      },
      {
        id: 'cta',
        type: 'v2-cta-banner',
        props: {
          heading: "Let's Work Together",
          description: 'Have a project in mind? Let\'s discuss how I can help bring your vision to life.',
          buttonText: 'Get In Touch',
          buttonLink: '/contact',
          backgroundColor: '#ec4899',
          textColor: '#ffffff',
        },
      },
      {
        id: 'footer',
        type: 'v2-footer',
        props: {
          logoText: 'John Doe',
          description: 'Creative Designer & Brand Strategist',
          columns: [],
          copyright: '© 2024 John Doe. All rights reserved.',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
    ],
    layoutOptions: {
      maxWidth: '1920px',
      spacing: 'relaxed',
    },
    metadata: {
      tags: ['portfolio', 'creative', 'designer'],
      difficulty: 'beginner',
      estimatedSetupTime: '7 minutes',
    },
  },

  // ==================== BLOG ====================
  {
    name: 'Modern Blog',
    description: 'Temiz ve okunabilir blog şablonu',
    category: 'Blog',
    isFeatured: false,
    designSystem: {
      colors: {
        primary: '#10b981',
        secondary: '#3b82f6',
        background: '#ffffff',
        text: '#1f2937',
      },
      typography: {
        headingFont: 'Merriweather',
        bodyFont: 'Lora',
      },
      supportedContexts: ['public'],
    },
    blocks: [
      {
        id: 'hero',
        type: 'v2-hero-simple',
        props: {
          title: 'Thoughts & Ideas',
          subtitle: 'Exploring technology, design, and everything in between',
          alignment: 'center',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
      {
        id: 'content',
        type: 'v2-content-text',
        props: {
          heading: 'Latest Articles',
          content: '<p class="text-lg text-muted-foreground">Blog posts will be loaded here. Connect your CMS to display dynamic content.</p>',
          alignment: 'center',
          maxWidth: 'md',
          backgroundColor: '#ffffff',
        },
      },
      {
        id: 'newsletter',
        type: 'v2-newsletter',
        props: {
          heading: 'Subscribe to Newsletter',
          subheading: 'Get the latest articles delivered to your inbox',
          variant: 'card',
          backgroundColor: '#f8fafc',
          accentColor: '#10b981',
        },
      },
      {
        id: 'footer',
        type: 'v2-footer',
        props: {
          logoText: 'My Blog',
          description: 'Sharing insights about web development and technology',
          columns: [
            {
              title: 'Navigation',
              links: [
                { label: 'Home', href: '/' },
                { label: 'Articles', href: '/articles' },
                { label: 'About', href: '/about' },
              ],
            },
          ],
          copyright: '© 2024 My Blog. All rights reserved.',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
    ],
    layoutOptions: {
      maxWidth: '800px',
      spacing: 'comfortable',
    },
    metadata: {
      tags: ['blog', 'articles', 'content'],
      difficulty: 'beginner',
      estimatedSetupTime: '5 minutes',
    },
  },

  // ==================== PRODUCT PAGE ====================
  {
    name: 'Software Product Page',
    description: 'Yazılım ürün tanıtım sayfası - özellikler, fiyatlandırma ve demo',
    category: 'Product',
    isFeatured: true,
    designSystem: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        background: '#ffffff',
        text: '#111827',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
      },
      supportedContexts: ['public'],
    },
    blocks: [
      {
        id: 'hero',
        type: 'v2-hero-with-image',
        props: {
          title: 'İş Süreçlerinizi Dijitalleştirin',
          subtitle: 'Modern İnşaat Yönetim Yazılımı',
          description: 'BIM destekli mimari tasarım ve proje yönetimi çözümü ile işlerinizi hızlandırın.',
          imageUrl: '/images/product-hero.jpg',
          imagePosition: 'right',
          ctaText: 'Demo Talep Et',
          ctaLink: '/demo',
          secondaryCtaText: 'Özellikleri Keşfet',
          secondaryCtaLink: '#features',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
      {
        id: 'logos',
        type: 'v2-logo-cloud',
        props: {
          heading: 'Bize Güvenen Markalar',
          variant: 'simple',
          grayscale: true,
          backgroundColor: '#ffffff',
        },
      },
      {
        id: 'features',
        type: 'v2-feature-grid',
        props: {
          heading: 'Güçlü Özellikler',
          subheading: 'İhtiyacınız olan her şey tek platformda',
          columns: 3,
          features: [
            { icon: 'Layers', title: 'BIM Entegrasyonu', description: '3D modelleme ve Building Information Modeling desteği' },
            { icon: 'Users', title: 'Ekip İşbirliği', description: 'Gerçek zamanlı çoklu kullanıcı desteği' },
            { icon: 'Cloud', title: 'Bulut Tabanlı', description: 'Her yerden erişim, otomatik yedekleme' },
            { icon: 'Zap', title: 'Hızlı Performans', description: 'Büyük projelerde bile yüksek performans' },
            { icon: 'Shield', title: 'Güvenli', description: 'ISO 27001 sertifikalı veri güvenliği' },
            { icon: 'Smartphone', title: 'Mobil Uygulama', description: 'iOS ve Android uygulamaları' },
          ],
          backgroundColor: '#f8fafc',
        },
      },
      {
        id: 'pricing',
        type: 'v2-pricing',
        props: {
          heading: 'Fiyatlandırma Planları',
          subheading: 'İhtiyacınıza uygun planı seçin',
          plans: [
            {
              name: 'Starter',
              price: '₺2.999',
              period: '/ay',
              description: 'Küçük ekipler için',
              features: ['5 Kullanıcı', '50GB Depolama', 'Temel BIM Araçları', 'Email Destek'],
              ctaText: 'Başla',
              ctaLink: '/trial?plan=starter',
            },
            {
              name: 'Professional',
              price: '₺7.999',
              period: '/ay',
              description: 'Büyüyen ekipler için',
              features: ['25 Kullanıcı', '500GB Depolama', 'Gelişmiş BIM Araçları', 'Öncelikli Destek', 'API Erişimi'],
              ctaText: 'En Popüler',
              ctaLink: '/trial?plan=professional',
              featured: true,
            },
            {
              name: 'Enterprise',
              price: 'Özel Fiyat',
              period: '',
              description: 'Büyük organizasyonlar için',
              features: ['Sınırsız Kullanıcı', 'Sınırsız Depolama', 'Tüm Özellikler', '7/24 Destek', 'Özel Eğitim'],
              ctaText: 'İletişime Geç',
              ctaLink: '/contact',
            },
          ],
          backgroundColor: '#ffffff',
        },
      },
      {
        id: 'testimonials',
        type: 'v2-testimonials',
        props: {
          heading: 'Müşteri Görüşleri',
          subheading: '1000+ mutlu müşteri',
          testimonials: [
            {
              quote: 'Projelerimizi çok daha hızlı teslim ediyoruz. BIM entegrasyonu harika!',
              author: 'Ahmet Yılmaz',
              role: 'Proje Müdürü',
              company: 'ABC İnşaat',
            },
            {
              quote: 'Ekip işbirliği özellikleri sayesinde uzaktan çalışma çok kolay.',
              author: 'Ayşe Kaya',
              role: 'Mimar',
              company: 'XYZ Mimarlık',
            },
          ],
          backgroundColor: '#f8fafc',
        },
      },
      {
        id: 'faq',
        type: 'v2-faq',
        props: {
          heading: 'Sıkça Sorulan Sorular',
          faqs: [
            { question: 'Ücretsiz deneme süresi var mı?', answer: 'Evet, 30 gün ücretsiz deneme sunuyoruz. Kredi kartı gerekmez.' },
            { question: 'Eğitim desteği sağlıyor musunuz?', answer: 'Her plan için online eğitim videoları sunuyoruz. Enterprise planlarda özel eğitim dahildir.' },
            { question: 'Mevcut sistemlerle entegrasyon mümkün mü?', answer: 'Evet, REST API ile tüm popüler sistemlerle entegrasyon sağlayabilirsiniz.' },
          ],
          backgroundColor: '#ffffff',
        },
      },
      {
        id: 'cta',
        type: 'v2-cta-banner',
        props: {
          heading: 'Bugün Başlayın',
          description: '30 gün ücretsiz deneme - Kredi kartı gerekmez',
          buttonText: 'Ücretsiz Deneyin',
          buttonLink: '/trial',
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
        },
      },
      {
        id: 'footer',
        type: 'v2-footer',
        props: {
          logoText: 'Product Solutions',
          description: 'İnşaat sektörü için modern yazılım çözümleri',
          columns: [
            {
              title: 'Ürün',
              links: [
                { label: 'Özellikler', href: '/features' },
                { label: 'Fiyatlandırma', href: '/pricing' },
                { label: 'Güvenlik', href: '/security' },
              ],
            },
            {
              title: 'Kaynaklar',
              links: [
                { label: 'Dokümantasyon', href: '/docs' },
                { label: 'API', href: '/api' },
                { label: 'Blog', href: '/blog' },
              ],
            },
            {
              title: 'Şirket',
              links: [
                { label: 'Hakkımızda', href: '/about' },
                { label: 'Kariyer', href: '/careers' },
                { label: 'İletişim', href: '/contact' },
              ],
            },
          ],
          copyright: '© 2024 Product Solutions. Tüm hakları saklıdır.',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
    ],
    layoutOptions: {
      maxWidth: '1280px',
      spacing: 'relaxed',
    },
    metadata: {
      tags: ['product', 'software', 'saas', 'bim'],
      difficulty: 'intermediate',
      estimatedSetupTime: '12 minutes',
    },
  },

  // ==================== CONTACT PAGE ====================
  {
    name: 'Contact Page',
    description: 'Profesyonel iletişim sayfası - form, harita ve iletişim bilgileri',
    category: 'Contact',
    isFeatured: false,
    designSystem: {
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        background: '#ffffff',
        text: '#111827',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
      },
      supportedContexts: ['public'],
    },
    blocks: [
      {
        id: 'hero',
        type: 'v2-hero-simple',
        props: {
          title: 'Bizimle İletişime Geçin',
          subtitle: 'Sorularınız, önerileriniz veya iş birliği teklifleriniz için bize ulaşın.',
          alignment: 'center',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
      {
        id: 'contact-form',
        type: 'v2-contact-form',
        props: {
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
        },
      },
      {
        id: 'faq',
        type: 'v2-faq',
        props: {
          heading: 'Sıkça Sorulan Sorular',
          faqs: [
            { question: 'Ne kadar sürede dönüş yapıyorsunuz?', answer: 'İş günlerinde 24 saat içinde dönüş yapıyoruz.' },
            { question: 'Ücretsiz danışmanlık veriyor musunuz?', answer: 'Evet, ilk görüşmemiz ücretsizdir.' },
            { question: 'Hangi saatlerde ulaşabilirim?', answer: 'Hafta içi 09:00 - 18:00 saatleri arasında ulaşabilirsiniz.' },
          ],
          backgroundColor: '#f8fafc',
        },
      },
      {
        id: 'footer',
        type: 'v2-footer',
        props: {
          logoText: 'Şirket',
          description: 'Her zaman yanınızdayız.',
          columns: [],
          copyright: '© 2024 Şirket. Tüm hakları saklıdır.',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
    ],
    layoutOptions: {
      maxWidth: '1280px',
      spacing: 'comfortable',
    },
    metadata: {
      tags: ['contact', 'form'],
      difficulty: 'beginner',
      estimatedSetupTime: '5 minutes',
    },
  },

  // ==================== EVENT PAGE ====================
  {
    name: 'Event & Training',
    description: 'Etkinlik, eğitim ve webinar tanıtım sayfası',
    category: 'Event',
    isFeatured: true,
    designSystem: {
      colors: {
        primary: '#f59e0b',
        secondary: '#ef4444',
        background: '#ffffff',
        text: '#111827',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
      },
      supportedContexts: ['public'],
    },
    blocks: [
      {
        id: 'hero',
        type: 'v2-hero-simple',
        props: {
          title: 'Türkiye Zirvesi 2025',
          subtitle: '15-16 Mart 2025 • İstanbul Kongre Merkezi. İnşaat teknolojilerinin geleceği, BIM uygulamaları ve dijital dönüşüm.',
          ctaText: 'Erken Kayıt İndirimi',
          ctaLink: '#register',
          alignment: 'center',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
      {
        id: 'highlights',
        type: 'v2-feature-grid',
        props: {
          heading: 'Etkinlik Highlights',
          columns: 3,
          features: [
            { icon: 'Users', title: '50+ Konuşmacı', description: 'Sektör liderleri ve uzmanlardan ilham alın' },
            { icon: 'Calendar', title: '30+ Oturum', description: 'Workshop, panel ve teknik sunumlar' },
            { icon: 'Award', title: 'Sertifika', description: 'Katılım sertifikası ve 8 saat eğitim kredisi' },
            { icon: 'Wifi', title: 'Canlı Yayın', description: 'Hibrit katılım - Online veya yerinde' },
            { icon: 'Coffee', title: 'Networking', description: 'Kahve molaları ve networking etkinlikleri' },
            { icon: 'Gift', title: 'Hediyeler', description: 'Tüm katılımcılara özel hediye paketi' },
          ],
          backgroundColor: '#f8fafc',
        },
      },
      {
        id: 'speakers',
        type: 'v2-team-grid',
        props: {
          heading: 'Konuşmacılar',
          subheading: 'Sektörün öncü isimleri',
          columns: 3,
          members: [
            { name: 'Prof. Dr. Ali Yılmaz', role: 'BIM Uzmanı, İTÜ', bio: 'BIM\'in Geleceği ve Yapay Zeka Entegrasyonu' },
            { name: 'Ayşe Kara', role: 'Proje Direktörü, Mega İnşaat', bio: 'Büyük Ölçekli Projelerde BIM Uygulamaları' },
            { name: 'Mehmet Demir', role: 'CTO, TechBuild', bio: 'Dijital İkiz Teknolojisi ile Akıllı Binalar' },
          ],
          backgroundColor: '#ffffff',
        },
      },
      {
        id: 'pricing',
        type: 'v2-pricing',
        props: {
          heading: 'Kayıt Paketleri',
          plans: [
            {
              name: 'Online',
              price: '₺499',
              period: '',
              description: 'Canlı yayın erişimi',
              features: ['Tüm oturumlara canlı erişim', 'Kayıt erişimi (30 gün)', 'Dijital materyal paketi', 'Katılım sertifikası'],
              ctaText: 'Online Kayıt',
              ctaLink: '/register?type=online',
            },
            {
              name: 'Yerinde',
              price: '₺1.499',
              period: '',
              description: 'Fiziksel katılım',
              features: ['Tüm oturumlara fiziksel katılım', 'Kayıt erişimi (90 gün)', 'Networking etkinlikleri', 'Öğle yemeği & kahve', 'Hediye paketi'],
              ctaText: 'Yerinde Kayıt',
              ctaLink: '/register?type=onsite',
              featured: true,
            },
            {
              name: 'VIP',
              price: '₺2.999',
              period: '',
              description: 'Premium deneyim',
              features: ['Tüm yerinde paket özellikleri', 'VIP lounge erişimi', 'Özel workshop', 'Konuşmacılarla meet & greet', 'Premium hediye paketi'],
              ctaText: 'VIP Kayıt',
              ctaLink: '/register?type=vip',
            },
          ],
          backgroundColor: '#f8fafc',
        },
      },
      {
        id: 'cta',
        type: 'v2-cta-banner',
        props: {
          heading: 'Erken Kayıt İndirimi',
          description: '28 Şubat\'a kadar kayıt olun, %20 indirimden yararlanın',
          buttonText: 'Hemen Kayıt Ol',
          buttonLink: '#register',
          backgroundColor: '#f59e0b',
          textColor: '#ffffff',
        },
      },
      {
        id: 'newsletter',
        type: 'v2-newsletter',
        props: {
          heading: 'Etkinlik Güncellemeleri',
          subheading: 'Program değişiklikleri ve özel duyurular için abone olun',
          variant: 'inline',
          backgroundColor: '#1e293b',
          textColor: '#ffffff',
        },
      },
      {
        id: 'footer',
        type: 'v2-footer',
        props: {
          logoText: 'Events',
          description: 'İnşaat teknolojileri zirvesi',
          columns: [
            {
              title: 'Etkinlik',
              links: [
                { label: 'Program', href: '/schedule' },
                { label: 'Konuşmacılar', href: '/speakers' },
                { label: 'Mekan', href: '/venue' },
              ],
            },
            {
              title: 'Bilgi',
              links: [
                { label: 'SSS', href: '/faq' },
                { label: 'Sponsorluk', href: '/sponsorship' },
                { label: 'İletişim', href: '/contact' },
              ],
            },
          ],
          copyright: '© 2024 Events. Tüm hakları saklıdır.',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
    ],
    layoutOptions: {
      maxWidth: '1280px',
      spacing: 'relaxed',
    },
    metadata: {
      tags: ['event', 'training', 'webinar'],
      difficulty: 'intermediate',
      estimatedSetupTime: '10 minutes',
    },
  },

  // ==================== TEAM PAGE ====================
  {
    name: 'Team Page',
    description: 'Ekip tanıtım sayfası - üyeler, hikaye ve değerler',
    category: 'Team',
    isFeatured: false,
    designSystem: {
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        background: '#ffffff',
        text: '#111827',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
      },
      supportedContexts: ['public'],
    },
    blocks: [
      {
        id: 'hero',
        type: 'v2-hero-simple',
        props: {
          title: 'Ekibimizle Tanışın',
          subtitle: 'Başarımızın arkasındaki yetenekli ve tutkulu profesyoneller',
          alignment: 'center',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
      {
        id: 'team',
        type: 'v2-team-grid',
        props: {
          heading: 'Liderlik Ekibi',
          subheading: 'Vizyonumuzun arkasındaki isimler',
          columns: 4,
          members: [
            { name: 'Mehmet Öztürk', role: 'CEO & Kurucu', bio: '15+ yıl teknoloji sektörü deneyimi', social: { linkedin: '#', twitter: '#' } },
            { name: 'Ayşe Demir', role: 'CTO', bio: 'Büyük veri ve yapay zeka uzmanı', social: { linkedin: '#' } },
            { name: 'Emre Yılmaz', role: 'CPO', bio: 'Kullanıcı deneyimi odaklı ürün geliştirme', social: { linkedin: '#', twitter: '#' } },
            { name: 'Zeynep Kaya', role: 'CFO', bio: 'Finansal strateji ve büyüme uzmanı', social: { linkedin: '#' } },
          ],
          backgroundColor: '#ffffff',
        },
      },
      {
        id: 'stats',
        type: 'v2-stats-grid',
        props: {
          heading: 'Rakamlarla Biz',
          stats: [
            { value: '50', label: 'Ekip Üyesi', suffix: '+' },
            { value: '8', label: 'Yıllık Deneyim', suffix: '' },
            { value: '15', label: 'Ülke', suffix: '+' },
            { value: '10K', label: 'Mutlu Müşteri', suffix: '+' },
          ],
          columns: 4,
          backgroundColor: '#f8fafc',
        },
      },
      {
        id: 'values',
        type: 'v2-feature-grid',
        props: {
          heading: 'Değerlerimiz',
          subheading: 'Her gün bizi yönlendiren ilkeler',
          columns: 3,
          features: [
            { icon: 'Heart', title: 'Tutku', description: 'İşimize tutkuyla bağlıyız' },
            { icon: 'Target', title: 'Odak', description: 'Müşteri başarısına odaklanıyoruz' },
            { icon: 'Sparkles', title: 'İnovasyon', description: 'Sürekli yenilik peşindeyiz' },
          ],
          backgroundColor: '#ffffff',
        },
      },
      {
        id: 'cta',
        type: 'v2-cta-banner',
        props: {
          heading: 'Ekibimize Katılın',
          description: 'Yetenekli profesyonellerle birlikte geleceği şekillendirin.',
          buttonText: 'Açık Pozisyonlar',
          buttonLink: '/careers',
          backgroundColor: '#6366f1',
          textColor: '#ffffff',
        },
      },
      {
        id: 'footer',
        type: 'v2-footer',
        props: {
          logoText: 'Şirket',
          description: 'Teknoloji ile geleceği şekillendiriyoruz.',
          columns: [],
          copyright: '© 2024 Şirket. Tüm hakları saklıdır.',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
    ],
    layoutOptions: {
      maxWidth: '1280px',
      spacing: 'comfortable',
    },
    metadata: {
      tags: ['team', 'about', 'company'],
      difficulty: 'beginner',
      estimatedSetupTime: '7 minutes',
    },
  },

  // ==================== SOLUTIONS PAGE ====================
  {
    name: 'Business Solutions',
    description: 'Kapsamlı iş çözümleri sayfası',
    category: 'Solutions',
    isFeatured: true,
    designSystem: {
      colors: {
        primary: '#0891b2',
        secondary: '#06b6d4',
        background: '#ffffff',
        text: '#0f172a',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
      },
      supportedContexts: ['public'],
    },
    blocks: [
      {
        id: 'hero',
        type: 'v2-hero-with-image',
        props: {
          title: 'Transform Your Business with Comprehensive Solutions',
          subtitle: 'Enterprise-Grade Tools',
          description: 'Modular, scalable solutions designed to accelerate your digital transformation.',
          imageUrl: '/images/solutions-hero.jpg',
          imagePosition: 'right',
          ctaText: 'Explore Solutions',
          ctaLink: '#solutions',
          secondaryCtaText: 'Request Demo',
          secondaryCtaLink: '/demo',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
      {
        id: 'features',
        type: 'v2-feature-grid',
        props: {
          heading: 'Core Capabilities',
          subheading: 'Complete feature set for business transformation',
          columns: 3,
          features: [
            { icon: 'BarChart2', title: 'Advanced Analytics', description: 'Real-time insights and predictive analytics' },
            { icon: 'Users', title: 'Team Collaboration', description: 'Seamless collaboration tools for distributed teams' },
            { icon: 'Shield', title: 'Enterprise Security', description: 'Bank-grade encryption and compliance management' },
            { icon: 'Zap', title: 'Automation Engine', description: 'Workflow automation to eliminate repetitive tasks' },
            { icon: 'Cloud', title: 'Cloud Infrastructure', description: 'Scalable, reliable cloud platform with 99.9% uptime' },
            { icon: 'Settings', title: 'Customization', description: 'Flexible configuration to match your workflows' },
          ],
          backgroundColor: '#f8fafc',
        },
      },
      {
        id: 'stats',
        type: 'v2-stats-grid',
        props: {
          heading: 'Trusted by Industry Leaders',
          stats: [
            { value: '500', label: 'Enterprise Clients', suffix: '+' },
            { value: '2K', label: 'Projects Delivered', suffix: '+' },
            { value: '98', label: 'Customer Satisfaction', suffix: '%' },
            { value: '15', label: 'Industry Sectors', suffix: '+' },
          ],
          columns: 4,
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
          accentColor: '#06b6d4',
        },
      },
      {
        id: 'faq',
        type: 'v2-faq',
        props: {
          heading: 'Complete Solution Breakdown',
          subheading: 'Explore our comprehensive feature set',
          faqs: [
            { question: 'Platform Architecture', answer: 'Built on modern microservices architecture with containerized deployment. Supports horizontal scaling and automatic failover.' },
            { question: 'Integration Capabilities', answer: 'RESTful APIs, GraphQL, and webhooks for seamless integration. Pre-built connectors for Salesforce, SAP, Oracle, and 1000+ more applications.' },
            { question: 'Security & Compliance', answer: 'ISO 27001, SOC 2 Type II, GDPR compliant. Advanced encryption, role-based access control, and continuous security monitoring.' },
            { question: 'Support & Training', answer: '24/7 technical support, dedicated account management, comprehensive documentation, and on-site training programs.' },
          ],
          backgroundColor: '#ffffff',
        },
      },
      {
        id: 'testimonials',
        type: 'v2-testimonials',
        props: {
          heading: 'Customer Success Stories',
          testimonials: [
            {
              quote: 'We consolidated all our business units on one platform. Efficiency increased by 40%.',
              author: 'Sarah Johnson',
              role: 'Chief Digital Officer',
              company: 'Global Manufacturing Corp',
            },
            {
              quote: 'Complete digital transformation of our project processes. Cost savings are substantial.',
              author: 'Michael Chen',
              role: 'CEO',
              company: 'Construction Innovations Ltd',
            },
          ],
          backgroundColor: '#f8fafc',
        },
      },
      {
        id: 'cta',
        type: 'v2-cta-banner',
        props: {
          heading: 'Ready to Transform Your Business?',
          description: 'Our expert team is ready to design a custom solution for your industry',
          buttonText: 'Schedule Consultation',
          buttonLink: '/consultation',
          backgroundColor: '#0891b2',
          textColor: '#ffffff',
        },
      },
      {
        id: 'footer',
        type: 'v2-footer',
        props: {
          logoText: 'Solutions',
          description: 'Your trusted partner in digital transformation',
          columns: [
            {
              title: 'Solutions',
              links: [
                { label: 'Construction', href: '/solutions/construction' },
                { label: 'Energy', href: '/solutions/energy' },
                { label: 'Manufacturing', href: '/solutions/manufacturing' },
              ],
            },
            {
              title: 'Company',
              links: [
                { label: 'About Us', href: '/about' },
                { label: 'Team', href: '/team' },
                { label: 'Careers', href: '/careers' },
              ],
            },
            {
              title: 'Support',
              links: [
                { label: 'Help Center', href: '/help' },
                { label: 'Contact', href: '/contact' },
                { label: 'FAQ', href: '/faq' },
              ],
            },
          ],
          copyright: '© 2024 Solutions. All rights reserved.',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
    ],
    layoutOptions: {
      maxWidth: '1440px',
      spacing: 'comfortable',
    },
    metadata: {
      tags: ['solutions', 'business', 'enterprise'],
      difficulty: 'intermediate',
      estimatedSetupTime: '15 minutes',
    },
  },

  // ==================== ADDITIONAL TEMPLATES ====================

  // 11. Industry Solution
  {
    name: 'Industry Solution',
    description: 'Sektörel çözüm sayfası - iş akışları, özellikler ve çözüm kartları',
    category: 'Solutions',
    isFeatured: true,
    designSystem: { colors: { primary: '#ff7f1e', secondary: '#3b82f6', background: '#ffffff', text: '#171717' }, typography: { headingFont: 'Inter', bodyFont: 'Inter' }, supportedContexts: ['public'] },
    blocks: [
      { id: 'hero', type: 'v2-hero-simple', props: { title: 'Sektörünüze Özel Çözümler', subtitle: 'Modern teknolojilerle işinizi geleceğe taşıyın. Dijital dönüşüm yolculuğunuzda yanınızdayız.', ctaText: 'Hemen Başlayın', ctaLink: '/contact', backgroundColor: '#0f172a', textColor: '#ffffff' } },
      { id: 'features', type: 'v2-feature-grid', props: { heading: 'Neden Bizi Seçmelisiniz?', subheading: 'Avantajlarımız', columns: 3, features: [{ icon: 'Zap', title: 'Hızlı Performans', description: 'Yıldırım hızında işlem süreleri' }, { icon: 'Shield', title: 'Güvenli Altyapı', description: 'En üst düzey güvenlik' }, { icon: 'Users', title: 'Takım İşbirliği', description: 'Gerçek zamanlı çalışma' }], backgroundColor: '#f8fafc' } },
      { id: 'solutions', type: 'v2-feature-grid', props: { heading: 'Çözüm Paketlerimiz', subheading: 'Hizmetlerimiz', columns: 3, features: [{ icon: 'Building', title: 'Mimarlık & Tasarım', description: 'BIM ve 3D modelleme' }, { icon: 'BarChart', title: 'Proje Yönetimi', description: 'Ekip işbirliği' }, { icon: 'TrendingUp', title: 'Analiz & Raporlama', description: 'Veri analitiği' }], backgroundColor: '#ffffff' } },
      { id: 'cta', type: 'v2-cta-banner', props: { heading: 'Hemen Başlayın', description: 'Ücretsiz demo ile keşfedin', buttonText: 'Ücretsiz Demo', buttonLink: '/demo', backgroundColor: '#ff7f1e' } },
      { id: 'footer', type: 'v2-footer', props: { logoText: 'Industry Solutions', description: 'Sektörel çözümler', columns: [], copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } },
    ],
    layoutOptions: { maxWidth: '1440px', spacing: 'comfortable' },
    metadata: { tags: ['industry', 'solution', 'workflow'], difficulty: 'intermediate', estimatedSetupTime: '10 minutes' },
  },

  // 12. Corporate Homepage
  {
    name: 'Corporate Homepage',
    description: 'Kurumsal şirket ana sayfası - Hero, hizmetler, istatistikler, referanslar',
    category: 'Business',
    isFeatured: true,
    designSystem: { colors: { primary: '#1e40af', secondary: '#64748b', background: '#ffffff', text: '#111827' }, typography: { headingFont: 'Inter', bodyFont: 'Inter' }, supportedContexts: ['public'] },
    blocks: [
      { id: 'hero', type: 'v2-hero-with-image', props: { title: 'Geleceği Birlikte İnşa Ediyoruz', subtitle: 'Lider Teknoloji Şirketi', description: 'İşletmenizin dijital dönüşüm yolculuğunda güvenilir partneriniz', imageUrl: '/images/corporate.jpg', ctaText: 'Hemen Başlayın', ctaLink: '/demo', backgroundColor: '#0f172a', textColor: '#ffffff' } },
      { id: 'stats', type: 'v2-stats-grid', props: { heading: 'Rakamlarla Biz', stats: [{ value: '10K', label: 'Aktif Müşteri', suffix: '+' }, { value: '15', label: 'Yıllık Tecrübe', suffix: '' }, { value: '200', label: 'Uzman Ekip', suffix: '+' }, { value: '99', label: 'Müşteri Memnuniyeti', suffix: '%' }], columns: 4, backgroundColor: '#f8fafc' } },
      { id: 'services', type: 'v2-feature-grid', props: { heading: 'Hizmetlerimiz', columns: 3, features: [{ icon: 'Code', title: 'Yazılım Geliştirme', description: 'Özel yazılım çözümleri' }, { icon: 'Cloud', title: 'Bulut Hizmetleri', description: 'AWS, Azure, GCP' }, { icon: 'Shield', title: 'Siber Güvenlik', description: 'Kurumsal güvenlik' }], backgroundColor: '#ffffff' } },
      { id: 'logos', type: 'v2-logo-cloud', props: { heading: 'Referanslarımız', variant: 'grid', grayscale: true, backgroundColor: '#f8fafc' } },
      { id: 'cta', type: 'v2-cta-banner', props: { heading: 'Projenizi Konuşalım', buttonText: 'İletişime Geçin', buttonLink: '/contact', backgroundColor: '#1e40af' } },
      { id: 'footer', type: 'v2-footer', props: { logoText: 'Corporate', description: 'Kurumsal çözümler', columns: [], copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } },
    ],
    layoutOptions: { maxWidth: '1280px', spacing: 'comfortable' },
    metadata: { tags: ['corporate', 'business', 'homepage'], difficulty: 'intermediate', estimatedSetupTime: '12 minutes' },
  },

  // 13. SaaS Landing
  {
    name: 'SaaS Landing',
    description: 'SaaS ürün tanıtımı - özellikler, fiyatlandırma, testimonials',
    category: 'Landing Page',
    isFeatured: true,
    designSystem: { colors: { primary: '#6366f1', secondary: '#8b5cf6', background: '#ffffff', text: '#111827' }, typography: { headingFont: 'Inter', bodyFont: 'Inter' }, supportedContexts: ['public'] },
    blocks: [
      { id: 'hero', type: 'v2-hero-simple', props: { title: 'İş Akışınızı Otomatikleştirin', subtitle: 'Yapay zeka destekli platformla verimliliğinizi %300 artırın', ctaText: '14 Gün Ücretsiz Dene', ctaLink: '/signup', backgroundColor: '#0f172a', textColor: '#ffffff' } },
      { id: 'logos', type: 'v2-logo-cloud', props: { heading: 'Güvenilen Markalar', variant: 'simple', grayscale: true } },
      { id: 'features', type: 'v2-feature-grid', props: { heading: 'Özellikler', columns: 3, features: [{ icon: 'Zap', title: 'Anlık Sonuçlar', description: 'Gerçek zamanlı analiz' }, { icon: 'Shield', title: 'Kurumsal Güvenlik', description: 'SOC2, GDPR uyumlu' }, { icon: 'Cpu', title: 'AI Destekli', description: 'Akıllı öneriler' }], backgroundColor: '#f8fafc' } },
      { id: 'pricing', type: 'v2-pricing', props: { heading: 'Fiyatlandırma', plans: [{ name: 'Starter', price: '₺199', period: '/ay', features: ['5 kullanıcı', '10 GB'], ctaText: 'Başla', ctaLink: '/signup' }, { name: 'Pro', price: '₺499', period: '/ay', features: ['25 kullanıcı', '100 GB', 'API'], ctaText: 'Başla', ctaLink: '/signup', featured: true }, { name: 'Enterprise', price: 'Özel', features: ['Sınırsız', 'SLA'], ctaText: 'İletişim', ctaLink: '/contact' }] } },
      { id: 'testimonials', type: 'v2-testimonials', props: { heading: 'Müşteri Yorumları', testimonials: [{ quote: 'Müşteri hizmetleri yanıt süremiz %60 azaldı', author: 'Zeynep K.', role: 'Direktör', company: 'TechStart' }] } },
      { id: 'faq', type: 'v2-faq', props: { heading: 'SSS', faqs: [{ question: 'Ücretsiz deneme var mı?', answer: 'Evet, 14 gün ücretsiz.' }], backgroundColor: '#f8fafc' } },
      { id: 'cta', type: 'v2-cta-banner', props: { heading: 'Hemen Başlayın', buttonText: 'Ücretsiz Dene', buttonLink: '/signup', backgroundColor: '#6366f1' } },
      { id: 'footer', type: 'v2-footer', props: { logoText: 'SaaS', columns: [], copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } },
    ],
    layoutOptions: { maxWidth: '1280px', spacing: 'comfortable' },
    metadata: { tags: ['saas', 'landing', 'product'], difficulty: 'beginner', estimatedSetupTime: '10 minutes' },
  },

  // 14-31: Additional templates (abbreviated for token limit)
  { name: 'Agency Portfolio', description: 'Ajans portfolyo sayfası', category: 'Portfolio', isFeatured: false, designSystem: { colors: { primary: '#ec4899' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-simple', props: { title: 'Yaratıcı Ajans', subtitle: 'Markanızı güçlendiriyoruz', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'gallery', type: 'v2-gallery', props: { heading: 'Projelerimiz', columns: 3 } }, { id: 'testimonials', type: 'v2-testimonials', props: { heading: 'Müşteri Yorumları' } }, { id: 'cta', type: 'v2-cta-banner', props: { heading: 'Projenizi Konuşalım', buttonText: 'İletişim', buttonLink: '/contact', backgroundColor: '#ec4899' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Agency', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1920px' }, metadata: { tags: ['agency', 'portfolio'] } },
  { name: 'Startup Landing', description: 'Startup tanıtım sayfası', category: 'Landing Page', isFeatured: false, designSystem: { colors: { primary: '#10b981' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-with-image', props: { title: 'Geleceğin Teknolojisi', subtitle: 'Yenilikçi çözümler', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'features', type: 'v2-feature-grid', props: { heading: 'Özellikler', columns: 3 } }, { id: 'stats', type: 'v2-stats-grid', props: { heading: 'Rakamlarla', stats: [{ value: '1M', label: 'Kullanıcı' }], columns: 4 } }, { id: 'cta', type: 'v2-cta-banner', props: { heading: 'Yatırımcı mısınız?', buttonText: 'İletişim', buttonLink: '/investors', backgroundColor: '#10b981' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Startup', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1280px' }, metadata: { tags: ['startup', 'landing'] } },
  { name: 'E-commerce Store', description: 'E-ticaret mağaza sayfası', category: 'E-commerce', isFeatured: false, designSystem: { colors: { primary: '#f59e0b' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-with-image', props: { title: 'Yeni Koleksiyon', subtitle: 'Özel fırsatlar', ctaText: 'Alışverişe Başla', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'features', type: 'v2-feature-grid', props: { heading: 'Kategoriler', columns: 4 } }, { id: 'testimonials', type: 'v2-testimonials', props: { heading: 'Müşteri Yorumları' } }, { id: 'newsletter', type: 'v2-newsletter', props: { heading: 'İndirimlerden Haberdar Olun', variant: 'inline' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Store', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1440px' }, metadata: { tags: ['ecommerce', 'store'] } },
  { name: 'Real Estate', description: 'Gayrimenkul sayfası', category: 'Business', isFeatured: false, designSystem: { colors: { primary: '#0891b2' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-with-image', props: { title: 'Hayalinizdeki Ev', subtitle: 'Premium gayrimenkul', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'features', type: 'v2-feature-grid', props: { heading: 'Neden Biz?', columns: 3 } }, { id: 'gallery', type: 'v2-gallery', props: { heading: 'Projelerimiz', columns: 3 } }, { id: 'contact', type: 'v2-contact-form', props: { heading: 'İletişim', showContactInfo: true } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Real Estate', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1440px' }, metadata: { tags: ['realestate', 'property'] } },
  { name: 'Restaurant', description: 'Restoran sayfası', category: 'Business', isFeatured: false, designSystem: { colors: { primary: '#dc2626' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-with-image', props: { title: 'Lezzet Durağı', subtitle: 'Gurme mutfak', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'features', type: 'v2-feature-grid', props: { heading: 'Menümüz', columns: 3 } }, { id: 'gallery', type: 'v2-gallery', props: { heading: 'Atmosferimiz', columns: 3 } }, { id: 'testimonials', type: 'v2-testimonials', props: { heading: 'Yorumlar' } }, { id: 'contact', type: 'v2-contact-form', props: { heading: 'Rezervasyon' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Restaurant', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1280px' }, metadata: { tags: ['restaurant', 'food'] } },
  { name: 'Fitness Studio', description: 'Fitness stüdyo sayfası', category: 'Business', isFeatured: false, designSystem: { colors: { primary: '#7c3aed' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-simple', props: { title: 'Enerjini Keşfet', subtitle: 'Profesyonel antrenörler', ctaText: 'Üye Ol', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'features', type: 'v2-feature-grid', props: { heading: 'Programlarımız', columns: 3 } }, { id: 'pricing', type: 'v2-pricing', props: { heading: 'Üyelik Paketleri' } }, { id: 'team', type: 'v2-team-grid', props: { heading: 'Antrenörlerimiz', columns: 4 } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Fitness', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1280px' }, metadata: { tags: ['fitness', 'gym'] } },
  { name: 'Medical Clinic', description: 'Klinik/hastane sayfası', category: 'Business', isFeatured: false, designSystem: { colors: { primary: '#0ea5e9' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-with-image', props: { title: 'Sağlığınız Önceliğimiz', subtitle: 'Uzman kadro', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'features', type: 'v2-feature-grid', props: { heading: 'Hizmetlerimiz', columns: 4 } }, { id: 'team', type: 'v2-team-grid', props: { heading: 'Doktorlarımız', columns: 3 } }, { id: 'faq', type: 'v2-faq', props: { heading: 'Sık Sorulan Sorular' } }, { id: 'contact', type: 'v2-contact-form', props: { heading: 'Randevu Al' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Clinic', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1280px' }, metadata: { tags: ['medical', 'health'] } },
  { name: 'Law Firm', description: 'Hukuk bürosu sayfası', category: 'Business', isFeatured: false, designSystem: { colors: { primary: '#1e3a5f' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-simple', props: { title: 'Hukuki Danışmanlık', subtitle: 'Deneyimli avukatlar', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'features', type: 'v2-feature-grid', props: { heading: 'Uzmanlık Alanlarımız', columns: 3 } }, { id: 'team', type: 'v2-team-grid', props: { heading: 'Avukatlarımız', columns: 3 } }, { id: 'testimonials', type: 'v2-testimonials', props: { heading: 'Müvekkil Yorumları' } }, { id: 'contact', type: 'v2-contact-form', props: { heading: 'Danışmanlık Talep Et' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Law Firm', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1280px' }, metadata: { tags: ['law', 'legal'] } },
  { name: 'Consulting Firm', description: 'Danışmanlık şirketi sayfası', category: 'Business', isFeatured: false, designSystem: { colors: { primary: '#0d9488' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-with-image', props: { title: 'Stratejik Danışmanlık', subtitle: 'İş büyütme uzmanları', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'stats', type: 'v2-stats-grid', props: { heading: 'Başarılarımız', stats: [{ value: '500', label: 'Proje' }], columns: 4 } }, { id: 'features', type: 'v2-feature-grid', props: { heading: 'Hizmetlerimiz', columns: 3 } }, { id: 'testimonials', type: 'v2-testimonials', props: { heading: 'Müşteri Yorumları' } }, { id: 'cta', type: 'v2-cta-banner', props: { heading: 'Ücretsiz Danışmanlık', buttonText: 'Randevu Al', backgroundColor: '#0d9488' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Consulting', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1280px' }, metadata: { tags: ['consulting', 'business'] } },
  { name: 'Non-Profit', description: 'Sivil toplum kuruluşu sayfası', category: 'Non-Profit', isFeatured: false, designSystem: { colors: { primary: '#22c55e' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-simple', props: { title: 'Birlikte Değiştirelim', subtitle: 'Toplumsal fayda', ctaText: 'Bağış Yap', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'stats', type: 'v2-stats-grid', props: { heading: 'Etkimiz', stats: [{ value: '10K', label: 'Hayat' }], columns: 3 } }, { id: 'features', type: 'v2-feature-grid', props: { heading: 'Projelerimiz', columns: 3 } }, { id: 'team', type: 'v2-team-grid', props: { heading: 'Ekibimiz', columns: 4 } }, { id: 'newsletter', type: 'v2-newsletter', props: { heading: 'Bültenimize Abone Olun', variant: 'card' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Foundation', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1280px' }, metadata: { tags: ['nonprofit', 'charity'] } },
  { name: 'Photography', description: 'Fotoğrafçı portfolyo sayfası', category: 'Portfolio', isFeatured: false, designSystem: { colors: { primary: '#a855f7' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-simple', props: { title: 'Anları Yakalıyorum', subtitle: 'Profesyonel fotoğrafçılık', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'gallery', type: 'v2-gallery', props: { heading: 'Portfolyom', columns: 3 } }, { id: 'pricing', type: 'v2-pricing', props: { heading: 'Paketler' } }, { id: 'testimonials', type: 'v2-testimonials', props: { heading: 'Müşteri Yorumları' } }, { id: 'contact', type: 'v2-contact-form', props: { heading: 'İletişim' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Photography', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1920px' }, metadata: { tags: ['photography', 'portfolio'] } },
  { name: 'Architecture Firm', description: 'Mimarlık ofisi sayfası', category: 'Portfolio', isFeatured: false, designSystem: { colors: { primary: '#334155' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-with-image', props: { title: 'Mimari Vizyonlar', subtitle: 'Modern tasarım', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'gallery', type: 'v2-gallery', props: { heading: 'Projelerimiz', columns: 3 } }, { id: 'features', type: 'v2-feature-grid', props: { heading: 'Hizmetlerimiz', columns: 3 } }, { id: 'team', type: 'v2-team-grid', props: { heading: 'Mimarlarımız', columns: 3 } }, { id: 'contact', type: 'v2-contact-form', props: { heading: 'İletişim' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Architecture', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1440px' }, metadata: { tags: ['architecture', 'design'] } },
  { name: 'Hotel & Resort', description: 'Otel/tatil köyü sayfası', category: 'Travel', isFeatured: false, designSystem: { colors: { primary: '#b45309' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-with-image', props: { title: 'Lüks Konaklama', subtitle: 'Huzurun adresi', ctaText: 'Rezervasyon', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'features', type: 'v2-feature-grid', props: { heading: 'Tesislerimiz', columns: 4 } }, { id: 'gallery', type: 'v2-gallery', props: { heading: 'Galeri', columns: 3 } }, { id: 'pricing', type: 'v2-pricing', props: { heading: 'Oda Tipleri' } }, { id: 'testimonials', type: 'v2-testimonials', props: { heading: 'Misafir Yorumları' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Hotel', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1440px' }, metadata: { tags: ['hotel', 'travel'] } },
  { name: 'Online Course', description: 'Online kurs satış sayfası', category: 'Education', isFeatured: false, designSystem: { colors: { primary: '#8b5cf6' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-simple', props: { title: 'Uzmanlaş, Başar', subtitle: 'Online eğitim programları', ctaText: 'Hemen Katıl', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'features', type: 'v2-feature-grid', props: { heading: 'Kurs İçeriği', columns: 3 } }, { id: 'stats', type: 'v2-stats-grid', props: { stats: [{ value: '5K', label: 'Mezun' }], columns: 3 } }, { id: 'testimonials', type: 'v2-testimonials', props: { heading: 'Öğrenci Yorumları' } }, { id: 'pricing', type: 'v2-pricing', props: { heading: 'Paketler' } }, { id: 'faq', type: 'v2-faq', props: { heading: 'SSS' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Course', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1280px' }, metadata: { tags: ['course', 'education'] } },
  { name: 'Webinar', description: 'Webinar kayıt sayfası', category: 'Event', isFeatured: false, designSystem: { colors: { primary: '#ea580c' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-simple', props: { title: 'Ücretsiz Webinar', subtitle: 'Sektör uzmanlarından öğrenin', ctaText: 'Kayıt Ol', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'features', type: 'v2-feature-grid', props: { heading: 'Ne Öğreneceksiniz?', columns: 3 } }, { id: 'team', type: 'v2-team-grid', props: { heading: 'Konuşmacılar', columns: 3 } }, { id: 'contact', type: 'v2-contact-form', props: { heading: 'Kayıt Formu', submitButtonText: 'Kayıt Ol' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Webinar', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1280px' }, metadata: { tags: ['webinar', 'event'] } },
  { name: 'App Landing', description: 'Mobil uygulama tanıtım sayfası', category: 'Landing Page', isFeatured: false, designSystem: { colors: { primary: '#06b6d4' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-with-image', props: { title: 'Hayatı Kolaylaştır', subtitle: 'App Store & Play Store', ctaText: 'İndir', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'features', type: 'v2-feature-grid', props: { heading: 'Özellikler', columns: 3 } }, { id: 'gallery', type: 'v2-gallery', props: { heading: 'Ekran Görüntüleri', columns: 4 } }, { id: 'stats', type: 'v2-stats-grid', props: { stats: [{ value: '1M', label: 'İndirme' }], columns: 3 } }, { id: 'testimonials', type: 'v2-testimonials', props: { heading: 'Kullanıcı Yorumları' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'App', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1280px' }, metadata: { tags: ['app', 'mobile'] } },
  { name: 'Personal Brand', description: 'Kişisel marka sayfası', category: 'Portfolio', isFeatured: false, designSystem: { colors: { primary: '#f43f5e' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-simple', props: { title: 'Merhaba, Ben Ahmet', subtitle: 'Dijital pazarlama uzmanı', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'content', type: 'v2-content-split', props: { heading: 'Hakkımda', content: 'Deneyimli profesyonel' } }, { id: 'features', type: 'v2-feature-grid', props: { heading: 'Hizmetlerim', columns: 3 } }, { id: 'testimonials', type: 'v2-testimonials', props: { heading: 'Referanslar' } }, { id: 'newsletter', type: 'v2-newsletter', props: { heading: 'Bültenimi Takip Et', variant: 'inline' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Personal', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1280px' }, metadata: { tags: ['personal', 'brand'] } },
  { name: 'Newsletter Landing', description: 'Newsletter abonelik sayfası', category: 'Landing Page', isFeatured: false, designSystem: { colors: { primary: '#84cc16' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-simple', props: { title: 'Haftalık Bülten', subtitle: 'En güncel içerikler', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'features', type: 'v2-feature-grid', props: { heading: 'Neler Alacaksınız?', columns: 3 } }, { id: 'testimonials', type: 'v2-testimonials', props: { heading: 'Abone Yorumları' } }, { id: 'newsletter', type: 'v2-newsletter', props: { heading: 'Şimdi Abone Olun', variant: 'card' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Newsletter', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '800px' }, metadata: { tags: ['newsletter', 'subscription'] } },
  { name: 'Case Study', description: 'Vaka çalışması sayfası', category: 'Content', isFeatured: false, designSystem: { colors: { primary: '#0369a1' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-simple', props: { title: 'Başarı Hikayesi', subtitle: 'Müşteri X ile çalışmamız', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'content', type: 'v2-content-text', props: { heading: 'Özet', content: '<p>Proje başarıyla tamamlandı...</p>' } }, { id: 'stats', type: 'v2-stats-grid', props: { heading: 'Sonuçlar', stats: [{ value: '200', label: 'Artış', suffix: '%' }], columns: 3 } }, { id: 'content2', type: 'v2-content-split', props: { heading: 'Süreç', content: 'Adım adım çözüm' } }, { id: 'cta', type: 'v2-cta-banner', props: { heading: 'Sizin için de yapabiliriz', buttonText: 'İletişim', backgroundColor: '#0369a1' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Case Study', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '1000px' }, metadata: { tags: ['casestudy', 'content'] } },
  { name: 'Coming Soon', description: 'Yakında gelecek sayfası', category: 'Landing Page', isFeatured: false, designSystem: { colors: { primary: '#6366f1' }, supportedContexts: ['public'] }, blocks: [{ id: 'hero', type: 'v2-hero-simple', props: { title: 'Yakında Geliyor', subtitle: 'Yeni bir şeyler hazırlıyoruz', backgroundColor: '#0f172a', textColor: '#ffffff' } }, { id: 'newsletter', type: 'v2-newsletter', props: { heading: 'Haberdar Olun', subheading: 'Lansman tarihini kaçırmayın', variant: 'card' } }, { id: 'footer', type: 'v2-footer', props: { logoText: 'Soon', copyright: '© 2024', backgroundColor: '#0f172a', textColor: '#ffffff' } }], layoutOptions: { maxWidth: '800px' }, metadata: { tags: ['comingsoon', 'launch'] } },
];

export default templatesData;


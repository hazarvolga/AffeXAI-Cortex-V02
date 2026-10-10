import { DataSource } from 'typeorm';
import { Page } from '../../../modules/cms/entities/page.entity';
import { Component } from '../../../modules/cms/entities/component.entity';
import { PageStatus } from '@affexai/shared-types';

interface PageDefinition {
  title: string;
  slug: string;
  description: string;
  components: any[];
}

export async function seedMigratedPublicPages(dataSource: DataSource) {
  console.log('📄 Migrating backed-up public pages to CMS...');

  const pageRepository = dataSource.getRepository(Page);
  const componentRepository = dataSource.getRepository(Component);

  // Check if pages already exist
  const existingCount = await pageRepository.count({
    where: [
      { slug: 'home' },
      { slug: 'contact' },
      { slug: 'products' },
    ],
  });

  if (existingCount > 0) {
    console.log('⚠️  Some public pages already exist, skipping migration...');
    return;
  }

  const pages: PageDefinition[] = [
    // Homepage - Migrated from (public-backup) with preserved CSS/typography
    // User emphasized typography as "stable and balanced" (kararlı ve dengeli)
    {
      title: 'Ana Sayfa',
      slug: 'home',
      description: 'Affexai ana sayfası - İnşaat ve AEC sektörü için yapay zeka destekli çözümler',
      components: [
        // 1. Hero Section (HeroCarousel component replacement)
        {
          type: 'block',
          props: {
            blockId: 'hero-with-image-and-text-overlay',
            title: 'BIM ile Geleceği İnşa Edin',
            subtitle: 'Allplan ile Türkiye\'de yapı tasarımında yeni bir dönem',
            backgroundImageUrl: 'https://picsum.photos/seed/hero-main/1920/1080',
            ctaText: 'Ürünlerimizi Keşfedin',
            ctaLink: '/products',
            // Typography preservation
            titleVariant: 'heading1',
            titleAlign: 'center',
            titleColor: 'primary',
            titleWeight: 'bold',
            subtitleVariant: 'heading3',
            subtitleAlign: 'center',
            subtitleColor: 'muted',
            // Custom CSS classes from original: "font-headline"
            cssClasses: 'font-headline',
          },
          orderIndex: 0,
        },
        // 2. Certificate Verification
        {
          type: 'block',
          props: {
            blockId: 'content-with-call-to-action',
            title: 'Sertifika Doğrulama',
            content: 'Aldığınız eğitim sertifikasını hemen doğrulayın',
            ctaText: 'Sertifika Doğrula',
            ctaLink: '/certificates/verify',
            // Preserve background styling
            cssClasses: 'bg-secondary/10 py-12',
          },
          orderIndex: 1,
        },
        // 3. Solutions Carousel
        {
          type: 'block',
          props: {
            blockId: 'content-section-with-title',
            title: 'Çözümlerimiz',
            subtitle: 'Her sektör için özelleştirilmiş BIM çözümleri',
            content: 'Mimarlık, mühendislik ve inşaat sektörlerinde uzmanlaşmış çözümlerimizle projelerinizi başarıya taşıyın.',
            // Typography: Original uses "text-3xl font-bold tracking-tight sm:text-4xl font-headline"
            titleVariant: 'heading2',
            titleAlign: 'center',
            titleColor: 'primary',
            titleWeight: 'bold',
            cssClasses: 'py-16 md:py-24 font-headline',
          },
          orderIndex: 2,
        },
        // 4. Parallax Spacer - Products
        {
          type: 'block',
          props: {
            blockId: 'hero-with-background-image',
            title: 'Ürünlerimizi Keşfedin',
            subtitle: 'İhtiyaçlarınıza özel olarak tasarlanmış, sektör lideri Allplan ve iş ortağı ürünlerini keşfedin.',
            backgroundImageUrl: 'https://picsum.photos/seed/hero-products/1920/1080',
            ctaText: 'Tüm Ürünler',
            ctaLink: '#products',
            overlayOpacity: 0.5,
            // Original classes: "relative py-24 bg-fixed bg-cover bg-center"
            // "text-3xl font-bold tracking-tight sm:text-4xl font-headline"
            titleVariant: 'heading2',
            titleAlign: 'center',
            titleColor: 'primary',
            titleWeight: 'bold',
            cssClasses: 'py-24 bg-fixed bg-cover bg-center font-headline',
          },
          orderIndex: 3,
        },
        // 5. Products Carousel
        {
          type: 'block',
          props: {
            blockId: 'content-section-with-title',
            title: 'Ürünlerimiz',
            subtitle: 'Allplan yazılım ailesi',
            content: 'Yapı tasarımında ihtiyacınız olan tüm çözümler',
            titleVariant: 'heading2',
            titleAlign: 'center',
            titleColor: 'primary',
            titleWeight: 'bold',
            cssClasses: 'py-16 md:py-24 font-headline',
          },
          orderIndex: 4,
        },
        // 6. Parallax Spacer - Education
        {
          type: 'block',
          props: {
            blockId: 'hero-with-background-image',
            title: 'Bilginizi Genişletin',
            subtitle: 'Bilgi birikiminizi artırın, kaynaklarımıza erişin ve ihtiyacınız olan desteği alın.',
            backgroundImageUrl: 'https://picsum.photos/seed/hero-success/1920/1080',
            ctaText: 'Eğitim & Destek',
            ctaLink: '#education',
            overlayOpacity: 0.5,
            titleVariant: 'heading2',
            titleAlign: 'center',
            titleColor: 'primary',
            titleWeight: 'bold',
            cssClasses: 'py-24 bg-fixed bg-cover bg-center font-headline',
          },
          orderIndex: 5,
        },
        // 7. Education & Support
        {
          type: 'block',
          props: {
            blockId: 'content-section-with-title',
            title: 'Eğitim ve Destek',
            subtitle: 'Yetkinliğinizi artırın',
            content: 'Uzman eğitmenlerimizle Allplan yazılımlarında profesyonel eğitimler ve sertifika programları',
            titleVariant: 'heading2',
            titleAlign: 'center',
            titleColor: 'primary',
            titleWeight: 'bold',
            cssClasses: 'py-16 md:py-24 font-headline',
          },
          orderIndex: 6,
        },
        // 8. Parallax Spacer - Resources
        {
          type: 'block',
          props: {
            blockId: 'hero-with-background-image',
            title: 'Kaynak Merkezimiz',
            subtitle: 'Sektördeki bilgiyi keşfedin, becerilerinizi geliştirin ve projelerinizi ileriye taşıyın.',
            backgroundImageUrl: 'https://picsum.photos/seed/hero-civil/1920/1080',
            ctaText: 'Tüm Kaynaklar',
            ctaLink: '#resources',
            overlayOpacity: 0.5,
            titleVariant: 'heading2',
            titleAlign: 'center',
            titleColor: 'primary',
            titleWeight: 'bold',
            cssClasses: 'py-24 bg-fixed bg-cover bg-center font-headline',
          },
          orderIndex: 7,
        },
        // 9. Resources Section
        {
          type: 'block',
          props: {
            blockId: 'content-section-with-title',
            title: 'Kaynaklar',
            subtitle: 'Bilgi merkeziniz',
            content: 'Teknik dökümanlar, örnek projeler, videolar ve daha fazlası',
            titleVariant: 'heading2',
            titleAlign: 'center',
            titleColor: 'primary',
            titleWeight: 'bold',
            cssClasses: 'py-16 md:py-24 font-headline',
          },
          orderIndex: 8,
        },
        // 10. Why Aluplan (Two-column with image)
        {
          type: 'block',
          props: {
            blockId: 'content-with-image-two-column',
            title: 'Neden Aluplan Digital?',
            content: 'Sektördeki 20 yılı aşkın tecrübemizle, projenizin her aşamasında yanınızdayız.',
            imageUrl: 'https://picsum.photos/seed/why-aluplan/800/600',
            imagePosition: 'left',
            items: [
              {
                title: 'Uzman Kadro',
                description: 'Allplan ve endüstri standartları konusunda derin bilgiye sahip uzman ekibimizle destek.',
              },
              {
                title: 'Entegre Çözümler',
                description: 'Tasarım, mühendislik ve inşaatı birleştiren bütünsel bir yaklaşım.',
              },
              {
                title: 'Sürekli Eğitim',
                description: 'Webinarlar, sertifika programları ve özel eğitimlerle yetkinliğinizi artırın.',
              }
            ],
            // Original: "bg-secondary py-16 md:py-24"
            // Title: "text-3xl font-bold tracking-tight sm:text-4xl font-headline"
            titleVariant: 'heading2',
            titleAlign: 'left',
            titleColor: 'primary',
            titleWeight: 'bold',
            cssClasses: 'bg-secondary py-16 md:py-24 font-headline',
          },
          orderIndex: 9,
        },
        // 11. Workflow Section
        {
          type: 'block',
          props: {
            blockId: 'content-section-with-title',
            title: 'İş Akışı',
            subtitle: 'Entegre iş akışlarımızla projelerinizi nasıl bir üst seviyeye taşıdığımızı keşfedin',
            content: 'BIM projelerinizi dört ana aşamada yönetin: Tasarım, Analiz, İnşaat ve Yönetim',
            titleVariant: 'heading2',
            titleAlign: 'center',
            titleColor: 'primary',
            titleWeight: 'bold',
            cssClasses: 'py-16 md:py-24 font-headline',
          },
          orderIndex: 10,
        },
        // 12. Newsletter Section
        {
          type: 'block',
          props: {
            blockId: 'newsletter-signup-form',
            title: 'Haberdar Olun',
            subtitle: 'BIM dünyasındaki gelişmelerden haberdar olmak için bültenimize abone olun',
            placeholderText: 'E-posta adresiniz',
            buttonText: 'Abone Ol',
            titleVariant: 'heading2',
            titleAlign: 'center',
            titleColor: 'primary',
            titleWeight: 'bold',
            cssClasses: 'bg-primary/5 py-16 font-headline',
          },
          orderIndex: 11,
        },
      ],
    },

    // Contact Page
    {
      title: 'İletişim',
      slug: 'contact',
      description: 'Bizimle iletişime geçin - Satış, destek ve genel sorularınız için',
      components: [
        {
          type: 'block',
          props: {
            blockId: 'hero-simple',
            title: 'İletişim',
            description: 'Size nasıl yardımcı olabiliriz? Ekibimiz sorularınızı yanıtlamak için burada.',
            bgColor: 'bg-gradient-to-r from-primary/10 to-primary/5',
          },
          orderIndex: 0,
        },
        {
          type: 'block',
          props: {
            blockId: 'contact-form',
            formFields: ['name', 'email', 'phone', 'subject', 'message'],
          },
          orderIndex: 1,
        },
      ],
    },

    // Products Main
    {
      title: 'Ürünler',
      slug: 'products',
      description: 'Allplan AEC ürün portföyü - Yapı tasarımından altyapıya kadar kapsamlı çözümler',
      components: [
        {
          type: 'block',
          props: {
            blockId: 'hero-simple',
            title: 'Ürünlerimiz',
            description: 'İnşaat sektörünün her alanı için güçlü BIM çözümleri',
          },
          orderIndex: 0,
        },
        {
          type: 'block',
          props: {
            blockId: 'product-grid',
            products: [
              { title: 'Allplan', description: 'Kapsamlı BIM çözümü', link: '/products/allplan' },
              { title: 'Yapı & Altyapı', description: 'Yapısal tasarım araçları', link: '/products/building-infrastructure' },
              { title: 'İşbirliği', description: 'Proje işbirliği platformları', link: '/products/collaboration' },
              { title: 'İnşaat Planlama', description: 'İnşaat yönetimi araçları', link: '/products/construction-planning' },
            ],
          },
          orderIndex: 1,
        },
      ],
    },

    // Allplan Product Line
    {
      title: 'Allplan',
      slug: 'products/allplan',
      description: 'Allplan BIM yazılımı - Mimari tasarım, yapısal mühendislik ve prefabrik için çözümler',
      components: [
        {
          type: 'block',
          props: {
            blockId: 'hero-product',
            title: 'Allplan',
            subtitle: 'Kapsamlı BIM Çözümü',
            description: 'Mimari tasarımdan yapısal analize kadar tüm süreçleriniz için güçlü BIM yazılımı',
          },
          orderIndex: 0,
        },
        {
          type: 'block',
          props: {
            blockId: 'product-variants-grid',
            products: [
              { name: 'Allplan Architecture', slug: 'products/allplan/professional', description: 'Mimari tasarım için profesyonel çözüm' },
              { name: 'Allplan Engineering', slug: 'products/allplan/ultimate', description: 'Yapısal mühendislik çözümü' },
              { name: 'Allplan Basic', slug: 'products/allplan/basic', description: 'Başlangıç seviyesi BIM çözümü' },
              { name: 'Allplan Concept', slug: 'products/allplan/concept', description: 'Konsept tasarım aracı' },
              { name: 'Allplan Civil', slug: 'products/allplan/civil', description: 'Altyapı projeleri için çözüm' },
              { name: 'Allplan Precast', slug: 'products/allplan/precast', description: 'Prefabrik eleman tasarımı' },
            ],
          },
          orderIndex: 1,
        },
      ],
    },

    // Allplan Professional
    {
      title: 'Allplan Architecture',
      slug: 'products/allplan/professional',
      description: 'Allplan Architecture - Mimari tasarım için profesyonel BIM çözümü',
      components: [
        {
          type: 'block',
          props: {
            blockId: 'hero-product',
            title: 'Allplan Architecture',
            subtitle: 'Profesyonel Mimari BIM',
            description: 'Mimari tasarımın her aşaması için eksiksiz araçlar',
          },
          orderIndex: 0,
        },
        {
          type: 'block',
          props: {
            blockId: 'feature-list',
            features: [
              { title: '3D Modelleme', description: 'Gelişmiş 3D tasarım araçları', icon: 'Box' },
              { title: 'BIM İşbirliği', description: 'IFC tabanlı veri değişimi', icon: 'Users' },
              { title: 'Görselleştirme', description: 'Fotorealistik renderlar', icon: 'Eye' },
              { title: 'Dokümantasyon', description: 'Otomatik plan ve kesitler', icon: 'FileText' },
            ],
          },
          orderIndex: 1,
        },
      ],
    },

    // Solutions Main
    {
      title: 'Çözümler',
      slug: 'solutions',
      description: 'Sektöre özel BIM çözümleri - Yapı tasarımı, altyapı, işbirliği ve inşaat yönetimi',
      components: [
        {
          type: 'block',
          props: {
            blockId: 'hero-simple',
            title: 'Çözümlerimiz',
            description: 'İnşaat sektörünün her alanı için özelleştirilmiş BIM çözümleri',
          },
          orderIndex: 0,
        },
        {
          type: 'block',
          props: {
            blockId: 'solution-categories',
            categories: [
              { title: 'Yapı Tasarımı', slug: 'solutions/building-design', icon: 'Building' },
              { title: 'Altyapı Tasarımı', slug: 'solutions/infrastructure-design', icon: 'Route' },
              { title: 'İşbirliği', slug: 'solutions/collaboration', icon: 'Users' },
              { title: 'İnşaat Planlama', slug: 'solutions/construction-planning', icon: 'Calendar' },
              { title: 'Eklenti Modüller', slug: 'solutions/add-on-modules', icon: 'Puzzle' },
            ],
          },
          orderIndex: 1,
        },
      ],
    },

    // Education Main
    {
      title: 'Eğitim',
      slug: 'education',
      description: 'Allplan eğitim programları - Sertifikasyon ve uzmanlık eğitimleri',
      components: [
        {
          type: 'block',
          props: {
            blockId: 'hero-simple',
            title: 'Eğitim & Sertifikasyon',
            description: 'Allplan uzmanlığınızı geliştirin ve sertifika kazanın',
          },
          orderIndex: 0,
        },
        {
          type: 'block',
          props: {
            blockId: 'education-multi-layout',
            sections: [
              { title: 'Eğitimler', link: '/education/training', icon: 'GraduationCap' },
              { title: 'Sertifikasyon', link: '/education/certification', icon: 'Award' },
            ],
          },
          orderIndex: 1,
        },
      ],
    },

    // Training
    {
      title: 'Eğitimler',
      slug: 'education/training',
      description: 'Allplan eğitim programları - Temel, orta ve ileri seviye eğitimler',
      components: [
        {
          type: 'block',
          props: {
            blockId: 'hero-simple',
            title: 'Allplan Eğitimleri',
            description: 'Uzman eğitmenlerden kapsamlı BIM eğitimi',
          },
          orderIndex: 0,
        },
        {
          type: 'block',
          props: {
            blockId: 'training-courses',
            levels: ['Temel', 'Orta', 'İleri'],
          },
          orderIndex: 1,
        },
      ],
    },

    // Certification
    {
      title: 'Sertifikasyon',
      slug: 'education/certification',
      description: 'Allplan sertifikasyon programı - Uzmanlığınızı belgeleyin',
      components: [
        {
          type: 'block',
          props: {
            blockId: 'hero-simple',
            title: 'Allplan Sertifikasyon',
            description: 'Uluslararası geçerliliğe sahip Allplan sertifikaları',
          },
          orderIndex: 0,
        },
        {
          type: 'block',
          props: {
            blockId: 'certification-levels',
            certifications: [
              { level: 'Certified User', description: 'Temel kullanıcı sertifikası' },
              { level: 'Certified Professional', description: 'Profesyonel kullanıcı sertifikası' },
              { level: 'Certified Expert', description: 'Uzman kullanıcı sertifikası' },
            ],
          },
          orderIndex: 1,
        },
      ],
    },

    // Downloads
    {
      title: 'İndirmeler',
      slug: 'downloads',
      description: 'Allplan yazılımları, güncellemeler ve dokümanlar',
      components: [
        {
          type: 'block',
          props: {
            blockId: 'hero-simple',
            title: 'İndirmeler',
            description: 'Yazılımlar, güncellemeler ve teknik dokümanlar',
          },
          orderIndex: 0,
        },
        {
          type: 'block',
          props: {
            blockId: 'download-categories',
            categories: [
              { title: 'Yazılımlar', icon: 'Download' },
              { title: 'Güncellemeler', icon: 'RefreshCw' },
              { title: 'Dokümanlar', icon: 'FileText' },
              { title: 'Örnekler', icon: 'FolderOpen' },
            ],
          },
          orderIndex: 1,
        },
      ],
    },

    // Privacy Policy
    {
      title: 'Gizlilik Politikası',
      slug: 'privacy',
      description: 'Affexai gizlilik politikası ve kişisel veri koruma',
      components: [
        {
          type: 'block',
          props: {
            blockId: 'hero-simple',
            title: 'Gizlilik Politikası',
            description: 'Kişisel verilerinizin korunması bizim önceliğimizdir',
          },
          orderIndex: 0,
        },
        {
          type: 'block',
          props: {
            blockId: 'legal-content',
            content: `
              <h2>Giriş</h2>
              <p>Bu Gizlilik Politikası, Affexai olarak kişisel verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklamaktadır.</p>

              <h2>Toplanan Veriler</h2>
              <ul>
                <li>İletişim bilgileri (ad, e-posta, telefon)</li>
                <li>Kullanım verileri (site etkileşimleri)</li>
                <li>Teknik veriler (IP adresi, tarayıcı bilgisi)</li>
              </ul>

              <h2>Verilerin Kullanımı</h2>
              <p>Toplanan veriler, hizmet kalitesini artırmak, destek sağlamak ve yasal yükümlülükleri yerine getirmek için kullanılır.</p>

              <h2>Veri Güvenliği</h2>
              <p>Verileriniz endüstri standardı güvenlik önlemleri ile korunmaktadır.</p>
            `,
          },
          orderIndex: 1,
        },
      ],
    },

    // Terms of Service
    {
      title: 'Kullanım Koşulları',
      slug: 'terms',
      description: 'Affexai kullanım koşulları ve hizmet şartları',
      components: [
        {
          type: 'block',
          props: {
            blockId: 'hero-simple',
            title: 'Kullanım Koşulları',
            description: 'Affexai platformunu kullanırken geçerli olan şartlar',
          },
          orderIndex: 0,
        },
        {
          type: 'block',
          props: {
            blockId: 'legal-content',
            content: `
              <h2>Kabul</h2>
              <p>Bu platformu kullanarak aşağıdaki kullanım koşullarını kabul etmiş sayılırsınız.</p>

              <h2>Hizmetler</h2>
              <p>Affexai, BIM yazılımları ve destek hizmetleri sunar. Hizmetlerimiz değişiklik gösterebilir.</p>

              <h2>Kullanıcı Sorumlulukları</h2>
              <ul>
                <li>Doğru bilgi sağlamak</li>
                <li>Hesap güvenliğini korumak</li>
                <li>Hizmetleri uygun şekilde kullanmak</li>
              </ul>

              <h2>Fikri Mülkiyet</h2>
              <p>Tüm içerik ve yazılımlar telif hakkı ile korunmaktadır.</p>
            `,
          },
          orderIndex: 1,
        },
      ],
    },

    // Case Studies
    {
      title: 'Başarı Hikayeleri',
      slug: 'case-studies',
      description: 'Allplan ile gerçekleştirilen başarılı projeler',
      components: [
        {
          type: 'block',
          props: {
            blockId: 'hero-simple',
            title: 'Başarı Hikayeleri',
            description: 'Müşterilerimizin Allplan ile gerçekleştirdiği başarılı projeler',
          },
          orderIndex: 0,
        },
        {
          type: 'block',
          props: {
            blockId: 'case-study-grid',
            studies: [
              {
                title: 'İstanbul Havalimanı',
                category: 'Altyapı',
                description: 'Dünyanın en büyük havalimanı projelerinden birinde Allplan kullanımı',
              },
              {
                title: 'Yapı Kredi Plaza',
                category: 'Ticari Yapı',
                description: 'Modern ofis kompleksinin BIM ile tasarımı',
              },
            ],
          },
          orderIndex: 1,
        },
      ],
    },
  ];

  // Create pages
  let createdCount = 0;
  for (const pageData of pages) {
    const { components: pageComponents, ...pageInfo } = pageData;

    // Create page
    const page = pageRepository.create({
      ...pageInfo,
      status: PageStatus.PUBLISHED,
      publishedAt: new Date(),
      layoutOptions: {
        showHeader: true,
        showFooter: true,
      },
    });

    await pageRepository.save(page);

    // Create components
    for (const compData of pageComponents) {
      const component = componentRepository.create({
        pageId: page.id,
        type: compData.type,
        props: compData.props,
        orderIndex: compData.orderIndex,
        parentId: null,
      });

      await componentRepository.save(component);
    }

    createdCount++;
    console.log(`✅ Created page: ${page.title} (${page.slug})`);
  }

  console.log(`🎉 Successfully migrated ${createdCount} public pages to CMS!`);
}

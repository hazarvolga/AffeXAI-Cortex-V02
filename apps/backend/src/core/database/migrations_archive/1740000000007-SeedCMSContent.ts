import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Complete CMS Content Seeding Migration
 *
 * This migration seeds essential CMS content for production:
 * - Homepage with hero section
 * - Main navigation menu
 * - Key pages (Support, Contact, About, Products, Solutions, Education)
 * - Ticket categories with hierarchy
 *
 * IMPORTANT: This migration is designed to be:
 * - Idempotent: Can be run multiple times safely
 * - Production-safe: Uses ON CONFLICT DO NOTHING
 * - Rollback-capable: Includes down() method
 * - Environment-aware: Works in dev and production
 */
export class SeedCMSContent1740000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get admin user ID for created_by/updated_by fields
    const adminUser = await queryRunner.query(`
      SELECT id FROM users WHERE email = 'admin@affexai.com' LIMIT 1;
    `);

    if (!adminUser || adminUser.length === 0) {
      console.log('⚠️  Warning: Admin user not found. Skipping CMS seeding.');
      return;
    }

    const adminUserId = adminUser[0].id;

    console.log('📄 Seeding CMS content...');

    // ============================================
    // 1. SEED TICKET CATEGORIES (7 categories)
    // ============================================
    await queryRunner.query(`
      INSERT INTO ticket_categories (
        id,
        name,
        description,
        "parentCategoryId",
        "is_active",
        "created_at",
        "updated_at"
      ) VALUES
        -- Parent: Teknik (Technical)
        (
          gen_random_uuid(),
          'Teknik',
          'Teknik destek konuları',
          NULL,
          true,
          NOW(),
          NOW()
        ),
        -- Parent: Lisanslama (Licensing)
        (
          gen_random_uuid(),
          'Lisanslama',
          'Lisans ve aktivasyon konuları',
          NULL,
          true,
          NOW(),
          NOW()
        ),
        -- Parent: Faturalama (Billing)
        (
          gen_random_uuid(),
          'Faturalama',
          'Fatura ve ödeme konuları',
          NULL,
          true,
          NOW(),
          NOW()
        ),
        -- Parent: Genel (General)
        (
          gen_random_uuid(),
          'Genel',
          'Genel sorular ve talepler',
          NULL,
          true,
          NOW(),
          NOW()
        ),
        -- Parent: Özellik Talebi (Feature Request)
        (
          gen_random_uuid(),
          'Özellik Talebi',
          'Yeni özellik ve iyileştirme talepleri',
          NULL,
          true,
          NOW(),
          NOW()
        )
      ON CONFLICT (name) DO NOTHING;
    `);

    // Add subcategories for Teknik category
    await queryRunner.query(`
      INSERT INTO ticket_categories (
        id,
        name,
        description,
        "parentCategoryId",
        "is_active",
        "created_at",
        "updated_at"
      )
      SELECT
        gen_random_uuid(),
        'Yazılım',
        'Yazılım ile ilgili sorunlar',
        (SELECT id FROM ticket_categories WHERE name = 'Teknik' LIMIT 1),
        true,
        NOW(),
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM ticket_categories WHERE name = 'Yazılım'
      );

      INSERT INTO ticket_categories (
        id,
        name,
        description,
        "parentCategoryId",
        "is_active",
        "created_at",
        "updated_at"
      )
      SELECT
        gen_random_uuid(),
        'Donanım',
        'Donanım ile ilgili sorunlar',
        (SELECT id FROM ticket_categories WHERE name = 'Teknik' LIMIT 1),
        true,
        NOW(),
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM ticket_categories WHERE name = 'Donanım'
      );
    `);

    console.log('✅ Ticket categories seeded (7 categories)');

    // ============================================
    // 2. SEED MAIN NAVIGATION MENU
    // ============================================
    await queryRunner.query(`
      INSERT INTO cms_menus (
        id,
        name,
        slug,
        description,
        "is_active",
        created_at,
        updated_at,
        created_by,
        updated_by
      ) VALUES (
        gen_random_uuid(),
        'Ana Menü',
        'main-menu',
        'Ana sayfa navigasyon menüsü',
        true,
        NOW(),
        NOW(),
        '${adminUserId}',
        '${adminUserId}'
      )
      ON CONFLICT (slug) DO NOTHING;
    `);

    // ============================================
    // 3. SEED MENU ITEMS
    // ============================================
    await queryRunner.query(`
      INSERT INTO cms_menu_items (
        id,
        title,
        url,
        "order",
        "is_active",
        "menuId",
        "parent_id",
        created_at,
        updated_at
      )
      SELECT
        gen_random_uuid(),
        'Ana Sayfa',
        '/',
        1,
        true,
        (SELECT id FROM cms_menus WHERE slug = 'main-menu' LIMIT 1),
        NULL,
        NOW(),
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM cms_menu_items
        WHERE title = 'Ana Sayfa'
        AND "menuId" = (SELECT id FROM cms_menus WHERE slug = 'main-menu' LIMIT 1)
      );

      INSERT INTO cms_menu_items (
        id,
        title,
        url,
        "order",
        "is_active",
        "menuId",
        "parent_id",
        created_at,
        updated_at
      )
      SELECT
        gen_random_uuid(),
        'Ürünler',
        '/products',
        2,
        true,
        (SELECT id FROM cms_menus WHERE slug = 'main-menu' LIMIT 1),
        NULL,
        NOW(),
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM cms_menu_items
        WHERE title = 'Ürünler'
        AND "menuId" = (SELECT id FROM cms_menus WHERE slug = 'main-menu' LIMIT 1)
      );

      INSERT INTO cms_menu_items (
        id,
        title,
        url,
        "order",
        "is_active",
        "menuId",
        "parent_id",
        created_at,
        updated_at
      )
      SELECT
        gen_random_uuid(),
        'Çözümler',
        '/solutions',
        3,
        true,
        (SELECT id FROM cms_menus WHERE slug = 'main-menu' LIMIT 1),
        NULL,
        NOW(),
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM cms_menu_items
        WHERE title = 'Çözümler'
        AND "menuId" = (SELECT id FROM cms_menus WHERE slug = 'main-menu' LIMIT 1)
      );

      INSERT INTO cms_menu_items (
        id,
        title,
        url,
        "order",
        "is_active",
        "menuId",
        "parent_id",
        created_at,
        updated_at
      )
      SELECT
        gen_random_uuid(),
        'Eğitim',
        '/education',
        4,
        true,
        (SELECT id FROM cms_menus WHERE slug = 'main-menu' LIMIT 1),
        NULL,
        NOW(),
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM cms_menu_items
        WHERE title = 'Eğitim'
        AND "menuId" = (SELECT id FROM cms_menus WHERE slug = 'main-menu' LIMIT 1)
      );

      INSERT INTO cms_menu_items (
        id,
        title,
        url,
        "order",
        "is_active",
        "menuId",
        "parent_id",
        created_at,
        updated_at
      )
      SELECT
        gen_random_uuid(),
        'Destek',
        '/support',
        5,
        true,
        (SELECT id FROM cms_menus WHERE slug = 'main-menu' LIMIT 1),
        NULL,
        NOW(),
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM cms_menu_items
        WHERE title = 'Destek'
        AND "menuId" = (SELECT id FROM cms_menus WHERE slug = 'main-menu' LIMIT 1)
      );

      INSERT INTO cms_menu_items (
        id,
        title,
        url,
        "order",
        "is_active",
        "menuId",
        "parent_id",
        created_at,
        updated_at
      )
      SELECT
        gen_random_uuid(),
        'İletişim',
        '/contact',
        6,
        true,
        (SELECT id FROM cms_menus WHERE slug = 'main-menu' LIMIT 1),
        NULL,
        NOW(),
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM cms_menu_items
        WHERE title = 'İletişim'
        AND "menuId" = (SELECT id FROM cms_menus WHERE slug = 'main-menu' LIMIT 1)
      );
    `);

    console.log('✅ Navigation menu seeded (6 items)');

    // ============================================
    // 4. SEED HOMEPAGE
    // ============================================
    const homepageContent = {
      blocks: [
        {
          id: '1',
          type: 'hero-modern',
          category: 'hero-blocks',
          data: {
            title: 'Affexai Platform',
            subtitle: 'AI-Powered Customer Support & Marketing Platform',
            description: 'Müşteri deneyimini üst seviyeye taşıyan, yapay zeka destekli müşteri desteği ve pazarlama platformu',
            primaryCTA: { text: 'Hemen Başlayın', link: '/portal/dashboard' },
            secondaryCTA: { text: 'Daha Fazla Bilgi', link: '/about' }
          }
        },
        {
          id: '2',
          type: 'features-grid',
          category: 'features-blocks',
          data: {
            title: 'Özellikler',
            features: [
              {
                title: 'AI Destekli Destek',
                description: 'Yapay zeka ile güçlendirilmiş müşteri desteği',
                icon: 'bot'
              },
              {
                title: 'Email Marketing',
                description: 'Kapsamlı email kampanya yönetimi',
                icon: 'mail'
              },
              {
                title: 'İçerik Yönetimi',
                description: 'Blok tabanlı CMS sistemi',
                icon: 'file-text'
              },
              {
                title: 'Sertifika Yönetimi',
                description: 'Otomatik sertifika oluşturma ve gönderme',
                icon: 'award'
              },
              {
                title: 'Etkinlik Yönetimi',
                description: 'Eğitim ve etkinlik organizasyonu',
                icon: 'calendar'
              },
              {
                title: 'Analitik',
                description: 'Detaylı raporlama ve analiz',
                icon: 'bar-chart'
              }
            ]
          }
        }
      ]
    };

    await queryRunner.query(`
      INSERT INTO cms_pages (
        id,
        title,
        slug,
        content,
        status,
        "seoTitle",
        "seoDescription",
        "isHomepage",
        created_at,
        updated_at,
        created_by,
        updated_by
      ) VALUES (
        gen_random_uuid(),
        'Ana Sayfa',
        '/',
        '${JSON.stringify(homepageContent).replace(/'/g, "''")}'::jsonb,
        'published',
        'Affexai - AI-Powered Platform',
        'Yapay zeka destekli müşteri desteği ve pazarlama platformu',
        true,
        NOW(),
        NOW(),
        '${adminUserId}',
        '${adminUserId}'
      )
      ON CONFLICT (slug) DO NOTHING;
    `);

    console.log('✅ Homepage seeded');

    // ============================================
    // 5. SEED SUPPORT PAGE
    // ============================================
    const supportContent = {
      blocks: [
        {
          id: '1',
          type: 'hero-simple',
          category: 'hero-blocks',
          data: {
            title: 'Destek Merkezi',
            subtitle: 'Size nasıl yardımcı olabiliriz?'
          }
        },
        {
          id: '2',
          type: 'content-text',
          category: 'content-blocks',
          data: {
            text: 'Destek talepleriniz için ticket oluşturabilir veya AI chatbot ile anında yardım alabilirsiniz.'
          }
        }
      ]
    };

    await queryRunner.query(`
      INSERT INTO cms_pages (
        id,
        title,
        slug,
        content,
        status,
        "seoTitle",
        "seoDescription",
        created_at,
        updated_at,
        created_by,
        updated_by
      ) VALUES (
        gen_random_uuid(),
        'Destek',
        '/support',
        '${JSON.stringify(supportContent).replace(/'/g, "''")}'::jsonb,
        'published',
        'Destek Merkezi - Affexai',
        'Müşteri destek merkezi, ticket sistemi ve AI chatbot',
        NOW(),
        NOW(),
        '${adminUserId}',
        '${adminUserId}'
      )
      ON CONFLICT (slug) DO NOTHING;
    `);

    // ============================================
    // 6. SEED CONTACT PAGE
    // ============================================
    const contactContent = {
      blocks: [
        {
          id: '1',
          type: 'hero-simple',
          category: 'hero-blocks',
          data: {
            title: 'İletişim',
            subtitle: 'Bizimle iletişime geçin'
          }
        },
        {
          id: '2',
          type: 'special-contact-form',
          category: 'special-blocks',
          data: {
            title: 'İletişim Formu',
            fields: ['name', 'email', 'phone', 'message']
          }
        }
      ]
    };

    await queryRunner.query(`
      INSERT INTO cms_pages (
        id,
        title,
        slug,
        content,
        status,
        "seoTitle",
        "seoDescription",
        created_at,
        updated_at,
        created_by,
        updated_by
      ) VALUES (
        gen_random_uuid(),
        'İletişim',
        '/contact',
        '${JSON.stringify(contactContent).replace(/'/g, "''")}'::jsonb,
        'published',
        'İletişim - Affexai',
        'Bizimle iletişime geçin',
        NOW(),
        NOW(),
        '${adminUserId}',
        '${adminUserId}'
      )
      ON CONFLICT (slug) DO NOTHING;
    `);

    // ============================================
    // 7. SEED ABOUT PAGE
    // ============================================
    const aboutContent = {
      blocks: [
        {
          id: '1',
          type: 'hero-simple',
          category: 'hero-blocks',
          data: {
            title: 'Hakkımızda',
            subtitle: 'Affexai Platform'
          }
        },
        {
          id: '2',
          type: 'content-text',
          category: 'content-blocks',
          data: {
            text: 'Affexai, yapay zeka destekli müşteri desteği ve pazarlama çözümleri sunan kapsamlı bir enterprise platformudur.'
          }
        }
      ]
    };

    await queryRunner.query(`
      INSERT INTO cms_pages (
        id,
        title,
        slug,
        content,
        status,
        "seoTitle",
        "seoDescription",
        created_at,
        updated_at,
        created_by,
        updated_by
      ) VALUES (
        gen_random_uuid(),
        'Hakkımızda',
        '/about',
        '${JSON.stringify(aboutContent).replace(/'/g, "''")}'::jsonb,
        'published',
        'Hakkımızda - Affexai',
        'Affexai platformu hakkında',
        NOW(),
        NOW(),
        '${adminUserId}',
        '${adminUserId}'
      )
      ON CONFLICT (slug) DO NOTHING;
    `);

    // ============================================
    // 8. SEED PRODUCTS PAGE
    // ============================================
    const productsContent = {
      blocks: [
        {
          id: '1',
          type: 'hero-simple',
          category: 'hero-blocks',
          data: {
            title: 'Ürünler',
            subtitle: 'Ürün portföyümüzü keşfedin'
          }
        }
      ]
    };

    await queryRunner.query(`
      INSERT INTO cms_pages (
        id,
        title,
        slug,
        content,
        status,
        "seoTitle",
        "seoDescription",
        created_at,
        updated_at,
        created_by,
        updated_by
      ) VALUES (
        gen_random_uuid(),
        'Ürünler',
        '/products',
        '${JSON.stringify(productsContent).replace(/'/g, "''")}'::jsonb,
        'published',
        'Ürünler - Affexai',
        'Ürün portföyümüz',
        NOW(),
        NOW(),
        '${adminUserId}',
        '${adminUserId}'
      )
      ON CONFLICT (slug) DO NOTHING;
    `);

    // ============================================
    // 9. SEED SOLUTIONS PAGE
    // ============================================
    const solutionsContent = {
      blocks: [
        {
          id: '1',
          type: 'hero-simple',
          category: 'hero-blocks',
          data: {
            title: 'Çözümler',
            subtitle: 'İşletmeniz için çözümler'
          }
        }
      ]
    };

    await queryRunner.query(`
      INSERT INTO cms_pages (
        id,
        title,
        slug,
        content,
        status,
        "seoTitle",
        "seoDescription",
        created_at,
        updated_at,
        created_by,
        updated_by
      ) VALUES (
        gen_random_uuid(),
        'Çözümler',
        '/solutions',
        '${JSON.stringify(solutionsContent).replace(/'/g, "''")}'::jsonb,
        'published',
        'Çözümler - Affexai',
        'İş çözümlerimiz',
        NOW(),
        NOW(),
        '${adminUserId}',
        '${adminUserId}'
      )
      ON CONFLICT (slug) DO NOTHING;
    `);

    // ============================================
    // 10. SEED EDUCATION PAGE
    // ============================================
    const educationContent = {
      blocks: [
        {
          id: '1',
          type: 'hero-simple',
          category: 'hero-blocks',
          data: {
            title: 'Eğitim',
            subtitle: 'Eğitim ve sertifikasyon programları'
          }
        }
      ]
    };

    await queryRunner.query(`
      INSERT INTO cms_pages (
        id,
        title,
        slug,
        content,
        status,
        "seoTitle",
        "seoDescription",
        created_at,
        updated_at,
        created_by,
        updated_by
      ) VALUES (
        gen_random_uuid(),
        'Eğitim',
        '/education',
        '${JSON.stringify(educationContent).replace(/'/g, "''")}'::jsonb,
        'published',
        'Eğitim - Affexai',
        'Eğitim ve sertifikasyon',
        NOW(),
        NOW(),
        '${adminUserId}',
        '${adminUserId}'
      )
      ON CONFLICT (slug) DO NOTHING;
    `);

    console.log('✅ CMS pages seeded (6 pages)');
    console.log('');
    console.log('📊 Summary:');
    console.log('   - 7 ticket categories (5 parent + 2 subcategories)');
    console.log('   - 1 navigation menu');
    console.log('   - 6 menu items');
    console.log('   - 6 CMS pages (Homepage, Support, Contact, About, Products, Solutions, Education)');
    console.log('');
    console.log('✅ CMS content seeding completed!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('⏮️  Rolling back CMS content seed...');

    // Remove in reverse order to avoid foreign key violations

    // 1. Remove CMS pages
    await queryRunner.query(`
      DELETE FROM cms_pages
      WHERE slug IN ('/', '/support', '/contact', '/about', '/products', '/solutions', '/education');
    `);

    // 2. Remove menu items
    await queryRunner.query(`
      DELETE FROM cms_menu_items
      WHERE "menuId" IN (SELECT id FROM cms_menus WHERE slug = 'main-menu');
    `);

    // 3. Remove menus
    await queryRunner.query(`
      DELETE FROM cms_menus WHERE slug = 'main-menu';
    `);

    // 4. Remove ticket categories
    await queryRunner.query(`
      DELETE FROM ticket_categories
      WHERE name IN ('Teknik', 'Yazılım', 'Donanım', 'Lisanslama', 'Faturalama', 'Genel', 'Özellik Talebi');
    `);

    console.log('✅ CMS content rollback completed!');
  }
}

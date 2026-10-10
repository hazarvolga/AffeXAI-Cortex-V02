import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTicketCategories1728909000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert default ticket categories
    await queryRunner.query(`
      INSERT INTO ticket_categories (id, name, description, "isActive", "parentId", "ticketCount", created_at, updated_at)
      VALUES
        -- Main Categories
        (
          'a1b2c3d4-e5f6-4789-abcd-ef1234567890',
          'Teknik Destek',
          'Yazılım, donanım ve sistem ile ilgili teknik sorunlar',
          true,
          NULL,
          0,
          NOW(),
          NOW()
        ),
        (
          'b2c3d4e5-f6a7-4801-bcde-f12345678901',
          'Faturalama & Ödemeler',
          'Fatura, ödeme ve abonelik ile ilgili talepler',
          true,
          NULL,
          0,
          NOW(),
          NOW()
        ),
        (
          'c3d4e5f6-a7b8-4012-cdef-123456789012',
          'Genel Sorular',
          'Ürün özellikleri ve kullanım hakkında genel sorular',
          true,
          NULL,
          0,
          NOW(),
          NOW()
        ),
        (
          'd4e5f6a7-b8c9-4123-defa-234567890123',
          'Özellik Talebi',
          'Yeni özellik önerileri ve geliştirme talepleri',
          true,
          NULL,
          0,
          NOW(),
          NOW()
        ),
        (
          'e5f6a7b8-c9d0-4234-efab-345678901234',
          'Hata Bildirimi',
          'Yazılım hataları ve bug raporları',
          true,
          NULL,
          0,
          NOW(),
          NOW()
        ),
        
        -- Sub Categories for Teknik Destek
        (
          'f6a7b8c9-d0e1-4345-fabc-456789012345',
          'Kurulum Sorunları',
          'Yazılım kurulumu ve konfigürasyon sorunları',
          true,
          'a1b2c3d4-e5f6-4789-abcd-ef1234567890',
          0,
          NOW(),
          NOW()
        ),
        (
          'a7b8c9d0-e1f2-4456-abcd-567890123456',
          'Performans Sorunları',
          'Yavaşlık, donma ve performans ile ilgili sorunlar',
          true,
          'a1b2c3d4-e5f6-4789-abcd-ef1234567890',
          0,
          NOW(),
          NOW()
        ),
        (
          'b8c9d0e1-f2a3-4567-bcde-678901234567',
          'Bağlantı Sorunları',
          'Ağ bağlantısı ve erişim sorunları',
          true,
          'a1b2c3d4-e5f6-4789-abcd-ef1234567890',
          0,
          NOW(),
          NOW()
        ),
        
        -- Sub Categories for Faturalama
        (
          'c9d0e1f2-a3b4-4678-cdef-789012345678',
          'Fatura Sorunları',
          'Fatura içeriği ve düzeltme talepleri',
          true,
          'b2c3d4e5-f6a7-4801-bcde-f12345678901',
          0,
          NOW(),
          NOW()
        ),
        (
          'd0e1f2a3-b4c5-4789-defa-890123456789',
          'Ödeme Sorunları',
          'Ödeme işlemleri ve hataları',
          true,
          'b2c3d4e5-f6a7-4801-bcde-f12345678901',
          0,
          NOW(),
          NOW()
        ),
        (
          'e1f2a3b4-c5d6-4890-efab-901234567890',
          'Abonelik Yönetimi',
          'Plan değişikliği ve iptal işlemleri',
          true,
          'b2c3d4e5-f6a7-4801-bcde-f12345678901',
          0,
          NOW(),
          NOW()
        )
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete seeded categories
    await queryRunner.query(`
      DELETE FROM ticket_categories
      WHERE id IN (
        'a1b2c3d4-e5f6-4789-abcd-ef1234567890',
        'b2c3d4e5-f6a7-4801-bcde-f12345678901',
        'c3d4e5f6-a7b8-4012-cdef-123456789012',
        'd4e5f6a7-b8c9-4123-defa-234567890123',
        'e5f6a7b8-c9d0-4234-efab-345678901234',
        'f6a7b8c9-d0e1-4345-fabc-456789012345',
        'a7b8c9d0-e1f2-4456-abcd-567890123456',
        'b8c9d0e1-f2a3-4567-bcde-678901234567',
        'c9d0e1f2-a3b4-4678-cdef-789012345678',
        'd0e1f2a3-b4c5-4789-defa-890123456789',
        'e1f2a3b4-c5d6-4890-efab-901234567890'
      )
    `);
  }
}

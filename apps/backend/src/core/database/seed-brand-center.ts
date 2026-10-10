import 'reflect-metadata';
import { DataSource } from 'typeorm';

async function seedBrandCommunicationCenter() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'affexai_dev',
    synchronize: false,
    entities: [],
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected for seeding');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // Find superuser by email
    const superUser = await queryRunner.query("SELECT id FROM users WHERE email = 'superuser@affexai.com' LIMIT 1");
    if (superUser.length === 0) {
      throw new Error('Superuser not found. Please run restore-superadmin.ts first.');
    }
    const superUserId = superUser[0].id;

    // Default tenant for AffexAI demo data
    const affexaiTenantId = 'default';

    console.log('🧹 Cleaning existing module data...');
    // Order matters because of FKs
    await queryRunner.query('DELETE FROM event_registrations');
    await queryRunner.query('DELETE FROM events');
    await queryRunner.query('DELETE FROM certificates');
    await queryRunner.query('DELETE FROM email_logs');
    await queryRunner.query('DELETE FROM email_campaign_variants');
    await queryRunner.query('DELETE FROM email_campaigns');
    // Tickets often have FKs to users/categories, check cascades
    // await queryRunner.query('DELETE FROM ticket_messages'); // Add if exists
    // await queryRunner.query('DELETE FROM ticket_audit_logs');
    // await queryRunner.query('DELETE FROM ticket_csat');
    // Deleting tickets directly might fail if there are constraints, so cascading delete or deleting children first is safe
    await queryRunner.query('DELETE FROM tickets CASCADE');
    await queryRunner.query('DELETE FROM company_knowledge_sources');
    console.log('✅ Modules cleaned');

    // --- 1. EVENTS ---
    console.log('📅 Seeding Brand Communication events...');
    const event1Id = 'e1e1e1e1-e1e1-4e1e-a1e1-e1e1e1e1e1e1';
    const event2Id = 'e2e2e2e2-e2e2-4e2e-a2e2-e2e2e2e2e2e2';

    // Note: Removed 'type' column, using 'status'
    // 'tenantId' is in 'events' table
    await queryRunner.query(`
      INSERT INTO events (id, title, description, "startDate", "endDate", location, status, "createdById", tenant_id, "capacity", "price", created_at, updated_at)
      VALUES 
      (
        '${event1Id}',
        'AI-Driven Brand Orchestration Summit',
        'Geleceğin marka yönetimi: Veri zekası ile duyusal bağın mükemmel dengesi. AffeXAI Brand Intelligence modülünün tüm yeteneklerini canlı uygulamalarla keşfedeceğimiz bu zirvede, öngörücü iletişim stratejilerini derinlemesine inceliyoruz.',
        NOW() + INTERVAL '10 days',
        NOW() + INTERVAL '10 days' + INTERVAL '4 hours',
        'AffeXAI Virtual Experience Center',
        'published',
        '${superUserId}',
        '${affexaiTenantId}',
        500,
        0,
        NOW(),
        NOW()
      ),
      (
        '${event2Id}',
        'Emotional Analytics Masterclass',
        'Müşterilerinizin satır aralarındaki duygularını okumak mümkün mü? Duygusal Analitik modülümüz ile marka sadakatini ölçümlemenin ve iletişim dilini optimize etmenin yollarını paylaşıyoruz.',
        NOW() + INTERVAL '20 days',
        NOW() + INTERVAL '20 days' + INTERVAL '3 hours',
        'İstanbul Teknopark Konferans Salonu',
        'published',
        '${superUserId}',
        '${affexaiTenantId}',
        100,
        0,
        NOW(),
        NOW()
      )
    `);

    // --- 2. EMAIL CAMPAIGNS ---
    console.log('📧 Seeding Strategic Marketing campaigns...');
    const campaign1Id = 'c1c1c1c1-c1c1-4c1c-a1c1-c1c1c1c1c1c1';

    // Note: Removed 'type', 'senderName', 'senderEmail', 'tenantId', 'createdBy', 'preheader' as they were missing in schema check
    // Added 'content' instead of 'bodyContent'
    await queryRunner.query(`
      INSERT INTO email_campaigns (id, name, subject, content, status, "totalRecipients", "sentCount", "openedCount", "clickedCount", created_at, updated_at)
      VALUES (
        '${campaign1Id}',
        'The Pulse of Perception: Annual Loyalty Report',
        'Markanızın Duygusal Nabzını Keşfedin 📊',
        '<h1>Marka Değerinizi Veriyle İnşa Edin</h1><p>AffeXAI Predictive Intelligence, müşterileriniz bir sorunu seslendirmeden önce ihtiyacını öngörür.</p>',
        'completed',
        1250,
        1250,
        845,
        210,
        NOW() - INTERVAL '2 days',
        NOW()
      )
    `);

    // --- 3. SUPPORT TICKETS ---
    console.log('🎫 Seeding Predictive Support scenarios...');
    // Note: Removed 'tenantId' as it's not in tickets table
    await queryRunner.query(`
      INSERT INTO tickets (id, "displayNumber", subject, description, status, priority, "userId", "assignedToId", created_at, updated_at)
      VALUES
      (
        gen_random_uuid(),
        'TCK-2025-001',
        '[PREDICTIVE] Potansiyel Sadakat Düşüşü Algılandı',
        'Sistemimiz, Global Tech Solutions hesabındaki duygusal tonun son 3 etkileşimde "nötr"den "hafif hayal kırıklığı"na geçtiğini tespit etti. Proaktif bir iletişim planı önerilir.',
        'open',
        'high',
        '${superUserId}',
        '${superUserId}',
        NOW() - INTERVAL '1 hour',
        NOW()
      ),
      (
        gen_random_uuid(),
        'TCK-2025-002',
        'Brand Voice Optimizasyon Talebi',
        'Yeni kampanya metinlerinin "Yenilikçi ama Güven Veren" marka ses tonumuza %92 oranında uyumlu olduğu saptandı. %8lik sapmayı gidermek için içerik optimizasyon önerileri bekleniyor.',
        'in_progress',
        'medium',
        '${superUserId}',
        '${superUserId}',
        NOW() - INTERVAL '5 hours',
        NOW()
      )
    `); // Use standard quoting for displayNumber

    // --- 4. KNOWLEDGE SOURCES ---
    console.log('🧠 Seeding Brand Intelligence sources...');
    // Note: Removed 'tenantId' 
    // Fixed: 'sourceType' and 'status' are varchar now, not enums in database
    await queryRunner.query(`
      INSERT INTO company_knowledge_sources (id, title, description, "sourceType", status, "extractedContent", "uploadedById", created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'AffeXAI Brand Communication Strategy 2025',
        'Markanın global iletişim parametreleri, ses tonu rehberi ve öngörücü zeka entegrasyon planı.',
        'text',
        'active',
        'Marka ses tonumuz: Bilge, Empatik, Çevik. Hedef: Tüm kanallarda tutarlı bir duygusal rezonans yakalamak.',
        '${superUserId}',
        NOW(),
        NOW()
      )
    `);

    // --- 5. CERTIFICATES ---
    console.log('📜 Seeding Brand Value certificates...');
    // Note: Removed 'certificateNumber' (using 'name' or just id/metadata?), 'tenantId' if not present
    // Schema check says: id, name, issueDate, expiryDate, fileUrl, templateId, userId, recipientName, recipientEmail, status, issuedAt, eventId
    await queryRunner.query(`
      INSERT INTO certificates (id, "name", "recipientName", "recipientEmail", "issueDate", "expiryDate", "status", "eventId", "issuedAt", created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'Brand Orchestration Certified Partner',
        'Demir Lojistik A.Ş.',
        'iletisim@demirlojistik.com',
        NOW(),
        NOW() + INTERVAL '1 year',
        'active',
        '${event1Id}',
        NOW(),
        NOW(),
        NOW()
      )
    `);

    await queryRunner.release();
    await dataSource.destroy();
    console.log('🏁 Seeding of Brand Communication Center demo data completed!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seedBrandCommunicationCenter();

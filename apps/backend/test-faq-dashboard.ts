import { DataSource } from 'typeorm';
import { LearnedFaqEntry, FaqEntryStatus, FaqEntrySource } from './src/modules/faq-learning/entities/learned-faq-entry.entity';

async function seedTestData() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5434,
    username: 'postgres',
    password: 'postgres',
    database: 'affexai_dev',
    entities: [LearnedFaqEntry],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connected');

    const faqRepo = dataSource.getRepository(LearnedFaqEntry);

    // Clear existing test data
    await faqRepo.delete({});
    console.log('Cleared existing FAQs');

    // Create test FAQs with different confidence levels and sources
    const testFaqs = [
      // High confidence FAQs (85%+)
      {
        question: 'Allplan lisansımı nasıl yenileyebilirim?',
        answer: 'Allplan lisansınızı yenilemek için hesabınıza giriş yapın ve Lisanslar bölümüne gidin.',
        confidence: 92,
        status: FaqEntryStatus.APPROVED,
        source: FaqEntrySource.CHAT,
        sourceId: 'chat-001',
        category: 'Lisanslama',
        keywords: ['lisans', 'yenileme', 'allplan'],
        usageCount: 15,
        helpfulCount: 12,
        notHelpfulCount: 1,
      },
      {
        question: 'Proje dosyalarımı nasıl yedekleyebilirim?',
        answer: 'Proje dosyalarınızı yedeklemek için Dosya > Yedekle menüsünü kullanabilirsiniz.',
        confidence: 88,
        status: FaqEntryStatus.PUBLISHED,
        source: FaqEntrySource.TICKET,
        sourceId: 'ticket-001',
        category: 'Dosya Yönetimi',
        keywords: ['yedekleme', 'proje', 'dosya'],
        usageCount: 23,
        helpfulCount: 20,
        notHelpfulCount: 2,
      },
      {
        question: '3D görünümü nasıl aktif ederim?',
        answer: '3D görünümü aktif etmek için Görünüm > 3D Görünüm seçeneğini kullanın.',
        confidence: 95,
        status: FaqEntryStatus.PUBLISHED,
        source: FaqEntrySource.CHAT,
        sourceId: 'chat-002',
        category: 'Görünüm',
        keywords: ['3d', 'görünüm', 'aktif'],
        usageCount: 45,
        helpfulCount: 42,
        notHelpfulCount: 1,
      },
      {
        question: 'Render ayarlarını nasıl değiştirebilirim?',
        answer: 'Render ayarlarını değiştirmek için Ayarlar > Render menüsüne gidin.',
        confidence: 90,
        status: FaqEntryStatus.APPROVED,
        source: FaqEntrySource.TICKET,
        sourceId: 'ticket-002',
        category: 'Render',
        keywords: ['render', 'ayarlar'],
        usageCount: 18,
        helpfulCount: 15,
        notHelpfulCount: 2,
      },

      // Medium confidence FAQs (60-84%)
      {
        question: 'Katman ayarları nerede?',
        answer: 'Katman ayarlarına Görünüm menüsünden ulaşabilirsiniz.',
        confidence: 75,
        status: FaqEntryStatus.PENDING_REVIEW,
        source: FaqEntrySource.CHAT,
        sourceId: 'chat-003',
        category: 'Katmanlar',
        keywords: ['katman', 'ayarlar'],
        usageCount: 8,
        helpfulCount: 5,
        notHelpfulCount: 2,
      },
      {
        question: 'Ölçeklendirme nasıl yapılır?',
        answer: 'Ölçeklendirme için Düzenle > Ölçeklendir komutunu kullanın.',
        confidence: 70,
        status: FaqEntryStatus.PENDING_REVIEW,
        source: FaqEntrySource.TICKET,
        sourceId: 'ticket-003',
        category: 'Düzenleme',
        keywords: ['ölçeklendirme', 'düzenleme'],
        usageCount: 12,
        helpfulCount: 8,
        notHelpfulCount: 3,
      },
      {
        question: 'Yazı tipi nasıl değiştirilir?',
        answer: 'Yazı tipini değiştirmek için metin özelliklerini kullanın.',
        confidence: 68,
        status: FaqEntryStatus.APPROVED,
        source: FaqEntrySource.CHAT,
        sourceId: 'chat-004',
        category: 'Metin',
        keywords: ['yazı', 'font', 'metin'],
        usageCount: 6,
        helpfulCount: 4,
        notHelpfulCount: 1,
      },
      {
        question: 'Çizim araçları nerede?',
        answer: 'Çizim araçları sol taraftaki araç çubuğunda bulunur.',
        confidence: 72,
        status: FaqEntryStatus.PENDING_REVIEW,
        source: FaqEntrySource.USER_SUGGESTION,
        sourceId: 'suggestion-001',
        category: 'Araçlar',
        keywords: ['çizim', 'araçlar'],
        usageCount: 10,
        helpfulCount: 7,
        notHelpfulCount: 2,
      },

      // Low confidence FAQs (<60%)
      {
        question: 'Program neden yavaş?',
        answer: 'Program performansı birçok faktöre bağlıdır.',
        confidence: 55,
        status: FaqEntryStatus.PENDING_REVIEW,
        source: FaqEntrySource.CHAT,
        sourceId: 'chat-005',
        category: 'Performans',
        keywords: ['performans', 'yavaş'],
        usageCount: 3,
        helpfulCount: 1,
        notHelpfulCount: 2,
      },
      {
        question: 'Hata mesajı ne anlama geliyor?',
        answer: 'Hata mesajları farklı durumları gösterebilir.',
        confidence: 45,
        status: FaqEntryStatus.PENDING_REVIEW,
        source: FaqEntrySource.TICKET,
        sourceId: 'ticket-004',
        category: 'Hatalar',
        keywords: ['hata', 'mesaj'],
        usageCount: 2,
        helpfulCount: 0,
        notHelpfulCount: 2,
      },
      {
        question: 'Güncelleme nasıl yapılır?',
        answer: 'Güncelleme için yardım menüsünü kontrol edin.',
        confidence: 58,
        status: FaqEntryStatus.PENDING_REVIEW,
        source: FaqEntrySource.CHAT,
        sourceId: 'chat-006',
        category: 'Güncelleme',
        keywords: ['güncelleme', 'update'],
        usageCount: 5,
        helpfulCount: 2,
        notHelpfulCount: 2,
      },
    ];

    // Insert test FAQs
    for (const faqData of testFaqs) {
      const faq = faqRepo.create(faqData);
      await faqRepo.save(faq);
    }

    console.log(`✅ Created ${testFaqs.length} test FAQs`);
    console.log('\nDistribution:');
    console.log(`- High Confidence (85%+): ${testFaqs.filter(f => f.confidence >= 85).length} FAQs`);
    console.log(`- Medium Confidence (60-84%): ${testFaqs.filter(f => f.confidence >= 60 && f.confidence < 85).length} FAQs`);
    console.log(`- Low Confidence (<60%): ${testFaqs.filter(f => f.confidence < 60).length} FAQs`);
    console.log('\nBy Source:');
    console.log(`- Chat: ${testFaqs.filter(f => f.source === FaqEntrySource.CHAT).length} FAQs`);
    console.log(`- Tickets: ${testFaqs.filter(f => f.source === FaqEntrySource.TICKET).length} FAQs`);
    console.log(`- Suggestions: ${testFaqs.filter(f => f.source === FaqEntrySource.USER_SUGGESTION).length} FAQs`);

    await dataSource.destroy();
    console.log('\n✅ Test data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  }
}

seedTestData();

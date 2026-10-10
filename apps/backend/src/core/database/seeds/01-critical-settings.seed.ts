import { DataSource } from 'typeorm';
import { Setting, SettingCategory } from '../../../modules/settings/entities/setting.entity';

export async function seedCriticalSettings(dataSource: DataSource) {
  const settingsRepo = dataSource.getRepository(Setting);

  console.log('🌱 Seeding critical settings...');

  const settings: Partial<Setting>[] = [
    // ==========================================
    // COMPANY SETTINGS (Site info)
    // ==========================================
    {
      category: SettingCategory.COMPANY,
      key: 'name',
      value: 'Affexai Platform',
      isEncrypted: false,
    },
    {
      category: SettingCategory.COMPANY,
      key: 'tagline',
      value: 'AI-Powered Customer Support & Marketing Platform',
      isEncrypted: false,
    },
    {
      category: SettingCategory.COMPANY,
      key: 'description',
      value: 'Comprehensive platform for customer support, email marketing, and content management with AI integration',
      isEncrypted: false,
    },
    {
      category: SettingCategory.COMPANY,
      key: 'email',
      value: 'info@affexai.com',
      isEncrypted: false,
    },
    {
      category: SettingCategory.COMPANY,
      key: 'supportEmail',
      value: 'support@affexai.com',
      isEncrypted: false,
    },
    {
      category: SettingCategory.COMPANY,
      key: 'phone',
      value: '+90 (XXX) XXX XX XX',
      isEncrypted: false,
    },
    {
      category: SettingCategory.COMPANY,
      key: 'address',
      value: 'İstanbul, Türkiye',
      isEncrypted: false,
    },
    {
      category: SettingCategory.COMPANY,
      key: 'logo',
      value: '/assets/logo.png',
      isEncrypted: false,
    },
    {
      category: SettingCategory.COMPANY,
      key: 'timezone',
      value: 'Europe/Istanbul',
      isEncrypted: false,
    },
    {
      category: SettingCategory.COMPANY,
      key: 'language',
      value: 'tr',
      isEncrypted: false,
    },
    {
      category: SettingCategory.COMPANY,
      key: 'domain',
      value: 'affexai.com',
      isEncrypted: false,
    },

    // ==========================================
    // EMAIL SETTINGS
    // ==========================================
    {
      category: SettingCategory.EMAIL,
      key: 'provider',
      value: 'resend', // resend | smtp
      isEncrypted: false,
    },
    {
      category: SettingCategory.EMAIL,
      key: 'resend.apiKey',
      value: '', // TO BE CONFIGURED - Will be encrypted automatically
      isEncrypted: false, // BeforeInsert hook will encrypt
    },
    {
      category: SettingCategory.EMAIL,
      key: 'smtp.host',
      value: 'smtp.resend.com',
      isEncrypted: false,
    },
    {
      category: SettingCategory.EMAIL,
      key: 'smtp.port',
      value: '587',
      isEncrypted: false,
    },
    {
      category: SettingCategory.EMAIL,
      key: 'smtp.user',
      value: 'resend',
      isEncrypted: false,
    },
    {
      category: SettingCategory.EMAIL,
      key: 'smtp.password',
      value: '', // TO BE CONFIGURED - Will be encrypted automatically
      isEncrypted: false, // BeforeInsert hook will encrypt
    },
    {
      category: SettingCategory.EMAIL,
      key: 'smtp.secure',
      value: 'false',
      isEncrypted: false,
    },
    {
      category: SettingCategory.EMAIL,
      key: 'from.email',
      value: 'noreply@affexai.com',
      isEncrypted: false,
    },
    {
      category: SettingCategory.EMAIL,
      key: 'from.name',
      value: 'Affexai Platform',
      isEncrypted: false,
    },
    {
      category: SettingCategory.EMAIL,
      key: 'replyTo.email',
      value: 'support@affexai.com',
      isEncrypted: false,
    },

    // ==========================================
    // AI SETTINGS
    // ==========================================
    {
      category: SettingCategory.AI,
      key: 'useSingleApiKey',
      value: 'false',
      isEncrypted: false,
    },
    {
      category: SettingCategory.AI,
      key: 'global.provider',
      value: 'openai', // openai | anthropic | google
      isEncrypted: false,
    },
    {
      category: SettingCategory.AI,
      key: 'global.model',
      value: 'gpt-4o-mini',
      isEncrypted: false,
    },
    {
      category: SettingCategory.AI,
      key: 'global.apiKey',
      value: '', // TO BE CONFIGURED - Will be encrypted automatically
      isEncrypted: false, // BeforeInsert hook will encrypt
    },
    {
      category: SettingCategory.AI,
      key: 'global.enabled',
      value: 'true',
      isEncrypted: false,
    },
    // Support AI
    {
      category: SettingCategory.AI,
      key: 'support.provider',
      value: 'openai',
      isEncrypted: false,
    },
    {
      category: SettingCategory.AI,
      key: 'support.model',
      value: 'gpt-4o-mini',
      isEncrypted: false,
    },
    {
      category: SettingCategory.AI,
      key: 'support.apiKey',
      value: '', // Uses global if empty
      isEncrypted: false,
    },
    {
      category: SettingCategory.AI,
      key: 'support.enabled',
      value: 'true',
      isEncrypted: false,
    },
    // Email Marketing AI
    {
      category: SettingCategory.AI,
      key: 'emailMarketing.provider',
      value: 'openai',
      isEncrypted: false,
    },
    {
      category: SettingCategory.AI,
      key: 'emailMarketing.model',
      value: 'gpt-4o-mini',
      isEncrypted: false,
    },
    {
      category: SettingCategory.AI,
      key: 'emailMarketing.apiKey',
      value: '',
      isEncrypted: false,
    },
    {
      category: SettingCategory.AI,
      key: 'emailMarketing.enabled',
      value: 'true',
      isEncrypted: false,
    },
    // Social Media AI
    {
      category: SettingCategory.AI,
      key: 'social.provider',
      value: 'openai',
      isEncrypted: false,
    },
    {
      category: SettingCategory.AI,
      key: 'social.model',
      value: 'gpt-4o-mini',
      isEncrypted: false,
    },
    {
      category: SettingCategory.AI,
      key: 'social.apiKey',
      value: '',
      isEncrypted: false,
    },
    {
      category: SettingCategory.AI,
      key: 'social.enabled',
      value: 'false',
      isEncrypted: false,
    },
    // Analytics AI
    {
      category: SettingCategory.AI,
      key: 'analytics.provider',
      value: 'openai',
      isEncrypted: false,
    },
    {
      category: SettingCategory.AI,
      key: 'analytics.model',
      value: 'gpt-4o-mini',
      isEncrypted: false,
    },
    {
      category: SettingCategory.AI,
      key: 'analytics.apiKey',
      value: '',
      isEncrypted: false,
    },
    {
      category: SettingCategory.AI,
      key: 'analytics.enabled',
      value: 'true',
      isEncrypted: false,
    },

    // ==========================================
    // ANALYTICS SETTINGS
    // ==========================================
    {
      category: SettingCategory.ANALYTICS,
      key: 'enabled',
      value: 'true',
      isEncrypted: false,
    },
    {
      category: SettingCategory.ANALYTICS,
      key: 'trackPageViews',
      value: 'true',
      isEncrypted: false,
    },
    {
      category: SettingCategory.ANALYTICS,
      key: 'trackEvents',
      value: 'true',
      isEncrypted: false,
    },

    // ==========================================
    // SOCIAL MEDIA SETTINGS
    // ==========================================
    {
      category: SettingCategory.SOCIAL_MEDIA,
      key: 'enabled',
      value: 'false', // Not fully implemented
      isEncrypted: false,
    },
  ];

  // Insert or update settings
  let created = 0;
  let updated = 0;

  for (const setting of settings) {
    const existing = await settingsRepo.findOne({
      where: { category: setting.category, key: setting.key },
    });

    if (existing) {
      console.log(`  ↻ Updating: ${setting.category}.${setting.key}`);
      await settingsRepo.update(existing.id, {
        value: setting.value,
        isEncrypted: setting.isEncrypted,
      });
      updated++;
    } else {
      console.log(`  ✓ Creating: ${setting.category}.${setting.key}`);
      await settingsRepo.save(setting);
      created++;
    }
  }

  const count = await settingsRepo.count();
  console.log(`\n✅ Settings seed complete!`);
  console.log(`   Created: ${created}, Updated: ${updated}, Total: ${count}`);
  console.log('\n⚠️  IMPORTANT: Update these settings with your actual values:');
  console.log('   - email.resend.apiKey (Resend API key)');
  console.log('   - ai.global.apiKey (OpenAI/Anthropic/Google API key)');
  console.log('\n💡 Update via: Admin UI > Settings > AI Settings & Email Settings');
  console.log('   Settings will be automatically encrypted by BeforeInsert/BeforeUpdate hooks\n');
}

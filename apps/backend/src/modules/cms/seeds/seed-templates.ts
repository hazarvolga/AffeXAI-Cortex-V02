import { DataSource } from 'typeorm';
import { PageTemplate } from '../entities/page-template.entity';
import { templatesData } from './templates-data';

/**
 * Seed CMS Page Templates
 *
 * Usage: npm run seed:cms-templates
 */
export async function seedCmsTemplates(dataSource: DataSource): Promise<void> {
  const templateRepository = dataSource.getRepository(PageTemplate);

  console.log('🌱 Seeding CMS templates...');

  // Check existing templates
  const existingCount = await templateRepository.count();
  console.log(`ℹ️  Found ${existingCount} existing templates in database.`);

  // Get existing template names
  const existingTemplates = await templateRepository.find({ select: ['name'] });
  const existingNames = new Set(existingTemplates.map(t => t.name));

  // Filter out templates that already exist
  const newTemplates = templatesData.filter(t => !existingNames.has(t.name));

  if (newTemplates.length === 0) {
    console.log('✅ All templates already exist. No new templates to seed.');
    return;
  }

  console.log(`📝 Adding ${newTemplates.length} new templates...`);

  // Create new templates
  const templates = newTemplates.map((data) =>
    templateRepository.create({
      ...data,
      isActive: true,
      usageCount: 0,
      authorId: null, // System-generated templates
    })
  );

  await templateRepository.save(templates);

  console.log(`✅ Successfully seeded ${templates.length} new CMS templates:`);
  templates.forEach((t, i) => {
    const icon = t.isFeatured ? '⭐' : '  ';
    console.log(`   ${icon} ${i + 1}. ${t.name} (${t.category})`);
  });

  const finalCount = await templateRepository.count();
  console.log(`\n📊 Total templates in database: ${finalCount}`);
}

/**
 * Reset CMS Templates - Delete all and reseed
 */
export async function resetCmsTemplates(dataSource: DataSource): Promise<void> {
  const templateRepository = dataSource.getRepository(PageTemplate);

  console.log('🔄 Resetting CMS templates...\n');

  // Step 1: Delete all existing templates
  const existingCount = await templateRepository.count();
  console.log(`🗑️  Deleting ${existingCount} existing templates...`);

  await templateRepository.clear();
  console.log('✅ All existing templates deleted\n');

  // Step 2: Create new templates from templates-data.ts
  console.log(`📝 Creating ${templatesData.length} new V2 templates...`);

  const templates = templatesData.map((data) =>
    templateRepository.create({
      ...data,
      isActive: true,
      usageCount: 0,
      authorId: null,
    })
  );

  await templateRepository.save(templates);

  console.log(`\n✅ Successfully created ${templates.length} new CMS templates:`);
  templates.forEach((t, i) => {
    const icon = t.isFeatured ? '⭐' : '  ';
    console.log(`   ${icon} ${i + 1}. ${t.name} (${t.category})`);
  });

  const finalCount = await templateRepository.count();
  console.log(`\n📊 Total templates in database: ${finalCount}`);
}

/**
 * Standalone script execution
 */
if (require.main === module) {
  // This allows running the script directly: ts-node seed-templates.ts
  console.log('Please run this via: npm run seed:cms-templates');
  process.exit(1);
}


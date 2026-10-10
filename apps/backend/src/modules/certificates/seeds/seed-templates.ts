import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CertificateTemplate } from '../entities/certificate-template.entity';

export async function seedCertificateTemplates(dataSource: DataSource) {
  const templateRepository = dataSource.getRepository(CertificateTemplate);

  // Check if templates already exist
  const existingCount = await templateRepository.count();
  if (existingCount > 0) {
    console.log('Certificate templates already seeded. Skipping...');
    return;
  }

  const templatesPath = join(__dirname, '..', 'templates');

  // Read template files
  const standardHtml = readFileSync(join(templatesPath, 'standard.html'), 'utf-8');
  const premiumHtml = readFileSync(join(templatesPath, 'premium.html'), 'utf-8');
  const executiveHtml = readFileSync(join(templatesPath, 'executive.html'), 'utf-8');

  const templates = [
    {
      name: 'Default',
      description: 'Standard certificate design with gradient background and gold border',
      htmlContent: standardHtml,
      variables: [
        'recipientName',
        'recipientEmail',
        'trainingTitle',
        'description',
        'issuedAt',
        'validUntil',
        'logoUrl',
        'customLogoUrl',
        'signatureUrl',
        'certificateNumber',
        'companyName',
        'companyAddress',
        'companyLogoUrl',
      ],
      isActive: true,
      orientation: 'landscape' as const,
      pageFormat: 'A4',
      metadata: {
        color: 'purple-gold',
        style: 'classic',
      },
    },
    {
      name: 'Premium',
      description: 'Modern premium design with gradient effects and badge',
      htmlContent: premiumHtml,
      variables: [
        'recipientName',
        'recipientEmail',
        'trainingTitle',
        'description',
        'issuedAt',
        'validUntil',
        'logoUrl',
        'customLogoUrl',
        'signatureUrl',
        'certificateNumber',
        'companyName',
        'companyAddress',
        'companyLogoUrl',
      ],
      isActive: true,
      orientation: 'landscape' as const,
      pageFormat: 'A4',
      metadata: {
        color: 'navy-red',
        style: 'modern',
      },
    },
    {
      name: 'Executive',
      description: 'Minimal elegant design for professional certifications',
      htmlContent: executiveHtml,
      variables: [
        'recipientName',
        'recipientEmail',
        'trainingTitle',
        'description',
        'issuedAt',
        'validUntil',
        'logoUrl',
        'customLogoUrl',
        'signatureUrl',
        'certificateNumber',
        'companyName',
        'companyAddress',
        'companyLogoUrl',
      ],
      isActive: true,
      orientation: 'landscape' as const,
      pageFormat: 'A4',
      metadata: {
        color: 'monochrome',
        style: 'executive',
      },
    },
  ];

  // Create templates
  for (const templateData of templates) {
    const template = templateRepository.create(templateData);
    await templateRepository.save(template);
    console.log(`✅ Created template: ${template.name}`);
  }

  console.log('🎉 Certificate templates seeded successfully!');
}

// Standalone execution
if (require.main === module) {
  import('../../../core/database/data-source').then(async (module) => {
    const AppDataSource = module.default;
    try {
      await AppDataSource.initialize();
      console.log('Data Source initialized');

      await seedCertificateTemplates(AppDataSource);

      await AppDataSource.destroy();
      console.log('Done!');
      process.exit(0);
    } catch (error) {
      console.error('Error seeding templates:', error);
      process.exit(1);
    }
  });
}

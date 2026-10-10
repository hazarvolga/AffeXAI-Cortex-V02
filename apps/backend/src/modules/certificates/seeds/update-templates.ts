import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CertificateTemplate } from '../entities/certificate-template.entity';

export async function updateCertificateTemplates(dataSource: DataSource) {
  const templateRepository = dataSource.getRepository(CertificateTemplate);

  const templatesPath = join(__dirname, '..', 'templates');

  // Read updated template files
  const standardHtml = readFileSync(join(templatesPath, 'standard-template.html'), 'utf-8');
  const premiumHtml = readFileSync(join(templatesPath, 'premium-template.html'), 'utf-8');
  const executiveHtml = readFileSync(join(templatesPath, 'executive-template.html'), 'utf-8');

  console.log('📝 Updating certificate templates with optimized versions...');

  // Update Default/Standard template
  const defaultTemplate = await templateRepository.findOne({ where: { name: 'Default' } });
  if (defaultTemplate) {
    defaultTemplate.htmlContent = standardHtml;
    defaultTemplate.description = 'Standard certificate - Clean classic design (optimized for single-page PDF)';
    await templateRepository.save(defaultTemplate);
    console.log('✅ Updated Default (Standard) template');
  } else {
    console.log('⚠️  Default template not found');
  }

  // Update Premium template
  const premiumTemplate = await templateRepository.findOne({ where: { name: 'Premium' } });
  if (premiumTemplate) {
    premiumTemplate.htmlContent = premiumHtml;
    premiumTemplate.description = 'Premium certificate - Modern gradient design with badge (optimized for single-page PDF)';
    await templateRepository.save(premiumTemplate);
    console.log('✅ Updated Premium template');
  } else {
    console.log('⚠️  Premium template not found');
  }

  // Update Executive template
  const executiveTemplate = await templateRepository.findOne({ where: { name: 'Executive' } });
  if (executiveTemplate) {
    executiveTemplate.htmlContent = executiveHtml;
    executiveTemplate.description = 'Executive certificate - Dark formal design with double borders (optimized for single-page PDF)';
    await templateRepository.save(executiveTemplate);
    console.log('✅ Updated Executive template');
  } else {
    console.log('⚠️  Executive template not found');
  }

  console.log('🎉 Certificate templates updated successfully!');
  console.log('\n📋 Template Optimizations:');
  console.log('  - Larger certificate containers (287mm × 200mm)');
  console.log('  - Reduced internal padding and margins (20-33%)');
  console.log('  - Smaller fonts (10-15% reduction)');
  console.log('  - Enhanced visual distinction between templates');
  console.log('  - Description field support added');
  console.log('  - Target: Single-page A4 landscape PDF output');
}

// Standalone execution
if (require.main === module) {
  import('../../../core/database/data-source').then(async (module) => {
    const AppDataSource = module.default;
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      console.log('Data Source initialized');

      await updateCertificateTemplates(AppDataSource);

      await AppDataSource.destroy();
      console.log('\n✨ Done! Templates are now updated in the database.');
      console.log('💡 You can now generate certificates and they should be single-page PDFs.');
      process.exit(0);
    } catch (error) {
      console.error('Error updating templates:', error);
      process.exit(1);
    }
  });
}

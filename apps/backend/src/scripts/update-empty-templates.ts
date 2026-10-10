import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { EmailTemplate } from '../modules/email-marketing/entities/email-template.entity';

/**
 * Update Empty Templates Script
 * Adds Email Builder structure to existing empty templates
 */

async function bootstrap() {
  console.log('🔧 Updating empty email templates with Email Builder structure...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const templateRepository = dataSource.getRepository(EmailTemplate);

  try {
    // Find all templates with empty or null structure
    const emptyTemplates = await templateRepository
      .createQueryBuilder('template')
      .where('template.structure IS NULL OR template.structure = :empty', { empty: {} })
      .getMany();

    console.log(`📊 Found ${emptyTemplates.length} empty templates\n`);

    if (emptyTemplates.length === 0) {
      console.log('✅ No empty templates found. All templates have structure!');
      await app.close();
      return;
    }

    // Default Email Builder structure for empty templates
    const defaultStructure = {
      rows: [
        // Row 1: Header
        {
          id: 'row-header',
          type: 'section',
          columns: [
            {
              id: 'col-header',
              width: '100%',
              blocks: [
                {
                  id: 'block-heading',
                  type: 'heading',
                  properties: {
                    level: 1,
                    content: '{{subject}}',
                  },
                  styles: {
                    color: '#1a202c',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginTop: '0',
                    marginBottom: '16px',
                  },
                },
              ],
            },
          ],
          settings: {
            padding: '32px 24px',
            backgroundColor: '#f7fafc',
          },
        },

        // Row 2: Content
        {
          id: 'row-content',
          type: 'section',
          columns: [
            {
              id: 'col-content',
              width: '100%',
              blocks: [
                {
                  id: 'block-text',
                  type: 'text',
                  properties: {
                    content: '{{content}}',
                  },
                  styles: {
                    color: '#4a5568',
                    fontSize: '16px',
                    fontWeight: 'normal',
                    textAlign: 'left',
                    lineHeight: '1.6',
                  },
                },
              ],
            },
          ],
          settings: {
            padding: '24px',
            backgroundColor: '#ffffff',
          },
        },

        // Row 3: CTA Button (if needed)
        {
          id: 'row-cta',
          type: 'section',
          columns: [
            {
              id: 'col-cta',
              width: '100%',
              blocks: [
                {
                  id: 'block-button',
                  type: 'button',
                  properties: {
                    text: '{{buttonText}}',
                    url: '{{buttonUrl}}',
                  },
                  styles: {
                    backgroundColor: '#3182ce',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: '600',
                    borderRadius: '6px',
                    paddingX: '32px',
                    paddingY: '14px',
                    align: 'center',
                  },
                },
              ],
            },
          ],
          settings: {
            padding: '24px',
            backgroundColor: '#ffffff',
          },
        },

        // Row 4: Divider
        {
          id: 'row-divider',
          type: 'section',
          columns: [
            {
              id: 'col-divider',
              width: '100%',
              blocks: [
                {
                  id: 'block-divider',
                  type: 'divider',
                  properties: {},
                  styles: {
                    color: '#e2e8f0',
                    height: '1px',
                    marginTop: '24px',
                    marginBottom: '24px',
                    borderStyle: 'solid',
                  },
                },
              ],
            },
          ],
          settings: {
            padding: '0 24px',
            backgroundColor: '#ffffff',
          },
        },

        // Row 5: Footer
        {
          id: 'row-footer',
          type: 'section',
          columns: [
            {
              id: 'col-footer',
              width: '100%',
              blocks: [
                {
                  id: 'block-footer-text',
                  type: 'text',
                  properties: {
                    content: '© 2025 {{companyName}}. All rights reserved.',
                  },
                  styles: {
                    color: '#a0aec0',
                    fontSize: '12px',
                    fontWeight: 'normal',
                    textAlign: 'center',
                    lineHeight: '1.5',
                  },
                },
              ],
            },
          ],
          settings: {
            padding: '24px',
            backgroundColor: '#f7fafc',
          },
        },
      ],
      settings: {
        backgroundColor: '#f5f5f5',
        contentWidth: '600px',
        fonts: ['Inter', 'Roboto'],
      },
    };

    // Update each empty template
    let updated = 0;
    for (const template of emptyTemplates) {
      console.log(`📝 Updating: ${template.name} (${template.id})`);

      template.structure = defaultStructure;
      template.type = 'custom'; // Ensure type is set
      template.isEditable = true;

      // Add default variables if not present
      if (!template.variables || template.variables.length === 0) {
        template.variables = ['subject', 'content', 'buttonText', 'buttonUrl', 'companyName'];
      }

      await templateRepository.save(template);
      updated++;
      console.log(`✅ Updated: ${template.name}`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total templates processed: ${emptyTemplates.length}`);
    console.log(`   Successfully updated: ${updated}`);
    console.log(`\n✅ All empty templates have been updated with Email Builder structure!`);

  } catch (error) {
    console.error('\n❌ Update failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();

import { DataSource } from 'typeorm';
import { EmailTemplate } from '../../../modules/email-marketing/entities/email-template.entity';

/**
 * Email Builder Template Seed
 * Creates sample Email Builder templates with block-based structure
 */

export async function seedEmailBuilderTemplates(dataSource: DataSource) {
  const templateRepository = dataSource.getRepository(EmailTemplate);

  // Check if Email Builder templates already exist
  const existingTemplate = await templateRepository.findOne({
    where: { name: 'Welcome Email (Email Builder)' },
  });

  if (existingTemplate) {
    console.log('✓ Email Builder templates already seeded');
    return;
  }

  const sampleStructure = {
    rows: [
      // Row 1: Header with logo
      {
        id: 'row-1',
        type: 'section',
        columns: [
          {
            id: 'col-1',
            width: '100%',
            blocks: [
              {
                id: 'block-1',
                type: 'image',
                properties: {
                  src: 'https://via.placeholder.com/200x60?text=Your+Logo',
                  alt: 'Company Logo',
                  width: '200',
                },
                styles: {
                  align: 'center',
                  borderRadius: '0',
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

      // Row 2: Welcome heading
      {
        id: 'row-2',
        type: 'section',
        columns: [
          {
            id: 'col-2',
            width: '100%',
            blocks: [
              {
                id: 'block-2',
                type: 'heading',
                properties: {
                  level: 1,
                  content: 'Welcome to Our Platform!',
                },
                styles: {
                  color: '#1a202c',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginTop: '0',
                  marginBottom: '16px',
                },
              },
              {
                id: 'block-3',
                type: 'text',
                properties: {
                  content: 'Thank you for joining us. We\'re excited to have you on board.',
                },
                styles: {
                  color: '#4a5568',
                  fontSize: '16px',
                  fontWeight: 'normal',
                  textAlign: 'center',
                  lineHeight: '1.5',
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

      // Row 3: Main content
      {
        id: 'row-3',
        type: 'section',
        columns: [
          {
            id: 'col-3',
            width: '100%',
            blocks: [
              {
                id: 'block-4',
                type: 'heading',
                properties: {
                  level: 2,
                  content: 'Get Started in 3 Simple Steps',
                },
                styles: {
                  color: '#2d3748',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  marginTop: '0',
                  marginBottom: '16px',
                },
              },
              {
                id: 'block-5',
                type: 'text',
                properties: {
                  content: '1. Complete your profile\n2. Explore our features\n3. Connect with your team',
                },
                styles: {
                  color: '#4a5568',
                  fontSize: '16px',
                  fontWeight: 'normal',
                  textAlign: 'left',
                  lineHeight: '1.8',
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

      // Row 4: CTA Button
      {
        id: 'row-4',
        type: 'section',
        columns: [
          {
            id: 'col-4',
            width: '100%',
            blocks: [
              {
                id: 'block-6',
                type: 'button',
                properties: {
                  text: 'Complete Your Profile',
                  url: 'https://example.com/profile',
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

      // Row 5: Divider
      {
        id: 'row-5',
        type: 'section',
        columns: [
          {
            id: 'col-5',
            width: '100%',
            blocks: [
              {
                id: 'block-7',
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

      // Row 6: Footer
      {
        id: 'row-6',
        type: 'section',
        columns: [
          {
            id: 'col-6',
            width: '100%',
            blocks: [
              {
                id: 'block-8',
                type: 'text',
                properties: {
                  content: 'If you have any questions, feel free to contact our support team.',
                },
                styles: {
                  color: '#718096',
                  fontSize: '14px',
                  fontWeight: 'normal',
                  textAlign: 'center',
                  lineHeight: '1.5',
                },
              },
              {
                id: 'block-9',
                type: 'text',
                properties: {
                  content: '© 2025 Your Company. All rights reserved.',
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

  const template = templateRepository.create({
    name: 'Welcome Email (Email Builder)',
    description: 'Modern welcome email built with Email Builder',
    type: 'custom',
    structure: sampleStructure,
    isActive: true,
    isEditable: true,
    version: 1,
    variables: ['userName', 'profileUrl'],
    thumbnailUrl: '/placeholders/template-welcome.png',
  });

  await templateRepository.save(template);

  console.log('✓ Email Builder templates seeded successfully');
}

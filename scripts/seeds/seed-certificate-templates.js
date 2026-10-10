const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5434,
  database: 'affexai_dev',
  user: 'postgres',
  password: 'postgres',
});

const templates = [
  {
    name: 'Standard Certificate',
    description: 'Clean and professional standard certificate design with gradient background',
    file: 'standard-template.html',
    orientation: 'landscape',
    pageFormat: 'A4',
    variables: ['recipientName', 'courseName', 'completionDate', 'certificateNumber', 'instructorName', 'logo', 'signature'],
    metadata: {
      style: 'modern',
      colorScheme: 'purple-gradient',
      fontFamily: 'Georgia'
    }
  },
  {
    name: 'Premium Certificate',
    description: 'Premium certificate design with elegant blue gradient and decorative elements',
    file: 'premium-template.html',
    orientation: 'landscape',
    pageFormat: 'A4',
    variables: ['recipientName', 'courseName', 'completionDate', 'certificateNumber', 'instructorName', 'logo', 'signature'],
    metadata: {
      style: 'premium',
      colorScheme: 'blue-gradient',
      fontFamily: 'Arial',
      features: ['rounded-corners', 'decorative-overlay']
    }
  },
  {
    name: 'Executive Certificate',
    description: 'Executive-level certificate with formal design and double border',
    file: 'executive-template.html',
    orientation: 'landscape',
    pageFormat: 'A4',
    variables: ['recipientName', 'courseName', 'completionDate', 'certificateNumber', 'instructorName', 'logo', 'signature'],
    metadata: {
      style: 'executive',
      colorScheme: 'dark-formal',
      fontFamily: 'Times New Roman',
      features: ['double-border', 'formal-layout']
    }
  }
];

async function seedCertificateTemplates() {
  try {
    console.log('🌱 Starting certificate templates seed...\n');

    await client.connect();
    console.log('✅ Connected to database\n');

    // Enable uuid extension if not exists
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    const templatesDir = path.join(__dirname, 'apps/backend/src/modules/certificates/templates');

    for (const template of templates) {
      const filePath = path.join(templatesDir, template.file);

      console.log(`📄 Reading ${template.name} from ${template.file}...`);
      const htmlContent = fs.readFileSync(filePath, 'utf8');

      console.log(`   HTML size: ${htmlContent.length} characters`);

      // Escape single quotes in HTML content for SQL
      const escapedHtml = htmlContent.replace(/'/g, "''");

      const query = `
        INSERT INTO certificate_templates (
          id, name, description, "htmlContent", variables,
          "isActive", "previewImageUrl", orientation, "pageFormat",
          metadata, "createdAt", "updatedAt"
        ) VALUES (
          uuid_generate_v4(),
          '${template.name}',
          '${template.description}',
          '${escapedHtml}',
          '${JSON.stringify(template.variables)}',
          true,
          NULL,
          '${template.orientation}',
          '${template.pageFormat}',
          '${JSON.stringify(template.metadata)}',
          NOW(),
          NOW()
        )
      `;

      await client.query(query);
      console.log(`✅ Inserted ${template.name}\n`);
    }

    console.log('🎉 Certificate templates seeded successfully!\n');

    // Verify
    const result = await client.query('SELECT id, name, orientation, "pageFormat" FROM certificate_templates');
    console.log('📊 Verification - Templates in database:');
    console.table(result.rows);

    await client.end();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error seeding certificate templates:', error);
    process.exit(1);
  }
}

seedCertificateTemplates();

const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5434,
  database: 'affexai_dev',
  user: 'postgres',
  password: 'postgres',
});

// Top-level categories
const categories = [
  {
    name: 'Technical Support',
    description: 'Technical issues, bugs, and system problems',
    parentId: null
  },
  {
    name: 'Billing & Licensing',
    description: 'Payment, invoices, and license management',
    parentId: null
  },
  {
    name: 'General Inquiry',
    description: 'General questions and information requests',
    parentId: null
  },
  {
    name: 'Feature Request',
    description: 'Suggestions for new features or improvements',
    parentId: null
  },
  {
    name: 'Training & Education',
    description: 'Training materials, courses, and learning resources',
    parentId: null
  }
];

// Templates will be created after categories (we'll update with category IDs)
const templates = [
  {
    name: 'Installation Issue',
    description: 'Template for software installation problems',
    subject: 'Problem Installing Software',
    content: `I'm experiencing issues while trying to install the software.

**Operating System**: [e.g., Windows 11, macOS 13]
**Software Version**: [e.g., v2.5.0]
**Error Message** (if any): [paste error message here]

**Steps I've Tried**:
1. [List steps you've already attempted]

**Screenshots**: [Attach screenshots if applicable]

Please assist me with the installation process.`,
    priority: 'high',
    categoryName: 'Technical Support',
    defaultTags: ['installation', 'technical'],
    isPublic: true
  },
  {
    name: 'License Activation',
    description: 'Template for license activation issues',
    subject: 'License Activation Problem',
    content: `I'm unable to activate my license.

**License Key**: [Your license key]
**Purchase Date**: [Date of purchase]
**Error Message**: [Error message shown]

**Additional Information**:
- Have you used this license before? [Yes/No]
- Number of devices: [Number]

Please help me activate my license.`,
    priority: 'high',
    categoryName: 'Billing & Licensing',
    defaultTags: ['license', 'activation'],
    isPublic: true
  },
  {
    name: 'Feature Not Working',
    description: 'Template for feature-specific issues',
    subject: 'Feature Not Working as Expected',
    content: `A specific feature is not working correctly.

**Feature Name**: [Name of the feature]
**What I Expected**: [Describe expected behavior]
**What Actually Happened**: [Describe actual behavior]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Screenshots/Videos**: [Attach if available]

Please investigate this issue.`,
    priority: 'medium',
    categoryName: 'Technical Support',
    defaultTags: ['feature', 'bug'],
    isPublic: true
  },
  {
    name: 'Invoice Request',
    description: 'Template for requesting invoices',
    subject: 'Invoice Request',
    content: `I need an invoice for my purchase.

**Order Number**: [Your order number]
**Purchase Date**: [Date of purchase]
**Amount**: [Purchase amount]

**Billing Details**:
- Company Name: [If applicable]
- Tax ID: [If applicable]
- Billing Address: [Full address]

Please send the invoice to this email address.`,
    priority: 'low',
    categoryName: 'Billing & Licensing',
    defaultTags: ['invoice', 'billing'],
    isPublic: true
  },
  {
    name: 'General Question',
    description: 'Template for general inquiries',
    subject: 'Question About [Topic]',
    content: `I have a question about [specific topic].

**My Question**:
[Write your question here in detail]

**Context** (optional):
[Provide any relevant background information]

Thank you for your assistance.`,
    priority: 'low',
    categoryName: 'General Inquiry',
    defaultTags: ['question', 'general'],
    isPublic: true
  },
  {
    name: 'Training Material Request',
    description: 'Template for requesting training resources',
    subject: 'Training Material Request',
    content: `I'm looking for training materials.

**Topic of Interest**: [Specific topic or feature]
**Current Skill Level**: [Beginner/Intermediate/Advanced]
**Preferred Format**: [Video/PDF/Interactive]

**Specific Questions**:
[List any specific things you want to learn]

Please provide relevant training resources.`,
    priority: 'low',
    categoryName: 'Training & Education',
    defaultTags: ['training', 'education'],
    isPublic: true
  },
  {
    name: 'Suggest New Feature',
    description: 'Template for feature suggestions',
    subject: 'Feature Request: [Feature Name]',
    content: `I would like to suggest a new feature.

**Feature Name**: [Short name for the feature]

**Description**:
[Detailed description of the proposed feature]

**Use Case**:
[Explain how this feature would be used]

**Benefits**:
[Explain why this would be valuable]

**Similar Examples** (optional):
[Reference similar features in other software]

Thank you for considering my suggestion.`,
    priority: 'low',
    categoryName: 'Feature Request',
    defaultTags: ['feature-request', 'enhancement'],
    isPublic: true
  },
  {
    name: 'Performance Issue',
    description: 'Template for performance problems',
    subject: 'Software Running Slowly',
    content: `The software is running slower than expected.

**When Did This Start**: [Date or "Always been slow"]
**Affected Operations**: [Which features are slow?]

**System Specifications**:
- RAM: [e.g., 16GB]
- CPU: [e.g., Intel i7]
- Storage: [e.g., SSD 500GB]

**File/Project Size**: [If applicable]

**Steps to Reproduce**:
1. [What actions cause the slowdown?]

Please help improve the performance.`,
    priority: 'medium',
    categoryName: 'Technical Support',
    defaultTags: ['performance', 'technical'],
    isPublic: true
  }
];

async function seedTicketData() {
  try {
    console.log('🌱 Starting ticket categories & templates seed...\n');

    await client.connect();
    console.log('✅ Connected to database\n');

    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Step 1: Insert categories and store their IDs
    console.log('📁 Seeding categories...\n');
    const categoryMap = {};

    for (const category of categories) {
      const result = await client.query(`
        INSERT INTO ticket_categories (
          id, name, description, "parentId", "ticketCount", "isActive", "createdAt", "updatedAt"
        ) VALUES (
          uuid_generate_v4(),
          '${category.name}',
          '${category.description.replace(/'/g, "''")}',
          NULL,
          0,
          true,
          NOW(),
          NOW()
        )
        RETURNING id
      `);

      categoryMap[category.name] = result.rows[0].id;
      console.log(`✅ Created category: ${category.name}`);
    }

    console.log('\n📝 Seeding ticket templates...\n');

    // Step 2: Insert templates with category references
    for (const template of templates) {
      const categoryId = categoryMap[template.categoryName];
      const escapedContent = template.content.replace(/'/g, "''");
      const escapedDescription = template.description.replace(/'/g, "''");

      await client.query(`
        INSERT INTO ticket_templates (
          id, name, description, subject, content, priority,
          "categoryId", "defaultTags", "customFields", "isActive",
          "isPublic", "createdById", "usageCount", "createdAt", "updatedAt"
        ) VALUES (
          uuid_generate_v4(),
          '${template.name}',
          '${escapedDescription}',
          '${template.subject}',
          '${escapedContent}',
          '${template.priority}',
          '${categoryId}',
          '${JSON.stringify(template.defaultTags)}',
          '{}',
          true,
          ${template.isPublic},
          NULL,
          0,
          NOW(),
          NOW()
        )
      `);

      console.log(`✅ Created template: ${template.name} → ${template.categoryName}`);
    }

    console.log('\n🎉 Ticket data seeded successfully!\n');

    // Verification
    const catResult = await client.query('SELECT id, name, "ticketCount" FROM ticket_categories');
    console.log('📊 Categories in database:');
    console.table(catResult.rows);

    const templateResult = await client.query('SELECT id, name, priority, subject FROM ticket_templates');
    console.log('\n📊 Templates in database:');
    console.table(templateResult.rows);

    await client.end();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error seeding ticket data:', error);
    process.exit(1);
  }
}

seedTicketData();

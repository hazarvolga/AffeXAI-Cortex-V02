const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5434,
  database: 'affexai_dev',
  user: 'postgres',
  password: 'postgres',
});

const emailTemplates = [
  {
    name: 'Welcome Email',
    description: 'Welcome new users after registration',
    type: 'custom',
    isDefault: true,
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Welcome to Affexai</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #667eea;">Welcome to Affexai Platform!</h1>
    <p>Hi {{recipientName}},</p>
    <p>Thank you for joining Affexai! We're excited to have you on board.</p>
    <p>Your account has been successfully created. You can now:</p>
    <ul>
      <li>Access the customer portal</li>
      <li>Submit support tickets</li>
      <li>Chat with our AI assistant</li>
      <li>Browse knowledge base articles</li>
    </ul>
    <div style="margin: 30px 0;">
      <a href="{{portalUrl}}" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Portal</a>
    </div>
    <p>If you have any questions, feel free to reach out to our support team.</p>
    <p>Best regards,<br>The Affexai Team</p>
  </div>
</body>
</html>`,
    variables: { recipientName: 'string', portalUrl: 'string' }
  },
  {
    name: 'Email Verification',
    description: 'Verify user email address',
    type: 'custom',
    isDefault: true,
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #667eea;">Verify Your Email Address</h1>
    <p>Hi {{recipientName}},</p>
    <p>Thank you for registering with Affexai. Please verify your email address by clicking the button below:</p>
    <div style="margin: 30px 0;">
      <a href="{{verificationUrl}}" style="background-color: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="color: #666; word-break: break-all;">{{verificationUrl}}</p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't create an account, please ignore this email.</p>
    <p>Best regards,<br>The Affexai Team</p>
  </div>
</body>
</html>`,
    variables: { recipientName: 'string', verificationUrl: 'string' }
  },
  {
    name: 'Password Reset',
    description: 'Reset user password',
    type: 'custom',
    isDefault: true,
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #667eea;">Reset Your Password</h1>
    <p>Hi {{recipientName}},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <div style="margin: 30px 0;">
      <a href="{{resetUrl}}" style="background-color: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="color: #666; word-break: break-all;">{{resetUrl}}</p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
    <p>Best regards,<br>The Affexai Team</p>
  </div>
</body>
</html>`,
    variables: { recipientName: 'string', resetUrl: 'string' }
  },
  {
    name: 'Certificate Delivery',
    description: 'Send certificate to recipient',
    type: 'custom',
    isDefault: true,
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Your Certificate is Ready</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #667eea;">🎉 Congratulations!</h1>
    <p>Hi {{recipientName}},</p>
    <p>Your certificate for <strong>{{courseName}}</strong> is now ready!</p>
    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Certificate Details</h3>
      <p><strong>Course:</strong> {{courseName}}</p>
      <p><strong>Completion Date:</strong> {{completionDate}}</p>
      <p><strong>Certificate Number:</strong> {{certificateNumber}}</p>
    </div>
    <div style="margin: 30px 0;">
      <a href="{{downloadUrl}}" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Download Certificate</a>
    </div>
    <p>You can also verify your certificate at: {{verificationUrl}}</p>
    <p>Congratulations on your achievement!</p>
    <p>Best regards,<br>The Affexai Team</p>
  </div>
</body>
</html>`,
    variables: {
      recipientName: 'string',
      courseName: 'string',
      completionDate: 'string',
      certificateNumber: 'string',
      downloadUrl: 'string',
      verificationUrl: 'string'
    }
  },
  {
    name: 'Ticket Created',
    description: 'Confirmation email when ticket is created',
    type: 'custom',
    isDefault: false,
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Support Ticket Created</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #667eea;">Support Ticket Created</h1>
    <p>Hi {{recipientName}},</p>
    <p>Your support ticket has been created successfully.</p>
    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Ticket Details</h3>
      <p><strong>Ticket ID:</strong> #{{ticketId}}</p>
      <p><strong>Subject:</strong> {{subject}}</p>
      <p><strong>Priority:</strong> {{priority}}</p>
      <p><strong>Status:</strong> {{status}}</p>
    </div>
    <p>We'll review your ticket and respond as soon as possible. Expected response time: <strong>{{slaTime}}</strong></p>
    <div style="margin: 30px 0;">
      <a href="{{ticketUrl}}" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Ticket</a>
    </div>
    <p>Best regards,<br>Affexai Support Team</p>
  </div>
</body>
</html>`,
    variables: {
      recipientName: 'string',
      ticketId: 'string',
      subject: 'string',
      priority: 'string',
      status: 'string',
      slaTime: 'string',
      ticketUrl: 'string'
    }
  },
  {
    name: 'Ticket Resolved',
    description: 'Notification when ticket is resolved',
    type: 'custom',
    isDefault: false,
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket Resolved</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #22c55e;">✅ Ticket Resolved</h1>
    <p>Hi {{recipientName}},</p>
    <p>Your support ticket <strong>#{{ticketId}}</strong> has been resolved.</p>
    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Subject:</strong> {{subject}}</p>
      <p><strong>Resolution:</strong> {{resolution}}</p>
    </div>
    <p>We'd love to hear your feedback on our support:</p>
    <div style="margin: 30px 0;">
      <a href="{{csatUrl}}" style="background-color: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Rate Our Support</a>
    </div>
    <p>If you need further assistance, feel free to reopen this ticket or create a new one.</p>
    <p>Best regards,<br>Affexai Support Team</p>
  </div>
</body>
</html>`,
    variables: {
      recipientName: 'string',
      ticketId: 'string',
      subject: 'string',
      resolution: 'string',
      csatUrl: 'string'
    }
  },
  {
    name: 'Event Registration Confirmation',
    description: 'Confirm event registration',
    type: 'custom',
    isDefault: false,
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Event Registration Confirmed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #667eea;">🎉 Registration Confirmed!</h1>
    <p>Hi {{recipientName}},</p>
    <p>You're all set for <strong>{{eventName}}</strong>!</p>
    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Event Details</h3>
      <p><strong>Event:</strong> {{eventName}}</p>
      <p><strong>Date:</strong> {{eventDate}}</p>
      <p><strong>Time:</strong> {{eventTime}}</p>
      <p><strong>Location:</strong> {{location}}</p>
    </div>
    <p>Please save this email for your records.</p>
    <div style="margin: 30px 0;">
      <a href="{{eventUrl}}" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Event Details</a>
    </div>
    <p>Looking forward to seeing you there!</p>
    <p>Best regards,<br>The Affexai Team</p>
  </div>
</body>
</html>`,
    variables: {
      recipientName: 'string',
      eventName: 'string',
      eventDate: 'string',
      eventTime: 'string',
      location: 'string',
      eventUrl: 'string'
    }
  },
  {
    name: 'Newsletter Subscription Welcome',
    description: 'Welcome email for newsletter subscribers',
    type: 'custom',
    isDefault: false,
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Welcome to Our Newsletter</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #667eea;">Welcome to Our Newsletter! 📧</h1>
    <p>Hi {{recipientName}},</p>
    <p>Thank you for subscribing to our newsletter! You'll now receive:</p>
    <ul>
      <li>Product updates and new features</li>
      <li>Educational content and tutorials</li>
      <li>Industry insights and best practices</li>
      <li>Special offers and announcements</li>
    </ul>
    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Manage Your Preferences</h3>
      <p>Want to customize what you receive? Visit your preferences page:</p>
      <a href="{{preferencesUrl}}" style="color: #667eea;">Update Preferences</a>
    </div>
    <p>We respect your inbox and promise to send only valuable content.</p>
    <p>Best regards,<br>The Affexai Team</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="font-size: 12px; color: #666;">
      You can <a href="{{unsubscribeUrl}}" style="color: #666;">unsubscribe</a> at any time.
    </p>
  </div>
</body>
</html>`,
    variables: {
      recipientName: 'string',
      preferencesUrl: 'string',
      unsubscribeUrl: 'string'
    }
  }
];

async function seedEmailTemplates() {
  try {
    console.log('🌱 Starting email templates seed...\n');

    await client.connect();
    console.log('✅ Connected to database\n');

    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    for (const template of emailTemplates) {
      const escapedContent = template.content.replace(/'/g, "''");
      const escapedDescription = template.description.replace(/'/g, "''");

      const query = `
        INSERT INTO email_templates (
          id, name, description, content, "thumbnailUrl",
          "isDefault", type, "fileTemplateName", variables,
          "isActive", "createdAt", "updatedAt"
        ) VALUES (
          uuid_generate_v4(),
          '${template.name}',
          '${escapedDescription}',
          '${escapedContent}',
          NULL,
          ${template.isDefault},
          '${template.type}',
          NULL,
          '${JSON.stringify(template.variables)}',
          true,
          NOW(),
          NOW()
        )
      `;

      await client.query(query);
      console.log(`✅ Inserted: ${template.name}`);
    }

    console.log('\n🎉 Email templates seeded successfully!\n');

    const result = await client.query('SELECT id, name, type, "isDefault" FROM email_templates');
    console.log('📊 Verification - Templates in database:');
    console.table(result.rows);

    await client.end();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error seeding email templates:', error);
    process.exit(1);
  }
}

seedEmailTemplates();

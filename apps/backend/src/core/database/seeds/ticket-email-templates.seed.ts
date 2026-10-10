import { DataSource } from 'typeorm';
import { EmailTemplate } from '../../../modules/email-marketing/entities/email-template.entity';

/**
 * Ticket Email Templates Seed
 * Creates 9 ticket notification email templates with MJML Email Builder structure
 *
 * Templates:
 * 1. ticket-created-customer - Customer: Your ticket was created
 * 2. ticket-created-support - Support: New ticket assigned
 * 3. ticket-assigned - Support: Ticket assigned to you
 * 4. ticket-new-message - Both: New message in ticket
 * 5. ticket-resolved - Customer: Your ticket was resolved
 * 6. ticket-escalated - Management: Ticket escalated
 * 7. sla-approaching-alert - Support: SLA deadline approaching
 * 8. sla-breach-alert - Management: SLA breach!
 * 9. csat-survey - Customer: Satisfaction survey
 */

export async function seedTicketEmailTemplates(dataSource: DataSource) {
  const templateRepository = dataSource.getRepository(EmailTemplate);

  // Check if templates already exist
  const existingTemplate = await templateRepository.findOne({
    where: { name: 'ticket-created-customer' },
  });

  if (existingTemplate) {
    console.log('✓ Ticket email templates already seeded');
    return;
  }

  const templates = [
    // 1. Ticket Created - Customer
    {
      name: 'ticket-created-customer',
      description: 'Customer notification when ticket is created',
      type: 'custom' as const,
      structure: {
        rows: [
          // Header with emoji
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
                    type: 'heading',
                    properties: {
                      level: 1,
                      content: '✅ Destek Talebiniz Alındı',
                    },
                    styles: {
                      color: '#1e293b',
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
              padding: '32px 24px 16px',
              backgroundColor: '#ffffff',
            },
          },

          // Greeting
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
                    type: 'text',
                    properties: {
                      content: 'Merhaba {{customerName}},',
                    },
                    styles: {
                      color: '#334155',
                      fontSize: '16px',
                      fontWeight: 'normal',
                      textAlign: 'left',
                      lineHeight: '1.6',
                      marginBottom: '12px',
                    },
                  },
                  {
                    id: 'block-3',
                    type: 'text',
                    properties: {
                      content: 'Destek talebiniz başarıyla oluşturuldu ve ekibimiz en kısa sürede size dönüş yapacaktır.',
                    },
                    styles: {
                      color: '#334155',
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
              padding: '0 24px',
              backgroundColor: '#ffffff',
            },
          },

          // Info box with ticket details
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
                    type: 'text',
                    properties: {
                      content: `<div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px; font-weight: 500;">📋 Talep Numarası:</p>
                        <p style="margin: 0 0 16px 0; color: #1e293b; font-size: 18px; font-weight: 600;">{{displayNumber}}</p>

                        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 16px 0;" />

                        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px; font-weight: 500;">📝 Konu:</p>
                        <p style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px; font-weight: 600;">{{subject}}</p>

                        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 16px 0;" />

                        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px; font-weight: 500;">⚡ Öncelik:</p>
                        <p style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 600; text-transform: capitalize;">{{priority}}</p>
                      </div>`,
                    },
                    styles: {
                      color: '#334155',
                      fontSize: '16px',
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

          // CTA Button
          {
            id: 'row-4',
            type: 'section',
            columns: [
              {
                id: 'col-4',
                width: '100%',
                blocks: [
                  {
                    id: 'block-5',
                    type: 'button',
                    properties: {
                      text: '🎫 Talebi Görüntüle',
                      url: '{{ticketUrl}}',
                    },
                    styles: {
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '600',
                      borderRadius: '8px',
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

          // Footer note
          {
            id: 'row-5',
            type: 'section',
            columns: [
              {
                id: 'col-5',
                width: '100%',
                blocks: [
                  {
                    id: 'block-6',
                    type: 'text',
                    properties: {
                      content: 'Talebinizle ilgili güncellemeler email adresinize gönderilecektir.',
                    },
                    styles: {
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: 'normal',
                      textAlign: 'center',
                      lineHeight: '1.5',
                    },
                  },
                ],
              },
            ],
            settings: {
              padding: '24px 24px 32px',
              backgroundColor: '#ffffff',
            },
          },
        ],
        settings: {
          backgroundColor: '#f5f5f5',
          contentWidth: '600px',
          fonts: ['Inter', 'Roboto'],
        },
      },
      isActive: true,
      isEditable: true,
      version: 1,
      variables: ['customerName', 'displayNumber', 'subject', 'priority', 'ticketUrl'],
    },

    // 2. Ticket Created - Support Team
    {
      name: 'ticket-created-support',
      description: 'Support team notification for new ticket',
      type: 'custom' as const,
      structure: {
        rows: [
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
                    type: 'heading',
                    properties: {
                      level: 1,
                      content: '🆕 Yeni Destek Talebi',
                    },
                    styles: {
                      color: '#1e293b',
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
              padding: '32px 24px 16px',
              backgroundColor: '#ffffff',
            },
          },
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
                    type: 'text',
                    properties: {
                      content: `<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
                        <p style="margin: 0; color: #92400e; font-weight: 600;">⚠️ Yeni bir destek talebi oluşturuldu</p>
                      </div>

                      <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 12px;">
                        <strong>Müşteri:</strong> {{customerName}}<br>
                        <strong>Email:</strong> {{customerEmail}}<br>
                        <strong>Talep No:</strong> {{displayNumber}}<br>
                        <strong>Konu:</strong> {{subject}}<br>
                        <strong>Öncelik:</strong> <span style="text-transform: capitalize; font-weight: 600; color: #ef4444;">{{priority}}</span><br>
                        <strong>Kategori:</strong> {{categoryName}}
                      </p>

                      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 4px; margin-top: 16px;">
                        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Problem Açıklaması:</p>
                        <p style="margin: 0; color: #1e293b; font-size: 14px; line-height: 1.6;">{{ticketDescription}}</p>
                      </div>`,
                    },
                    styles: {
                      color: '#334155',
                      fontSize: '16px',
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
          {
            id: 'row-3',
            type: 'section',
            columns: [
              {
                id: 'col-3',
                width: '100%',
                blocks: [
                  {
                    id: 'block-3',
                    type: 'button',
                    properties: {
                      text: '📋 Talebi Görüntüle',
                      url: '{{ticketUrl}}',
                    },
                    styles: {
                      backgroundColor: '#f59e0b',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '600',
                      borderRadius: '8px',
                      paddingX: '32px',
                      paddingY: '14px',
                      align: 'center',
                    },
                  },
                ],
              },
            ],
            settings: {
              padding: '24px 24px 32px',
              backgroundColor: '#ffffff',
            },
          },
        ],
        settings: {
          backgroundColor: '#f5f5f5',
          contentWidth: '600px',
          fonts: ['Inter', 'Roboto'],
        },
      },
      isActive: true,
      isEditable: true,
      version: 1,
      variables: ['customerName', 'customerEmail', 'displayNumber', 'subject', 'priority', 'categoryName', 'ticketDescription', 'ticketUrl'],
    },

    // 3. Ticket Assigned
    {
      name: 'ticket-assigned',
      description: 'Support agent notification when ticket is assigned',
      type: 'custom' as const,
      structure: {
        rows: [
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
                    type: 'heading',
                    properties: {
                      level: 1,
                      content: '📌 Size Bir Talep Atandı',
                    },
                    styles: {
                      color: '#1e293b',
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
              padding: '32px 24px 16px',
              backgroundColor: '#ffffff',
            },
          },
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
                    type: 'text',
                    properties: {
                      content: `Merhaba {{assigneeName}},<br><br>
                      Size yeni bir destek talebi atandı.<br><br>
                      <strong>Talep No:</strong> {{displayNumber}}<br>
                      <strong>Müşteri:</strong> {{customerName}}<br>
                      <strong>Konu:</strong> {{subject}}<br>
                      <strong>Öncelik:</strong> <span style="text-transform: capitalize; color: #ef4444; font-weight: 600;">{{priority}}</span>`,
                    },
                    styles: {
                      color: '#334155',
                      fontSize: '16px',
                      lineHeight: '1.6',
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
          {
            id: 'row-3',
            type: 'section',
            columns: [
              {
                id: 'col-3',
                width: '100%',
                blocks: [
                  {
                    id: 'block-3',
                    type: 'button',
                    properties: {
                      text: '🎯 Talebi Görüntüle',
                      url: '{{ticketUrl}}',
                    },
                    styles: {
                      backgroundColor: '#8b5cf6',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '600',
                      borderRadius: '8px',
                      paddingX: '32px',
                      paddingY: '14px',
                      align: 'center',
                    },
                  },
                ],
              },
            ],
            settings: {
              padding: '24px 24px 32px',
              backgroundColor: '#ffffff',
            },
          },
        ],
        settings: {
          backgroundColor: '#f5f5f5',
          contentWidth: '600px',
          fonts: ['Inter', 'Roboto'],
        },
      },
      isActive: true,
      isEditable: true,
      version: 1,
      variables: ['assigneeName', 'displayNumber', 'customerName', 'subject', 'priority', 'ticketUrl'],
    },

    // 4. New Message
    {
      name: 'ticket-new-message',
      description: 'Notification when new message is added to ticket',
      type: 'custom' as const,
      structure: {
        rows: [
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
                    type: 'heading',
                    properties: {
                      level: 1,
                      content: '💬 Talebinize Yeni Mesaj',
                    },
                    styles: {
                      color: '#1e293b',
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
              padding: '32px 24px 16px',
              backgroundColor: '#ffffff',
            },
          },
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
                    type: 'text',
                    properties: {
                      content: `Merhaba {{recipientName}},<br><br>
                      <strong>{{displayNumber}}</strong> numaralı talebinize yeni bir mesaj eklendi.<br><br>
                      <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 20px 0;">
                        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px;">{{senderName}} yazdı:</p>
                        <p style="margin: 0; color: #1e293b; font-size: 14px; line-height: 1.6;">{{messagePreview}}</p>
                      </div>`,
                    },
                    styles: {
                      color: '#334155',
                      fontSize: '16px',
                      lineHeight: '1.6',
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
          {
            id: 'row-3',
            type: 'section',
            columns: [
              {
                id: 'col-3',
                width: '100%',
                blocks: [
                  {
                    id: 'block-3',
                    type: 'button',
                    properties: {
                      text: '💬 Mesajı Görüntüle ve Yanıtla',
                      url: '{{ticketUrl}}',
                    },
                    styles: {
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '600',
                      borderRadius: '8px',
                      paddingX: '32px',
                      paddingY: '14px',
                      align: 'center',
                    },
                  },
                ],
              },
            ],
            settings: {
              padding: '24px 24px 32px',
              backgroundColor: '#ffffff',
            },
          },
        ],
        settings: {
          backgroundColor: '#f5f5f5',
          contentWidth: '600px',
          fonts: ['Inter', 'Roboto'],
        },
      },
      isActive: true,
      isEditable: true,
      version: 1,
      variables: ['recipientName', 'displayNumber', 'senderName', 'messagePreview', 'ticketUrl'],
    },

    // 5. Ticket Resolved
    {
      name: 'ticket-resolved',
      description: 'Customer notification when ticket is resolved',
      type: 'custom' as const,
      structure: {
        rows: [
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
                    type: 'heading',
                    properties: {
                      level: 1,
                      content: '✅ Talebiniz Çözüldü',
                    },
                    styles: {
                      color: '#16a34a',
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
              padding: '32px 24px 16px',
              backgroundColor: '#ffffff',
            },
          },
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
                    type: 'text',
                    properties: {
                      content: `Merhaba {{customerName}},<br><br>
                      <strong>{{displayNumber}}</strong> numaralı destek talebiniz çözüldü olarak işaretlendi.<br><br>
                      <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 16px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #166534; font-size: 14px;">
                          ✨ Ekibimiz sorununuzu çözdü. Eğer sorun devam ediyorsa veya başka bir konuda yardıma ihtiyacınız varsa, lütfen talebi yeniden açın veya yeni bir talep oluşturun.
                        </p>
                      </div>`,
                    },
                    styles: {
                      color: '#334155',
                      fontSize: '16px',
                      lineHeight: '1.6',
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
          {
            id: 'row-3',
            type: 'section',
            columns: [
              {
                id: 'col-3',
                width: '100%',
                blocks: [
                  {
                    id: 'block-3',
                    type: 'button',
                    properties: {
                      text: '📋 Talebi Görüntüle',
                      url: '{{ticketUrl}}',
                    },
                    styles: {
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '600',
                      borderRadius: '8px',
                      paddingX: '32px',
                      paddingY: '14px',
                      align: 'center',
                    },
                  },
                ],
              },
            ],
            settings: {
              padding: '24px 24px 32px',
              backgroundColor: '#ffffff',
            },
          },
        ],
        settings: {
          backgroundColor: '#f5f5f5',
          contentWidth: '600px',
          fonts: ['Inter', 'Roboto'],
        },
      },
      isActive: true,
      isEditable: true,
      version: 1,
      variables: ['customerName', 'displayNumber', 'ticketUrl'],
    },

    // 6. Ticket Escalated
    {
      name: 'ticket-escalated',
      description: 'Management notification when ticket is escalated',
      type: 'custom' as const,
      structure: {
        rows: [
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
                    type: 'heading',
                    properties: {
                      level: 1,
                      content: '⚠️ Talep Yükseltildi',
                    },
                    styles: {
                      color: '#dc2626',
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
              padding: '32px 24px 16px',
              backgroundColor: '#ffffff',
            },
          },
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
                    type: 'text',
                    properties: {
                      content: `<div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
                        <p style="margin: 0; color: #991b1b; font-weight: 600;">🚨 Bir destek talebi yöneticilere yükseltildi</p>
                      </div>

                      <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                        <strong>Talep No:</strong> {{displayNumber}}<br>
                        <strong>Müşteri:</strong> {{customerName}}<br>
                        <strong>Konu:</strong> {{subject}}<br>
                        <strong>Öncelik:</strong> <span style="text-transform: capitalize; color: #dc2626; font-weight: 600;">{{priority}}</span><br>
                        <strong>Yükselten:</strong> {{escalatedBy}}<br>
                        <strong>Sebep:</strong> {{escalationReason}}
                      </p>`,
                    },
                    styles: {
                      color: '#334155',
                      fontSize: '16px',
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
          {
            id: 'row-3',
            type: 'section',
            columns: [
              {
                id: 'col-3',
                width: '100%',
                blocks: [
                  {
                    id: 'block-3',
                    type: 'button',
                    properties: {
                      text: '⚡ Acil - Talebi Görüntüle',
                      url: '{{ticketUrl}}',
                    },
                    styles: {
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '600',
                      borderRadius: '8px',
                      paddingX: '32px',
                      paddingY: '14px',
                      align: 'center',
                    },
                  },
                ],
              },
            ],
            settings: {
              padding: '24px 24px 32px',
              backgroundColor: '#ffffff',
            },
          },
        ],
        settings: {
          backgroundColor: '#f5f5f5',
          contentWidth: '600px',
          fonts: ['Inter', 'Roboto'],
        },
      },
      isActive: true,
      isEditable: true,
      version: 1,
      variables: ['displayNumber', 'customerName', 'subject', 'priority', 'escalatedBy', 'escalationReason', 'ticketUrl'],
    },

    // 7. SLA Approaching Alert
    {
      name: 'sla-approaching-alert',
      description: 'Support notification when SLA deadline is approaching',
      type: 'custom' as const,
      structure: {
        rows: [
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
                    type: 'heading',
                    properties: {
                      level: 1,
                      content: '⏰ SLA Süresi Yaklaşıyor',
                    },
                    styles: {
                      color: '#f59e0b',
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
              padding: '32px 24px 16px',
              backgroundColor: '#ffffff',
            },
          },
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
                    type: 'text',
                    properties: {
                      content: `<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
                        <p style="margin: 0; color: #92400e; font-weight: 600;">⚠️ SLA bitiş süresi yaklaşıyor!</p>
                      </div>

                      <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                        <strong>Talep No:</strong> {{displayNumber}}<br>
                        <strong>Müşteri:</strong> {{customerName}}<br>
                        <strong>Kalan Süre:</strong> <span style="color: #f59e0b; font-weight: 600;">{{timeRemaining}}</span><br>
                        <strong>Hedef Çözüm Zamanı:</strong> {{targetTime}}<br>
                        <strong>Öncelik:</strong> <span style="text-transform: capitalize; font-weight: 600;">{{priority}}</span>
                      </p>`,
                    },
                    styles: {
                      color: '#334155',
                      fontSize: '16px',
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
          {
            id: 'row-3',
            type: 'section',
            columns: [
              {
                id: 'col-3',
                width: '100%',
                blocks: [
                  {
                    id: 'block-3',
                    type: 'button',
                    properties: {
                      text: '⏱️ Acil - Talebi Görüntüle',
                      url: '{{ticketUrl}}',
                    },
                    styles: {
                      backgroundColor: '#f59e0b',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '600',
                      borderRadius: '8px',
                      paddingX: '32px',
                      paddingY: '14px',
                      align: 'center',
                    },
                  },
                ],
              },
            ],
            settings: {
              padding: '24px 24px 32px',
              backgroundColor: '#ffffff',
            },
          },
        ],
        settings: {
          backgroundColor: '#f5f5f5',
          contentWidth: '600px',
          fonts: ['Inter', 'Roboto'],
        },
      },
      isActive: true,
      isEditable: true,
      version: 1,
      variables: ['displayNumber', 'customerName', 'timeRemaining', 'targetTime', 'priority', 'ticketUrl'],
    },

    // 8. SLA Breach Alert
    {
      name: 'sla-breach-alert',
      description: 'Management alert when SLA is breached',
      type: 'custom' as const,
      structure: {
        rows: [
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
                    type: 'heading',
                    properties: {
                      level: 1,
                      content: '🚨 SLA İhlali!',
                    },
                    styles: {
                      color: '#dc2626',
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
              padding: '32px 24px 16px',
              backgroundColor: '#ffffff',
            },
          },
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
                    type: 'text',
                    properties: {
                      content: `<div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
                        <p style="margin: 0; color: #991b1b; font-weight: 700; font-size: 16px;">⛔ KRİTİK: SLA hedefi aşıldı!</p>
                      </div>

                      <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                        <strong>Talep No:</strong> {{displayNumber}}<br>
                        <strong>Müşteri:</strong> {{customerName}}<br>
                        <strong>Gecikme Süresi:</strong> <span style="color: #dc2626; font-weight: 600;">{{breachTime}}</span><br>
                        <strong>Hedef Süre:</strong> {{targetTime}}<br>
                        <strong>Öncelik:</strong> <span style="text-transform: capitalize; font-weight: 600;">{{priority}}</span><br>
                        <strong>Atanmış Kişi:</strong> {{assigneeName}}
                      </p>

                      <div style="background-color: #fee2e2; padding: 12px; border-radius: 4px; margin-top: 16px;">
                        <p style="margin: 0; color: #7f1d1d; font-size: 14px; font-weight: 500;">
                          ⚠️ Bu talep acil müdahale gerektirmektedir!
                        </p>
                      </div>`,
                    },
                    styles: {
                      color: '#334155',
                      fontSize: '16px',
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
          {
            id: 'row-3',
            type: 'section',
            columns: [
              {
                id: 'col-3',
                width: '100%',
                blocks: [
                  {
                    id: 'block-3',
                    type: 'button',
                    properties: {
                      text: '🚨 ACİL - Hemen Müdahale Et',
                      url: '{{ticketUrl}}',
                    },
                    styles: {
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '700',
                      borderRadius: '8px',
                      paddingX: '32px',
                      paddingY: '14px',
                      align: 'center',
                    },
                  },
                ],
              },
            ],
            settings: {
              padding: '24px 24px 32px',
              backgroundColor: '#ffffff',
            },
          },
        ],
        settings: {
          backgroundColor: '#f5f5f5',
          contentWidth: '600px',
          fonts: ['Inter', 'Roboto'],
        },
      },
      isActive: true,
      isEditable: true,
      version: 1,
      variables: ['displayNumber', 'customerName', 'breachTime', 'targetTime', 'priority', 'assigneeName', 'ticketUrl'],
    },

    // 9. CSAT Survey
    {
      name: 'csat-survey',
      description: 'Customer satisfaction survey after ticket resolution',
      type: 'custom' as const,
      structure: {
        rows: [
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
                    type: 'heading',
                    properties: {
                      level: 1,
                      content: '⭐ Memnuniyet Anketi',
                    },
                    styles: {
                      color: '#1e293b',
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
              padding: '32px 24px 16px',
              backgroundColor: '#ffffff',
            },
          },
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
                    type: 'text',
                    properties: {
                      content: `Merhaba {{customerName}},<br><br>
                      <strong>{{displayNumber}}</strong> numaralı destek talebiniz çözüldü. Hizmetimiz hakkında görüşlerinizi öğrenmek isteriz.<br><br>
                      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px; font-weight: 500;">Destek hizmetimizden ne kadar memnun kaldınız?</p>
                        <div style="font-size: 32px; margin: 8px 0;">
                          ⭐ ⭐ ⭐ ⭐ ⭐
                        </div>
                        <p style="margin: 12px 0 0 0; color: #64748b; font-size: 12px;">Anketi tamamlamak sadece 30 saniye sürer</p>
                      </div>`,
                    },
                    styles: {
                      color: '#334155',
                      fontSize: '16px',
                      lineHeight: '1.6',
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
          {
            id: 'row-3',
            type: 'section',
            columns: [
              {
                id: 'col-3',
                width: '100%',
                blocks: [
                  {
                    id: 'block-3',
                    type: 'button',
                    properties: {
                      text: '⭐ Anketi Tamamla',
                      url: '{{surveyUrl}}',
                    },
                    styles: {
                      backgroundColor: '#8b5cf6',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '600',
                      borderRadius: '8px',
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
          {
            id: 'row-4',
            type: 'section',
            columns: [
              {
                id: 'col-4',
                width: '100%',
                blocks: [
                  {
                    id: 'block-4',
                    type: 'text',
                    properties: {
                      content: 'Görüşleriniz bizim için çok değerli. Teşekkür ederiz!',
                    },
                    styles: {
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: 'normal',
                      textAlign: 'center',
                      lineHeight: '1.5',
                    },
                  },
                ],
              },
            ],
            settings: {
              padding: '0 24px 32px',
              backgroundColor: '#ffffff',
            },
          },
        ],
        settings: {
          backgroundColor: '#f5f5f5',
          contentWidth: '600px',
          fonts: ['Inter', 'Roboto'],
        },
      },
      isActive: true,
      isEditable: true,
      version: 1,
      variables: ['customerName', 'displayNumber', 'surveyUrl'],
    },
  ];

  // Save all templates
  for (const templateData of templates) {
    const template = templateRepository.create(templateData);
    await templateRepository.save(template);
    console.log(`✓ Created template: ${templateData.name}`);
  }

  console.log(`\n✅ Successfully seeded ${templates.length} ticket email templates`);
}

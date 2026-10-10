import { DataSource } from 'typeorm';
import { EmailTemplate, TemplateType } from '../../../modules/email-marketing/entities/email-template.entity';

/**
 * Core Email Templates Seed
 * Migrates 7 core templates to the MJML Email Builder structure
 */

export async function seedCoreEmailTemplates(dataSource: DataSource) {
    const templateRepository = dataSource.getRepository(EmailTemplate);

    // Check if any of the core templates already exist in database format
    const welcomeTemplateExists = await templateRepository.findOne({
        where: { name: 'Welcome Email' },
    });

    if (welcomeTemplateExists) {
        console.log('✓ Core email templates already seeded');
        return;
    }

    const templates = [
        // 1. Welcome Email
        {
            name: 'Welcome Email',
            description: 'Hoş geldiniz e-postası',
            type: 'custom',
            structure: {
                rows: [
                    {
                        id: 'row-welcome-1',
                        type: 'section',
                        columns: [
                            {
                                id: 'col-welcome-1',
                                width: '100%',
                                blocks: [
                                    {
                                        id: 'block-welcome-1',
                                        type: 'heading',
                                        properties: { level: 1, content: 'Hoş Geldiniz!' },
                                        styles: { color: '#1a1a1a', fontSize: '24px', fontWeight: 'bold', textAlign: 'center' },
                                    },
                                    {
                                        id: 'block-welcome-2',
                                        type: 'text',
                                        properties: { content: 'Merhaba {{userName}},<br><br>Topluluğumuza katıldığınız için mutluyuz.' },
                                        styles: { color: '#3c4043', fontSize: '16px', lineHeight: '1.5' },
                                    },
                                    {
                                        id: 'block-welcome-3',
                                        type: 'button',
                                        properties: { text: 'Portalı Keşfet', url: '{{portalUrl}}' },
                                        styles: { backgroundColor: '#ED7D31', color: '#ffffff', borderRadius: '6px', padding: '14px 24px', align: 'center' },
                                    }
                                ],
                            }
                        ],
                        settings: { padding: '20px', backgroundColor: '#ffffff' },
                    }
                ],
                settings: { backgroundColor: '#f6f9fc', contentWidth: '600px' }
            },
            isActive: true,
            isEditable: true,
            version: 1,
            variables: ['userName', 'portalUrl'],
        },
        // 2. Email Verification
        {
            name: 'Email Verification',
            description: 'E-posta doğrulama',
            type: 'custom',
            structure: {
                rows: [
                    {
                        id: 'row-verify-1',
                        type: 'section',
                        columns: [
                            {
                                id: 'col-verify-1',
                                width: '100%',
                                blocks: [
                                    {
                                        id: 'block-verify-1',
                                        type: 'heading',
                                        properties: { level: 1, content: 'E-posta Adresinizi Doğrulayın' },
                                        styles: { color: '#1a1a1a', fontSize: '24px', fontWeight: 'bold', textAlign: 'center' },
                                    },
                                    {
                                        id: 'block-verify-2',
                                        type: 'text',
                                        properties: { content: 'Hesabınızı etkinleştirmek için lütfen aşağıdaki butona tıklayın.' },
                                        styles: { color: '#3c4043', fontSize: '16px', textAlign: 'center' },
                                    },
                                    {
                                        id: 'block-verify-3',
                                        type: 'button',
                                        properties: { text: 'E-postamı Doğrula', url: '{{verificationLink}}' },
                                        styles: { backgroundColor: '#ED7D31', color: '#ffffff', borderRadius: '6px', align: 'center' },
                                    }
                                ],
                            }
                        ],
                        settings: { padding: '20px', backgroundColor: '#ffffff' },
                    }
                ],
                settings: { backgroundColor: '#f6f9fc', contentWidth: '600px' }
            },
            isActive: true,
            isEditable: true,
            version: 1,
            variables: ['userName', 'verificationLink'],
        },
        // 3. Password Reset
        {
            name: 'Password Reset',
            description: 'Parola sıfırlama',
            type: 'custom',
            structure: {
                rows: [
                    {
                        id: 'row-reset-1',
                        type: 'section',
                        columns: [
                            {
                                id: 'col-reset-1',
                                width: '100%',
                                blocks: [
                                    {
                                        id: 'block-reset-1',
                                        type: 'heading',
                                        properties: { level: 1, content: 'Parolanızı Sıfırlayın' },
                                        styles: { color: '#1a1a1a', fontSize: '24px', fontWeight: 'bold' },
                                    },
                                    {
                                        id: 'block-reset-2',
                                        type: 'text',
                                        properties: { content: 'Parolanızı sıfırlamak için aşağıdaki butona tıklayın. Bu bağlantı 10 dakika geçerlidir.' },
                                        styles: { color: '#3c4043', fontSize: '16px' },
                                    },
                                    {
                                        id: 'block-reset-3',
                                        type: 'button',
                                        properties: { text: 'Parolayı Sıfırla', url: '{{resetLink}}' },
                                        styles: { backgroundColor: '#ED7D31', color: '#ffffff', borderRadius: '6px', align: 'center' },
                                    }
                                ],
                            }
                        ],
                        settings: { padding: '20px', backgroundColor: '#ffffff' },
                    }
                ],
                settings: { backgroundColor: '#f6f9fc', contentWidth: '600px' }
            },
            isActive: true,
            isEditable: true,
            version: 1,
            variables: ['userName', 'resetLink'],
        },
        // 4. Account Created
        {
            name: 'Account Created',
            description: 'Hesap oluşturma onayı',
            type: 'custom',
            structure: {
                rows: [
                    {
                        id: 'row-acc-1',
                        type: 'section',
                        columns: [
                            {
                                id: 'col-acc-1',
                                width: '100%',
                                blocks: [
                                    {
                                        id: 'block-acc-1',
                                        type: 'heading',
                                        properties: { level: 1, content: 'Hesabınız Hazır!' },
                                        styles: { color: '#1a1a1a', fontSize: '24px', fontWeight: 'bold' },
                                    },
                                    {
                                        id: 'block-acc-2',
                                        type: 'text',
                                        properties: { content: 'Merhaba {{userName}}, hesabınız başarıyla oluşturuldu. Şimdi giriş yapabilirsiniz.' },
                                        styles: { color: '#3c4043', fontSize: '16px' },
                                    },
                                    {
                                        id: 'block-acc-3',
                                        type: 'button',
                                        properties: { text: 'Giriş Yap', url: '{{loginUrl}}' },
                                        styles: { backgroundColor: '#ED7D31', color: '#ffffff', borderRadius: '6px', align: 'center' },
                                    }
                                ],
                            }
                        ],
                        settings: { padding: '20px', backgroundColor: '#ffffff' },
                    }
                ],
                settings: { backgroundColor: '#f6f9fc', contentWidth: '600px' }
            },
            isActive: true,
            isEditable: true,
            version: 1,
            variables: ['userName', 'loginUrl'],
        },
        // 5. Invoice
        {
            name: 'Invoice',
            description: 'Fatura e-postası',
            type: 'custom',
            structure: {
                rows: [
                    {
                        id: 'row-inv-1',
                        type: 'section',
                        columns: [
                            {
                                id: 'col-inv-1',
                                width: '100%',
                                blocks: [
                                    {
                                        id: 'block-inv-1',
                                        type: 'heading',
                                        properties: { level: 1, content: 'Faturanız Hazır' },
                                        styles: { color: '#1a1a1a', fontSize: '24px', fontWeight: 'bold' },
                                    },
                                    {
                                        id: 'block-inv-2',
                                        type: 'text',
                                        properties: { content: '{{invoiceNumber}} numaralı faturanız oluşturulmuştur. Detayları aşağıda bulabilirsiniz.' },
                                        styles: { color: '#3c4043', fontSize: '16px' },
                                    },
                                    {
                                        id: 'block-inv-3',
                                        type: 'button',
                                        properties: { text: 'Faturayı İndir', url: '{{invoiceUrl}}' },
                                        styles: { backgroundColor: '#ED7D31', color: '#ffffff', borderRadius: '6px', align: 'center' },
                                    }
                                ],
                            }
                        ],
                        settings: { padding: '20px', backgroundColor: '#ffffff' },
                    }
                ],
                settings: { backgroundColor: '#f6f9fc', contentWidth: '600px' }
            },
            isActive: true,
            isEditable: true,
            version: 1,
            variables: ['userName', 'invoiceNumber', 'invoiceUrl'],
        },
        // 6. Order Confirmation
        {
            name: 'Order Confirmation',
            description: 'Sipariş onayı',
            type: 'custom',
            structure: {
                rows: [
                    {
                        id: 'row-ord-1',
                        type: 'section',
                        columns: [
                            {
                                id: 'col-ord-1',
                                width: '100%',
                                blocks: [
                                    {
                                        id: 'block-ord-1',
                                        type: 'heading',
                                        properties: { level: 1, content: 'Siparişiniz Alındı' },
                                        styles: { color: '#1a1a1a', fontSize: '24px', fontWeight: 'bold' },
                                    },
                                    {
                                        id: 'block-ord-2',
                                        type: 'text',
                                        properties: { content: 'Siparişiniz başarıyla alındı. Teşekkür ederiz.' },
                                        styles: { color: '#3c4043', fontSize: '16px' },
                                    }
                                ],
                            }
                        ],
                        settings: { padding: '20px', backgroundColor: '#ffffff' },
                    }
                ],
                settings: { backgroundColor: '#f6f9fc', contentWidth: '600px' }
            },
            isActive: true,
            isEditable: true,
            version: 1,
            variables: ['userName', 'orderNumber'],
        },
        // 7. Ticket Created - Customer (Migration Version)
        {
            name: 'ticket-created-customer-v2',
            description: 'Destek talebi onayı (MJML)',
            type: 'custom',
            structure: {
                rows: [
                    {
                        id: 'row-tkt-1',
                        type: 'section',
                        columns: [
                            {
                                id: 'col-tkt-1',
                                width: '100%',
                                blocks: [
                                    {
                                        id: 'block-tkt-1',
                                        type: 'heading',
                                        properties: { level: 1, content: '✅ Destek Talebiniz Alındı' },
                                        styles: { color: '#1e293b', fontSize: '28px', fontWeight: 'bold', textAlign: 'center' },
                                    },
                                    {
                                        id: 'block-tkt-2',
                                        type: 'text',
                                        properties: { content: 'Merhaba {{customerName}}, destek talebiniz başarıyla oluşturuldu.' },
                                        styles: { color: '#334155', fontSize: '16px' },
                                    }
                                ],
                            }
                        ],
                        settings: { padding: '20px', backgroundColor: '#ffffff' },
                    }
                ],
                settings: { backgroundColor: '#f5f5f5', contentWidth: '600px' }
            },
            isActive: true,
            isEditable: true,
            version: 1,
            variables: ['customerName', 'displayNumber', 'subject', 'ticketUrl'],
        }
    ];

    for (const t of templates) {
        const template = templateRepository.create(t);
        await templateRepository.save(template);
    }

    console.log('✓ Core email templates seeded successfully');
}

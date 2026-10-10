
import type { Permission, Role } from './types';

export const permissions: Permission[] = [
  // Kullanıcı Yönetimi
  { id: 'users.view', name: 'Kullanıcıları Görüntüle', category: 'Kullanıcı Yönetimi' },
  { id: 'users.create', name: 'Kullanıcı Oluştur', category: 'Kullanıcı Yönetimi' },
  { id: 'users.edit', name: 'Kullanıcı Düzenle', category: 'Kullanıcı Yönetimi' },
  { id: 'users.delete', name: 'Kullanıcı Sil', category: 'Kullanıcı Yönetimi' },
  { id: 'roles.view', name: 'Rolleri Görüntüle', category: 'Kullanıcı Yönetimi' },
  { id: 'roles.manage', name: 'Rolleri Yönet', category: 'Kullanıcı Yönetimi' },

  // Etkinlik Yönetimi
  { id: 'events.view', name: 'Etkinlikleri Görüntüle', category: 'Etkinlik Yönetimi' },
  { id: 'events.create', name: 'Etkinlik Oluştur', category: 'Etkinlik Yönetimi' },
  { id: 'events.edit', name: 'Etkinlik Düzenle', category: 'Etkinlik Yönetimi' },
  { id: 'events.delete', name: 'Etkinlik Sil', category: 'Etkinlik Yönetimi' },
  { id: 'events.manage_attendees', name: 'Katılımcıları Yönet', category: 'Etkinlik Yönetimi' },

  // Sertifika Yönetimi
  { id: 'certificates.view', name: 'Sertifikaları Görüntüle', category: 'Sertifika Yönetimi' },
  { id: 'certificates.create', name: 'Sertifika Oluştur', category: 'Sertifika Yönetimi' },
  { id: 'certificates.edit', name: 'Sertifika Düzenle', category: 'Sertifika Yönetimi' },
  { id: 'certificates.revoke', name: 'Sertifika İptal Et', category: 'Sertifika Yönetimi' },
  
  // Destek Yönetimi
  { id: 'support.view_all', name: 'Tüm Destek Taleplerini Görüntüle', category: 'Destek Yönetimi' },
  { id: 'support.assign', name: 'Talep Ata', category: 'Destek Yönetimi' },
  { id: 'support.reply', name: 'Talep Yanıtla', category: 'Destek Yönetimi' },

  // Pazarlama Yönetimi
  { id: 'marketing.manage_campaigns', name: 'E-posta Kampanyalarını Yönet', category: 'Pazarlama Yönetimi' },
  { id: 'marketing.manage_newsletters', name: 'Bültenleri Yönet', category: 'Pazarlama Yönetimi' },
  { id: 'marketing.manage_social', name: 'Sosyal Medya Paylaşımlarını Yönet', category: 'Pazarlama Yönetimi' },
  
  // CMS Yönetimi
  { id: 'cms.view', name: 'Sayfaları Görüntüle', category: 'CMS Yönetimi' },
  { id: 'cms.create', name: 'Sayfa Oluştur', category: 'CMS Yönetimi' },
  { id: 'cms.edit', name: 'Sayfa Düzenle', category: 'CMS Yönetimi' },
  { id: 'cms.delete', name: 'Sayfa Sil', category: 'CMS Yönetimi' },
  { id: 'cms.manage_menus', name: 'Menüleri Yönet', category: 'CMS Yönetimi' },

  // Sistem Ayarları
  { id: 'settings.manage', name: 'Sistem Ayarlarını Yönet', category: 'Sistem Ayarları' },
];

export const roles: Role[] = [
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Tüm sistem üzerinde tam yetkiye sahip.',
    userCount: 1,
    permissionIds: permissions.map(p => p.id), // All permissions
  },
  {
    id: 'role-editor',
    name: 'Editor',
    description: 'İçerik (CMS), etkinlik ve sertifika yönetimi yapabilir.',
    userCount: 2,
    permissionIds: [
      ...permissions.filter(p => p.category === 'Etkinlik Yönetimi').map(p => p.id),
      ...permissions.filter(p => p.category === 'Sertifika Yönetimi').map(p => p.id),
      ...permissions.filter(p => p.category === 'CMS Yönetimi').map(p => p.id),
    ],
  },
  {
    id: 'role-support',
    name: 'Support Team',
    description: 'Destek taleplerini yönetir ve yanıtlar.',
    userCount: 1,
    permissionIds: [
        ...permissions.filter(p => p.category === 'Destek Yönetimi').map(p => p.id),
    ],
  },
  {
    id: 'role-marketing',
    name: 'Marketing Team',
    description: 'Sosyal medya, bülten ve e-posta kampanyalarını yönetir.',
    userCount: 0,
    permissionIds: [
        ...permissions.filter(p => p.category === 'Pazarlama Yönetimi').map(p => p.id),
    ],
  },
  {
    id: 'role-viewer',
    name: 'Viewer',
    description: 'Sadece görüntüleme yetkisine sahip, değişiklik yapamaz.',
    userCount: 1,
    permissionIds: [
        'users.view',
        'roles.view',
        'events.view',
        'certificates.view',
        'support.view_all',
        'cms.view',
    ],
  },
  {
    id: 'role-customer',
    name: 'Customer',
    description: 'Portal kullanıcısı. Sadece kendi verilerini yönetebilir.',
    userCount: 0, 
    permissionIds: [], // Admin paneli için yetkisi yok.
  },
];

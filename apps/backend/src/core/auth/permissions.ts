/**
 * Centralized Permission Definitions
 * All system permissions are defined here for type safety and consistency
 */

export const PERMISSIONS = {
  // User Management
  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",

  // Role Management
  ROLES_VIEW: "roles.view",
  ROLES_MANAGE: "roles.manage",

  // Support Management
  SUPPORT_VIEW: "support.view",
  SUPPORT_VIEW_ALL: "support.view_all",
  SUPPORT_RESPOND: "support.respond",
  SUPPORT_REPLY: "support.reply",
  SUPPORT_ASSIGN: "support.assign",

  // Marketing Management
  MARKETING_MANAGE: "marketing.manage",
  MARKETING_CAMPAIGNS: "marketing.campaigns",
  MARKETING_MANAGE_CAMPAIGNS: "marketing.manage_campaigns",
  MARKETING_MANAGE_NEWSLETTERS: "marketing.manage_newsletters",
  MARKETING_MANAGE_SOCIAL: "marketing.manage_social",

  // CMS Management
  CMS_VIEW: "cms.view",
  CMS_READ: "cms.read",
  CMS_WRITE: "cms.write",
  CMS_PAGES_VIEW: "cms.pages.view",
  CMS_CREATE: "cms.create",
  CMS_PAGES_CREATE: "cms.pages.create",
  CMS_EDIT: "cms.edit",
  CMS_PAGES_EDIT: "cms.pages.edit",
  CMS_UPDATE: "cms.pages.update",
  CMS_DELETE: "cms.delete",
  CMS_PAGES_DELETE: "cms.pages.delete",
  CMS_MENUS: "cms.manage_menus",
  CMS_MENUS_MANAGE: "cms.menus.manage",

  // Events Management
  EVENTS_VIEW: "events.view",
  EVENTS_CREATE: "events.create",
  EVENTS_EDIT: "events.edit",
  EVENTS_UPDATE: "events.update",
  EVENTS_DELETE: "events.delete",
  EVENTS_PARTICIPANTS: "events.participants",
  EVENTS_MANAGE_ATTENDEES: "events.manage_attendees",

  // Certificates Management
  CERTIFICATES_VIEW: "certificates.view",
  CERTIFICATES_CREATE: "certificates.create",
  CERTIFICATES_EDIT: "certificates.edit",
  CERTIFICATES_UPDATE: "certificates.update",
  CERTIFICATES_REVOKE: "certificates.revoke",

  // System Settings
  SYSTEM_SETTINGS: "system.settings",
  SYSTEM_LOGS: "system.logs",
  SETTINGS_MANAGE: "settings.manage",
  AUTOMATION_APPROVE: "automation.approve",

  // CRM Management
  CRM_VIEW: "crm.view",
  CRM_MANAGE: "crm.manage",
  CRM_DELETE: "crm.delete",

  // Forms Management
  FORMS_VIEW: "forms.view",
  FORMS_MANAGE: "forms.manage",
  FORMS_SUBMISSIONS_VIEW: "forms.submissions.view",

  // Newsletter/Subscriber
  NEWSLETTER_VIEW: "newsletter.view",
  MARKETING_RECEIVE: "marketing.receive",

  // Courses (for students)
  COURSES_VIEW: "courses.view",
} as const;

/**
 * Permission type for type safety
 */
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const LEGACY_TEMPLATE_PERMISSIONS = [
  "agent:manage",
  "analytics:read",
  "assignment:grade",
  "assignment:submit",
  "attendee:manage",
  "budget:manage",
  "campaign:create",
  "campaign:manage",
  "certificate:issue",
  "certificate:manage",
  "certificate:read",
  "course:manage",
  "course:read",
  "email:send",
  "event:create",
  "event:manage",
  "order:read",
  "profile:manage",
  "report:read",
  "social:post",
  "student:read",
  "ticket:manage",
  "ticket:read",
  "ticket:reply",
] as const;

export const TENANT_PERMISSION_CATALOG = new Set<string>([
  ...Object.values(PERMISSIONS),
  ...LEGACY_TEMPLATE_PERMISSIONS,
]);

/**
 * Permission Categories for UI grouping
 */
export const PERMISSION_CATEGORIES = {
  USER_MANAGEMENT: "Kullanıcı Yönetimi",
  ROLE_MANAGEMENT: "Rol Yönetimi",
  SUPPORT: "Destek Yönetimi",
  MARKETING: "Pazarlama Yönetimi",
  CMS: "İçerik Yönetimi",
  EVENTS: "Etkinlik Yönetimi",
  CERTIFICATES: "Sertifika Yönetimi",
  SYSTEM: "Sistem Ayarları",
  CRM: "Müşteri Yönetimi",
  FORMS: "Form Yönetimi",
  CONTENT: "İçerik Erişimi",
} as const;

/**
 * Map permissions to their categories
 */
export const PERMISSION_CATEGORY_MAP: Record<
  string,
  keyof typeof PERMISSION_CATEGORIES
> = {
  // User Management
  [PERMISSIONS.USERS_VIEW]: "USER_MANAGEMENT",
  [PERMISSIONS.USERS_CREATE]: "USER_MANAGEMENT",
  [PERMISSIONS.USERS_UPDATE]: "USER_MANAGEMENT",
  [PERMISSIONS.USERS_DELETE]: "USER_MANAGEMENT",

  // Role Management
  [PERMISSIONS.ROLES_VIEW]: "ROLE_MANAGEMENT",
  [PERMISSIONS.ROLES_MANAGE]: "ROLE_MANAGEMENT",

  // Support
  [PERMISSIONS.SUPPORT_VIEW]: "SUPPORT",
  [PERMISSIONS.SUPPORT_VIEW_ALL]: "SUPPORT",
  [PERMISSIONS.SUPPORT_RESPOND]: "SUPPORT",
  [PERMISSIONS.SUPPORT_REPLY]: "SUPPORT",
  [PERMISSIONS.SUPPORT_ASSIGN]: "SUPPORT",

  // Marketing
  [PERMISSIONS.MARKETING_MANAGE]: "MARKETING",
  [PERMISSIONS.MARKETING_CAMPAIGNS]: "MARKETING",
  [PERMISSIONS.MARKETING_MANAGE_CAMPAIGNS]: "MARKETING",
  [PERMISSIONS.MARKETING_MANAGE_NEWSLETTERS]: "MARKETING",
  [PERMISSIONS.MARKETING_MANAGE_SOCIAL]: "MARKETING",

  // CMS
  [PERMISSIONS.CMS_VIEW]: "CMS",
  [PERMISSIONS.CMS_PAGES_VIEW]: "CMS",
  [PERMISSIONS.CMS_CREATE]: "CMS",
  [PERMISSIONS.CMS_PAGES_CREATE]: "CMS",
  [PERMISSIONS.CMS_EDIT]: "CMS",
  [PERMISSIONS.CMS_PAGES_EDIT]: "CMS",
  [PERMISSIONS.CMS_UPDATE]: "CMS",
  [PERMISSIONS.CMS_DELETE]: "CMS",
  [PERMISSIONS.CMS_PAGES_DELETE]: "CMS",
  [PERMISSIONS.CMS_MENUS]: "CMS",
  [PERMISSIONS.CMS_MENUS_MANAGE]: "CMS",

  // Events
  [PERMISSIONS.EVENTS_VIEW]: "EVENTS",
  [PERMISSIONS.EVENTS_CREATE]: "EVENTS",
  [PERMISSIONS.EVENTS_EDIT]: "EVENTS",
  [PERMISSIONS.EVENTS_UPDATE]: "EVENTS",
  [PERMISSIONS.EVENTS_DELETE]: "EVENTS",
  [PERMISSIONS.EVENTS_PARTICIPANTS]: "EVENTS",
  [PERMISSIONS.EVENTS_MANAGE_ATTENDEES]: "EVENTS",

  // Certificates
  [PERMISSIONS.CERTIFICATES_VIEW]: "CERTIFICATES",
  [PERMISSIONS.CERTIFICATES_CREATE]: "CERTIFICATES",
  [PERMISSIONS.CERTIFICATES_EDIT]: "CERTIFICATES",
  [PERMISSIONS.CERTIFICATES_UPDATE]: "CERTIFICATES",
  [PERMISSIONS.CERTIFICATES_REVOKE]: "CERTIFICATES",

  // System
  [PERMISSIONS.SYSTEM_SETTINGS]: "SYSTEM",
  [PERMISSIONS.SYSTEM_LOGS]: "SYSTEM",
  [PERMISSIONS.SETTINGS_MANAGE]: "SYSTEM",
  [PERMISSIONS.AUTOMATION_APPROVE]: "SYSTEM",

  // CRM
  [PERMISSIONS.CRM_VIEW]: "CRM",
  [PERMISSIONS.CRM_MANAGE]: "CRM",
  [PERMISSIONS.CRM_DELETE]: "CRM",

  // Forms
  [PERMISSIONS.FORMS_VIEW]: "FORMS",
  [PERMISSIONS.FORMS_MANAGE]: "FORMS",
  [PERMISSIONS.FORMS_SUBMISSIONS_VIEW]: "FORMS",

  // Content
  [PERMISSIONS.NEWSLETTER_VIEW]: "CONTENT",
  [PERMISSIONS.MARKETING_RECEIVE]: "CONTENT",
  [PERMISSIONS.COURSES_VIEW]: "CONTENT",
};

/**
 * Helper function to check if a permission exists
 */
export function isValidPermission(
  permission: string,
): permission is Permission {
  return TENANT_PERMISSION_CATALOG.has(permission);
}

/**
 * Helper function to get permission category
 */
export function getPermissionCategory(permission: string): string | undefined {
  const categoryKey = PERMISSION_CATEGORY_MAP[permission];
  return categoryKey ? PERMISSION_CATEGORIES[categoryKey] : undefined;
}

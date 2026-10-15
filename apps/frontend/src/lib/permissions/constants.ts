/**
 * Permission System Constants
 *
 * Defines all permissions and role mappings for the application.
 * This is the single source of truth for access control.
 */

// ============================================================================
// User Roles
// ============================================================================

export enum UserRole {
  // System Administration
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  ORGANIZATION_OWNER = "organization_owner",
  ORGANIZATION_ADMIN = "organization_admin",

  // Content Team
  CONTENT_EDITOR = "content_editor",

  // Marketing Team
  MARKETING_MANAGER = "marketing_manager",
  SOCIAL_MEDIA_MANAGER = "social_media_manager",

  // Operations Team
  EVENT_COORDINATOR = "event_coordinator",

  // Support Team
  SUPPORT_MANAGER = "support_manager",
  SUPPORT_AGENT = "support_agent",

  // End Users
  CUSTOMER = "customer",
  STUDENT = "student",
  SUBSCRIBER = "subscriber",
  VIEWER = "viewer",

  // Legacy (Deprecated - will be removed in future)
  EDITOR = "editor", // Use CONTENT_EDITOR instead
}

// ============================================================================
// Permissions
// ============================================================================

/**
 * All available permissions in the system
 * Format: RESOURCE_ACTION (e.g., USERS_VIEW, CMS_EDIT)
 */
export enum Permission {
  // User Management
  USERS_VIEW = "users.view",
  USERS_CREATE = "users.create",
  USERS_EDIT = "users.edit",
  USERS_DELETE = "users.delete",
  USERS_MANAGE_ROLES = "users.manage_roles",

  // Role Management
  ROLES_VIEW = "roles.view",
  ROLES_CREATE = "roles.create",
  ROLES_EDIT = "roles.edit",
  ROLES_DELETE = "roles.delete",

  // CMS Management
  CMS_VIEW = "cms.view",
  CMS_CREATE = "cms.create",
  CMS_EDIT = "cms.edit",
  CMS_DELETE = "cms.delete",
  CMS_PUBLISH = "cms.publish",

  // Support Tickets
  TICKETS_VIEW_ALL = "tickets.view_all", // View all tickets
  TICKETS_VIEW_OWN = "tickets.view_own", // View only own tickets
  TICKETS_CREATE = "tickets.create",
  TICKETS_EDIT = "tickets.edit",
  TICKETS_DELETE = "tickets.delete",
  TICKETS_ASSIGN = "tickets.assign",
  TICKETS_CLOSE = "tickets.close",

  // Email Marketing
  EMAIL_VIEW = "email.view",
  EMAIL_CREATE = "email.create",
  EMAIL_EDIT = "email.edit",
  EMAIL_DELETE = "email.delete",
  EMAIL_SEND = "email.send",

  // Events Management
  EVENTS_VIEW = "events.view",
  EVENTS_CREATE = "events.create",
  EVENTS_EDIT = "events.edit",
  EVENTS_DELETE = "events.delete",

  // Certificates Management
  CERTIFICATES_VIEW = "certificates.view",
  CERTIFICATES_CREATE = "certificates.create",
  CERTIFICATES_EDIT = "certificates.edit",
  CERTIFICATES_DELETE = "certificates.delete",

  // Social Media Management
  SOCIAL_MEDIA_VIEW = "social.view",
  SOCIAL_MEDIA_CREATE = "social.create",
  SOCIAL_MEDIA_EDIT = "social.edit",
  SOCIAL_MEDIA_DELETE = "social.delete",

  // CRM
  CRM_VIEW = "crm.view",
  CRM_MANAGE = "crm.manage",
  CRM_DELETE = "crm.delete",

  // Forms
  FORMS_VIEW = "forms.view",
  FORMS_MANAGE = "forms.manage",
  FORMS_SUBMISSIONS_VIEW = "forms.submissions.view",

  // Notifications
  NOTIFICATIONS_VIEW = "notifications.view",
  NOTIFICATIONS_CREATE = "notifications.create",
  NOTIFICATIONS_EDIT = "notifications.edit",
  NOTIFICATIONS_DELETE = "notifications.delete",

  // Activity Logs
  LOGS_VIEW = "logs.view",

  // Design System
  DESIGN_VIEW = "design.view",
  DESIGN_EDIT = "design.edit",

  // Analytics & Reports
  ANALYTICS_VIEW = "analytics.view",
  ANALYTICS_EXPORT = "analytics.export",

  // Settings
  SETTINGS_VIEW = "settings.view",
  SETTINGS_EDIT = "settings.edit",

  // System Administration
  SYSTEM_ADMIN = "system.admin", // Full system access
}

// ============================================================================
// Role-Permission Mappings
// ============================================================================

/**
 * Maps each role to its permitted actions
 * This defines what each role can do in the system
 */
const TENANT_ADMIN_FALLBACK_PERMISSIONS: Permission[] = [
  Permission.USERS_VIEW,
  Permission.USERS_CREATE,
  Permission.USERS_EDIT,
  Permission.USERS_DELETE,
  Permission.USERS_MANAGE_ROLES,
  Permission.ROLES_VIEW,
  Permission.ROLES_CREATE,
  Permission.ROLES_EDIT,
  Permission.ROLES_DELETE,
  Permission.CMS_VIEW,
  Permission.CMS_CREATE,
  Permission.CMS_EDIT,
  Permission.CMS_DELETE,
  Permission.CMS_PUBLISH,
  Permission.TICKETS_VIEW_ALL,
  Permission.TICKETS_CREATE,
  Permission.TICKETS_EDIT,
  Permission.TICKETS_DELETE,
  Permission.TICKETS_ASSIGN,
  Permission.TICKETS_CLOSE,
  Permission.EMAIL_VIEW,
  Permission.EMAIL_CREATE,
  Permission.EMAIL_EDIT,
  Permission.EMAIL_DELETE,
  Permission.EMAIL_SEND,
  Permission.EVENTS_VIEW,
  Permission.EVENTS_CREATE,
  Permission.EVENTS_EDIT,
  Permission.EVENTS_DELETE,
  Permission.CERTIFICATES_VIEW,
  Permission.CERTIFICATES_CREATE,
  Permission.CERTIFICATES_EDIT,
  Permission.CERTIFICATES_DELETE,
  Permission.SOCIAL_MEDIA_VIEW,
  Permission.SOCIAL_MEDIA_CREATE,
  Permission.SOCIAL_MEDIA_EDIT,
  Permission.SOCIAL_MEDIA_DELETE,
  Permission.CRM_VIEW,
  Permission.CRM_MANAGE,
  Permission.CRM_DELETE,
  Permission.FORMS_VIEW,
  Permission.FORMS_MANAGE,
  Permission.FORMS_SUBMISSIONS_VIEW,
  Permission.NOTIFICATIONS_VIEW,
  Permission.NOTIFICATIONS_CREATE,
  Permission.NOTIFICATIONS_EDIT,
  Permission.NOTIFICATIONS_DELETE,
  Permission.LOGS_VIEW,
  Permission.DESIGN_VIEW,
  Permission.DESIGN_EDIT,
  Permission.ANALYTICS_VIEW,
  Permission.ANALYTICS_EXPORT,
  Permission.SETTINGS_VIEW,
  Permission.SETTINGS_EDIT,
];

export const ROLE_PERMISSIONS: Partial<Record<UserRole, Permission[]>> = {
  [UserRole.SUPER_ADMIN]: [
    // Full system access
    Permission.SYSTEM_ADMIN,

    // Users
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_EDIT,
    Permission.USERS_DELETE,
    Permission.USERS_MANAGE_ROLES,

    // Roles
    Permission.ROLES_VIEW,
    Permission.ROLES_CREATE,
    Permission.ROLES_EDIT,
    Permission.ROLES_DELETE,

    // CMS
    Permission.CMS_VIEW,
    Permission.CMS_CREATE,
    Permission.CMS_EDIT,
    Permission.CMS_DELETE,
    Permission.CMS_PUBLISH,

    // Tickets
    Permission.TICKETS_VIEW_ALL,
    Permission.TICKETS_CREATE,
    Permission.TICKETS_EDIT,
    Permission.TICKETS_DELETE,
    Permission.TICKETS_ASSIGN,
    Permission.TICKETS_CLOSE,

    // Email
    Permission.EMAIL_VIEW,
    Permission.EMAIL_CREATE,
    Permission.EMAIL_EDIT,
    Permission.EMAIL_DELETE,
    Permission.EMAIL_SEND,

    // Events
    Permission.EVENTS_VIEW,
    Permission.EVENTS_CREATE,
    Permission.EVENTS_EDIT,
    Permission.EVENTS_DELETE,

    // Certificates
    Permission.CERTIFICATES_VIEW,
    Permission.CERTIFICATES_CREATE,
    Permission.CERTIFICATES_EDIT,
    Permission.CERTIFICATES_DELETE,

    // Social Media
    Permission.SOCIAL_MEDIA_VIEW,
    Permission.SOCIAL_MEDIA_CREATE,
    Permission.SOCIAL_MEDIA_EDIT,
    Permission.SOCIAL_MEDIA_DELETE,

    Permission.CRM_VIEW,
    Permission.CRM_MANAGE,
    Permission.CRM_DELETE,
    Permission.FORMS_VIEW,
    Permission.FORMS_MANAGE,
    Permission.FORMS_SUBMISSIONS_VIEW,

    // Notifications
    Permission.NOTIFICATIONS_VIEW,
    Permission.NOTIFICATIONS_CREATE,
    Permission.NOTIFICATIONS_EDIT,
    Permission.NOTIFICATIONS_DELETE,

    // Logs
    Permission.LOGS_VIEW,

    // Design System
    Permission.DESIGN_VIEW,
    Permission.DESIGN_EDIT,

    // Analytics
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,

    // Settings
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
  ],

  [UserRole.ADMIN]: [
    // Full system access
    Permission.SYSTEM_ADMIN,

    // Users
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_EDIT,
    Permission.USERS_DELETE,
    Permission.USERS_MANAGE_ROLES,

    // Roles
    Permission.ROLES_VIEW,
    Permission.ROLES_CREATE,
    Permission.ROLES_EDIT,
    Permission.ROLES_DELETE,

    // CMS
    Permission.CMS_VIEW,
    Permission.CMS_CREATE,
    Permission.CMS_EDIT,
    Permission.CMS_DELETE,
    Permission.CMS_PUBLISH,

    // Tickets
    Permission.TICKETS_VIEW_ALL,
    Permission.TICKETS_CREATE,
    Permission.TICKETS_EDIT,
    Permission.TICKETS_DELETE,
    Permission.TICKETS_ASSIGN,
    Permission.TICKETS_CLOSE,

    // Email
    Permission.EMAIL_VIEW,
    Permission.EMAIL_CREATE,
    Permission.EMAIL_EDIT,
    Permission.EMAIL_DELETE,
    Permission.EMAIL_SEND,

    // Events
    Permission.EVENTS_VIEW,
    Permission.EVENTS_CREATE,
    Permission.EVENTS_EDIT,
    Permission.EVENTS_DELETE,

    // Certificates
    Permission.CERTIFICATES_VIEW,
    Permission.CERTIFICATES_CREATE,
    Permission.CERTIFICATES_EDIT,
    Permission.CERTIFICATES_DELETE,

    // Social Media
    Permission.SOCIAL_MEDIA_VIEW,
    Permission.SOCIAL_MEDIA_CREATE,
    Permission.SOCIAL_MEDIA_EDIT,
    Permission.SOCIAL_MEDIA_DELETE,

    Permission.CRM_VIEW,
    Permission.CRM_MANAGE,
    Permission.CRM_DELETE,
    Permission.FORMS_VIEW,
    Permission.FORMS_MANAGE,
    Permission.FORMS_SUBMISSIONS_VIEW,

    // Notifications
    Permission.NOTIFICATIONS_VIEW,
    Permission.NOTIFICATIONS_CREATE,
    Permission.NOTIFICATIONS_EDIT,
    Permission.NOTIFICATIONS_DELETE,

    // Logs
    Permission.LOGS_VIEW,

    // Design System
    Permission.DESIGN_VIEW,
    Permission.DESIGN_EDIT,

    // Analytics
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,

    // Settings
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
  ],

  [UserRole.ORGANIZATION_OWNER]: TENANT_ADMIN_FALLBACK_PERMISSIONS,
  [UserRole.ORGANIZATION_ADMIN]: TENANT_ADMIN_FALLBACK_PERMISSIONS,

  [UserRole.SUPPORT_MANAGER]: [
    // Tickets - Full access
    Permission.TICKETS_VIEW_ALL,
    Permission.TICKETS_CREATE,
    Permission.TICKETS_EDIT,
    Permission.TICKETS_DELETE,
    Permission.TICKETS_ASSIGN,
    Permission.TICKETS_CLOSE,

    // Users - View only
    Permission.USERS_VIEW,

    // Analytics
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,

    // Settings - View only
    Permission.SETTINGS_VIEW,
  ],

  [UserRole.SUPPORT_AGENT]: [
    // Tickets - Limited access
    Permission.TICKETS_VIEW_ALL,
    Permission.TICKETS_CREATE,
    Permission.TICKETS_EDIT,
    Permission.TICKETS_CLOSE,

    // Users - View only (no Logs access)
    Permission.USERS_VIEW,

    // Settings - View only
    Permission.SETTINGS_VIEW,
  ],

  [UserRole.EDITOR]: [
    // CMS - Full access
    Permission.CMS_VIEW,
    Permission.CMS_CREATE,
    Permission.CMS_EDIT,
    Permission.CMS_DELETE,
    Permission.CMS_PUBLISH,

    // Email - Full access
    Permission.EMAIL_VIEW,
    Permission.EMAIL_CREATE,
    Permission.EMAIL_EDIT,
    Permission.EMAIL_DELETE,
    Permission.EMAIL_SEND,

    // Events - Create/Edit access
    Permission.EVENTS_VIEW,
    Permission.EVENTS_CREATE,
    Permission.EVENTS_EDIT,

    // Certificates - Create/Edit access
    Permission.CERTIFICATES_VIEW,
    Permission.CERTIFICATES_CREATE,
    Permission.CERTIFICATES_EDIT,

    // Social Media - Create/Edit access
    Permission.SOCIAL_MEDIA_VIEW,
    Permission.SOCIAL_MEDIA_CREATE,
    Permission.SOCIAL_MEDIA_EDIT,

    // Notifications - Create/Edit access
    Permission.NOTIFICATIONS_VIEW,
    Permission.NOTIFICATIONS_CREATE,
    Permission.NOTIFICATIONS_EDIT,

    // Analytics - View only
    Permission.ANALYTICS_VIEW,

    // NO access to: Users Management, Settings, Design, Logs
  ],

  [UserRole.CONTENT_EDITOR]: [
    // CMS - Full access (Content creation focus)
    Permission.CMS_VIEW,
    Permission.CMS_CREATE,
    Permission.CMS_EDIT,
    Permission.CMS_DELETE,
    Permission.CMS_PUBLISH,

    // Analytics - View only (to see content performance)
    Permission.ANALYTICS_VIEW,

    // NO access to: Email, Social Media, Events, Users, Settings
  ],

  [UserRole.MARKETING_MANAGER]: [
    // Email Marketing - Full access
    Permission.EMAIL_VIEW,
    Permission.EMAIL_CREATE,
    Permission.EMAIL_EDIT,
    Permission.EMAIL_DELETE,
    Permission.EMAIL_SEND,

    // Analytics - Full access (marketing analytics focus)
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,

    // NO access to: CMS, Social Media, Events, Users, Settings
  ],

  [UserRole.SOCIAL_MEDIA_MANAGER]: [
    // Social Media - Full access
    Permission.SOCIAL_MEDIA_VIEW,
    Permission.SOCIAL_MEDIA_CREATE,
    Permission.SOCIAL_MEDIA_EDIT,
    Permission.SOCIAL_MEDIA_DELETE,

    // Notifications - For social media announcements
    Permission.NOTIFICATIONS_VIEW,
    Permission.NOTIFICATIONS_CREATE,
    Permission.NOTIFICATIONS_EDIT,

    // Analytics - View only (social media metrics)
    Permission.ANALYTICS_VIEW,

    // NO access to: CMS, Email, Events, Users, Settings
  ],

  [UserRole.EVENT_COORDINATOR]: [
    // Events - Full access
    Permission.EVENTS_VIEW,
    Permission.EVENTS_CREATE,
    Permission.EVENTS_EDIT,
    Permission.EVENTS_DELETE,

    // Certificates - Full access (event certificates)
    Permission.CERTIFICATES_VIEW,
    Permission.CERTIFICATES_CREATE,
    Permission.CERTIFICATES_EDIT,
    Permission.CERTIFICATES_DELETE,

    // Notifications - For event reminders
    Permission.NOTIFICATIONS_VIEW,
    Permission.NOTIFICATIONS_CREATE,
    Permission.NOTIFICATIONS_EDIT,

    // Analytics - View only (event metrics)
    Permission.ANALYTICS_VIEW,

    // NO access to: CMS, Email, Social Media, Users, Settings
  ],

  [UserRole.VIEWER]: [
    // Portal access only - no admin panel permissions
    Permission.TICKETS_VIEW_OWN,
  ],

  [UserRole.STUDENT]: [
    // Student portal access
    Permission.TICKETS_VIEW_OWN,
    Permission.TICKETS_CREATE,
  ],

  [UserRole.SUBSCRIBER]: [
    // Subscriber portal access
    Permission.TICKETS_VIEW_OWN,
  ],

  [UserRole.CUSTOMER]: [
    // Own tickets only
    Permission.TICKETS_VIEW_OWN,
    Permission.TICKETS_CREATE,

    // Own profile
    Permission.USERS_VIEW,
  ],
};

// ============================================================================
// Route Access Control
// ============================================================================

/**
 * Maps routes to required permissions
 * Used by middleware for route-level access control
 */
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  // Admin Dashboard
  "/admin": [
    Permission.SYSTEM_ADMIN,
    Permission.CMS_VIEW,
    Permission.EMAIL_VIEW,
    Permission.TICKETS_VIEW_ALL,
    Permission.ANALYTICS_VIEW,
  ],

  // User Management
  "/admin/users": [Permission.USERS_VIEW],
  "/admin/users/new": [Permission.USERS_CREATE],
  "/admin/users/roles": [Permission.ROLES_VIEW],

  // CMS
  "/admin/cms": [Permission.CMS_VIEW],
  "/admin/cms/new": [Permission.CMS_CREATE],
  "/admin/cms/editor": [Permission.CMS_EDIT],

  // Support
  "/admin/support": [Permission.TICKETS_VIEW_ALL],
  "/admin/support/new": [Permission.TICKETS_CREATE],
  "/admin/support/ai-insights": [
    Permission.TICKETS_VIEW_ALL,
    Permission.ANALYTICS_VIEW,
  ],
  "/admin/support/knowledge-base": [Permission.TICKETS_VIEW_ALL],
  "/admin/support/macros": [Permission.TICKETS_VIEW_ALL],

  // Email Marketing
  "/admin/email-marketing": [Permission.EMAIL_VIEW],
  "/admin/email-marketing/campaigns": [Permission.EMAIL_VIEW],
  "/admin/email-marketing/templates": [Permission.EMAIL_VIEW],
  "/admin/email-marketing/subscribers": [Permission.EMAIL_VIEW],

  // Analytics
  "/admin/analytics": [Permission.ANALYTICS_VIEW],

  // Settings
  "/admin/settings": [Permission.SETTINGS_VIEW],

  // Portal (Customer area)
  "/portal": [Permission.TICKETS_VIEW_OWN],
  "/portal/support": [Permission.TICKETS_VIEW_OWN],
  "/portal/support/new": [Permission.TICKETS_CREATE],
};

/**
 * Routes that require ANY of the permissions (OR logic)
 * Most routes use this - user needs at least one permission
 */
export const ROUTE_PERMISSION_MODE: Record<string, "any" | "all"> = {
  "/admin": "any", // Any admin permission grants dashboard access
  "/admin/users": "any",
  "/admin/support": "any",
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if role has specific permission
 */
export function roleHasPermission(
  role: UserRole,
  permission: Permission,
): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return (
    permissions.includes(permission) ||
    permissions.includes(Permission.SYSTEM_ADMIN)
  );
}

/**
 * Check if role has ANY of the permissions
 */
export function roleHasAnyPermission(
  role: UserRole,
  permissions: Permission[],
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];

  // System admin has all permissions
  if (rolePermissions.includes(Permission.SYSTEM_ADMIN)) {
    return true;
  }

  return permissions.some((permission) => rolePermissions.includes(permission));
}

/**
 * Check if role has ALL of the permissions
 */
export function roleHasAllPermissions(
  role: UserRole,
  permissions: Permission[],
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];

  // System admin has all permissions
  if (rolePermissions.includes(Permission.SYSTEM_ADMIN)) {
    return true;
  }

  return permissions.every((permission) =>
    rolePermissions.includes(permission),
  );
}

/**
 * Check if route is accessible by role
 */
export function canAccessRoute(role: UserRole, route: string): boolean {
  // Block non-staff roles from accessing admin panel
  if (route.startsWith("/admin")) {
    // All staff roles can access admin panel (permissions determine what they see)
    const allowedAdminRoles = [
      // System Administration
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.ORGANIZATION_OWNER,
      UserRole.ORGANIZATION_ADMIN,

      // Content Team
      UserRole.CONTENT_EDITOR,

      // Marketing Team
      UserRole.MARKETING_MANAGER,
      UserRole.SOCIAL_MEDIA_MANAGER,

      // Operations Team
      UserRole.EVENT_COORDINATOR,

      // Support Team
      UserRole.SUPPORT_MANAGER,
      UserRole.SUPPORT_AGENT,

      // Legacy (Deprecated)
      UserRole.EDITOR,
    ];

    if (!allowedAdminRoles.includes(role)) {
      console.log(
        `🚫 Role ${role} blocked from admin panel - redirecting to portal`,
      );
      return false;
    }
  }

  // Find matching route pattern
  const routePattern = Object.keys(ROUTE_PERMISSIONS).find((pattern) => {
    if (pattern === route) return true;
    if (route.startsWith(pattern + "/")) return true;
    return false;
  });

  if (!routePattern) {
    // No explicit permission required
    return true;
  }

  const requiredPermissions = ROUTE_PERMISSIONS[routePattern];
  const mode = ROUTE_PERMISSION_MODE[routePattern] || "any";

  if (mode === "any") {
    return roleHasAnyPermission(role, requiredPermissions);
  } else {
    return roleHasAllPermissions(role, requiredPermissions);
  }
}

/**
 * Check if a role is a staff role (has admin panel access)
 */
export function isStaffRole(roleName: string): boolean {
  const staffRoles = [
    "superadmin",
    "super_admin",
    "admin",
    "organization_owner",
    "organization_admin",
    "editor", // Legacy
    "content editor",
    "content_editor",
    "marketing manager",
    "marketing_manager",
    "social media manager",
    "social_media_manager",
    "event coordinator",
    "event_coordinator",
    "support manager",
    "support_manager",
    "support agent",
    "support_agent",
    "support",
    "support team",
    "support_team",
  ];

  return staffRoles.includes(roleName.toLowerCase());
}

/**
 * Check if a role is a portal role (customer/student/subscriber)
 */
export function isPortalRole(roleName: string): boolean {
  const portalRoles = ["customer", "student", "subscriber", "viewer"];
  return portalRoles.includes(roleName.toLowerCase());
}

/**
 * Get user-friendly role name
 */
export function getRoleDisplayName(role: UserRole): string {
  return role;
}

/**
 * Get user-friendly permission name
 */
export function getPermissionDisplayName(permission: Permission): string {
  const parts = permission.split(".");
  const resource = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  const action = parts[1].replace(/_/g, " ");
  return `${resource}: ${action}`;
}

/**
 * Get appropriate redirect path based on user role
 * Returns the default landing page for each role
 */
export function getDefaultRedirectForRole(role: UserRole): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
    case UserRole.ADMIN:
      return "/admin";

    // Content Team
    case UserRole.CONTENT_EDITOR:
      return "/admin/cms";

    // Marketing Team
    case UserRole.MARKETING_MANAGER:
      return "/admin/email";
    case UserRole.SOCIAL_MEDIA_MANAGER:
      return "/admin/social";

    // Operations Team
    case UserRole.EVENT_COORDINATOR:
      return "/admin/events";

    // Support Team
    case UserRole.SUPPORT_MANAGER:
    case UserRole.SUPPORT_AGENT:
      return "/admin/support";

    // End Users
    case UserRole.CUSTOMER:
    case UserRole.STUDENT:
    case UserRole.SUBSCRIBER:
    case UserRole.VIEWER:
      return "/portal";

    // Legacy
    case UserRole.EDITOR:
      return "/admin/cms"; // Redirect to CMS (legacy behavior)

    default:
      return "/portal";
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Platform authority comes from server provisioning, never tenant-editable roles. */
export function platformAdminIds(value = process.env.PLATFORM_ADMIN_USER_IDS ?? ''): readonly string[] {
  const ids = value.split(',').map(id => id.trim().toLowerCase()).filter(Boolean);
  if (ids.some(id => !UUID.test(id))) {
    throw new Error('PLATFORM_ADMIN_USER_IDS must contain comma-separated UUIDs');
  }
  return ids;
}

export function isConfiguredPlatformAdmin(userId: string, configuredIds?: string): boolean {
  return platformAdminIds(configuredIds).includes(userId.toLowerCase());
}

import AppDataSource from './data-source';

describe('migration discovery', () => {
  it('loads the complete active history without cwd or NODE_ENV globs', () => {
    const migrations = AppDataSource.options.migrations;
    expect(Array.isArray(migrations)).toBe(true);
    expect(migrations).toHaveLength(25);
    expect((migrations as Function[]).map(migration => migration.name)).toEqual([
      'InitialSchema1771006556552',
      'AddBccSignals1771008872029',
      'AddFormsTable1771009842032',
      'CreateCommerceTables1771449820476',
      'AddMetadataToUsageRecord1771449820477',
      'SubscriberTenantEmailUnique1791374400000',
      'CortexOutbox1791378000000',
      'TicketAttachments1791381600000',
      'TicketCsatTenantScope1791385200000',
      'KnowledgeBaseTenantScope1791388800000',
      'TicketSystemNotes1791392400000',
      'TenantEntityAlignment1791396000000',
      'NotificationRecipientIntegrity1791399600000',
      'KnowledgeCategoryMapping1791403200000',
      'OrganizationLifecycle1791406800000',
      'CommerceSubscriptionIntegrity1791410400000',
      'UserTenantEmailIntegrity1791414000000',
      'TenantAdminPermissions1791417600000',
      'UserPrimaryRoleIntegrity1791421200000',
      'SettingsScopeIntegrity1791424800000',
      'CrmTenantIntegrity1791428400000',
      'FormsLifecycleIntegrity1791432000000',
      'AutomationDispatchOutbox1791435600000',
      'AutomationApprovalPermission1791439200000',
      'AutomationActionLeaseToken1791442800000',
    ]);
  });
});

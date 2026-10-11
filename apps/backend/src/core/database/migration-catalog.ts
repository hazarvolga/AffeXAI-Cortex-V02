import { KnowledgeCategoryMapping1791403200000 } from "./migrations/1791403200000-KnowledgeCategoryMapping";
import { OrganizationLifecycle1791406800000 } from "./migrations/1791406800000-OrganizationLifecycle";
import { CommerceSubscriptionIntegrity1791410400000 } from "./migrations/1791410400000-CommerceSubscriptionIntegrity";
import { UserTenantEmailIntegrity1791414000000 } from "./migrations/1791414000000-UserTenantEmailIntegrity";
import { TenantAdminPermissions1791417600000 } from "./migrations/1791417600000-TenantAdminPermissions";
import { UserPrimaryRoleIntegrity1791421200000 } from "./migrations/1791421200000-UserPrimaryRoleIntegrity";
import { SettingsScopeIntegrity1791424800000 } from "./migrations/1791424800000-SettingsScopeIntegrity";
import { CrmTenantIntegrity1791428400000 } from "./migrations/1791428400000-CrmTenantIntegrity";
import { FormsLifecycleIntegrity1791432000000 } from "./migrations/1791432000000-FormsLifecycleIntegrity";
import { AutomationDispatchOutbox1791435600000 } from "./migrations/1791435600000-AutomationDispatchOutbox";
import { AutomationApprovalPermission1791439200000 } from "./migrations/1791439200000-AutomationApprovalPermission";
import { AutomationActionLeaseToken1791442800000 } from "./migrations/1791442800000-AutomationActionLeaseToken";
import { EventPermissionNormalization1791446400000 } from "./migrations/1791446400000-EventPermissionNormalization";
import { NotificationRecipientIntegrity1791399600000 } from "./migrations/1791399600000-NotificationRecipientIntegrity";
import { TenantEntityAlignment1791396000000 } from "./migrations/1791396000000-TenantEntityAlignment";
import { TicketSystemNotes1791392400000 } from "./migrations/1791392400000-TicketSystemNotes";
import { KnowledgeBaseTenantScope1791388800000 } from "./migrations/1791388800000-KnowledgeBaseTenantScope";
import { TicketCsatTenantScope1791385200000 } from "./migrations/1791385200000-TicketCsatTenantScope";
import { TicketAttachments1791381600000 } from "./migrations/1791381600000-TicketAttachments";
import { CortexOutbox1791378000000 } from "./migrations/1791378000000-CortexOutbox";
import { SubscriberTenantEmailUnique1791374400000 } from "./migrations/1791374400000-SubscriberTenantEmailUnique";
import { InitialSchema1771006556552 } from "./migrations/1771006556552-InitialSchema";
import { AddBccSignals1771008872029 } from "./migrations/1771008872029-AddBccSignals";
import { AddFormsTable1771009842032 } from "./migrations/1771009842032-AddFormsTable";
import { CreateCommerceTables1771449820476 } from "../../database/migrations/1771449820476-CreateCommerceTables";
import { AddMetadataToUsageRecord1771449820477 } from "../../database/migrations/1771449820477-AddMetadataToUsageRecord";

// Active history spans both directories. Explicit imports keep source and compiled
// CLI discovery identical and exclude archived duplicate baseline migrations.
// Add future migrations here without changing already executed history.
export const activeMigrations = [
  InitialSchema1771006556552,
  AddBccSignals1771008872029,
  AddFormsTable1771009842032,
  CreateCommerceTables1771449820476,
  AddMetadataToUsageRecord1771449820477,
  SubscriberTenantEmailUnique1791374400000,
  CortexOutbox1791378000000,
  TicketAttachments1791381600000,
  TicketCsatTenantScope1791385200000,
  KnowledgeBaseTenantScope1791388800000,
  TicketSystemNotes1791392400000,
  TenantEntityAlignment1791396000000,
  NotificationRecipientIntegrity1791399600000,
  KnowledgeCategoryMapping1791403200000,
  OrganizationLifecycle1791406800000,
  CommerceSubscriptionIntegrity1791410400000,
  UserTenantEmailIntegrity1791414000000,
  TenantAdminPermissions1791417600000,
  UserPrimaryRoleIntegrity1791421200000,
  SettingsScopeIntegrity1791424800000,
  CrmTenantIntegrity1791428400000,
  FormsLifecycleIntegrity1791432000000,
  AutomationDispatchOutbox1791435600000,
  AutomationApprovalPermission1791439200000,
  AutomationActionLeaseToken1791442800000,
  EventPermissionNormalization1791446400000,
];

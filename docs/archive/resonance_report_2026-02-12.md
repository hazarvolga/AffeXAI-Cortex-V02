# AffeXAI Resonance Report
**Timestamp:** 2026-02-12T19:49:09.340Z
**System Version:** 1.1.0-dev

## Module Status

### Module: SOCIAL
- ✅ **SOCIAL_COMPOSE**: STABLE
- ✅ **SOCIAL_DELETE**: STABLE
- ✅ **SOCIAL_ANALYTICS**: STABLE

### Module: BACKUP
- ✅ **BACKUP_TRIGGER**: STABLE
- 🔴 **BACKUP_CLOUD_TEST**: BROKEN (No backend implementation for test signal in service.)
  - Forensic Report: `docs/qra_debug_backup_cloud_test.json`
- 🔴 **BACKUP_CLOUD_PERSIST**: BROKEN (UI-only signal logic.)
  - Forensic Report: `docs/qra_debug_backup_cloud_persist.json`

### Module: THEME
- ✅ **THEME_SAVE**: STABLE
- ✅ **MENU_FETCH**: STABLE

### Module: SITE_SETTINGS
- ✅ **SITE_SAVE**: STABLE
- ✅ **STORAGE_SAVE**: STABLE
- ✅ **EMAIL_TEST**: STABLE

### Module: AI_SETTINGS
- ✅ **AI_CONFIG_SAVE**: STABLE
- ✅ **AI_CONN_TEST**: STABLE

### Module: CRM
- ✅ **CRM_FETCH**: STABLE
- ✅ **CRM_CREATE**: STABLE

### Module: EVENTS
- ✅ **EVENT_PARTICIPANT_ADD**: STABLE
- ✅ **EVENT_STATUS_UPDATE**: STABLE
- ✅ **EVENT_CERT_GEN**: STABLE

### Module: CMS_COMPONENTS
- ✅ **CMS_COMP_CREATE**: STABLE
- ✅ **CMS_COMP_DELETE**: STABLE
- ✅ **CMS_COMP_FAV**: STABLE

### Module: CMS_FAVORITES
- ✅ **CMS_FAV_FETCH**: STABLE
- ✅ **CMS_FAV_REMOVE**: STABLE

### Module: SUPPORT_TICKETS
- ✅ **TICKET_MSG_ADD**: STABLE
- ✅ **TICKET_STATUS**: STABLE
- ✅ **TICKET_ASSIGN**: STABLE

### Module: SUPPORT_FAQ_LEARNING
- ✅ **FAQ_LEARNING_STATS**: STABLE
- ✅ **FAQ_PIPELINE_START**: STABLE
- ✅ **FAQ_PIPELINE_STOP**: STABLE

### Module: SUPPORT_AI_FAQ
- ✅ **AI_FAQ_GEN**: STABLE
- ✅ **AI_FAQ_APPROVE**: STABLE

### Module: MACROS
- ✅ **MACRO_CREATE**: STABLE

## Summary
- **Total Circuits:** 32
- **Stable:** 30
- **Broken:** 2
- **Resonance Score:** 94%
# Multi-Tenancy Audit Report

**Generated:** 2026-02-11T07:01:41.323Z

## Executive Summary

- **Total Modules:** 26
- **Compliant:** 4 (15.4%)
- **Partial:** 4
- **Non-Compliant:** 5

## Module Details

### ❓ ai

**Status:** UNKNOWN

**Components:**
- Services: 0
- Controllers: 0
- Entities: 0

---

### ✅ analytics

**Status:** COMPLIANT

**Components:**
- Services: 4
- Controllers: 2
- Entities: 6

**Services:**
- `ab-testing.service.ts`
  - ⚠️ Only 20% of repository queries include tenantId
- `analytics-dashboard.service.ts`
- `analytics-tracking.service.ts`
- `heatmap.service.ts`

**Recommendations:**
- ✅ Module is fully compliant with multi-tenancy standards

---

### ❌ backup

**Status:** NON_COMPLIANT

**Components:**
- Services: 9
- Controllers: 1
- Entities: 2

**Services:**
- `aws-s3-backup.service.ts`
- `backup-config.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
  - ⚠️ Only 86% of repository queries include tenantId
- `backup.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
  - ⚠️ Only 30% of repository queries include tenantId
- `cloud-upload.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
  - ⚠️ Only 80% of repository queries include tenantId
- `dropbox.service.ts`
- `ftp.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `google-drive.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `onedrive.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `scheduled-backup.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
  - ⚠️ Only 0% of repository queries include tenantId

**Controllers:**
- `backup.controller.ts`
  - ⚠️ Manually extracts tenantId 13 times
  - ⚠️ Manually passes tenantId 13 times

**Recommendations:**
- Inject TenantService in 9 service(s)
- Remove manual tenantId parameters from 4 service(s)
- Update 1 controller(s) to use automated tenant context

---

### ❓ brand

**Status:** UNKNOWN

**Components:**
- Services: 0
- Controllers: 0
- Entities: 0

---

### ❓ certificates

**Status:** UNKNOWN

**Components:**
- Services: 0
- Controllers: 0
- Entities: 2

**Recommendations:**
- Ensure 1 entity/entities extend BaseEntity

---

### ✅ chat

**Status:** COMPLIANT

**Components:**
- Services: 15
- Controllers: 7
- Entities: 7

**Services:**
- `chat-ai-settings.service.ts`
  - ⚠️ Only 25% of repository queries include tenantId
- `chat-ai.service.ts`
- `chat-context-engine.service.ts`
- `chat-escalation.service.ts`
- `chat-handoff.service.ts`
- `chat-message.service.ts`
- `chat-session.service.ts`
  - ⚠️ Only 86% of repository queries include tenantId
- `chat-support-assignment.service.ts`
  - ⚠️ Only 96% of repository queries include tenantId
- `document-processor.service.ts`
- `file-validator.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `general-communication-ai.service.ts`
- `general-communication-context.service.ts`
- `support-dashboard.service.ts`
  - ⚠️ Has TenantService but still uses manual tenantId parameters
- `url-cache.service.ts`
- `url-processor.service.ts`

**Recommendations:**
- ✅ Module is fully compliant with multi-tenancy standards

---

### ✅ cms

**Status:** COMPLIANT

**Components:**
- Services: 10
- Controllers: 9
- Entities: 13

**Services:**
- `category.service.ts`
- `cms-metrics.service.ts`
  - ⚠️ Only 75% of repository queries include tenantId
- `cms-settings.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `component.service.ts`
  - ⚠️ Only 10% of repository queries include tenantId
- `menu.service.ts`
  - ⚠️ Only 55% of repository queries include tenantId
- `page.service.ts`
  - ⚠️ Only 37% of repository queries include tenantId
- `reusable-components.service.ts`
  - ⚠️ Only 50% of repository queries include tenantId
- `reusable-sections.service.ts`
  - ⚠️ Only 47% of repository queries include tenantId
- `template.service.ts`
  - ⚠️ Only 30% of repository queries include tenantId
- `theme-settings.service.ts`
  - ⚠️ Only 64% of repository queries include tenantId

**Recommendations:**
- ✅ Module is fully compliant with multi-tenancy standards

---

### ✅ crm

**Status:** COMPLIANT

**Components:**
- Services: 0
- Controllers: 0
- Entities: 1

**Recommendations:**
- ✅ Module is fully compliant with multi-tenancy standards

---

### ❓ database-import

**Status:** UNKNOWN

**Components:**
- Services: 0
- Controllers: 0
- Entities: 0

---

### ⚠️ email-marketing

**Status:** PARTIAL

**Components:**
- Services: 29
- Controllers: 12
- Entities: 20

**Services:**
- `ab-test-statistics.service.ts`
- `ab-test.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `advanced-email-validation.service.ts`
- `automation-queue.service.ts`
- `automation-scheduler.service.ts`
- `automation.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
  - ⚠️ Only 68% of repository queries include tenantId
- `batch-processing.service.ts`
- `block-renderer.service.ts`
- `bulk-export.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
  - ⚠️ Only 17% of repository queries include tenantId
- `bulk-import.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
  - ⚠️ Only 0% of repository queries include tenantId
- `bulk-operations-compliance.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `custom-field.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `email-validation.service.ts`
- `enhanced-file-security.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `export-cleanup.service.ts`
- `file-processing.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
  - ⚠️ Only 0% of repository queries include tenantId
- `file-upload.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
- `gdpr-compliance.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `import-integration.service.ts`
  - ⚠️ Has TenantService but still uses manual tenantId parameters
  - ⚠️ Only 33% of repository queries include tenantId
- `ip-reputation.service.ts`
- `mjml-renderer.service.ts`
- `opt-in-out.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `predictive-analytics.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `send-time-optimization.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `stats.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `template-preview.service.ts`
- `trigger-evaluator.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `unified-template.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `workflow-executor.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId

**Controllers:**
- `automation.controller.ts`
  - ⚠️ Manually extracts tenantId 10 times
  - ⚠️ Manually passes tenantId 10 times
- `bulk-export.controller.ts`
  - ⚠️ Manually extracts tenantId 4 times
  - ⚠️ Manually passes tenantId 2 times
- `bulk-import.controller.ts`
  - ⚠️ Manually extracts tenantId 2 times
  - ⚠️ Manually passes tenantId 2 times
- `file-upload.controller.ts`
  - ⚠️ Manually extracts tenantId 2 times
  - ⚠️ Manually passes tenantId 2 times

**Recommendations:**
- Inject TenantService in 25 service(s)
- Remove manual tenantId parameters from 6 service(s)
- Update 4 controller(s) to use automated tenant context
- Ensure 3 entity/entities extend BaseEntity

---

### ❓ events

**Status:** UNKNOWN

**Components:**
- Services: 0
- Controllers: 0
- Entities: 2

---

### ❌ faq-learning

**Status:** NON_COMPLIANT

**Components:**
- Services: 21
- Controllers: 5
- Entities: 4

**Services:**
- `audit-logging.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `batch-processor.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
- `chat-data-extractor.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
- `chat-faq-integration.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `confidence-calculator.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `data-normalizer.service.ts`
- `data-privacy.service.ts`
- `faq-ai.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
- `faq-enhanced-search.service.ts`
- `faq-generator.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
- `faq-learning.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
  - ⚠️ Only 95% of repository queries include tenantId
- `feedback-processor.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
- `knowledge-base-integrator.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `learning-analytics.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `monitoring-alerting.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `pattern-recognition.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
  - ⚠️ Only 50% of repository queries include tenantId
- `pipeline-state.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
  - ⚠️ Only 29% of repository queries include tenantId
- `real-time-processor.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
  - ⚠️ Only 63% of repository queries include tenantId
- `review-queue.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
  - ⚠️ Only 25% of repository queries include tenantId
- `scheduled-learning-jobs.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
  - ⚠️ Only 33% of repository queries include tenantId
- `ticket-data-extractor.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService

**Controllers:**
- `faq-learning.controller.ts`
  - ⚠️ Manually extracts tenantId 10 times
  - ⚠️ Manually passes tenantId 9 times
- `review-management.controller.ts`
  - ⚠️ Manually extracts tenantId 1 times
  - ⚠️ Manually passes tenantId 1 times

**Recommendations:**
- Inject TenantService in 21 service(s)
- Remove manual tenantId parameters from 12 service(s)
- Update 2 controller(s) to use automated tenant context

---

### ❌ knowledge-sources

**Status:** NON_COMPLIANT

**Components:**
- Services: 3
- Controllers: 1
- Entities: 1

**Services:**
- `file-processing.service.ts`
- `knowledge-sources.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `url-processing.service.ts`

**Controllers:**
- `knowledge-sources.controller.ts`
  - ⚠️ Manually extracts tenantId 1 times
  - ⚠️ Manually passes tenantId 1 times

**Recommendations:**
- Inject TenantService in 3 service(s)
- Update 1 controller(s) to use automated tenant context

---

### ❌ mail

**Status:** NON_COMPLIANT

**Components:**
- Services: 1
- Controllers: 1
- Entities: 1

**Services:**
- `webhook.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
  - ⚠️ Only 60% of repository queries include tenantId

**Recommendations:**
- Inject TenantService in 1 service(s)
- Remove manual tenantId parameters from 1 service(s)

---

### ❓ media

**Status:** UNKNOWN

**Components:**
- Services: 0
- Controllers: 0
- Entities: 1

---

### ❓ notifications

**Status:** UNKNOWN

**Components:**
- Services: 0
- Controllers: 0
- Entities: 1

---

### ❓ organizations

**Status:** UNKNOWN

**Components:**
- Services: 0
- Controllers: 0
- Entities: 1

**Recommendations:**
- Ensure 1 entity/entities extend BaseEntity

---

### ⚠️ platform-integration

**Status:** PARTIAL

**Components:**
- Services: 3
- Controllers: 4
- Entities: 4

**Services:**
- `automation-executor.service.ts`
  - ⚠️ Has TenantService but still uses manual tenantId parameters
  - ⚠️ Only 33% of repository queries include tenantId
- `event-bus.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
- `webhook.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService

**Controllers:**
- `approvals.controller.ts`
  - ⚠️ Manually extracts tenantId 7 times
  - ⚠️ Manually passes tenantId 7 times
- `automation-rules.controller.ts`
  - ⚠️ Manually extracts tenantId 8 times
  - ⚠️ Manually passes tenantId 8 times
- `integration.controller.ts`
  - ⚠️ Manually extracts tenantId 5 times
  - ⚠️ Manually passes tenantId 5 times
- `webhooks.controller.ts`
  - ⚠️ Manually extracts tenantId 9 times
  - ⚠️ Manually passes tenantId 9 times

**Recommendations:**
- Inject TenantService in 2 service(s)
- Remove manual tenantId parameters from 3 service(s)
- Update 4 controller(s) to use automated tenant context

---

### ❓ roles

**Status:** UNKNOWN

**Components:**
- Services: 0
- Controllers: 0
- Entities: 2

**Recommendations:**
- Ensure 1 entity/entities extend BaseEntity

---

### ❓ settings

**Status:** UNKNOWN

**Components:**
- Services: 0
- Controllers: 0
- Entities: 1

---

### ⚠️ shared

**Status:** PARTIAL

**Components:**
- Services: 1
- Controllers: 0
- Entities: 0

**Services:**
- `cache.service.ts`

**Recommendations:**
- Inject TenantService in 1 service(s)

---

### ❓ social-media

**Status:** UNKNOWN

**Components:**
- Services: 0
- Controllers: 0
- Entities: 3

---

### ❓ system-logs

**Status:** UNKNOWN

**Components:**
- Services: 0
- Controllers: 0
- Entities: 0

---

### ❌ tickets

**Status:** NON_COMPLIANT

**Components:**
- Services: 18
- Controllers: 12
- Entities: 11

**Services:**
- `ai-categorization.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `business-hours.service.ts`
- `email-webhook-adapter-factory.service.ts`
- `knowledge-base-category.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `knowledge-base.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `sla.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `ticket-analytics.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `ticket-assignment-rules.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `ticket-attachment.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `ticket-auto-tagging.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `ticket-automation.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `ticket-category.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `ticket-csat.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `ticket-email-parser.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
  - ⚠️ Only 0% of repository queries include tenantId
- `ticket-email.service.ts`
- `ticket-escalation-rules.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId
- `ticket-macro.service.ts`
  - ⚠️ Uses manual tenantId parameters without TenantService
  - ⚠️ Only 47% of repository queries include tenantId
- `ticket-templates.service.ts`
  - ⚠️ Only 0% of repository queries include tenantId

**Controllers:**
- `ticket-macro.controller.ts`
  - ⚠️ Manually extracts tenantId 6 times
  - ⚠️ Manually passes tenantId 6 times

**Recommendations:**
- Inject TenantService in 18 service(s)
- Remove manual tenantId parameters from 2 service(s)
- Update 1 controller(s) to use automated tenant context
- Ensure 5 entity/entities extend BaseEntity

---

### ❓ trust-dynamics

**Status:** UNKNOWN

**Components:**
- Services: 0
- Controllers: 0
- Entities: 0

---

### ⚠️ users

**Status:** PARTIAL

**Components:**
- Services: 1
- Controllers: 0
- Entities: 2

**Services:**
- `user-email.service.ts`

**Recommendations:**
- Inject TenantService in 1 service(s)

---


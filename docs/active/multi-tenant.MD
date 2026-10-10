apps/
├── backend/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       │
│       ├── common/                                    # Paylaşılan utilities
│       │   ├── config/
│       │   │   ├── database.config.ts
│       │   │   ├── tenant.config.ts
│       │   │   ├── ai-providers.config.ts
│       │   │   └── email.config.ts
│       │   ├── constants/
│       │   │   ├── tenant.constants.ts
│       │   │   └── permissions.constants.ts
│       │   ├── decorators/
│       │   │   ├── tenant.decorator.ts                # @CurrentTenant(), @TenantId()
│       │   │   ├── current-user.decorator.ts          # @CurrentUser()
│       │   │   └── roles.decorator.ts                 # @Roles()
│       │   ├── guards/
│       │   │   ├── jwt-auth.guard.ts                  # ← SORUN BURADAN GELİYOR
│       │   │   ├── tenant.guard.ts
│       │   │   └── roles.guard.ts
│       │   ├── interceptors/
│       │   │   ├── tenant.interceptor.ts
│       │   │   ├── logging.interceptor.ts
│       │   │   └── transform.interceptor.ts
│       │   ├── middleware/
│       │   │   ├── tenant-resolver.middleware.ts      # Subdomain/header'dan tenant tespiti
│       │   │   └── logger.middleware.ts
│       │   ├── filters/
│       │   │   ├── http-exception.filter.ts
│       │   │   └── tenant-exception.filter.ts
│       │   ├── pipes/
│       │   │   └── validation.pipe.ts
│       │   ├── interfaces/
│       │   │   ├── tenant.interface.ts
│       │   │   └── pagination.interface.ts
│       │   └── utils/
│       │       ├── tenant.util.ts
│       │       └── crypto.util.ts
│       │
│       ├── core/                                      # Core tenant & infrastructure
│       │   ├── tenant/                                # Tenant yönetimi
│       │   │   ├── tenant.module.ts
│       │   │   ├── tenant.service.ts
│       │   │   ├── tenant.controller.ts
│       │   │   ├── tenant.repository.ts
│       │   │   ├── entities/
│       │   │   │   └── tenant.entity.ts
│       │   │   ├── dto/
│       │   │   │   ├── create-tenant.dto.ts
│       │   │   │   └── update-tenant.dto.ts
│       │   │   └── interfaces/
│       │   │       └── tenant-config.interface.ts
│       │   │
│       │   ├── database/                              # Tenant-aware database
│       │   │   ├── database.module.ts
│       │   │   ├── database.service.ts
│       │   │   ├── tenant-connection.service.ts       # Dinamik DB connection
│       │   │   ├── providers/
│       │   │   │   ├── tenant-datasource.provider.ts
│       │   │   │   └── master-datasource.provider.ts
│       │   │   ├── migrations/
│       │   │   │   ├── master/                        # Master DB migrations
│       │   │   │   └── tenant/                        # Tenant DB migrations
│       │   │   └── repositories/
│       │   │       └── base-tenant.repository.ts      # Base tenant-aware repo
│       │   │
│       │   ├── auth/                                  # Authentication & Authorization
│       │   │   ├── auth.module.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── auth.controller.ts
│       │   │   ├── strategies/
│       │   │   │   ├── jwt.strategy.ts
│       │   │   │   └── local.strategy.ts
│       │   │   └── dto/
│       │   │       ├── login.dto.ts
│       │   │       └── register.dto.ts
│       │   │
│       │   └── cache/                                 # Redis cache
│       │       ├── cache.module.ts
│       │       └── cache.service.ts
│       │
│       ├── modules/                                   # Business modules (tenant-aware)
│       │   │
│       │   ├── users/                                 # User management (tenant-scoped)
│       │   │   ├── users.module.ts
│       │   │   ├── users.service.ts
│       │   │   ├── users.controller.ts
│       │   │   ├── users.repository.ts
│       │   │   ├── entities/
│       │   │   │   └── user.entity.ts
│       │   │   ├── dto/
│       │   │   │   ├── create-user.dto.ts
│       │   │   │   └── update-user.dto.ts
│       │   │   └── interfaces/
│       │   │       └── user.interface.ts
│       │   │
│       │   ├── roles/                                 # RBAC (tenant-scoped)
│       │   │   ├── roles.module.ts
│       │   │   ├── roles.service.ts
│       │   │   ├── roles.controller.ts
│       │   │   └── entities/
│       │   │       ├── role.entity.ts
│       │   │       └── permission.entity.ts
│       │   │
│       │   ├── email-marketing/                       # Email Marketing (95% ready)
│       │   │   ├── email-marketing.module.ts
│       │   │   ├── controllers/
│       │   │   │   ├── campaigns.controller.ts
│       │   │   │   ├── subscribers.controller.ts
│       │   │   │   ├── templates.controller.ts
│       │   │   │   └── ab-tests.controller.ts
│       │   │   ├── services/
│       │   │   │   ├── campaign.service.ts
│       │   │   │   ├── subscriber.service.ts
│       │   │   │   ├── template.service.ts
│       │   │   │   ├── ab-test.service.ts
│       │   │   │   ├── automation.service.ts
│       │   │   │   ├── tracking.service.ts
│       │   │   │   ├── gdpr.service.ts
│       │   │   │   └── send-time-optimization.service.ts
│       │   │   ├── entities/
│       │   │   │   ├── campaign.entity.ts
│       │   │   │   ├── subscriber.entity.ts
│       │   │   │   └── template.entity.ts
│       │   │   ├── dto/
│       │   │   ├── queues/                            # BullMQ queues
│       │   │   │   ├── email.queue.ts
│       │   │   │   ├── automation.queue.ts
│       │   │   │   └── import.queue.ts
│       │   │   └── processors/
│       │   │       └── email.processor.ts
│       │   │
│       │   ├── tickets/                               # Support Tickets (92% ready)
│       │   │   ├── tickets.module.ts
│       │   │   ├── controllers/
│       │   │   │   ├── tickets.controller.ts
│       │   │   │   ├── sla.controller.ts
│       │   │   │   └── csat.controller.ts
│       │   │   ├── services/
│       │   │   │   ├── ticket.service.ts
│       │   │   │   ├── sla.service.ts
│       │   │   │   ├── auto-assignment.service.ts
│       │   │   │   ├── email-parser.service.ts
│       │   │   │   └── csat.service.ts
│       │   │   ├── entities/
│       │   │   │   ├── ticket.entity.ts
│       │   │   │   ├── ticket-message.entity.ts
│       │   │   │   └── sla-policy.entity.ts
│       │   │   └── dto/
│       │   │
│       │   ├── chat/                                  # Live Chat & AI Bot (90% ready)
│       │   │   ├── chat.module.ts
│       │   │   ├── gateways/
│       │   │   │   └── chat.gateway.ts                # WebSocket gateway
│       │   │   ├── services/
│       │   │   │   ├── chat.service.ts
│       │   │   │   ├── ai-chatbot.service.ts
│       │   │   │   ├── document-processor.service.ts
│       │   │   │   └── url-processor.service.ts
│       │   │   ├── entities/
│       │   │   │   ├── chat-session.entity.ts
│       │   │   │   └── chat-message.entity.ts
│       │   │   └── dto/
│       │   │
│       │   ├── faq-learning/                          # AI FAQ Generation (95% ready)
│       │   │   ├── faq-learning.module.ts
│       │   │   ├── services/
│       │   │   │   ├── ticket-extractor.service.ts
│       │   │   │   ├── chat-extractor.service.ts
│       │   │   │   ├── pattern-recognition.service.ts
│       │   │   │   ├── ai-generator.service.ts
│       │   │   │   └── review-queue.service.ts
│       │   │   ├── entities/
│       │   │   │   └── faq-suggestion.entity.ts
│       │   │   └── scheduled-jobs/
│       │   │       └── faq-generation.job.ts
│       │   │
│       │   ├── cms/                                   # Content Management (88% ready)
│       │   │   ├── cms.module.ts
│       │   │   ├── controllers/
│       │   │   │   ├── pages.controller.ts
│       │   │   │   ├── blocks.controller.ts
│       │   │   │   ├── menus.controller.ts
│       │   │   │   └── categories.controller.ts
│       │   │   ├── services/
│       │   │   │   ├── page.service.ts
│       │   │   │   ├── block.service.ts
│       │   │   │   ├── menu.service.ts
│       │   │   │   └── media.service.ts
│       │   │   ├── entities/
│       │   │   │   ├── page.entity.ts
│       │   │   │   ├── block.entity.ts
│       │   │   │   └── menu.entity.ts
│       │   │   └── dto/
│       │   │
│       │   ├── knowledge-base/                        # Knowledge Base (78% ready)
│       │   │   ├── kb.module.ts
│       │   │   ├── services/
│       │   │   │   ├── article.service.ts
│       │   │   │   ├── category.service.ts
│       │   │   │   └── search.service.ts
│       │   │   ├── entities/
│       │   │   │   ├── article.entity.ts
│       │   │   │   └── category.entity.ts
│       │   │   └── dto/
│       │   │
│       │   ├── analytics/                             # Analytics & Tracking (87% ready)
│       │   │   ├── analytics.module.ts
│       │   │   ├── services/
│       │   │   │   ├── event-tracking.service.ts
│       │   │   │   ├── session-tracking.service.ts
│       │   │   │   └── heatmap.service.ts
│       │   │   ├── entities/
│       │   │   │   ├── analytics-event.entity.ts
│       │   │   │   └── user-session.entity.ts
│       │   │   └── dto/
│       │   │
│       │   ├── certificates/                          # Certificate Generation (85% ready)
│       │   │   ├── certificates.module.ts
│       │   │   ├── services/
│       │   │   │   ├── certificate.service.ts
│       │   │   │   ├── pdf-generator.service.ts
│       │   │   │   ├── email.service.ts
│       │   │   │   └── verification.service.ts
│       │   │   ├── entities/
│       │   │   │   └── certificate.entity.ts
│       │   │   ├── templates/
│       │   │   │   ├── standard.template.ts
│       │   │   │   ├── premium.template.ts
│       │   │   │   └── executive.template.ts
│       │   │   └── dto/
│       │   │
│       │   ├── platform-integration/                  # Platform Integrations (85% ready, 15 TODOs)
│       │   │   ├── platform-integration.module.ts
│       │   │   ├── services/
│       │   │   │   ├── webhook.service.ts
│       │   │   │   ├── automation.service.ts
│       │   │   │   ├── event-bus.service.ts
│       │   │   │   └── api-keys.service.ts
│       │   │   ├── entities/
│       │   │   │   ├── webhook.entity.ts
│       │   │   │   └── automation-rule.entity.ts
│       │   │   └── dto/
│       │   │
│       │   ├── crm/                                   # CRM (62% ready - needs expansion)
│       │   │   ├── crm.module.ts
│       │   │   ├── services/
│       │   │   │   ├── contact.service.ts
│       │   │   │   ├── lead.service.ts               # TODO
│       │   │   │   └── deal.service.ts               # TODO
│       │   │   ├── entities/
│       │   │   │   ├── contact.entity.ts
│       │   │   │   ├── lead.entity.ts
│       │   │   │   └── deal.entity.ts
│       │   │   └── dto/
│       │   │
│       │   ├── events/                                # Events & Webinars (80% ready)
│       │   │   ├── events.module.ts
│       │   │   ├── services/
│       │   │   │   ├── event.service.ts
│       │   │   │   ├── registration.service.ts
│       │   │   │   └── reminder.service.ts           # TODO
│       │   │   ├── entities/
│       │   │   │   ├── event.entity.ts
│       │   │   │   └── registration.entity.ts
│       │   │   └── dto/
│       │   │
│       │   ├── notifications/                         # Notifications (74% ready)
│       │   │   ├── notifications.module.ts
│       │   │   ├── gateways/
│       │   │   │   └── notification.gateway.ts       # WebSocket
│       │   │   ├── services/
│       │   │   │   ├── notification.service.ts
│       │   │   │   ├── email-notification.service.ts
│       │   │   │   └── preferences.service.ts        # TODO
│       │   │   ├── entities/
│       │   │   │   └── notification.entity.ts
│       │   │   └── dto/
│       │   │
│       │   └── settings/                              # System Settings (75% ready)
│       │       ├── settings.module.ts
│       │       ├── services/
│       │       │   ├── settings.service.ts
│       │       │   ├── site-settings.service.ts
│       │       │   ├── email-settings.service.ts
│       │       │   └── ai-settings.service.ts
│       │       ├── entities/
│       │       │   └── setting.entity.ts
│       │       └── dto/
│       │
│       ├── infrastructure/                            # Infrastructure services
│       │   ├── media/                                 # Media Storage (84% ready)
│       │   │   ├── media.module.ts
│       │   │   ├── services/
│       │   │   │   ├── s3.service.ts
│       │   │   │   └── upload.service.ts
│       │   │   └── entities/
│       │   │       └── media.entity.ts
│       │   │
│       │   ├── mail/                                  # Email Service (85% ready)
│       │   │   ├── mail.module.ts
│       │   │   ├── services/
│       │   │   │   ├── resend.service.ts
│       │   │   │   └── webhook.service.ts
│       │   │   └── controllers/
│       │   │       └── webhook.controller.ts
│       │   │
│       │   ├── queue/                                 # BullMQ Queue Management
│       │   │   ├── queue.module.ts
│       │   │   ├── bull-board.module.ts              # Queue monitoring UI
│       │   │   └── services/
│       │   │       └── queue.service.ts
│       │   │
│       │   ├── ai/                                    # AI Services (70% ready)
│       │   │   ├── ai.module.ts
│       │   │   ├── services/
│       │   │   │   ├── ai.service.ts                 # Abstract service
│       │   │   │   └── providers/
│       │   │   │       ├── openai.provider.ts
│       │   │   │       ├── anthropic.provider.ts
│       │   │   │       └── google.provider.ts
│       │   │   └── interfaces/
│       │   │       └── ai-provider.interface.ts
│       │   │
│       │   ├── backup/                                # Backup Service (75% ready)
│       │   │   ├── backup.module.ts
│       │   │   ├── services/
│       │   │   │   ├── database-backup.service.ts
│       │   │   │   ├── file-backup.service.ts
│       │   │   │   └── restore.service.ts            # TODO: Test
│       │   │   └── scheduled-jobs/
│       │   │       └── backup.job.ts
│       │   │
│       │   └── logging/                               # System Logging (72% ready)
│       │       ├── logging.module.ts
│       │       ├── services/
│       │       │   ├── logger.service.ts
│       │       │   └── audit.service.ts
│       │       └── controllers/
│       │           └── logs.controller.ts
│       │
│       └── shared/                                    # Shared utilities
           ├── shared.module.ts
           ├── services/
           │   └── cache.service.ts
           ├── entities/
           │   └── base.entity.ts                     # Base entity with tenant support
           └── dto/
               ├── pagination.dto.ts
               └── response.dto.ts
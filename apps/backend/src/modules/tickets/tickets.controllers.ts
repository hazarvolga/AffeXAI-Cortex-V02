import type { Type } from "@nestjs/common";
import { TicketsController } from "./tickets.controller";
import { TicketAssignmentRulesController } from "./controllers/ticket-assignment-rules.controller";
import { TicketEscalationRulesController } from "./controllers/ticket-escalation-rules.controller";
import { TicketAttachmentsController } from "./controllers/ticket-attachments.controller";
import { TicketTemplatesController } from "./controllers/ticket-templates.controller";
import { TicketAnalyticsController } from "./controllers/ticket-analytics.controller";
import { TicketEmailWebhookController } from "./controllers/ticket-email-webhook.controller";
import { TicketCSATController } from "./controllers/ticket-csat.controller";
import { KnowledgeBaseController } from "./controllers/knowledge-base.controller";
import { KnowledgeBaseCategoryController } from "./controllers/knowledge-base-category.controller";
import { PublicKnowledgeBaseCategoryController } from "./controllers/public-knowledge-base-category.controller";
import { TicketCategoryController } from "./controllers/ticket-category.controller";
import { TicketMacroController } from "./controllers/ticket-macro.controller";
import { AICategorizationController } from "./controllers/ai-categorization.controller";

/**
 * Registration order is route-matching order. TicketsController owns `tickets/:id`,
 * so it stays last; otherwise `/tickets/macros` and `/tickets/templates` hit it.
 */
export const TICKETS_CONTROLLERS: Type<unknown>[] = [
  TicketAssignmentRulesController,
  TicketEscalationRulesController,
  TicketAttachmentsController,
  TicketTemplatesController,
  TicketAnalyticsController,
  TicketEmailWebhookController,
  TicketCSATController,
  KnowledgeBaseController,
  KnowledgeBaseCategoryController,
  PublicKnowledgeBaseCategoryController,
  TicketCategoryController,
  TicketMacroController,
  AICategorizationController,
  TicketsController,
];

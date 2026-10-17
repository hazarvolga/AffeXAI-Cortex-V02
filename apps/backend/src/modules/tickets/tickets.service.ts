import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, IsNull } from "typeorm";
import { randomUUID } from "crypto";
import { CortexOutboxService } from "../../core/cortex/cortex-outbox.service";
import { EventEmitter2 } from "@nestjs/event-emitter";

// Entities
import { Ticket } from "./entities/ticket.entity";
import { TicketMessage } from "./entities/ticket-message.entity";
import { TicketCategory } from "./entities/ticket-category.entity";
import { TicketAuditLog } from "./entities/ticket-audit-log.entity";
import { User } from "../users/entities/user.entity";
import { Role } from "../roles/entities/role.entity";

// DTOs
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { TicketFiltersDto } from "./dto/ticket-filters.dto";
import { AddMessageDto } from "./dto/add-message.dto";

// Enums/Interfaces
import { TicketPriority } from "./enums/ticket-priority.enum";
import { TicketStatus } from "./enums/ticket-status.enum";
import { UserRole } from "../users/enums/user-role.enum";
import {
  MailChannel,
  MailPriority,
} from "../mail/interfaces/mail-service.interface";
import { LogContext } from "../../common/entities/system-log.entity";

// Services
import { TenantService } from "../../core/tenant/tenant.service";
import { MailService } from "../mail/mail.service";
import { SlaService } from "./services/sla.service";
import { TicketAttachmentService } from "./services/ticket-attachment.service";
import { TicketAttachmentEntity } from "./entities/ticket-attachment.entity";
import { TicketEmailService } from "./services/ticket-email.service";
import { TicketAutoTaggingService } from "./services/ticket-auto-tagging.service";
import { TicketNotificationsGateway } from "./gateways/ticket-notifications.gateway";
import { SettingsService } from "../settings/settings.service";
import { AiService } from "../ai/ai.service";
import { AiModel, AiProvider } from "../settings/dto/ai-settings.dto";
import { AppLoggerService } from "../../common/logging/app-logger.service";
import { FaqEnhancedSearchService } from "../faq-learning/services/faq-enhanced-search.service";
import { KnowledgeBaseService } from "./services/knowledge-base.service";
import { StrategyService } from "../strategy/services/strategy.service";
import { NotificationsService } from "../notifications/notifications.service";

const AI_PRIORITY_LEVELS = ["low", "medium", "high", "urgent"] as const;
type AiPriorityLevel = (typeof AI_PRIORITY_LEVELS)[number];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Unknown error";
}

function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(getErrorMessage(error));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isAiPriorityLevel(value: unknown): value is AiPriorityLevel {
  return AI_PRIORITY_LEVELS.includes(value as AiPriorityLevel);
}

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketMessage)
    private readonly messageRepository: Repository<TicketMessage>,
    @InjectRepository(TicketCategory)
    private readonly categoryRepository: Repository<TicketCategory>,
    @InjectRepository(TicketAuditLog)
    private readonly auditLogRepository: Repository<TicketAuditLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly mailService: MailService,
    private readonly slaService: SlaService,
    private readonly ticketEmailService: TicketEmailService,
    private readonly autoTaggingService: TicketAutoTaggingService,
    @Inject(forwardRef(() => TicketNotificationsGateway))
    private readonly notificationsGateway: TicketNotificationsGateway,
    private readonly settingsService: SettingsService,
    private readonly aiService: AiService,
    private readonly appLoggerService: AppLoggerService,
    private readonly faqSearchService: FaqEnhancedSearchService,
    private readonly knowledgeBaseService: KnowledgeBaseService,
    private readonly eventEmitter: EventEmitter2,

    private readonly tenantService: TenantService,
    private readonly strategyService: StrategyService,
    private readonly cortexOutbox: CortexOutboxService,
    private readonly attachmentService: TicketAttachmentService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Get current tenant ID from TenantService
   * @private
   */
  private getActiveTenantId(): string {
    const context = this.tenantService.getTenantContext();
    if (
      !context?.tenantId ||
      !["authenticated", "system"].includes(context.source || "")
    ) {
      throw new ForbiddenException("Verified ticket tenant scope is required");
    }
    return context.tenantId;
  }

  /**
   * Generate next display number for ticket (SUP-00001 format)
   * Uses PostgreSQL sequence for auto-increment
   * @private
   */
  private async generateDisplayNumber(): Promise<string> {
    try {
      const result: Array<{ next_val: number | string }> =
        await this.ticketRepository.query(
          `SELECT nextval('ticket_display_number_seq') as next_val`,
        );
      const nextNumber = result[0].next_val;
      const displayNumber = `SUP-${String(nextNumber).padStart(5, "0")}`;

      this.logger.log(`Generated ticket display number: ${displayNumber}`);
      return displayNumber;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to generate display number: ${getErrorMessage(error)}`,
      );
      // Fallback: use timestamp-based number
      const fallbackNumber = Date.now().toString().slice(-5);
      return `SUP-${fallbackNumber}`;
    }
  }

  /**
   * Get all users with Support Manager role
   * @private
   */
  private async getSupportManagers(): Promise<User[]> {
    try {
      const supportManagerRole = await this.roleRepository.findOne({
        where: { name: UserRole.SUPPORT_MANAGER },
        relations: ["users"],
      });

      if (!supportManagerRole || !supportManagerRole.users) {
        this.logger.warn("No support manager role found or no users assigned");
        return [];
      }

      return supportManagerRole.users;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to get support managers: ${getErrorMessage(error)}`,
      );
      return [];
    }
  }

  /**
   * Create a new support ticket
   * @param userId - ID of the user creating the ticket (from @CurrentUser)
   * @param dto - Ticket creation data
   */
  async create(
    userId: string,
    dto: CreateTicketDto,
  ): Promise<Ticket & { notificationWarnings?: string[] }> {
    const activeTenantId = this.getActiveTenantId();
    const savedTicket = await this.ticketRepository.manager.transaction(
      async (manager) => {
        const tickets = manager.getRepository(Ticket);
        const messages = manager.getRepository(TicketMessage);
        const audits = manager.getRepository(TicketAuditLog);
        if (
          dto.categoryId &&
          !(await manager.getRepository(TicketCategory).findOne({
            where: {
              id: dto.categoryId,
              tenantId: activeTenantId,
              deletedAt: IsNull(),
            },
          }))
        ) {
          throw new BadRequestException("Category must belong to this tenant");
        }
        const { attachmentIds = [], ...fields } = dto;
        const draft = tickets.create({
          ...fields,
          userId,
          displayNumber: await this.generateDisplayNumber(),
          status: TicketStatus.NEW,
          tenantId: activeTenantId,
        });
        const saved = await tickets.save({
          ...draft,
          ...this.slaService.calculateSLADueDates(draft),
        });
        const initial = await messages.save(
          messages.create({
            ticketId: saved.id,
            tenantId: activeTenantId,
            authorId: userId,
            content: dto.description,
            isInternal: false,
            attachmentIds,
          }),
        );
        await this.attachmentService.bindDrafts(manager, attachmentIds, {
          tenantId: activeTenantId,
          ownerId: userId,
          ticketId: saved.id,
          messageId: initial.id,
        });
        await audits.save({
          ticketId: saved.id,
          userId,
          action: "ticket_created",
          entityType: "ticket",
          entityId: saved.id,
          newValues: {
            subject: saved.subject,
            priority: saved.priority,
            status: saved.status,
            categoryId: saved.categoryId,
          },
          description: "Ticket created",
        });
        await audits.save({
          ticketId: saved.id,
          userId,
          action: "message_added",
          entityType: "message",
          entityId: initial.id,
          newValues: { content: dto.description },
          description: "Initial ticket message",
        });
        return saved;
      },
    );

    // Apply auto-tagging
    try {
      const autoTags = await this.autoTaggingService.autoTag(savedTicket);
      if (autoTags.length > 0) {
        savedTicket.tags = Array.from(
          new Set([...(savedTicket.tags || []), ...autoTags]),
        );
        await this.ticketRepository.save(savedTicket);
        this.logger.log(
          `Auto-tagged ticket ${savedTicket.id} with: ${autoTags.join(", ")}`,
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        `Failed to auto-tag ticket ${savedTicket.id}: ${getErrorMessage(error)}`,
      );
      // Continue even if auto-tagging fails
    }

    // Send email notification using TicketEmailService
    this.logger.log(
      `[EMAIL DEBUG] Starting email notification for ticket ${savedTicket.id}`,
    );
    const ticketWithRelations = await this.findOne(savedTicket.id);
    const customer = await this.userRepository.findOne({
      where: { id: userId, tenantId: activeTenantId },
    });
    this.logger.log(
      `[EMAIL DEBUG] Customer found: ${customer ? customer.email : "null"}`,
    );

    let notificationWarnings: string[] = [];
    if (customer) {
      this.logger.log(
        `[EMAIL DEBUG] Calling sendTicketCreatedEmail for ${customer.email}`,
      );

      // Get assigned user if ticket is assigned
      const assignedUser = ticketWithRelations.assignedTo;

      // Get all support managers
      const supportManagers = await this.getSupportManagers();

      // Send emails to all recipients (customer, assigned user, support managers)
      notificationWarnings = await this.sendTicketNotification(
        savedTicket.id,
        userId,
        "ticket_created",
        () =>
          this.ticketEmailService.sendTicketCreatedEmail(
            ticketWithRelations,
            customer,
            assignedUser,
            supportManagers,
          ),
      );
      if (!notificationWarnings.length)
        this.logger.log(`[EMAIL DEBUG] sendTicketCreatedEmail completed`);
    } else {
      this.logger.warn(`[EMAIL DEBUG] No customer found for userId: ${userId}`);
    }

    // Send real-time notification via WebSocket
    this.notificationsGateway.emitTicketCreated(
      savedTicket.id,
      userId,
      ticketWithRelations,
    );

    // 🧠 NEURAL GRID SIGNAL: Ticket Created (Context)
    this.eventEmitter.emit("neural.signal", {
      tenantId: activeTenantId,
      source: "tickets",
      type: "ticket.created",
      context: `New ticket created: ${savedTicket.subject}. Description: ${dto.description}`,
      data: { ticketId: savedTicket.id, priority: savedTicket.priority },
    });

    return notificationWarnings.length
      ? { ...ticketWithRelations, notificationWarnings }
      : ticketWithRelations;
  }

  /**
   * Find all tickets with filters
   * @param filters - Filter criteria
   */
  async findAll(filters: TicketFiltersDto): Promise<Ticket[]> {
    const activeTenantId = this.getActiveTenantId();
    const query = this.ticketRepository
      .createQueryBuilder("ticket")
      .where("ticket.tenantId = :tenantId", { tenantId: activeTenantId })
      .leftJoinAndSelect("ticket.user", "user")
      .leftJoinAndSelect("ticket.assignedTo", "assignedTo")
      .leftJoinAndSelect("ticket.category", "category")
      .orderBy("ticket.createdAt", "DESC");

    if (filters.status) {
      query.andWhere("ticket.status = :status", { status: filters.status });
    }

    if (filters.priority) {
      query.andWhere("ticket.priority = :priority", {
        priority: filters.priority,
      });
    }

    if (filters.userId) {
      query.andWhere("ticket.userId = :userId", { userId: filters.userId });
    }

    if (filters.assignedToId) {
      query.andWhere("ticket.assignedToId = :assignedToId", {
        assignedToId: filters.assignedToId,
      });
    }

    if (filters.categoryId) {
      query.andWhere("ticket.categoryId = :categoryId", {
        categoryId: filters.categoryId,
      });
    }

    if (filters.search) {
      query.andWhere(
        "(ticket.subject ILIKE :search OR ticket.description ILIKE :search)",
        { search: `%${filters.search}%` },
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      query.andWhere("ticket.tags && :tags", { tags: filters.tags });
    }

    return query.getMany();
  }

  /**
   * Find recent tickets by user ID
   * @param userId - User ID
   * @param limit - Number of tickets to return (default: 5)
   */
  async getRecentByUser(userId: string, limit = 5): Promise<Ticket[]> {
    const tenantId = this.getActiveTenantId();
    return this.ticketRepository.find({
      where: { userId, tenantId },
      order: { createdAt: "DESC" },
      take: limit,
      relations: ["category"],
    });
  }

  /**
   * Find a single ticket by ID
   * @param id - Ticket ID
   */
  async findOne(id: string): Promise<Ticket> {
    const activeTenantId = this.getActiveTenantId();
    const where = { id, tenantId: activeTenantId, deletedAt: IsNull() };

    const ticket = await this.ticketRepository.findOne({
      where,
      relations: [
        "user",
        "assignedTo",
        "category",
        "messages",
        "messages.author",
      ],
      order: {
        messages: {
          createdAt: "ASC",
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  /**
   * Update ticket status
   * @param id - Ticket ID
   * @param status - New status
   * @param userId - ID of user making the change
   */
  async updateStatus(
    id: string,
    status: TicketStatus,
    userId: string | null,
  ): Promise<Ticket & { notificationWarnings?: string[] }> {
    const activeTenantId = this.getActiveTenantId();
    if (
      userId === null &&
      (this.tenantService.getTenantContext()?.source !== "system" ||
        status === TicketStatus.RESOLVED)
    ) {
      throw new ForbiddenException(
        "A verified actor is required for this status transition",
      );
    }
    const transition = await this.ticketRepository.manager.transaction(
      async (manager) => {
        const tickets = manager.getRepository(Ticket);
        const ticket = await tickets.findOne({
          where: { id, tenantId: activeTenantId, deletedAt: IsNull() },
          lock: { mode: "pessimistic_write" },
        });
        if (!ticket)
          throw new NotFoundException(`Ticket with ID ${id} not found`);
        const oldStatus = ticket.status;
        if (oldStatus === status) return { changed: false, ticket, oldStatus };
        const occurredAt = new Date();
        const updated = this.applyStatusTransition(ticket, status, occurredAt);
        await tickets.save(updated);
        await manager.getRepository(TicketAuditLog).save({
          ticketId: id,
          userId,
          action: "status_changed",
          entityType: "ticket",
          entityId: id,
          oldValues: { status: oldStatus },
          newValues: { status },
          description: `Status changed from ${oldStatus} to ${status}`,
          ...(userId === null ? { metadata: { actorType: "system" } } : {}),
        });
        if (status === TicketStatus.RESOLVED) {
          await this.cortexOutbox.recordTicketResolved(manager, {
            eventId: randomUUID(),
            tenantId: activeTenantId,
            ticketId: id,
            actorId: userId,
            occurredAt,
            payload: {
              successScore: 5,
              ticketId: id,
              resolutionTime: updated.resolutionTimeHours ?? null,
              context: `Ticket resolved successfully: ${updated.subject}. Solution found in dialogue.`,
            },
          });
        }
        return { changed: true, ticket: updated, oldStatus };
      },
    );

    // External work starts only after the status, audit and durable event commit.
    const ticketWithRelations = await this.findOne(id);
    if (!transition.changed) return ticketWithRelations;
    const notificationWarnings: string[] = [];
    if (status === TicketStatus.RESOLVED) {
      const customer = await this.userRepository.findOne({
        where: { id: transition.ticket.userId, tenantId: activeTenantId },
      });
      const resolver = await this.userRepository.findOne({
        where: { id: userId, tenantId: activeTenantId },
      });
      if (customer && resolver) {
        notificationWarnings.push(
          ...(await this.sendTicketNotification(
            id,
            userId,
            "ticket_resolved",
            () =>
              this.ticketEmailService.sendTicketResolvedEmail(
                ticketWithRelations,
                customer,
                resolver,
              ),
          )),
        );
      }
    }
    const userIds = [transition.ticket.userId];
    if (transition.ticket.assignedToId)
      userIds.push(transition.ticket.assignedToId);
    this.notificationsGateway.emitStatusChanged(
      id,
      transition.oldStatus,
      status,
      userIds,
    );
    return notificationWarnings.length
      ? { ...ticketWithRelations, notificationWarnings }
      : ticketWithRelations;
  }

  private async sendTicketNotification(
    ticketId: string,
    userId: string | null,
    template: string,
    send: () => Promise<void>,
  ): Promise<string[]> {
    try {
      await send();
      return [];
    } catch {
      const warnings = ["email_delivery_failed"];
      this.logger.error(
        `Ticket ${ticketId}: email delivery failed after data commit`,
      );
      try {
        await this.auditLogRepository.save({
          ticketId,
          userId,
          action: "notification_failed",
          entityType: "ticket",
          entityId: ticketId,
          metadata: {
            channel: "email",
            template,
            failureCode: "delivery_unavailable",
          },
          description: "Ticket data committed; email notification failed",
        });
      } catch {
        warnings.push("notification_audit_failed");
        this.logger.error(
          `Ticket ${ticketId}: notification failure audit could not be persisted`,
        );
      }
      return warnings;
    }
  }

  private applyStatusTransition(
    ticket: Ticket,
    status: TicketStatus,
    occurredAt: Date,
  ): Ticket {
    let updated = { ...ticket, status };
    if (
      ticket.status === TicketStatus.NEW &&
      status === TicketStatus.OPEN &&
      !ticket.firstResponseAt
    ) {
      updated = { ...updated, firstResponseAt: occurredAt };
      updated = {
        ...updated,
        responseTimeHours: this.slaService.calculateResponseTime(updated),
        isSLABreached: this.slaService.checkSLABreach(updated),
      };
    }
    if (status === TicketStatus.RESOLVED && !ticket.resolvedAt) {
      updated = { ...updated, resolvedAt: occurredAt };
      updated = {
        ...updated,
        resolutionTimeHours: this.slaService.calculateResolutionTime(updated),
        isSLABreached: this.slaService.checkSLABreach(updated),
      };
    }
    if (status === TicketStatus.CLOSED && !ticket.closedAt)
      updated = { ...updated, closedAt: occurredAt };
    return updated;
  }

  /**
   * Assign ticket to a support agent
   * @param id - Ticket ID
   * @param assignedToId - Support agent user ID
   */
  private async requireSupportAgent(
    id: string,
    tenantId: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, tenantId, isActive: true, deletedAt: IsNull() },
      relations: ["roleEntity", "userRoles", "userRoles.role"],
    });
    const staff = new Set<string>([
      UserRole.ADMIN,
      UserRole.EDITOR,
      UserRole.SUPPORT,
      UserRole.SUPPORT_MANAGER,
      UserRole.SUPPORT_AGENT,
    ]);
    const roles = [
      user?.roleEntity,
      ...(user?.userRoles?.map((assignment) => assignment.role) || []),
    ];
    if (
      !user ||
      !roles.some(
        (role) =>
          role?.tenantId === tenantId &&
          role.isActive === true &&
          staff.has(role.name),
      )
    ) {
      throw new BadRequestException(
        "An active support agent in this tenant is required",
      );
    }
    return user;
  }

  async assignTo(
    id: string,
    assignedToId: string,
    assignerId: string,
  ): Promise<Ticket> {
    const activeTenantId = this.getActiveTenantId();
    const ticket = await this.findOne(id);
    const assignedUser = await this.requireSupportAgent(
      assignedToId,
      activeTenantId,
    );
    const oldAssignedToId = ticket.assignedToId;
    await this.ticketRepository.save({
      ...ticket,
      assignedToId,
      status: TicketStatus.OPEN,
    });

    // Create audit log for assignment
    await this.createAuditLog(
      id,
      assignerId,
      "assigned",
      "ticket",
      id,
      { assignedToId: oldAssignedToId },
      { assignedToId },
      `Ticket assigned to user ${assignedToId}`,
    );

    // Get users for email
    const ticketWithRelations = await this.findOne(id);
    const assigner = await this.userRepository.findOne({
      where: { id: assignerId, tenantId: activeTenantId },
    });

    // Send assignment email
    if (assignedUser && assigner) {
      await this.ticketEmailService.sendTicketAssignedEmail(
        ticketWithRelations,
        assignedUser,
        assigner,
      );
    }

    // Send real-time notification via WebSocket
    this.notificationsGateway.emitTicketAssigned(
      id,
      assignedToId,
      ticketWithRelations,
    );

    return ticketWithRelations;
  }

  /**
   * Add a message to a ticket
   * @param ticketId - Ticket ID
   * @param userId - Author user ID
   * @param dto - Message data
   */
  async addMessage(
    ticketId: string,
    userId: string,
    dto: AddMessageDto,
  ): Promise<TicketMessage> {
    const ticket = await this.findOne(ticketId);

    const savedMessage = await this.ticketRepository.manager.transaction(
      async (manager) => {
        const tickets = manager.getRepository(Ticket);
        const messages = manager.getRepository(TicketMessage);
        const audits = manager.getRepository(TicketAuditLog);
        const current = await tickets.findOne({
          where: {
            id: ticketId,
            tenantId: ticket.tenantId,
            deletedAt: IsNull(),
          },
          lock: { mode: "pessimistic_write" },
        });
        if (!current) throw new NotFoundException("Ticket unavailable");
        const saved = await messages.save(
          messages.create({
            ticketId,
            tenantId: ticket.tenantId,
            authorId: userId,
            content: dto.content,
            isInternal: dto.isInternal || false,
            attachmentIds: dto.attachmentIds || [],
          }),
        );
        await this.attachmentService.bindDrafts(
          manager,
          dto.attachmentIds || [],
          {
            tenantId: ticket.tenantId,
            ownerId: userId,
            ticketId,
            messageId: saved.id,
          },
        );
        const reopen =
          !dto.isInternal &&
          (current.status === TicketStatus.NEW ||
            (userId === current.userId &&
              [
                TicketStatus.PENDING_CUSTOMER,
                TicketStatus.PENDING_INTERNAL,
                TicketStatus.PENDING_THIRD_PARTY,
              ].includes(current.status)));
        if (reopen) {
          await tickets.update(
            { id: ticketId, tenantId: ticket.tenantId },
            { status: TicketStatus.OPEN },
          );
          await audits.save({
            ticketId,
            userId,
            action: "status_updated",
            entityType: "ticket",
            entityId: ticketId,
            oldValues: { status: current.status },
            newValues: { status: TicketStatus.OPEN },
            description: "Status changed due to new message",
          });
        }
        await audits.save({
          ticketId,
          userId,
          action: "message_added",
          entityType: "message",
          entityId: saved.id,
          newValues: { content: dto.content, isInternal: dto.isInternal },
          description: "Message added to ticket",
        });
        if (!dto.isInternal) {
          const recipientId =
            userId === current.userId ? current.assignedToId : current.userId;
          if (recipientId && recipientId !== userId) {
            const fromCustomer = userId === current.userId;
            await this.notificationsService.createNotification(
              {
                userId: recipientId,
                type: "ticket_message",
                message: fromCustomer
                  ? `Atandığınız destek talebinde yeni bir müşteri mesajı var: ${current.subject}`
                  : `Destek talebinizde yeni bir yanıt var: ${current.subject}`,
                metadata: {
                  ticketId,
                  messageId: saved.id,
                  authorId: userId,
                },
              },
              manager,
            );
          }
        }
        return saved;
      },
    );

    // Send message email notification (only if not internal)
    if (!dto.isInternal) {
      const messageWithAuthor = await this.messageRepository.findOne({
        where: { id: savedMessage.id, tenantId: ticket.tenantId },
        relations: ["author"],
      });

      // Check if message author is customer or support
      const isCustomerMessage = userId === ticket.userId;

      if (messageWithAuthor) {
        const customer = await this.userRepository.findOne({
          where: { id: ticket.userId, tenantId: ticket.tenantId },
        });

        // Emit ticket.message.created event for email notifications
        this.eventEmitter.emit("ticket.message.created", {
          tenantId: ticket.tenantId,
          ticketId: ticket.id,
          messageId: savedMessage.id,
          isFromCustomer: isCustomerMessage,
          customerEmail: customer?.email,
          customerName: customer
            ? `${customer.firstName} ${customer.lastName}`
            : undefined,
          supportEmail: ticket.assignedTo?.email,
          supportName: ticket.assignedTo
            ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
            : undefined,
          ticketSubject: ticket.subject,
          messageContent: dto.content,
        });

        this.logger.log(
          `📧 Emitted ticket.message.created event for ticket ${ticket.id}`,
        );
      }
    }

    const messageWithAuthor = await this.messageRepository.findOne({
      where: { id: savedMessage.id, tenantId: ticket.tenantId },
      relations: ["author"],
    });

    // Send real-time notification via WebSocket
    const recipientUserIds = [ticket.userId];
    if (ticket.assignedToId && ticket.assignedToId !== userId) {
      recipientUserIds.push(ticket.assignedToId);
    }
    this.notificationsGateway.emitNewMessage(
      ticketId,
      messageWithAuthor,
      recipientUserIds,
    );

    return messageWithAuthor;
  }

  async getStats() {
    const activeTenantId = this.getActiveTenantId();
    const [
      total,
      newCount,
      openCount,
      pendingCustomerCount,
      resolvedCount,
      closedCount,
    ] = await Promise.all([
      this.ticketRepository.count({ where: { tenantId: activeTenantId } }),
      this.ticketRepository.count({
        where: { status: TicketStatus.NEW, tenantId: activeTenantId },
      }),
      this.ticketRepository.count({
        where: { status: TicketStatus.OPEN, tenantId: activeTenantId },
      }),
      this.ticketRepository.count({
        where: {
          status: TicketStatus.PENDING_CUSTOMER,
          tenantId: activeTenantId,
        },
      }),
      this.ticketRepository.count({
        where: { status: TicketStatus.RESOLVED, tenantId: activeTenantId },
      }),
      this.ticketRepository.count({
        where: { status: TicketStatus.CLOSED, tenantId: activeTenantId },
      }),
    ]);

    // Calculate real SLA metrics
    const breachedCount = await this.ticketRepository.count({
      where: { isSLABreached: true, tenantId: activeTenantId },
    });

    // SLA Compliance = (Total Tickets - Breached Tickets) / Total Tickets * 100
    const compliantCount = total - breachedCount;
    const slaCompliance =
      total > 0 ? Number(((compliantCount / total) * 100).toFixed(1)) : 100;
    const slaBreaches = breachedCount;

    const durations = await this.ticketRepository
      .createQueryBuilder("ticket")
      .select(
        "AVG(CASE WHEN ticket.responseTimeHours >= 0 THEN ticket.responseTimeHours END)",
        "response",
      )
      .addSelect(
        "AVG(CASE WHEN ticket.resolutionTimeHours >= 0 THEN ticket.resolutionTimeHours END)",
        "resolution",
      )
      .where("ticket.tenantId = :tenantId", { tenantId: activeTenantId })
      .getRawOne<{ response: string | null; resolution: string | null }>();
    const averageResponseTime = Number(
      Number(durations?.response ?? 0).toFixed(2),
    );
    const averageResolutionTime = Number(
      Number(durations?.resolution ?? 0).toFixed(2),
    );

    return {
      totalTickets: total,
      openTickets: newCount, // Only NEW tickets
      inProgressTickets: openCount, // OPEN = In Progress (being worked on)
      resolvedTickets: resolvedCount,
      closedTickets: closedCount,
      averageResponseTime, // hours
      averageResolutionTime, // hours
      slaCompliance, // percentage
      slaBreaches, // count
      // Legacy format for backward compatibility
      total,
      byStatus: {
        new: newCount,
        open: openCount,
        pendingCustomer: pendingCustomerCount,
        resolved: resolvedCount,
        closed: closedCount,
      },
    };
  }

  /**
   * Find all ticket categories
   */
  async findAllCategories(): Promise<TicketCategory[]> {
    const activeTenantId = this.getActiveTenantId();
    return this.categoryRepository.find({
      where: {
        isActive: true,
        tenantId: activeTenantId,
      },
      relations: ["parent", "children"],
      order: { name: "ASC" },
    });
  }

  /**
   * Manually escalate a ticket
   * Increases priority and sends escalation notifications
   */
  async escalateTicket(
    ticketId: string,
    escalatedById: string,
    reason?: string,
    escalateTo?: string,
  ): Promise<Ticket> {
    const activeTenantId = this.getActiveTenantId();
    const where = { id: ticketId, tenantId: activeTenantId };

    const existing = await this.ticketRepository.findOne({
      where,
      relations: ["user", "assignedTo", "category"],
    });

    if (!existing) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    let ticket = { ...existing };
    const oldPriority = ticket.priority;
    const oldAssignedAgent = ticket.assignedTo;

    // Escalate priority (unless already URGENT)
    const priorityOrder = [
      TicketPriority.LOW,
      TicketPriority.MEDIUM,
      TicketPriority.HIGH,
      TicketPriority.URGENT,
    ];
    const currentIndex = priorityOrder.indexOf(ticket.priority);
    if (currentIndex < 0)
      throw new BadRequestException("Invalid ticket priority");
    if (currentIndex < priorityOrder.length - 1)
      ticket = { ...ticket, priority: priorityOrder[currentIndex + 1] };

    // Reassign if escalateTo is provided
    if (escalateTo) {
      const newAgent = await this.requireSupportAgent(
        escalateTo,
        activeTenantId,
      );

      ticket = { ...ticket, assignedToId: escalateTo, assignedTo: newAgent };
    }

    // Update ticket
    await this.ticketRepository.save(ticket);

    // Create audit log
    await this.createAuditLog(
      ticketId,
      escalatedById,
      "escalated",
      "ticket",
      ticketId,
      {
        priority: oldPriority,
        assignedToId: oldAssignedAgent?.id,
      },
      {
        priority: ticket.priority,
        assignedToId: ticket.assignedToId,
        reason,
      },
      `Ticket manually escalated${reason ? `: ${reason}` : ""}`,
    );

    // Send escalation notification
    if (escalateTo && ticket.assignedTo) {
      try {
        await this.ticketEmailService.sendTicketEscalatedEmail(
          ticket,
          ticket.assignedTo, // escalatedTo: User
          1, // escalationLevel
          reason || "Manual escalation",
        );
        this.logger.log(`Escalation notification sent for ticket ${ticketId}`);
      } catch (error: unknown) {
        this.logger.error(
          `Failed to send escalation notification: ${getErrorMessage(error)}`,
        );
      }

      // Emit real-time notification
      this.notificationsGateway.emitTicketEscalated(
        ticketId,
        [escalateTo],
        ticket,
      );
    }

    this.logger.log(
      `Ticket ${ticketId} escalated from ${oldPriority} to ${ticket.priority}`,
    );
    return ticket;
  }

  /**
   * Create audit log entry
   * @private
   */
  private async createAuditLog(
    ticketId: string,
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string | null,
    oldValues: Record<string, any> | null,
    newValues: Record<string, any> | null,
    description: string | null = null,
  ): Promise<void> {
    try {
      await this.auditLogRepository.save({
        ticketId,
        userId,
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        description,
      } as any); // Type assertion needed due to TypeORM create() overload ambiguity
    } catch (error: unknown) {
      this.logger.error(
        `Failed to create audit log: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  /**
   * Edit a message
   * @param ticketId - Ticket ID
   * @param messageId - Message ID to edit
   * @param userId - ID of user editing the message
   * @param newContent - New message content
   */
  async editMessage(
    ticketId: string,
    messageId: string,
    userId: string,
    newContent: string,
  ): Promise<TicketMessage> {
    const activeTenantId = this.getActiveTenantId();
    const message = await this.messageRepository.findOne({
      where: { id: messageId, ticketId, tenantId: activeTenantId },
      relations: ["author"],
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    // Store original content if not already stored
    if (!message.originalContent) {
      message.originalContent = message.content;
    }

    const oldContent = message.content;
    message.content = newContent;
    message.isEdited = true;
    message.editedAt = new Date();
    message.editedById = userId;

    await this.messageRepository.save(message);

    // Create audit log
    await this.createAuditLog(
      ticketId,
      userId,
      "message_edited",
      "message",
      messageId,
      { content: oldContent },
      { content: newContent },
      `Message edited by user ${userId}`,
    );

    const updatedMessage = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ["author", "editedBy"],
    });

    if (!updatedMessage) {
      throw new NotFoundException("Message not found after update");
    }

    // Send real-time notification via WebSocket
    const ticket = await this.findOne(ticketId);
    const userIds = [ticket.userId];
    if (ticket.assignedToId) {
      userIds.push(ticket.assignedToId);
    }
    this.notificationsGateway.emitMessageEdited(ticketId, messageId, userIds);

    return updatedMessage;
  }

  /**
   * Delete a message (soft delete)
   * @param ticketId - Ticket ID
   * @param messageId - Message ID to delete
   * @param userId - ID of user deleting the message
   */
  async deleteMessage(
    ticketId: string,
    messageId: string,
    userId: string,
  ): Promise<void> {
    const activeTenantId = this.getActiveTenantId();
    const message = await this.messageRepository.findOne({
      where: { id: messageId, ticketId, tenantId: activeTenantId },
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedById = userId;

    await this.messageRepository.save(message);

    // Create audit log
    await this.createAuditLog(
      ticketId,
      userId,
      "message_deleted",
      "message",
      messageId,
      { content: message.content },
      null,
      `Message deleted by user ${userId}`,
    );

    // Send real-time notification via WebSocket
    const ticket = await this.findOne(ticketId);
    const userIds = [ticket.userId];
    if (ticket.assignedToId) {
      userIds.push(ticket.assignedToId);
    }
    this.notificationsGateway.emitMessageDeleted(ticketId, messageId, userIds);
  }

  /**
   * Merge multiple tickets into one target ticket
   * All messages from source tickets are moved to target ticket
   * Source tickets are closed with reference to target ticket
   */
  async mergeTickets(
    ticketIds: string[],
    targetTicketId: string,
    userId: string,
    mergeNote?: string,
  ): Promise<Ticket> {
    const tenantId = this.getActiveTenantId();
    if (
      !ticketIds.length ||
      new Set(ticketIds).size !== ticketIds.length ||
      ticketIds.includes(targetTicketId)
    ) {
      throw new BadRequestException(
        "Unique source tickets distinct from the target are required",
      );
    }
    return this.ticketRepository.manager.transaction(async (manager) => {
      const tickets = manager.getRepository(Ticket);
      const messages = manager.getRepository(TicketMessage);
      const audits = manager.getRepository(TicketAuditLog);
      let target: Ticket | undefined;
      // Acquire locks in deterministic order so overlapping merges cannot deadlock.
      for (const id of [...ticketIds, targetTicketId].sort()) {
        const ticket = await tickets.findOne({
          where: { id, tenantId, deletedAt: IsNull() },
          lock: { mode: "pessimistic_write" },
        });
        if (!ticket)
          throw new NotFoundException("One or more tickets not found");
        if (id === targetTicketId) target = ticket;
      }
      const sources = await tickets.find({
        where: { id: In(ticketIds), tenantId, deletedAt: IsNull() },
      });
      if (sources.length !== ticketIds.length)
        throw new NotFoundException("One or more source tickets not found");
      if (
        !target ||
        sources.some((source) => source.userId !== target.userId)
      ) {
        throw new BadRequestException(
          "Merged tickets must belong to the same customer",
        );
      }
      await messages.save(
        messages.create({
          ticketId: targetTicketId,
          tenantId,
          authorId: userId,
          content: mergeNote || `Merged tickets: ${ticketIds.join(", ")}`,
          isInternal: true,
        }),
      );
      for (const source of sources) {
        await manager
          .getRepository(TicketAttachmentEntity)
          .update(
            { ticketId: source.id, tenantId, messageId: IsNull() },
            { ticketId: targetTicketId },
          );
        await messages.update(
          { ticketId: source.id, tenantId },
          { ticketId: targetTicketId },
        );
        await messages.save(
          messages.create({
            ticketId: targetTicketId,
            tenantId,
            authorId: userId,
            content: `Messages transferred from ticket ${source.id} (${source.subject})`,
            isInternal: true,
          }),
        );
        await tickets.save({
          ...source,
          status: TicketStatus.CLOSED,
          closedAt: source.closedAt || new Date(),
        });
        await audits.save({
          ticketId: source.id,
          userId,
          action: "ticket_merged",
          entityType: "ticket",
          entityId: source.id,
          oldValues: { status: source.status },
          newValues: {
            status: TicketStatus.CLOSED,
            mergedInto: targetTicketId,
          },
          description: `Ticket merged into ${targetTicketId}`,
        });
      }
      await audits.save({
        ticketId: targetTicketId,
        userId,
        action: "tickets_merged_in",
        entityType: "ticket",
        entityId: targetTicketId,
        newValues: { mergedTickets: ticketIds },
        description: `${ticketIds.length} tickets merged into this ticket`,
      });
      return tickets.findOneOrFail({
        where: { id: targetTicketId, tenantId },
        relations: [
          "user",
          "category",
          "assignedTo",
          "messages",
          "messages.author",
        ],
      });
    });
  }

  async splitTicket(
    originalTicketId: string,
    newTicketData: {
      newTicketSubject: string;
      newTicketDescription: string;
      newTicketPriority: string;
      newTicketCategoryId?: string;
      messageIds: string[];
      splitNote?: string;
    },
    userId: string,
  ): Promise<{ originalTicket: Ticket; newTicket: Ticket }> {
    const tenantId = this.getActiveTenantId();
    const ids = newTicketData.messageIds;
    if (!ids.length || new Set(ids).size !== ids.length)
      throw new BadRequestException("Unique message IDs are required");
    return this.ticketRepository.manager.transaction(async (manager) => {
      const tickets = manager.getRepository(Ticket);
      const messages = manager.getRepository(TicketMessage);
      const audits = manager.getRepository(TicketAuditLog);
      const original = await tickets.findOne({
        where: { id: originalTicketId, tenantId, deletedAt: IsNull() },
        lock: { mode: "pessimistic_write" },
      });
      if (!original) throw new NotFoundException("Original ticket not found");
      const categoryId =
        newTicketData.newTicketCategoryId || original.categoryId;
      if (
        categoryId &&
        !(await manager.getRepository(TicketCategory).findOne({
          where: { id: categoryId, tenantId, deletedAt: IsNull() },
        }))
      ) {
        throw new BadRequestException("Category must belong to this tenant");
      }
      const selected = await messages.find({
        where: {
          id: In(ids),
          ticketId: originalTicketId,
          tenantId,
          deletedAt: IsNull(),
        },
        lock: { mode: "pessimistic_write" },
      });
      if (selected.length !== ids.length)
        throw new BadRequestException(
          "Messages must belong to the original ticket",
        );
      const draft = tickets.create({
        tenantId,
        subject: newTicketData.newTicketSubject,
        description: newTicketData.newTicketDescription,
        priority: newTicketData.newTicketPriority as Ticket["priority"],
        categoryId,
        userId: original.userId,
        assignedToId: original.assignedToId,
        status: TicketStatus.NEW,
        displayNumber: await this.generateDisplayNumber(),
      });
      const created = await tickets.save({
        ...draft,
        ...this.slaService.calculateSLADueDates(draft),
      });
      await messages.save(
        messages.create({
          ticketId: created.id,
          tenantId,
          authorId: userId,
          content: newTicketData.newTicketDescription,
          isInternal: false,
        }),
      );
      const moved = await messages.update(
        { id: In(ids), ticketId: originalTicketId, tenantId },
        { ticketId: created.id },
      );
      if (moved.affected !== ids.length)
        throw new BadRequestException("Message ownership changed during split");
      await messages.save(
        messages.create({
          ticketId: originalTicketId,
          tenantId,
          authorId: userId,
          content:
            newTicketData.splitNote ||
            `${ids.length} messages moved to ticket ${created.id}`,
          isInternal: true,
        }),
      );
      await messages.save(
        messages.create({
          ticketId: created.id,
          tenantId,
          authorId: userId,
          content: `Split from ticket ${originalTicketId} - ${original.subject}`,
          isInternal: true,
        }),
      );
      await audits.save({
        ticketId: originalTicketId,
        userId,
        action: "ticket_split",
        entityType: "ticket",
        entityId: originalTicketId,
        newValues: { newTicketId: created.id, movedMessages: ids.length },
        description: "Ticket split",
      });
      await audits.save({
        ticketId: created.id,
        userId,
        action: "ticket_created_from_split",
        entityType: "ticket",
        entityId: created.id,
        newValues: { originalTicketId },
        description: `Created from split of ${originalTicketId}`,
      });
      const relations = [
        "user",
        "category",
        "assignedTo",
        "messages",
        "messages.author",
      ];
      return {
        originalTicket: await tickets.findOneOrFail({
          where: { id: originalTicketId, tenantId },
          relations,
        }),
        newTicket: await tickets.findOneOrFail({
          where: { id: created.id, tenantId },
          relations,
        }),
      };
    });
  }

  /**
   * DEPRECATED - Use TicketEmailService instead
   * Send ticket created email notification
   * @private
   */
  private async sendTicketCreatedEmail(ticket: Ticket): Promise<void> {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002";
      const ticketUrl = `${baseUrl}/portal/support/tickets/${ticket.id}`;
      const ticketNumber = `#${ticket.id.substring(0, 8).toUpperCase()}`;
      const customerName = ticket.user?.firstName
        ? `${ticket.user.firstName} ${ticket.user.lastName}`
        : "Değerli Müşterimiz";

      const priorityLabels: Record<string, string> = {
        low: "Düşük",
        medium: "Orta",
        high: "Yüksek",
        urgent: "Acil",
      };

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; background: #f6f9fc; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; background: white; }
              .header { background: #1e40af; color: white; padding: 32px 24px; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { padding: 48px; }
              .content h2 { color: #1e293b; font-size: 24px; margin-bottom: 24px; }
              .content p { margin-bottom: 16px; }
              .ticket-box { background: #f1f5f9; border-radius: 8px; padding: 24px; margin: 24px 0; }
              .ticket-label { color: #64748b; font-size: 14px; font-weight: 500; margin-bottom: 4px; }
              .ticket-value { color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 16px 0; }
              .divider { border: 0; border-top: 1px solid #cbd5e1; margin: 16px 0; }
              .button-container { text-align: center; margin: 32px 0; }
              .button { background: #1e40af; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; font-weight: 600; }
              .help-text { text-align: center; color: #64748b; font-size: 14px; font-style: italic; margin-top: 24px; }
              .footer { text-align: center; color: #64748b; font-size: 14px; padding: 32px 48px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>XYZ Company</h1>
              </div>
              <div class="content">
                <h2>Destek Talebiniz Alındı</h2>
                <p>Merhaba ${customerName},</p>
                <p>Destek talebiniz başarıyla oluşturuldu ve ekibimiz en kısa sürede size dönüş yapacaktır.</p>
                
                <div class="ticket-box">
                  <div class="ticket-label">Talep Numarası:</div>
                  <div class="ticket-value">${ticketNumber}</div>
                  <hr class="divider">
                  <div class="ticket-label">Konu:</div>
                  <div class="ticket-value">${ticket.subject}</div>
                  <hr class="divider">
                  <div class="ticket-label">Öncelik:</div>
                  <div class="ticket-value">${priorityLabels[ticket.priority] || ticket.priority}</div>
                </div>

                <p>Talebinizin detaylarını görüntülemek ve mesajlaşmak için aşağıdaki butona tıklayabilirsiniz:</p>
                
                <div class="button-container">
                  <a href="${ticketUrl}" class="button">Talebi Görüntüle</a>
                </div>

                <p class="help-text">Ortalama yanıt süresi: ${ticket.priority === TicketPriority.URGENT ? "1-2 saat" : ticket.priority === TicketPriority.HIGH ? "4-6 saat" : "24 saat"}</p>
                
                <hr class="divider">
                
                <div class="footer">
                  Bu e-posta XYZ Company destek sistemi tarafından otomatik olarak gönderilmiştir.<br>
                  Talep numaranızı her zaman belirtiniz: ${ticketNumber}
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      await this.mailService.sendMail({
        to: {
          email: ticket.user.email,
          name: `${ticket.user.firstName} ${ticket.user.lastName}`,
        },
        subject: `Destek Talebiniz Oluşturuldu - ${ticketNumber}`,
        html: emailHtml,
        channel: MailChannel.SUPPORT,
        priority:
          ticket.priority === TicketPriority.URGENT
            ? MailPriority.HIGH
            : MailPriority.NORMAL,
        tags: ["ticket-created", `ticket-${ticket.id}`],
      });

      this.logger.log(
        `Ticket created email sent to ${ticket.user.email} for ticket ${ticket.id}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send ticket created email: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  /**
   * Send ticket assigned email notification
   * @private
   */
  private async sendTicketAssignedEmail(ticket: Ticket): Promise<void> {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002";
      const ticketUrl = `${baseUrl}/portal/support/tickets/${ticket.id}`;
      const ticketNumber = `#${ticket.id.substring(0, 8).toUpperCase()}`;
      const customerName = ticket.user?.firstName
        ? `${ticket.user.firstName} ${ticket.user.lastName}`
        : "Değerli Müşterimiz";

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; background: #f6f9fc; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; background: white; }
              .header { background: #1e40af; color: white; padding: 32px 24px; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { padding: 48px; }
              .content h2 { color: #1e293b; font-size: 24px; margin-bottom: 24px; }
              .content p { margin-bottom: 16px; }
              .ticket-box { background: #f1f5f9; border-radius: 8px; padding: 24px; margin: 24px 0; }
              .ticket-label { color: #64748b; font-size: 14px; font-weight: 500; margin-bottom: 4px; }
              .ticket-value { color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 4px 0; }
              .email-text { color: #64748b; font-size: 14px; margin: 0 0 16px 0; }
              .divider { border: 0; border-top: 1px solid #cbd5e1; margin: 16px 0; }
              .button-container { text-align: center; margin: 32px 0; }
              .button { background: #1e40af; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; font-weight: 600; }
              .footer { text-align: center; color: #64748b; font-size: 14px; padding: 32px 48px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>XYZ Company</h1>
              </div>
              <div class="content">
                <h2>Destek Talebiniz Üstlenildi</h2>
                <p>Merhaba ${customerName},</p>
                <p><strong>${ticketNumber}</strong> numaralı destek talebiniz ekibimizden <strong>${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}</strong> tarafından üstlenildi.</p>
                
                <div class="ticket-box">
                  <div class="ticket-label">Konu:</div>
                  <div class="ticket-value">${ticket.subject}</div>
                  <hr class="divider">
                  <div class="ticket-label">Sorumlu Destek Uzmanı:</div>
                  <div class="ticket-value">${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}</div>
                  <div class="email-text">${ticket.assignedTo.email}</div>
                </div>

                <p>${ticket.assignedTo.firstName}, talebinizi inceleyecek ve size en kısa sürede dönüş yapacaktır.</p>
                
                <div class="button-container">
                  <a href="${ticketUrl}" class="button">Talebi Görüntüle</a>
                </div>

                <hr class="divider">
                
                <div class="footer">
                  Bu e-posta XYZ Company destek sistemi tarafından otomatik olarak gönderilmiştir.<br>
                  Talep numaranızı her zaman belirtiniz: ${ticketNumber}
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      await this.mailService.sendMail({
        to: {
          email: ticket.user.email,
          name: `${ticket.user.firstName} ${ticket.user.lastName}`,
        },
        subject: `Destek Talebiniz Üstlenildi - ${ticketNumber}`,
        html: emailHtml,
        channel: MailChannel.SUPPORT,
        priority: MailPriority.NORMAL,
        tags: ["ticket-assigned", `ticket-${ticket.id}`],
      });

      this.logger.log(
        `Ticket assigned email sent to ${ticket.user.email} for ticket ${ticket.id}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send ticket assigned email: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  /**
   * Send new message email notification
   * @private
   */
  private async sendNewMessageEmail(
    ticket: Ticket,
    message: TicketMessage,
    isFromSupport: boolean,
  ): Promise<void> {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002";
      const ticketUrl = `${baseUrl}/portal/support/tickets/${ticket.id}`;
      const ticketNumber = `#${ticket.id.substring(0, 8).toUpperCase()}`;

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; background: #f6f9fc; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; background: white; }
              .header { background: #1e40af; color: white; padding: 32px 24px; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { padding: 48px; }
              .content h2 { color: #1e293b; font-size: 24px; margin-bottom: 24px; }
              .content p { margin-bottom: 16px; }
              .info-box { background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .info-label { color: #64748b; font-size: 14px; font-weight: 500; margin-bottom: 4px; }
              .info-value { color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 16px 0; }
              .message-box { background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 24px 0; }
              .message-label { color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
              .message-content { color: #1e293b; font-size: 16px; line-height: 1.8; margin: 0; white-space: pre-wrap; }
              .divider { border: 0; border-top: 1px solid #cbd5e1; margin: 12px 0; }
              .button-container { text-align: center; margin: 32px 0; }
              .button { background: #1e40af; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; font-weight: 600; }
              .footer { text-align: center; color: #64748b; font-size: 14px; padding: 32px 48px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>XYZ Company</h1>
              </div>
              <div class="content">
                <h2>${isFromSupport ? "Destek Ekibinden Yeni Mesaj" : "Talebinize Yeni Mesaj"}</h2>
                <p><strong>${ticketNumber}</strong> numaralı destek talebinize yeni bir mesaj eklendi.</p>
                
                <div class="info-box">
                  <div class="info-label">Konu:</div>
                  <div class="info-value">${ticket.subject}</div>
                  <hr class="divider">
                  <div class="info-label">Gönderen:</div>
                  <div class="info-value">${message.author.firstName} ${message.author.lastName}</div>
                </div>

                <div class="message-box">
                  <div class="message-label">Mesaj:</div>
                  <div class="message-content">${message.content}</div>
                </div>

                <p>${isFromSupport ? "Yanıtlamak için aşağıdaki butona tıklayın:" : "Mesajı görüntülemek için aşağıdaki butona tıklayın:"}</p>
                
                <div class="button-container">
                  <a href="${ticketUrl}" class="button">${isFromSupport ? "Yanıtla" : "Mesajı Görüntüle"}</a>
                </div>

                <hr class="divider">
                
                <div class="footer">
                  Bu e-posta XYZ Company destek sistemi tarafından otomatik olarak gönderilmiştir.<br>
                  Talep numaranızı her zaman belirtiniz: ${ticketNumber}
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      const recipientEmail = ticket.user.email;
      const recipientName = `${ticket.user.firstName} ${ticket.user.lastName}`;

      await this.mailService.sendMail({
        to: { email: recipientEmail, name: recipientName },
        subject: `Yeni Mesaj - ${ticketNumber}`,
        html: emailHtml,
        channel: MailChannel.SUPPORT,
        priority: MailPriority.NORMAL,
        tags: ["ticket-message", `ticket-${ticket.id}`],
      });

      this.logger.log(
        `New message email sent to ${recipientEmail} for ticket ${ticket.id}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send new message email: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  /**
   * Send ticket resolved email notification
   * @private
   */
  private async sendTicketResolvedEmail(ticket: Ticket): Promise<void> {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002";
      const ticketUrl = `${baseUrl}/portal/support/tickets/${ticket.id}`;
      const feedbackUrl = `${baseUrl}/portal/support/tickets/${ticket.id}/feedback`;
      const ticketNumber = `#${ticket.id.substring(0, 8).toUpperCase()}`;
      const customerName = ticket.user?.firstName
        ? `${ticket.user.firstName} ${ticket.user.lastName}`
        : "Değerli Müşterimiz";

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; background: #f6f9fc; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; background: white; }
              .header { background: #1e40af; color: white; padding: 32px 24px; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { padding: 48px; }
              .icon-container { text-align: center; margin: 24px 0; }
              .success-icon { display: inline-block; width: 64px; height: 64px; border-radius: 50%; background: #10b981; color: white; font-size: 36px; line-height: 64px; font-weight: 700; }
              .content h2 { color: #1e293b; font-size: 24px; margin-bottom: 24px; text-align: center; }
              .content p { margin-bottom: 16px; }
              .ticket-box { background: #f1f5f9; border-radius: 8px; padding: 24px; margin: 24px 0; }
              .ticket-label { color: #64748b; font-size: 14px; font-weight: 500; margin-bottom: 4px; }
              .ticket-value { color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 16px 0; }
              .divider { border: 0; border-top: 1px solid #cbd5e1; margin: 16px 0; }
              .button-container { text-align: center; margin: 24px 0; }
              .button-primary { background: #1e40af; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; font-weight: 600; }
              .button-secondary { background: #10b981; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; font-weight: 600; }
              .feedback-section { background: #fefce8; border-radius: 8px; padding: 32px 24px; margin-top: 32px; }
              .feedback-section h3 { color: #1e293b; font-size: 20px; text-align: center; margin-bottom: 16px; }
              .feedback-text { color: #334155; font-size: 15px; text-align: center; margin-bottom: 20px; }
              .footer { text-align: center; color: #64748b; font-size: 14px; padding: 32px 48px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>XYZ Company</h1>
              </div>
              <div class="content">
                <div class="icon-container">
                  <div class="success-icon">✓</div>
                </div>
                
                <h2>Destek Talebiniz Çözümlendi</h2>
                <p>Merhaba ${customerName},</p>
                <p><strong>${ticketNumber}</strong> numaralı destek talebiniz başarıyla çözümlendi.</p>
                
                <div class="ticket-box">
                  <div class="ticket-label">Konu:</div>
                  <div class="ticket-value">${ticket.subject}</div>
                  <hr class="divider">
                  <div class="ticket-label">Çözümleyen:</div>
                  <div class="ticket-value">${ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : "Destek Ekibi"}</div>
                </div>

                <p>Eğer sorununuz tam olarak çözülmediyse, talebi yeniden açabilir veya yeni bir destek talebi oluşturabilirsiniz.</p>
                
                <div class="button-container">
                  <a href="${ticketUrl}" class="button-primary">Talebi Görüntüle</a>
                </div>

                <hr class="divider">

                <div class="feedback-section">
                  <h3>Hizmetimizi Değerlendirin</h3>
                  <p class="feedback-text">Aldığınız hizmet hakkında görüşleriniz bizim için çok değerli. Lütfen birkaç dakikanızı ayırarak bizi değerlendirin.</p>
                  <div class="button-container">
                    <a href="${feedbackUrl}" class="button-secondary">Geri Bildirim Verin</a>
                  </div>
                </div>

                <hr class="divider">
                
                <div class="footer">
                  Bu e-posta XYZ Company destek sistemi tarafından otomatik olarak gönderilmiştir.<br>
                  Talep numaranızı her zaman belirtiniz: ${ticketNumber}
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      await this.mailService.sendMail({
        to: {
          email: ticket.user.email,
          name: `${ticket.user.firstName} ${ticket.user.lastName}`,
        },
        subject: `Destek Talebiniz Çözümlendi - ${ticketNumber}`,
        html: emailHtml,
        channel: MailChannel.SUPPORT,
        priority: MailPriority.NORMAL,
        tags: ["ticket-resolved", `ticket-${ticket.id}`],
      });

      this.logger.log(
        `Ticket resolved email sent to ${ticket.user.email} for ticket ${ticket.id}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send ticket resolved email: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  /**
   * Analyze ticket description with AI before creation
   * Now with context from FAQ Learning, Knowledge Base, and Knowledge Sources
   * @param problemDescription - The user's problem description
   * @param category - The selected category
   */
  async analyzeTicketWithAI(problemDescription: string, category: string) {
    const activeTenantId = this.getActiveTenantId();
    const startTime = Date.now();
    let aiConfiguration:
      | Awaited<ReturnType<SettingsService["getAiModuleConfiguration"]>>
      | undefined;

    try {
      this.logger.log(
        "🔍 [AI ANALYSIS] Starting ticket analysis with knowledge base context...",
      );

      // Get AI configuration from settings (using support module config)
      aiConfiguration = await this.settingsService.getAiModuleConfiguration(
        "support",
        activeTenantId,
      );
      const { apiKey, model, provider, revision } = aiConfiguration;

      this.logger.log(
        `🔍 [AI ANALYSIS] Config retrieved: { hasApiKey: ${!!apiKey}, model: ${model}, provider: ${provider} }`,
      );

      if (!apiKey) {
        this.logger.error(
          "❌ [AI ANALYSIS] No API key found for support module",
        );

        // Log error to database
        await this.appLoggerService.logError(
          LogContext.AI,
          "AI API key not configured for support module",
          new Error("Missing AI API key"),
          {
            module: "support",
            provider,
            model,
            category,
            problemDescriptionPreview: problemDescription.substring(0, 100),
          },
        );

        throw new Error("AI API key not configured for support module");
      }

      // Step 1: Gather context from FAQ Learning System and Knowledge Base
      this.logger.log(
        "📚 [AI ANALYSIS] Gathering context from FAQ and Knowledge Base...",
      );

      let contextSnippets: string[] = [];

      try {
        // Search FAQ for relevant entries
        const faqResults = await this.faqSearchService.search({
          query: problemDescription,
          options: {
            limit: 5,
            includeFaqs: true,
            includeArticles: true,
          },
        });

        this.logger.log(
          `📚 [AI ANALYSIS] Found ${faqResults.results.length} relevant FAQ/KB entries`,
        );

        // Extract context from search results
        contextSnippets = faqResults.results.map((result) => {
          return `[${result.type.toUpperCase()}] ${result.title}: ${result.snippet}`;
        });
      } catch (faqError: unknown) {
        this.logger.warn(
          `⚠️ [AI ANALYSIS] Failed to fetch FAQ context: ${getErrorMessage(faqError)}`,
        );
        // Continue without FAQ context
      }

      // Construct the enhanced analysis prompt with context
      const contextSection =
        contextSnippets.length > 0
          ? `\n\nRelevant Knowledge Base Context:\n${contextSnippets.join("\n")}\n`
          : "\n\nNo specific knowledge base context found for this issue.\n";

      const prompt = `You are an AI support assistant analyzing a customer support ticket. Use the provided knowledge base context to give accurate and helpful responses.

${contextSection}

Customer Problem:
${problemDescription}

Category: ${category}

Based on the customer's problem and the knowledge base context above, analyze the ticket and provide:

1. A concise summary of the issue (2-3 sentences in Turkish)
2. Suggested priority level based on urgency and impact
3. A helpful, specific suggestion or solution for the customer (in Turkish)

Respond ONLY with valid JSON in this exact format:
{
  "summary": "brief summary of the issue in Turkish",
  "priority": "low|medium|high|urgent",
  "suggestion": "specific, helpful suggestion or solution in Turkish based on knowledge base context"
}

IMPORTANT: Return ONLY the JSON object, no additional text, no markdown formatting, no code blocks.`;

      this.logger.log("🤖 [AI ANALYSIS] Sending request to AI service...");
      this.logger.debug(
        `📝 [AI ANALYSIS] Prompt length: ${prompt.length} chars, Context snippets: ${contextSnippets.length}`,
      );

      // Call AI service with the support module's provider/model
      const result = await this.aiService.generateCompletion(apiKey, prompt, {
        model,
        provider,
        credentialContext: {
          tenantId: activeTenantId,
          module: "support",
          provider,
          revision,
        },
        temperature: 0.3, // Lower temperature for more deterministic JSON output
        maxTokens: 2000, // Increased to prevent truncation (Gemini sometimes cuts off)
      });

      const duration = Date.now() - startTime;

      this.logger.log(`✅ [AI ANALYSIS] Received AI response in ${duration}ms`);
      this.logger.debug(
        `📄 [AI ANALYSIS] Raw response length: ${result.content.length} chars`,
      );

      // Log successful AI call
      await this.appLoggerService.logAiCall(provider, model, duration, true);

      // Parse the AI response with improved error handling
      try {
        // Log the raw response for debugging
        this.logger.debug(
          `🔍 [AI ANALYSIS] Raw AI response: ${result.content.substring(0, 500)}...`,
        );

        // Remove markdown code blocks if present
        let cleanedResponse = result.content.trim();

        // Remove ```json prefix
        if (cleanedResponse.startsWith("```json")) {
          cleanedResponse = cleanedResponse.slice(7);
        }
        // Remove ``` prefix
        if (cleanedResponse.startsWith("```")) {
          cleanedResponse = cleanedResponse.slice(3);
        }
        // Remove ``` suffix
        if (cleanedResponse.endsWith("```")) {
          cleanedResponse = cleanedResponse.slice(0, -3);
        }

        cleanedResponse = cleanedResponse.trim();

        // Validate the cleaned response is not empty
        if (!cleanedResponse || cleanedResponse.length < 10) {
          throw new Error("AI returned empty or incomplete response");
        }

        // Check if response looks truncated (common with Gemini)
        if (!cleanedResponse.endsWith("}")) {
          this.logger.warn(
            `⚠️ [AI ANALYSIS] Response appears truncated, attempting to fix...`,
          );
          // Try to close unclosed braces
          const openBraces = (cleanedResponse.match(/{/g) || []).length;
          const closeBraces = (cleanedResponse.match(/}/g) || []).length;
          if (openBraces > closeBraces) {
            cleanedResponse += "}";
            this.logger.debug(`🔧 [AI ANALYSIS] Added missing closing brace`);
          }
          // Try to close unclosed quotes
          if ((cleanedResponse.match(/"/g) || []).length % 2 !== 0) {
            cleanedResponse += '"';
            this.logger.debug(`🔧 [AI ANALYSIS] Added missing closing quote`);
          }
        }

        this.logger.debug(
          `🔍 [AI ANALYSIS] Cleaned response: ${cleanedResponse.substring(0, 300)}...`,
        );

        // Parse JSON
        const analysis: unknown = JSON.parse(cleanedResponse);

        // Validate required fields
        if (
          !isRecord(analysis) ||
          !isNonEmptyString(analysis.summary) ||
          !isNonEmptyString(analysis.suggestion) ||
          !isAiPriorityLevel(analysis.priority)
        ) {
          throw new Error("AI response missing required fields");
        }

        this.logger.log("✅ [AI ANALYSIS] Successfully parsed AI response");

        return {
          analysisAvailable: true,
          summary: analysis.summary,
          priority: analysis.priority || "medium",
          suggestion:
            analysis.suggestion ||
            "Destek ekibimiz en kısa sürede size yardımcı olacaktır.",
        };
      } catch (parseError: unknown) {
        this.logger.error(
          `❌ [AI ANALYSIS] Failed to parse AI response: ${getErrorMessage(parseError)}`,
        );
        this.logger.error(
          `📄 [AI ANALYSIS] Problematic response: ${result.content}`,
        );

        // Log parse error to database
        await this.appLoggerService.logError(
          LogContext.AI,
          `Failed to parse AI response: ${getErrorMessage(parseError)}`,
          toError(parseError),
          {
            provider,
            model,
            rawResponse: result.content.substring(0, 1000),
            category,
            problemDescriptionPreview: problemDescription.substring(0, 100),
          },
        );

        // Return a safe fallback response
        return {
          analysisAvailable: false,
          summary:
            "AI analizi şu anda kullanılamıyor. Talebinizi kontrol edip oluşturabilirsiniz.",
          priority: "medium",
          suggestion: "Destek ekibimiz en kısa sürede size yardımcı olacaktır.",
        };
      }
    } catch (error: unknown) {
      const duration = Date.now() - startTime;

      this.logger.error(
        `❌ [AI ANALYSIS] AI ticket analysis failed: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );

      try {
        const provider = aiConfiguration?.provider ?? AiProvider.OPENAI;
        const model = aiConfiguration?.model ?? AiModel.GPT_4_TURBO;

        // Log detailed error to database
        await this.appLoggerService.logError(
          LogContext.AI,
          `AI ticket analysis failed: ${getErrorMessage(error)}`,
          toError(error),
          {
            provider,
            model,
            category,
            problemDescriptionPreview: problemDescription.substring(0, 100),
            duration,
          },
        );

        // Log failed AI call
        await this.appLoggerService.logAiCall(
          provider,
          model,
          duration,
          false,
          getErrorMessage(error),
        );
      } catch (loggingError: unknown) {
        this.logger.error(
          `Failed to log error: ${getErrorMessage(loggingError)}`,
        );
      }

      // Return fallback instead of throwing to prevent blocking ticket creation
      return {
        analysisAvailable: false,
        summary:
          "AI analizi şu anda kullanılamıyor. Talebinizi kontrol edip oluşturabilirsiniz.",
        priority: "medium",
        suggestion: "Destek ekibimiz en kısa sürede size yardımcı olacaktır.",
      };
    }
  }
  /**
   * [NEURAL GRID] Get intelligence and success-proven insights for a ticket
   */
  async getTicketSignal(id: string) {
    const ticket = await this.findOne(id);

    // Query StrategyService for insights grounded in prior successes
    const context = `Support ticket query: ${ticket.subject}. Customer problem: ${ticket.description}`;
    const insight = await this.strategyService.getInsight(
      ticket.tenantId,
      context,
      `Existing tags: ${ticket.tags?.join(", ") || "none"}`,
    );

    return {
      ticketId: id,
      subject: ticket.subject,
      aiInsight: insight.insight,
      learningSource: insight.source,
      // Preserve the original response aliases alongside the frontend contract.
      insight: insight.insight,
      source: insight.source,
      neural_connection: true,
      timestamp: new Date(),
    };
  }
}

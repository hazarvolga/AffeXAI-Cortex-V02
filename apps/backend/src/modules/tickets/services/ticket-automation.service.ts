import { User } from "../../users/entities/user.entity";
import { NotificationsService } from "../../notifications/notifications.service";
import { TicketPriority } from "../enums/ticket-priority.enum";
import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { TicketsService } from "../tickets.service";
import { TicketStatus } from "../enums/ticket-status.enum";
import { Ticket } from "../entities/ticket.entity";
import { TicketEscalationRule } from "../entities/ticket-escalation-rule.entity";
import { TicketEscalationRulesService } from "./ticket-escalation-rules.service";
import { Repository, IsNull } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { TicketMessage } from "../entities/ticket-message.entity";
import { TenantService } from "../../../core/tenant/tenant.service";
import { Organization } from "../../organizations/entities/organization.entity";

/**
 * Ticket Automation Service
 * Handles automatic ticket processing and status transitions
 */
@Injectable()
export class TicketAutomationService {
  private readonly logger = new Logger(TicketAutomationService.name);

  constructor(
    private readonly ticketsService: TicketsService,
    private readonly escalationRulesService: TicketEscalationRulesService,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketMessage)
    private readonly messageRepository: Repository<TicketMessage>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly tenantService: TenantService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Check for tickets that need auto-closing (resolved for 72+ hours)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkForAutoClose(): Promise<void> {
    this.logger.log("Checking for tickets to auto-close...");

    try {
      const activeOrganizations = await this.organizationRepository.find({
        where: { isActive: true },
      });

      for (const org of activeOrganizations) {
        await this.tenantService.runWithTenant(
          { tenantId: org.slug, source: "system" },
          async () => {
            // Find resolved tickets that haven't had activity for 72 hours for this tenant
            const resolvedTickets = await this.ticketsService.findAll({
              status: TicketStatus.RESOLVED,
            });

            const now = new Date();
            let closedCount = 0;

            for (const ticket of resolvedTickets) {
              const hoursSinceUpdate = this.getHoursSinceDate(
                ticket.updatedAt,
                now,
              );
              if (hoursSinceUpdate >= 72) {
                await this.ticketsService.updateStatus(
                  ticket.id,
                  TicketStatus.CLOSED,
                  null,
                );
                closedCount++;
              }
            }

            if (closedCount > 0) {
              this.logger.log(
                `Auto-closed ${closedCount} tickets for tenant ${org.name} (${org.id})`,
              );
            }
          },
        );
      }
    } catch (error) {
      this.logger.error("Error during auto-close check:", error);
    }
  }

  /**
   * Check for tickets that need auto-transition from pending third party
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async checkForPendingThirdPartyTransition(): Promise<void> {
    this.logger.log("Checking for tickets in pending third party status...");

    try {
      const activeOrganizations = await this.organizationRepository.find({
        where: { isActive: true },
      });

      for (const org of activeOrganizations) {
        await this.tenantService.runWithTenant(
          { tenantId: org.slug, source: "system" },
          async () => {
            // Find tickets that have been pending third party for more than 72 hours for this tenant
            const pendingThirdPartyTickets = await this.ticketsService.findAll({
              status: TicketStatus.PENDING_THIRD_PARTY,
            });

            const now = new Date();
            let transitionedCount = 0;

            for (const ticket of pendingThirdPartyTickets) {
              const hoursSinceUpdate = this.getHoursSinceDate(
                ticket.updatedAt,
                now,
              );
              if (hoursSinceUpdate >= 72) {
                await this.ticketsService.updateStatus(
                  ticket.id,
                  TicketStatus.OPEN,
                  null,
                );
                transitionedCount++;
              }
            }

            if (transitionedCount > 0) {
              this.logger.log(
                `Auto-transitioned ${transitionedCount} tickets for tenant ${org.name} (${org.id})`,
              );
            }
          },
        );
      }
    } catch (error) {
      this.logger.error("Error during pending third party check:", error);
    }
  }

  /**
   * Check for tickets that need escalation
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkForEscalation(): Promise<void> {
    this.logger.log("Checking for tickets requiring escalation...");

    try {
      const activeOrganizations = await this.organizationRepository.find({
        where: { isActive: true },
      });

      for (const org of activeOrganizations) {
        await this.tenantService.runWithTenant(
          { tenantId: org.slug, source: "system" },
          async () => {
            // Get all active escalation rules for this tenant
            const rules = await this.escalationRulesService.getActiveRules();

            // Find all tickets that could potentially need escalation for this tenant
            const tickets = await this.ticketsService.findAll({});

            const now = new Date();
            let escalatedCount = 0;

            for (const ticket of tickets) {
              const hoursSinceCreation = this.getHoursSinceDate(
                ticket.createdAt,
                now,
              );
              const hoursSinceUpdate = this.getHoursSinceDate(
                ticket.updatedAt,
                now,
              );

              for (const rule of rules) {
                if (
                  this.escalationRulesService.hasReachedMaxApplications(
                    rule,
                    ticket,
                  )
                ) {
                  continue;
                }

                if (
                  rule.shouldTrigger(ticket, {
                    hoursSinceCreation,
                    hoursSinceUpdate,
                    escalationLevel: ticket.escalationLevel || 0,
                  })
                ) {
                  await this.applyEscalationActions(ticket, rule);
                  escalatedCount++;
                  break;
                }
              }
            }

            if (escalatedCount > 0) {
              this.logger.log(
                `Escalated ${escalatedCount} tickets for tenant ${org.name} (${org.id})`,
              );
            }
          },
        );
      }
    } catch (error) {
      this.logger.error("Error during escalation check:", error);
    }
  }

  /**
   * Calculate hours between two dates
   * @private
   */
  private getHoursSinceDate(date: Date, now: Date): number {
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  }

  /**
   * Apply escalation actions to a ticket based on rule
   * @private
   */
  private async applyEscalationActions(
    candidate: Ticket,
    candidateRule: TicketEscalationRule,
  ): Promise<void> {
    const context = this.tenantService.getTenantContext();
    if (
      !context?.tenantId ||
      context.source !== "system" ||
      candidate.tenantId !== context.tenantId ||
      candidateRule.tenantId !== context.tenantId
    )
      throw new ForbiddenException("System tenant context required");
    const tenantId = context.tenantId;
    await this.ticketRepository.manager.transaction(async (manager) => {
      const ticket = await manager.findOne(Ticket, {
        where: { id: candidate.id, tenantId },
        lock: { mode: "pessimistic_write" },
      });
      const rule = await manager.findOne(TicketEscalationRule, {
        where: { id: candidateRule.id, tenantId, isActive: true },
        lock: { mode: "pessimistic_read" },
      });
      if (
        !ticket ||
        !rule ||
        this.escalationRulesService.hasReachedMaxApplications(rule, ticket)
      )
        return;
      const now = new Date();
      if (
        !rule.shouldTrigger(ticket, {
          hoursSinceCreation: this.getHoursSinceDate(ticket.createdAt, now),
          hoursSinceUpdate: this.getHoursSinceDate(ticket.updatedAt, now),
          escalationLevel: ticket.escalationLevel || 0,
        })
      )
        return;
      const actions = rule.actions;
      if (
        !actions ||
        typeof actions !== "object" ||
        Array.isArray(actions) ||
        Object.keys(actions).some(
          (key) =>
            ![
              "assignToId",
              "setPriority",
              "addNote",
              "notifySupervisors",
              "increaseEscalationLevel",
            ].includes(key),
        ) ||
        (actions.setPriority !== undefined &&
          !Object.values(TicketPriority).includes(actions.setPriority)) ||
        (actions.addNote !== undefined &&
          (typeof actions.addNote !== "string" ||
            !actions.addNote.trim() ||
            actions.addNote.length > 20000)) ||
        ["notifySupervisors", "increaseEscalationLevel"].some(
          (key) =>
            actions[key] !== undefined && typeof actions[key] !== "boolean",
        )
      )
        throw new BadRequestException("Invalid escalation actions");
      const roles = (user: User) =>
        [user.roleEntity, ...(user.userRoles?.map((value) => value.role) || [])]
          .filter(
            (role) => role?.tenantId === tenantId && role.isActive === true,
          )
          .map((role) => role.name);
      if (actions.assignToId !== undefined) {
        if (typeof actions.assignToId !== "string")
          throw new BadRequestException("Invalid escalation assignee");
        const agent = await manager.findOne(User, {
          where: {
            id: actions.assignToId,
            tenantId,
            isActive: true,
            deletedAt: IsNull(),
          },
          relations: ["roleEntity", "userRoles", "userRoles.role"],
        });
        if (
          !agent ||
          !roles(agent).some((role) =>
            [
              "admin",
              "editor",
              "support",
              "support_manager",
              "support_agent",
            ].includes(role),
          )
        )
          throw new BadRequestException(
            "An active tenant support agent is required",
          );
      }
      const supervisors = actions.notifySupervisors
        ? (
            await manager.find(User, {
              where: { tenantId, isActive: true, deletedAt: IsNull() },
              relations: ["roleEntity", "userRoles", "userRoles.role"],
            })
          ).filter((user) =>
            roles(user).some((role) =>
              ["admin", "support_manager"].includes(role),
            ),
          )
        : [];
      if (
        actions.notifySupervisors &&
        (!supervisors.length || supervisors.length > 500)
      )
        throw new BadRequestException(
          "A bounded active tenant supervisor audience is required",
        );
      const level =
        (ticket.escalationLevel || 0) +
        (actions.increaseEscalationLevel === false ? 0 : 1);
      const entry = {
        level,
        escalatedAt: now,
        escalatedBy: "system",
        reason: `Escalated by rule: ${rule.name}`,
        ruleId: rule.id,
        ...(actions.assignToId ? { assignedToId: actions.assignToId } : {}),
      };
      if (actions.addNote)
        await manager.save(
          TicketMessage,
          manager.create(TicketMessage, {
            ticketId: ticket.id,
            tenantId,
            authorId: null,
            content: actions.addNote,
            isInternal: true,
            metadata: {
              actorType: "system",
              action: "ticket.escalation",
              ruleId: rule.id,
            },
          }),
        );
      await manager.update(
        Ticket,
        { id: ticket.id, tenantId },
        {
          escalationLevel: level,
          lastEscalatedAt: now,
          escalationHistory: [...(ticket.escalationHistory || []), entry],
          ...(actions.assignToId ? { assignedToId: actions.assignToId } : {}),
          ...(actions.setPriority ? { priority: actions.setPriority } : {}),
        },
      );
      for (const supervisor of supervisors)
        await this.notificationsService.createNotification(
          {
            userId: supervisor.id,
            type: "ticket_escalated",
            message: `Ticket escalated by rule: ${rule.name}`,
            metadata: {
              ticketId: ticket.id,
              ruleId: rule.id,
              actorType: "system",
            },
          },
          manager,
        );
    });
  }
}

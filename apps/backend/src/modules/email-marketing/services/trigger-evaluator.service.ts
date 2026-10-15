import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  EmailAutomation,
  TriggerType,
  AutomationStatus,
} from "../entities/email-automation.entity";
import {
  AutomationTrigger,
  TriggerStatus,
} from "../entities/automation-trigger.entity";
import { Subscriber } from "../entities/subscriber.entity";
import { Segment } from "../entities/segment.entity";
import { AutomationQueueService } from "./automation-queue.service";
import { AutomationJobPriority } from "../queues/automation.queue";
import { TenantService } from "../../../core/tenant/tenant.service";
import { Organization } from "../../organizations/entities/organization.entity";

/** Subscriber date columns an anniversary trigger may read; config values never reach SQL. */
const ANNIVERSARY_DATE_FIELDS: Readonly<Record<string, string>> = {
  subscribedAt: "subscribedAt",
  createdAt: "subscribedAt",
  optInDate: "optInDate",
};

/**
 * Trigger Event Types
 */
export enum TriggerEvent {
  SUBSCRIBER_CREATED = "subscriber.created",
  SUBSCRIBER_UPDATED = "subscriber.updated",
  SUBSCRIBER_SEGMENT_ADDED = "subscriber.segment_added",
  SUBSCRIBER_SEGMENT_REMOVED = "subscriber.segment_removed",
  EMAIL_OPENED = "email.opened",
  EMAIL_CLICKED = "email.clicked",
  PURCHASE_MADE = "purchase.made",
  CART_ABANDONED = "cart.abandoned",
  PRODUCT_VIEWED = "product.viewed",
}

/**
 * Trigger Configuration Interfaces
 */
interface EventTriggerConfig {
  events: TriggerEvent[];
  conditions?: {
    field: string;
    operator:
      "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
    value: any;
  }[];
}

interface BehaviorTriggerConfig {
  behaviorType: "cart_abandonment" | "inactive_subscriber" | "browsing_pattern";
  timeWindow: number; // minutes
  conditions?: Record<string, any>;
}

interface TimeBasedTriggerConfig {
  schedule: "daily" | "weekly" | "monthly" | "anniversary" | "birthday";
  time?: string; // HH:mm format
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  dateField: string; // field name in subscriber (e.g., 'createdAt', 'birthday')
  offsetDays?: number; // days before/after the date
}

interface AttributeTriggerConfig {
  attribute: string; // subscriber field name
  oldValue?: any;
  newValue?: any;
  changeType: "any" | "specific" | "increased" | "decreased";
}

/**
 * Trigger Evaluator Service
 * Evaluates automation triggers and registers subscribers
 */
@Injectable()
export class TriggerEvaluatorService {
  private readonly logger = new Logger(TriggerEvaluatorService.name);

  constructor(
    @InjectRepository(EmailAutomation)
    private automationRepo: Repository<EmailAutomation>,
    @InjectRepository(AutomationTrigger)
    private triggerRepo: Repository<AutomationTrigger>,
    @InjectRepository(Subscriber)
    private subscriberRepo: Repository<Subscriber>,
    @InjectRepository(Segment)
    private segmentRepo: Repository<Segment>,
    @InjectRepository(Organization)
    private organizationRepo: Repository<Organization>,
    private queueService: AutomationQueueService,
    private tenantService: TenantService,
  ) {}

  /**
   * Get current tenant ID from TenantService
   * @private
   */
  private getActiveTenantId(): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException("Tenant context required");
    return tenantId;
  }

  /**
   * Evaluate event-based triggers
   */
  async evaluateEventTrigger(
    event: TriggerEvent,
    subscriberId: string,
    eventData: Record<string, any> = {},
  ): Promise<void> {
    this.logger.log(
      `Evaluating event trigger: ${event} for subscriber ${subscriberId}`,
    );

    const tenantId = this.getActiveTenantId();
    // Only subscribers of this tenant can enter its automations.
    const subscriber = await this.subscriberRepo.findOne({
      where: { id: subscriberId, tenantId },
    });
    if (!subscriber) {
      this.logger.warn(
        `Ignoring ${event}: subscriber ${subscriberId} is not in tenant ${tenantId}`,
      );
      return;
    }

    // Find active automations with this event trigger for this tenant
    const automations = await this.automationRepo.find({
      where: {
        status: AutomationStatus.ACTIVE,
        isActive: true,
        triggerType: TriggerType.EVENT,
        tenantId,
      },
    });

    for (const automation of automations) {
      const config = automation.triggerConfig as EventTriggerConfig;

      // Check if event matches
      if (!config.events || !config.events.includes(event)) {
        continue;
      }

      // Check segment targeting
      if (
        automation.segmentId &&
        !subscriber.segments?.includes(automation.segmentId)
      ) {
        continue;
      }

      // Evaluate conditions
      if (config.conditions && config.conditions.length > 0) {
        const conditionsMet = this.evaluateConditions(
          config.conditions,
          subscriber,
          eventData,
        );
        if (!conditionsMet) {
          continue;
        }
      }

      // Check if subscriber already has a trigger for this automation
      const existingTrigger = await this.triggerRepo.findOne({
        where: {
          automationId: automation.id,
          subscriberId,
          status: TriggerStatus.PENDING,
          tenantId,
        },
      });

      if (existingTrigger) {
        this.logger.debug(
          `Trigger already exists for automation ${automation.id}`,
        );
        continue;
      }

      // Create trigger
      await this.createTrigger(
        automation.id,
        subscriberId,
        event,
        tenantId,
        eventData,
      );
    }
  }

  /**
   * Evaluate behavior-based triggers (runs on cron)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async evaluateBehaviorTriggers(): Promise<void> {
    this.logger.log("Evaluating behavior triggers...");

    const activeOrganizations = await this.organizationRepo.find({
      where: { isActive: true },
    });

    for (const org of activeOrganizations) {
      await this.tenantService.runWithTenant(
        { tenantId: org.slug, source: "system" },
        async () => {
          const automations = await this.automationRepo.find({
            where: {
              status: AutomationStatus.ACTIVE,
              isActive: true,
              triggerType: TriggerType.BEHAVIOR,
              tenantId: org.slug,
            },
          });

          for (const automation of automations) {
            const config = automation.triggerConfig as BehaviorTriggerConfig;

            switch (config.behaviorType) {
              case "cart_abandonment":
                await this.evaluateCartAbandonment(automation, config);
                break;
              case "inactive_subscriber":
                await this.evaluateInactiveSubscribers(automation, config);
                break;
              case "browsing_pattern":
                await this.evaluateBrowsingPattern(automation, config);
                break;
            }
          }
        },
      );
    }
  }

  /**
   * Evaluate time-based triggers (runs daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async evaluateTimeBasedTriggers(): Promise<void> {
    this.logger.log("Evaluating time-based triggers...");

    const activeOrganizations = await this.organizationRepo.find({
      where: { isActive: true },
    });

    for (const org of activeOrganizations) {
      await this.tenantService.runWithTenant(
        { tenantId: org.slug, source: "system" },
        async () => {
          const automations = await this.automationRepo.find({
            where: {
              status: AutomationStatus.ACTIVE,
              isActive: true,
              triggerType: TriggerType.TIME_BASED,
              tenantId: org.slug,
            },
          });

          for (const automation of automations) {
            const config = automation.triggerConfig as TimeBasedTriggerConfig;

            switch (config.schedule) {
              case "daily":
                await this.evaluateDailyTriggers(automation, config);
                break;
              case "weekly":
                await this.evaluateWeeklyTriggers(automation, config);
                break;
              case "monthly":
                await this.evaluateMonthlyTriggers(automation, config);
                break;
              case "birthday":
                await this.evaluateBirthdayTriggers(automation, config);
                break;
              case "anniversary":
                await this.evaluateAnniversaryTriggers(automation, config);
                break;
            }
          }
        },
      );
    }
  }

  /**
   * Evaluate attribute change triggers
   */
  async evaluateAttributeTrigger(
    subscriberId: string,
    attribute: string,
    oldValue: any,
    newValue: any,
  ): Promise<void> {
    this.logger.log(
      `Evaluating attribute trigger: ${attribute} changed from ${oldValue} to ${newValue}`,
    );

    const tenantId = this.getActiveTenantId();
    const automations = await this.automationRepo.find({
      where: {
        status: AutomationStatus.ACTIVE,
        isActive: true,
        triggerType: TriggerType.ATTRIBUTE,
        tenantId,
      },
    });

    for (const automation of automations) {
      const config = automation.triggerConfig as AttributeTriggerConfig;

      // Check if attribute matches
      if (config.attribute !== attribute) {
        continue;
      }

      // Check change type
      let triggered = false;
      switch (config.changeType) {
        case "any":
          triggered = oldValue !== newValue;
          break;
        case "specific":
          triggered =
            oldValue === config.oldValue && newValue === config.newValue;
          break;
        case "increased":
          triggered =
            typeof oldValue === "number" &&
            typeof newValue === "number" &&
            newValue > oldValue;
          break;
        case "decreased":
          triggered =
            typeof oldValue === "number" &&
            typeof newValue === "number" &&
            newValue < oldValue;
          break;
      }

      if (!triggered) {
        continue;
      }

      // Create trigger
      await this.createTrigger(
        automation.id,
        subscriberId,
        TriggerType.ATTRIBUTE,
        tenantId,
        {
          attribute,
          oldValue,
          newValue,
        },
      );
    }
  }

  /**
   * Private: Create trigger
   */
  private async createTrigger(
    automationId: string,
    subscriberId: string,
    triggerType: string,
    tenantId: string,
    triggerData: Record<string, any> = {},
  ): Promise<AutomationTrigger> {
    const trigger = this.triggerRepo.create({
      automationId,
      subscriberId,
      triggerType: triggerType as TriggerType,
      triggerData,
      status: TriggerStatus.PENDING,
      tenantId,
    });

    const saved = await this.triggerRepo.save(trigger);
    this.logger.log(
      `Created trigger ${saved.id} for automation ${automationId}`,
    );

    // Add to queue for processing
    await this.queueService.addProcessTriggerJob(
      {
        triggerId: saved.id,
        automationId,
        subscriberId,
        triggerType,
        triggerData,
        tenantId, // Add tenantId to payload
      },
      AutomationJobPriority.NORMAL,
    );

    return saved;
  }

  /**
   * Private: Evaluate conditions
   */
  private evaluateConditions(
    conditions: any[],
    subscriber: Subscriber,
    eventData: Record<string, any>,
  ): boolean {
    for (const condition of conditions) {
      // An event value wins even when it is falsy (0, false, '').
      const value =
        condition.field in eventData
          ? eventData[condition.field]
          : subscriber[condition.field];

      switch (condition.operator) {
        case "equals":
          if (value !== condition.value) return false;
          break;
        case "not_equals":
          if (value === condition.value) return false;
          break;
        case "contains":
          if (typeof value !== "string" || !value.includes(condition.value)) {
            return false;
          }
          break;
        case "greater_than":
          if (typeof value !== "number" || value <= condition.value) {
            return false;
          }
          break;
        case "less_than":
          if (typeof value !== "number" || value >= condition.value) {
            return false;
          }
          break;
      }
    }

    return true;
  }

  /**
   * Private: Evaluate cart abandonment
   */
  private async evaluateCartAbandonment(
    automation: EmailAutomation,
    config: BehaviorTriggerConfig,
  ): Promise<void> {
    // This would integrate with your e-commerce system
    // For now, it's a placeholder
    this.logger.debug(
      `Evaluating cart abandonment for automation ${automation.id}`,
    );
  }

  /**
   * Private: Evaluate inactive subscribers
   */
  private async evaluateInactiveSubscribers(
    automation: EmailAutomation,
    config: BehaviorTriggerConfig,
  ): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setMinutes(cutoffDate.getMinutes() - config.timeWindow);

    // Active subscribers with no open inside the window (logs are keyed by recipient email).
    const subscribers = await this.subscriberRepo
      .createQueryBuilder("subscriber")
      .where("subscriber.status = :status", { status: "active" })
      .andWhere("subscriber.tenantId = :tenantId", {
        tenantId: automation.tenantId,
      })
      .andWhere(
        `NOT EXISTS (SELECT 1 FROM email_logs log WHERE log.recipient_email = subscriber.email
          AND log.tenant_id = :tenantId AND log.opened_at >= :cutoffDate)`,
        { cutoffDate },
      )
      .getMany();

    for (const subscriber of subscribers) {
      // The cron runs hourly; one pending trigger per subscriber is enough.
      const pending = await this.triggerRepo.findOne({
        where: {
          automationId: automation.id,
          subscriberId: subscriber.id,
          status: TriggerStatus.PENDING,
          tenantId: automation.tenantId,
        },
      });
      if (pending) continue;
      await this.createTrigger(
        automation.id,
        subscriber.id,
        TriggerType.BEHAVIOR,
        automation.tenantId,
        {
          behaviorType: "inactive_subscriber",
          inactiveDays: Math.floor(config.timeWindow / (60 * 24)),
        },
      );
    }
  }

  /**
   * Private: Evaluate browsing pattern
   */
  private async evaluateBrowsingPattern(
    automation: EmailAutomation,
    config: BehaviorTriggerConfig,
  ): Promise<void> {
    // Placeholder for browsing pattern evaluation
    this.logger.debug(
      `Evaluating browsing pattern for automation ${automation.id}`,
    );
  }

  /**
   * Private: Evaluate daily triggers
   */
  private async evaluateDailyTriggers(
    automation: EmailAutomation,
    config: TimeBasedTriggerConfig,
  ): Promise<void> {
    const subscribers = await this.getTargetSubscribers(automation);

    for (const subscriber of subscribers) {
      const scheduledFor = this.calculateScheduleTime(config.time || "09:00");
      await this.createScheduledTrigger(
        automation.id,
        subscriber.id,
        scheduledFor,
        automation.tenantId,
      );
    }
  }

  /**
   * Private: Evaluate weekly triggers
   */
  private async evaluateWeeklyTriggers(
    automation: EmailAutomation,
    config: TimeBasedTriggerConfig,
  ): Promise<void> {
    const today = new Date().getDay();

    if (config.dayOfWeek !== undefined && today !== config.dayOfWeek) {
      return;
    }

    const subscribers = await this.getTargetSubscribers(automation);

    for (const subscriber of subscribers) {
      const scheduledFor = this.calculateScheduleTime(config.time || "09:00");
      await this.createScheduledTrigger(
        automation.id,
        subscriber.id,
        scheduledFor,
        automation.tenantId,
      );
    }
  }

  /**
   * Private: Evaluate monthly triggers
   */
  private async evaluateMonthlyTriggers(
    automation: EmailAutomation,
    config: TimeBasedTriggerConfig,
  ): Promise<void> {
    const today = new Date().getDate();

    if (config.dayOfMonth !== undefined && today !== config.dayOfMonth) {
      return;
    }

    const subscribers = await this.getTargetSubscribers(automation);

    for (const subscriber of subscribers) {
      const scheduledFor = this.calculateScheduleTime(config.time || "09:00");
      await this.createScheduledTrigger(
        automation.id,
        subscriber.id,
        scheduledFor,
        automation.tenantId,
      );
    }
  }

  /**
   * Private: Evaluate birthday triggers
   */
  private async evaluateBirthdayTriggers(
    automation: EmailAutomation,
    config: TimeBasedTriggerConfig,
  ): Promise<void> {
    // Subscribers have no birthday column yet; querying one fails every night.
    this.logger.warn(
      `Birthday automation ${automation.id} skipped: subscribers do not store a birthday`,
    );
  }

  /**
   * Private: Evaluate anniversary triggers
   */
  private async evaluateAnniversaryTriggers(
    automation: EmailAutomation,
    config: TimeBasedTriggerConfig,
  ): Promise<void> {
    const column = ANNIVERSARY_DATE_FIELDS[config.dateField];
    if (!column) {
      this.logger.warn(
        `Anniversary automation ${automation.id} skipped: unsupported date field "${config.dateField}"`,
      );
      return;
    }

    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + (config.offsetDays || 0));

    const subscribers = await this.subscriberRepo
      .createQueryBuilder("subscriber")
      .where("subscriber.tenantId = :tenantId", {
        tenantId: automation.tenantId,
      })
      .andWhere(`EXTRACT(MONTH FROM subscriber.${column}) = :month`, {
        month: targetDate.getMonth() + 1,
      })
      .andWhere(`EXTRACT(DAY FROM subscriber.${column}) = :day`, {
        day: targetDate.getDate(),
      })
      .getMany();

    for (const subscriber of subscribers) {
      const scheduledFor = this.calculateScheduleTime(config.time || "09:00");
      await this.createScheduledTrigger(
        automation.id,
        subscriber.id,
        scheduledFor,
        automation.tenantId,
      );
    }
  }

  /**
   * Private: Get target subscribers for automation
   */
  private async getTargetSubscribers(
    automation: EmailAutomation,
  ): Promise<Subscriber[]> {
    if (automation.segmentId) {
      return this.subscriberRepo
        .createQueryBuilder("subscriber")
        .where("subscriber.status = :status", { status: "active" })
        .andWhere("subscriber.tenantId = :tenantId", {
          tenantId: automation.tenantId,
        })
        .andWhere(":segmentId = ANY(subscriber.segments)", {
          segmentId: automation.segmentId,
        })
        .getMany();
    }

    return this.subscriberRepo.find({
      where: { status: "active", tenantId: automation.tenantId },
    });
  }

  /**
   * Private: Create scheduled trigger
   */
  private async createScheduledTrigger(
    automationId: string,
    subscriberId: string,
    scheduledFor: Date,
    tenantId: string,
  ): Promise<void> {
    const existing = await this.triggerRepo.findOne({
      where: {
        automationId,
        subscriberId,
        scheduledFor,
        status: TriggerStatus.SCHEDULED,
        tenantId,
      },
    });

    if (existing) {
      return;
    }

    const trigger = this.triggerRepo.create({
      automationId,
      subscriberId,
      triggerType: TriggerType.TIME_BASED,
      triggerData: {},
      status: TriggerStatus.SCHEDULED,
      scheduledFor,
      tenantId,
    });

    await this.triggerRepo.save(trigger);
  }

  /**
   * Private: Calculate schedule time
   */
  private calculateScheduleTime(time: string): Date {
    const [hours, minutes] = time.split(":").map(Number);
    const scheduledFor = new Date();
    scheduledFor.setHours(hours, minutes, 0, 0);
    return scheduledFor;
  }
}

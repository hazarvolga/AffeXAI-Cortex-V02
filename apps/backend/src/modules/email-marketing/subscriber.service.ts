import { OptInOutService } from "./services/opt-in-out.service";
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Raw, Repository } from "typeorm";
import { Group } from "./entities/group.entity";
import { Segment } from "./entities/segment.entity";
import {
  assertWritableFields,
  subscriberWritableFields,
} from "./recipient-input-policy";
import { Subscriber } from "./entities/subscriber.entity";
import { CreateSubscriberDto } from "./dto/create-subscriber.dto";
import { UpdateSubscriberDto } from "./dto/update-subscriber.dto";
import { EmailValidationService } from "./services/email-validation.service";
import { AdvancedEmailValidationService } from "./services/advanced-email-validation.service";
import { TenantService } from "../../core/tenant/tenant.service";
import { Logger } from "@nestjs/common";

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/** Rows created before emails were normalised may be mixed-case; match them too. */
const sameEmail = (email: string) =>
  Raw((column) => `LOWER(${column}) = :normalizedEmail`, {
    normalizedEmail: normalizeEmail(email),
  });

@Injectable()
export class SubscriberService {
  private readonly logger = new Logger(SubscriberService.name);
  constructor(
    @InjectRepository(Subscriber)
    private subscribersRepository: Repository<Subscriber>,
    private readonly emailValidationService: EmailValidationService,
    private readonly advancedEmailValidationService: AdvancedEmailValidationService,
    private readonly tenantService: TenantService,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Segment)
    private readonly segmentRepository: Repository<Segment>,
    private readonly optInOutService: OptInOutService,
  ) {}

  private async validateRelations(
    input: { groups?: string[]; segments?: string[] },
    tenantId: string,
  ): Promise<void> {
    for (const field of ["groups", "segments"] as const) {
      const values = input[field];
      if (values === undefined) continue;
      if (
        !Array.isArray(values) ||
        values.length > 1000 ||
        values.some((value) => typeof value !== "string" || !value.trim())
      ) {
        throw new BadRequestException("Invalid recipient relations");
      }
      const ids = [...new Set(values)];
      if (!ids.length) continue;
      const repository =
        field === "groups" ? this.groupRepository : this.segmentRepository;
      const rows = await repository.find({
        where: { tenantId, id: In(ids) },
        select: ["id"],
      });
      const found = new Set(rows.map((row) => row.id));
      if (ids.some((id) => !found.has(id)))
        throw new BadRequestException(
          "Recipient relation not found in this tenant",
        );
    }
  }

  async create(
    createSubscriberDto: CreateSubscriberDto,
    senderIp?: string,
  ): Promise<Subscriber> {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException("Tenant context required");

    assertWritableFields(createSubscriberDto, subscriberWritableFields);
    await this.validateRelations(createSubscriberDto, tenantId);

    // If mailerCheckResult is not provided, validate the email automatically
    let mailerCheckResult = createSubscriberDto.mailerCheckResult;
    if (!mailerCheckResult) {
      const validationResult =
        await this.advancedEmailValidationService.validateEmail(
          createSubscriberDto.email,
          senderIp,
        );
      mailerCheckResult = validationResult.status;
    }

    const subscriber = this.subscribersRepository.create({
      ...createSubscriberDto,
      email: normalizeEmail(createSubscriberDto.email),
      mailerCheckResult,
      status: createSubscriberDto.status || "pending",
      groups: createSubscriberDto.groups || [],
      segments: createSubscriberDto.segments || [],
      tenantId,
    });
    return this.subscribersRepository.save(subscriber);
  }

  async findAll(): Promise<Subscriber[]> {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException("Tenant context required");
    return this.subscribersRepository.find({ where: { tenantId } });
  }

  async findOne(id: string): Promise<Subscriber> {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException("Tenant context required");

    const subscriber = await this.subscribersRepository.findOne({
      where: { id, tenantId },
    });
    if (!subscriber) {
      throw new NotFoundException(`Subscriber with ID ${id} not found`);
    }
    return subscriber;
  }

  async findByEmail(email: string): Promise<Subscriber> {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException("Tenant context required");

    const subscriber = await this.subscribersRepository.findOne({
      where: { email: sameEmail(email), tenantId },
    });
    if (!subscriber) {
      throw new NotFoundException(`Subscriber with email ${email} not found`);
    }
    return subscriber;
  }

  async update(
    id: string,
    updateSubscriberDto: UpdateSubscriberDto,
  ): Promise<Subscriber> {
    const subscriber = await this.findOne(id);
    assertWritableFields(updateSubscriberDto, subscriberWritableFields);
    await this.validateRelations(updateSubscriberDto, subscriber.tenantId);
    if (
      updateSubscriberDto.email !== undefined &&
      updateSubscriberDto.email.trim().toLowerCase() !==
        subscriber.email.trim().toLowerCase()
    ) {
      throw new BadRequestException(
        "Changing subscriber email requires a new confirmed subscription",
      );
    }
    const changes = { ...updateSubscriberDto };
    if (!Object.keys(changes).length) return subscriber;
    const result = await this.subscribersRepository.update(
      { id, tenantId: subscriber.tenantId },
      changes,
    );
    if (result.affected !== 1)
      throw new NotFoundException("Subscriber not found");
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const subscriber = await this.findOne(id);
    await this.subscribersRepository.remove(subscriber);
  }

  async subscribe(email: string, senderIp?: string): Promise<Subscriber> {
    await this.optInOutService.subscribeWithDoubleOptIn(email, {}, senderIp);
    return this.findByEmail(email.trim().toLowerCase());
  }

  async unsubscribe(email: string): Promise<Subscriber> {
    const subscriber = await this.findByEmail(email);
    const result = await this.subscribersRepository.update(
      { id: subscriber.id, tenantId: subscriber.tenantId },
      {
        status: () =>
          "CASE WHEN status IN ('bounced', 'complained') THEN status ELSE 'unsubscribed' END",
        isDoubleOptIn: false,
        marketingEmails: false,
        emailNotifications: false,
        optInToken: () => "NULL",
        unsubscribeToken: () => "NULL",
        lastUpdated: new Date(),
      },
    );
    if (result.affected !== 1)
      throw new NotFoundException("Subscriber not found");
    return this.findOne(subscriber.id);
  }

  /**
   * Update subscriber status based on webhook events
   * Called by WebhookService when bounce/complaint events occur
   * NOTE: This method might be called from a webhook without tenant context or with explicit tenant context.
   * If tenantId is passed explicitly, use it. Otherwise, try to infer or fail.
   * Since webhooks might not have auth headers, we accept optional tenantId if passed from controller/service logic.
   */
  async updateStatusFromWebhook(
    email: string,
    status: "bounced" | "complained" | "unsubscribed",
    metadata?: Record<string, any>,
    explicitTenantId?: string,
  ): Promise<Subscriber | null> {
    try {
      const tenantId = explicitTenantId || this.tenantService.getTenantId();
      // If no tenant context found (webhook context), we might need to find by email globally (dangerous? or find all matching emails?)
      // For now, let's assume tenantId is provided or we search by email + tenantId if available.

      const where: any = { email: sameEmail(email) };
      if (tenantId) {
        where.tenantId = tenantId;
      } else {
        // Critical: If no tenantId is available, we cannot safely update from webhook
        // without searching all potential matches. For now, we log warning and abort.
        this.logger.warn(
          `Potential multi-tenancy breach: Webhook received for ${email} without tenant context`,
        );
        return null;
      }

      const subscriber = await this.subscribersRepository.findOne({ where });

      if (!subscriber) {
        // Subscriber not found - this is OK, they might not be in marketing list
        return null;
      }

      const detail = metadata?.bounceType || metadata?.reason;
      const result = await this.subscribersRepository.update(
        { id: subscriber.id, tenantId },
        {
          status:
            status === "unsubscribed"
              ? () =>
                  "CASE WHEN status IN ('bounced', 'complained') THEN status ELSE 'unsubscribed' END"
              : status,
          lastUpdated: new Date(),
          isDoubleOptIn: false,
          marketingEmails: false,
          emailNotifications: false,
          optInToken: () => "NULL",
          unsubscribeToken: () => "NULL",
          ...(typeof detail === "string" ? { mailerCheckResult: detail } : {}),
        },
      );
      if (result.affected !== 1) return null;
      return this.subscribersRepository.findOne({
        where: { id: subscriber.id, tenantId },
      });
    } catch (error) {
      this.logger.error("Subscriber webhook persistence failed");
      throw error;
    }
  }

  /**
   * Check if email is suppressed (bounced, complained, or unsubscribed)
   * Should be checked before sending any marketing email
   */
  async isEmailSuppressed(email: string): Promise<boolean> {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException("Tenant context required");

    const where: any = { email: sameEmail(email), tenantId };

    const subscriber = await this.subscribersRepository.findOne({ where });
    if (!subscriber) {
      return false;
    }
    return ["bounced", "complained", "unsubscribed"].includes(
      subscriber.status,
    );
  }
}

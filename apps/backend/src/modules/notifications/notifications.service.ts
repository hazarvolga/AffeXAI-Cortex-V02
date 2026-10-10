import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager, IsNull } from "typeorm";
import { Notification } from "./entities/notification.entity";
import { User } from "../users/entities/user.entity";
import { TenantService } from "../../core/tenant/tenant.service";
import { InstructionException } from "../../core/exceptions/instruction.exception";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly tenantService: TenantService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  private scope(userId: string) {
    const context = this.tenantService.getTenantContext();
    const tenantId = context?.tenantId;
    if (!["authenticated", "system"].includes(context?.source || "")) throw new ForbiddenException("Trusted notification context required");
    if (!tenantId)
      throw new InstructionException(
        "No tenant context found for notifications operation",
      );
    if (!this.isUuid(userId))
      throw new BadRequestException("Recipient is required");
    return { userId, tenantId };
  }

  private isUuid(value: unknown): value is string {
    return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  private identity(id: string, userId: string) {
    const scope = this.scope(userId);
    if (!this.isUuid(id)) throw new BadRequestException("Invalid notification ID");
    return { id, ...scope };
  }

  async createNotification(
    data: {
      message: string;
      type: string;
      userId: string;
      metadata?: Record<string, unknown>;
    },
    manager?: EntityManager,
  ): Promise<Notification> {
    if (manager && !manager.queryRunner?.isTransactionActive)
      throw new BadRequestException("Notification transaction must be active");
    const users = manager ? manager.getRepository(User) : this.userRepository;
    const notifications = manager
      ? manager.getRepository(Notification)
      : this.notificationRepository;
    if (!data || typeof data !== "object") throw new BadRequestException("Invalid notification");
    const scope = this.scope(data.userId);
    if (
      typeof data.message !== "string" ||
      !data.message.trim() ||
      data.message.length > 10000 ||
      typeof data.type !== "string" ||
      !data.type.trim() ||
      data.type.length > 100
    )
      throw new BadRequestException("Invalid notification");
    if (
      data.metadata !== undefined &&
      (data.metadata === null ||
        typeof data.metadata !== "object" ||
        Array.isArray(data.metadata))
    )
      throw new BadRequestException("Invalid metadata");
    try {
      if (data.metadata !== undefined && Buffer.byteLength(JSON.stringify(data.metadata), "utf8") > 16384) throw new Error("oversized");
    } catch { throw new BadRequestException("Invalid metadata"); }
    const recipient = await users.findOne({
      where: { id: scope.userId, tenantId: scope.tenantId, isActive: true, deletedAt: IsNull() },
    });
    if (!recipient) throw new NotFoundException("Recipient not found");
    return notifications.save(notifications.create({ message: data.message, type: data.type, metadata: data.metadata, ...scope }));
  }

  async findAll(userId: string, limit = 100, offset = 0): Promise<Notification[]> {
    const scope = this.scope(userId);
    if (!Number.isInteger(limit) || limit < 1 || limit > 200 || !Number.isInteger(offset) || offset < 0 || offset > 10000) throw new BadRequestException("Invalid notification pagination");
    return this.notificationRepository.find({
      where: scope,
      order: { createdAt: "DESC", id: "DESC" },
      take: limit,
      skip: offset,
    });
  }

  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: this.identity(id, userId),
    });
    if (!notification) throw new NotFoundException("Notification not found");
    return notification;
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const result = await this.notificationRepository.update(this.identity(id, userId), { isRead: true });
    if (result.affected !== 1) throw new NotFoundException("Notification not found");
    return this.findOne(id, userId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(this.scope(userId), {
      isRead: true,
    });
  }
}

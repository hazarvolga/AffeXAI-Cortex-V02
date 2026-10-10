import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, unlink } from "node:fs/promises";
import { constants } from "node:fs";
import { join, resolve } from "node:path";
import { isUUID } from "class-validator";
import { MediaType } from "@affexai/shared-types";
import { TenantService } from "../../../core/tenant/tenant.service";
import { TicketAttachmentEntity } from "../entities/ticket-attachment.entity";
import { Ticket } from "../entities/ticket.entity";
import { TicketMessage } from "../entities/ticket-message.entity";
import { validateTicketAttachment } from "./ticket-attachment-validation";

export interface AttachmentActor {
  id: string;
  tenantId: string;
  roleNames?: string[];
  isPlatformAdmin?: boolean;
}
export interface TicketAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  type: MediaType;
  uploadedAt: Date;
}
const staff = (actor: AttachmentActor) =>
  actor.isPlatformAdmin === true ||
  actor.roleNames?.some((role) =>
    ["admin", "editor", "support", "support_manager", "support_agent"].includes(
      role,
    ),
  ) === true;

@Injectable()
export class TicketAttachmentService {
  private readonly logger = new Logger(TicketAttachmentService.name);
  constructor(
    @InjectRepository(TicketAttachmentEntity)
    private readonly attachments: Repository<TicketAttachmentEntity>,
    @InjectRepository(Ticket) private readonly tickets: Repository<Ticket>,
    @InjectRepository(TicketMessage)
    private readonly messages: Repository<TicketMessage>,
    private readonly tenants: TenantService,
    private readonly config: ConfigService,
  ) {}
  private scope(actor: AttachmentActor): void {
    if (
      !actor ||
      !isUUID(actor.id) ||
      typeof actor.tenantId !== "string" ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(actor.tenantId) ||
      this.tenants.getTenantId() !== actor.tenantId
    )
      throw new ForbiddenException("Authenticated attachment tenant required");
  }
  private path(key: string): string {
    if (!isUUID(key)) throw new NotFoundException("Attachment unavailable");
    return join(
      resolve(
        this.config.get<string>("TICKET_ATTACHMENT_ROOT") ||
          join(process.cwd(), "uploads", "ticket-attachments"),
      ),
      key,
    );
  }
  private view(row: TicketAttachmentEntity): TicketAttachment {
    return {
      id: row.id,
      filename: row.originalName,
      originalName: row.originalName,
      mimeType: row.mimeType,
      size: row.size,
      url: `/api/tickets/attachments/${row.id}/download`,
      type: row.mimeType.startsWith("image/")
        ? MediaType.IMAGE
        : MediaType.DOCUMENT,
      uploadedAt: row.createdAt,
    };
  }
  async uploadAttachment(
    file: Express.Multer.File,
    actor: AttachmentActor,
  ): Promise<TicketAttachment> {
    this.scope(actor);
    const { name, mime } = validateTicketAttachment(file);
    const storageKey = randomUUID();
    const path = this.path(storageKey);
    await mkdir(resolve(path, ".."), { recursive: true, mode: 0o700 });
    const handle = await open(path, "wx", 0o600);
    try {
      await handle.writeFile(file.buffer);
      await handle.sync();
      await handle.close();
      const row = await this.attachments.save(
        this.attachments.create({
          tenantId: actor.tenantId,
          ownerId: actor.id,
          ticketId: null,
          messageId: null,
          originalName: name,
          storageKey,
          mimeType: mime,
          size: file.buffer.length,
          sha256: createHash("sha256").update(file.buffer).digest("hex"),
        }),
      );
      return this.view(row);
    } catch (error) {
      await handle.close().catch(() => undefined);
      try {
        await unlink(path);
      } catch (cleanupError) {
        if (!(
          cleanupError instanceof Error &&
          "code" in cleanupError &&
          cleanupError.code === "ENOENT"
        ))
          this.logger.error(
            `Private attachment cleanup failed for storage ${storageKey}`,
          );
      }
      throw error;
    }
  }
  private async authorized(
    id: string,
    actor: AttachmentActor,
  ): Promise<TicketAttachmentEntity> {
    this.scope(actor);
    if (!isUUID(id))
      throw new BadRequestException("Invalid attachment identifier");
    const row = await this.attachments.findOne({
      where: { id, tenantId: actor.tenantId },
    });
    if (!row) throw new NotFoundException("Attachment unavailable");
    if (!row.ticketId) {
      if (row.ownerId !== actor.id)
        throw new ForbiddenException("Private draft attachment");
      return row;
    }
    const ticket = await this.tickets.findOne({
      where: { id: row.ticketId, tenantId: actor.tenantId },
    });
    if (!ticket || (ticket.userId !== actor.id && !staff(actor)))
      throw new ForbiddenException("Ticket attachment access denied");
    if (row.messageId) {
      const message = await this.messages.findOne({
        where: {
          id: row.messageId,
          tenantId: actor.tenantId,
          ticketId: row.ticketId,
        },
      });
      if (!message || (message.isInternal && !staff(actor)))
        throw new ForbiddenException("Message attachment access denied");
    }
    return row;
  }
  async getAttachment(
    id: string,
    actor: AttachmentActor,
  ): Promise<TicketAttachment> {
    return this.view(await this.authorized(id, actor));
  }
  async openDownload(id: string, actor: AttachmentActor) {
    const row = await this.authorized(id, actor);
    let handle: Awaited<ReturnType<typeof open>>;
    try {
      handle = await open(
        this.path(row.storageKey),
        constants.O_RDONLY | constants.O_NOFOLLOW,
      );
    } catch {
      throw new NotFoundException("Attachment bytes unavailable");
    }
    try {
      const info = await handle.stat();
      if (!info.isFile() || info.size !== row.size)
        throw new NotFoundException("Attachment bytes unavailable");
      return { stream: handle.createReadStream(), metadata: this.view(row) };
    } catch (error) {
      await handle.close();
      throw error;
    }
  }
  async bindDrafts(
    manager: EntityManager,
    ids: string[],
    target: {
      tenantId: string;
      ownerId: string;
      ticketId: string;
      messageId?: string;
    },
  ): Promise<TicketAttachment[]> {
    if (!manager.queryRunner?.isTransactionActive)
      throw new Error("Attachment binding requires producer transaction");
    if (
      !Array.isArray(ids) ||
      ids.length > 10 ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !isUUID(id))
    )
      throw new BadRequestException("Invalid attachment identifiers");
    if (!ids.length) return [];
    if (
      !target.tenantId ||
      this.tenants.getTenantId() !== target.tenantId ||
      !isUUID(target.ownerId) ||
      !isUUID(target.ticketId)
    )
      throw new ForbiddenException("Attachment binding scope required");
    const ticket = await manager.findOne(Ticket, {
      where: { id: target.ticketId, tenantId: target.tenantId },
    });
    if (!ticket) throw new NotFoundException("Ticket unavailable");
    if (
      target.messageId &&
      !(await manager.findOne(TicketMessage, {
        where: {
          id: target.messageId,
          ticketId: target.ticketId,
          tenantId: target.tenantId,
        },
      }))
    )
      throw new NotFoundException("Message unavailable");
    const repo = manager.getRepository(TicketAttachmentEntity);
    const rows = await repo.find({
      where: {
        id: In(ids),
        tenantId: target.tenantId,
        ownerId: target.ownerId,
      },
      lock: { mode: "pessimistic_write" },
    });
    if (
      rows.length !== ids.length ||
      rows.some((row) => row.ticketId || row.messageId)
    )
      throw new ForbiddenException(
        "Only your unbound attachment drafts may be attached",
      );
    await repo.update(
      { id: In(ids), tenantId: target.tenantId, ownerId: target.ownerId },
      { ticketId: target.ticketId, messageId: target.messageId ?? null },
    );
    return rows.map((row) => this.view(row));
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, ILike, Repository } from "typeorm";
import { TicketTemplate } from "../entities/ticket-template.entity";
import { TicketCategory } from "../entities/ticket-category.entity";
import { User } from "../../users/entities/user.entity";
import { TenantService } from "../../../core/tenant/tenant.service";
import { CreateTicketTemplateDto } from "../dto/create-template.dto";
import { TicketPriority } from "../enums/ticket-priority.enum";

export interface TemplateActor {
  id: string;
  tenantId: string;
  roleNames?: string[];
  isPlatformAdmin?: boolean;
}
type TemplateFields = Partial<CreateTicketTemplateDto>;

@Injectable()
export class TicketTemplatesService {
  constructor(
    @InjectRepository(TicketTemplate)
    private readonly templateRepository: Repository<TicketTemplate>,
    private readonly tenantService: TenantService,
  ) {}

  private scope(actor: TemplateActor): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId || !actor?.id || actor.tenantId !== tenantId)
      throw new ForbiddenException("Verified tenant identity required");
    return tenantId;
  }
  private staff(actor: TemplateActor): boolean {
    return (
      actor.isPlatformAdmin === true ||
      actor.roleNames?.some((role) => ["admin", "editor"].includes(role)) ===
        true
    );
  }
  private requireStaff(actor: TemplateActor): string {
    const tenantId = this.scope(actor);
    if (!this.staff(actor))
      throw new ForbiddenException("Template management permission required");
    return tenantId;
  }
  private present(template: TicketTemplate): TicketTemplate {
    return {
      ...template,
      ...(template.createdBy
        ? {
            createdBy: {
              id: template.createdBy.id,
              firstName: template.createdBy.firstName,
              lastName: template.createdBy.lastName,
              avatar: template.createdBy.avatar,
            } as User,
          }
        : {}),
    };
  }
  private visible(
    actor: TemplateActor,
    isPublic?: boolean,
  ): FindOptionsWhere<TicketTemplate>[] {
    const tenantId = this.scope(actor);
    if (isPublic === true)
      return [{ tenantId, isActive: true, isPublic: true }];
    if (isPublic === false)
      return [
        { tenantId, isActive: true, isPublic: false, createdById: actor.id },
      ];
    return [
      { tenantId, isActive: true, isPublic: true },
      { tenantId, isActive: true, createdById: actor.id },
    ];
  }
  async findAll(
    actor: TemplateActor,
    isPublic?: boolean,
  ): Promise<TicketTemplate[]> {
    return (
      await this.templateRepository.find({
        where: this.visible(actor, isPublic),
        relations: ["category", "createdBy"],
        order: { usageCount: "DESC", name: "ASC" },
      })
    ).map((value) => this.present(value));
  }
  async findOne(id: string, actor: TemplateActor): Promise<TicketTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id, tenantId: this.scope(actor) },
      relations: ["category", "createdBy"],
    });
    if (
      !template ||
      (!template.isPublic && template.createdById !== actor.id) ||
      (!template.isActive && !this.staff(actor))
    )
      throw new NotFoundException("Template not found");
    return this.present(template);
  }
  private async validate(
    data: TemplateFields,
    actor: TemplateActor,
    creating = false,
  ): Promise<void> {
    const allowed = [
      "name",
      "description",
      "subject",
      "content",
      "priority",
      "categoryId",
      "defaultTags",
      "customFields",
      "isPublic",
    ];
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data) ||
      Object.keys(data).some((key) => !allowed.includes(key))
    )
      throw new BadRequestException("Unsupported template fields");
    for (const key of ["name", "description", "subject", "content"] as const) {
      const value = data[key];
      if (
        value !== undefined &&
        (typeof value !== "string" ||
          value.length >
            (key === "name" ? 255 : key === "content" ? 200000 : 2000))
      )
        throw new BadRequestException("Invalid template text");
      if (
        key !== "description" &&
        (creating || value !== undefined) &&
        !value?.trim()
      )
        throw new BadRequestException(
          "Template name, subject and content required",
        );
    }
    if (data.isPublic !== undefined && typeof data.isPublic !== "boolean")
      throw new BadRequestException("Invalid visibility");
    if (
      data.priority !== undefined &&
      !Object.values(TicketPriority).includes(data.priority)
    )
      throw new BadRequestException("Invalid priority");
    if (
      data.defaultTags !== undefined &&
      (!Array.isArray(data.defaultTags) ||
        data.defaultTags.length > 50 ||
        data.defaultTags.some(
          (tag) => typeof tag !== "string" || tag.length > 100,
        ))
    )
      throw new BadRequestException("Invalid tags");
    if (
      data.customFields !== undefined &&
      (!data.customFields ||
        typeof data.customFields !== "object" ||
        Array.isArray(data.customFields) ||
        JSON.stringify(data.customFields).length > 20000)
    )
      throw new BadRequestException("Invalid custom fields");
    const tenantId = this.scope(actor);
    if (data.categoryId !== undefined) {
      if (
        typeof data.categoryId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          data.categoryId,
        )
      )
        throw new BadRequestException("Invalid category");
      if (
        !(await this.templateRepository.manager.findOne(TicketCategory, {
          where: { id: data.categoryId, tenantId, isActive: true },
        }))
      )
        throw new NotFoundException("Category unavailable");
    }
    if (
      creating &&
      !(await this.templateRepository.manager.findOne(User, {
        where: { id: actor.id, tenantId, isActive: true },
      }))
    )
      throw new NotFoundException("Creator unavailable");
  }
  private mutationScope(
    id: string,
    actor: TemplateActor,
    template: TicketTemplate,
  ): FindOptionsWhere<TicketTemplate> {
    return {
      id,
      tenantId: this.scope(actor),
      ...(template.createdById === actor.id
        ? { createdById: actor.id }
        : { isPublic: true }),
    };
  }
  async create(
    data: CreateTicketTemplateDto,
    actor: TemplateActor,
  ): Promise<TicketTemplate> {
    const tenantId = this.requireStaff(actor);
    await this.validate(data, actor, true);
    const saved = await this.templateRepository.save(
      this.templateRepository.create({
        ...data,
        tenantId,
        createdById: actor.id,
      }),
    );
    return this.findOne(saved.id, actor);
  }
  async update(
    id: string,
    data: TemplateFields,
    actor: TemplateActor,
  ): Promise<TicketTemplate> {
    this.requireStaff(actor);
    const template = await this.findOne(id, actor);
    await this.validate(data, actor);
    if (data.isPublic === false && template.createdById !== actor.id)
      throw new ForbiddenException(
        "Only the owner can make a template private",
      );
    const result = await this.templateRepository.update(
      this.mutationScope(id, actor, template),
      data,
    );
    if (!result.affected) throw new NotFoundException("Template not found");
    return this.findOne(id, actor);
  }
  async delete(id: string, actor: TemplateActor): Promise<void> {
    this.requireStaff(actor);
    const template = await this.findOne(id, actor);
    const result = await this.templateRepository.update(
      this.mutationScope(id, actor, template),
      { isActive: false },
    );
    if (!result.affected) throw new NotFoundException("Template not found");
  }
  async toggle(id: string, actor: TemplateActor): Promise<TicketTemplate> {
    this.requireStaff(actor);
    const template = await this.findOne(id, actor);
    const result = await this.templateRepository.update(
      this.mutationScope(id, actor, template),
      { isActive: () => 'NOT "isActive"' },
    );
    if (!result.affected) throw new NotFoundException("Template not found");
    return this.findOne(id, actor);
  }
  async incrementUsage(id: string, actor: TemplateActor): Promise<void> {
    await this.findOne(id, actor);
    const result = await this.templateRepository
      .createQueryBuilder()
      .update()
      .set({ usageCount: () => '"usageCount" + 1' })
      .where(this.visible(actor).map((where) => ({ ...where, id })))
      .execute();
    if (!result.affected) throw new NotFoundException("Template not found");
  }
  async findByCategory(
    categoryId: string,
    actor: TemplateActor,
  ): Promise<TicketTemplate[]> {
    return (
      await this.templateRepository.find({
        where: this.visible(actor).map((where) => ({ ...where, categoryId })),
        relations: ["category", "createdBy"],
        order: { usageCount: "DESC", name: "ASC" },
      })
    ).map((value) => this.present(value));
  }
  async findByUser(actor: TemplateActor): Promise<TicketTemplate[]> {
    return (
      await this.templateRepository.find({
        where: {
          tenantId: this.scope(actor),
          createdById: actor.id,
          isActive: true,
        },
        relations: ["category"],
        order: { usageCount: "DESC", name: "ASC" },
      })
    ).map((value) => this.present(value));
  }
  async getPopular(
    actor: TemplateActor,
    limit = 10,
  ): Promise<TicketTemplate[]> {
    const size = Number(limit);
    if (!Number.isInteger(size) || size < 1 || size > 100)
      throw new BadRequestException("Invalid template limit");
    return (
      await this.templateRepository.find({
        where: this.visible(actor, true),
        relations: ["category", "createdBy"],
        order: { usageCount: "DESC" },
        take: size,
      })
    ).map((value) => this.present(value));
  }
  async search(query: string, actor: TemplateActor): Promise<TicketTemplate[]> {
    if (typeof query !== "string" || !query.trim() || query.length > 500)
      throw new BadRequestException("Invalid template search");
    const where = this.visible(actor).flatMap((scope) =>
      ["name", "subject", "content"].map((field) => ({
        ...scope,
        [field]: ILike(`%${query}%`),
      })),
    );
    return (
      await this.templateRepository.find({
        where,
        relations: ["category", "createdBy"],
        order: { usageCount: "DESC" },
        take: 100,
      })
    ).map((value) => this.present(value));
  }
}

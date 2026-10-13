import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { isReservedTenantSlug } from "@affexai/shared-types";
import { TenantService } from "../../core/tenant/tenant.service";
import { User } from "../users/entities/user.entity";
import { Organization } from "./entities/organization.entity";
import { OrganizationAuditLog } from "./entities/organization-audit-log.entity";
import { CreateOrganizationDto } from "./dto/organization.dto";

const ADMIN_ROLES = ["admin", "organization_owner", "organization_admin"];

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizations: Repository<Organization>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly tenants: TenantService,
  ) {}

  private tenantId(): string {
    const context = this.tenants.getTenantContext();
    if (!context?.tenantId || context.source !== "authenticated") {
      throw new ForbiddenException("Authenticated tenant context required");
    }
    return context.tenantId;
  }

  async createOrganization(
    dto: CreateOrganizationDto,
    actorId: string,
  ): Promise<Organization> {
    const slug = dto.slug.toLowerCase();
    if (isReservedTenantSlug(slug)) {
      throw new BadRequestException("Organization slug is reserved");
    }
    return this.organizations.manager.transaction(async (manager) => {
      const organizations = manager.getRepository(Organization);
      if (await organizations.findOne({ where: { slug } })) {
        throw new ConflictException("Organization slug already exists");
      }
      const organization = await organizations.save(
        organizations.create({
          name: dto.name.trim(),
          slug,
          isActive: true,
          settings: {},
        }),
      );
      await manager.getRepository(OrganizationAuditLog).save({
        tenantId: slug,
        organizationId: organization.id,
        actorId,
        targetUserId: null,
        action: "organization.created",
        metadata: { name: organization.name },
      });
      return organization;
    });
  }

  async getCurrent(): Promise<Organization> {
    const slug = this.tenantId();
    const organization = await this.organizations.findOne({ where: { slug } });
    if (!organization) throw new NotFoundException("Organization not found");
    return organization;
  }

  async assertActiveTenant(tenantId: string): Promise<Organization> {
    const organization = await this.organizations.findOne({
      where: { slug: tenantId, isActive: true },
    });
    if (!organization)
      throw new ForbiddenException("Organization is inactive or unavailable");
    return organization;
  }

  async listMembers(): Promise<Array<Record<string, unknown>>> {
    const organization = await this.getCurrent();
    const members = await this.users.find({
      where: {
        tenantId: organization.slug,
        organizationId: organization.id,
        deletedAt: IsNull(),
      },
      relations: ["userRoles", "userRoles.role"],
      order: { createdAt: "ASC" },
    });
    return members.map((member) => ({
      id: member.id,
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      isActive: member.isActive,
      roles: member.roleNames,
      createdAt: member.createdAt,
    }));
  }

  async linkMember(userId: string, actorId: string): Promise<void> {
    const organization = await this.getCurrent();
    await this.organizations.manager.transaction(async (manager) => {
      await manager.query(
        "SELECT id FROM organizations WHERE id=$1 AND slug=$2 FOR UPDATE",
        [organization.id, organization.slug],
      );
      const users = manager.getRepository(User);
      const [user] = await manager.query(
        `SELECT id,"organizationId","isActive" FROM users
         WHERE id=$1 AND tenant_id=$2 AND deleted_at IS NULL FOR UPDATE`,
        [userId, organization.slug],
      );
      if (!user || !user.isActive)
        throw new NotFoundException("Active tenant user not found");
      if (user.organizationId && user.organizationId !== organization.id) {
        throw new ConflictException("User belongs to another organization");
      }
      if (user.organizationId === organization.id) return;
      await users.update(
        { id: user.id, tenantId: organization.slug },
        { organizationId: organization.id },
      );
      await manager.getRepository(OrganizationAuditLog).save({
        tenantId: organization.slug,
        organizationId: organization.id,
        actorId,
        targetUserId: user.id,
        action: "organization.member_linked",
        metadata: null,
      });
    });
  }

  async removeMember(userId: string, actorId: string): Promise<void> {
    const organization = await this.getCurrent();
    await this.organizations.manager.transaction(async (manager) => {
      await manager.query(
        "SELECT id FROM organizations WHERE id=$1 AND slug=$2 FOR UPDATE",
        [organization.id, organization.slug],
      );
      const users = manager.getRepository(User);
      const [user] = await manager.query(
        `SELECT id,"organizationId","isActive" FROM users
         WHERE id=$1 AND tenant_id=$2 AND "organizationId"=$3
           AND "isActive"=true AND deleted_at IS NULL FOR UPDATE`,
        [userId, organization.slug, organization.id],
      );
      if (!user) throw new NotFoundException("Organization member not found");
      const [roleState] = await manager.query(
        `SELECT EXISTS(
           SELECT 1 FROM user_roles ur
           JOIN roles r ON r.id=ur."roleId" AND r.tenant_id=ur.tenant_id
           WHERE ur."userId"=$1 AND ur.tenant_id=$2 AND ur.deleted_at IS NULL
             AND r.deleted_at IS NULL AND r.is_active=true AND r.name=ANY($3::varchar[])
         ) AS is_admin,
         (SELECT count(DISTINCT u.id)::int FROM users u
           JOIN user_roles ur ON ur."userId"=u.id AND ur.tenant_id=u.tenant_id AND ur.deleted_at IS NULL
           JOIN roles r ON r.id=ur."roleId" AND r.tenant_id=ur.tenant_id
           WHERE u."organizationId"=$4 AND u.tenant_id=$2 AND u."isActive"=true AND u.deleted_at IS NULL
             AND r.deleted_at IS NULL AND r.is_active=true AND r.name=ANY($3::varchar[])
         ) AS admin_count`,
        [user.id, organization.slug, ADMIN_ROLES, organization.id],
      );
      if (roleState?.is_admin && Number(roleState.admin_count) <= 1) {
        throw new BadRequestException(
          "The last active organization administrator cannot be removed",
        );
      }
      const result = await users
        .createQueryBuilder()
        .update(User)
        .set({
          isActive: false,
          refreshToken: null,
          refreshTokenExpires: null,
          tokenVersion: () => '"tokenVersion" + 1',
        })
        .where(
          'id = :id AND tenant_id = :tenantId AND "organizationId" = :organizationId AND "isActive" = true',
          {
            id: user.id,
            tenantId: organization.slug,
            organizationId: organization.id,
          },
        )
        .execute();
      if (result.affected !== 1)
        throw new ConflictException("Membership changed concurrently");
      await manager.getRepository(OrganizationAuditLog).save({
        tenantId: organization.slug,
        organizationId: organization.id,
        actorId,
        targetUserId: user.id,
        action: "organization.member_removed",
        metadata: { tokenVersionRevoked: true },
      });
    });
  }

  async setStatus(
    organizationId: string,
    isActive: boolean,
    actorId: string,
  ): Promise<Organization> {
    return this.organizations.manager.transaction(async (manager) => {
      const organizations = manager.getRepository(Organization);
      const organization = await organizations.findOne({
        where: { id: organizationId },
        lock: { mode: "pessimistic_write" },
      });
      if (!organization) throw new NotFoundException("Organization not found");
      if (organization.isActive === isActive) return organization;
      await organizations.update({ id: organization.id }, { isActive });
      if (!isActive) {
        await manager
          .getRepository(User)
          .createQueryBuilder()
          .update(User)
          .set({
            refreshToken: null,
            refreshTokenExpires: null,
            tokenVersion: () => '"tokenVersion" + 1',
          })
          .where(
            '"organizationId" = :organizationId AND tenant_id = :tenantId AND deleted_at IS NULL',
            {
              organizationId: organization.id,
              tenantId: organization.slug,
            },
          )
          .execute();
      }
      await manager.getRepository(OrganizationAuditLog).save({
        tenantId: organization.slug,
        organizationId: organization.id,
        actorId,
        targetUserId: null,
        action: isActive
          ? "organization.activated"
          : "organization.deactivated",
        metadata: { previousStatus: organization.isActive },
      });
      return { ...organization, isActive };
    });
  }
}

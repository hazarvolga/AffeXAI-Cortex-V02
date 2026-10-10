import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  OnModuleInit,
} from "@nestjs/common";
import { ModuleRef, Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../../../modules/users/users.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { resolveAuthenticatedTenant } from "../../guards/tenant.guard";
import { TenantRequest } from "../../tenant/tenant-request";
import { isConfiguredPlatformAdmin } from "../platform-admin.policy";

interface AccessClaims {
  sub?: string;
  type?: string;
  tokenVersion?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate, OnModuleInit {
  private usersService: UsersService;

  constructor(
    private jwtService: JwtService,
    private moduleRef: ModuleRef,
    private reflector: Reflector,
  ) {}

  onModuleInit() {
    this.usersService = this.moduleRef.get(UsersService, { strict: false });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return true;
    }
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const [scheme, token, extra] =
      request.headers.authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token || extra)
      throw new UnauthorizedException("Invalid access token");

    let user: Awaited<ReturnType<UsersService["findOne"]>>;
    try {
      // The configured JwtModule owns the secret; token contents never choose it.
      const payload = await this.jwtService.verifyAsync<AccessClaims>(token);
      if (
        typeof payload.sub !== "string" ||
        !payload.sub ||
        payload.type !== "access" ||
        !Number.isInteger(payload.tokenVersion) || payload.tokenVersion < 1
      ) {
        throw new UnauthorizedException();
      }
      // Identity lookup is deliberately global, before a tenant is authorized.
      user = await this.usersService.findOne(payload.sub, undefined, true);
      if (
        !user?.isActive || user.deletedAt ||
        payload.tokenVersion !== user.tokenVersion
      ) {
        throw new UnauthorizedException();
      }
      const platformAdmin = isConfiguredPlatformAdmin(user.id);
      if (
        !platformAdmin &&
        (!user.organizationId ||
          !user.organization ||
          user.organization.id !== user.organizationId ||
          user.organization.isActive !== true ||
          user.organization.slug !== user.tenantId)
      ) {
        throw new UnauthorizedException();
      }
    } catch {
      throw new UnauthorizedException("Invalid access token");
    }

    // Run only after signature, current identity and revocation checks. A tenant
    // hint is a selector, never authority, even for an administrator.
    request.tenantContext = resolveAuthenticatedTenant(
      user.tenantId,
      request.tenantHint,
    );
    request.user = {
      id: user.id,
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: user.roles,
      roleNames: user.roleNames,
      primaryRole: user.primaryRole,
      isPlatformAdmin: isConfiguredPlatformAdmin(user.id),
      tokenVersion: user.tokenVersion,
    };
    return true;
  }
}

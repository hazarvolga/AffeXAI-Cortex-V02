import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { TenantContext } from "../tenant/tenant.service";
import { TenantRequest } from "../tenant/tenant-request";

export function resolveAuthenticatedTenant(
  tenantId: string | undefined,
  hint?: string,
): TenantContext {
  if (!tenantId)
    throw new ForbiddenException("User has no assigned tenant context");
  if (hint && hint !== tenantId)
    throw new ForbiddenException(
      "You do not have access to this tenant resource",
    );
  return { tenantId, source: "authenticated" };
}

/** For explicit use after authentication, never as a pre-authentication bypass. */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    if (!request.user)
      throw new UnauthorizedException("Authentication required");
    request.tenantContext = resolveAuthenticatedTenant(
      request.user.tenantId,
      request.tenantHint,
    );
    return true;
  }
}

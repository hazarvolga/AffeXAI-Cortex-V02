import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { TenantRequest } from "../../tenant/tenant-request";

/** Must run after JwtAuthGuard, which derives authority from server provisioning. */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    if (request.user?.isPlatformAdmin !== true) {
      throw new ForbiddenException("Platform administrator access required");
    }
    return true;
  }
}

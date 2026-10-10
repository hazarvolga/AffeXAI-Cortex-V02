import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { TenantService } from "./tenant.service";
import { TenantRequest } from "./tenant-request";

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenants: TenantService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") return next.handle();
    const request = context.switchToHttp().getRequest<TenantRequest>();
    if (request.user && !request.tenantContext)
      throw new ForbiddenException("Tenant authorization required");
    const tenantContext = request.tenantContext ?? {
      tenantId: request.tenantHint,
      source: "public" as const,
    };
    // Subscription, not merely Observable construction, must execute in the ALS
    // scope. This preserves isolation through asynchronous handlers and teardown.
    return new Observable((subscriber) =>
      this.tenants.runWithTenant({ ...tenantContext }, () =>
        next.handle().subscribe(subscriber),
      ),
    );
  }
}

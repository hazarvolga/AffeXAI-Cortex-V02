import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";

export interface TenantContext {
  tenantId?: string;
  source?: "authenticated" | "public" | "system";
  isSuperAdmin?: boolean;
}

@Injectable()
export class TenantService {
  private static storage = new AsyncLocalStorage<TenantContext>();

  runWithTenant<T>(context: TenantContext, callback: () => T): T {
    return TenantService.storage.run(context, callback);
  }

  getTenantId(): string | undefined {
    const store = TenantService.storage.getStore();
    return store?.tenantId;
  }

  getTenantContext(): TenantContext | undefined {
    return TenantService.storage.getStore();
  }
}

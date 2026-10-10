import { Request } from "express";
import { User } from "../../modules/users/entities/user.entity";
import { TenantContext } from "./tenant.service";

export interface TenantRequest extends Request {
  tenantHint?: string;
  tenantContext?: TenantContext;
  user?: Pick<
    User,
    "id" | "email" | "tenantId" | "roles" | "roleNames" | "primaryRole"
  > & {
    userId: string;
    isPlatformAdmin: boolean;
    tokenVersion: number;
  };
}

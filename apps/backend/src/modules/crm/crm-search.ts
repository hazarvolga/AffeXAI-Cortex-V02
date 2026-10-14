import { FindOptionsWhere, ILike } from "typeorm";
import type { CrmCustomer } from "./entities/crm-customer.entity";

const SEARCHABLE_FIELDS = [
  "companyName",
  "email",
  "contactPerson",
  "customerNumber",
] as const;

/** Escapes LIKE wildcards; PostgreSQL's default LIKE escape character is backslash. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Tenant-scoped where clause; with a query, any searchable field may match (OR). */
export function crmSearchWhere(
  tenantId: string,
  search: string | undefined,
): FindOptionsWhere<CrmCustomer> | FindOptionsWhere<CrmCustomer>[] {
  const query = search?.trim();
  if (!query) return { tenantId };
  const pattern = ILike(`%${escapeLike(query)}%`);
  return SEARCHABLE_FIELDS.map((field) => ({ tenantId, [field]: pattern }));
}

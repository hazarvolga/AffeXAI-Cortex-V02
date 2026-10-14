"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";

export interface MatrixRole {
  id: string;
  name: string;
  displayName?: string;
  description: string;
  userCount: number;
  permissions: Record<string, boolean> | string[]; // Support both formats
}

interface PermissionMatrixProps {
  roles: MatrixRole[];
  resources: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
  }>;
  onPermissionToggle: (roleId: string, resourceId: string) => void;
  onRoleSelect: (role: MatrixRole) => void;
  /** The cell currently being saved; its switch is disabled until the API answers. */
  pendingCell?: string | null;
  readOnly?: boolean;
}

export const roleLabel = (role: Pick<MatrixRole, "name" | "displayName">) =>
  role.displayName || role.name;

const hasPermission = (role: MatrixRole, resourceId: string) =>
  Array.isArray(role.permissions)
    ? role.permissions.includes(resourceId)
    : Boolean(role.permissions[resourceId]);

/** Roles × resources grid. Every switch and role header is a named, keyboard-reachable control. */
export function PermissionMatrix({
  roles,
  resources,
  onPermissionToggle,
  onRoleSelect,
  pendingCell = null,
  readOnly = false,
}: PermissionMatrixProps) {
  const resourcesByCategory = resources.reduce<
    Record<string, typeof resources>
  >((acc, resource) => {
    return {
      ...acc,
      [resource.category]: [...(acc[resource.category] ?? []), resource],
    };
  }, {});

  return (
    <section
      aria-labelledby="permission-matrix-title"
      className="border border-white/10 bg-black/40"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 p-4">
        <h2
          id="permission-matrix-title"
          className="text-sm font-bold uppercase tracking-[0.2em] text-white"
        >
          Yetki matrisi
        </h2>
        <p className="text-xs text-white/70">
          {resources.length} kaynak × {roles.length} rol
          {readOnly ? " · yalnız görüntüleme" : ""}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Rollerin kaynaklara göre yetkileri
          </caption>
          <thead className="bg-[#0a0a0a]">
            <tr className="border-b border-white/10">
              <th
                scope="col"
                className="min-w-[200px] border-r border-white/10 p-4 text-xs uppercase tracking-wider text-white/70"
              >
                Kaynak
              </th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  scope="col"
                  className="min-w-[140px] p-3 text-center text-xs text-white/80"
                >
                  {readOnly ? (
                    <span className="font-semibold text-white">
                      {roleLabel(role)}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRoleSelect(role)}
                      className="rounded px-2 py-1 font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                      {roleLabel(role)}
                      <span className="sr-only"> rolünü düzenle</span>
                    </button>
                  )}
                  <span className="mt-1 block text-[11px] text-white/60">
                    {role.userCount} kullanıcı
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(resourcesByCategory).map(
              ([category, categoryResources]) => (
                <React.Fragment key={`category-group-${category}`}>
                  <tr className="bg-white/[0.03]">
                    <th
                      scope="colgroup"
                      colSpan={roles.length + 1}
                      className="border-y border-white/10 p-3 text-xs uppercase tracking-[0.2em] text-[#ffb35c]"
                    >
                      {category}
                    </th>
                  </tr>
                  {categoryResources.map((resource) => (
                    <tr key={resource.id} className="border-b border-white/10">
                      <th
                        scope="row"
                        className="border-r border-white/10 p-4 font-normal"
                      >
                        <span className="block text-sm font-semibold text-white">
                          {resource.name}
                        </span>
                        <span className="mt-1 block max-w-[280px] text-xs text-white/65">
                          {resource.description}
                        </span>
                      </th>
                      {roles.map((role) => {
                        const cell = `${role.id}:${resource.id}`;
                        return (
                          <td key={cell} className="p-4 text-center">
                            <Switch
                              checked={hasPermission(role, resource.id)}
                              onCheckedChange={() =>
                                onPermissionToggle(role.id, resource.id)
                              }
                              disabled={readOnly || pendingCell !== null}
                              aria-busy={pendingCell === cell}
                              aria-label={`${roleLabel(role)}: ${resource.name}`}
                              className="border border-white/20 data-[state=checked]:bg-[#9df425] data-[state=unchecked]:bg-white/15"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

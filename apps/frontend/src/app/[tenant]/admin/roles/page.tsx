"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import {
  PermissionMatrix,
  roleLabel,
  type MatrixRole,
} from "@/components/roles/PermissionMatrix";
import {
  RoleEditor,
  type EditableRole,
  type RoleValues,
} from "@/components/roles/RoleEditor";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/patterns/page-states";
import { rolesService } from "@/lib/api/rolesService";
import { ApiError } from "@/lib/api/http-client";
import { confirmDialog } from "@/lib/dialogs/dialog-queue";
import { toast } from "@/lib/notify";
import { usePermissions } from "@/hooks/usePermissions";

type TenantRole = MatrixRole & EditableRole;

const HTTP_CONFLICT = 409;
const HTTP_FORBIDDEN = 403;

function roleErrorMessage(error: unknown, fallback: string): string {
  const status = error instanceof ApiError ? error.status : undefined;
  if (status === HTTP_CONFLICT) return "Bu sistem adıyla bir rol zaten var.";
  if (status === HTTP_FORBIDDEN) return "Bu işlem için yetkiniz yok.";
  return fallback;
}

const permissionList = (role: MatrixRole): string[] =>
  Array.isArray(role.permissions)
    ? role.permissions
    : Object.entries(role.permissions)
        .filter(([, on]) => on)
        .map(([id]) => id);

export default function RolesPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const { isAdmin } = usePermissions();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<TenantRole | "new" | null>(null);
  const [pendingCell, setPendingCell] = useState<string | null>(null);

  const data = useQuery({
    queryKey: ["roles", tenant, "matrix"],
    queryFn: async () => {
      const [roles, resources] = await Promise.all([
        rolesService.getRoles(),
        rolesService.getAllResources(),
      ]);
      return { roles: roles as unknown as TenantRole[], resources };
    },
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["roles"] });

  // Permission changes are confirmed by name and saved pessimistically (UX-CONTRACT).
  const togglePermission = async (roleId: string, resourceId: string) => {
    const role = data.data?.roles.find((r) => r.id === roleId);
    const resource = data.data?.resources.find((r) => r.id === resourceId);
    if (!isAdmin || !role || !resource || pendingCell) return;
    const current = permissionList(role);
    const granting = !current.includes(resourceId);
    const confirmed = await confirmDialog({
      title: granting
        ? `${roleLabel(role)} rolüne “${resource.name}” yetkisi verilsin mi?`
        : `${roleLabel(role)} rolünden “${resource.name}” yetkisi kaldırılsın mı?`,
      description: `${role.userCount} kullanıcı etkilenir. Değişiklik bir sonraki istekte geçerli olur.`,
      confirmText: granting ? "Yetkiyi ver" : "Yetkiyi kaldır",
      destructive: !granting,
    });
    if (!confirmed) return;
    setPendingCell(`${roleId}:${resourceId}`);
    try {
      const next = granting
        ? [...current, resourceId]
        : current.filter((id) => id !== resourceId);
      await rolesService.updateRolePermissions(roleId, next);
      toast.success(granting ? "Yetki verildi" : "Yetki kaldırıldı");
      await refresh();
    } catch (error) {
      toast.error("Yetki değiştirilemedi", {
        description: roleErrorMessage(
          error,
          "Değişiklik kaydedilmedi; tekrar deneyin.",
        ),
      });
    } finally {
      setPendingCell(null);
    }
  };

  const saveRole = async (values: RoleValues) => {
    const existing = editing === "new" ? null : editing;
    try {
      if (existing) await rolesService.updateRole(existing.id, values);
      else await rolesService.createRole({ ...values, permissions: [] });
    } catch (error) {
      throw new Error(
        roleErrorMessage(error, "Rol kaydedilemedi. Tekrar deneyin."),
      );
    }
    toast.success(
      existing
        ? "Değişiklikler kaydedildi"
        : `${values.displayName} rolü oluşturuldu`,
    );
    setEditing(null);
    await refresh();
  };

  const deleteRole = async (role: EditableRole) => {
    try {
      await rolesService.deleteRole(role.id);
    } catch (error) {
      throw new Error(
        roleErrorMessage(error, "Atanmış veya korumalı roller silinemez."),
      );
    }
    toast.success(`${role.displayName || role.name} rolü silindi`);
    setEditing(null);
    await refresh();
  };

  const roles = data.data?.roles ?? [];
  const resources = data.data?.resources ?? [];
  const assignments = roles.reduce(
    (sum, role) => sum + (role.userCount || 0),
    0,
  );

  return (
    <BccEditorialWrapper
      headerTitle="Roller"
      headerSubtitle="Rolleri ve her rolün hangi kaynaklara erişebileceğini yönetin."
      headerBadge="Yönetim"
      telemetryData={
        data.data
          ? [
              { label: "Rol", value: String(roles.length) },
              { label: "Kaynak", value: String(resources.length) },
              { label: "Atama", value: String(assignments) },
            ]
          : []
      }
      headerAction={
        isAdmin ? (
          <Button onClick={() => setEditing("new")}>
            <Plus aria-hidden className="mr-2 h-4 w-4" />
            Yeni rol
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6 pb-20">
        {!isAdmin && (
          <p className="border border-white/15 p-4 text-sm text-white/80">
            Rolleri yalnız kuruluş yöneticileri değiştirebilir; matris yalnız
            görüntüleme modunda.
          </p>
        )}
        {data.isPending ? (
          <p role="status" className="py-12 text-center text-sm text-white/70">
            Roller yükleniyor…
          </p>
        ) : data.isError ? (
          <ErrorState
            title="Roller yüklenemedi"
            description="Bağlantınızı kontrol edip tekrar deneyin."
            action={<Button onClick={() => data.refetch()}>Tekrar dene</Button>}
          />
        ) : (
          <PermissionMatrix
            roles={roles}
            resources={resources}
            onPermissionToggle={togglePermission}
            onRoleSelect={(role) => setEditing(role as TenantRole)}
            pendingCell={pendingCell}
            readOnly={!isAdmin}
          />
        )}
      </div>

      {isAdmin && editing && (
        <RoleEditor
          role={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={saveRole}
          onDelete={deleteRole}
        />
      )}
    </BccEditorialWrapper>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserManagementService,
  type User,
} from "@/services/user-management.service";
import { userDisplayName, userRoleId } from "./user-presentation";

interface UserRoleDialogProps {
  user: User | null;
  onClose: () => void;
  onSaved: (user: User) => void;
}

/** Edit flow for a user's primary role (UX-CONTRACT ledger: Edit). */
export function UserRoleDialog({
  user,
  onClose,
  onSaved,
}: UserRoleDialogProps) {
  const roles = useQuery({
    queryKey: ["roles"],
    queryFn: () => UserManagementService.getRoles(),
    enabled: Boolean(user),
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [roleId, setRoleId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start every opening from the user's current role.
  if (user && user.id !== userId) {
    setUserId(user.id);
    setRoleId(userRoleId(user) ?? "");
    setError(null);
  }

  const save = async () => {
    if (!user || !roleId || saving) return;
    setSaving(true);
    setError(null);
    try {
      await UserManagementService.updateUserRole(user.id, roleId);
      onSaved(user);
    } catch {
      setError("Rol değiştirilemedi. Yetkinizi kontrol edip tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={Boolean(user)}
      onOpenChange={(open) => !open && !saving && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rolü değiştir</DialogTitle>
          <DialogDescription>
            {user
              ? `${userDisplayName(user)} için yeni rolü seçin. Değişiklik bir sonraki istekte geçerli olur.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label htmlFor="user-role-select" className="text-sm font-medium">
            Rol
          </label>
          <Select
            value={roleId}
            onValueChange={setRoleId}
            disabled={roles.isPending || saving}
          >
            <SelectTrigger
              id="user-role-select"
              aria-describedby={error ? "user-role-error" : undefined}
            >
              <SelectValue
                placeholder={
                  roles.isPending ? "Roller yükleniyor…" : "Rol seçin"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {(roles.data ?? []).map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.displayName || role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {roles.isError && (
            <p className="text-sm text-destructive">Roller yüklenemedi.</p>
          )}
          {error && (
            <p
              id="user-role-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Vazgeç
          </Button>
          <Button
            onClick={save}
            disabled={
              !roleId || saving || roleId === (user ? userRoleId(user) : "")
            }
          >
            {saving ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

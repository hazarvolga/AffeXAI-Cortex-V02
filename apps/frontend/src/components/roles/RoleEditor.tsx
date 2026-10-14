"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { confirmDialog } from "@/lib/dialogs/dialog-queue";

export interface EditableRole {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  userCount: number;
  isCustom?: boolean;
}

export interface RoleValues {
  name: string;
  displayName: string;
  description: string;
}

interface RoleEditorProps {
  /** null opens the editor for a new role. */
  role: EditableRole | null;
  onClose: () => void;
  /** Rejects with a user-facing message when the save fails. */
  onSave: (values: RoleValues) => Promise<void>;
  onDelete?: (role: EditableRole) => Promise<void>;
}

const ROLE_NAME_PATTERN = /^[a-z0-9_]+$/;

/** Create/edit dialog for a role (UX-CONTRACT ledger: Create, Edit, Delete). */
export function RoleEditor({
  role,
  onClose,
  onSave,
  onDelete,
}: RoleEditorProps) {
  const [name, setName] = useState(role?.name ?? "");
  const [displayName, setDisplayName] = useState(role?.displayName ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const nameError = !name.trim()
    ? "Sistem adı gerekli."
    : !ROLE_NAME_PATTERN.test(name.trim())
      ? "Yalnız küçük harf, rakam ve alt çizgi kullanın (ör. icerik_editoru)."
      : null;
  const displayNameError = displayName.trim() ? null : "Görünen ad gerekli.";

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setShowErrors(true);
    if (nameError || displayNameError || busy) {
      document
        .getElementById(nameError ? "role-name" : "role-display-name")
        ?.focus();
      return;
    }
    setBusy("save");
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        displayName: displayName.trim(),
        description: description.trim(),
      });
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Rol kaydedilemedi.",
      );
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!role || !onDelete || busy) return;
    const label = role.displayName || role.name;
    const confirmed = await confirmDialog({
      title: `${label} rolü silinsin mi?`,
      description: "Bu işlem geri alınamaz.",
      confirmText: "Rolü sil",
      destructive: true,
    });
    if (!confirmed) return;
    setBusy("delete");
    setError(null);
    try {
      await onDelete(role);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Rol silinemedi.");
    } finally {
      setBusy(null);
    }
  };

  const canDelete = Boolean(role?.isCustom && onDelete);
  const deleteBlocked = (role?.userCount ?? 0) > 0;

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent>
        <form onSubmit={save} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>{role ? "Rolü düzenle" : "Yeni rol"}</DialogTitle>
            <DialogDescription>
              {role
                ? `${role.userCount} kullanıcı bu role sahip.`
                : "Yetkileri, rol oluşturulduktan sonra matristen verin."}
            </DialogDescription>
          </DialogHeader>

          <Field
            id="role-name"
            label="Sistem adı"
            error={showErrors ? nameError : null}
          >
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(showErrors && nameError)}
              aria-describedby={
                showErrors && nameError ? "role-name-error" : undefined
              }
              autoComplete="off"
            />
          </Field>
          <Field
            id="role-display-name"
            label="Görünen ad"
            error={showErrors ? displayNameError : null}
          >
            <Input
              id="role-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              aria-invalid={Boolean(showErrors && displayNameError)}
              aria-describedby={
                showErrors && displayNameError
                  ? "role-display-name-error"
                  : undefined
              }
            />
          </Field>
          <Field id="role-description" label="Açıklama">
            <Textarea
              id="role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </Field>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            {canDelete ? (
              <div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={remove}
                  disabled={Boolean(busy) || deleteBlocked}
                  aria-describedby={
                    deleteBlocked ? "role-delete-reason" : undefined
                  }
                >
                  {busy === "delete" ? "Siliniyor…" : "Rolü sil"}
                </Button>
                {deleteBlocked && (
                  <p
                    id="role-delete-reason"
                    className="mt-1 text-xs text-muted-foreground"
                  >
                    Önce bu roldeki kullanıcıları başka bir role taşıyın.
                  </p>
                )}
              </div>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={Boolean(busy)}
              >
                Vazgeç
              </Button>
              <Button type="submit" disabled={Boolean(busy)}>
                {busy === "save"
                  ? "Kaydediliyor…"
                  : role
                    ? "Değişiklikleri kaydet"
                    : "Rolü oluştur"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

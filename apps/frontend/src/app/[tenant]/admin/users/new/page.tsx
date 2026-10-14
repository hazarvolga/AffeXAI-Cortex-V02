"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/http-client";
import { toast } from "@/lib/notify";
import { UserManagementService } from "@/services/user-management.service";
import {
  INVITE_FIELD_ORDER,
  inviteErrorMessage,
  validateInvite,
  type InviteErrors,
  type InviteField,
  type InviteValues,
} from "../_components/invite-form";

const EMPTY: InviteValues = {
  firstName: "",
  lastName: "",
  email: "",
  roleId: "",
  phone: "",
  city: "",
  country: "",
};
const LABELS: Record<InviteField, string> = {
  firstName: "Ad",
  lastName: "Soyad",
  email: "E-posta",
  roleId: "Rol",
  phone: "Telefon",
  city: "Şehir",
  country: "Ülke",
};
const REQUIRED: ReadonlySet<InviteField> = new Set([
  "firstName",
  "lastName",
  "email",
  "roleId",
]);
const fieldId = (field: InviteField) => `invite-${field}`;

export default function InviteUserPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const router = useRouter();
  const roles = useQuery({
    queryKey: ["roles"],
    queryFn: () => UserManagementService.getRoles(),
  });
  const [values, setValues] = useState<InviteValues>(EMPTY);
  const [errors, setErrors] = useState<InviteErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const listHref = `/${tenant}/admin/users`;

  const update = (field: InviteField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field])
      setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const found = validateInvite(values);
    setErrors(found);
    setSubmitError(null);
    const first = INVITE_FIELD_ORDER.find((field) => found[field]);
    if (first) {
      document.getElementById(fieldId(first))?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await UserManagementService.inviteUser({
        ...values,
        email: values.email.trim(),
      });
      toast.success("Davet gönderildi", {
        description: `${values.email.trim()} adresine parola belirleme bağlantısı gitti.`,
      });
      router.push(listHref);
    } catch (error) {
      setSubmitError(
        inviteErrorMessage(
          error instanceof ApiError ? error.status : undefined,
        ),
      );
      summaryRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const errorList = INVITE_FIELD_ORDER.filter((field) => errors[field]);

  return (
    <BccEditorialWrapper
      headerTitle="Kullanıcı davet et"
      headerSubtitle="Davet edilen kişi parolasını e-postadaki bağlantıdan belirler."
      headerBadge="Yönetim"
      headerAction={
        <Button asChild variant="outline">
          <Link href={listHref}>İptal</Link>
        </Button>
      }
    >
      <form
        onSubmit={submit}
        noValidate
        className="mx-auto max-w-3xl space-y-6 pb-20"
      >
        {(errorList.length > 0 || submitError) && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            className="border border-red-400/60 bg-red-500/10 p-4 text-sm text-white focus:outline-none"
          >
            {submitError ?? "Formda düzeltilmesi gereken alanlar var:"}
            {errorList.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {errorList.map((field) => (
                  <li key={field}>
                    <a className="underline" href={`#${fieldId(field)}`}>
                      {LABELS[field]}: {errors[field]}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {(
            [
              "firstName",
              "lastName",
              "email",
              "phone",
              "city",
              "country",
            ] as const
          ).map((field) => (
            <TextField
              key={field}
              field={field}
              value={values[field]}
              error={errors[field]}
              onChange={(value) => update(field, value)}
              type={
                field === "email" ? "email" : field === "phone" ? "tel" : "text"
              }
            />
          ))}
          <div className="space-y-2">
            <label
              htmlFor={fieldId("roleId")}
              className="block text-sm font-medium text-white"
            >
              Rol <span aria-hidden>*</span>
            </label>
            <Select
              value={values.roleId}
              onValueChange={(value) => update("roleId", value)}
              disabled={roles.isPending}
            >
              <SelectTrigger
                id={fieldId("roleId")}
                aria-invalid={Boolean(errors.roleId)}
                aria-describedby={
                  errors.roleId ? `${fieldId("roleId")}-error` : undefined
                }
                className="h-11 border-white/15 bg-black/40 text-white"
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
              <p className="text-sm text-red-300">
                Roller yüklenemedi; sayfayı yenileyin.
              </p>
            )}
            {errors.roleId && (
              <p
                id={`${fieldId("roleId")}-error`}
                className="text-sm text-red-300"
              >
                {errors.roleId}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button asChild variant="outline">
            <Link href={listHref}>İptal</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Gönderiliyor…" : "Davet gönder"}
          </Button>
        </div>
      </form>
    </BccEditorialWrapper>
  );
}

interface TextFieldProps {
  field: InviteField;
  value: string;
  error?: string;
  type: "text" | "email" | "tel";
  onChange: (value: string) => void;
}

function TextField({ field, value, error, type, onChange }: TextFieldProps) {
  const id = fieldId(field);
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-white">
        {LABELS[field]} {REQUIRED.has(field) && <span aria-hidden>*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={REQUIRED.has(field)}
        autoComplete={
          field === "email"
            ? "email"
            : field === "phone"
              ? "tel"
              : field === "firstName"
                ? "given-name"
                : field === "lastName"
                  ? "family-name"
                  : undefined
        }
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-md border border-white/15 bg-black/40 px-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 aria-[invalid=true]:border-red-400"
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

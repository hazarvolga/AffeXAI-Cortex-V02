"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchField } from "@/components/patterns/SearchField";
import { useListQuery } from "@/hooks/use-list-query";
import type { ListQueryDefaults } from "@/lib/list/list-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Eye, FilePlus2, Inbox, Pencil } from "lucide-react";
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import {
  FormEmptyState,
  FormErrorState,
  FormLoadingState,
} from "@/components/forms/FormPageState";
import { FormsPermissionGate } from "@/components/forms/FormsPermissionGate";
import { filterForms } from "@/components/forms/forms.logic";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions/constants";
import { cn } from "@/lib/utils";
import {
  formsService,
  type FormRecord,
  type FormStatus,
} from "@/services/forms.service";

const LIST_DEFAULTS: ListQueryDefaults = {
  pageSize: 25,
  filters: { status: "all" },
};

const STATUS_LABELS: Record<FormStatus, string> = {
  draft: "Taslak",
  published: "Yayında",
  archived: "Arşivde",
};

function FormsListContent({ tenantId }: { tenantId: string }) {
  const { hasPermission, isSuperAdmin } = usePermissions();
  const canManage = isSuperAdmin || hasPermission(Permission.FORMS_MANAGE);
  const canViewSubmissions =
    isSuperAdmin || hasPermission(Permission.FORMS_SUBMISSIONS_VIEW);
  const [forms, setForms] = useState<FormRecord[]>([]);
  const list = useListQuery(LIST_DEFAULTS);
  const query = list.q;
  const status = list.filters.status as FormStatus | "all";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setForms(await formsService.list());
    } catch {
      setError(
        "Form listesi yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const visibleForms = useMemo(
    () => filterForms(forms, query, status),
    [forms, query, status],
  );

  return (
    <BccEditorialWrapper
      theme="tenant-admin"
      headerTitle="Form Yönetimi"
      headerSubtitle="Formları oluşturun, yayınlayın ve gönderimleri takip edin."
      headerBadge={`${forms.length} form`}
    >
      <div className="space-y-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:max-w-2xl sm:flex-row">
            <SearchField
              label="Formlarda ara"
              placeholder="Form adı veya açıklaması"
              value={query}
              onCommit={list.setSearch}
              resultSummary={
                loading ? undefined : `${visibleForms.length} form`
              }
            />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-white/75">
                Durum
              </span>
              <select
                value={status}
                onChange={(event) =>
                  list.setFilter("status", event.target.value)
                }
                className="h-10 w-full rounded-md border border-white/15 bg-[#0c0c0c] px-3 text-sm text-white sm:w-40"
              >
                <option value="all">Tüm durumlar</option>
                <option value="draft">Taslak</option>
                <option value="published">Yayında</option>
                <option value="archived">Arşivde</option>
              </select>
            </label>
          </div>
          {canManage && (
            <Button
              asChild
              className="w-full bg-[#ff8c00] font-semibold text-black hover:bg-[#ff8c00]/90 sm:w-auto"
            >
              <Link href={`/${tenantId}/admin/forms/new`}>
                <FilePlus2 aria-hidden className="mr-2 h-4 w-4" /> Yeni form
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <FormLoadingState />
        ) : error ? (
          <FormErrorState message={error} onRetry={() => void load()} />
        ) : forms.length === 0 ? (
          <FormEmptyState
            title="Henüz form yok"
            description={
              canManage
                ? "İlk formunuzu oluşturup taslak olarak kaydedebilir veya yayınlayabilirsiniz."
                : "Size görünür bir form bulunmuyor."
            }
          />
        ) : visibleForms.length === 0 ? (
          <div className="space-y-3 text-center">
            <FormEmptyState
              title="Eşleşen form yok"
              description="Arama metnini veya durum filtresini değiştirin."
            />
            <Button
              variant="outline"
              onClick={() => {
                list.setSearch("");
                list.setFilter("status", "all");
              }}
            >
              Filtreleri temizle
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleForms.map((form) => (
              <article
                key={form.id}
                className="flex min-w-0 flex-col rounded-2xl border border-white/5 bg-[#0c0c0c] p-5 transition-colors hover:border-white/15"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-white">
                      {form.name}
                    </h2>
                    <p className="mt-1 line-clamp-2 min-h-10 text-sm text-white/70">
                      {form.description || "Açıklama eklenmemiş."}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-1 text-xs",
                      form.status === "published"
                        ? "border-green-400/20 bg-green-400/10 text-green-300"
                        : form.status === "archived"
                          ? "border-white/10 text-white/40"
                          : "border-[#ff8c00]/20 bg-[#ff8c00]/10 text-[#ffb45b]",
                    )}
                  >
                    {STATUS_LABELS[form.status]}
                  </span>
                </div>
                <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-white/5 pt-4 text-sm">
                  <div>
                    <dt className="text-xs text-white/65">Gönderim</dt>
                    <dd className="mt-1 font-medium text-white">
                      {form.submissionCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-white/65">Güncellendi</dt>
                    <dd className="mt-1 text-white/70">
                      {new Date(form.updatedAt).toLocaleDateString("tr-TR")}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5 flex flex-wrap gap-2">
                  {canManage && (
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/${tenantId}/admin/forms/${form.id}`}
                        aria-label={`${form.name} formunu düzenle`}
                      >
                        <Pencil aria-hidden className="mr-2 h-3.5 w-3.5" />{" "}
                        Düzenle
                      </Link>
                    </Button>
                  )}
                  {form.status === "published" && (
                    <Button asChild size="sm" variant="ghost">
                      <Link
                        href={`/${tenantId}/forms/${form.id}`}
                        aria-label={`${form.name} formunu aç`}
                      >
                        <Eye aria-hidden className="mr-2 h-3.5 w-3.5" /> Aç
                      </Link>
                    </Button>
                  )}
                  {canViewSubmissions && (
                    <Button asChild size="sm" variant="ghost">
                      <Link
                        href={`/${tenantId}/admin/forms/${form.id}/submissions`}
                        aria-label={`${form.name} gönderimleri`}
                      >
                        <Inbox aria-hidden className="mr-2 h-3.5 w-3.5" />{" "}
                        Gönderimler
                      </Link>
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </BccEditorialWrapper>
  );
}

export default function FormsListPage() {
  const params = useParams<{ tenant: string }>();
  return (
    <FormsPermissionGate permission={Permission.FORMS_VIEW}>
      <FormsListContent tenantId={params.tenant} />
    </FormsPermissionGate>
  );
}

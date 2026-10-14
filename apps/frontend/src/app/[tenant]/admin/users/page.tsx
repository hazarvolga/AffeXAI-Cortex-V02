"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { MoreHorizontal, UserPlus } from "lucide-react";
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EmptyState,
  ErrorState,
  NoResultsState,
} from "@/components/patterns/page-states";
import { SearchField } from "@/components/patterns/SearchField";
import { useListQuery } from "@/hooks/use-list-query";
import { usePermissions } from "@/hooks/usePermissions";
import { clampPage, type ListQueryDefaults } from "@/lib/list/list-query";
import { confirmDialog } from "@/lib/dialogs/dialog-queue";
import { toast } from "@/lib/notify";
import {
  UserManagementService,
  type User,
} from "@/services/user-management.service";
import { UserRoleDialog } from "./_components/UserRoleDialog";
import {
  USER_STATUS_LABEL,
  userDisplayName,
  userRoleLabel,
} from "./_components/user-presentation";

const LIST_DEFAULTS: ListQueryDefaults = {
  pageSize: 25,
  filters: { status: "all" },
};
const STATUS_FILTER: Record<string, boolean | undefined> = {
  all: undefined,
  active: true,
  inactive: false,
};
const dateFormat = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" });

export default function UsersPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const { isAdmin, isLoading: permissionsLoading } = usePermissions();
  const list = useListQuery(LIST_DEFAULTS);
  const queryClient = useQueryClient();
  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const users = useQuery({
    queryKey: [
      "users",
      tenant,
      list.q,
      list.filters.status,
      list.page,
      list.pageSize,
    ],
    queryFn: () =>
      UserManagementService.getUsers({
        search: list.q || undefined,
        isActive: STATUS_FILTER[list.filters.status],
        page: list.page,
        limit: list.pageSize,
      }),
    enabled: isAdmin,
    placeholderData: keepPreviousData,
  });
  const stats = useQuery({
    queryKey: ["users", tenant, "stats"],
    queryFn: () => UserManagementService.getStats(),
    enabled: isAdmin,
  });

  // After a delete or a narrower filter, stay on the last page that still has rows.
  const total = users.data?.total ?? 0;
  const validPage = clampPage(list.page, total, list.pageSize);
  const { setPage } = list;
  useEffect(() => {
    if (users.data && validPage !== list.page) setPage(validPage);
  }, [users.data, validPage, list.page, setPage]);

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["users", tenant] }),
    [queryClient, tenant],
  );

  const changeStatus = async (user: User) => {
    const deactivating = user.isActive;
    const name = userDisplayName(user);
    if (
      deactivating &&
      !(await confirmDialog({
        title: `${name} pasifleştirilsin mi?`,
        description:
          "Kullanıcı oturum açamaz; kayıtları silinmez ve daha sonra yeniden etkinleştirilebilir.",
        confirmText: "Pasifleştir",
        destructive: true,
      }))
    ) {
      return;
    }
    setBusyId(user.id);
    try {
      await UserManagementService.toggleUserStatus(user.id);
      toast.success(
        deactivating ? `${name} pasifleştirildi` : `${name} etkinleştirildi`,
      );
      await refresh();
    } catch {
      toast.error("Durum değiştirilemedi", {
        description: "Yetkinizi kontrol edip tekrar deneyin.",
      });
    } finally {
      setBusyId(null);
    }
  };

  if (!permissionsLoading && !isAdmin) {
    return (
      <BccEditorialWrapper
        headerTitle="Kullanıcılar"
        headerSubtitle="Erişim kısıtlı"
        headerBadge="Yönetim"
      >
        <ErrorState
          title="Bu sayfayı görüntüleme yetkiniz yok"
          description="Kullanıcı listesi yalnız kuruluş yöneticilerine açık."
          action={
            <Button asChild variant="outline">
              <Link href={`/${tenant}/admin`}>Genel bakışa dön</Link>
            </Button>
          }
        />
      </BccEditorialWrapper>
    );
  }

  const items = users.data?.items ?? [];
  const lastPage = Math.max(1, Math.ceil(total / list.pageSize));
  const filtered = Boolean(list.q) || list.filters.status !== "all";

  return (
    <BccEditorialWrapper
      headerTitle="Kullanıcılar"
      headerSubtitle="Çalışma alanı kullanıcıları, rolleri ve erişim durumu."
      headerBadge="Yönetim"
      telemetryData={
        stats.data
          ? [
              { label: "Toplam", value: String(stats.data.total) },
              { label: "Aktif", value: String(stats.data.active) },
              {
                label: "Doğrulama bekleyen",
                value: String(stats.data.unverified),
              },
            ]
          : []
      }
      headerAction={
        <Button asChild>
          <Link href={`/${tenant}/admin/users/new`}>
            <UserPlus aria-hidden className="mr-2 h-4 w-4" />
            Kullanıcı davet et
          </Link>
        </Button>
      }
    >
      <div className="space-y-6 pb-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <SearchField
            label="Kullanıcı ara"
            placeholder="Ad veya e-posta"
            value={list.q}
            onCommit={list.setSearch}
            resultSummary={users.data ? `${total} kullanıcı` : undefined}
          />
          <div className="w-full sm:w-48">
            <label
              htmlFor="user-status-filter"
              className="mb-1 block text-xs font-medium text-white/75"
            >
              Durum
            </label>
            <Select
              value={list.filters.status}
              onValueChange={(value) => list.setFilter("status", value)}
            >
              <SelectTrigger
                id="user-status-filter"
                className="border-white/15 bg-black/40 text-white"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {users.isPending ? (
          <p role="status" className="py-12 text-center text-sm text-white/70">
            Kullanıcılar yükleniyor…
          </p>
        ) : users.isError ? (
          <ErrorState
            title="Kullanıcılar yüklenemedi"
            description="Bağlantınızı kontrol edip tekrar deneyin."
            action={
              <Button onClick={() => users.refetch()}>Tekrar dene</Button>
            }
          />
        ) : items.length === 0 && filtered ? (
          <NoResultsState
            title="Aramanızla eşleşen kullanıcı yok"
            action={
              <Button
                variant="outline"
                onClick={() => {
                  list.setSearch("");
                  list.setFilter("status", "all");
                }}
              >
                Filtreleri temizle
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Henüz kullanıcı yok"
            description="Ekibinizi davet ederek başlayın."
            action={
              <Button asChild>
                <Link href={`/${tenant}/admin/users/new`}>
                  Kullanıcı davet et
                </Link>
              </Button>
            }
          />
        ) : (
          <UsersTable
            users={items}
            busyId={busyId}
            onChangeRole={setRoleTarget}
            onChangeStatus={changeStatus}
          />
        )}

        {total > list.pageSize && (
          <nav
            aria-label="Sayfalama"
            className="flex items-center justify-between gap-4 text-sm text-white/75"
          >
            <Button
              variant="outline"
              disabled={list.page <= 1}
              onClick={() => list.setPage(list.page - 1)}
            >
              Önceki
            </Button>
            <span>
              Sayfa {list.page} / {lastPage}
            </span>
            <Button
              variant="outline"
              disabled={list.page >= lastPage}
              onClick={() => list.setPage(list.page + 1)}
            >
              Sonraki
            </Button>
          </nav>
        )}
      </div>

      <UserRoleDialog
        user={roleTarget}
        onClose={() => setRoleTarget(null)}
        onSaved={async () => {
          setRoleTarget(null);
          toast.success("Değişiklikler kaydedildi");
          await refresh();
        }}
      />
    </BccEditorialWrapper>
  );
}

interface UsersTableProps {
  users: User[];
  busyId: string | null;
  onChangeRole: (user: User) => void;
  onChangeStatus: (user: User) => void;
}

function UsersTable({
  users,
  busyId,
  onChangeRole,
  onChangeStatus,
}: UsersTableProps) {
  return (
    <div className="overflow-x-auto border border-white/10">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Kullanıcı listesi</caption>
        <thead className="bg-black/40 text-xs uppercase tracking-wider text-white/70">
          <tr>
            <th scope="col" className="px-4 py-3">
              Kullanıcı
            </th>
            <th scope="col" className="hidden px-4 py-3 md:table-cell">
              Rol
            </th>
            <th scope="col" className="px-4 py-3">
              Durum
            </th>
            <th scope="col" className="hidden px-4 py-3 lg:table-cell">
              Son giriş
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              <span className="sr-only">İşlemler</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const name = userDisplayName(user);
            return (
              <tr key={user.id} className="border-t border-white/10">
                <td className="px-4 py-3">
                  <div className="font-semibold text-white">{name}</div>
                  <div className="break-all text-xs text-white/70">
                    {user.email}
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-white/85 md:table-cell">
                  {userRoleLabel(user)}
                </td>
                <td className="px-4 py-3 text-white/85">
                  {USER_STATUS_LABEL[user.status]}
                </td>
                <td className="hidden px-4 py-3 text-white/70 lg:table-cell">
                  {user.lastActive
                    ? dateFormat.format(user.lastActive)
                    : "Hiç giriş yapmadı"}
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={busyId === user.id}
                        aria-label={`${name} için işlemler`}
                      >
                        <MoreHorizontal aria-hidden className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onChangeRole(user)}>
                        Rolü değiştir
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onChangeStatus(user)}>
                        {user.isActive ? "Pasifleştir" : "Etkinleştir"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

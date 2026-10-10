'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { useParams } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/lib/permissions/constants';

interface FormsPermissionGateProps {
  permission: Permission;
  children: ReactNode;
}

export function FormsPermissionGate({ permission, children }: FormsPermissionGateProps) {
  const params = useParams<{ tenant: string }>();
  const { hasPermission, isSuperAdmin, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="min-h-[45vh] animate-pulse rounded-3xl border border-white/5 bg-white/[0.02]" aria-label="Yetkiler yükleniyor" />
    );
  }

  if (!isSuperAdmin && !hasPermission(permission)) {
    return (
      <div className="flex min-h-[45vh] flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#0c0c0c] px-6 text-center">
        <ShieldAlert className="mb-5 h-10 w-10 text-[#ff8c00]" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-white">Bu alan için yetkiniz yok</h1>
        <p className="mt-2 max-w-md text-sm text-white/50">Gerekli erişim izni hesabınıza atanmadı.</p>
        <Link className="mt-6 text-sm font-medium text-[#ff8c00] hover:underline" href={`/${params.tenant}/admin`}>
          Yönetim paneline dön
        </Link>
      </div>
    );
  }

  return children;
}

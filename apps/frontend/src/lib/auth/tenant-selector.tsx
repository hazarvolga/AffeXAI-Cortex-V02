"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { tenantFromPath } from "./tenant-selection";

export function useTenantSelection() {
  const pathname = usePathname();
  const [tenantId, setTenantId] = useState("");
  useEffect(() => {
    const syncTimeout = window.setTimeout(() => {
      setTenantId(tenantFromPath(pathname ?? "") ?? "");
    }, 0);
    return () => window.clearTimeout(syncTimeout);
  }, [pathname]);
  return [tenantId, setTenantId] as const;
}

export function TenantSelector({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor="tenantId" className="text-sm font-medium">
        Çalışma alanı kodu
      </label>
      <input
        id="tenantId"
        name="tenantId"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        pattern="[-A-Za-z0-9_]{1,128}"
        maxLength={128}
        autoComplete="organization"
        disabled={disabled}
        placeholder="xyz-company"
        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
      />
      <p className="text-xs opacity-70">
        Kurumunuzun size verdiği çalışma alanı kodunu kullanın.
      </p>
    </div>
  );
}

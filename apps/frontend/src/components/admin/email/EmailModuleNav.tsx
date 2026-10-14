"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Genel bakış", path: "" },
  { label: "Kampanyalar", path: "/campaigns" },
  { label: "Otomasyonlar", path: "/automations" },
  { label: "Aboneler", path: "/subscribers" },
  { label: "Şablonlar", path: "/templates" },
  { label: "Liste tarama", path: "/validation" },
  { label: "Adres doğrulama", path: "/validator" },
  { label: "Analitik", path: "/analytics" },
] as const;

/** Secondary navigation for the e-mail marketing module. */
export const EmailModuleNav = () => {
  const pathname = usePathname();
  const params = useParams();
  const tenant = (params?.tenant as string) || "default";

  return (
    <nav aria-label="E-posta pazarlama" className="w-full overflow-x-auto pb-2">
      <ul className="flex w-max items-center gap-2 text-xs font-medium">
        {NAV_ITEMS.map((item) => {
          const href = `/${tenant}/admin/email${item.path}`;
          const isActive = pathname === href;
          return (
            <li key={item.path}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-9 items-center border-b-2 px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                  isActive
                    ? "border-[#ff8c00] bg-[#ff8c00]/10 text-white"
                    : "border-transparent text-white/75 hover:bg-white/5 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

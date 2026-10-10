"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

export const EmailModuleNav = () => {
    const pathname = usePathname();
    const params = useParams();
    const tenant = params?.tenant as string || "default";

    const navItems = [
        { label: "OVERVIEW", href: `/${tenant}/admin/email` },
        { label: "CAMPAIGNS", href: `/${tenant}/admin/email/campaigns` },
        { label: "AUTOMATIONS", href: `/${tenant}/admin/email/automations` },
        { label: "SUBSCRIBERS", href: `/${tenant}/admin/email/subscribers` },
        { label: "TEMPLATES", href: `/${tenant}/admin/email/templates` },
        { label: "SCANNER", href: `/${tenant}/admin/email/validation` },
        { label: "VALIDATOR", href: `/${tenant}/admin/email/validator` },
        { label: "ANALYTICS", href: `/${tenant}/admin/email/analytics` }
    ];

    return (
        <nav className="flex items-center gap-8 font-mono text-[9px] tracking-widest overflow-x-auto no-scrollbar w-full flex-nowrap whitespace-nowrap pb-2">
            {navItems.map((item, idx) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                            "px-3 py-1 transition-all duration-300 border-b-2 shrink-0",
                            isActive
                                ? "text-white border-[#ff8c00] bg-[#ff8c00]/5"
                                : "text-white/30 border-transparent hover:text-[#ff8c00] hover:bg-white/5"
                        )}
                    >
                        [ {item.label} ]
                    </Link>
                );
            })}
        </nav>
    );
};

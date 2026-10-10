"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Smart Sub-Navigation for the Social Module
 * Multi-tenant aware navigation for Social Media management.
 */
export const SocialModuleNav = () => {
    const pathname = usePathname();
    const params = useParams();

    const tenant = params?.tenant as string || "default";

    const navItems = [
        // CORE
        { label: "REGISTRY", href: `/${tenant}/admin/social`, global: true },

        // OPERATIONS
        { label: "COMPOSER", href: `/${tenant}/admin/social/composer`, global: true },
        { label: "SCHEDULER", href: `/${tenant}/admin/social/scheduler`, global: true },

        // DATA / SETTINGS
        { label: "ACCOUNTS", href: `/${tenant}/admin/social/accounts`, global: true },
        // { label: "ANALYTICS", href: `/${tenant}/admin/social/analytics`, global: true }, // Pending implementation
    ];

    return (
        <nav className="flex items-center space-x-1 font-mono text-[9px] tracking-widest overflow-x-auto no-scrollbar">
            {navItems.map((item, idx) => {
                const isActive = pathname === item.href;
                // Group separator logic (Optional visual groupings)
                // 0: Registry
                // 1,2: Ops
                // 3: Settings
                const isGroupStart = idx === 1 || idx === 3;

                return (
                    <React.Fragment key={item.label}>
                        {isGroupStart && (
                            <span className="text-white/10 px-2 select-none">||</span>
                        )}

                        <Link
                            href={item.href}
                            className={cn(
                                "px-3 py-1 transition-all duration-300 border-b-2",
                                isActive
                                    ? "text-white border-[#ff8c00] bg-[#ff8c00]/5"
                                    : "text-white/30 border-transparent hover:text-[#ff8c00] hover:bg-white/5"
                            )}
                        >
                            [ {item.label} ]
                        </Link>

                        {!isGroupStart && idx < navItems.length - 1 && (
                            <span className="text-white/5 px-1 select-none">|</span>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

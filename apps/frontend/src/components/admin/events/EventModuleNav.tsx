"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Smart Sub-Navigation for the Event Module
 * Detects context (ID/Slug) and renders appropriate command links.
 */
export const EventModuleNav = () => {
    const pathname = usePathname();
    const params = useParams();

    const tenant = params?.tenant as string || "default";
    const eventId = params?.id as string || params?.slug as string;

    const navItems = [
        { label: "REGISTRY", href: `/${tenant}/admin/events`, global: true },
        { label: "DEPLOY", href: `/${tenant}/admin/events/new`, global: true },
        // Contextual Items
        { label: "CORE_DATA", href: `/${tenant}/admin/events/${eventId}`, contextual: true },
        { label: "COMMAND", href: `/${tenant}/admin/events/${eventId}/control`, contextual: true },
        { label: "ANALYTICS", href: `/${tenant}/admin/events/${eventId}/analytics`, contextual: true },
        { label: "CERTIFICATES", href: `/${tenant}/admin/events/${eventId}/certificates`, contextual: true },
        { label: "COMMS", href: `/${tenant}/admin/events/${eventId}/comms`, contextual: true },
    ];

    return (
        <nav className="flex items-center space-x-1 font-mono text-[9px] tracking-widest overflow-x-auto no-scrollbar">
            {navItems.map((item, idx) => {
                // Only show contextual items if eventId exists and item is NOT "DEPLOY" (which is global)
                if (item.contextual && !eventId) return null;

                const isActive = pathname === item.href;
                const isSystemSeparator = (idx === 1 && eventId); // Visual gap between global and contextual

                return (
                    <React.Fragment key={item.label}>
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
                        {isSystemSeparator && (
                            <span className="text-white/10 px-2 select-none">||</span>
                        )}
                        {!isSystemSeparator && idx < navItems.length - 1 && !(!eventId && navItems[idx + 1].contextual) && (
                            <span className="text-white/5 px-1 select-none">|</span>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

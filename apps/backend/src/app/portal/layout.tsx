'use client';

import { ReactNode, Suspense, useState } from "react";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { AdminTopBar } from "@/components/portal/admin-top-bar";
import { usePathname } from 'next/navigation'

// In a real app, the user's base role would come from an auth context.
const mockAdmin = {
    role: 'Admin', 
};

// Helper to extract role from pathname
const getRoleFromPathname = (pathname: string): string => {
    const parts = pathname.split('/');
    if (parts.length > 3 && parts[1] === 'portal' && parts[2] === 'dashboard') {
        const rolePart = parts[3];
        // Handle URL encoding for "Support Team" etc.
        const roleName = rolePart ? decodeURIComponent(rolePart.replace(/\+/g, ' ')) : 'Customer';
        // Capitalize role names correctly e.g. "support-team" -> "Support Team"
        return roleName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return 'Customer';
}

export default function PortalLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    
    // Don't show sidebar and header on login page
    const isLoginPage = pathname === '/portal/login';
    
    // Determine role from URL path first, then fallback to default.
    const effectiveRole = getRoleFromPathname(pathname);

    // Show the admin bar if the base user is an admin.
    const isAdmin = mockAdmin.role === 'Admin';

    if (isLoginPage) {
        return <div className="min-h-screen w-full">{children}</div>;
    }

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <PortalSidebar role={effectiveRole} />
            <div className="flex flex-col">
                {isAdmin && <AdminTopBar currentRole={effectiveRole} />}
                <PortalHeader />
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
                    {children}
                </main>
            </div>
        </div>
    );
}
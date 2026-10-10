
'use client'

import Link from "next/link";
import { Package2, Home, Users, Settings, FileText, LifeBuoy, Calendar, BookOpen, Globe, Award, Zap, ShoppingCart, GraduationCap, Mail } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * USER PORTAL - Role-Based Access Configuration
 *
 * User Portal is for end-users (Customer, Student, Subscriber)
 * Admin/Editor/Support should use Admin Panel instead
 *
 * Access Rules:
 * - 'all': All portal users (Customer, Student, Subscriber, Admin)
 * - 'customer': Only users with Customer role
 * - 'student': Only users with Student role
 * - 'subscriber': Only users with Subscriber role
 * - ['customer', 'student']: Users with ANY of these roles
 * - 'admin': Admin only (for testing/debug features)
 */

type RoleAccess = 'all' | 'customer' | 'student' | 'subscriber' | 'admin';

interface NavLink {
    href: string;
    icon: any;
    label: string;
    access: RoleAccess | RoleAccess[];
}

const allNavLinks: NavLink[] = [
    // Common for all portal users
    { href: "/portal/dashboard", icon: Home, label: "Genel Bakış", access: 'all' },

    // Customer-specific features
    { href: "/portal/orders", icon: ShoppingCart, label: "Siparişlerim", access: 'customer' },
    { href: "/portal/licenses", icon: FileText, label: "Lisanslarım", access: 'customer' },
    { href: "/portal/support", icon: LifeBuoy, label: "Destek Taleplerim", access: 'customer' },

    // Education features (Customer + Student)
    { href: "/portal/courses", icon: GraduationCap, label: "Eğitimlerim", access: ['customer', 'student'] },
    { href: "/portal/certificates", icon: Award, label: "Sertifikalarım", access: ['customer', 'student'] },

    // Content features (All users can view)
    { href: "/portal/kb", icon: BookOpen, label: "Bilgi Bankası", access: 'all' },
    { href: "/portal/newsletter", icon: Mail, label: "Bülten Arşivi", access: 'all' },
    { href: "/portal/events", icon: Calendar, label: "Etkinliklerim", access: 'all' },

    // Profile (everyone)
    { href: "/portal/profile", icon: Users, label: "Profilim", access: 'all' },

    // Admin-only debug feature
    { href: "/portal/caching-test", icon: Zap, label: "Caching Test", access: 'admin' },
];

interface PortalSidebarProps {
    user?: any; // Full user object with metadata
}

export function PortalSidebar({ user }: PortalSidebarProps) {
    const pathname = usePathname();

    /**
     * Check if user has a specific role (supports multi-role)
     * Uses new role system: user.roles[] or user.primaryRole
     */
    const hasRole = (roleName: string): boolean => {
        if (!user) return false;

        // NEW: Check in roles array (multi-role system)
        if (user.roles && Array.isArray(user.roles)) {
            return user.roles.some((role: any) =>
                role.name.toLowerCase() === roleName.toLowerCase()
            );
        }

        // FALLBACK: Check primaryRole
        if (user.primaryRole?.name) {
            return user.primaryRole.name.toLowerCase() === roleName.toLowerCase();
        }

        // LEGACY: Check old roleEntity for backward compatibility
        if (user.roleEntity?.name) {
            return user.roleEntity.name.toLowerCase() === roleName.toLowerCase();
        }

        return false;
    };

    /**
     * Check if user has ANY of the specified roles
     */
    const hasAnyRole = (roleNames: string[]): boolean => {
        return roleNames.some(roleName => hasRole(roleName));
    };

    // Debug logging
    console.log('🔍 PortalSidebar Debug:', {
        user,
        hasRoles: user?.roles?.map((r: any) => r.name),
        primaryRole: user?.primaryRole?.name,
        hasCustomer: hasRole('customer'),
        hasStudent: hasRole('student'),
        hasSubscriber: hasRole('subscriber'),
        hasAdmin: hasRole('admin'),
    });

    // Filter links based on role-based access
    const navLinks = allNavLinks.filter(link => {
        // 'all' - everyone can access
        if (link.access === 'all') return true;

        // No user = no access
        if (!user) return false;

        // Single role access
        if (typeof link.access === 'string') {
            return hasRole(link.access);
        }

        // Multiple roles access (array) - user needs ANY of these roles
        if (Array.isArray(link.access)) {
            return hasAnyRole(link.access);
        }

        return false;
    });

    return (
        <div className="hidden border-r bg-background sm:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/portal/dashboard" className="flex items-center gap-2 font-semibold">
                        <Package2 className="h-6 w-6 text-primary" />
                        <span className="">Kullanıcı Portalı</span>
                    </Link>
                </div>
                <div className="flex-1">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        {navLinks.map(link => {
                             // The dashboard link should always point to the main dispatcher
                             const href = link.label === 'Genel Bakış' ? '/portal/dashboard' : link.href;
                             const isActive = pathname.startsWith(href) && href !== '#';
                             
                             return (
                                <Link
                                    key={link.label}
                                    href={href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                        isActive && "bg-muted text-primary"
                                    )}
                                >
                                    <link.icon className="h-4 w-4" />
                                    {link.label}
                                </Link>
                             )
                        })}
                    </nav>
                </div>
                <div className="mt-auto p-4">
                    <nav className="grid gap-1">
                        <Link
                            href="/"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Globe className="h-4 w-4" />
                            Siteye Dön
                        </Link>
                         <Link
                            href="#"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Settings className="h-4 w-4" />
                            Ayarlar
                        </Link>
                    </nav>
                </div>
            </div>
        </div>
    );
}

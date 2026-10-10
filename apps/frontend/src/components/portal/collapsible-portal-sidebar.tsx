
'use client'

import Link from "next/link";
import { Package2, Home, Users, Settings, FileText, LifeBuoy, Calendar, BookOpen, Globe, Award, Zap, ShoppingCart, GraduationCap, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

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
    { href: "/portal/kb", icon: BookOpen, label: "Bilgi Bankası", access: 'customer' },

    // Education features (Customer + Student)
    { href: "/portal/courses", icon: GraduationCap, label: "Eğitimlerim", access: ['customer', 'student'] },
    { href: "/portal/certificates", icon: Award, label: "Sertifikalarım", access: ['customer', 'student'] },

    // Public content features (All users can view)
    { href: "/portal/newsletter", icon: Mail, label: "Bülten Arşivi", access: 'all' },
    { href: "/portal/events", icon: Calendar, label: "Etkinlikler", access: 'all' },

    // Profile (everyone)
    { href: "/portal/profile", icon: Users, label: "Profilim", access: 'all' },

    // Admin-only debug feature
    { href: "/portal/caching-test", icon: Zap, label: "Caching Test", access: 'admin' },
];

interface PortalSidebarProps {
    user?: any; // Full user object with metadata
}

export function CollapsiblePortalSidebar({ user }: PortalSidebarProps) {
    const pathname = usePathname();

    // Collapsible state with localStorage
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Load collapse state from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('portal-sidebar-collapsed');
        if (stored !== null) {
            setIsCollapsed(stored === 'true');
        }
    }, []);

    // Save collapse state to localStorage
    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('portal-sidebar-collapsed', String(newState));
    };

    /**
     * Check if user has a specific role (supports multi-role)
     * Uses new role system: user.roles[] or user.primaryRole
     */
    const hasRole = (roleName: string): boolean => {
        if (!user) return false;
        const target = roleName.toLowerCase();

        // 1. Check in roles array (multi-role system)
        if (user.roles && Array.isArray(user.roles)) {
            if (user.roles.some((role: any) =>
                role.name?.toLowerCase() === target
            )) {
                return true;
            }
        }

        // 2. Check primaryRole
        if (user.primaryRole?.name?.toLowerCase() === target) {
            return true;
        }

        // 3. LEGACY: Check old roleEntity for backward compatibility
        if (user.roleEntity?.name?.toLowerCase() === target) {
            return true;
        }

        return false;
    };

    /**
     * Check if user has ANY of the specified roles
     */
    const hasAnyRole = (roleNames: string[]): boolean => {
        return roleNames.some(roleName => hasRole(roleName));
    };

    /**
     * NEWSLETTER-BASED SIDEBAR FILTERING FOR VIEWER USERS
     *
     * Business Logic:
     * - Customer users: See ALL menu items (full access)
     * - Viewer users: See menu items based on newsletter preferences
     *   - productUpdates: true → Show product-related pages (when added)
     *   - events: true → Show events page
     *   - promotions: true → Show promotions (when added)
     *
     * Newsletter preferences are stored in user.metadata.newsletterPreferences
     */
    const checkNewsletterAccess = (link: NavLink): boolean => {
        // If user has customer role, show everything
        if (hasRole('customer')) return true;

        // If user is viewer, check newsletter preferences
        if (hasRole('viewer')) {
            const newsletterPrefs = user?.metadata?.newsletterPreferences;

            // Events page - show only if user opted for events
            if (link.href === '/portal/events') {
                return newsletterPrefs?.events === true;
            }

            // Newsletter archive - show only if any newsletter preference is selected
            if (link.href === '/portal/newsletter') {
                return newsletterPrefs?.productUpdates === true ||
                    newsletterPrefs?.events === true ||
                    newsletterPrefs?.promotions === true;
            }

            // Knowledge Base - show only if user opted for product updates
            if (link.href === '/portal/kb') {
                return newsletterPrefs?.productUpdates === true;
            }

            // Future: Product pages would check productUpdates
            // Future: Promotions pages would check promotions
        }

        // Default: show the item (for non-viewer users)
        return true;
    };

    // Debug logging
    console.log('🔍 PortalSidebar Debug:', {
        user,
        hasRoles: user?.roles?.map((r: any) => r.name),
        primaryRole: user?.primaryRole?.name,
        newsletterPreferences: user?.metadata?.newsletterPreferences,
        hasCustomer: hasRole('customer'),
        hasStudent: hasRole('student'),
        hasSubscriber: hasRole('subscriber'),
        hasViewer: hasRole('viewer'),
        hasAdmin: hasRole('admin'),
    });

    // Filter links based on role-based access + newsletter preferences
    const navLinks = allNavLinks.filter(link => {
        // 'all' - everyone can access (but viewer access still filtered by newsletter preferences)
        if (link.access === 'all') {
            return checkNewsletterAccess(link);
        }

        // No user = no access
        if (!user) return false;

        // Single role access
        if (typeof link.access === 'string') {
            const hasRoleAccess = hasRole(link.access);
            // If role matches, also check newsletter access
            return hasRoleAccess && checkNewsletterAccess(link);
        }

        // Multiple roles access (array) - user needs ANY of these roles
        if (Array.isArray(link.access)) {
            const hasRoleAccess = hasAnyRole(link.access);
            // If role matches, also check newsletter access
            return hasRoleAccess && checkNewsletterAccess(link);
        }

        return false;
    });

    return (
        <div className={cn(
            "hidden border-r bg-background sm:block sticky top-0 h-screen transition-all duration-300 ease-in-out",
            isCollapsed ? "w-[60px]" : "w-[220px] lg:w-[280px]"
        )}>
            <div className="flex h-full max-h-screen flex-col gap-2 relative">
                {/* Header with Logo */}
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/portal/dashboard" className="flex items-center gap-2 font-semibold">
                        <Package2 className="h-6 w-6 text-primary flex-shrink-0" />
                        {!isCollapsed && <span className="truncate">Kullanıcı Portalı</span>}
                    </Link>
                </div>

                {/* Collapse Toggle Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleCollapse}
                    className="absolute -right-3 top-16 z-50 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent"
                    title={isCollapsed ? "Genişlet" : "Daralt"}
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>

                <div className="flex-1 overflow-auto">
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
                                        isActive && "bg-muted text-primary",
                                        isCollapsed && "justify-center px-2"
                                    )}
                                    title={isCollapsed ? link.label : undefined}
                                >
                                    <link.icon className="h-4 w-4 flex-shrink-0" />
                                    {!isCollapsed && <span className="truncate">{link.label}</span>}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
                <div className="mt-auto p-4">
                    <nav className="grid gap-1">
                        <Link
                            href="/"
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                isCollapsed && "justify-center px-2"
                            )}
                            title={isCollapsed ? "Siteye Dön" : undefined}
                        >
                            <Globe className="h-4 w-4 flex-shrink-0" />
                            {!isCollapsed && "Siteye Dön"}
                        </Link>
                        <Link
                            href="/portal/settings"
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                isCollapsed && "justify-center px-2"
                            )}
                            title={isCollapsed ? "Ayarlar" : undefined}
                        >
                            <Settings className="h-4 w-4 flex-shrink-0" />
                            {!isCollapsed && "Ayarlar"}
                        </Link>
                    </nav>
                </div>
            </div>
        </div>
    );
}

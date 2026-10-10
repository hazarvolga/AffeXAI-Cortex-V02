
'use client'

import Link from "next/link";
import { Package2, Home, Users, Settings, FileText, LifeBuoy, Calendar, BookOpen, Globe, Award, Zap } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const allNavLinks = [
    { href: "/portal/dashboard", icon: Home, label: "Genel Bakış" },
    { href: "/portal/caching-test", icon: Zap, label: "Caching Test" },
    { href: "/portal/events", icon: Calendar, label: "Etkinliklerim" },
    { href: "/portal/certificates", icon: Award, label: "Sertifikalarım" },
    { href: "/portal/support", icon: LifeBuoy, label: "Destek Taleplerim" },
    { href: "/portal/kb", icon: BookOpen, label: "Bilgi Bankası" },
    { href: "/portal/profile", icon: Users, label: "Profilim" },
    { href: "#", icon: FileText, label: "Lisanslarım" },
];

const editorHiddenLinks = ['Destek Taleplerim', 'Bilgi Bankası', 'Lisanslarım'];
const viewerHiddenLinks = ['Etkinliklerim', 'Sertifikalarım', 'Destek Taleplerim', 'Bilgi Bankası', 'Lisanslarım'];


export function PortalSidebar({ role }: { role: string }) {
    const pathname = usePathname();

    // Determine which links to show based on the role
    const navLinks = allNavLinks.filter(link => {
        if (role === 'Editor') {
            return !editorHiddenLinks.includes(link.label);
        }
        if (role === 'Viewer') {
            return !viewerHiddenLinks.includes(link.label);
        }
        // Add more role-based filtering logic here if needed for other roles
        // e.g., if (role === 'Support Team') { ... }
        return true; // Show all links by default for other roles
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

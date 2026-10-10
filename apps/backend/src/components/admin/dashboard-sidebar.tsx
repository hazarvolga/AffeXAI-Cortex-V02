'use client'

import Link from "next/link";
import { Package2, Home, Users, LineChart, Bell, Settings, Calendar, LifeBuoy, Bot, Globe, Award, ShieldCheck, FileText, Send, Share2, Layers } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

const navLinks = [
    { href: "/admin", label: "Genel Bakış", icon: Home },
    { href: "/admin/events", label: "Etkinlikler", icon: Calendar },
    { href: "/admin/certificates", label: "Sertifikalar", icon: Award },
    { href: "/admin/newsletter", label: "Email Marketing", icon: Send },
    { href: "/admin/social-media", label: "Sosyal Medya", icon: Share2 },
    { href: "/admin/support", label: "Destek Merkezi", icon: LifeBuoy },
    { href: "/admin/notifications", label: "Bildirimler", icon: Bell },
    { href: "/admin/logs", label: "Aktivite Kayıtları", icon: LineChart },
];


const userManagementLinks = [
    { href: "/admin/users", label: "Kullanıcı Listesi"},
    { href: "/admin/users/roles", label: "Roller ve İzinler"},
]

export function DashboardSidebar() {
    const pathname = usePathname();

    const isNavLinkActive = (href: string) => {
        if (href === "/admin") {
            return pathname === href;
        }
        if (href.includes('cms')) {
            return pathname.startsWith('/admin/cms');
        }
        if (href.includes('newsletter')) {
            return pathname.startsWith('/admin/newsletter');
        }
         if (href.includes('social-media')) {
            return pathname.startsWith('/admin/social-media');
        }
        return pathname.startsWith(href);
    }

    return (
        <div className="hidden border-r bg-background sm:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/admin" className="flex items-center gap-2 font-semibold">
                        <Package2 className="h-6 w-6 text-primary" />
                        <span className="">Aluplan Admin</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-2">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        {navLinks.map(link => {
                             const isActive = isNavLinkActive(link.href);
                             return (
                                <Link
                                    key={link.href}
                                    href={link.href}
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
                         <Accordion type="multiple" className="w-full">
                             <AccordionItem value="user-management" className="border-none">
                                <AccordionTrigger className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:no-underline",
                                    (pathname.startsWith('/admin/users') || pathname.startsWith('/admin/roles')) && "bg-muted text-primary"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <Users className="h-4 w-4" />
                                        Kullanıcı Yönetimi
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-8 pt-1">
                                    <nav className="grid gap-1">
                                    {userManagementLinks.map(link => {
                                        const isActive = pathname === link.href;
                                        return (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                                    isActive && "bg-muted text-primary"
                                                )}
                                            >
                                                {link.label}
                                            </Link>
                                        )
                                    })}
                                    </nav>
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="cms-management" className="border-none">
                                <AccordionTrigger className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:no-underline",
                                    pathname.startsWith('/admin/cms') && "bg-muted text-primary"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4" />
                                        CMS Yönetimi
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-8 pt-1">
                                    <nav className="grid gap-1">
                                        <Link
                                            href="/admin/cms"
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                                pathname === "/admin/cms" && "bg-muted text-primary"
                                            )}
                                        >
                                            Sayfalar
                                        </Link>
                                        <Link
                                            href="/admin/cms/editor"
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                                pathname === "/admin/cms/editor" && "bg-muted text-primary"
                                            )}
                                        >
                                            Görsel Editör
                                        </Link>
                                        <Link
                                            href="/admin/cms/media"
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                                pathname === "/admin/cms/media" && "bg-muted text-primary"
                                            )}
                                        >
                                            Medya Yönetimi
                                        </Link>
                                    </nav>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                         <Link
                            href="/admin/settings/site"
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                pathname.startsWith('/admin/settings') && "bg-muted text-primary"
                            )}
                        >
                            <Settings className="h-4 w-4" />
                            Ayarlar
                        </Link>
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
                            href="/admin/dev-docs"
                            className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                pathname.startsWith('/admin/dev-docs') && "bg-muted text-primary"
                            )}
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Developer Docs
                        </Link>
                        <Link
                            href="/admin/blueprint"
                            className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                pathname.startsWith('/admin/blueprint') && "bg-muted text-primary"
                            )}
                        >
                            <Layers className="h-4 w-4" />
                            Blueprint
                        </Link>
                    </nav>
                </div>
            </div>
        </div>
    );
}
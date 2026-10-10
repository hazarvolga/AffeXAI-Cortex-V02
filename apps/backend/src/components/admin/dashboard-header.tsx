
'use client'
import React from "react";
import Link from "next/link";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Package2, Search, Bell, Home, Users, LineChart, PanelLeft, Settings, LogOut, Calendar, LifeBuoy, Bot, Globe, Award, FileText, Share2, ShieldCheck } from "lucide-react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "../ui/breadcrumb";
import { usePathname } from 'next/navigation';

const breadcrumbNameMap: { [key: string]: string } = {
  '/admin': 'Genel Bakış',
  '/admin/users': 'Kullanıcılar',
  '/admin/users/new': 'Yeni Kullanıcı',
  '/admin/notifications': 'Bildirimler',
  '/admin/logs': 'Aktivite Kayıtları',
  '/admin/events': 'Etkinlikler',
  '/admin/events/new': 'Yeni Etkinlik',
  '/admin/optimize-casestudy': 'SEO Optimizasyonu',
  '/admin/support': 'Destek Paneli',
  '/admin/support/new': 'Yeni Destek Talebi',
  '/admin/support/categories': 'Destek Kategorileri',
  '/admin/certificates': 'Sertifikalar',
  '/admin/certificates/new': 'Yeni Sertifika',
  '/admin/cms/pages': 'Sayfa Yönetimi',
  '/admin/cms/menus': 'Menü Yönetimi',
  '/admin/cms/pages/new': 'Yeni Sayfa',
  '/admin/social-media': 'Sosyal Medya Paneli',
  '/admin/social-media/composer': 'Yeni Gönderi Oluştur',
  '/admin/newsletter': 'Email Marketing',
  '/admin/newsletter/subscribers': 'Aboneler',
  '/admin/newsletter/subscribers/import': 'Toplu İçe Aktar',
  '/admin/newsletter/campaigns': 'Kampanyalar',
  '/admin/newsletter/campaigns/new': 'Yeni Kampanya',
  '/admin/newsletter/groups': 'Gruplar',
  '/admin/newsletter/segments': 'Segmentler',
  '/admin/dev-docs': 'Developer Docs',
  '/admin/settings': 'Ayarlar',
  '/admin/settings/site': 'Site Ayarları',
};

export function DashboardHeader() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/admin"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">Aluplan Admin</span>
            </Link>
            <Link href="/admin" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <Home className="h-5 w-5" />
              Genel Bakış
            </Link>
             <Link href="/admin/events" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <Calendar className="h-5 w-5" />
              Etkinlikler
            </Link>
             <Link href="/admin/certificates" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <Award className="h-5 w-5" />
              Sertifikalar
            </Link>
             <Link href="/admin/social-media" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                <Share2 className="h-5 w-5" />
                Sosyal Medya
            </Link>
             <Link href="/admin/cms/pages" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <FileText className="h-5 w-5" />
              Sayfa Yönetimi
            </Link>
            <Link href="/admin/users" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <Users className="h-5 w-5" />
              Kullanıcılar
            </Link>
             <Link href="/admin/support" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <LifeBuoy className="h-5 w-5" />
              Destek Merkezi
            </Link>
             <Link href="/admin/optimize-casestudy" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                <Bot className="h-5 w-5" />
                AI Araçları
            </Link>
            <Link href="/admin/notifications" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              Bildirimler
            </Link>
            <Link href="/admin/logs" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                <LineChart className="h-5 w-5" />
                Aktivite Kayıtları
            </Link>
             <Link href="/admin/settings/site" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                <Settings className="h-5 w-5" />
                Ayarlar
            </Link>
            <Link href="/admin/dev-docs" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                <ShieldCheck className="h-5 w-5" />
                Developer Docs
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Yönetim Paneli</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pathSegments.slice(1).map((segment, index) => {
             const href = `/${pathSegments.slice(0, index + 2).join('/')}`;
             let name = breadcrumbNameMap[href] || segment;
             if(href.startsWith('/admin/optimize-casestudy')){
                 name = 'AI Araçları';
             }

             const isLast = index === pathSegments.length - 2;
             
             const isDynamicAndUnmapped = href.split('/').length > 3 && !breadcrumbNameMap[href];

             return (
                <React.Fragment key={href}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        {isLast || isDynamicAndUnmapped ? (
                            <BreadcrumbPage>{breadcrumbNameMap[href] || name}</BreadcrumbPage>
                        ) : (
                            <BreadcrumbLink asChild>
                                <Link href={href}>{name}</Link>
                            </BreadcrumbLink>
                        )}
                    </BreadcrumbItem>
                </React.Fragment>
             )
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Ara..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
        />
      </div>
      <Button asChild variant="ghost" size="icon" className="relative rounded-full">
        <Link href="/admin/notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="sr-only">Bildirimler</span>
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <img src="https://i.pravatar.cc/150?u=admin" width={36} height={36} alt="Avatar" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4"/>
            Ayarlar
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Users className="mr-2 h-4 w-4"/>
            Destek
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4"/>
            Çıkış Yap
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

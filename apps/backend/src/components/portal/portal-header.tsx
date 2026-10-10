
'use client'
import React from "react";
import Link from "next/link";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Package2, Search, Bell, Home, Users, PanelLeft, Settings, LogOut, FileText, LifeBuoy, Calendar, BookOpen, Award } from "lucide-react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "../ui/breadcrumb";
import { usePathname } from 'next/navigation';

const breadcrumbNameMap: { [key: string]: string } = {
  '/portal/dashboard': 'Genel Bakış',
  '/portal/profile': 'Profilim',
  '/portal/events': 'Etkinliklerim',
  '/portal/support': 'Destek Taleplerim',
  '/portal/support/new': 'Yeni Destek Talebi',
  '/portal/kb': 'Bilgi Bankası',
  '/portal/certificates': 'Sertifikalarım',
};

export function PortalHeader() {
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
              href="/portal/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">Aluplan Portal</span>
            </Link>
            <Link href="/portal/dashboard" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <Home className="h-5 w-5" />
              Genel Bakış
            </Link>
             <Link href="/portal/events" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <Calendar className="h-5 w-5" />
              Etkinliklerim
            </Link>
            <Link href="/portal/support" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <LifeBuoy className="h-5 w-5" />
              Destek Taleplerim
            </Link>
             <Link href="/portal/kb" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <BookOpen className="h-5 w-5" />
              Bilgi Bankası
            </Link>
             <Link href="/portal/certificates" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <Award className="h-5 w-5" />
              Sertifikalarım
            </Link>
            <Link href="/portal/profile" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <Users className="h-5 w-5" />
              Profilim
            </Link>
             <Link href="#" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <FileText className="h-5 w-5" />
              Lisanslarım
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/portal/dashboard">Kullanıcı Portalı</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pathSegments.slice(1).map((segment, index) => {
             const href = `/${pathSegments.slice(0, index + 2).join('/')}`;
             let name = breadcrumbNameMap[href] || segment;
            
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
      <Button variant="ghost" size="icon" className="relative rounded-full">
        <Bell className="h-5 w-5" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <span className="sr-only">Bildirimler</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <img src="https://i.pravatar.cc/150?u=ahmet-yilmaz" width={36} height={36} alt="Avatar" />
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

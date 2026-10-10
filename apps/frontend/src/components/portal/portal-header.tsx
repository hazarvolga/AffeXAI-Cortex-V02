
'use client'
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Package2, Search, Bell, Home, Users, PanelLeft, Settings, LogOut, FileText, LifeBuoy, Calendar, BookOpen, Award, User, Shield } from "lucide-react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "../ui/breadcrumb";
import { usePathname } from 'next/navigation';
import { authService, type CurrentUser } from '@/lib/api';
import { isStaffRole } from '@/lib/permissions/constants';

const breadcrumbNameMap: { [key: string]: string } = {
  '/portal/dashboard': 'Genel Bakış',
  '/portal/profile': 'Profilim',
  '/portal/events': 'Etkinliklerim',
  '/portal/support': 'Destek Taleplerim',
  '/portal/support/new': 'Yeni Destek Talebi',
  '/portal/kb': 'Bilgi Bankası',
  '/portal/certificates': 'Sertifikalarım',
  '/portal/notifications': 'Bildirimler',
};

interface PortalHeaderProps {
  currentUser: CurrentUser | null;
}

export function PortalHeader({ currentUser }: PortalHeaderProps) {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);

  const handleLogout = () => {
    authService.logout();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!currentUser) return 'U';
    return `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    if (!currentUser) return 'Kullanıcı';
    return `${currentUser.firstName} ${currentUser.lastName}`;
  };

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
              <span className="sr-only">XYZ Company Portal</span>
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
      <Button asChild variant="ghost" size="icon" className="rounded-full">
        <Link href="/portal/notifications">
          <Bell className="h-5 w-5" />
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
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-semibold">
              {getUserInitials()}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {currentUser?.email || 'email@example.com'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/portal/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4"/>
              Profilim
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/portal/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4"/>
              Ayarlar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/portal/support" className="cursor-pointer">
              <LifeBuoy className="mr-2 h-4 w-4"/>
              Destek
            </Link>
          </DropdownMenuItem>
          {/* Panel Switcher: Show if user has staff roles */}
          {currentUser?.roles?.some((r: any) => isStaffRole(r.name)) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="cursor-pointer text-primary font-medium">
                  <Shield className="mr-2 h-4 w-4"/>
                  Admin Panel'e Geç
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4"/>
            Çıkış Yap
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
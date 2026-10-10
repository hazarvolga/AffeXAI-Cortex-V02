
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { MegaMenuCategory, MenuItem } from '@/lib/types';
import { ChevronDown, Menu, X, Mail, ArrowRight, UserCog, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '../ui/sheet';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { menus } from '@/lib/menu-data';
import { ThemeToggle } from '../common/theme-toggle';
import { getPlatformIcon } from '@/lib/social-media-data';
import Image from 'next/image';
import settingsService, { type SiteSettings } from '@/lib/api/settingsService';

const topBarLinks = [
  { href: '/downloads#faq', text: 'ALLPLAN FAQ' },
  { href: '/education/training', text: 'LEARN NOW' },
  { href: '#', text: 'Duyurular' },
  { href: '/downloads#remote', text: 'Microsoft Teams' },
  { href: '#', text: 'Product Lifecycle' },
  { href: '/downloads#customer', text: 'Allplan Connect: Login' },
  { href: '/downloads#license', text: 'Allplan Connect License' },
];

const MegaMenuContent = ({ categories, parentHref }: { categories: MegaMenuCategory[], parentHref: string }) => (
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => (
        <div key={category.title}>
          <p className="font-semibold uppercase tracking-wider text-sm text-primary">{category.title}</p>
          <div className="mt-4 grid grid-cols-1 gap-1">
            {category.items.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group -m-3 flex items-start gap-4 rounded-lg p-3 transition-all duration-200 hover:bg-secondary"
              >
                {item.icon && (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-accent group-hover:text-accent-foreground">
                    <item.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-foreground transition-colors group-hover:text-primary">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MegaMenuItem = ({ title, parentHref, categories }: { title: string; parentHref: string; categories: MegaMenuCategory[] }) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" className="px-2 group">
                  <Link href={parentHref} className="text-sm font-medium text-foreground hover:text-primary">{title}</Link>
                  <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180 ml-1" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                sideOffset={20}
                className="w-screen max-w-none rounded-none border-x-0 border-b-0 p-0 top-full animate-in fade-in-0 slide-in-from-top-4 duration-300"
            >
                <MegaMenuContent categories={categories} parentHref={parentHref}/>
            </PopoverContent>
        </Popover>
    );
};


export function Header() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch site settings on component mount
  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const settings = await settingsService.getSiteSettings();
        setSiteSettings(settings);
      } catch (error) {
        console.error('Failed to fetch site settings:', error);
        // Fallback to default values
        setSiteSettings({
          companyName: "Aluplan Program Sistemleri",
          logoUrl: "https://placehold.co/140x40/f7f7f7/1a1a1a?text=Logo",
          logoDarkUrl: "https://placehold.co/140x40/171717/f0f0f0?text=Logo",
          contact: {
            address: "",
            phone: "",
            email: ""
          },
          socialMedia: {},
          seo: {
            defaultTitle: "Aluplan",
            defaultDescription: "Aluplan Digital Solutions"
          }
        });
      }
    };

    fetchSiteSettings();
  }, []);

  const navItems: MenuItem[] = menus.find(m => m.id === 'main-nav')?.items || [];
  
  const renderNavItems = (items: MenuItem[]) => {
      return items.filter(item => item.parentId === null).map(item => {
        if (item.behavior === 'mega' && item.megaMenuCategories) {
          return (
            <MegaMenuItem 
              key={item.id} 
              title={item.title} 
              parentHref={item.href} 
              categories={item.megaMenuCategories} 
            />
          );
        }
        return (
          <Button asChild variant="ghost" key={item.id}>
            <Link href={item.href} className="text-sm font-medium text-foreground hover:text-primary">
              {item.title}
            </Link>
          </Button>
        );
      });
  };

  const renderMobileNavItems = (items: MenuItem[]) => {
      const topLevelItems = items.filter(item => item.parentId === null);
      
      const renderAccordionItems = topLevelItems.map(item => {
          const children = items.filter(child => child.parentId === item.id);
          const hasMegaMenu = item.behavior === 'mega' && item.megaMenuCategories && item.megaMenuCategories.length > 0;
          
          if (!hasMegaMenu && children.length === 0) {
             return (
                 <SheetClose asChild key={item.id}>
                    <Link href={item.href} className="block rounded-lg py-3 px-4 text-base font-medium text-foreground hover:bg-secondary hover:text-primary">{item.title}</Link>
                </SheetClose>
             )
          }

          return (
              <AccordionItem value={item.id} key={item.id}>
                <AccordionTrigger className="hover:no-underline font-semibold text-foreground py-3 px-4">
                    <Link href={item.href} className="flex-1 text-left">{item.title}</Link>
                </AccordionTrigger>
                <AccordionContent className="pl-8 pb-0">
                    <SheetClose asChild>
                        <Link href={item.href} className="flex items-center gap-2 rounded-lg py-2 text-base font-semibold text-primary hover:bg-secondary">
                            Genel Bakış <ArrowRight className="h-4 w-4"/>
                        </Link>
                    </SheetClose>
                    {(item.megaMenuCategories || []).flatMap(c => c.items).map(subItem => (
                        <SheetClose asChild key={subItem.title}>
                            <Link href={subItem.href} className="block rounded-lg py-2 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-primary">{subItem.title}</Link>
                        </SheetClose>
                    ))}
                    {children.map(childItem => (
                        <SheetClose asChild key={childItem.id}>
                             <Link href={childItem.href} className="block rounded-lg py-2 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-primary">{childItem.title}</Link>
                        </SheetClose>
                    ))}
                </AccordionContent>
            </AccordionItem>
          )
      });
      
      const regularLinks = topLevelItems.filter(item => item.behavior === 'link' && !items.some(child => child.parentId === item.id));

      return (
        <>
            <Accordion type="multiple" className="w-full px-4">
                {renderAccordionItems.filter(item => (item.props as any).value)}
            </Accordion>
             <div className="pt-4 mt-4 border-t px-4">
                {regularLinks.map((link) => (
                    <SheetClose asChild key={link.id}>
                        <Link href={link.href} className="block rounded-lg py-2 text-base font-medium text-foreground hover:bg-secondary hover:text-primary">{link.title}</Link>
                    </SheetClose>
                ))}
            </div>
        </>
      )
  };

  // Get logo URL based on theme
  const getDynamicLogoUrl = (isDarkMode: boolean = false): string => {
    if (!siteSettings) return isDarkMode 
      ? 'https://placehold.co/140x40/171717/f0f0f0?text=Logo' 
      : 'https://placehold.co/140x40/f7f7f7/1a1a1a?text=Logo';
    
    try {
      // For media files, we need to construct the URL
      // Check if the logo URL looks like a media file ID
      const logoUrl = isDarkMode ? siteSettings.logoDarkUrl : siteSettings.logoUrl;
      
      if (logoUrl) {
        // If it's already a full URL, return it
        if (typeof logoUrl === 'string' && (logoUrl.startsWith('http://') || logoUrl.startsWith('https://'))) {
          return logoUrl;
        }
        // If it looks like a media file ID (contains a dot for extension), construct the URL
        if (typeof logoUrl === 'string' && logoUrl.includes('.')) {
          return `http://localhost:9005/uploads/${logoUrl}`;
        }
        // Otherwise, return as is (might be a relative path or full URL)
        return logoUrl;
      }
      
      // Default placeholder
      return isDarkMode 
        ? 'https://placehold.co/140x40/171717/f0f0f0?text=Logo' 
        : 'https://placehold.co/140x40/f7f7f7/1a1a1a?text=Logo';
    } catch (error) {
      console.error('Error getting logo URL:', error);
      // Return fallback placeholder
      return isDarkMode 
        ? 'https://placehold.co/140x40/171717/f0f0f0?text=Logo' 
        : 'https://placehold.co/140x40/f7f7f7/1a1a1a?text=Logo';
    }
  };

  if (!siteSettings) {
    // Show a loading state or placeholder while fetching settings
    return (
      <div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm', isScrolled ? 'shadow-md' : '')}>
      {/* Top Bar 1 */}
      <div className="bg-secondary/50 text-secondary-foreground border-b border-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-3">
                      {Object.entries(siteSettings.socialMedia || {}).map(([platform, url]) => {
                          if (!url) return null;
                          const Icon = getPlatformIcon(platform);
                          return (
                               <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                <Icon className="h-4 w-4" />
                            </a>
                          )
                      })}
                  </div>
                  <div className="hidden sm:block w-px h-4 bg-border"></div>
                  <a href={`mailto:${siteSettings.contact.email}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                      <Mail className="h-4 w-4" />
                      <span className="hidden md:inline">{siteSettings.contact.email}</span>
                  </a>
              </div>
              <div className="flex items-center gap-4 font-medium">
                  <Link href="/admin/login" className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <UserCog className="h-4 w-4" /> Admin Girişi
                  </Link>
                  <div className="w-px h-4 bg-border"></div>
                   <Link href="/portal/login" className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <User className="h-4 w-4" /> Kullanıcı Portalı
                  </Link>
                  <div className="w-px h-4 bg-border"></div>
                  <ThemeToggle />
              </div>
          </div>
      </div>

      {/* Top Bar 2 */}
      <div className="hidden lg:block bg-background border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex items-center gap-2">
                    {topBarLinks.map(link => (
                        <Button key={link.text} variant="outline" size="sm" asChild className="h-8 border-dashed shadow-sm hover:shadow-md transition-shadow">
                            <Link href={link.href}>{link.text}</Link>
                        </Button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="h-1.5" />
            </ScrollArea>
          </div>
      </div>
      
      <header>
        <div className="container mx-auto flex h-28 items-center justify-between px-4 sm:px-6 lg:px-8 py-2">
           <Link href="/" className="flex items-center gap-2 font-semibold">
                <span className="sr-only">{siteSettings.companyName}</span>
                <Image
                    className="dark:hidden"
                    src={getDynamicLogoUrl(false) || 'https://placehold.co/140x40/f7f7f7/1a1a1a?text=Logo'}
                    alt={`${siteSettings.companyName} Logo`}
                    width={200}
                    height={60}
                    priority
                />
                <Image
                    className="hidden dark:block"
                    src={getDynamicLogoUrl(true) || 'https://placehold.co/140x40/171717/f0f0f0?text=Logo'}
                    alt={`${siteSettings.companyName} Logo`}
                    width={200}
                    height={60}
                    priority
                />
            </Link>
          <nav className="hidden items-center gap-x-2 lg:flex">
             {renderNavItems(navItems)}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <Button variant="ghost" asChild><Link href="/contact">İletişim</Link></Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Demo İste</Button>
          </div>
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Menüyü aç</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs p-0 flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b">
                      <Link href="/" className="text-xl font-bold text-primary">
                        <Image
                          src={getDynamicLogoUrl(false) || 'https://placehold.co/140x40/f7f7f7/1a1a1a?text=Logo'}
                          alt={`${siteSettings.companyName} Logo`}
                          width={160}
                          height={45}
                          priority
                        />
                      </Link>
                      <SheetClose asChild>
                          <Button variant="ghost" size="icon">
                              <X className="h-6 w-6" />
                              <span className="sr-only">Menüyü kapat</span>
                          </Button>
                      </SheetClose>
                  </div>
                  <ScrollArea className="flex-1">
                      <div className="p-4 space-y-2">
                            {topBarLinks.map(link => (
                                <SheetClose asChild key={link.text}>
                                    <Link href={link.href} className="block rounded-lg py-2 pl-2 pr-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-primary">{link.text}</Link>
                                </SheetClose>
                            ))}
                        </div>
                      {renderMobileNavItems(navItems)}
                  </ScrollArea>
                   <div className="p-4 border-t mt-auto space-y-2">
                        <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Demo İste</Button>
                        <Button variant="outline" className="w-full">İletişim</Button>
                  </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </div>
  );
}

    

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, Phone, Mail, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ThemeSettingsService, type TopBarLink, type ThemeSettings } from '@/services/theme-settings.service';
import { cmsMenuService } from '@/lib/cms/menu-service';
import type { CmsMenu } from '@affexai/shared-types';
import { mediaService } from '@/lib/api/mediaService';

export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Site settings state (existing)
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('ALLPLAN TÜRKİYE');
  const [companyPhone, setCompanyPhone] = useState<string>('');
  const [companyEmail, setCompanyEmail] = useState<string>('');
  const [companyAddress, setCompanyAddress] = useState<string>('');

  // Fetch theme settings
  const { data: themeSettings, isLoading: isLoadingTheme } = useQuery<ThemeSettings>({
    queryKey: ['theme-settings-active'],
    queryFn: () => ThemeSettingsService.getActiveTheme(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch header menu if headerMenuId exists
  const { data: headerMenu, isError: isMenuError, isLoading: isMenuLoading } = useQuery<CmsMenu>({
    queryKey: ['header-menu', themeSettings?.headerMenuId],
    queryFn: () => cmsMenuService.getMenu(themeSettings!.headerMenuId!),
    enabled: !!themeSettings?.headerMenuId,
    staleTime: 30 * 1000, // Cache for 30 seconds (shorter for CMS changes)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 2,
  });

  // Extract theme data with defaults
  const topBarLinks = themeSettings?.headerConfig?.topBarLinks || [];
  const ctaButtons = themeSettings?.headerConfig?.ctaButtons || {
    contact: { show: true, text: 'İletişim', href: '/contact' },
    demo: { show: true, text: 'Demo İste', href: '#demo' },
  };
  const authLinks = themeSettings?.headerConfig?.authLinks || {
    showLogin: true,
    showSignup: true,
    loginText: 'Giriş Yap',
    signupText: 'Kayıt Ol',
  };
  const layout = themeSettings?.headerConfig?.layout || {
    sticky: true,
    transparent: false,
    shadow: true,
  };

  // Fetch site settings (existing logic - logo, company info)
  useEffect(() => {
    async function fetchSiteSettings() {
      try {
        // Ensure API URL has /api suffix
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006';
        const baseUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
        const response = await fetch(`${baseUrl}/settings/site`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          const settings = result.data;

          // Convert logo UUID to full URL
          if (settings.logoUrl) {
            const fullLogoUrl = await mediaService.getMediaUrl(settings.logoUrl);
            setLogoUrl(fullLogoUrl);
          }

          // Set company info
          if (settings.companyName) {
            setCompanyName(settings.companyName);
          }
          if (settings.contact?.phone) {
            setCompanyPhone(settings.contact.phone);
          }
          if (settings.contact?.email) {
            setCompanyEmail(settings.contact.email);
          }
          if (settings.contact?.address) {
            setCompanyAddress(settings.contact.address);
          }
        }
      } catch (error) {
        console.error('Failed to fetch site settings:', error);
      }
    }

    fetchSiteSettings();
  }, []);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  // Use header menu if available - NO fallback to hardcoded data
  const navigationItems = React.useMemo(() => {
    if (headerMenu?.items && Array.isArray(headerMenu.items) && headerMenu.items.length > 0) {
      return headerMenu.items
        .filter(item => item && item.label && item.isActive)
        .map(item => ({
          id: item.id,
          label: item.label,
          href: item.url || '#',
          submenu: item.children && Array.isArray(item.children)
            ? item.children
                .filter(child => child && child.label && child.isActive)
                .map(child => ({
                  id: child.id,
                  label: child.label,
                  href: child.url || '#',
                  // 3rd level support
                  submenu: child.children && Array.isArray(child.children)
                    ? child.children
                        .filter(grandchild => grandchild && grandchild.label && grandchild.isActive)
                        .map(grandchild => ({
                          id: grandchild.id,
                          label: grandchild.label,
                          href: grandchild.url || '#',
                        }))
                    : undefined,
                }))
            : undefined,
        }));
    }
    // Return empty array - no hardcoded fallback
    return [];
  }, [headerMenu]);

  // Check if menu is unavailable (error or no data after loading)
  const isMenuUnavailable = isMenuError || (!isMenuLoading && !isLoadingTheme && navigationItems.length === 0);

  return (
    <header className={cn(
      "w-full bg-white border-b",
      layout.sticky && "sticky top-0 z-50",
      layout.shadow && "shadow-sm"
    )}>
      {/* Top Bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-10 text-sm">
            {/* Top Bar Links */}
            <div className="hidden lg:flex items-center space-x-6">
              {topBarLinks
                .sort((a, b) => a.order - b.order)
                .map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="text-gray-600 hover:text-primary transition-colors"
                  >
                    {link.text}
                  </Link>
                ))}
            </div>

            {/* Contact Info */}
            <div className="hidden md:flex items-center space-x-4 text-gray-600">
              {companyPhone && (
                <a href={`tel:${companyPhone}`} className="flex items-center space-x-1 hover:text-primary">
                  <Phone className="h-3 w-3" />
                  <span>{companyPhone}</span>
                </a>
              )}
              {companyEmail && (
                <a href={`mailto:${companyEmail}`} className="flex items-center space-x-1 hover:text-primary">
                  <Mail className="h-3 w-3" />
                  <span>{companyEmail}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={companyName}
                width={180}
                height={60}
                className="h-12 w-auto object-contain"
                priority
              />
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{companyName}</span>
              </div>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {/* Show warning if menu is unavailable */}
            {isMenuUnavailable && (
              <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Menü yüklenemedi</span>
              </div>
            )}
            {/* Show loading state */}
            {(isMenuLoading || isLoadingTheme) && !isMenuUnavailable && (
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <div className="h-4 w-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                <span>Yükleniyor...</span>
              </div>
            )}
            {navigationItems.map((item) => {
              const hasSubmenu = item.submenu && (item.submenu?.length ?? 0) > 0;
              const hasMegaMenu = hasSubmenu && item.submenu?.some(sub => sub.submenu && sub.submenu.length > 0);

              return (
                <div key={item.id || item.label} className="relative group">
                  {hasSubmenu ? (
                    <>
                      <button
                        className={cn(
                          "flex items-center space-x-1 text-gray-700 hover:text-primary transition-colors py-2",
                          pathname.startsWith(item.href) && "text-primary font-medium"
                        )}
                      >
                        <span>{item.label}</span>
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      {/* Mega Menu for 3+ levels - Full Width Below Header */}
                      {hasMegaMenu ? (
                        <div className="fixed left-0 right-0 top-[var(--header-height,140px)] w-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                          {/* Full-width backdrop with shadow */}
                          <div className="bg-white border-t border-gray-200 shadow-xl">
                            <div className="container mx-auto px-4 py-8 max-w-7xl">
                              {/* Dynamic grid based on number of columns */}
                              <div className={cn(
                                "grid gap-6",
                                (item.submenu?.length ?? 0) === 1 && "grid-cols-1 max-w-sm mx-auto",
                                (item.submenu?.length ?? 0) === 2 && "grid-cols-2 max-w-3xl mx-auto",
                                (item.submenu?.length ?? 0) === 3 && "grid-cols-3 max-w-5xl mx-auto",
                                (item.submenu?.length ?? 0) === 4 && "grid-cols-4",
                                (item.submenu?.length ?? 0) >= 5 && "grid-cols-5"
                              )}>
                                {item.submenu?.map((subItem) => (
                                  <div
                                    key={subItem.id || subItem.label}
                                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                                  >
                                    {/* Main category link */}
                                    <Link
                                      href={subItem.href}
                                      className="block font-bold text-gray-900 hover:text-primary transition-colors mb-3 text-base"
                                    >
                                      {subItem.label}
                                    </Link>

                                    {/* Sub-items in boxed list */}
                                    {subItem.submenu && subItem.submenu.length > 0 && (
                                      <div className="space-y-1.5">
                                        {subItem.submenu.map((thirdLevelItem) => (
                                          <Link
                                            key={thirdLevelItem.id || thirdLevelItem.label}
                                            href={thirdLevelItem.href}
                                            className="block text-sm text-gray-600 hover:text-primary hover:bg-white px-3 py-2 rounded-md transition-all group/item"
                                          >
                                            <span className="group-hover/item:translate-x-1 inline-block transition-transform">
                                              {thirdLevelItem.label}
                                            </span>
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Regular dropdown for simple 2-level menus */
                        <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          <div className="py-2">
                            {item.submenu?.map((subItem) => (
                              <Link
                                key={subItem.id || subItem.label}
                                href={subItem.href}
                                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "text-gray-700 hover:text-primary transition-colors",
                        pathname === item.href && "text-primary font-medium"
                      )}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {ctaButtons.contact?.show && (
              <Link
                href={ctaButtons.contact.href}
                className="px-4 py-2 text-gray-700 hover:text-primary transition-colors"
              >
                {ctaButtons.contact.text}
              </Link>
            )}
            {ctaButtons.demo?.show && (
              <Link
                href={ctaButtons.demo.href}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                {ctaButtons.demo.text}
              </Link>
            )}
            {authLinks.showLogin && (
              <Link
                href={authLinks.loginUrl || '/login'}
                className="px-4 py-2 text-gray-700 hover:text-primary transition-colors"
              >
                {authLinks.loginText}
              </Link>
            )}
            {authLinks.showSignup && (
              <Link
                href={authLinks.signupUrl || '/signup'}
                className="px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
              >
                {authLinks.signupText}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-primary transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white max-h-[calc(100vh-180px)] overflow-y-auto">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {/* Show warning if menu is unavailable */}
            {isMenuUnavailable && (
              <div className="flex items-center justify-center space-x-2 text-amber-600 bg-amber-50 px-4 py-3 rounded-lg text-sm mb-4">
                <AlertTriangle className="h-5 w-5" />
                <span>Menü yüklenemedi. Lütfen daha sonra tekrar deneyin.</span>
              </div>
            )}
            {/* Show loading state */}
            {(isMenuLoading || isLoadingTheme) && !isMenuUnavailable && (
              <div className="flex items-center justify-center space-x-2 text-gray-400 py-4">
                <div className="h-5 w-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                <span>Menü yükleniyor...</span>
              </div>
            )}
            {/* Mobile Navigation */}
            {navigationItems.map((item) => (
              <div key={item.id || item.label} className="border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                {item.submenu ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.label)}
                      className="flex items-center justify-between w-full text-gray-900 font-medium hover:text-primary transition-colors py-3 px-2 rounded-lg hover:bg-gray-50"
                    >
                      <span className="text-base">{item.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 transition-transform duration-200",
                          openSubmenu === item.label && "rotate-180"
                        )}
                      />
                    </button>
                    {openSubmenu === item.label && (
                      <div className="mt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        {item.submenu?.map((subItem) => (
                          <div key={subItem.id || subItem.label} className="bg-gray-50 rounded-lg p-3">
                            <Link
                              href={subItem.href}
                              className="block text-gray-900 font-semibold hover:text-primary transition-colors mb-2 text-sm"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {subItem.label}
                            </Link>
                            {/* 3rd level items - Boxed style like desktop */}
                            {subItem.submenu && subItem.submenu.length > 0 && (
                              <div className="space-y-1 pl-2 border-l-2 border-primary/20">
                                {subItem.submenu.map((thirdLevelItem) => (
                                  <Link
                                    key={thirdLevelItem.id || thirdLevelItem.label}
                                    href={thirdLevelItem.href}
                                    className="block text-sm text-gray-600 hover:text-primary hover:bg-white transition-all py-2 px-3 rounded-md"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                  >
                                    {thirdLevelItem.label}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className="block text-gray-900 font-medium hover:text-primary transition-colors py-3 px-2 rounded-lg hover:bg-gray-50 text-base"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}


            {/* Mobile CTA Buttons */}
            <div className="pt-4 border-t border-gray-200 space-y-2">
              {ctaButtons.contact?.show && (
                <Link
                  href={ctaButtons.contact.href}
                  className="block w-full px-4 py-2 text-center text-gray-700 hover:text-primary transition-colors border border-gray-300 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {ctaButtons.contact.text}
                </Link>
              )}
              {ctaButtons.demo?.show && (
                <Link
                  href={ctaButtons.demo.href}
                  className="block w-full px-4 py-2 text-center bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {ctaButtons.demo.text}
                </Link>
              )}
              {authLinks.showLogin && (
                <Link
                  href={authLinks.loginUrl || '/login'}
                  className="block w-full px-4 py-2 text-center text-gray-700 hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {authLinks.loginText}
                </Link>
              )}
              {authLinks.showSignup && (
                <Link
                  href={authLinks.signupUrl || '/signup'}
                  className="block w-full px-4 py-2 text-center border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {authLinks.signupText}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

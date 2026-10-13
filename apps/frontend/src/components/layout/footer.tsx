"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { getPlatformIcon } from "@/lib/social-media-data";
import settingsService, { type SiteSettings } from "@/lib/api/settingsService";
import { mediaService } from "@/lib/api/mediaService";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ThemeSettingsService,
  type ThemeSettings,
} from "@/services/theme-settings.service";
import { getPublicCopy } from "@/lib/i18n/public-copy";

/** Shown when the site settings are unavailable; never a sample tenant's brand. */
const FALLBACK_COMPANY_NAME = "AffeXAI";

export function Footer() {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  // Fetch theme settings
  const { data: themeSettings, isLoading: isLoadingTheme } =
    useQuery<ThemeSettings>({
      queryKey: ["theme-settings-active"],
      queryFn: () => ThemeSettingsService.getActiveTheme(),
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnWindowFocus: false,
    });

  // Extract footer data with defaults
  const footerSections = themeSettings?.footerConfig?.sections || [
    {
      title: "Keşfet",
      customLinks: [
        { name: "Modüller", href: "/modules", order: 1 },
        { name: "Mimari", href: "/architecture", order: 2 },
        { name: "Erken erişim", href: "/pricing", order: 3 },
      ],
    },
    {
      title: "Destek",
      customLinks: [
        { name: "Yardım merkezi", href: "/help", order: 1 },
        { name: "Destek", href: "/support", order: 2 },
        { name: "İletişim", href: "/contact", order: 3 },
      ],
    },
    {
      title: "Yasal",
      customLinks: [
        { name: "Gizlilik Politikası", href: "/privacy", order: 1 },
        { name: "Kullanım Koşulları", href: "/terms", order: 2 },
      ],
    },
  ];

  const showLanguageSelector =
    themeSettings?.footerConfig?.showLanguageSelector ?? true;
  const languageText =
    themeSettings?.footerConfig?.languageText || "Türkiye (Türkçe)";
  const copyrightText =
    themeSettings?.footerConfig?.copyrightText || "Tüm hakları saklıdır.";

  // Fetch site settings (existing logic)
  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const settings = await settingsService.getSiteSettings();

        // Convert logo UUIDs to full URLs
        const [logoFullUrl, logoDarkFullUrl] = await Promise.all([
          mediaService.getMediaUrl(settings.logoUrl),
          mediaService.getMediaUrl(settings.logoDarkUrl),
        ]);

        setSiteSettings({
          ...settings,
          logoUrl: logoFullUrl,
          logoDarkUrl: logoDarkFullUrl,
        });
      } catch (error) {
        console.error("Failed to fetch site settings:", error);
        // Fallback to default values
        setSiteSettings({
          companyName: FALLBACK_COMPANY_NAME,
          logoUrl: "",
          logoDarkUrl: "",
          contact: {
            address: "",
            phone: "",
            email: "",
          },
          socialMedia: {},
          seo: {
            defaultTitle: FALLBACK_COMPANY_NAME,
            defaultDescription: getPublicCopy().footer.tagline,
          },
        });
      }
    };

    fetchSiteSettings();
  }, []);

  if (!siteSettings) {
    // Show a loading state or placeholder while fetching settings
    return (
      <footer className="bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-4">
              <div className="h-8 w-48 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="flex space-x-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Company Info & Social */}
          <div className="space-y-4">
            <Link href="/" className="text-2xl font-bold text-primary">
              {siteSettings.companyName}
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              {siteSettings.seo.defaultDescription}
            </p>
            <div className="flex space-x-4">
              {Object.entries(siteSettings.socialMedia).map(
                ([platform, url]) => {
                  if (!url) return null;
                  const Icon = getPlatformIcon(platform);
                  return (
                    <a
                      key={platform}
                      href={url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Icon className="h-6 w-6" />
                      <span className="sr-only">{platform}</span>
                    </a>
                  );
                },
              )}
            </div>
          </div>

          {/* Footer Navigation Sections */}
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold tracking-wider uppercase">
                  {section.title}
                </h3>
                <ul role="list" className="mt-4 space-y-2">
                  {[...(section.customLinks ?? [])]
                    .sort((a, b) => a.order - b.order)
                    .map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground order-2 sm:order-1">
            &copy; {new Date().getFullYear()} {siteSettings.companyName}.{" "}
            {copyrightText}
          </p>
          {showLanguageSelector && (
            <div className="flex items-center space-x-2 order-1 sm:order-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {languageText}
              </span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

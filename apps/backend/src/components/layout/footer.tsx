'use client';

import Link from 'next/link';
import { Globe } from 'lucide-react';
import { getPlatformIcon } from '@/lib/social-media-data';
import settingsService, { type SiteSettings } from '@/lib/api/settingsService';
import { useEffect, useState } from 'react';

const footerNav = {
  explore: [
    { name: 'Çözümler', href: '/solutions' },
    { name: 'Ürünler', href: '/products' },
    { name: 'Başarı Hikayeleri', href: '/case-studies' },
  ],
  support: [
    { name: 'Eğitim & Destek', href: '/education' },
    { name: 'İndirme Merkezi', href: '/downloads' },
    { name: 'İletişim', href: '/contact' },
  ],
  legal: [
      { name: 'Gizlilik Politikası', href: '/privacy'},
      { name: 'Kullanım Koşulları', href: '/terms'},
  ]
};

export function Footer() {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

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
                  <div key={i} className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
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
          <div className="space-y-4">
            <Link href="/" className="text-2xl font-bold text-primary">
              {siteSettings.companyName}
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              {siteSettings.seo.defaultDescription}
            </p>
             <div className="flex space-x-4">
                {Object.entries(siteSettings.socialMedia).map(([platform, url]) => {
                  if (!url) return null;
                  const Icon = getPlatformIcon(platform);
                  return (
                    <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Icon className="h-6 w-6"/>
                        <span className="sr-only">{platform}</span>
                    </a>
                  )
                })}
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold tracking-wider uppercase">
                  Keşfet
                </h3>
                <ul role="list" className="mt-4 space-y-2">
                  {footerNav.explore.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold tracking-wider uppercase">
                  Destek
                </h3>
                <ul role="list" className="mt-4 space-y-2">
                  {footerNav.support.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-1 md:gap-8">
                <div>
                    <h3 className="text-sm font-semibold tracking-wider uppercase">Yasal</h3>
                    <ul role="list" className="mt-4 space-y-2">
                       {footerNav.legal.map((item) => (
                        <li key={item.name}>
                          <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground order-2 sm:order-1">&copy; {new Date().getFullYear()} {siteSettings.companyName}. Tüm hakları saklıdır.</p>
          <div className="flex items-center space-x-2 order-1 sm:order-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Türkiye (Türkçe)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
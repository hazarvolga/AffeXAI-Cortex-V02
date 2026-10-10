'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { FileText, Palette, Image, Package, ArrowRight, Box, Layers, Star } from 'lucide-react';
import { AnalyticsCards } from '@/components/cms/analytics-cards';

const DASHBOARD_CARDS = [
  {
    title: 'Sayfa Yönetimi',
    description: 'CMS sayfalarını oluşturun, düzenleyin ve yayınlayın.',
    href: '/admin/cms/pages',
    icon: FileText,
    buttonText: 'Sayfaları Yönet',
  },
  {
    title: 'Görsel Editör',
    description: 'Görsel arayüz üzerinden sayfalarınızı oluşturun ve düzenleyin.',
    href: '/admin/cms/editor',
    icon: Palette,
    buttonText: 'Editörü Aç',
  },
  {
    title: 'Yeniden Kullanılabilir Bileşenler',
    description: 'Tekrar kullanılabilir UI bileşenlerini yönetin.',
    href: '/admin/cms/reusable-components',
    icon: Box,
    buttonText: 'Bileşenleri Yönet',
  },
  {
    title: 'Yeniden Kullanılabilir Section\'lar',
    description: 'Birden fazla bileşenden oluşan section\'ları yönetin.',
    href: '/admin/cms/reusable-sections',
    icon: Layers,
    buttonText: 'Section\'ları Yönet',
  },
  {
    title: 'Favorilerim',
    description: 'Favori bileşenler ve section\'larınıza hızlı erişim.',
    href: '/admin/cms/favorites',
    icon: Star,
    buttonText: 'Favorileri Görüntüle',
  },
  {
    title: 'Medya Yönetimi',
    description: 'Medya dosyalarınızı yükleyin ve yönetin.',
    href: '/admin/cms/media',
    icon: Image,
    buttonText: 'Medya Kitaplığı',
  },
  {
    title: 'İçerik Bileşenleri',
    description: 'Kullanılabilir içerik bileşenlerini görüntüleyin.',
    href: '/admin/cms/components',
    icon: Package,
    buttonText: 'Bileşenleri Görüntüle',
  },
] as const;

const QUICK_START_STEPS = [
  {
    step: '1',
    title: 'Yeni Sayfa Oluştur',
    description: 'Sayfa yönetimi bölümünden yeni bir sayfa oluşturun.',
  },
  {
    step: '2',
    title: 'Görsel Editörü Kullan',
    description: 'Sürükle-bırak arayüzü ile sayfanızı tasarlayın.',
  },
  {
    step: '3',
    title: 'Yayınla',
    description: 'Sayfanızı yayınlayarak ziyaretçilerinize gösterin.',
  },
] as const;

const CmsDashboardPage = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CMS Yönetim Paneli</h1>
        <p className="text-muted-foreground mt-2">İçerik yönetim sistemini yönetin</p>
      </div>

      {/* Analytics Section */}
      <AnalyticsCards />

      {/* Main Actions Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {DASHBOARD_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.href} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <CardTitle className="mt-4">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={card.href}>
                    {card.buttonText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Hızlı Başlangıç</CardTitle>
          <CardDescription>CMS ile çalışmaya başlamak için adımları izleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            {QUICK_START_STEPS.map((item) => (
              <div key={item.step} className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground ml-11">{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CmsDashboardPage;

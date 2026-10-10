'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, Palette, Image, Package, ArrowRight, Box, Layers, Star, PlayCircle, PlusCircle, Search } from 'lucide-react';
import { AnalyticsCards } from '@/components/cms/analytics-cards';
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { AiCoPilot } from '@/components/brand/ai/AiCoPilot';

import { BccHudTile } from "@/components/brand/BccHudTile";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";

const CmsDashboardPage = () => {
  const params = useParams();
  const tenant = params?.tenant as string || 'default';

  const DASHBOARD_CARDS = [
    {
      title: 'Sayfa Yönetimi',
      subtitle: 'Page_RegistryNode',
      description: 'CMS sayfalarını oluşturun, düzenleyin ve yayınlayın.',
      href: `/${tenant}/admin/cms/pages`,
      icon: FileText,
      buttonText: 'Sayfaları Yönet',
      status: 'Active'
    },
    {
      title: 'Görsel Editör',
      subtitle: 'Visual_NexusNode',
      description: 'Görsel arayüz üzerinden sayfalarınızı oluşturun ve düzenleyin.',
      href: `/${tenant}/admin/cms/editor`,
      icon: Palette,
      buttonText: 'Editörü Aç',
      status: 'Ready'
    },
    {
      title: 'Yeniden Kullanılabilir Bileşenler',
      subtitle: 'Atomic_ComponentNode',
      description: 'Tekrar kullanılabilir UI bileşenlerini yönetin.',
      href: `/${tenant}/admin/cms/reusable-components`,
      icon: Box,
      buttonText: 'Bileşenleri Yönet',
      status: 'Sync'
    },
    {
      title: 'Yeniden Kullanılabilir Section\'lar',
      subtitle: 'Layout_ClusterNode',
      description: 'Birden fazla bileşenden oluşan section\'ları yönetin.',
      href: `/${tenant}/admin/cms/reusable-sections`,
      icon: Layers,
      buttonText: 'Section\'ları Yönet',
      status: 'Online'
    },
    {
      title: 'Favorilerim',
      subtitle: 'Priority_NodeSet',
      description: 'Favori bileşenler ve section\'larınıza hızlı erişim.',
      href: `/${tenant}/admin/cms/favorites`,
      icon: Star,
      buttonText: 'Favorileri Görüntüle',
      status: 'Saved'
    },
    {
      title: 'Medya Yönetimi',
      subtitle: 'Asset_StorageNode',
      description: 'Medya dosyalarınızı yükleyin ve yönetin.',
      href: `/${tenant}/admin/cms/media`,
      icon: Image,
      buttonText: 'Medya Kitaplığı',
      status: 'Live'
    },
  ] as const;

  const QUICK_START_STEPS = [
    {
      step: '01',
      title: 'Yeni Sayfa Oluştur',
      description: 'Deploy new page node into the registry.',
    },
    {
      step: '02',
      title: 'Görsel Editörü Kullan',
      description: 'Calibrate design via Visual Nexus.',
      href: `/${tenant}/admin/cms/editor`,
    },
    {
      step: '03',
      title: 'Yayınla',
      description: 'Propagate content to production frequencies.',
    },
  ] as const;

  return (
    <BccEditorialWrapper
      headerTitle="Content Infrastructure"
      headerSubtitle={`Orchestrating digital experiences for tenant: ${tenant.toUpperCase()}`}
      headerBadge="Registry_Live"
      headerAction={<AiCoPilot context="content_strategy" variant="inline" />}
      telemetryData={[
        { label: "Active Pages", value: "24", color: "#9df425" },
        { label: "Sync Index", value: "98.2", suffix: "%", color: "#ff8c00" }
      ]}
    >
      <div className="space-y-12 animate-in fade-in duration-1000">
        {/* Module Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center space-x-4">
            <Button
              asChild
              variant="outline"
              className="bg-white/5 border-white/10 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-[#ff8c00] hover:text-black transition-all h-10 px-6"
            >
              <Link href={`/${tenant}/admin/cms/pages/new`}>
                <PlusCircle className="mr-2 h-3.5 w-3.5" />
                Deploy New Node
              </Link>
            </Button>
            <Button
              asChild
              className="bg-[#ff8c00] text-black rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-[#ff8c00]/80 transition-all h-10 px-6"
            >
              <Link href={`/${tenant}/admin/cms/editor`}>
                <PlayCircle className="mr-2 h-3.5 w-3.5" />
                Execute Visual Nexus
              </Link>
            </Button>
          </div>

          <div className="relative w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20 group-hover:text-[#ff8c00] transition-colors" />
            <Input
              placeholder="NODE SEARCH..."
              className="bg-white/5 border-white/10 rounded-none h-10 pl-9 text-[10px] uppercase tracking-widest focus-visible:ring-1 focus-visible:ring-[#ff8c00] transition-all"
            />
          </div>
        </div>

        {/* Analytics Section */}
        <BccHudTile title="Content Telemetry" subtitle="Real-time engagement tracking" className="col-span-full">
          <AnalyticsCards />
        </BccHudTile>

        {/* Core Registry Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DASHBOARD_CARDS.map((card) => {
            return (
              <BccHudTile
                key={card.href}
                title={card.title}
                subtitle={card.subtitle}
                className="group"
              >
                <div className="space-y-4">
                  <p className="text-white/60 text-[11px] leading-relaxed min-h-[40px]">
                    {card.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#9df425] animate-pulse"></div>
                      <span className="text-[9px] font-mono uppercase text-white/40">{card.status}</span>
                    </div>
                    <Button asChild variant="ghost" className="h-8 rounded-none border border-white/5 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 hover:text-white transition-all">
                      <Link href={card.href}>
                        {card.buttonText}
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </BccHudTile>
            );
          })}
        </div>

        {/* Deployment Workflow */}
        <BccHudTile title="Operational Flow" subtitle="Quick start deployment sequence">
          <div className="grid gap-12 sm:grid-cols-3 pt-4">
            {QUICK_START_STEPS.map((item) => (
              <div key={item.step} className="relative group">
                <div className="absolute -left-4 top-0 bottom-0 w-[1px] bg-white/5 group-hover:bg-amber-500/40 transition-colors"></div>
                <div className="space-y-3">
                  <div className="text-[24px] font-light tracking-tighter text-white/10 group-hover:text-amber-500/20 transition-colors font-mono">
                    {item.step}
                  </div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-white">{item.title}</h3>
                  <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-tighter italic">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </BccHudTile>
      </div>
    </BccEditorialWrapper>

  );
};

export default CmsDashboardPage;

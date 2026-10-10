'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings, Globe, User, Lock, Bell, Palette, Database, Shield, Activity, Cpu } from 'lucide-react';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { useParams } from 'next/navigation';

export default function AdminSettingsPage() {
  const tenant = String(useParams().tenant || '');
  const tenantAdminPath = (path: string) => `/${tenant}/admin${path}`;
  const settingsCategories = [
    {
      title: 'SITE_CONFIG',
      description: 'General platform settings, logos, and meta tags.',
      icon: Globe,
      href: tenantAdminPath('/settings/site'),
      active: true
    },
    {
      title: 'USER_PROFILE',
      description: 'Personal account metrics and preferences.',
      icon: User,
      href: tenantAdminPath('/profile'),
      active: true
    },
    {
      title: 'SECURITY_PROTOCOL',
      description: 'Authentication guards and password rotation.',
      icon: Lock,
      href: tenantAdminPath('/settings/security'),
      active: false,
      badge: 'LOCKED'
    },
    {
      title: 'NOTIFICATION_RELAY',
      description: 'Email gateways and push notification dispatch.',
      icon: Bell,
      href: tenantAdminPath('/settings/notifications'),
      active: false,
      badge: 'PENDING'
    },
    {
      title: 'VISUAL_SYSTEM',
      description: 'Theme engine and branding overrides.',
      icon: Palette,
      href: tenantAdminPath('/settings/design'),
      active: false,
      badge: 'BETA'
    },
    {
      title: 'DATA_VAULT',
      description: 'Backup protocols and restoration points.',
      icon: Database,
      href: tenantAdminPath('/settings/database'),
      active: false,
      badge: 'OFFLINE'
    },
  ];

  return (
    <BccEditorialWrapper
      headerTitle="SYSTEM_CORE"
      headerSubtitle="Tenant configuration and control surfaces."
      headerBadge="TENANT_ADMIN"
      telemetryData={[
        { label: "SCOPE", value: tenant || "UNKNOWN" },
        { label: "CONFIGURABLE", value: "2" },
        { label: "PLANNED", value: "4" }
      ]}
    >
      <div className="space-y-8">
        {/* System HUD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BccHudTile title="CONFIGURATION_SCOPE" subtitle="Authenticated tenant" icon={Activity as any}>
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">TENANT</div>
            <div className="text-[10px] uppercase tracking-widest text-[#9df425] mt-1">
              {tenant || 'SCOPE_UNAVAILABLE'}
            </div>
          </BccHudTile>

          <BccHudTile title="AVAILABLE_MODULES" subtitle="Current settings surfaces" icon={Shield as any}>
            <div className="text-3xl font-bold font-mono tracking-tighter text-[#9df425]">2 / 6</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
              FOUR_MODULES_PLANNED
            </div>
          </BccHudTile>

          <BccHudTile title="PERSISTENCE" subtitle="Settings source" icon={Cpu as any}>
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">API</div>
            <div className="text-[10px] uppercase tracking-widest text-[#ff8c00] mt-1">
              DATABASE_BACKED
            </div>
          </BccHudTile>
        </div>

        {/* Module Grid */}
        <div>
          <h2 className="text-sm font-mono uppercase tracking-widest text-white/40 mb-4 pl-1 border-l-2 border-[#9df425]">
            CONFIGURATION_MODULES
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {settingsCategories.map((category) => (
              <div
                key={category.href}
                className={`
                  group relative overflow-hidden border transition-all duration-300
                  ${category.active
                    ? 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#9df425]/30'
                    : 'border-white/5 bg-transparent opacity-60'}
                `}
              >
                {/* Active Indicator */}
                {category.active && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#9df425]/10 to-transparent -mr-8 -mt-8" />
                )}

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`
                      p-2 rounded-none border 
                      ${category.active ? 'border-[#9df425]/30 bg-[#9df425]/10 text-[#9df425]' : 'border-white/10 bg-white/5 text-white/40'}
                    `}>
                      <category.icon className="h-5 w-5" />
                    </div>
                    {category.badge && (
                      <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-1 bg-white/5 border border-white/10 text-white/40">
                        {category.badge}
                      </span>
                    )}
                  </div>

                  <h3 className={`text-sm font-bold font-mono uppercase tracking-wider mb-2 ${category.active ? 'text-white group-hover:text-[#9df425] transition-colors' : 'text-white/60'}`}>
                    {category.title}
                  </h3>
                  <p className="text-xs text-white/40 font-mono mb-6 line-clamp-2 h-8">
                    {category.description}
                  </p>

                  {category.active ? (
                    <Link href={category.href}>
                      <Button variant="outline" className="w-full text-[10px] uppercase tracking-widest font-mono border-white/10 hover:bg-[#9df425]/10 hover:text-[#9df425] hover:border-[#9df425]/50 h-8">
                        <Settings className="mr-2 h-3 w-3" />
                        ACCESS_MODULE
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled variant="ghost" className="w-full text-[10px] uppercase tracking-widest font-mono border border-white/5 text-white/20 h-8 cursor-not-allowed">
                      MODULE_LOCKED
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BccEditorialWrapper>
  );
}

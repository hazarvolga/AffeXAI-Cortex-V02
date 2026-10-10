"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BccHudTile } from "@/components/brand/BccHudTile";
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { AiCoPilot } from '@/components/brand/ai/AiCoPilot';
import { EmailModuleNav } from "@/components/admin/email/EmailModuleNav";

import { Button } from "@/components/ui/button";
import {
  Users,
  Send,
  PlusCircle,
  FileUp,
  Filter,
  Folder,
  LayoutTemplate,
  Zap,
  EyeOff
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import subscribersService from "@/lib/api/subscribersService";
import emailCampaignsService from "@/lib/api/emailCampaignsService";
import groupsService from "@/lib/api/groupsService";
import segmentsService from "@/lib/api/segmentsService";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { SubscribersSection } from "./_components/subscribers-section";
import { CampaignsSection } from "./_components/campaigns-section";
import { GroupsSection } from "./_components/groups-section";
import { SegmentsSection } from "./_components/segments-section";
import { TemplatesSection } from "./_components/templates-section";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
type ActiveSection = 'subscribers' | 'campaigns' | 'groups' | 'segments' | 'templates' | 'automations' | null;

export default function EmailMarketingDashboardPage() {
  const params = useParams();
  const tenant = params?.tenant as string || 'default';
  const [activeSection, setActiveSection] = useState<ActiveSection>('subscribers');
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [campaignCount, setCampaignCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [segmentCount, setSegmentCount] = useState(0);
  const [templateCount, setTemplateCount] = useState(27);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [subscribers, campaigns, groups, segments] = await Promise.all([
          subscribersService.getAll(),
          emailCampaignsService.getAll(),
          groupsService.getAll(),
          segmentsService.getAll()
        ]);

        setSubscriberCount(subscribers.length);
        setCampaignCount(campaigns.length);
        setGroupCount(groups.length);
        setSegmentCount(segments.length);
      } catch (error) {
        console.error('Error fetching dashboard telemetry:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = {
    subscribers: subscriberCount,
    campaigns: campaignCount,
    groups: groupCount,
    segments: segmentCount,
    templates: templateCount,
  };

  const sections = {
    subscribers: {
      title: 'SUBSCRIBERS',
      description: 'Manage your audience registry and identity mapping.',
      icon: 'groups',
      stat: `${stats.subscribers} Nodes`,
      content: <SubscribersSection />,
      actions: [
        { href: `/${tenant}/admin/email/subscribers/import`, label: 'IMPORT_REGISTRY', icon: FileUp },
        { href: `/${tenant}/admin/email/subscribers`, label: 'MANAGE_UNITS', icon: Users, variant: 'default' as const },
      ],
    },
    campaigns: {
      title: 'CAMPAIGNS',
      description: 'Orchestrate mass telemetry transmissions and pulses.',
      icon: 'send',
      stat: `${stats.campaigns} Dispatches`,
      content: <CampaignsSection />,
      actions: [
        { href: `/${tenant}/admin/email/campaigns/new`, label: 'DEPLOY_NEW_PULSE', icon: PlusCircle, variant: 'default' as const },
        { href: `/${tenant}/admin/email/campaigns`, label: 'LOG_MANAGER', icon: Send, variant: 'default' as const },
      ],
    },
    groups: {
      title: 'GROUPS',
      description: 'Static clustering of identity nodes for focused targeting.',
      icon: 'folder',
      stat: `${stats.groups} Clusters`,
      content: <GroupsSection />,
      actions: [
        { href: `/${tenant}/admin/email/groups/new`, label: 'CREATE_CLUSTER', icon: PlusCircle, variant: 'default' as const },
        { href: `/${tenant}/admin/email/groups`, label: 'CLUSTER_MANAGER', icon: Folder, variant: 'default' as const },
      ],
    },
    segments: {
      title: 'SEGMENTS',
      description: 'Dynamic neural clustering based on behavioral resonance.',
      icon: 'filter_alt',
      stat: `${stats.segments} Patterns`,
      content: <SegmentsSection />,
      actions: [
        { href: `/${tenant}/admin/email/segments/new`, label: 'DEFINE_PATTERN', icon: PlusCircle, variant: 'default' as const },
        { href: `/${tenant}/admin/email/segments`, label: 'NEURAL_FILTER', icon: Filter, variant: 'default' as const },
      ],
    },
    templates: {
      title: 'TEMPLATES',
      description: 'Standardized transmission protocols for various contexts.',
      icon: 'dashboard_customize',
      stat: `${stats.templates} Protocols`,
      content: <TemplatesSection />,
      actions: [
        { href: `/${tenant}/admin/email/templates/new`, label: 'NEW_PROTOCOL', icon: PlusCircle, variant: 'default' as const },
        { href: `/${tenant}/admin/email/templates`, label: 'PROTOCOL_ARCHIVE', icon: LayoutTemplate, variant: 'default' as const },
      ],
    },
    automations: {
      title: 'AUTOMATION',
      description: 'Self-executing comms sequences triggered by state change.',
      icon: 'auto_fix_high',
      stat: 'STAGING',
      content: <div className="text-center py-12 text-white/20 font-mono uppercase tracking-[0.2em] text-[10px]">Automation Engine Offline // Capability in Staging</div>,
      actions: [
        { href: `/${tenant}/admin/email/automations`, label: 'AUTO_ENGINE', icon: Zap, variant: 'default' as const },
      ],
    }
  };

  const handleSectionToggle = (section: ActiveSection) => {
    setActiveSection(prev => (prev === section ? null : section));
  };

  const currentSection = activeSection ? sections[activeSection] : null;

  return (
    <BccEditorialWrapper
      headerTitle="Transmission Overview"
      headerSubtitle="Macro-view of identity nodes and signal propagation"
      headerBadge="Command"
      moduleNav={<EmailModuleNav />}
      headerAction={<AiCoPilot context="email_marketing" variant="inline" />}
      telemetryData={[
        { label: "Active Nodes", value: stats.subscribers.toString(), color: "#9df425" },
        { label: "Signal Density", value: stats.campaigns.toString(), color: "#ff8c00" }
      ]}
    >
      <div className="space-y-12 animate-in fade-in duration-1000">

        {/* Cluster & Protocol Management */}
        <div className="space-y-6">
          <div className="border-l-2 border-[#ff8c00] pl-6 py-1">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/80">Ecosystem Control</h2>
            <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] mt-1 font-mono">Registry and Transmission Management</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {(Object.keys(sections) as (keyof typeof sections)[]).map((key) => {
              const section = sections[key];
              const isActive = activeSection === key;
              return (
                <div
                  key={key}
                  className={cn(
                    "group relative flex flex-col justify-between p-6 border transition-all duration-500 cursor-pointer",
                    isActive
                      ? "bg-white/[0.03] border-[#ff8c00]/40 shadow-[0_0_20px_rgba(255,140,0,0.1)]"
                      : "bg-white/[0.01] border-white/5 hover:border-white/20"
                  )}
                  onClick={() => handleSectionToggle(key)}
                >
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={cn("text-[10px] font-bold tracking-[0.2em]", isActive ? "text-[#ff8c00]" : "text-white/40 group-hover:text-white transition-colors")}>
                        {section.title}
                      </h3>
                      <p className="text-[11px] font-bold text-white mt-1 tabular-nums">
                        {section.stat}
                      </p>
                    </div>
                    <span className={cn("material-icons text-lg", isActive ? "text-[#ff8c00]" : "text-white/20")}>
                      {section.icon}
                    </span>
                  </div>
                  <p className="text-[9px] text-white/30 uppercase tracking-widest leading-normal">
                    {section.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live View Area */}
        <Collapsible open={!!activeSection} className="w-full">
          <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 mt-8">
            {currentSection && (
              <BccHudTile
                title={`${currentSection.title}_LIVE_VIEW`}
                subtitle={currentSection.description}
                headerAction={
                  <div className="flex gap-4">
                    {currentSection.actions.map((action, i) => (
                      <Button
                        key={i}
                        asChild
                        variant="outline"
                        size="sm"
                        className={cn(
                          "rounded-none text-[8px] uppercase tracking-widest h-7 font-bold border-white/10 transition-all",
                          action.variant === 'default' ? "bg-white/5 hover:bg-[#ff8c00] hover:text-black" : "bg-transparent hover:bg-white/10"
                        )}
                      >
                        <Link href={action.href}>
                          {action.label}
                        </Link>
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSectionToggle(activeSection)}
                      className="text-[9px] uppercase tracking-widest text-[#ff8c00] hover:bg-[#ff8c00]/10 rounded-none h-8 px-4"
                    >
                      <EyeOff className="mr-2 h-3 w-3" /> Terminate View
                    </Button>
                  </div>
                }
              >
                <div className="mt-4">
                  {currentSection.content}
                </div>
              </BccHudTile>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

    </BccEditorialWrapper>

  );
}
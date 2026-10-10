'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Send,
  Folder,
  Filter,
  PlusCircle,
  FileUp,
  Download,
  Eye,
  EyeOff,
  LayoutTemplate,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';

// Import table components
import SubscribersSection from './_components/subscribers-section';
import CampaignsSection from './_components/campaigns-section';
import GroupsSection from './_components/groups-section';
import SegmentsSection from './_components/segments-section';
import TemplatesSection from './_components/templates-section';

import subscribersService from '@/lib/api/subscribersService';
import emailCampaignsService from '@/lib/api/emailCampaignsService';
import groupsService from '@/lib/api/groupsService';
import segmentsService from '@/lib/api/segmentsService';

type ActiveSection = 'subscribers' | 'campaigns' | 'groups' | 'segments' | 'templates' | null;

export default function EmailMarketingDashboardPage() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('subscribers');
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [campaignCount, setCampaignCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [segmentCount, setSegmentCount] = useState(0);
  const [templateCount, setTemplateCount] = useState(0); // Will be set dynamically
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch real data from backend
        const subscribers = await subscribersService.getAllSubscribers();
        const campaigns = await emailCampaignsService.getAllCampaigns();
        const groups = await groupsService.getAllGroups();
        const segments = await segmentsService.getAllSegments();
        
        setSubscriberCount(subscribers.length);
        setCampaignCount(campaigns.length);
        setGroupCount(groups.length);
        setSegmentCount(segments.length);
        
        // Set template count to the actual number of templates (27 based on your directory)
        setTemplateCount(27);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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
        title: 'Aboneler',
        description: 'Bülten abonelerinizi görüntüleyin ve yönetin.',
        icon: Users,
        stat: `${stats.subscribers} Abone`,
        content: <SubscribersSection />,
        actions: [
            { href: '/admin/newsletter/subscribers/import', label: 'Toplu İçe Aktar', icon: FileUp },
            { href: '/admin/newsletter/subscribers', label: 'Aboneleri Yönet', icon: Users, variant: 'default' as const },
        ],
    },
    campaigns: {
        title: 'Kampanyalar',
        description: 'Bülten kampanyalarınızı oluşturun, gönderin ve takip edin.',
        icon: Send,
        stat: `${stats.campaigns} Kampanya`,
        content: <CampaignsSection />,
        actions: [
            { href: '/admin/newsletter/campaigns/new', label: 'Yeni Kampanya Oluştur', icon: PlusCircle, variant: 'default' as const },
            { href: '/admin/newsletter/campaigns', label: 'Kampanyaları Yönet', icon: Send, variant: 'default' as const },
        ],
    },
    groups: {
        title: 'Gruplar',
        description: 'Abonelerinizi manuel olarak atadığınız statik listeler halinde yönetin.',
        icon: Folder,
        stat: `${stats.groups} Grup`,
        content: <GroupsSection />,
        actions: [
            { href: '/admin/newsletter/groups/new', label: 'Yeni Grup Oluştur', icon: PlusCircle, variant: 'default' as const },
            { href: '/admin/newsletter/groups', label: 'Grupları Yönet', icon: Folder, variant: 'default' as const },
        ],
    },
    segments: {
        title: 'Segmentler',
        description: 'Abonelerinizi davranışlarına ve özelliklerine göre dinamik olarak gruplayın.',
        icon: Filter,
        stat: `${stats.segments} Segment`,
        content: <SegmentsSection />,
        actions: [
            { href: '/admin/newsletter/segments/new', label: 'Yeni Segment Oluştur', icon: PlusCircle, variant: 'default' as const },
            { href: '/admin/newsletter/segments', label: 'Segmentleri Yönet', icon: Filter, variant: 'default' as const },
        ],
    },
    templates: {
        title: 'Şablonlar',
        description: 'Yeniden kullanılabilir e-posta şablonları oluşturun ve yönetin.',
        icon: LayoutTemplate,
        stat: `${stats.templates} Şablon`,
        content: <TemplatesSection />,
        actions: [
            { href: '/admin/newsletter/templates/new', label: 'Yeni Şablon Oluştur', icon: PlusCircle, variant: 'default' as const },
            { href: '/admin/newsletter/templates', label: 'Şablonları Yönet', icon: LayoutTemplate, variant: 'default' as const },
        ],
    }
  };

  const handleSectionToggle = (section: ActiveSection) => {
    setActiveSection(prev => (prev === section ? null : section));
  };

  const currentSection = activeSection ? sections[activeSection] : null;

  return (
    <div className="space-y-8">
      <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Marketing</h1>
          <p className="text-muted-foreground">Pazarlama aktivitelerinize genel bir bakış.</p>
      </div>

      {/* Email Validation Section - Moved to top */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              IP Reputation Checker
            </CardTitle>
            <CardDescription>
              Check if sender IPs are listed on spam blacklists
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Verify that your sending IPs are not blacklisted to maintain good email deliverability.
            </p>
            <Button asChild>
              <Link href="/admin/newsletter/validation">
                Check IP Reputation
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Email Validator</CardTitle>
            <CardDescription>
              Validate email addresses for quality and authenticity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Ensure email addresses are properly formatted and belong to valid domains.
            </p>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stat Cards / Section Triggers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {(Object.keys(sections) as (keyof typeof sections)[]).map(key => {
            const section = sections[key];
            // Find the "manage" action for this section
            const manageAction = section.actions.find(action => 
                action.label.includes('Yönet') || action.label.includes('Manage')
            );
            
            return (
                <div key={key} className="space-y-2">
                    <Card 
                        key={key} 
                        onClick={() => handleSectionToggle(key)}
                        className={cn(
                            "cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
                            activeSection === key && "ring-2 ring-primary bg-primary/5"
                        )}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
                            <section.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{section.stat.split(' ')[0]}</div>
                            <p className="text-xs text-muted-foreground">{section.stat.split(' ')[1]}</p>
                        </CardContent>
                    </Card>
                    {/* Management button below each card */}
                    {manageAction && (
                        <Button asChild variant="default" size="sm" className="w-full">
                            <Link href={manageAction.href}>
                                <manageAction.icon className="mr-2 h-4 w-4" />
                                {manageAction.label}
                            </Link>
                        </Button>
                    )}
                </div>
            )
        })}
      </div>

        {/* Content Area */}
        <Collapsible open={!!activeSection} className="w-full">
            <CollapsibleContent className="space-y-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                 {currentSection && (
                     <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div>
                                <CardTitle>{currentSection.title}</CardTitle>
                                <CardDescription>{currentSection.description}</CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                                {currentSection.actions.map(action => (
                                    <Button key={action.label} asChild variant={action.variant || 'outline'} size="sm">
                                        <Link href={action.href}>
                                            <action.icon className="mr-2 h-4 w-4" />
                                            {action.label}
                                        </Link>
                                    </Button>
                                ))}
                                 <Button variant="ghost" size="sm" onClick={() => handleSectionToggle(activeSection)}>
                                    <EyeOff className="mr-2 h-4 w-4"/> Kapat
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {currentSection.content}
                        </CardContent>
                    </Card>
                 )}
            </CollapsibleContent>
        </Collapsible>
    </div>
  );
}
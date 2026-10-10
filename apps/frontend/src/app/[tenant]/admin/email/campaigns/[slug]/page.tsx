'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Send,
    Edit,
    Trash2,
    Calendar,
    Users,
    Mail,
    BarChart3,
    Clock,
    CheckCircle,
    XCircle,
    Pause,
    Eye,
    Download,
    TestTube,
    Trophy,
    Loader2,
    History,
    FileText
} from 'lucide-react';
import Link from 'next/link';
import { emailCampaignsService, EmailCampaign } from '@/lib/api/emailCampaignsService';
import abTestService from '@/lib/api/abTestService';
import trackingService from '@/lib/api/trackingService';
import type { TrackingStats } from '@/lib/api/trackingService';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { EmailModuleNav } from '@/components/admin/email/EmailModuleNav';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';

import TrackingStatsComponent from '@/components/admin/email/TrackingStats';
import CampaignScheduler from '@/components/admin/email/CampaignScheduler';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function CampaignSlugPage() {
    const params = useParams();
    const router = useRouter();
    const tenant = params.tenant as string;
    const slug = params.slug as string;

    const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasAbTest, setHasAbTest] = useState(false);
    const [trackingStats, setTrackingStats] = useState<TrackingStats | null>(null);
    const [trackingLoading, setTrackingLoading] = useState(false);

    useEffect(() => {
        if (slug) {
            fetchCampaign();
        }
    }, [slug]);

    const fetchCampaign = async () => {
        try {
            setLoading(true);
            setError(null);
            // Try fetching by slug first, fallback to ID if it looks like a UUID
            let data: EmailCampaign;
            try {
                data = await emailCampaignsService.getBySlug(slug);
            } catch (e) {
                // Fallback for transition period
                if (slug.length > 20) {
                    data = await emailCampaignsService.getById(slug);
                } else {
                    throw e;
                }
            }

            setCampaign(data);

            // Check if campaign has A/B test
            try {
                await abTestService.getSummary(data.id);
                setHasAbTest(true);
            } catch {
                setHasAbTest(false);
            }

            // Fetch tracking stats if campaign is sent
            if (data.status === 'sent') {
                fetchTrackingStats(data.id);
            }
        } catch (err) {
            console.error('Error fetching campaign:', err);
            setError('CAMPAIGN_SYNC_FAILURE');
        } finally {
            setLoading(false);
        }
    };

    const fetchTrackingStats = async (id: string) => {
        try {
            setTrackingLoading(true);
            const stats = await trackingService.getTrackingStats(id);
            setTrackingStats(stats);
        } catch (err) {
            console.error('Error fetching tracking stats:', err);
        } finally {
            setTrackingLoading(false);
        }
    };

    const handleSendCampaign = async () => {
        if (!campaign) return;
        try {
            await emailCampaignsService.sendCampaign(campaign.id);
            await fetchCampaign();
        } catch (err) {
            console.error('Error sending campaign:', err);
        }
    };

    const handleDeleteCampaign = async () => {
        if (!campaign) return;
        try {
            await emailCampaignsService.delete(campaign.id);
            router.push(`/${tenant}/admin/email/campaigns`);
        } catch (err) {
            console.error('Error deleting campaign:', err);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'draft':
                return { label: 'DRAFT_MODE', icon: Edit, color: 'text-white/40 border-white/10' };
            case 'scheduled':
                return { label: 'SCHEDULED_QUEUE', icon: Clock, color: 'text-[#ff8c00] border-[#ff8c00]/20 bg-[#ff8c00]/5' };
            case 'sending':
                return { label: 'TRANSMITTING', icon: Send, color: 'text-[#9df425] border-[#9df425]/20 bg-[#9df425]/5 animate-pulse' };
            case 'sent':
                return { label: 'DISPATCHED', icon: CheckCircle, color: 'text-[#9df425] border-[#9df425]/20 bg-[#9df425]/5' };
            case 'paused':
                return { label: 'HALTED', icon: Pause, color: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5' };
            case 'cancelled':
                return { label: 'ABORTED', icon: XCircle, color: 'text-red-500 border-red-500/20 bg-red-500/5' };
            default:
                return { label: status.toUpperCase(), icon: Mail, color: 'text-white/20 border-white/5' };
        }
    };

    if (loading) {
        return (
            <BccEditorialWrapper
                headerTitle="Campaign Link"
                headerBadge="Status"
                moduleNav={<EmailModuleNav />}
            >
                <div className="flex items-center justify-center py-48">
                    <div className="font-mono text-[11px] uppercase tracking-[0.4em] text-[#ff8c00] animate-pulse">Establishing Signal...</div>
                </div>
            </BccEditorialWrapper>
        );
    }

    if (error || !campaign) {
        return (
            <BccEditorialWrapper
                headerTitle="Registry Error"
                headerBadge="Failure"
                moduleNav={<EmailModuleNav />}
            >
                <div className="flex flex-col items-center justify-center py-48 gap-6 border border-white/5 bg-white/[0.01]">
                    <div className="text-[11px] font-mono text-red-500 uppercase tracking-widest">{error || 'ID_NOT_FOUND'}</div>
                    <Button variant="outline" className="rounded-none border-white/10 text-[10px] uppercase tracking-widest px-8" onClick={fetchCampaign}>
                        RE-SYNC
                    </Button>
                </div>
            </BccEditorialWrapper>
        );
    }

    const status = getStatusConfig(campaign.status as string);

    return (
        <BccEditorialWrapper
            headerTitle={campaign.name}
            headerSubtitle={campaign.subject}
            headerBadge="Campaign_Unit"
            moduleNav={<EmailModuleNav />}
            telemetryData={[
                { label: "TRANSMISSION_STATUS", value: status.label, color: status.color.includes('#9df425') ? "#9df425" : "#ff8c00" },
                { label: "TARGET_NODES", value: (campaign.totalRecipients || 0).toString() },
                { label: "OPEN_RATE", value: campaign.sentCount ? ((campaign.openedCount || 0) / campaign.sentCount * 100).toFixed(1) : "0.0", suffix: "%" }
            ]}
        >
            <div className="space-y-12 animate-in fade-in duration-1000">
                {/* Campaign Control Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/[0.02] border border-white/5 p-6 backdrop-blur-md text-white font-mono uppercase">
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className={cn("rounded-none text-[9px] tracking-widest border px-4 py-1.5 font-bold", status.color)}>
                            <status.icon className="w-3 h-3 mr-2" />
                            {status.label}
                        </Badge>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="space-y-0.5">
                            <span className="text-[8px] text-white/40 block">UID_PROTOCOL</span>
                            <span className="text-[10px] tracking-widest">{campaign.id.substring(0, 18)}...</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {campaign.status === 'draft' && (
                            <Button asChild variant="ghost" className="rounded-none border border-white/5 bg-white/5 text-[9px] font-bold uppercase tracking-widest px-6 h-10 hover:text-[#ff8c00]">
                                <Link href={`/${tenant}/admin/email/campaigns/${campaign.slug || campaign.id}/edit`}>
                                    <Edit className="mr-2 h-3.5 w-3.5 opacity-40" /> CONFIGURE_UNIT
                                </Link>
                            </Button>
                        )}

                        {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                            <Button onClick={handleSendCampaign} className="rounded-none bg-[#9df425] text-black hover:bg-[#86d11f] font-bold uppercase text-[9px] tracking-[0.2em] px-8 h-10">
                                <Send className="mr-2 h-3.5 w-3.5" /> EXECUTE_DISPATCH
                            </Button>
                        )}

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" className="rounded-none border border-red-500/20 bg-red-500/5 text-red-500 text-[9px] font-bold uppercase tracking-widest h-10 w-10 p-0 hover:bg-red-500 hover:text-black">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#0a0a0a] border-white/10 rounded-none text-white font-mono uppercase">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-sm font-bold tracking-widest">DESTRUCTIVE_ACTION_DETECTED</AlertDialogTitle>
                                    <AlertDialogDescription className="text-[10px] text-white/40 tracking-widest leading-relaxed">
                                        THIS WILL PERMANENTLY ERASE "{campaign.name}" FROM THE REGISTRY. TRANSMISSION LOGS WILL BE ARCHIVED.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-none border-white/10 bg-white/5 text-[10px]">HALT</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteCampaign} className="rounded-none bg-red-500 text-black text-[10px] hover:bg-red-600">PROCEED_WITH_PURGE</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                {/* Tabbed Intelligence Hub */}
                <Tabs defaultValue="overview" className="space-y-10">
                    <TabsList className="bg-[#0a0a0a] border border-white/5 p-1 rounded-none h-auto flex flex-wrap">
                        {[
                            { id: 'overview', label: 'GENEL_BAKIŞ', icon: FileText },
                            { id: 'content', label: 'İÇERİK', icon: Mail },
                            { id: 'recipients', label: 'ALICILAR', icon: Users },
                            { id: 'analytics', label: 'ANALİTİK', icon: BarChart3 },
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="rounded-none border-none py-3 px-6 text-[9px] font-bold uppercase tracking-[0.2em] text-white/20 data-[state=active]:text-[#ff8c00] data-[state=active]:bg-[#ff8c00]/5 hover:text-white/60 transition-all font-mono group"
                            >
                                <tab.icon className="w-3.5 h-3.5 mr-2 opacity-20 group-data-[state=active]:opacity-100 transition-opacity" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8 mt-0 outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <BccHudTile title="UNIT_PROPERTIES" subtitle="Core metadata and sync status" icon="info">
                                <div className="space-y-6 font-mono uppercase text-[10px]">
                                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                        <span className="text-white/30">Protocol_Name:</span>
                                        <span className="text-white font-bold">{campaign.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                        <span className="text-white/30">Subject_Header:</span>
                                        <span className="text-white truncate max-w-[200px]">{campaign.subject}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                        <span className="text-white/30">Registry_Epoch:</span>
                                        <span className="text-white">{format(new Date(campaign.createdAt), 'dd.MM.yyyy // HH:mm')}</span>
                                    </div>
                                    {campaign.sentAt && (
                                        <div className="flex justify-between items-center border-b border-[#9df425]/10 pb-3">
                                            <span className="text-[#9df425]/40">Dispatch_Epoch:</span>
                                            <span className="text-[#9df425]">{format(new Date(campaign.sentAt), 'dd.MM.yyyy // HH:mm')}</span>
                                        </div>
                                    )}
                                </div>
                            </BccHudTile>

                            <BccHudTile title="SCHEDULING_PROTOCOL" subtitle="Temporal queue management" icon="timer">
                                {(campaign.status === 'draft' || campaign.status === 'scheduled') ? (
                                    <CampaignScheduler
                                        campaignId={campaign.id}
                                        currentStatus={campaign.status as any}
                                        currentScheduledAt={campaign.scheduledAt ? campaign.scheduledAt.toString() : undefined}
                                        onScheduleUpdate={fetchCampaign}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                        <CheckCircle className="h-8 w-8 text-[#9df425]/40" />
                                        <p className="text-[9px] text-white/30 tracking-widest max-w-[200px]">
                                            TEMPORAL WINDOW CLOSED. DISPATCH COMPLETED IN PREVIOUS EPOCH.
                                        </p>
                                    </div>
                                )}
                            </BccHudTile>
                        </div>

                        {hasAbTest && (
                            <BccHudTile title="AB_ALGO_SYNC" subtitle="Active variance comparison" icon="science">
                                <div className="flex items-center justify-between p-6 bg-[#9df425]/5 border border-[#9df425]/20">
                                    <span className="text-[10px] font-bold text-[#9df425] tracking-widest">MULTIVARIATE_SYNC_ACTIVE</span>
                                    <Button variant="outline" className="rounded-none border-[#9df425]/20 text-[#9df425] text-[9px] hover:bg-[#9df425] hover:text-black">
                                        VIEW_ALGO_LOG
                                    </Button>
                                </div>
                            </BccHudTile>
                        )}
                    </TabsContent>

                    <TabsContent value="content" className="mt-0 outline-none">
                        <BccHudTile title="PAYLOAD_PREVIEW" subtitle="Synchronized email visual data" icon="visibility">
                            <div className="space-y-6">
                                <div className="p-4 bg-white/[0.02] border border-white/5 flex justify-between items-center font-mono uppercase text-[9px]">
                                    <span className="text-white/40">Subject_Vector:</span>
                                    <span className="text-white font-bold">{campaign.subject}</span>
                                </div>
                                <div className="bg-white/[0.01] border border-white/5 p-8 min-h-[400px] text-white/80 overflow-auto">
                                    {campaign.content ? (
                                        <div className="preview-container" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(campaign.content) }} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-24 opacity-20">
                                            <FileText className="h-12 w-12 mb-4" />
                                            <span className="text-[10px] tracking-widest">ZERO_PAYLOAD_DETECTED</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </BccHudTile>
                    </TabsContent>

                    <TabsContent value="recipients" className="mt-0 outline-none">
                        <BccHudTile title="TARGET_NODES" subtitle="Identity mapping for transmission" icon="hub">
                            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 border border-dashed border-white/5">
                                <Users className="h-12 w-12 text-white/5" />
                                <div className="space-y-2">
                                    <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono">Registry scan in progress...</p>
                                    <p className="text-[9px] text-white/20 uppercase tracking-widest max-w-xs">Detailed node-by-node resonance history arriving in next sync v2.4.</p>
                                </div>
                                <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full w-1/4 bg-[#ff8c00]/40 animate-pulse" />
                                </div>
                            </div>
                        </BccHudTile>
                    </TabsContent>

                    <TabsContent value="analytics" className="mt-0 outline-none">
                        {campaign.status === 'sent' && trackingStats ? (
                            <div className="space-y-8">
                                <TrackingStatsComponent stats={trackingStats} loading={trackingLoading} />
                            </div>
                        ) : (
                            <BccHudTile title="SIGNAL_LOGS" subtitle="Real-time resonance data" icon="activity">
                                <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 border border-dashed border-white/5">
                                    <BarChart3 className="h-12 w-12 text-white/5" />
                                    <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] max-w-xs leading-relaxed">
                                        SIGNAL_SILENT. ANALYTICS_STREAM INITIALIZES AFTER DISPATCH EXECUTION.
                                    </p>
                                </div>
                            </BccHudTile>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </BccEditorialWrapper>
    );
}

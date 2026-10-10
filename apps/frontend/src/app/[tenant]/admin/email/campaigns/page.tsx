'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Send,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  Mail,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CampaignPerformanceChart } from '../_components/campaign-performance-chart';
import emailCampaignsService, { EmailCampaign } from '@/lib/api/emailCampaignsService';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
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
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { EmailModuleNav } from '@/components/admin/email/EmailModuleNav';
import { cn } from '@/lib/utils';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

export default function CampaignsManagementPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params?.tenant as string || 'default';
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await emailCampaignsService.getAll();
      setCampaigns(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('FAILED_TO_SYNC_DISPATCH_LOG');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      await emailCampaignsService.sendCampaign(campaignId);
      await fetchCampaigns();
    } catch (err) {
      console.error('Error sending campaign:', err);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await emailCampaignsService.delete(campaignId);
      await fetchCampaigns();
    } catch (err) {
      console.error('Error deleting campaign:', err);
    }
  };

  const stats = useMemo(() => {
    const total = campaigns.length;
    const sent = campaigns.filter(c => c.status === 'sent').length;
    const avgOpenRate = total > 0
      ? (campaigns.reduce((acc, c) => acc + (c.sentCount ? (c.openedCount || 0) / c.sentCount : 0), 0) / total * 100).toFixed(1)
      : '0.0';
    return { total, sent, avgOpenRate };
  }, [campaigns]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="rounded-none border-white/10 text-white/40 text-[8px] uppercase tracking-widest">
            <Edit className="w-2.5 h-2.5 mr-1.5 opacity-40" /> DRAFT_MODE
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="outline" className="rounded-none border-[#ff8c00]/20 bg-[#ff8c00]/5 text-[#ff8c00] text-[8px] uppercase tracking-widest">
            <Clock className="w-2.5 h-2.5 mr-1.5 opacity-60" /> SYNC_PENDING
          </Badge>
        );
      case 'sent':
        return (
          <Badge variant="outline" className="rounded-none border-[#9df425]/20 bg-[#9df425]/5 text-[#9df425] text-[8px] uppercase tracking-widest">
            <CheckCircle className="w-2.5 h-2.5 mr-1.5 opacity-60" /> TRANSMITTED
          </Badge>
        );
      case 'sending':
        return (
          <Badge variant="outline" className="rounded-none border-[#ff8c00]/20 bg-[#ff8c00]/5 text-[#ff8c00] text-[8px] uppercase tracking-widest animate-pulse">
            <Send className="w-2.5 h-2.5 mr-1.5 opacity-60" /> DISPATCHING
          </Badge>
        );
      default:
        return <Badge variant="outline" className="rounded-none border-white/10 text-[8px] uppercase tracking-widest">{status}</Badge>;
    }
  };

  const formatDate = (dateValue: string | Date) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateOpenRate = (campaign: EmailCampaign) => {
    if (!campaign.sentCount || campaign.sentCount === 0) return '0.00';
    return ((campaign.openedCount || 0) / campaign.sentCount * 100).toFixed(2);
  };

  const calculateClickRate = (campaign: EmailCampaign) => {
    if (!campaign.openedCount || campaign.openedCount === 0) return '0.00';
    return ((campaign.clickedCount || 0) / campaign.openedCount * 100).toFixed(2);
  };

  return (
    <BccEditorialWrapper
      headerTitle="Campaign Cluster"
      headerBadge="Dispatch"
      moduleNav={<EmailModuleNav />}
      telemetryData={[
        { label: "TOTAL_PULSES", value: stats.total.toString() },
        { label: "ACTIVE_RESONANCE", value: stats.sent.toString() },
        { label: "RESONANCE_AVG", value: `${stats.avgOpenRate}%` },
        { label: "QUEUE_LATENCY", value: "0.2ms" }
      ]}
    >
      <div className="space-y-10 animate-in fade-in duration-700">
        {/* Actions Header */}
        <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-6 backdrop-blur-md">
          <div className="space-y-1">
            <h2 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Operational_Entry_Point</h2>
            <p className="text-[11px] text-white/60 uppercase tracking-widest font-bold">Initialize new dispatch pulse sequence</p>
          </div>
          <Button asChild className="rounded-none bg-[#9df425] text-black hover:bg-[#86d11f] font-bold text-[9px] tracking-[0.2em] uppercase px-8 h-10 transition-all">
            <Link href={`/${tenant}/admin/email/campaigns/new`}>
              <PlusCircle className="mr-2 h-4 w-4" /> DEPLOY_NEW_PULSE
            </Link>
          </Button>
        </div>

        {/* Campaign Performance Chart */}
        <BccHudTile
          title="TRANSMISSION_ANALYTICS"
          subtitle="Engagment resonance across temporal markers"
          icon="query_stats"
        >
          <div className="pt-4 h-[300px]">
            <CampaignPerformanceChart />
          </div>
        </BccHudTile>

        {/* Campaigns Table */}
        <BccHudTile
          title="DISPATCH_LOG"
          subtitle="Historical and pending transmission sequences"
          icon="history"
        >
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ff8c00]">Scanning Signal History...</div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="text-[10px] font-mono text-red-500 uppercase tracking-widest">{error}</div>
              <Button variant="outline" className="rounded-none border-white/10 text-[9px] uppercase tracking-widest" onClick={fetchCampaigns}>
                RETRY_SYNC
              </Button>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6 border border-dashed border-white/5 bg-white/[0.01]">
              <Send className="h-10 w-10 text-white/10" />
              <div className="text-center space-y-2">
                <h3 className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/60 font-bold">Zero signals detected</h3>
                <p className="text-[9px] text-white/20 uppercase tracking-[0.2em]">
                  Initialize your first transmission blueprint to see data here.
                </p>
              </div>
              <Button asChild className="rounded-none border border-[#ff8c00]/40 bg-[#ff8c00]/5 text-[#ff8c00] font-bold text-[9px] tracking-[0.2em] uppercase px-6">
                <Link href={`/${tenant}/admin/email/campaigns/new`}>
                  <PlusCircle className="mr-2 h-4 w-4" /> START_FIRST_PULSE
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader className="border-white/5 bg-white/[0.02]">
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4 px-6">Identity</TableHead>
                    <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4">State</TableHead>
                    <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4 text-center">Nodes</TableHead>
                    <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4 text-center">Open_Res</TableHead>
                    <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4 text-center">Click_Res</TableHead>
                    <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4 px-6 text-right">Ops</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id} className="border-white/5 hover:bg-white/[0.01] transition-colors group text-[11px]">
                      <TableCell className="py-4 px-6 font-medium">
                        <Link href={`/${tenant}/admin/email/campaigns/${campaign.slug || campaign.id}`} className="block">
                          <div className="font-bold text-white uppercase tracking-tight group-hover:text-[#ff8c00] transition-colors">{campaign.name}</div>
                          <div className="text-[9px] text-white/20 font-mono mt-0.5 truncate max-w-xs group-hover:text-white/40 transition-colors uppercase tracking-widest">
                            {campaign.subject}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(campaign.status)}
                        {campaign.sentAt && (
                          <div className="text-[8px] text-white/20 font-mono mt-1 uppercase">T: {formatDate(campaign.sentAt)}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono text-white/60">
                        {campaign.sentCount || 0}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        <span className={cn(
                          "px-1.5 py-0.5 border border-white/5",
                          Number(calculateOpenRate(campaign)) > 20 ? "text-[#9df425] bg-[#9df425]/5 border-[#9df425]/10" : "text-white/40 bg-white/5"
                        )}>
                          {calculateOpenRate(campaign)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        <span className="text-white/40 px-1.5 py-0.5 border border-white/5 bg-white/5">
                          {calculateClickRate(campaign)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-white/20 hover:text-white hover:bg-white/5 rounded-none">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 rounded-none text-white font-mono uppercase text-[9px] min-w-[160px]">
                            <DropdownMenuItem onClick={() => router.push(`/${tenant}/admin/email/campaigns/${campaign.slug || campaign.id}`)} className="hover:bg-white/5 cursor-pointer">
                              <Eye className="mr-3 h-3.5 w-3.5 opacity-40" /> ANALYTICS_VIEW
                            </DropdownMenuItem>
                            {campaign.status === 'draft' && (
                              <DropdownMenuItem onClick={() => router.push(`/${tenant}/admin/email/campaigns/${campaign.slug || campaign.id}/edit`)} className="hover:bg-white/5 cursor-pointer">
                                <Edit className="mr-3 h-3.5 w-3.5 opacity-40" /> MOD_PULSE
                              </DropdownMenuItem>
                            )}
                            {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                              <DropdownMenuItem onClick={() => handleSendCampaign(campaign.id)} className="hover:bg-white/5 cursor-pointer">
                                <Send className="mr-3 h-3.5 w-3.5 opacity-40" /> INIT_DISPATCH
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-white/5" />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10 hover:bg-destructive/10 cursor-pointer"
                                >
                                  <Trash2 className="mr-3 h-3.5 w-3.5" /> PURGE_PULSE
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-[#0f0f0f] border-white/10 rounded-none text-white font-mono uppercase">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-sm tracking-[0.2em] font-bold text-red-500">INITIATE_PURGE_SEQUENCE?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-[10px] text-white/40 tracking-widest mt-2 uppercase">
                                    Warning: The transmission pulse "{campaign.name}" will be permanently erased from history.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-none border-white/10 text-[10px]">ABORT</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCampaign(campaign.id)} className="rounded-none bg-red-600 text-white hover:bg-red-700 text-[10px] font-bold">
                                    CONFIRM_PURGE
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                <div className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-mono">
                  LOG_ENTRY_TOTAL: <span className="text-white font-bold">{campaigns.length}</span> DISPATCHES
                </div>
                <Pagination className="justify-end w-auto mx-0">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" className="h-7 px-3 rounded-none border-white/5 text-[8px] uppercase tracking-widest hover:bg-white/5" />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive className="h-7 w-7 rounded-none border-[#ff8c00]/40 bg-[#ff8c00]/5 text-[#ff8c00] text-[8px]">1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext href="#" className="h-7 px-3 rounded-none border-white/5 text-[8px] uppercase tracking-widest hover:bg-white/5" />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </BccHudTile>
      </div>
    </BccEditorialWrapper>
  );
}
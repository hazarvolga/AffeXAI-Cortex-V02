'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, BarChart2, Edit, Copy, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { CardFooter } from "@/components/ui/card";
import emailCampaignsService from '@/lib/api/emailCampaignsService';
import { EmailCampaign } from '@/lib/api/emailCampaignsService';

export function CampaignsSection() {
    const params = useParams();
    const tenant = params?.tenant as string || 'default';
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await emailCampaignsService.getAll();
                setCampaigns(data);
            } catch (error) {
                console.error('Error fetching campaigns:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getStatusVariant = (status: EmailCampaign['status']) => {
        switch (status) {
            case 'sent': return 'default';
            case 'scheduled': return 'secondary';
            case 'draft': return 'outline';
            default: return 'outline';
        }
    };

    const getStatusClass = (status: EmailCampaign['status']) => {
        switch (status) {
            case 'sent': return 'bg-green-500';
            case 'scheduled': return 'bg-blue-500';
            case 'draft': return '';
            default: return '';
        }
    }

    const getStatusText = (status: EmailCampaign['status']) => {
        switch (status) {
            case 'sent': return 'gönderildi';
            case 'scheduled': return 'planlandı';
            case 'draft': return 'taslak';
            default: return status;
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ff8c00]">Initializing Cluster Telemetry...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Table>
                <TableHeader className="border-white/5 bg-white/[0.02]">
                    <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4 px-6">Dispatch_ID</TableHead>
                        <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4">Resonance_State</TableHead>
                        <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4">Temporal_Marker</TableHead>
                        <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4">Node_Count</TableHead>
                        <TableHead className="text-right text-white/40 uppercase tracking-[0.2em] text-[9px] py-4 px-6">Ops</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {campaigns.length > 0 ? campaigns.map(campaign => {
                        const dateToShow = campaign.status === 'sent' ? campaign.sentAt : campaign.status === 'scheduled' ? campaign.scheduledAt : campaign.createdAt;
                        const dateLabel = campaign.status === 'sent' ? 'TRANSMITTED' : campaign.status === 'scheduled' ? 'QUEUED' : 'ESTABLISHED';

                        return (
                            <TableRow key={campaign.id} className="border-white/5 hover:bg-white/[0.01] transition-colors group">
                                <TableCell className="py-4 px-6">
                                    <Link href={`/${tenant}/admin/email/campaigns/${campaign.id}`} className="hover:text-[#ff8c00] transition-colors">
                                        <div className="text-white font-medium text-xs uppercase tracking-tight">{campaign.name}</div>
                                        <div className="text-[9px] text-white/20 font-mono mt-0.5 group-hover:text-white/40 transition-colors">{campaign.subject}</div>
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "rounded-none px-2 py-0.5 text-[8px] tracking-widest uppercase border-white/10",
                                            campaign.status === 'sent' ? "text-[#9df425] border-[#9df425]/20 bg-[#9df425]/5" :
                                                campaign.status === 'scheduled' ? "text-[#ff8c00] border-[#ff8c00]/20 bg-[#ff8c00]/5" :
                                                    "text-white/20"
                                        )}
                                    >
                                        {campaign.status === 'sent' ? 'ACTIVE_RESONANCE' : campaign.status === 'scheduled' ? 'SYNC_PENDING' : 'DRAFT_MODE'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="text-[10px] font-mono text-white/60 uppercase tracking-tighter tabular-nums">
                                        {dateToShow ? new Date(dateToShow).toLocaleDateString('en-GB') : '-'}
                                    </div>
                                    <div className="text-[8px] text-white/20 uppercase tracking-widest mt-0.5">{dateLabel}</div>
                                </TableCell>
                                <TableCell className="text-[11px] font-mono text-white font-medium">
                                    {campaign.totalRecipients || '0'} <span className="text-[8px] text-white/20 font-normal">UNITS</span>
                                </TableCell>
                                <TableCell className="text-right px-6">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-white/20 hover:text-white hover:bg-white/5 rounded-none">
                                                <span className="sr-only">OP_MENU</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 rounded-none text-white font-mono uppercase text-[9px] min-w-[160px]">
                                            <DropdownMenuItem asChild className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                                                <Link href={`/${tenant}/admin/email/campaigns/${campaign.id}`}>
                                                    <BarChart2 className="mr-3 h-3.5 w-3.5 opacity-40" /> ANALYTICS_LINK
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                                                <Link href={`/${tenant}/admin/email/campaigns/new?clone=${campaign.id}`}>
                                                    <Copy className="mr-3 h-3.5 w-3.5 opacity-40" /> REPLICATE_PULSE
                                                </Link>
                                            </DropdownMenuItem>
                                            {campaign.status !== 'sent' && (
                                                <DropdownMenuItem asChild className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                                                    <Link href={`/${tenant}/admin/email/campaigns/new?edit=${campaign.id}`}>
                                                        <Edit className="mr-3 h-3.5 w-3.5 opacity-40" /> MOD_PULSE
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator className="bg-white/5" />
                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 hover:bg-destructive/10 cursor-pointer">
                                                <Trash2 className="mr-3 h-3.5 w-3.5" /> PURGE_PULSE
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                    }) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-64 text-center text-white/10 uppercase tracking-[0.3em] font-mono text-[10px]">Zero transmission signals detected.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                <div className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-mono">
                    DISPATCH_LOG_TOTAL: <span className="text-white font-bold">{campaigns.length}</span> SIGNALS
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
    )
}
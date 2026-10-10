'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, BarChart2, Edit, Copy, Trash2 } from "lucide-react";
import Link from "next/link";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { CardFooter } from "@/components/ui/card";
import emailCampaignsService from '@/lib/api/emailCampaignsService';
import { EmailCampaign } from '@/lib/api/emailCampaignsService';

export default function CampaignsSection() {
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await emailCampaignsService.getAllCampaigns();
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
            <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Kampanyalar yükleniyor...</div>
            </div>
        );
    }

    return (
         <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Kampanya Başlığı</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Alıcı Sayısı</TableHead>
                        <TableHead><span className="sr-only">Eylemler</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {campaigns.map(campaign => {
                        const dateToShow = campaign.status === 'sent' ? campaign.sentAt : campaign.status === 'scheduled' ? campaign.scheduledAt : campaign.createdAt;
                        const dateLabel = campaign.status === 'sent' ? 'Gönderildi' : campaign.status === 'scheduled' ? 'Planlandı' : 'Oluşturuldu';

                        return (
                        <TableRow key={campaign.id}>
                            <TableCell className="font-medium">
                                 <Link href={`/admin/newsletter/campaigns/${campaign.id}`} className="hover:underline">{campaign.name}</Link>
                                <div className="text-xs text-muted-foreground">{campaign.subject}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(campaign.status)} className={cn(getStatusClass(campaign.status))}>
                                    {getStatusText(campaign.status).charAt(0).toUpperCase() + getStatusText(campaign.status).slice(1)}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div>{dateToShow ? new Date(dateToShow).toLocaleDateString('tr-TR') : '-'}</div>
                                <div className="text-xs text-muted-foreground">{dateLabel}</div>
                            </TableCell>
                            <TableCell>{campaign.totalRecipients || '-'}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Menüyü aç</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                             <Link href={`/admin/newsletter/campaigns/${campaign.id}`}><BarChart2 className="mr-2 h-4 w-4" /> İstatistikleri Gör</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/admin/newsletter/campaigns/new?clone=${campaign.id}`}><Copy className="mr-2 h-4 w-4" /> Kopyala</Link>
                                        </DropdownMenuItem>
                                        {campaign.status !== 'sent' && (
                                            <DropdownMenuItem asChild>
                                                 <Link href={`/admin/newsletter/campaigns/new?edit=${campaign.id}`}><Edit className="mr-2 h-4 w-4" /> Düzenle</Link>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" /> Sil
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )})}
                </TableBody>
            </Table>
            <CardFooter className="pt-6 border-t bg-muted/50">
                 <Pagination>
                    <PaginationContent>
                        <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                        <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
                        <PaginationItem><PaginationNext href="#" /></PaginationItem>
                    </PaginationContent>
                </Pagination>
            </CardFooter>
        </>
    )
}
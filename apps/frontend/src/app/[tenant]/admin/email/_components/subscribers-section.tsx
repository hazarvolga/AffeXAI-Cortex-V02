'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Mail, Edit, Trash2, Folder, Filter, Eye } from "lucide-react";
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
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils';
import { CardFooter } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import subscribersService, { Subscriber } from '@/lib/api/subscribersService';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export function SubscribersSection() {
    const params = useParams();
    const tenant = params?.tenant as string || 'default';
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchSubscribers = async () => {
            try {
                setLoading(true);
                const data = await subscribersService.getAll();
                setSubscribers(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching subscribers:', err);
                setError('Aboneler yüklenirken bir hata oluştu.');
            } finally {
                setLoading(false);
            }
        };

        fetchSubscribers();
    }, []);

    const getStatusVariant = (status: Subscriber['status']) => {
        switch (status) {
            case 'active': return 'default';
            case 'pending': return 'secondary';
            case 'unsubscribed': return 'outline';
            default: return 'outline';
        }
    };

    const getStatusClass = (status: Subscriber['status']) => {
        switch (status) {
            case 'active': return 'bg-green-500';
            case 'pending': return 'bg-yellow-500';
            case 'unsubscribed': return '';
            default: return '';
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await subscribersService.delete(id);
            setSubscribers(subscribers.filter(sub => sub.id !== id));
        } catch (err) {
            console.error('Error deleting subscriber:', err);
            // In a real app, you would show an error message to the user
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64 font-mono text-[10px] uppercase tracking-[0.3em] text-[#ff8c00]">Syncing Registry...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 py-12 font-mono text-[10px] uppercase tracking-widest">{error}</div>;
    }

    return (
        <div className="space-y-4">
            <Table>
                <TableHeader className="border-white/5 bg-white/[0.02]">
                    <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4">Identity</TableHead>
                        <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4">Resonance_Status</TableHead>
                        <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4">Cluster_Mapping</TableHead>
                        <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4">Registration_Epoch</TableHead>
                        <TableHead className="text-right text-white/40 uppercase tracking-[0.2em] text-[9px] py-4 px-6">Ops</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {subscribers.length > 0 ? subscribers.map(sub => (
                        <TableRow key={sub.id} className="border-white/5 hover:bg-white/[0.01] transition-colors group">
                            <TableCell className="py-4">
                                <Link href={`/${tenant}/admin/email/subscribers/${sub.id}/detail`} className="hover:text-[#ff8c00] transition-colors">
                                    <div className="text-white font-medium text-xs uppercase tracking-tight">{sub.email}</div>
                                    <div className="text-[9px] text-white/20 font-mono mt-0.5 group-hover:text-white/40 transition-colors">ID: {sub.id.split('-')[0]}</div>
                                </Link>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "rounded-none px-2 py-0.5 text-[8px] tracking-widest uppercase border-white/10",
                                        sub.status === 'active' ? "text-[#9df425] border-[#9df425]/20 bg-[#9df425]/5" :
                                            sub.status === 'pending' ? "text-[#ff8c00] border-[#ff8c00]/20 bg-[#ff8c00]/5" :
                                                "text-white/20"
                                    )}
                                >
                                    {sub.status === 'active' ? 'SYNCHRONIZED' : sub.status === 'pending' ? 'ORBITING' : 'OFFLINE'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1.5">
                                    {(sub.groups || []).map(group => (
                                        <Badge key={group} variant="outline" className="rounded-none border-white/5 bg-white/[0.02] text-[8px] uppercase tracking-widest text-white/40 hover:text-white transition-colors cursor-default">
                                            {group.replace('grp-', 'CLS_')}
                                        </Badge>
                                    ))}
                                    {(sub.segments || []).map(segment => (
                                        <Badge key={segment} variant="outline" className="rounded-none border-[#ff8c00]/20 bg-[#ff8c00]/5 text-[8px] uppercase tracking-widest text-[#ff8c00]/60">
                                            {segment}
                                        </Badge>
                                    ))}
                                    {(!sub.groups?.length && !sub.segments?.length) && <span className="text-[8px] text-white/10 italic">UNASSIGNED</span>}
                                </div>
                            </TableCell>
                            <TableCell className="text-[10px] font-mono text-white/40 uppercase tracking-tighter">
                                {new Date(sub.subscribedAt).toLocaleDateString('en-GB')}
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
                                        <DropdownMenuItem onClick={() => router.push(`/${tenant}/admin/email/subscribers/${sub.id}/detail`)} className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                                            <Eye className="mr-3 h-3.5 w-3.5 opacity-40" /> TELEMETRY_VIEW
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push(`/${tenant}/admin/email/subscribers/${sub.id}`)} className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                                            <Edit className="mr-3 h-3.5 w-3.5 opacity-40" /> MOD_CONFIG
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                                            <Mail className="mr-3 h-3.5 w-3.5 opacity-40" /> DISPATCH_SIGNAL
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-white/5" />
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10 hover:bg-destructive/10 cursor-pointer">
                                                    <Trash2 className="mr-3 h-3.5 w-3.5" /> PURGE_IDENTITY
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-[#0f0f0f] border-white/10 rounded-none text-white font-mono uppercase">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-sm tracking-[0.2em] font-bold text-red-500">INITIATE_PURGE_SEQUENCE?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-[10px] text-white/40 tracking-widest mt-2 uppercase">
                                                        Warning: This action will permanently erase the identity node from the registry. This operation is irreversible.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="rounded-none border-white/10 text-[10px]">ABORT</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(sub.id)} className="rounded-none bg-red-600 text-white hover:bg-red-700 text-[10px] font-bold">CONFIRM_PURGE</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-64 text-center text-white/10 uppercase tracking-[0.3em] font-mono text-[10px]">Zero identity nodes detected in registry.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                <div className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-mono">
                    REGISTRY_TOTAL: <span className="text-white font-bold">{subscribers.length}</span> UNITS
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
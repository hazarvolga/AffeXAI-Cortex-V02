'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import segmentsService from '@/lib/api/segmentsService';

export function SegmentsSection() {
    const params = useParams();
    const router = useRouter();
    const tenant = params?.tenant as string || 'default';
    const [segments, setSegments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await segmentsService.getAll();
                setSegments(data);
            } catch (error) {
                console.error('Error fetching segments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ff8c00]">Calculating Segment Resonance...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Table>
                <TableHeader className="border-white/5 bg-white/[0.02]">
                    <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4 px-6">Segment_Identity</TableHead>
                        <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4">Filter_Logic</TableHead>
                        <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4">Node_Resonance</TableHead>
                        <TableHead className="text-right text-white/40 uppercase tracking-[0.2em] text-[9px] py-4 px-6">Ops</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {segments.length > 0 ? segments.map((segment: any) => (
                        <TableRow key={segment.id} className="border-white/5 hover:bg-white/[0.01] transition-colors group">
                            <TableCell className="py-4 px-6 font-medium">
                                <Link href={`/${tenant}/admin/email/segments/${segment.id}`} className="text-white hover:text-[#9df425] transition-colors uppercase tracking-tight text-xs">
                                    {segment.name}
                                </Link>
                                <div className="text-[9px] text-white/20 font-mono mt-0.5 group-hover:text-white/40 transition-colors">SID: {segment.id.split('-')[0]}</div>
                            </TableCell>
                            <TableCell className="text-white/40 text-[10px] font-mono leading-relaxed max-w-[300px] truncate uppercase tracking-widest">
                                {segment.description || 'Dynamic filter based on engagement telemetry.'}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="rounded-none border-[#9df425]/20 bg-[#9df425]/5 text-[#9df425] font-mono py-0.5 px-2 text-[10px]">
                                    <Users className="h-3 w-3 mr-2 opacity-60" />
                                    {segment.subscriberCount} <span className="ml-1 opacity-40 text-[8px]">UNITS</span>
                                </Badge>
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
                                        <DropdownMenuItem onClick={() => router.push(`/${tenant}/admin/email/segments/${segment.id}`)} className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                                            <Edit className="mr-3 h-3.5 w-3.5 opacity-40" /> MOD_SEGMENT
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-white/5" />
                                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 hover:bg-destructive/10 cursor-pointer">
                                            <Trash2 className="mr-3 h-3.5 w-3.5" /> PURGE_SEGMENT
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-64 text-center text-white/10 uppercase tracking-[0.3em] font-mono text-[10px]">Zero segment filters mapped.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <div className="flex items-center px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                <div className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-mono">
                    FILTER_ONTOLOGY: <span className="text-white font-bold">{segments.length}</span> LOGICAL_SEGMENTS
                </div>
            </div>
        </div>
    );
}
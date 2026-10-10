'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Users } from "lucide-react";
import Link from "next/link";
import segmentsService from '@/lib/api/segmentsService';

export default function SegmentsSection() {
    const [segments, setSegments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await segmentsService.getAllSegments();
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
            <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Segmentler yükleniyor...</div>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Segment Adı</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Abone Sayısı</TableHead>
                    <TableHead><span className="sr-only">Eylemler</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {segments.map((segment: any) => (
                    <TableRow key={segment.id}>
                        <TableCell className="font-medium">
                            <Link href={`/admin/newsletter/segments/${segment.id}`} className="hover:underline">{segment.name}</Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{segment.description}</TableCell>
                        <TableCell>
                            <Badge variant="secondary" className="flex items-center gap-1.5 w-fit">
                                <Users className="h-3 w-3"/>
                                {segment.subscriberCount}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Menüyü aç</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                        <Edit className="mr-2 h-4 w-4"/> Düzenle
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4"/> Sil
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
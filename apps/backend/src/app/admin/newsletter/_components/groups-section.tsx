'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Users } from "lucide-react";
import Link from "next/link";
import groupsService from '@/lib/api/groupsService';

export default function GroupsSection() {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await groupsService.getAllGroups();
                setGroups(data);
            } catch (error) {
                console.error('Error fetching groups:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Gruplar yükleniyor...</div>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Grup Adı</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Abone Sayısı</TableHead>
                    <TableHead><span className="sr-only">Eylemler</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {groups.map((group: any) => (
                    <TableRow key={group.id}>
                        <TableCell className="font-medium">
                             <Link href={`/admin/newsletter/groups/${group.id}`} className="hover:underline">{group.name}</Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{group.description}</TableCell>
                        <TableCell>
                            <Badge variant="secondary" className="flex items-center gap-1.5 w-fit">
                                <Users className="h-3 w-3"/>
                                {group.subscriberCount}
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
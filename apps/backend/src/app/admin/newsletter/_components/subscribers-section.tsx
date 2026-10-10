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
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SubscribersSection() {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchSubscribers = async () => {
            try {
                setLoading(true);
                const data = await subscribersService.getAllSubscribers();
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
            await subscribersService.deleteSubscriber(id);
            setSubscribers(subscribers.filter(sub => sub.id !== id));
        } catch (err) {
            console.error('Error deleting subscriber:', err);
            // In a real app, you would show an error message to the user
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 py-12">{error}</div>;
    }

    return (
         <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>E-posta</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Gruplar / Segmentler</TableHead>
                        <TableHead>Kayıt Tarihi</TableHead>
                        <TableHead><span className="sr-only">Eylemler</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {subscribers.map(sub => (
                        <TableRow key={sub.id}>
                            <TableCell className="font-medium">
                              <Link href={`/admin/newsletter/subscribers/${sub.id}/detail`} className="hover:underline">
                                {sub.email}
                              </Link>
                            </TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(sub.status)} className={cn(getStatusClass(sub.status))}>
                                    {sub.status === 'active' ? 'Aktif' : sub.status === 'pending' ? 'Onay Bekliyor' : 'İptal Edilmiş'}
                                </Badge>
                            </TableCell>
                             <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {sub.groups.map(group => <Badge key={group} variant="outline" className="flex items-center gap-1"><Folder className="h-3 w-3"/>{group.replace('grp-','Grup ')}</Badge>)}
                                    {sub.segments.map(segment => <Badge key={segment} variant="secondary" className="flex items-center gap-1"><Filter className="h-3 w-3"/>{segment}</Badge>)}
                                </div>
                            </TableCell>
                            <TableCell>{new Date(sub.subscribedAt).toLocaleDateString('tr-TR')}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Menüyü aç</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => router.push(`/admin/newsletter/subscribers/${sub.id}/detail`)}>
                                          <Eye className="mr-2 h-4 w-4" /> Detay
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push(`/admin/newsletter/subscribers/${sub.id}`)}>
                                          <Edit className="mr-2 h-4 w-4" /> Düzenle
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Mail className="mr-2 h-4 w-4" /> E-posta Gönder
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                     <Trash2 className="mr-2 h-4 w-4" /> Aboneyi Sil
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Bu işlem geri alınamaz. Bu abone kalıcı olarak silinecek ve verileri sunucularımızdan kaldırılacaktır.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(sub.id)}>Sil</AlertDialogAction>
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
            <CardFooter className="pt-6 border-t bg-muted/50">
                <div className="text-xs text-muted-foreground">
                    Toplam <strong>{subscribers.length}</strong> abone.
                </div>
                <Pagination className="ml-auto">
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
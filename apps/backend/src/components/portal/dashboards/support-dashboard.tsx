
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifeBuoy, PlusCircle, Clock, CheckCircle, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { supportTickets } from "@/lib/support-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

export default function SupportDashboard() {
    const openTickets = supportTickets.filter(t => t.status === 'Open' || t.status === 'In Progress');
    const assignedToMe = openTickets.filter(t => t.assignee.id === 'usr-002'); // Mocking 'Zeynep Kaya'
    const highPriorityTickets = openTickets.filter(t => t.priority === 'High');
    
    // Combine and remove duplicates to prevent key errors
    const uniqueTicketsToShow = Array.from(new Map([...highPriorityTickets, ...assignedToMe].map(ticket => [ticket.id, ticket])).values());


    return (
        <>
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Destek Ekibi Paneli</h2>
                    <p className="text-muted-foreground">
                        Kullanıcı taleplerini yönetin ve çözüme kavuşturun.
                    </p>
                </div>
                 <Button asChild>
                    <Link href="/admin/support/new">
                        <PlusCircle className="mr-2 h-4 w-4"/> Manuel Talep Oluştur
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Açık Talepler</CardTitle>
                        <LifeBuoy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{openTickets.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bana Atananlar</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{assignedToMe.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Yüksek Öncelikli</CardTitle>
                        <Clock className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{highPriorityTickets.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>İlgi Bekleyen Talepler</CardTitle>
                    <CardDescription>Size atanmış veya yüksek öncelikli açık talepler.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Konu</TableHead>
                                <TableHead>Kullanıcı</TableHead>
                                <TableHead>Öncelik</TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead className="text-right">Eylem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {uniqueTicketsToShow.slice(0, 5).map(ticket => (
                                <TableRow key={ticket.id}>
                                    <TableCell>
                                        <p className="font-medium">{ticket.subject}</p>
                                        <p className="text-xs text-muted-foreground">{ticket.category}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8"><AvatarFallback>{getInitials(ticket.user.name)}</AvatarFallback></Avatar>
                                            <p>{ticket.user.name}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell><Badge variant={ticket.priority === 'High' ? 'destructive' : 'secondary'}>{ticket.priority}</Badge></TableCell>
                                    <TableCell>{new Date(ticket.createdAt).toLocaleDateString('tr-TR')}</TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild size="sm">
                                            <Link href={`/admin/support/${ticket.id}`}>Aç <ArrowRight className="ml-2 h-4 w-4"/></Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}

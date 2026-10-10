
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle, Calendar, Edit, Award } from "lucide-react";
import Link from "next/link";
import { pages } from "@/lib/cms-data";
import { eventsService } from "@/lib/api";
import { type EventWithUIData } from "@affexai/shared-types";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function EditorDashboard() {
    const draftPages = pages.filter(p => p.status === 'draft').slice(0, 3);
    const [recentEvents, setRecentEvents] = useState<EventWithUIData[]>([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await eventsService.getEvents();
                // Sort by date desc (recent first) and take top 3? Or just take 3.
                // Assuming API returns all, we slice here.
                setRecentEvents(data.slice(0, 3));
            } catch (error) {
                console.error("Failed to fetch events:", error);
            }
        };
        fetchEvents();
    }, []);

    return (
        <>
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">İçerik Editörü Paneli</h2>
                    <p className="text-muted-foreground">
                        Sayfaları, etkinlikleri ve sertifikaları yönetin.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Button asChild size="lg" className="h-auto py-6 text-left justify-start">
                    <Link href="/admin/cms/pages/new">
                        <FileText className="mr-4 h-6 w-6" />
                        <div>
                            <p className="font-bold">Yeni Sayfa Oluştur</p>
                            <p className="font-normal text-sm">Yeni bir CMS sayfası ekleyin.</p>
                        </div>
                    </Link>
                </Button>
                <Button asChild size="lg" className="h-auto py-6 text-left justify-start">
                    <Link href="/admin/events/new">
                        <Calendar className="mr-4 h-6 w-6" />
                        <div>
                            <p className="font-bold">Yeni Etkinlik Oluştur</p>
                            <p className="font-normal text-sm">Yeni bir webinar veya seminer planlayın.</p>
                        </div>
                    </Link>
                </Button>
                <Button asChild size="lg" className="h-auto py-6 text-left justify-start">
                    <Link href="/admin/certificates/new">
                        <Award className="mr-4 h-6 w-6" />
                        <div>
                            <p className="font-bold">Yeni Sertifika Oluştur</p>
                            <p className="font-normal text-sm">Katılımcılar için yeni sertifika verin.</p>
                        </div>
                    </Link>
                </Button>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Onay Bekleyen Taslaklar</CardTitle>
                        <CardDescription>Yayınlanmayı bekleyen son taslak sayfalar.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Başlık</TableHead>
                                    <TableHead>Son Güncelleme</TableHead>
                                    <TableHead className="text-right">Eylem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {draftPages.map(page => (
                                    <TableRow key={page.id}>
                                        <TableCell>{page.title}</TableCell>
                                        <TableCell>{new Date(page.lastUpdated).toLocaleDateString('tr-TR')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/admin/cms/pages/${page.id}`}>
                                                    <Edit className="mr-2 h-4 w-4" /> Düzenle
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Son Etkinlikler</CardTitle>
                        <CardDescription>En son oluşturulan veya güncellenen etkinlikler.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Etkinlik</TableHead>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Durum</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentEvents.map(event => (
                                    <TableRow key={event.id}>
                                        <TableCell>
                                            <Link href={`/admin/events/${event.id}`} className="font-medium hover:underline">{event.title}</Link>
                                        </TableCell>
                                        <TableCell>{new Date(event.startDate).toLocaleDateString('tr-TR')}</TableCell>
                                        <TableCell>
                                            <Badge variant={new Date(event.startDate) > new Date() ? 'default' : 'outline'}>
                                                {new Date(event.startDate) > new Date() ? 'Yaklaşıyor' : 'Tamamlandı'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

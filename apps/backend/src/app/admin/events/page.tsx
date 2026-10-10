'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, BarChart2, CalendarDays, Ticket, Users, FileUp, Search } from "lucide-react";
import Link from "next/link";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import eventsService, { DashboardStats } from "@/lib/api/eventsService";
import type { Event } from "@/lib/types";

// Map backend event to frontend event type
interface FrontendEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  imageUrl: string;
  isOnline: boolean;
  location: {
    venue: string;
    address: string;
    city: string;
    country: string;
  };
  organizer: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  isFavorite?: boolean;
  grantsCertificate?: boolean;
  certificateTitle?: string;
  attendees?: any[];
  assessments?: any[];
}

const EventTable = ({ eventsToShow }: { eventsToShow: FrontendEvent[] }) => {
     if (eventsToShow.length === 0) {
        return <div className="text-center text-muted-foreground py-12">Bu görünümde gösterilecek etkinlik yok.</div>
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Etkinlik Adı</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Mekan</TableHead>
                        <TableHead>Bilet Satışı</TableHead>
                        <TableHead><span className="sr-only">Eylemler</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {eventsToShow.map(event => {
                        const eventDate = new Date(event.date);
                        const isPast = eventDate < new Date();
                        const ticketsSold = event.attendees?.length || 0;
                        const capacity = 150; // Mock data
                        const progress = (ticketsSold / capacity) * 100;

                        return (
                            <TableRow key={event.id}>
                                <TableCell className="font-medium">
                                    <div>{event.title}</div>
                                    <div className="text-xs text-muted-foreground">{event.category}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={isPast ? "outline" : "default"} className={!isPast ? "bg-green-500" : ""}>
                                        {isPast ? 'Tamamlandı' : 'Yaklaşıyor'}
                                    </Badge>
                                </TableCell>
                                <TableCell>{eventDate.toLocaleDateString('tr-TR')}</TableCell>
                                <TableCell>{event.isOnline ? "Online" : event.location.city}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1.5">
                                        <Progress value={progress} className="h-2"/>
                                        <span className="text-xs text-muted-foreground">{ticketsSold} / {capacity}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Menüyü aç</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/events/${event.id}`}>Düzenle</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                               <BarChart2 className="mr-2 h-4 w-4" /> Analitik
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                Sil
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
             <CardFooter className="pt-6">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                        <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
                        <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
                        <PaginationItem><PaginationNext href="#" /></PaginationItem>
                    </PaginationContent>
                </Pagination>
            </CardFooter>
        </>
    )
}

export default function EventsDashboardPage() {
    const [events, setEvents] = useState<FrontendEvent[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        upcomingEvents: 0,
        totalTicketSales: 0,
        totalParticipants: 0,
        monthlyRevenue: 0,
        revenueChange: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch events and stats from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                console.log('Fetching data from backend...');
                
                // Fetch events
                console.log('Fetching events...');
                const backendEvents = await eventsService.getAllEvents();
                console.log('Received events:', backendEvents.length);
                
                // Map backend events to frontend format
                const frontendEvents: FrontendEvent[] = backendEvents.map(event => ({
                    id: event.id,
                    title: event.title,
                    description: event.description,
                    category: 'Etkinlik', // Default category since it's not in backend model
                    date: event.startDate,
                    imageUrl: 'https://picsum.photos/seed/event1/800/450', // Default image
                    isOnline: false, // Default value
                    location: {
                        venue: event.location,
                        address: event.location,
                        city: 'İstanbul', // Default city
                        country: 'Türkiye' // Default country
                    },
                    organizer: {
                        id: 'org-01', // Default organizer
                        name: 'Aluplan Digital', // Default organizer
                        avatarUrl: 'https://i.pravatar.cc/150?u=aluplan' // Default avatar
                    },
                    isFavorite: false, // Default value
                    grantsCertificate: true, // Default value
                    certificateTitle: `${event.title} Katılım Sertifikası`, // Default certificate title
                    attendees: [], // Empty for now
                    assessments: [] // Empty for now
                }));
                
                setEvents(frontendEvents);
                
                // Fetch dashboard stats
                console.log('Fetching dashboard stats...');
                const dashboardStats = await eventsService.getDashboardStats();
                console.log('Received dashboard stats:', dashboardStats);
                setStats(dashboardStats);
                
                setError(null);
            } catch (err: any) {
                console.error('Error fetching data:', err);
                console.error('Error name:', err.name);
                console.error('Error message:', err.message);
                console.error('Error stack:', err.stack);
                if (err.response) {
                    console.error('Response data:', err.response.data);
                    console.error('Response status:', err.response.status);
                    console.error('Response headers:', err.response.headers);
                }
                setError('Veriler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date());
    const pastEvents = events.filter(e => new Date(e.date) < new Date());

    if (loading) {
        return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 py-12">{error}</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Etkinlik Paneli</h1>
                    <p className="text-muted-foreground">Etkinliklerinize genel bir bakış atın ve yönetin.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <FileUp className="mr-2 h-4 w-4" />
                        İçe Aktar
                    </Button>
                    <Button asChild>
                        <Link href="/admin/events/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Yeni Etkinlik Oluştur
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Yaklaşan Etkinlikler</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Bilet Satışı</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTicketSales.toLocaleString()}</div>
                         <p className="text-xs text-muted-foreground">Tüm etkinlikler</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Katılımcı</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalParticipants.toLocaleString()}</div>
                         <p className="text-xs text-muted-foreground">Geçmiş etkinlikler</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bu Ayki Gelir</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₺{stats.monthlyRevenue.toLocaleString()}</div>
                         <p className="text-xs text-muted-foreground">Geçen aya göre +{stats.revenueChange}%</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <Tabs defaultValue="all">
                     <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                             <TabsList>
                                <TabsTrigger value="all">Tüm Etkinlikler</TabsTrigger>
                                <TabsTrigger value="upcoming">Yaklaşan</TabsTrigger>
                                <TabsTrigger value="past">Geçmiş</TabsTrigger>
                                <TabsTrigger value="drafts">Taslaklar</TabsTrigger>
                            </TabsList>
                            <div className="relative md:w-1/3">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Etkinlik ara..." className="pl-8 w-full" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <TabsContent value="all">
                            <EventTable eventsToShow={events} />
                        </TabsContent>
                        <TabsContent value="upcoming">
                           <EventTable eventsToShow={upcomingEvents} />
                        </TabsContent>
                        <TabsContent value="past">
                            <EventTable eventsToShow={pastEvents} />
                        </TabsContent>
                        <TabsContent value="drafts">
                           <div className="text-center text-muted-foreground py-12">Taslak etkinlik bulunmuyor.</div>
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        </div>
    );
}
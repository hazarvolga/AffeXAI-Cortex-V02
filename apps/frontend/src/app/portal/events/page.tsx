'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Tag, ArrowRight, PlusCircle, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { authService, eventsService } from "@/lib/api";
import { type EventWithUIData } from "@affexai/shared-types";

// Role IDs from seed
const ROLE_IDS = {
    ADMIN: 'a1b2c3d4-e5f6-4789-abcd-000000000001',
    EDITOR: 'a1b2c3d4-e5f6-4789-abcd-000000000002',
};

const EventCard = ({ event }: { event: EventWithUIData }) => (
    <Card className="flex flex-col overflow-hidden group transition-shadow hover:shadow-lg">
        <div className="relative aspect-[16/9] overflow-hidden">
            {/* Use fallback image or event image */}
            <Image
                src={event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3'}
                alt={event.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <Badge className="absolute top-2 right-2" variant={event.isOnline ? "secondary" : "default"}>
                {event.isOnline ? "Online" : "Yüz Yüze"}
            </Badge>
        </div>
        <CardHeader>
            <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">{event.title}</CardTitle>
            <CardDescription>{new Date(event.startDate).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' })}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="line-clamp-1">{event.isOnline ? "Çevrimiçi" : event.location}</span>
            </div>
            {event.category && (
                <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span>{event.category}</span>
                </div>
            )}
        </CardContent>
        <CardFooter>
            <Button asChild className="w-full">
                <Link href={`/portal/events/${event.id}`}>
                    Detayları Görüntüle <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
    </Card>
);

export default function MyEventsPage() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [events, setEvents] = useState<EventWithUIData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get current user from token
        const user = authService.getUserFromToken();
        setCurrentUser(user);

        // Fetch events
        const fetchEvents = async () => {
            try {
                // Fetch all events for now
                // In future, we might want to filter by user's registered events for "My Events"
                const data = await eventsService.getEvents({
                    sortOrder: 'ASC',
                    sortBy: 'startDate'
                });
                setEvents(data as EventWithUIData[]);
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.startDate) >= now);
    const pastEvents = events.filter(e => new Date(e.startDate) < now);
    // const favoriteEvents = events.filter(e => e.isFavorite); // Backend property needed for favorites

    // Check if user is Admin or Editor
    const canCreateEvents = currentUser?.roleId === ROLE_IDS.ADMIN ||
        currentUser?.roleId === ROLE_IDS.EDITOR;

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Etkinliklerim</h2>
                    <p className="text-muted-foreground">Kayıtlı olduğunuz ve favorilerinize eklediğiniz etkinlikler.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/portal/events/discover">
                            <Search className="mr-2 h-4 w-4" /> Etkinlik Keşfet
                        </Link>
                    </Button>
                    {canCreateEvents && (
                        <Button asChild>
                            <Link href="/admin/events/new">
                                <PlusCircle className="mr-2 h-4 w-4" /> Yeni Etkinlik Oluştur
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="upcoming">
                <TabsList>
                    <TabsTrigger value="upcoming">Yaklaşan Etkinlikler</TabsTrigger>
                    <TabsTrigger value="past">Geçmiş Etkinlikler</TabsTrigger>
                    {/* <TabsTrigger value="favorites">Favoriler</TabsTrigger> */}
                </TabsList>
                <TabsContent value="upcoming" className="mt-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {upcomingEvents.map(event => <EventCard key={event.id} event={event} />)}
                        {upcomingEvents.length === 0 && (
                            <p className="col-span-full text-center text-muted-foreground">Yaklaşan bir etkinliğiniz bulunmuyor.</p>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="past" className="mt-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {pastEvents.map(event => <EventCard key={event.id} event={event} />)}
                        {pastEvents.length === 0 && (
                            <p className="col-span-full text-center text-muted-foreground">Geçmiş bir etkinliğiniz bulunmuyor.</p>
                        )}
                    </div>
                </TabsContent>
                {/* 
                <TabsContent value="favorites" className="mt-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {favoriteEvents.map(event => <EventCard key={event.id} event={event} />)}
                         {favoriteEvents.length === 0 && (
                            <p className="col-span-full text-center text-muted-foreground">Favori etkinliğiniz bulunmuyor.</p>
                        )}
                    </div>
                </TabsContent>
                */}
            </Tabs>
        </div>
    );
}

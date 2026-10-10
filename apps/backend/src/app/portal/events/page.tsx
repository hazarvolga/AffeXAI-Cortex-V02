
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Tag, ArrowRight, PlusCircle, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { events, Event } from "@/lib/events-data";
import { Badge } from "@/components/ui/badge";

// Mock user object to simulate roles. In a real app, this would come from an auth context.
const mockUser = {
    role: 'Editor', // Can be 'Participant', 'Editor', 'Support Team'
};

const EventCard = ({ event }: { event: Event }) => (
    <Card className="flex flex-col overflow-hidden group transition-shadow hover:shadow-lg">
        <div className="relative aspect-[16/9] overflow-hidden">
            <Image 
                src={event.imageUrl} 
                alt={event.title} 
                fill 
                className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <Badge className="absolute top-2 right-2" variant={event.isOnline ? "secondary" : "default"}>
                {event.isOnline ? "Online" : "Yüz Yüze"}
            </Badge>
        </div>
        <CardHeader>
            <CardTitle className="text-lg group-hover:text-primary transition-colors">{event.title}</CardTitle>
            <CardDescription>{new Date(event.date).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' })}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{event.isOnline ? "Çevrimiçi" : `${event.location.venue}, ${event.location.city}`}</span>
            </div>
            <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span>{event.category}</span>
            </div>
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
    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.date) >= now);
    const pastEvents = events.filter(e => new Date(e.date) < now);
    const favoriteEvents = events.filter(e => e.isFavorite);

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
                            <Search className="mr-2 h-4 w-4"/> Etkinlik Keşfet
                        </Link>
                    </Button>
                    {mockUser.role === 'Editor' && (
                        <Button asChild>
                             <Link href="/admin/events/new">
                                <PlusCircle className="mr-2 h-4 w-4"/> Yeni Etkinlik Oluştur
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="upcoming">
                <TabsList>
                    <TabsTrigger value="upcoming">Yaklaşan Etkinlikler</TabsTrigger>
                    <TabsTrigger value="past">Geçmiş Etkinlikler</TabsTrigger>
                    <TabsTrigger value="favorites">Favoriler</TabsTrigger>
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
                <TabsContent value="favorites" className="mt-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {favoriteEvents.map(event => <EventCard key={event.id} event={event} />)}
                         {favoriteEvents.length === 0 && (
                            <p className="col-span-full text-center text-muted-foreground">Favori etkinliğiniz bulunmuyor.</p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

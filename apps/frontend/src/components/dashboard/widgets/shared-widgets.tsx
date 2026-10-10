'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { eventsService } from "@/lib/api";
import { type EventWithUIData } from "@affexai/shared-types";

export function UpcomingEvents() {
    const [upcomingEvents, setUpcomingEvents] = useState<EventWithUIData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await eventsService.getUpcomingEvents(2);
                setUpcomingEvents(data);
            } catch (error) {
                console.error("Failed to fetch upcoming events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) {
        return (
            <Card className="lg:col-span-7">
                <CardHeader>
                    <CardTitle>Yaklaşan Etkinlikler</CardTitle>
                </CardHeader>
                <CardContent className="min-h-[200px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="lg:col-span-7">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Yaklaşan Etkinlikler</CardTitle>
                    <CardDescription>Kayıt olduğunuz veya ilginizi çekebilecek etkinlikler.</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href="/portal/events">Tüm Etkinlikler</Link>
                </Button>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                {upcomingEvents.map(event => (
                    <Link href={`/portal/events/${event.id}`} key={event.id} className="group">
                        <Card className="overflow-hidden h-full transition-all hover:border-primary">
                            <div className="relative aspect-[16/9]">
                                {/* Use fallback image or event image */}
                                <Image
                                    src={event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3'}
                                    alt={event.title}
                                    fill
                                    className="object-cover transition-transform group-hover:scale-105"
                                />
                            </div>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">
                                    {new Date(event.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">{event.title}</h3>
                                {(event as any).location && (
                                    <p className="text-sm text-muted-foreground line-clamp-1">{(event as any).location}</p>
                                )}
                            </CardContent>
                        </Card>
                    </Link>
                ))}
                {upcomingEvents.length === 0 && (
                    <div className="md:col-span-2 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-semibold text-lg">Yaklaşan bir etkinlik bulunmuyor.</h3>
                        <p className="text-muted-foreground mb-4">Yeni etkinlikler eklendiğinde burada göreceksiniz.</p>
                        <Button asChild>
                            <Link href="/portal/events/discover">Etkinlik Keşfet</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

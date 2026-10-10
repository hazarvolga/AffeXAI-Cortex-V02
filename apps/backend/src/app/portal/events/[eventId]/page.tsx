
'use client'

import { events, Event } from "@/lib/events-data";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Tag, Users, Ticket, Share2, Heart, FileText, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import Link from "next/link";
import { Assessment } from "@/lib/types";

// Mock ticket types for a specific event for demonstration
// In a real app, this would come from the event data
const ticketOptions = [
    { type: "Genel Giriş", price: 75, benefits: ["Tüm oturumlara erişim"], stock: 85 },
    { type: "VIP", price: 250, benefits: ["Ön sıra", "Konuşmacılarla tanışma", "Öğle yemeği dahil"], stock: 3 }
];


export default function EventDetailPage({ params }: { params: { eventId: string } }) {
    const initialEvent = events.find(e => e.id === params.eventId);
    
    const [event, setEvent] = useState<Event | undefined>(initialEvent);

    if (!event) {
        notFound();
    }

    const toggleFavorite = () => {
        setEvent(prevEvent => {
            if (!prevEvent) return undefined;
            // In a real app, you would also make an API call here to update the backend.
            return { ...prevEvent, isFavorite: !prevEvent.isFavorite };
        });
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative h-[40vh] min-h-[300px] rounded-lg overflow-hidden">
                <Image src={event.imageUrl} alt={event.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 text-white">
                    <Badge variant="secondary" className="mb-2">{event.category}</Badge>
                    <h1 className="text-4xl font-bold">{event.title}</h1>
                    <p className="text-lg mt-1">{new Date(event.date).toLocaleString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Etkinlik Hakkında</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Biletler</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {ticketOptions.map(ticket => (
                               <div key={ticket.type} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg">
                                   <div>
                                       <h3 className="font-semibold text-lg">{ticket.type}</h3>
                                       <p className="text-sm text-muted-foreground">{ticket.benefits.join(', ')}</p>
                                       <Badge variant={ticket.stock < 10 ? 'destructive' : 'outline'} className="mt-2">
                                           {ticket.stock > 0 ? `Kalan Bilet: ${ticket.stock}` : "Tükendi"}
                                       </Badge>
                                   </div>
                                   <div className="flex items-center gap-4 mt-4 sm:mt-0">
                                       <span className="text-xl font-bold">{ticket.price} TL</span>
                                       <Button disabled={ticket.stock === 0}>
                                           <Ticket className="mr-2 h-4 w-4"/> Satın Al
                                       </Button>
                                   </div>
                               </div>
                           ))}
                        </CardContent>
                    </Card>

                    {event.assessments && event.assessments.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Değerlendirmeler</CardTitle>
                                <CardDescription>
                                    Etkinliği tamamlamak veya sertifika kazanmak için bu değerlendirmeleri tamamlamanız gerekebilir.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {event.assessments.map((assessment: Assessment) => (
                                    <div key={assessment.id} className="flex justify-between items-center p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <FileText className="h-6 w-6 text-primary"/>
                                            <div>
                                                <h3 className="font-semibold">{assessment.title}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {assessment.type === 'quiz' ? 'Quiz' : 'Anket'} - {assessment.questions.length} Soru
                                                </p>
                                            </div>
                                        </div>
                                        <Button asChild>
                                            <Link href={`/portal/assessments/${assessment.id}`}>
                                                {assessment.type === 'quiz' ? 'Teste Başla' : 'Anketi Doldur'}
                                            </Link>
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="flex gap-2">
                        <Button size="lg" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                            <Ticket className="mr-2"/> Şimdi Kayıt Ol
                        </Button>
                        <Button variant="outline" size="icon" onClick={toggleFavorite}>
                            <Heart className={`h-5 w-5 transition-colors ${event.isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                             <span className="sr-only">Favorilere ekle</span>
                        </Button>
                        <Button variant="outline" size="icon">
                            <Share2 className="h-5 w-5"/>
                             <span className="sr-only">Paylaş</span>
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Detaylar</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-start gap-3">
                                <Calendar className="h-4 w-4 mt-1 text-muted-foreground"/>
                                <div>
                                    <p className="font-semibold">Tarih & Saat</p>
                                    <p className="text-muted-foreground">{new Date(event.date).toLocaleString('tr-TR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 mt-1 text-muted-foreground"/>
                                <div>
                                    <p className="font-semibold">Mekan</p>
                                    <p className="text-muted-foreground">{event.isOnline ? "Çevrimiçi" : `${event.location.venue}, ${event.location.city}`}</p>
                                    {!event.isOnline && <a href="#" className="text-primary text-xs hover:underline">Haritada Gör</a>}
                                </div>
                            </div>
                              <div className="flex items-start gap-3">
                                <Users className="h-4 w-4 mt-1 text-muted-foreground"/>
                                <div>
                                    <p className="font-semibold">Organizatör</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={event.organizer.avatarUrl} />
                                            <AvatarFallback>{event.organizer.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-muted-foreground">{event.organizer.name}</span>
                                    </div>
                                </div>
                            </div>
                             {event.grantsCertificate && (
                                 <div className="flex items-start gap-3">
                                    <CheckCircle className="h-4 w-4 mt-1 text-muted-foreground"/>
                                    <div>
                                        <p className="font-semibold">Sertifika</p>
                                        <p className="text-muted-foreground">Bu etkinlik sonunda katılım sertifikası verilmektedir.</p>
                                    </div>
                                </div>
                             )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

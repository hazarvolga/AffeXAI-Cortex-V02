
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Award, BookOpen, Calendar, PlayCircle, Mail } from "lucide-react";
import Link from "next/link";
import { eventsService } from "@/lib/api";
import { type EventWithUIData } from "@affexai/shared-types";
import { useState, useEffect } from "react";
import Image from "next/image";

const quickLinks = [
    { title: "Eğitimlerim", icon: GraduationCap, href: "/portal/courses" },
    { title: "Sertifikalarım", icon: Award, href: "/portal/certificates" },
    { title: "Bilgi Bankası", icon: BookOpen, href: "/portal/kb" },
    { title: "Bülten Arşivi", icon: Mail, href: "/portal/newsletter" },
];

const recentActivity = [
    { description: "'İleri Düzey Modelleme' kursunu tamamladınız.", time: "2 gün önce" },
    { description: "Yeni sertifikanız hazır: BIM Temelleri", time: "5 gün önce" },
    { description: "'3D Görselleştirme' webinar kaydını izlediniz.", time: "1 hafta önce" },
];

export default function StudentDashboard() {
    const [upcomingEvents, setUpcomingEvents] = useState<EventWithUIData[]>([]);

    useEffect(() => {
        const fetchEvents = async () => {
            const data = await eventsService.getUpcomingEvents(2);
            setUpcomingEvents(data);
        };
        fetchEvents();
    }, []);

    return (
        <>
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Hoş Geldiniz! (Student View)</h2>
                    <p className="text-muted-foreground">
                        Eğitim portalınıza genel bir bakış.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {quickLinks.map(link => (
                    <Card key={link.title} className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{link.title}</CardTitle>
                            <link.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <Button variant="link" className="p-0 h-auto" asChild>
                                <Link href={link.href}>Git →</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
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
                                        <Image src={event.imageUrl || '/placeholder-event.jpg'} alt={event.title} fill className="object-cover transition-transform group-hover:scale-105" />
                                    </div>
                                    <CardContent className="p-4">
                                        <p className="text-sm text-muted-foreground">{new Date(event.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{event.title}</h3>
                                        {(event as any).location && (
                                            <p className="text-sm text-muted-foreground">{(event as any).location}</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                        {upcomingEvents.length === 0 && (
                            <div className="md:col-span-2 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="font-semibold text-lg">Yaklaşan bir etkinliğiniz bulunmuyor.</h3>
                                <p className="text-muted-foreground mb-4">Yeni etkinlikleri keşfetmeye ne dersiniz?</p>
                                <Button asChild>
                                    <Link href="/portal/events/discover">Etkinlik Keşfet</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Son Aktiviteler</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {recentActivity.map((activity, index) => (
                                <div key={index} className="flex items-start">
                                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary mt-1.5" />
                                    <div className="ml-4">
                                        <p className="text-sm">{activity.description}</p>
                                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-4 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Önerilen Kurslar</CardTitle>
                        <CardDescription>
                            Sizin için seçtiğimiz eğitim içerikleri.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-sm">BIM ile Proje Yönetimi</h3>
                            <p className="text-sm text-muted-foreground">BIM araçlarıyla etkili proje yönetimi tekniklerini öğrenin.</p>
                            <Button variant="link" size="sm" className="p-0 h-auto mt-1">Kursa Git</Button>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">İleri Düzey Parametrik Modelleme</h3>
                            <p className="text-sm text-muted-foreground">Karmaşık yapıları parametrik modelleme ile oluşturun.</p>
                            <Button variant="link" size="sm" className="p-0 h-auto mt-1">Kursa Git</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}

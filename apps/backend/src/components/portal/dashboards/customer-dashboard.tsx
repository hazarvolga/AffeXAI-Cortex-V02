
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Briefcase, PlayCircle, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { events } from "@/lib/events-data";
import Image from "next/image";

const quickLinks = [
    { title: "Lisans Bilgilerim", icon: FileText, href: "/portal/licenses" },
    { title: "Destek Taleplerim", icon: Briefcase, href: "/portal/support" },
    { title: "Eğitim Videoları", icon: PlayCircle, href: "/portal/videos" },
    { title: "Son İndirmeler", icon: Download, href: "/portal/downloads" },
];

const recentActivity = [
    { description: "Allplan 2024 Kurulum Kılavuzu'nu indirdiniz.", time: "2 saat önce" },
    { description: "Destek talebiniz güncellendi: #78945", time: "1 gün önce" },
    { description: "'İleri Düzey Modelleme' webinar kaydını izlediniz.", time: "3 gün önce" },
];

export default function CustomerDashboard() {
    const upcomingEvents = events.filter(e => new Date(e.date) > new Date()).slice(0, 2);

    return (
        <>
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Hoş Geldiniz! (Customer View)</h2>
                    <p className="text-muted-foreground">
                        Kullanıcı portalınıza genel bir bakış.
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
                                    <Image src={event.imageUrl} alt={event.title} fill className="object-cover transition-transform group-hover:scale-105" />
                                </div>
                                <CardContent className="p-4">
                                     <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{event.title}</h3>
                                    <p className="text-sm text-muted-foreground">{event.location.city}</p>
                                </CardContent>
                            </Card>
                           </Link>
                       ))}
                       {upcomingEvents.length === 0 && (
                           <div className="md:col-span-2 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                                <Calendar className="h-12 w-12 text-muted-foreground mb-4"/>
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
                        <CardTitle>Öne Çıkanlar</CardTitle>
                        <CardDescription>
                            Sizin için seçtiğimiz en son haberler ve güncellemeler.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div>
                           <h3 className="font-semibold text-sm">Allplan 2024.1 Güncellemesi Yayınlandı</h3>
                           <p className="text-sm text-muted-foreground">Performans iyileştirmeleri ve yeni özellikler içeriyor. Hemen indirin!</p>
                           <Button variant="link" size="sm" className="p-0 h-auto mt-1">Daha Fazla Bilgi</Button>
                       </div>
                       <div>
                           <h3 className="font-semibold text-sm">Yeni Webinar: Köprü Tasarımında Otomasyon</h3>
                           <p className="text-sm text-muted-foreground">Uzmanlarımızdan Allplan Bridge'in inceliklerini öğrenin. Kayıtlar başladı.</p>
                           <Button variant="link" size="sm" className="p-0 h-auto mt-1">Şimdi Kaydol</Button>
                       </div>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}

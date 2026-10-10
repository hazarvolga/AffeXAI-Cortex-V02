'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Award, BookOpen, Mail } from "lucide-react";
import Link from "next/link";

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

export function StudentQuickLinks() {
    return (
        <>
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
        </>
    );
}

export function StudentRecentActivity() {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Son Aktiviteler (Student)</CardTitle>
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
    );
}

export function StudentRecommendedCourses() {
    return (
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
    );
}

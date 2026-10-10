
'use client'

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Users, Bot, MailOpen, ThumbsUp, LifeBuoy, DollarSign, Calendar, Send, Share2 } from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  CartesianGrid
} from "recharts"
import { socialAccounts, getPlatformIcon } from "@/lib/social-media-data";
import { events } from "@/lib/events-data";
import { campaigns } from "@/lib/newsletter-data";

const kpiCards = [
    { title: "Toplam Gelir", value: "₺45,231", change: "+20.1%", icon: DollarSign },
    { title: "Yeni Kullanıcılar", value: "+2,350", change: "+180.1%", icon: Users },
    { title: "AI İçerik Üretimi", value: "128", change: "Son 7 gün", icon: Bot },
    { title: "Email Performansı", value: "25.5%", change: "Açılma Oranı", icon: MailOpen },
    { title: "Sosyal Etkileşim", value: "1.2K", change: "+12% hafta", icon: ThumbsUp },
    { title: "Açık Destek Talebi", value: "14", change: "2 acil", icon: LifeBuoy },
];

const trendData = [
  { date: "Pzt", users: 20, aiContent: 5, revenue: 200 },
  { date: "Sal", users: 35, aiContent: 8, revenue: 350 },
  { date: "Çar", users: 30, aiContent: 6, revenue: 300 },
  { date: "Per", users: 45, aiContent: 12, revenue: 450 },
  { date: "Cum", users: 40, aiContent: 10, revenue: 400 },
  { date: "Cmt", users: 55, aiContent: 15, revenue: 550 },
  { date: "Paz", users: 60, aiContent: 18, revenue: 600 },
]

export default function AdminDashboard() {
    const upcomingEvent = events.find(e => new Date(e.date) >= new Date());
    const sentCampaigns = campaigns.filter(c => c.status === 'gönderildi').length;
    const scheduledCampaigns = campaigns.filter(c => c.status === 'planlandı').length;
    const connectedSocialAccounts = socialAccounts.filter(a => a.isConnected).length;

  return (
    <>
         <div className="flex items-center justify-between space-y-2">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Admin Paneli (Portal Görünümü)</h2>
                <p className="text-muted-foreground">
                    Tüm sistem verilerine üst düzey bir bakış.
                </p>
            </div>
            <Button asChild>
                <Link href="/admin">Yönetim Paneline Git</Link>
            </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {kpiCards.map(card => (
                <Card key={card.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <card.icon className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                        <p className="text-xs text-muted-foreground">{card.change}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Calendar className="h-5 w-5"/> Yaklaşan Etkinlikler</CardTitle>
                </CardHeader>
                <CardContent>
                    {upcomingEvent ? (
                        <div>
                            <p className="font-semibold">{upcomingEvent.title}</p>
                            <p className="text-sm text-muted-foreground">{new Date(upcomingEvent.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Planlanmış etkinlik yok.</p>
                    )}
                </CardContent>
                 <CardFooter className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Toplam {events.length} etkinlik</p>
                    <Button asChild size="sm" variant="outline">
                       <Link href="/admin/events">Tümünü Gör <ArrowUpRight className="h-4 w-4 ml-2" /></Link>
                    </Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Send className="h-5 w-5"/> Email Kampanyaları</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-around">
                    <div className="text-center"><p className="text-2xl font-bold">{sentCampaigns}</p><p className="text-xs text-muted-foreground">Gönderildi</p></div>
                    <div className="text-center"><p className="text-2xl font-bold">{scheduledCampaigns}</p><p className="text-xs text-muted-foreground">Planlandı</p></div>
                </CardContent>
                 <CardFooter className="flex justify-end">
                    <Button asChild size="sm" variant="outline">
                       <Link href="/admin/newsletter">Tümünü Gör <ArrowUpRight className="h-4 w-4 ml-2" /></Link>
                    </Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Share2 className="h-5 w-5"/> Sosyal Medya</CardTitle>
                </CardHeader>
                 <CardContent className="flex items-center gap-4">
                    <div className="flex -space-x-2 overflow-hidden">
                       {socialAccounts.map(account => {
                           const Icon = getPlatformIcon(account.platform);
                           return <div key={account.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-muted flex items-center justify-center"><Icon className="h-4 w-4 text-muted-foreground"/></div>
                       })}
                    </div>
                    <p className="text-sm text-muted-foreground">{connectedSocialAccounts} / {socialAccounts.length} hesap bağlı.</p>
                 </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button asChild size="sm" variant="outline">
                       <Link href="/admin/social-media">Tümünü Gör <ArrowUpRight className="h-4 w-4 ml-2" /></Link>
                    </Button>
                </CardFooter>
            </Card>
            <div className="lg:col-span-3">
                 <Card>
                    <CardHeader>
                        <CardTitle>Haftalık Trendler</CardTitle>
                        <CardDescription>Yeni kullanıcı, AI içerik üretimi ve gelir trendleri.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${'₺'}${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: "hsl(var(--muted))" }}
                                    contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="users" name="Yeni Kullanıcılar" stroke="hsl(var(--primary))" strokeWidth={2} />
                                <Line type="monotone" dataKey="aiContent" name="AI İçerikleri" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                                <Line type="monotone" dataKey="revenue" name="Gelir (₺)" stroke="hsl(var(--chart-4))" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    </>
  );
}

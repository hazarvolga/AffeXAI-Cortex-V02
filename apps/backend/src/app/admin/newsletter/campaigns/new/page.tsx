
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Calendar, Clock, Send, Eye, Sparkles } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

// This is a placeholder for a real rich text editor like Tiptap, TinyMCE, etc.
const RichTextEditorPlaceholder = () => (
    <div className="w-full h-96 rounded-md border bg-muted p-4">
        <div className="flex gap-2 mb-4 border-b pb-2">
            <Button variant="outline" size="sm">Kalın</Button>
            <Button variant="outline" size="sm">İtalik</Button>
            <Button variant="outline" size="sm">Link</Button>
            <Button variant="link" size="sm" className="text-primary gap-1">
                <Sparkles className="h-4 w-4"/> AI ile Yaz
            </Button>
        </div>
        <div className="mt-4 text-muted-foreground">
            Burası zengin metin editörünün (rich text editor) geleceği yerdir. E-posta içeriğinizi burada oluşturacaksınız.
        </div>
    </div>
);

export default function NewCampaignPage() {
    return (
        <div className="space-y-8">
             <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Yeni Email Kampanyası</h1>
                <p className="text-muted-foreground">Yeni bir e-posta kampanyası oluşturun ve hedef kitlenize gönderin.</p>
            </div>

             <form className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Kampanya İçeriği</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="campaign-title">Kampanya Başlığı (Dahili)</Label>
                                <Input id="campaign-title" placeholder="Örn: Eylül 2024 Bülteni"/>
                                <p className="text-xs text-muted-foreground">Bu başlık sadece panelde görünür ve size özeldir.</p>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="subject">E-posta Konusu</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="subject" placeholder="Abonelerinizin gelen kutusunda göreceği konu" className="flex-grow"/>
                                    <Button variant="outline" size="icon" type="button" aria-label="AI ile konu önerisi al">
                                        <Sparkles className="h-4 w-4 text-primary"/>
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">AI ikonuna tıklayarak içerikle uyumlu konu başlığı önerileri alabilirsiniz.</p>
                            </div>
                             <div className="space-y-2">
                                <Label>İçerik</Label>
                                <RichTextEditorPlaceholder />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-8 sticky top-24">
                     <Card>
                        <CardHeader>
                            <CardTitle>Gönderim</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label>Alıcılar</Label>
                                <p className="text-sm text-muted-foreground">Aktif <strong>{1250}</strong> aboneye gönderilecek.</p>
                            </div>
                            <Button variant="link" className="p-0 h-auto">Alıcıları Filtrele</Button>
                            <Separator/>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Gönderim Zamanı</Label>
                                     <Button variant="link" size="sm" className="p-0 h-auto text-primary gap-1 text-xs">
                                        <Sparkles className="h-3 w-3"/> En İyi Zamanı Öner
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <Input type="date"/>
                                    <Input type="time"/>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            <Button className="w-full"><Clock className="mr-2 h-4 w-4"/> Kampanyayı Planla</Button>
                            <Button variant="secondary" className="w-full"><Send className="mr-2 h-4 w-4"/> Şimdi Gönder</Button>
                            <Button variant="ghost" className="w-full"><Eye className="mr-2 h-4 w-4"/> Önizle ve Test Maili Gönder</Button>
                        </CardFooter>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Kaydet</CardTitle>
                        </CardHeader>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" asChild><Link href="/admin/newsletter">İptal</Link></Button>
                            <Button><Save className="mr-2 h-4 w-4"/> Taslak Olarak Kaydet</Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </div>
    );
}

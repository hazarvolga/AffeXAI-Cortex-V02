
'use client';

import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Check, Mail, Rocket, FileText } from 'lucide-react';
import Link from 'next/link';

export function NewsletterSection() {
    return (
        <section className="w-full py-16 md:py-24 bg-secondary/30">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Newsletter Panel */}
                    <div className="lg:col-span-3">
                        <Card className="h-full flex flex-col">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <Mail className="h-6 w-6 text-primary" />
                                    <CardTitle className="text-2xl font-headline">Bültenimize Abone Olun</CardTitle>
                                </div>
                                <CardDescription>
                                    ALLPLAN güncellemelerini ilk öğrenen siz olun.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-6">
                                <ul className="space-y-3 text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                                        <span>En son sürüm duyuruları ve yenilikler</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                                        <span>Etkinliklere, eğitimlere ve webinarlara özel davetiyeler</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                                        <span>Sektör, şirket ve ürün haberleri</span>
                                    </li>
                                </ul>
                                <form className="space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <Input placeholder="Adınız Soyadınız" type="text" />
                                        <Input placeholder="E-posta Adresiniz" type="email" />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="terms" />
                                        <Label htmlFor="terms" className="text-xs text-muted-foreground">
                                            <Link href="/privacy" className="underline hover:text-primary">Gizlilik politikamızı</Link> okudum ve kabul ediyorum.
                                        </Label>
                                    </div>
                                    <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                                        Şimdi Abone Ol
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Offers Panel */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-headline flex items-center gap-3">
                                    <Rocket className="h-6 w-6 text-accent"/>
                                    ALLPLAN'ı Deneyin veya Teklif Alın
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row lg:flex-col gap-4">
                                <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                                    14 Günlük Ücretsiz Deneme
                                </Button>
                                <Button size="lg" variant="outline" className="w-full">
                                    Teklif İste
                                </Button>
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle className="text-xl font-headline flex items-center gap-3">
                                    <FileText className="h-6 w-6 text-primary"/>
                                    Paketleri Karşılaştırın
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <Link href="#" className="text-sm font-medium text-primary hover:underline">Allplan Paket Karşılaştırması</Link>
                                <Link href="#" className="text-sm font-medium text-primary hover:underline">BIMPLUS Paket Karşılaştırması</Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
}

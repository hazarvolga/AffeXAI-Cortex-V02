import { PageHero } from "@/components/common/page-hero";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MapPin, Building, User, MailQuestion } from "lucide-react";

const contactInfo = [
    { icon: Mail, text: "info@aluplan.com.tr", href: "mailto:info@aluplan.com.tr" },
    { icon: Phone, text: "+90 216 123 45 67", href: "tel:+902161234567" },
    { icon: MapPin, text: "Örnek Mah. Teknoloji Cad. No:123, Ataşehir/İstanbul", href: "#" }
];

export default function ContactPage() {
    return (
        <div>
            <PageHero 
                title="İletişim"
                subtitle="Uzman ekibimizle tanışın ve dijital dönüşüm yolculuğunuzda size nasıl yardımcı olabileceğimizi öğrenin."
            />
            <Breadcrumb items={[{ name: 'İletişim', href: '/contact' }]} />
            <div className="container mx-auto py-16 px-4">
                <div className="grid lg:grid-cols-5 gap-12">
                    {/* Contact Form */}
                    <div className="lg:col-span-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Bize Mesaj Gönderin</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-6">
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Adınız Soyadınız</Label>
                                            <Input id="name" placeholder="Adınız Soyadınız" icon={User} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="company">Firma Adı</Label>
                                            <Input id="company" placeholder="Firma Adınız" icon={Building} />
                                        </div>
                                    </div>
                                     <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">E-posta Adresiniz</Label>
                                            <Input id="email" type="email" placeholder="E-posta Adresiniz" icon={Mail} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Telefon Numaranız</Label>
                                            <Input id="phone" type="tel" placeholder="Telefon Numaranız" icon={Phone} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Konu</Label>
                                        <Select>
                                            <SelectTrigger id="subject">
                                                <SelectValue placeholder="İletişim nedeninizi seçin..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sales">Satış ve Teklif</SelectItem>
                                                <SelectItem value="support">Teknik Destek</SelectItem>
                                                <SelectItem value="training">Eğitim ve Danışmanlık</SelectItem>
                                                <SelectItem value="other">Diğer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message">Mesajınız</Label>
                                        <Textarea id="message" placeholder="Mesajınızı buraya yazın..." className="min-h-[120px]" />
                                    </div>
                                    <Button type="submit" className="w-full">
                                        <MailQuestion className="mr-2 h-4 w-4"/>
                                        Mesajı Gönder
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                    {/* Contact Details & Map */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>İletişim Bilgilerimiz</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {contactInfo.map(info => (
                                    <a key={info.text} href={info.href} className="flex items-start gap-4 group">
                                        <info.icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">{info.text}</span>
                                    </a>
                                ))}
                            </CardContent>
                        </Card>
                        <Card>
                             <CardContent className="p-0">
                                <div className="aspect-video w-full">
                                    {/* Replace with a real map component or an iframe */}
                                    <iframe 
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3010.889923812745!2d29.12345671540916!3d40.99987697930198!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cac68a127f3f3f%3A0x92cf1a23e5a5966!2sAta%C5%9Fehir%2C%20%C4%B0stanbul!5e0!3m2!1str!2str!4v1678886543210!5m2!1str!2str" 
                                        width="100%" 
                                        height="100%" 
                                        style={{ border: 0 }} 
                                        allowFullScreen={false}
                                        loading="lazy" 
                                        referrerPolicy="no-referrer-when-downgrade"
                                        className="rounded-lg"
                                    ></iframe>
                                </div>
                             </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Event } from "@/lib/events-data";
import { Calendar as CalendarIcon, Save, Trash2, PlusCircle, Award, Image as ImageIcon, Ticket, X, Euro } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { useState } from "react";
import Link from "next/link";
import { Separator } from "../ui/separator";

type TicketType = {
    name: string;
    price: string;
    quantity: string;
};

type EventFormProps = {
    event?: Event;
};

const initialTicketTypes: TicketType[] = [
    { name: 'Genel Giriş', price: '50', quantity: '100' },
    { name: 'VIP', price: '150', quantity: '20' },
];

export function EventForm({ event }: EventFormProps) {
    const isEditing = !!event;
    const [date, setDate] = useState<Date | undefined>(event ? new Date(event.date) : undefined);
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>(isEditing ? initialTicketTypes : [{ name: 'Genel Giriş', price: '0', quantity: '100' }]);

    const handleAddTicketType = () => {
        setTicketTypes([...ticketTypes, { name: '', price: '', quantity: '' }]);
    };
    
    const handleRemoveTicketType = (indexToRemove: number) => {
        setTicketTypes(ticketTypes.filter((_, index) => index !== indexToRemove));
    };

    const handleTicketTypeChange = (index: number, field: keyof TicketType, value: string) => {
        const newTicketTypes = [...ticketTypes];
        newTicketTypes[index][field] = value;
        setTicketTypes(newTicketTypes);
    };

    return (
        <form className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Etkinlik Detayları</CardTitle>
                            <CardDescription>Etkinliğinizin adını, açıklamasını ve temel bilgilerini girin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Etkinlik Başlığı</Label>
                                <Input id="title" placeholder="Örn: Allplan 2025 Lansmanı" defaultValue={event?.title} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Etkinlik Açıklaması</Label>
                                <Textarea id="description" placeholder="Etkinliğiniz hakkında detaylı bilgi verin..." defaultValue={event?.description} className="min-h-[150px]" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Bilet ve Kayıt</CardTitle>
                            <CardDescription>Etkinliğiniz için bilet türlerini, fiyatlarını ve kontenjanları yönetin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {ticketTypes.map((ticket, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-4 items-center gap-4 p-4 border rounded-lg">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor={`ticket-name-${index}`}>Bilet Türü Adı</Label>
                                        <Input id={`ticket-name-${index}`} value={ticket.name} onChange={(e) => handleTicketTypeChange(index, 'name', e.target.value)} placeholder="Genel Giriş"/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`ticket-price-${index}`}>Fiyat (TL)</Label>
                                        <Input id={`ticket-price-${index}`} type="number" value={ticket.price} onChange={(e) => handleTicketTypeChange(index, 'price', e.target.value)} placeholder="50"/>
                                    </div>
                                    <div className="flex items-end h-full gap-2">
                                        <div className="space-y-2 flex-1">
                                            <Label htmlFor={`ticket-quantity-${index}`}>Miktar</Label>
                                            <Input id={`ticket-quantity-${index}`} type="number" value={ticket.quantity} onChange={(e) => handleTicketTypeChange(index, 'quantity', e.target.value)} placeholder="100"/>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveTicketType(index)} className="shrink-0" disabled={ticketTypes.length <= 1}>
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                             <Button type="button" variant="outline" onClick={handleAddTicketType}>
                                <PlusCircle className="mr-2 h-4 w-4"/> Yeni Bilet Türü Ekle
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Sertifika</CardTitle>
                            <CardDescription>Bu etkinlik sonunda katılımcılara sertifika verilip verilmeyeceğini ayarlayın.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="flex items-center space-x-2">
                                <Checkbox id="grantsCertificate" defaultChecked={event?.grantsCertificate} />
                                <label htmlFor="grantsCertificate" className="text-sm font-medium leading-none flex items-center gap-2">
                                <Award className="h-4 w-4 text-primary" /> Katılımcılara Sertifika Ver
                                </label>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="certificateTitle">Verilecek Sertifika Adı</Label>
                                <Input id="certificateTitle" placeholder="Örn: Allplan Katılım Sertifikası" defaultValue={event?.certificateTitle} />
                            </div>
                        </CardContent>
                    </Card>

                </div>
                <div className="lg:col-span-1 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Yayınlama</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Etkinliğinizin durumunu buradan yönetin.</p>
                            <Select defaultValue={isEditing ? 'published' : 'draft'}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="published">Yayınlandı</SelectItem>
                                    <SelectItem value="draft">Taslak</SelectItem>
                                    <SelectItem value="archived">Arşivlendi</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" asChild><Link href="/admin/events">İptal</Link></Button>
                            <Button><Save className="mr-2 h-4 w-4"/> {isEditing ? 'Etkinliği Güncelle' : 'Etkinliği Kaydet'}</Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Organizasyon</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Kapak Resmi</Label>
                                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10">
                                    <div className="text-center">
                                        <ImageIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                                        <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80">
                                            <span>Dosya seç</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                                            </label>
                                            <p className="pl-1">veya sürükleyip bırak</p>
                                        </div>
                                        <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF (800x450px önerilir)</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Tarih ve Saat</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP HH:mm") : <span>Bir tarih seçin</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                                        <div className="p-2 border-t">
                                            <Input type="time" defaultValue={date ? format(date, "HH:mm") : "10:00"}/>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label>Kategori</Label>
                                <Select defaultValue={event?.category}>
                                    <SelectTrigger><SelectValue placeholder="Bir kategori seçin"/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Webinar">Webinar</SelectItem>
                                        <SelectItem value="Workshop">Workshop</SelectItem>
                                        <SelectItem value="Lansman">Lansman</SelectItem>
                                        <SelectItem value="Zirve">Zirve</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="isOnline" defaultChecked={event?.isOnline}/>
                                <label htmlFor="isOnline" className="text-sm font-medium leading-none">
                                    Etkinlik Çevrimiçi (Online)
                                </label>
                            </div>
                            <div className="space-y-2">
                                <Label>Mekan</Label>
                                <Input placeholder="Örn: Swissôtel The Bosphorus" defaultValue={event?.location.venue}/>
                            </div>
                            <div className="space-y-2">
                                <Label>Şehir</Label>
                                <Input placeholder="İstanbul" defaultValue={event?.location.city}/>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}

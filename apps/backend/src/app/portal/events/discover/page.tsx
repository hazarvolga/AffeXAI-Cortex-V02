
'use client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Tag, Calendar, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { events, Event } from "@/lib/events-data";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";

const EventCard = ({ event }: { event: Event }) => (
    <Card className="flex flex-col overflow-hidden group transition-shadow hover:shadow-lg">
        <Link href={`/portal/events/${event.id}`} className="block">
            <div className="relative aspect-[16/9] overflow-hidden">
                <Image 
                    src={event.imageUrl} 
                    alt={event.title} 
                    fill 
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <Badge className="absolute top-2 right-2" variant={event.isOnline ? "secondary" : "default"}>
                    {event.isOnline ? "Online" : "Yüz Yüze"}
                </Badge>
            </div>
        </Link>
        <CardHeader>
            <Link href={`/portal/events/${event.id}`}>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">{event.title}</CardTitle>
            </Link>
            <CardDescription>{new Date(event.date).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' })}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{event.isOnline ? "Çevrimiçi" : `${event.location.venue}, ${event.location.city}`}</span>
            </div>
            <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span>{event.category}</span>
            </div>
        </CardContent>
        <CardFooter>
            <Button asChild className="w-full">
                <Link href={`/portal/events/${event.id}`}>
                    Detayları Görüntüle <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
    </Card>
);

export default function DiscoverEventsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('all');
    const [location, setLocation] = useState('all');
    const [date, setDate] = useState<Date | undefined>(undefined);

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || event.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = category === 'all' || event.category === category;
        
        const eventLocation = event.isOnline ? 'Online' : event.location.city;
        const matchesLocation = location === 'all' || eventLocation === location;

        const matchesDate = !date || new Date(event.date).toDateString() === date.toDateString();
        return matchesSearch && matchesCategory && matchesLocation && matchesDate;
    });

    const resetFilters = () => {
        setSearchTerm('');
        setCategory('all');
        setLocation('all');
        setDate(undefined);
    };

    const categories = [...new Set(events.map(e => e.category))];
    const locations = [...new Set(events.filter(e=>!e.isOnline).map(e => e.location.city))];

    return (
        <div className="flex-1 space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Etkinlik Keşfet</h2>
                <p className="text-muted-foreground">İlgi alanlarınıza uygun yeni etkinlikler bulun.</p>
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                        <div className="lg:col-span-2">
                            <Label htmlFor="search-event" className="text-sm font-medium">Etkinlik Ara</Label>
                            <Input 
                                id="search-event"
                                placeholder="Etkinlik adı, açıklama..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div>
                             <Label htmlFor="category-filter" className="text-sm font-medium">Kategori</Label>
                             <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger id="category-filter"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Kategoriler</SelectItem>
                                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div>
                             <Label htmlFor="location-filter" className="text-sm font-medium">Lokasyon</Label>
                             <Select value={location} onValueChange={setLocation}>
                                <SelectTrigger id="location-filter"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Lokasyonlar</SelectItem>
                                     {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                                     <SelectItem value="Online">Online</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="date-filter" className="text-sm font-medium">Tarih</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="date-filter"
                                    variant={"outline"}
                                    className="w-full justify-start text-left font-normal"
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Bir tarih seçin</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <CalendarPicker
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                     <div className="flex justify-end mt-4">
                        <Button variant="ghost" onClick={resetFilters}>
                            <X className="mr-2 h-4 w-4" />
                            Filtreleri Temizle
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredEvents.map(event => <EventCard key={event.id} event={event} />)}
                {filteredEvents.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground py-10 flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-lg">
                        <Search className="h-12 w-12 text-muted-foreground/50"/>
                        <p>Aramanızla eşleşen bir etkinlik bulunamadı.</p>
                        <Button variant="outline" onClick={resetFilters}>Filtreleri Sıfırla</Button>
                    </div>
                )}
            </div>
        </div>
    );
}

    
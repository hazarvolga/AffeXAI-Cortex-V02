'use client';

import { EventForm } from "@/components/admin/event-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, PlusCircle, X, FileText, Edit, Trash2, Share2 } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SocialMediaManager } from "@/components/admin/social-media/social-media-manager";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import eventsService from "@/lib/api/eventsService";
import { Event as BackendEvent } from "@/lib/api/eventsService";
import { use } from "react";

// Map backend event to frontend event type
interface FrontendEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  imageUrl: string;
  isOnline: boolean;
  location: {
    venue: string;
    address: string;
    city: string;
    country: string;
  };
  organizer: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  isFavorite?: boolean;
  grantsCertificate?: boolean;
  certificateTitle?: string;
  attendees?: any[];
  assessments?: any[];
}

export default function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
    // Unwrap the params promise using React.use()
    const unwrappedParams = use(params);
    const { eventId } = unwrappedParams;
    
    const [event, setEvent] = useState<FrontendEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasFetchedEvent = useRef(false);
    const router = useRouter();

    useEffect(() => {
        // Prevent multiple fetches
        if (hasFetchedEvent.current) return;
        hasFetchedEvent.current = true;
        
        const fetchEvent = async () => {
            try {
                setLoading(true);
                // Fetch event from backend
                const backendEvent: BackendEvent = await eventsService.getEventById(eventId);
                
                // Map backend event to frontend format
                const frontendEvent: FrontendEvent = {
                    id: backendEvent.id,
                    title: backendEvent.title,
                    description: backendEvent.description,
                    category: 'Etkinlik', // Default category since it's not in backend model
                    date: backendEvent.startDate,
                    imageUrl: 'https://picsum.photos/seed/event1/800/450', // Default image
                    isOnline: false, // Default value
                    location: {
                        venue: backendEvent.location,
                        address: backendEvent.location,
                        city: 'İstanbul', // Default city
                        country: 'Türkiye' // Default country
                    },
                    organizer: {
                        id: 'org-01', // Default organizer
                        name: 'Aluplan Digital', // Default organizer
                        avatarUrl: 'https://i.pravatar.cc/150?u=aluplan' // Default avatar
                    },
                    isFavorite: false, // Default value
                    grantsCertificate: true, // Default value
                    certificateTitle: `${backendEvent.title} Katılım Sertifikası`, // Default certificate title
                    attendees: [], // Empty for now
                    assessments: [] // Empty for now
                };
                
                setEvent(frontendEvent);
                setError(null);
            } catch (err: any) {
                console.error('Error fetching event:', err);
                if (err.response?.status === 404) {
                    notFound();
                } else {
                    setError('Etkinlik bilgileri yüklenirken bir hata oluştu.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, []); // Empty dependency array since we're using useRef to prevent multiple calls

    if (loading) {
        return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 py-12">{error}</div>;
    }

    if (!event) {
        notFound();
        return null;
    }

    return (
        <div className="space-y-8">
             <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Etkinlik Yönetimi: {event.title}</h1>
                <p className="text-muted-foreground">Etkinlik detaylarını düzenleyin, katılımcıları ve değerlendirmeleri yönetin.</p>
            </div>

            <Tabs defaultValue="edit">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="edit">Etkinliği Düzenle</TabsTrigger>
                    <TabsTrigger value="attendees">Katılımcılar ({event.attendees?.length || 0})</TabsTrigger>
                    <TabsTrigger value="assessments">Değerlendirmeler ({event.assessments?.length || 0})</TabsTrigger>
                    <TabsTrigger value="social">Sosyal Medyada Paylaş</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="mt-6">
                     <EventForm event={event} />
                </TabsContent>
                <TabsContent value="attendees" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Katılımcı Yönetimi</CardTitle>
                            <CardDescription>
                                "{event.title}" etkinliğine kayıtlı katılımcıların listesi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ad Soyad</TableHead>
                                        <TableHead>E-posta</TableHead>
                                        <TableHead>Bilet ID</TableHead>
                                        <TableHead>Sertifika Durumu</TableHead>
                                        <TableHead className="text-right">Eylemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {event.attendees?.map((attendee: any) => (
                                        <TableRow key={attendee.id}>
                                            <TableCell className="font-medium">{attendee.name}</TableCell>
                                            <TableCell>{attendee.email}</TableCell>
                                            <TableCell className="font-mono text-xs">{attendee.ticketId}</TableCell>
                                            <TableCell>
                                                {attendee.certificateId ? (
                                                    <Badge variant="default" className="bg-green-600 flex items-center w-fit gap-1">
                                                        <Check className="h-3 w-3" /> Verildi
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="flex items-center w-fit gap-1">
                                                        <X className="h-3 w-3" /> Verilmedi
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {!attendee.certificateId && event.grantsCertificate && (
                                                    <Button asChild size="sm">
                                                        <Link href={`/admin/certificates/new?userName=${encodeURIComponent(attendee.name)}&userEmail=${encodeURIComponent(attendee.email)}&certificateName=${encodeURIComponent(event.certificateTitle || '')}&eventId=${event.id}`}>
                                                            <PlusCircle className="mr-2 h-4 w-4"/> Sertifika Oluştur
                                                        </Link>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(event.attendees?.length === 0 || !event.attendees) && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                                Bu etkinlik için henüz kayıtlı katılımcı bulunmuyor.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="assessments" className="mt-6">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Değerlendirmeler</CardTitle>
                                <CardDescription>
                                    Etkinlik için oluşturulan sınavlar ve anketler.
                                </CardDescription>
                            </div>
                            <Button variant="outline" type="button">
                                <PlusCircle className="mr-2 h-4 w-4" /> Yeni Değerlendirme Ekle
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Başlık</TableHead>
                                        <TableHead>Türü</TableHead>
                                        <TableHead>Soru Sayısı</TableHead>
                                        <TableHead className="text-right">Eylemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {event.assessments?.map((assessment: any) => (
                                        <TableRow key={assessment.id}>
                                            <TableCell className="font-medium">{assessment.title}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{assessment.type === 'quiz' ? 'Quiz' : 'Anket'}</Badge>
                                            </TableCell>
                                            <TableCell>{assessment.questions?.length || 0}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                    <Button
                                                        aria-haspopup="true"
                                                        size="icon"
                                                        variant="ghost"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <Edit className="mr-2 h-4 w-4" /> Düzenle
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <FileText className="mr-2 h-4 w-4" /> Sonuçları Gör
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Sil
                                                    </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!event.assessments || event.assessments.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                                Bu etkinlik için henüz değerlendirme oluşturulmamış.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="social" className="mt-6">
                    <SocialMediaManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}
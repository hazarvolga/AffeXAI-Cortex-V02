'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, PlusCircle, X, FileText, Edit, Trash2, Share2, Award, Users, Clock, Calendar as CalendarIcon, Upload } from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/loading/skeleton";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import eventsService from "@/lib/api/eventsService";
import { Event, EventWithUIData } from '@affexai/shared-types';
import { use } from "react";
import { siteSettingsData } from '@/lib/site-settings-data';
import { SiteSettings } from '@affexai/shared-types';

interface ExtendedEventWithUIData extends EventWithUIData {
    assessments?: any[];
}

// Lazy load heavy components
const EventForm = dynamic(
    () => import("@/components/admin/event-form").then(mod => ({ default: mod.EventForm })),
    {
        loading: () => <Skeleton className="h-[800px] w-full" />,
        ssr: false,
    }
);

const SocialMediaManager = dynamic(
    () => import("@/components/admin/social-media/social-media-manager").then(mod => ({ default: mod.SocialMediaManager })),
    {
        loading: () => <Skeleton className="h-[600px] w-full" />,
        ssr: false,
    }
);

export default function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
    // Unwrap the params promise using React.use()
    const unwrappedParams = use(params);
    const { eventId } = unwrappedParams;

    const [event, setEvent] = useState<ExtendedEventWithUIData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasFetchedEvent = useRef(false);
    const router = useRouter();

    // Certificate templates state
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

    // Certificate form state
    const [certificateName, setCertificateName] = useState<string>('');
    const [certificateDescription, setCertificateDescription] = useState<string>('');

    // Helper function to get company name from site settings
    const getCompanyName = () => {
        return siteSettingsData.companyName || 'XYZ Company';
    };

    // Helper function to generate default description
    const generateDefaultDescription = (programName: string) => {
        const companyName = getCompanyName();
        return `${programName} eğitimini başarıyla tamamladınız.
Gösterdiğiniz özveri, ilgi ve öğrenme isteğiniz için teşekkür ederiz.

Bu sertifika, eğitim sürecinde edindiğiniz bilgi ve yetkinliklerin bir göstergesidir.
${companyName} olarak, sürekli gelişim yolculuğunuzda yanınızda olmaktan memnuniyet duyuyoruz.

Başarılarınızın devamını diler, gelecekteki çalışmalarınızda üstün başarılar temenni ederiz.

Saygılarımızla,
${companyName}`;
    };

    const fetchEvent = async () => {
        try {
            console.log('🔍 Fetching event:', eventId);
            setLoading(true);
            // Fetch event from backend
            const backendEvent: Event = await eventsService.getById(eventId);

            console.log('📥 Backend event received:', {
                id: backendEvent.id,
                title: backendEvent.title,
                grantsCertificate: backendEvent.grantsCertificate,
                certificateTitle: backendEvent.certificateTitle
            });

            // Map backend event to frontend format with UI data
            // Map backend event to frontend format with UI data
            const frontendEvent: ExtendedEventWithUIData = {
                ...backendEvent,
                // Add UI-specific fields
                imageUrl: 'https://picsum.photos/seed/event1/800/450',
                isFavorite: false,
                // Parse metadata for easier access
                category: backendEvent.metadata?.category || 'Etkinlik',
                isOnline: backendEvent.metadata?.isOnline || false,
                ticketTypes: backendEvent.metadata?.ticketTypes || [],
                // Location breakdown (if needed, can be enhanced)
                city: 'İstanbul',
                country: 'Türkiye',
                assessments: [],
            };

            console.log('🔄 Setting event state with:', { grantsCertificate: frontendEvent.grantsCertificate });
            setEvent({ ...frontendEvent }); // Force new object reference for React re-render

            // Initialize certificate form fields
            const certName = frontendEvent.certificateTitle || frontendEvent.title;
            setCertificateName(certName);
            setCertificateDescription(generateDefaultDescription(certName));

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

    useEffect(() => {
        // Prevent multiple fetches
        if (hasFetchedEvent.current) return;
        hasFetchedEvent.current = true;

        fetchEvent();
    }, []); // Empty dependency array since we're using useRef to prevent multiple calls

    // Fetch certificate templates
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                setLoadingTemplates(true);
                const certificatesService = (await import('@/lib/api/certificatesService')).default;
                const data = await certificatesService.getTemplates();
                setTemplates(data);
                // Set first template as default
                if (data.length > 0) {
                    setSelectedTemplateId(data[0].id);
                }
            } catch (err) {
                console.error('Error fetching templates:', err);
            } finally {
                setLoadingTemplates(false);
            }
        };

        fetchTemplates();
    }, []);

    // Callback to refetch event after update
    const handleEventUpdate = () => {
        console.log('🔄 handleEventUpdate called, fetching updated event...');
        fetchEvent();
    };

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
                <TabsList className={`grid w-full ${event.grantsCertificate ? 'grid-cols-5' : 'grid-cols-4'}`}>
                    <TabsTrigger value="edit">Etkinliği Düzenle</TabsTrigger>
                    {event.grantsCertificate && (
                        <TabsTrigger value="certificate">Sertifika Ayarları</TabsTrigger>
                    )}
                    <TabsTrigger value="attendees">Katılımcılar ({event.attendees?.length || 0})</TabsTrigger>
                    <TabsTrigger value="assessments">Değerlendirmeler ({event.assessments?.length || 0})</TabsTrigger>
                    <TabsTrigger value="social">Sosyal Medyada Paylaş</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="mt-6">
                    <EventForm event={event} onUpdate={handleEventUpdate} />
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
                                                            <PlusCircle className="mr-2 h-4 w-4" /> Sertifika Oluştur
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

                {event.grantsCertificate && (
                    <TabsContent value="certificate" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Sertifika Ayarları</CardTitle>
                                <CardDescription>
                                    Bu etkinlik için sertifika ayarlarını yapılandırın ve katılımcılara sertifika oluşturun.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Sertifika Durumu */}
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Award className="h-5 w-5 text-primary" />
                                            <h3 className="font-medium">Sertifika Sistemi</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {event.grantsCertificate
                                                ? "Bu etkinlik için sertifika sistemi aktif"
                                                : "Bu etkinlik için sertifika sistemi devre dışı"}
                                        </p>
                                    </div>
                                    <Badge variant={event.grantsCertificate ? "default" : "outline"} className={event.grantsCertificate ? "bg-green-600" : ""}>
                                        {event.grantsCertificate ? "Aktif" : "Pasif"}
                                    </Badge>
                                </div>

                                {event.grantsCertificate && (
                                    <>
                                        <Separator />

                                        {/* Toplu Sertifika Oluşturma */}
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="font-medium mb-2">Toplu Sertifika Oluşturma</h3>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    Tüm katılımcılar için tek seferde sertifika oluşturabilirsiniz.
                                                </p>
                                            </div>

                                            {/* Sertifika Ayarları Formu */}
                                            <Card className="border-2">
                                                <CardHeader className="pb-4">
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <FileText className="h-4 w-4" />
                                                        Sertifika Ayarları
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Toplu oluşturulacak sertifikalar için gerekli bilgileri girin
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {/* Sertifika / Eğitim Adı */}
                                                    <div className="space-y-2">
                                                        <Label htmlFor="bulk-certificate-name">Sertifika / Eğitim Adı *</Label>
                                                        <Input
                                                            id="bulk-certificate-name"
                                                            placeholder="Örn: React İleri Seviye Eğitimi"
                                                            value={certificateName}
                                                            onChange={(e) => {
                                                                const newName = e.target.value;
                                                                setCertificateName(newName);
                                                                // Update description when name changes
                                                                setCertificateDescription(generateDefaultDescription(newName));
                                                            }}
                                                        />
                                                        <p className="text-xs text-muted-foreground">
                                                            Sertifikada görünecek eğitim/etkinlik adı
                                                        </p>
                                                    </div>

                                                    {/* Açıklama */}
                                                    <div className="space-y-2">
                                                        <Label htmlFor="bulk-description">Açıklama (Opsiyonel)</Label>
                                                        <Textarea
                                                            id="bulk-description"
                                                            placeholder="Sertifika hakkında ek bilgiler..."
                                                            rows={8}
                                                            value={certificateDescription}
                                                            onChange={(e) => setCertificateDescription(e.target.value)}
                                                        />
                                                        <p className="text-xs text-muted-foreground">
                                                            Bu metin sertifika PDF&apos;inde kullanılacaktır. Kullanıcı isteğe göre düzenleyebilir.
                                                        </p>
                                                    </div>

                                                    {/* Sertifika Logosu */}
                                                    <div className="space-y-2">
                                                        <Label htmlFor="bulk-logo">Sertifika Logosu (Opsiyonel)</Label>
                                                        <div className="flex items-center gap-2">
                                                            <Button type="button" variant="outline" size="sm">
                                                                <Upload className="mr-2 h-4 w-4" />
                                                                Logo Yükle
                                                            </Button>
                                                            <Button type="button" variant="outline" size="sm">
                                                                Media Kütüphanesinden Seç
                                                            </Button>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Sertifikada kullanılacak logo (PNG, JPG - Max 5MB)
                                                        </p>
                                                    </div>

                                                    {/* Sertifika Tasarımı */}
                                                    <div className="space-y-2">
                                                        <Label htmlFor="bulk-template">Sertifika Tasarımı *</Label>
                                                        <Select
                                                            value={selectedTemplateId}
                                                            onValueChange={setSelectedTemplateId}
                                                            disabled={loadingTemplates}
                                                        >
                                                            <SelectTrigger id="bulk-template">
                                                                <SelectValue placeholder={loadingTemplates ? "Yükleniyor..." : "Bir tasarım seçin"} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {templates.map((template) => (
                                                                    <SelectItem key={template.id} value={template.id}>
                                                                        {template.name}
                                                                    </SelectItem>
                                                                ))}
                                                                {templates.length === 0 && !loadingTemplates && (
                                                                    <SelectItem value="none" disabled>
                                                                        Tasarım bulunamadı
                                                                    </SelectItem>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        <p className="text-xs text-muted-foreground">
                                                            {loadingTemplates ? "Tasarımlar yükleniyor..." : `${templates.length} tasarım mevcut`}
                                                        </p>
                                                    </div>

                                                    {/* Tarih Ayarları */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Oluşturulma Tarihi</Label>
                                                            <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                                                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                                                <span className="text-sm">{new Date().toLocaleDateString('tr-TR')}</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Geçerlilik Tarihi (Opsiyonel)</Label>
                                                            <Button type="button" variant="outline" className="w-full justify-start">
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                Tarih Seç
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">Toplam Katılımcı</span>
                                                    </div>
                                                    <p className="text-2xl font-bold">{event.attendees?.length || 0}</p>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Award className="h-4 w-4 text-green-600" />
                                                        <span className="text-sm font-medium">Sertifika Verildi</span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-green-600">
                                                        {event.attendees?.filter((a: any) => a.certificateId).length || 0}
                                                    </p>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Clock className="h-4 w-4 text-orange-600" />
                                                        <span className="text-sm font-medium">Bekleyen</span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-orange-600">
                                                        {(event.attendees?.length || 0) - (event.attendees?.filter((a: any) => a.certificateId).length || 0)}
                                                    </p>
                                                </div>
                                            </div>

                                            <Button className="w-full" size="lg" disabled={!event.attendees || event.attendees.length === 0}>
                                                <Award className="mr-2 h-5 w-5" />
                                                Tüm Katılımcılar İçin Sertifika Oluştur
                                            </Button>

                                            {(!event.attendees || event.attendees.length === 0) && (
                                                <p className="text-xs text-center text-muted-foreground">
                                                    Sertifika oluşturmak için en az bir katılımcı olmalıdır.
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}

                                {!event.grantsCertificate && (
                                    <div className="text-center py-12">
                                        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="font-medium mb-2">Sertifika Sistemi Devre Dışı</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Bu etkinlik için sertifika sistemi aktif değil. Sertifika vermek için "Etkinliği Düzenle" sekmesinden sertifika ayarlarını etkinleştirin.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

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
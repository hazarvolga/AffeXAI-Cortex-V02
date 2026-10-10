
'use client'

import { useEffect, useState } from 'react';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Event, CreateEventDto, UpdateEventDto, EventStatus, TicketType, CertificateConfig } from '@affexai/shared-types';
import { Calendar as CalendarIcon, Save, Trash2, PlusCircle, Award, Image as ImageIcon, Ticket, X, Eye } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import Link from "next/link";
import { Separator } from "../ui/separator";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import eventsService from "@/lib/api/eventsService";
import { TemplatePreviewModal } from "./events/TemplatePreviewModal";

type EventFormProps = {
    event?: Event;
    onUpdate?: () => void;
    variant?: 'default' | 'editorial';
};

import { BccHudTile } from "@/components/brand/BccHudTile";

export const EventForm = ({
    event,
    eventId,
    onUpdate,
    onStateChange,
    variant = 'default'
}: {
    event?: Event;
    eventId?: string;
    onUpdate?: () => void;
    onStateChange?: (state: any) => void;
    variant?: 'default' | 'editorial'
}) => {
    const isEditorial = variant === 'editorial';
    const isEditing = !!event;
    const router = useRouter();
    const { toast } = useToast();

    // Form state - initialize from event or defaults
    const [title, setTitle] = useState(event?.title || '');
    const [description, setDescription] = useState(event?.description || '');
    const [location, setLocation] = useState(event?.location || '');
    const [city, setCity] = useState('');
    const [capacity, setCapacity] = useState(event?.capacity?.toString() || '');
    const [price, setPrice] = useState(event?.price?.toString() || '');
    const [templateId, setTemplateId] = useState(event?.templateId || 'avant-garde');
    const [category, setCategory] = useState(event?.metadata?.category || '');
    const [isOnline, setIsOnline] = useState(event?.metadata?.isOnline || false);
    const [status, setStatus] = useState<EventStatus>(event?.status || EventStatus.DRAFT);

    // Preview Modal State
    const [previewTemplate, setPreviewTemplate] = useState<{ id: string; name: string; color: string; pattern: string } | null>(null);

    // Certificate config state
    const [grantsCertificate, setGrantsCertificate] = useState(event?.grantsCertificate || false);
    const [certificateTitle, setCertificateTitle] = useState(event?.certificateTitle || '');
    const [certificateTemplateId, setCertificateTemplateId] = useState<string>(event?.certificateConfig?.templateId || '');
    const [certificateLogoId, setCertificateLogoId] = useState<string>(event?.certificateConfig?.logoMediaId || '');
    const [certificateDescription, setCertificateDescription] = useState(event?.certificateConfig?.description || '');
    const [certificateValidityDays, setCertificateValidityDays] = useState<number | null>(event?.certificateConfig?.validityDays || null);
    const [certificateAutoGenerate, setCertificateAutoGenerate] = useState(event?.certificateConfig?.autoGenerate || false);

    const [date, setDate] = useState<Date | undefined>(event?.startDate ? new Date(event.startDate) : undefined);
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>(
        event?.metadata?.ticketTypes || [{ name: 'Genel Giriş', price: '0', quantity: '100' }]
    );
    const [loading, setLoading] = useState(false);

    // Visual Branding State
    const [primaryColor, setPrimaryColor] = useState(event?.metadata?.visual?.primaryColor || '#ff8c00');
    const [logoUrl, setLogoUrl] = useState(event?.metadata?.visual?.logoUrl || '');
    const [heroImageUrl, setHeroImageUrl] = useState(event?.metadata?.visual?.heroImageUrl || '');

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

    // Emit state changes for real-time preview
    useEffect(() => {
        if (onStateChange) {
            onStateChange({
                title,
                description,
                templateId,
                status,
                startDate: date?.toISOString(),
                grantsCertificate,
                metadata: {
                    category,
                    isOnline,
                    ticketTypes,
                    visual: {
                        primaryColor,
                        logoUrl,
                        heroImageUrl
                    }
                }
            });
        }
    }, [title, description, templateId, status, date, grantsCertificate, category, isOnline, ticketTypes, primaryColor, logoUrl, heroImageUrl, onStateChange]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Sadece başlık ve açıklama zorunlu
        if (!title || !description) {
            toast({
                title: "Hata",
                description: "Başlık ve açıklama alanları zorunludur",
                variant: "destructive",
            });
            return;
        }

        // Tarih kontrolü
        if (!date) {
            toast({
                title: "Hata",
                description: "Lütfen etkinlik tarihini seçin",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            // Location'ı city ile birleştir, yoksa sadece location kullan
            const fullLocation = city ? `${location}, ${city}` : location;

            // Build certificate config
            const certificateConfig: CertificateConfig | null = grantsCertificate ? {
                enabled: true,
                templateId: certificateTemplateId || null,
                logoMediaId: certificateLogoId || null,
                description: certificateDescription || null,
                validityDays: certificateValidityDays,
                autoGenerate: certificateAutoGenerate,
            } : null;

            // Type-safe event data
            const eventData: CreateEventDto | UpdateEventDto = {
                title,
                description,
                location: fullLocation || 'Belirtilmedi',
                capacity: Number(capacity),
                price: Number(price),
                status,
                templateId,
                startDate: date.toISOString(),
                endDate: date.toISOString(), // Aynı gün bitişi varsayıyoruz
                grantsCertificate,
                certificateTitle: grantsCertificate ? certificateTitle : null,
                certificateConfig,
                metadata: {
                    category,
                    isOnline,
                    ticketTypes,
                },
            };

            console.log('📤 Event Payload:', JSON.stringify(eventData, null, 2));

            if (isEditing && event) {
                try {
                    const result = await eventsService.update(event.id, eventData as UpdateEventDto);
                    console.log('✅ Event Updated Successfully:', result);
                    toast({
                        title: "Başarılı",
                        description: "Etkinlik güncellendi",
                    });

                    // Slug değişmiş olabilir, URL'i güncellemek gerekebilir
                    if (result.slug && result.slug !== event.slug) {
                        const tenantMatch = window.location.pathname.match(/^\/([^\/]+)\/admin/);
                        const tenantName = tenantMatch ? tenantMatch[1] : 'default';
                        router.push(`/${tenantName}/admin/events/${result.slug}`);
                        return;
                    }

                    // Parent component'e haber ver ki event'i yeniden fetch etsin
                    if (onUpdate) {
                        onUpdate();
                    } else {
                        window.location.reload();
                    }
                } catch (error: any) {
                    console.error('❌ Event Update Error:', error);
                    throw error;
                }
            } else {
                const result = await eventsService.create(eventData as CreateEventDto);
                toast({
                    title: "Başarılı",
                    description: "Etkinlik oluşturuldu",
                });

                const tenantMatch = window.location.pathname.match(/^\/([^\/]+)\/admin/);
                const tenantName = tenantMatch ? tenantMatch[1] : 'default';

                if (result.slug) {
                    router.push(`/${tenantName}/admin/events/${result.slug}`);
                } else {
                    router.push(`/${tenantName}/admin/events`);
                }
            }
        } catch (error) {
            console.error('Event save error:', error);
            toast({
                title: "Hata",
                description: "Etkinlik kaydedilirken bir hata oluştu",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {isEditorial ? (
                        <>
                            <BccHudTile title="Node Configuration" subtitle="Define the core parameters of this temporal asset" icon="settings">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-[10px] uppercase tracking-widest text-white/40">
                                            Title_Registry <span className="text-[#ff8c00]">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            placeholder="E.G. QUANTUM_LAUNCH_2025"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="bg-white/5 border-white/5 rounded-none font-mono"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-[10px] uppercase tracking-widest text-white/40">
                                            Data_Stream_Descriptor <span className="text-[#ff8c00]">*</span>
                                        </Label>
                                        <Textarea
                                            id="description"
                                            placeholder="PROVIDE DETAILED TELEMETRY OVERVIEW..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="min-h-[150px] bg-white/5 border-white/5 rounded-none font-mono text-[11px]"
                                            required
                                        />
                                    </div>
                                </div>
                            </BccHudTile>

                            <BccHudTile title="Template Selection" subtitle="Choose the visual identity for the public landing page" icon="palette text-teal-400">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {[
                                            { id: 'avant-garde', name: 'Avant-Garde', color: '#ff8c00', pattern: 'radial' },
                                            { id: 'narrative', name: 'Narrative', color: '#ffffff', pattern: 'grid' },
                                            { id: 'institutional', name: 'Institutional', color: '#3b82f6', pattern: 'lines' },
                                            { id: 'cinematic', name: 'Cinematic', color: '#9333ea', pattern: 'glow' },
                                            { id: 'core-nexus', name: 'Core Nexus', color: '#9df425', pattern: 'dots' },
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setPreviewTemplate(t)}
                                                className={cn(
                                                    "group relative flex flex-col p-0 border transition-all aspect-[3/4] overflow-hidden",
                                                    templateId === t.id
                                                        ? "border-[#ff8c00] ring-1 ring-[#ff8c00]"
                                                        : "border-white/5 hover:border-white/20"
                                                )}
                                            >
                                                <div className="flex-grow w-full bg-[#0c0c0c] relative flex items-center justify-center overflow-hidden">
                                                    {/* Abstract Template Visual */}
                                                    <div className={cn(
                                                        "absolute inset-0 opacity-20",
                                                        t.pattern === 'radial' && "bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:10px_10px]",
                                                        t.pattern === 'grid' && "bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_14px]",
                                                        t.pattern === 'dots' && "bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:16px_16px]"
                                                    )} />
                                                    <div className="w-12 h-1 bg-white/10 absolute top-4 left-4" />
                                                    <div className="w-8 h-8 rounded-full border border-white/10 animate-pulse" style={{ borderColor: `${t.color}33` }} />
                                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
                                                </div>
                                                <div className="p-2 border-t border-white/5 bg-[#080808]">
                                                    <p className="text-[7px] font-bold uppercase tracking-widest truncate">{t.name}</p>
                                                    <p className="text-[6px] uppercase mt-0.5 text-white/30">Select_Matrix</p>
                                                </div>
                                                {templateId === t.id && (
                                                    <div className="absolute top-2 right-2 w-3 h-3 bg-[#ff8c00] rounded-full flex items-center justify-center">
                                                        <span className="material-icons text-black text-[8px] font-bold">check</span>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    <TemplatePreviewModal
                                        open={!!previewTemplate}
                                        onOpenChange={(open) => !open && setPreviewTemplate(null)}
                                        template={previewTemplate!}
                                        onSelect={(id) => {
                                            setTemplateId(id);
                                            setPreviewTemplate(null);
                                        }}
                                    />
                                </div>
                            </BccHudTile>

                            <BccHudTile title="Visual Deployment" subtitle="Customize identity parameters for the selected matrix" icon="auto_fix_high">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-[9px] uppercase tracking-widest text-white/40">Identity_Color</Label>
                                        <div className="flex gap-2">
                                            {['#ff8c00', '#9df425', '#3b82f6', '#ec4899', '#ffffff'].map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setPrimaryColor(c)}
                                                    className={cn(
                                                        "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                                                        primaryColor === c ? "border-white scale-110" : "border-transparent"
                                                    )}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                            <Input
                                                type="color"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="w-8 h-8 p-1 bg-transparent border-white/5 rounded-none cursor-pointer p-0"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3 col-span-2">
                                        <Label className="text-[9px] uppercase tracking-widest text-white/40">Logo_Telemetry_Source</Label>
                                        <Input
                                            placeholder="URL_OF_BRAND_LOGO"
                                            value={logoUrl}
                                            onChange={(e) => setLogoUrl(e.target.value)}
                                            className="bg-white/5 border-white/5 rounded-none font-mono text-[10px] h-8"
                                        />
                                    </div>
                                    <div className="space-y-3 col-span-3">
                                        <Label className="text-[9px] uppercase tracking-widest text-white/40">Hero_Ambient_Resource</Label>
                                        <Input
                                            placeholder="URL_OF_HERO_IMAGE"
                                            value={heroImageUrl}
                                            onChange={(e) => setHeroImageUrl(e.target.value)}
                                            className="bg-white/5 border-white/5 rounded-none font-mono text-[10px] h-8"
                                        />
                                    </div>
                                </div>
                            </BccHudTile>

                            <BccHudTile title="Access Control" subtitle="Configure ticket matrices and allocation units" icon="confirmation_number">
                                <div className="space-y-4">
                                    {ticketTypes.map((ticket, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 items-center gap-4 p-4 border border-white/5 bg-white/[0.02]">
                                            <div className="space-y-2 md:col-span-2">
                                                <Label className="text-[9px] uppercase tracking-widest text-white/30" htmlFor={`ticket-name-${index}`}>Ident_Name</Label>
                                                <Input id={`ticket-name-${index}`} value={ticket.name} onChange={(e) => handleTicketTypeChange(index, 'name', e.target.value)} placeholder="GENERAL_ACCESS" className="bg-white/5 border-white/5 rounded-none font-mono h-8 text-xs" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] uppercase tracking-widest text-white/30" htmlFor={`ticket-price-${index}`}>Flux_Value</Label>
                                                <Input id={`ticket-price-${index}`} type="number" value={ticket.price} onChange={(e) => handleTicketTypeChange(index, 'price', e.target.value)} placeholder="0" className="bg-white/5 border-white/5 rounded-none font-mono h-8 text-xs" />
                                            </div>
                                            <div className="flex items-end h-full gap-2">
                                                <div className="space-y-2 flex-1">
                                                    <Label className="text-[9px] uppercase tracking-widest text-white/30" htmlFor={`ticket-quantity-${index}`}>Density</Label>
                                                    <Input id={`ticket-quantity-${index}`} type="number" value={ticket.quantity} onChange={(e) => handleTicketTypeChange(index, 'quantity', e.target.value)} placeholder="100" className="bg-white/5 border-white/5 rounded-none font-mono h-8 text-xs" />
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveTicketType(index)} className="shrink-0 h-8 w-8 hover:text-[#ff8c00]" disabled={ticketTypes.length <= 1}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" onClick={handleAddTicketType} className="w-full rounded-none border-dashed border-white/10 text-[9px] uppercase tracking-[0.2em] hover:bg-[#ff8c00]/10 hover:text-[#ff8c00]">
                                        <PlusCircle className="mr-2 h-4 w-4" /> Integrate_New_Unit
                                    </Button>
                                </div>
                            </BccHudTile>

                            <BccHudTile title="Award Protocol" subtitle="Authorize meritous asset distribution" icon="verified">
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3 p-4 bg-white/[0.02] border border-white/5">
                                        <Checkbox
                                            id="grantsCertificate"
                                            checked={grantsCertificate}
                                            onCheckedChange={(checked) => setGrantsCertificate(checked as boolean)}
                                            className="border-white/20 data-[state=checked]:bg-[#9df425] data-[state=checked]:border-[#9df425]"
                                        />
                                        <label htmlFor="grantsCertificate" className="text-[10px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-2 cursor-pointer">
                                            Activate_Merit_Engine
                                        </label>
                                    </div>

                                    {grantsCertificate && (
                                        <div className="p-4 border border-[#9df425]/10 bg-[#9df425]/5">
                                            <p className="text-[9px] text-[#9df425] uppercase tracking-[0.2em] font-mono leading-relaxed">
                                                SYST_OK: Merit engine initialized. Access certificate matrices in 'Quantum Control' post-deployment.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </BccHudTile>
                        </>
                    ) : (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Etkinlik Detayları</CardTitle>
                                    <CardDescription>Etkinliğinizin adını, açıklamasını ve temel bilgilerini girin.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">
                                            Etkinlik Başlığı <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            placeholder="Örn: Allplan 2025 Lansmanı"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">
                                            Etkinlik Açıklaması <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Etkinliğiniz hakkında detaylı bilgi verin..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="min-h-[150px]"
                                            required
                                        />
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
                                                <Input id={`ticket-name-${index}`} value={ticket.name} onChange={(e) => handleTicketTypeChange(index, 'name', e.target.value)} placeholder="Genel Giriş" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`ticket-price-${index}`}>Fiyat (TL)</Label>
                                                <Input id={`ticket-price-${index}`} type="number" value={ticket.price} onChange={(e) => handleTicketTypeChange(index, 'price', e.target.value)} placeholder="50" />
                                            </div>
                                            <div className="flex items-end h-full gap-2">
                                                <div className="space-y-2 flex-1">
                                                    <Label htmlFor={`ticket-quantity-${index}`}>Miktar</Label>
                                                    <Input id={`ticket-quantity-${index}`} type="number" value={ticket.quantity} onChange={(e) => handleTicketTypeChange(index, 'quantity', e.target.value)} placeholder="100" />
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveTicketType(index)} className="shrink-0" disabled={ticketTypes.length <= 1}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" onClick={handleAddTicketType}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Yeni Bilet Türü Ekle
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
                                        <Checkbox
                                            id="grantsCertificate"
                                            checked={grantsCertificate}
                                            onCheckedChange={(checked) => setGrantsCertificate(checked as boolean)}
                                        />
                                        <label htmlFor="grantsCertificate" className="text-sm font-medium leading-none flex items-center gap-2">
                                            <Award className="h-4 w-4 text-primary" /> Katılımcılara Sertifika Ver
                                        </label>
                                    </div>

                                    {grantsCertificate && (
                                        <div className="p-4 border rounded-lg bg-muted/50">
                                            <p className="text-sm text-muted-foreground">
                                                ✨ Sertifika sistemi aktifleştirildi! Detaylı ayarları yapmak için etkinliği kaydettikten sonra <strong>"Sertifika Ayarları"</strong> sekmesine gidin.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                <div className="lg:col-span-1 space-y-8">
                    {isEditorial ? (
                        <>
                            <BccHudTile title="State Authorization" subtitle="Modify operational status" icon="sensors">
                                <div className="space-y-6">
                                    <Select value={status} onValueChange={(value) => setStatus(value as EventStatus)}>
                                        <SelectTrigger className="bg-white/5 border-white/5 rounded-none font-mono text-[10px] h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0f0f0f] border-white/10 rounded-none text-[10px] font-mono uppercase">
                                            <SelectItem value={EventStatus.PUBLISHED}>STATUS_PUBLISHED</SelectItem>
                                            <SelectItem value={EventStatus.DRAFT}>STATUS_DRAFT</SelectItem>
                                            <SelectItem value={EventStatus.CANCELLED}>STATUS_CANCELLED</SelectItem>
                                            <SelectItem value={EventStatus.COMPLETED}>STATUS_COMPLETED</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div className="grid grid-cols-1 gap-3 pt-4">
                                        <Button type="submit" disabled={loading} className="w-full rounded-none bg-[#ff8c00] text-black hover:bg-[#ff8c00]/80 text-[10px] font-bold uppercase tracking-[0.2em] h-10 shadow-[0_0_20px_rgba(255,140,0,0.2)]">
                                            {loading ? 'SYNCING...' : (isEditing ? 'COMMIT_CHANGES' : 'INITIALIZE_DEPLOYMENT')}
                                        </Button>
                                        <Button variant="ghost" asChild className="w-full text-white/40 hover:text-white text-[9px] uppercase tracking-widest h-8">
                                            <Link href={`/${window.location.pathname.split('/')[1] || 'default'}/admin/events`}>ABORT_SEQUENCE</Link>
                                        </Button>
                                    </div>
                                </div>
                            </BccHudTile>

                            <BccHudTile title="Registry Parameters" subtitle="Logistical and temporal coordinates" icon="schedule">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] uppercase tracking-widest text-white/40">Temporal_Sync_Point</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-mono rounded-none bg-white/5 border-white/5 text-[10px] h-9",
                                                        !date ? "text-white/20" : "text-white"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-3 w-3 opacity-40" />
                                                    {date ? format(date, "yyyy.MM.dd HH:mm") : <span>SELECT_DATE</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 bg-[#0f0f0f] border-white/10 rounded-none">
                                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3" />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase tracking-widest text-white/40">Category_Class</Label>
                                        <Select value={category} onValueChange={setCategory}>
                                            <SelectTrigger className="bg-white/5 border-white/5 rounded-none font-mono text-[10px] h-9"><SelectValue placeholder="CLASS_NULL" /></SelectTrigger>
                                            <SelectContent className="bg-[#0f0f0f] border-white/10 rounded-none text-[10px] font-mono uppercase">
                                                <SelectItem value="Webinar">CLS_WEBINAR</SelectItem>
                                                <SelectItem value="Workshop">CLS_WORKSHOP</SelectItem>
                                                <SelectItem value="Lansman">CLS_LAUNCH</SelectItem>
                                                <SelectItem value="Zirve">CLS_SUMMIT</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center space-x-3 p-3 bg-white/[0.02] border border-white/5">
                                        <Checkbox
                                            id="isOnline"
                                            checked={isOnline}
                                            onCheckedChange={(checked) => setIsOnline(checked as boolean)}
                                            className="border-white/20 data-[state=checked]:bg-[#9df425] data-[state=checked]:border-[#9df425]"
                                        />
                                        <label htmlFor="isOnline" className="text-[10px] font-bold uppercase tracking-widest text-white/60 cursor-pointer">
                                            Virtual_Presence
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase tracking-widest text-white/40">Geo_Locus</Label>
                                        <Input
                                            placeholder="LOCUS_NAME"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="bg-white/5 border-white/5 rounded-none font-mono text-xs h-9"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase tracking-widest text-white/40">City_Vector</Label>
                                        <Input
                                            placeholder="ISTANBUL"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            className="bg-white/5 border-white/5 rounded-none font-mono text-xs h-9"
                                        />
                                    </div>
                                </div>
                            </BccHudTile>
                        </>
                    ) : (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Yayınlama</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">Etkinliğinizin durumunu buradan yönetin.</p>
                                    <Select value={status} onValueChange={(value) => setStatus(value as EventStatus)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={EventStatus.PUBLISHED}>Yayınlandı</SelectItem>
                                            <SelectItem value={EventStatus.DRAFT}>Taslak</SelectItem>
                                            <SelectItem value={EventStatus.CANCELLED}>İptal Edildi</SelectItem>
                                            <SelectItem value={EventStatus.COMPLETED}>Tamamlandı</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <Button variant="outline" asChild><Link href="/admin/events">İptal</Link></Button>
                                    <Button type="submit" disabled={loading}>
                                        <Save className="mr-2 h-4 w-4" />
                                        {loading ? 'Kaydediliyor...' : (isEditing ? 'Etkinliği Güncelle' : 'Etkinliği Kaydet')}
                                    </Button>
                                </CardFooter>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Organizasyon</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>
                                            Tarih ve Saat <span className="text-red-500">*</span>
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !date && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {date ? format(date, "PPP HH:mm") : <span>Bir tarih seçin</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kategori</Label>
                                        <Select value={category} onValueChange={setCategory}>
                                            <SelectTrigger><SelectValue placeholder="Bir kategori seçin" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Webinar">Webinar</SelectItem>
                                                <SelectItem value="Workshop">Workshop</SelectItem>
                                                <SelectItem value="Lansman">Lansman</SelectItem>
                                                <SelectItem value="Zirve">Zirve</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="isOnline"
                                            checked={isOnline}
                                            onCheckedChange={(checked) => setIsOnline(checked as boolean)}
                                        />
                                        <label htmlFor="isOnline" className="text-sm font-medium leading-none">
                                            Etkinlik Çevrimiçi (Online)
                                        </label>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mekan</Label>
                                        <Input
                                            placeholder="Örn: Swissôtel The Bosphorus"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Şehir</Label>
                                        <Input
                                            placeholder="İstanbul"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </form >
    );
}

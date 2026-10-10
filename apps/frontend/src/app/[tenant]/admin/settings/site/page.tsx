'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SiteSettings } from '@affexai/shared-types';
import { saveSiteSettings, SaveSettingsState } from './actions';
import { Building, Globe, Image as ImageIcon, Link2, Save, Trash2, PlusCircle, Facebook, Linkedin, Twitter, Youtube, Instagram, Share2, Component, Bot, ArrowRight, Loader2, Lightbulb, Tags, Clock, Tv, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import MediaPicker from '@/components/media/MediaPicker';
import settingsService from '@/lib/api/settingsService';
import { StorageSettingsTab } from './storage-settings-tab';
import { EmailSettingsTab } from './email-settings-tab';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';

const SiteSettingsLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <BccEditorialWrapper
            theme="tenant-admin"
            headerTitle="Site Architecture"
            headerSubtitle="Managing core ecosystem nodes and domain resonance."
            headerBadge="Admin Console"
            telemetryData={[
                { label: 'Scope', value: 'Tenant', color: '#ff8c00' },
                { label: 'Config Source', value: 'Database', color: '#ff8c00' }
            ]}
        >
            <div className="relative z-10 w-full min-h-screen flex flex-col pt-0">
                {children}
            </div>
        </BccEditorialWrapper>
    );
};


const socialIcons: { [key: string]: React.ElementType } = {
    facebook: Facebook,
    linkedin: Linkedin,
    twitter: Twitter,
    youtube: Youtube,
    instagram: Instagram,
    pinterest: Share2,
    tiktok: Component,
};

function SaveSettingsButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="lg" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Tüm Ayarları Kaydet
        </Button>
    );
}

export default function SiteSettingsPage() {
    // Fetch current settings from backend to ensure we have the latest data
    const [currentSettings, setCurrentSettings] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);
    const [activeSettingsTab, setActiveSettingsTab] = useState('company');

    // This local state is for UI interactions only (adding/removing social links before saving)
    const [dynamicSocials, setDynamicSocials] = useState<{ [key: string]: string }>({});
    const [newSocialPlatform, setNewSocialPlatform] = useState('');

    // Strategic Radar State
    const [radarCompetitors, setRadarCompetitors] = useState<string[]>([]);
    const [newCompetitor, setNewCompetitor] = useState('');
    const [radarKeywords, setRadarKeywords] = useState<string[]>([]);
    const [newKeyword, setNewKeyword] = useState('');
    const [radarCycle, setRadarCycle] = useState('weekly');
    const [isRadarEnabled, setIsRadarEnabled] = useState(false);

    const { toast } = useToast();

    const initialState: SaveSettingsState = { message: '', success: false };
    const [state, formAction] = useActionState(saveSiteSettings, initialState);

    // Fetch the persisted tenant settings. API failures remain visible and never become demo data.
    useEffect(() => {
        const fetchCurrentSettings = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const settings: any = await settingsService.getAdministrativeSiteSettings();
                setCurrentSettings(settings);
                const socialMediaFormatted: { [key: string]: string } = {};
                if (settings.socialMedia) {
                    for (const [key, value] of Object.entries(settings.socialMedia)) {
                        if (typeof value === 'string') socialMediaFormatted[key] = value;
                    }
                }
                setDynamicSocials(socialMediaFormatted);

                if (settings.strategicRadar) {
                    setRadarCompetitors(settings.strategicRadar.competitors?.urls || []);
                    setRadarKeywords(settings.strategicRadar.focusPulse?.keywords || []);
                    setRadarCycle(settings.strategicRadar.reportingCycle || 'weekly');
                    setIsRadarEnabled(settings.strategicRadar.competitors?.enabled || false);
                }
            } catch {
                setCurrentSettings(null);
                setLoadError('Kalıcı site ayarları yüklenemedi. Bağlantıyı kontrol edip yeniden deneyin.');
            } finally {
                setIsLoading(false);
            }
        };

        void fetchCurrentSettings();
    }, [reloadToken]);

    const effectiveSettings = currentSettings;

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? 'Başarılı!' : 'Hata!',
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
            });

            // After successful save, refresh the current settings
            if (state.success) {
                const fetchCurrentSettings = async () => {
                    try {
                        const settings: any = await settingsService.getAdministrativeSiteSettings();
                        setCurrentSettings(settings);
                        // Convert socialMedia to the expected format
                        const socialMediaFormatted: { [key: string]: string } = {};
                        if (settings.socialMedia) {
                            for (const [key, value] of Object.entries(settings.socialMedia)) {
                                if (value !== undefined) {
                                    socialMediaFormatted[key] = value as string;
                                }
                            }
                        }
                        setDynamicSocials(socialMediaFormatted);
                    } catch (error) {
                        setLoadError('Kaydedilen ayarlar yeniden okunamadı.');
                    }
                };

                fetchCurrentSettings();
            }
        }
    }, [state, toast]);


    const handleAddSocialLink = () => {
        if (newSocialPlatform && !(newSocialPlatform in dynamicSocials)) {
            setDynamicSocials(prev => ({
                ...prev,
                [newSocialPlatform]: ''
            }));
            setNewSocialPlatform('');
        }
    };

    const handleRemoveSocialLink = (platformToRemove: string) => {
        setDynamicSocials(prev => {
            const newSocialMedia = { ...prev };
            delete (newSocialMedia as any)[platformToRemove];
            return newSocialMedia;
        });
    };

    const availablePlatforms = ['facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'pinterest', 'tiktok'].filter(
        p => !Object.keys(dynamicSocials).includes(p)
    );

    // Show loading state while fetching settings
    if (isLoading) {
        return (
            <SiteSettingsLayoutWrapper>
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-[#ff8c00]" />
                </div>
            </SiteSettingsLayoutWrapper>
        );
    }

    if (loadError || !effectiveSettings) {
        return (
            <SiteSettingsLayoutWrapper>
                <Alert className="border-red-500/30 bg-red-500/5">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertTitle>Site ayarları kullanılamıyor</AlertTitle>
                    <AlertDescription className="flex items-center justify-between gap-4">
                        <span>{loadError || 'Site ayarları bulunamadı.'}</span>
                        <Button type="button" variant="outline" onClick={() => setReloadToken((value) => value + 1)}>
                            Yeniden dene
                        </Button>
                    </AlertDescription>
                </Alert>
            </SiteSettingsLayoutWrapper>
        );
    }

    return (
        <SiteSettingsLayoutWrapper>
            <div className="space-y-12 pb-24">
                <div className="border-l-2 border-[#ff8c00] pl-6 py-2">
                    <h1 className="text-4xl font-bold tracking-tighter uppercase font-mono italic">Site Settings</h1>
                    <p className="text-white/40 text-xs uppercase tracking-[0.2em] mt-2">
                        System-wide node configuration and identity management.
                    </p>
                </div>
                <form action={formAction}>
                    <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="w-full">
                        <TabsList className="bg-white/5 border border-white/10 p-1 mb-8">
                            <TabsTrigger value="company" className="data-[state=active]:bg-[#ff8c00] data-[state=active]:text-black text-[10px] uppercase tracking-widest px-8">Company</TabsTrigger>
                            <TabsTrigger value="email" className="data-[state=active]:bg-[#ff8c00] data-[state=active]:text-black text-[10px] uppercase tracking-widest px-8">Email Settings</TabsTrigger>
                            <TabsTrigger value="storage" className="data-[state=active]:bg-[#ff8c00] data-[state=active]:text-black text-[10px] uppercase tracking-widest px-8">Storage</TabsTrigger>
                            <TabsTrigger value="radar" className="data-[state=active]:bg-[#ff8c00] data-[state=active]:text-black text-[10px] uppercase tracking-widest px-8">Strategic Radar</TabsTrigger>
                        </TabsList>

                        <TabsContent forceMount value="company" className="mt-0 space-y-8 data-[state=inactive]:hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid gap-8">
                                <Card className="bcc-glass border-none bg-white/[0.02]">
                                    <CardHeader className="border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-6 bg-[#ff8c00]"></div>
                                            <div>
                                                <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold">Kurumsal Kimlik</CardTitle>
                                                <CardDescription className="text-[10px] uppercase text-white/40 tracking-wider">Şirket adı ve logosu gibi temel kimlik bilgileri.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-8 space-y-6">
                                        <div className="grid md:grid-cols-2 gap-8 items-start">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="companyName" className="text-[10px] uppercase text-white/40 tracking-widest">Şirket Adı</Label>
                                                    <Input id="companyName" name="companyName" defaultValue={effectiveSettings.companyName || ''} className="bg-white/5 border-white/10" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="domain" className="flex items-center gap-2 text-[10px] uppercase text-white/40 tracking-widest">
                                                        <Globe className="h-3 w-3" />
                                                        Domain
                                                    </Label>
                                                    <Input
                                                        id="domain"
                                                        name="domain"
                                                        placeholder="example.com"
                                                        defaultValue={effectiveSettings.domain || 'affexai.com'}
                                                        className="bg-white/5 border-white/10"
                                                    />
                                                    <p className="text-[10px] text-white/20 italic">
                                                        Email adresleri için kullanılacak domain (örn: ticket-{'{uuid}'}@{effectiveSettings.domain || 'affexai.com'})
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="logoUrl" className="text-[10px] uppercase text-white/40 tracking-widest">Logo (Açık Tema)</Label>
                                                    <MediaPicker
                                                        value={effectiveSettings.logoUrl?.includes('.') ? effectiveSettings.logoUrl.split('/').pop() : effectiveSettings.logoUrl}
                                                        onChange={(mediaId) => {
                                                            const input = document.getElementById('logoUrl') as HTMLInputElement;
                                                            if (input) input.value = mediaId || '';
                                                        }}
                                                        placeholder="Açık tema logosu seçin"
                                                    />
                                                    <Input
                                                        id="logoUrl"
                                                        name="logoUrl"
                                                        defaultValue={effectiveSettings.logoUrl || ''}
                                                        className="hidden"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="logoDarkUrl" className="text-[10px] uppercase text-white/40 tracking-widest">Logo (Koyu Tema)</Label>
                                                    <MediaPicker
                                                        value={effectiveSettings.logoDarkUrl?.includes('.') ? effectiveSettings.logoDarkUrl.split('/').pop() : effectiveSettings.logoDarkUrl}
                                                        onChange={(mediaId) => {
                                                            const input = document.getElementById('logoDarkUrl') as HTMLInputElement;
                                                            if (input) input.value = mediaId || '';
                                                        }}
                                                        placeholder="Koyu tema logosu seçin"
                                                    />
                                                    <Input
                                                        id="logoDarkUrl"
                                                        name="logoDarkUrl"
                                                        defaultValue={effectiveSettings.logoDarkUrl || ''}
                                                        className="hidden"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bcc-glass border-none bg-white/[0.02]">
                                    <CardHeader className="border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-6 bg-[#ff8c00]"></div>
                                            <div>
                                                <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold">İletişim ve Adres</CardTitle>
                                                <CardDescription className="text-[10px] uppercase text-white/40 tracking-wider">Access vectors and physical node locations.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-8 grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-[10px] uppercase text-white/40 tracking-widest">Genel E-posta</Label>
                                            <Input id="email" name="email" type="email" defaultValue={effectiveSettings.contact?.email || ''} className="bg-white/5 border-white/10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-[10px] uppercase text-white/40 tracking-widest">Genel Telefon</Label>
                                            <Input id="phone" name="phone" type="tel" defaultValue={effectiveSettings.contact?.phone || ''} className="bg-white/5 border-white/10" />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <Label htmlFor="address" className="text-[10px] uppercase text-white/40 tracking-widest">Adres</Label>
                                            <Textarea id="address" name="address" defaultValue={effectiveSettings.contact?.address || ''} className="bg-white/5 border-white/10 min-h-[100px]" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bcc-glass border-none bg-white/[0.02]">
                                    <CardHeader className="border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-6 bg-[#ff8c00]"></div>
                                            <div>
                                                <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold">Social Resonance</CardTitle>
                                                <CardDescription className="text-[10px] uppercase text-white/40 tracking-wider">Managing external signal amplification nodes.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-8 space-y-4">
                                        {Object.entries(dynamicSocials).map(([platform, url]) => {
                                            const IconComponent = (socialIcons[platform] || Link2) as any;
                                            return (
                                                <div key={platform} className="flex items-center gap-2 group">
                                                    <div className="relative flex-grow flex items-center">
                                                        <IconComponent className="absolute left-3 h-4 w-4 text-[#ff8c00]/60 group-hover:text-[#ff8c00] transition-colors" />
                                                        <Input
                                                            id={`social-${platform}`}
                                                            name={`social-${platform}`}
                                                            defaultValue={url || ''}
                                                            className="pl-10 bg-white/5 border-white/10"
                                                            placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`}
                                                        />
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" className="text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all" onClick={() => handleRemoveSocialLink(platform)}>
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">{platform} hesabını sil</span>
                                                    </Button>
                                                </div>
                                            )
                                        })}
                                        <div className="flex items-center gap-3 pt-6 border-t border-white/5 mt-4">
                                            <Select value={newSocialPlatform} onValueChange={setNewSocialPlatform}>
                                                <SelectTrigger className="flex-grow bg-white/5 border-white/10">
                                                    <SelectValue placeholder="Eklemek için bir platform seçin..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#0a0a0a] border-white/10">
                                                    {availablePlatforms.map(platform => (
                                                        <SelectItem key={platform} value={platform} className="uppercase text-[10px] tracking-widest">
                                                            {platform}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button type="button" onClick={handleAddSocialLink} disabled={!newSocialPlatform} className="bg-[#ff8c00] text-black hover:bg-[#ff8c00]/80">
                                                <PlusCircle className="mr-2 h-4 w-4" /> Ekle
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bcc-glass border-none bg-white/[0.02]">
                                    <CardHeader className="border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-6 bg-[#ff8c00]"></div>
                                            <div>
                                                <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold">SEO Architecture</CardTitle>
                                                <CardDescription className="text-[10px] uppercase text-white/40 tracking-wider">Optimizing discoverability across semantic layers.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-8 space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="defaultTitle" className="text-[10px] uppercase text-white/40 tracking-widest">Varsayılan Site Başlığı</Label>
                                                <Input id="defaultTitle" name="defaultTitle" defaultValue={effectiveSettings.seo?.defaultTitle || ''} className="bg-white/5 border-white/10" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="defaultDescription" className="text-[10px] uppercase text-white/40 tracking-widest">Varsayılan Site Açıklaması</Label>
                                                <Textarea id="defaultDescription" name="defaultDescription" defaultValue={effectiveSettings.seo?.defaultDescription || ''} className="bg-white/5 border-white/10 min-h-[100px]" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="email" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <EmailSettingsTab />
                        </TabsContent>

                        <TabsContent value="storage" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bcc-glass rounded-lg border-none bg-white/[0.02] p-8">
                                <StorageSettingsTab />
                            </div>
                        </TabsContent>

                        <TabsContent forceMount value="radar" className="mt-0 data-[state=inactive]:hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Card className="bcc-glass border-none bg-white/[0.02]">
                                <CardHeader className="border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-6 bg-[#ff8c00]"></div>
                                        <div>
                                            <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold">Strategic Radar Control</CardTitle>
                                            <CardDescription className="text-[10px] uppercase text-white/40 tracking-wider">Configure autonomous intelligence gathering nodes and reporting cycles.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-8 space-y-10">
                                    {/* Master Switch */}
                                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-sm">
                                        <div className="space-y-0.5">
                                            <Label className="text-[10px] uppercase tracking-widest text-white/80 font-bold">Radar Activation</Label>
                                            <p className="text-[10px] text-white/30 italic">Enable or disable autonomous crawling for this tenant.</p>
                                        </div>
                                        <Checkbox
                                            id="radarEnabled"
                                            name="radarEnabled"
                                            checked={isRadarEnabled}
                                            onCheckedChange={(checked) => setIsRadarEnabled(checked as boolean)}
                                            className="data-[state=checked]:bg-[#ff8c00]"
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        {/* Competitors Management */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Tv className="h-3 w-3 text-[#ff8c00]" />
                                                <Label className="text-[10px] uppercase tracking-widest text-[#ff8c00] font-bold">Target Radar (Competitors)</Label>
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="https://rakip-site.com"
                                                    className="bg-white/5 border-white/10 text-xs"
                                                    value={newCompetitor}
                                                    onChange={(e) => setNewCompetitor(e.target.value)}
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        if (newCompetitor && !radarCompetitors.includes(newCompetitor)) {
                                                            setRadarCompetitors([...radarCompetitors, newCompetitor]);
                                                            setNewCompetitor('');
                                                        }
                                                    }}
                                                    className="bg-[#ff8c00] text-black hover:bg-[#ff8c00]/80 h-9 px-3"
                                                >
                                                    <PlusCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <ScrollArea className="h-32 w-full rounded-sm border border-white/5 bg-black/20 p-3">
                                                <div className="space-y-2">
                                                    {radarCompetitors.map((url, i) => (
                                                        <div key={i} className="flex items-center justify-between group">
                                                            <span className="text-[10px] text-white/60 font-mono truncate max-w-[200px]">{url}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setRadarCompetitors(radarCompetitors.filter((_, idx) => idx !== i))}
                                                                className="text-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {radarCompetitors.length === 0 && <p className="text-[10px] text-white/20 italic">No competitors tracked.</p>}
                                                </div>
                                            </ScrollArea>
                                            <input type="hidden" name="radarCompetitors" value={JSON.stringify(radarCompetitors)} />
                                        </div>

                                        {/* Focus Pulse Management */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Bot className="h-3 w-3 text-[#ff8c00]" />
                                                <Label className="text-[10px] uppercase tracking-widest text-[#ff8c00] font-bold">Focus Pulse (Keywords)</Label>
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="AI, E-commerce, Marketing..."
                                                    className="bg-white/5 border-white/10 text-xs"
                                                    value={newKeyword}
                                                    onChange={(e) => setNewKeyword(e.target.value)}
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        if (newKeyword && !radarKeywords.includes(newKeyword)) {
                                                            setRadarKeywords([...radarKeywords, newKeyword]);
                                                            setNewKeyword('');
                                                        }
                                                    }}
                                                    className="bg-[#ff8c00] text-black hover:bg-[#ff8c00]/80 h-9 px-3"
                                                >
                                                    <PlusCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <ScrollArea className="h-32 w-full rounded-sm border border-white/5 bg-black/20 p-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {radarKeywords.map((kw, i) => (
                                                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/5 rounded-full group">
                                                            <span className="text-[9px] text-white/50 uppercase tracking-tighter">{kw}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setRadarKeywords(radarKeywords.filter((_, idx) => idx !== i))}
                                                                className="text-white/20 hover:text-red-500"
                                                            >
                                                                <Trash2 className="h-2.5 w-2.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {radarKeywords.length === 0 && <p className="text-[10px] text-white/20 italic">No focus keywords.</p>}
                                                </div>
                                            </ScrollArea>
                                            <input type="hidden" name="radarKeywords" value={JSON.stringify(radarKeywords)} />
                                        </div>
                                    </div>

                                    <div className="h-px bg-white/5 w-full" />

                                    {/* Reporting Cycle & Gating */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-[#ff8c00]" />
                                            <Label className="text-[10px] uppercase tracking-widest text-[#ff8c00] font-bold">Auto-Summary Window (Reporting Cycle)</Label>
                                        </div>
                                        <div className="grid md:grid-cols-4 gap-4">
                                            {['weekly', 'bi-weekly', 'monthly', 'daily'].map((cycle) => (
                                                <div
                                                    key={cycle}
                                                    onClick={() => setRadarCycle(cycle)}
                                                    className={cn(
                                                        "relative p-4 cursor-pointer border transition-all rounded-sm",
                                                        radarCycle === cycle
                                                            ? "bg-[#ff8c00]/10 border-[#ff8c00] shadow-[0_0_15px_rgba(255,140,0,0.1)]"
                                                            : "bg-white/[0.02] border-white/10 hover:border-white/20",
                                                        cycle === 'daily' && "border-dashed"
                                                    )}
                                                >
                                                    <p className={cn(
                                                        "text-[10px] uppercase font-bold tracking-widest text-center",
                                                        radarCycle === cycle ? "text-[#ff8c00]" : "text-white/40"
                                                    )}>
                                                        {cycle.replace('-', ' ')}
                                                    </p>
                                                    {cycle === 'daily' && (
                                                        <div className="absolute -top-2 -right-2 bg-[#ff8c00] text-black text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-lg pulse">
                                                            PREMIUM
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <input type="hidden" name="radarCycle" value={radarCycle} />

                                        {radarCycle === 'daily' && (
                                            <Alert className="bg-[#ff8c00]/5 border-[#ff8c00]/20 animate-pulse">
                                                <Bot className="h-4 w-4 text-[#ff8c00]" />
                                                <AlertTitle className="text-[#ff8c00] uppercase tracking-widest text-[10px] font-bold">Premium Protocol</AlertTitle>
                                                <AlertDescription className="text-white/60 text-[10px] italic">
                                                    Günlük raporlar yüksek sunucu kaynağı gerektirir. Eğer mevcut paketiniz uygun değilse, sistem otomatik olarak &quot;Haftalık&quot; raporlamaya geri dönecektir.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {(activeSettingsTab === 'company' || activeSettingsTab === 'radar') && (
                        <div className="bcc-glass border-none bg-white/[0.01] mt-12 p-6 flex justify-end">
                            <SaveSettingsButton />
                        </div>
                    )}
                </form>
            </div>
        </SiteSettingsLayoutWrapper>
    );
}

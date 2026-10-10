'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SiteSettings, siteSettingsData } from '@/lib/site-settings-data';
import { saveSiteSettings, SaveSettingsState } from './actions';
import { Building, Globe, Image as ImageIcon, Link2, Save, Trash2, PlusCircle, Facebook, Linkedin, Twitter, Youtube, Instagram, Share2, Component, Bot, ArrowRight, Loader2, Lightbulb, Tags, Terminal, TestTube2, KeyRound, Mail, Clock, Tv, Settings2, SlidersHorizontal, BarChart, Search, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { templates as emailTemplates } from '@/lib/newsletter-data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import MediaPicker from '@/components/media/MediaPicker';
import settingsService from '@/lib/api/settingsService';

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
    
    // This local state is for UI interactions only (adding/removing social links before saving)
    const [dynamicSocials, setDynamicSocials] = useState<{[key: string]: string}>({});
    const [newSocialPlatform, setNewSocialPlatform] = useState('');
    const [useSingleApiKey, setUseSingleApiKey] = useState(false);
    const [selectedEmailService, setSelectedEmailService] = useState('resend');
    const [templateSearch, setTemplateSearch] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const { toast } = useToast();

    const initialState: SaveSettingsState = { message: '', success: false };
    const [state, formAction] = useActionState(saveSiteSettings, initialState);

    // Fetch the latest settings from the backend when the component mounts
    useEffect(() => {
        const fetchCurrentSettings = async () => {
            try {
                const settings: any = await settingsService.getSiteSettings();
                console.log('Fetched settings from backend:', settings);
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
                console.error('Failed to fetch current settings:', error);
                // Fallback to static data
                console.log('Using fallback static data');
                setCurrentSettings(siteSettingsData);
                setDynamicSocials(siteSettingsData.socialMedia || {});
            } finally {
                setIsLoading(false);
            }
        };

        fetchCurrentSettings();
    }, []);

    // Use current settings from backend if available, otherwise fallback to static data
    const effectiveSettings = currentSettings || siteSettingsData;
    console.log('Effective settings being used:', effectiveSettings);

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
                        const settings: any = await settingsService.getSiteSettings();
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
                        console.error('Failed to fetch current settings:', error);
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

    const filteredTemplates = emailTemplates.filter(t => 
        t.name.toLowerCase().includes(templateSearch.toLowerCase())
    );

    const handleSendTestEmail = () => {
        if (selectedTemplateId) {
            const template = emailTemplates.find(t => t.id === selectedTemplateId);
            toast({
                title: 'Test Maili Gönderiliyor',
                description: `"${template?.name}" şablonu için test maili gönderiliyor...`,
            });
        }
    };

    // Show loading state while fetching settings
    if (isLoading) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Site Ayarları</h1>
                    <p className="text-muted-foreground">
                        Sitenizin genelinde kullanılacak kurumsal bilgileri, logoyu, sosyal medya ve SEO ayarlarını buradan yönetin.
                    </p>
                </div>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Site Ayarları</h1>
                <p className="text-muted-foreground">
                    Sitenizin genelinde kullanılacak kurumsal bilgileri, logoyu, sosyal medya ve SEO ayarlarını buradan yönetin.
                </p>
            </div>
            <form action={formAction}>
                 <Tabs defaultValue="company">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="company">Company</TabsTrigger>
                        <TabsTrigger value="ai">AI</TabsTrigger>
                        <TabsTrigger value="email">Email Settings</TabsTrigger>
                        <TabsTrigger value="social">Social Media</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="tab6">Tab 6</TabsTrigger>
                    </TabsList>
                    <TabsContent value="company" className="mt-6">
                        <div className="space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Kurumsal Kimlik</CardTitle>
                                    <CardDescription>Şirket adı ve logosu gibi temel kimlik bilgileri.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-8 items-start">
                                        <div className="space-y-2">
                                            <Label htmlFor="companyName">Şirket Adı</Label>
                                            <Input id="companyName" name="companyName" defaultValue={effectiveSettings.companyName || ''} />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="logoUrl">Logo (Açık Tema)</Label>
                                                <MediaPicker 
                                                  value={effectiveSettings.logoUrl?.includes('.') ? effectiveSettings.logoUrl.split('/').pop() : effectiveSettings.logoUrl} 
                                                  onChange={(mediaId) => {
                                                    // Update the hidden input with the media ID
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
                                                <Label htmlFor="logoDarkUrl">Logo (Koyu Tema)</Label>
                                                <MediaPicker 
                                                  value={effectiveSettings.logoDarkUrl?.includes('.') ? effectiveSettings.logoDarkUrl.split('/').pop() : effectiveSettings.logoDarkUrl} 
                                                  onChange={(mediaId) => {
                                                    // Update the hidden input with the media ID
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

                            <Card>
                                <CardHeader>
                                    <CardTitle>İletişim ve Adres Bilgileri</CardTitle>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Genel E-posta</Label>
                                        <Input id="email" name="email" type="email" defaultValue={effectiveSettings.contact?.email || ''} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Genel Telefon</Label>
                                        <Input id="phone" name="phone" type="tel" defaultValue={effectiveSettings.contact?.phone || ''} />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label htmlFor="address">Adres</Label>
                                        <Textarea id="address" name="address" defaultValue={effectiveSettings.contact?.address || ''} />
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardHeader>
                                    <CardTitle>Genel SEO Ayarları</CardTitle>
                                    <CardDescription>Arama motorları için sitenizin varsayılan görünümü.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="defaultTitle">Varsayılan Site Başlığı</Label>
                                        <Input id="defaultTitle" name="defaultTitle" defaultValue={effectiveSettings.seo?.defaultTitle || ''} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="defaultDescription">Varsayılan Site Açıklaması</Label>
                                        <Textarea id="defaultDescription" name="defaultDescription" defaultValue={effectiveSettings.seo?.defaultDescription || ''} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    <TabsContent value="ai" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Bot className="h-6 w-6 text-primary"/>AI Ayarları</CardTitle>
                                <CardDescription>
                                    Projedeki yapay zeka özelliklerinin genel ayarlarını ve varsayılan davranışlarını yönetin.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-8">
                                    <div className="space-y-4 p-4 border rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="single-api-key" checked={useSingleApiKey} onCheckedChange={(checked) => setUseSingleApiKey(Boolean(checked))} />
                                            <Label htmlFor="single-api-key">Tüm modüller için tek bir API anahtarı kullan</Label>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="global-api-key" className="sr-only">Global API Key</Label>
                                            <Input id="global-api-key" placeholder="Global API Anahtarını Girin" icon={KeyRound} disabled={!useSingleApiKey}/>
                                        </div>
                                    </div>

                                    <Separator />
                                    
                                    <div className="space-y-4 p-4 border rounded-lg">
                                        <h3 className="font-semibold text-lg">Social Media</h3>
                                        <div className="grid md:grid-cols-3 gap-4 items-end">
                                            <div className="md:col-span-2 space-y-2">
                                                <Label htmlFor="social-api-key">API Key</Label>
                                                <Input id="social-api-key" placeholder="API Anahtarını Girin" icon={KeyRound} disabled={useSingleApiKey} />
                                            </div>
                                            <div className="space-y-2">
                                                 <Label htmlFor="social-model">Model Seçimi</Label>
                                                 <Select>
                                                    <SelectTrigger id="social-model"><SelectValue placeholder="Model seçin..."/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="local">Local</SelectItem>
                                                        <SelectItem value="api">API</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <Button variant="outline" type="button" className="w-full md:w-auto"><TestTube2 className="mr-2"/>Bağlantıyı Test Et</Button>
                                    </div>
                                     <Separator />
                                     <div className="space-y-4 p-4 border rounded-lg">
                                        <h3 className="font-semibold text-lg">Email Marketing</h3>
                                        <div className="grid md:grid-cols-3 gap-4 items-end">
                                            <div className="md:col-span-2 space-y-2">
                                                <Label htmlFor="email-api-key">API Key</Label>
                                                <Input id="email-api-key" placeholder="API Anahtarını Girin" icon={KeyRound} disabled={useSingleApiKey}/>
                                            </div>
                                            <div className="space-y-2">
                                                 <Label htmlFor="email-model">Model Seçimi</Label>
                                                 <Select>
                                                    <SelectTrigger id="email-model"><SelectValue placeholder="Model seçin..."/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="local">Local</SelectItem>
                                                        <SelectItem value="api">API</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                         <Button variant="outline" type="button" className="w-full md:w-auto"><TestTube2 className="mr-2"/>Modeli Test Et</Button>
                                    </div>
                                     <Separator />
                                      <div className="space-y-4 p-4 border rounded-lg">
                                        <h3 className="font-semibold text-lg">Support Chatbot</h3>
                                        <div className="grid md:grid-cols-3 gap-4 items-end">
                                            <div className="md:col-span-2 space-y-2">
                                                <Label htmlFor="support-api-key">API Key</Label>
                                                <Input id="support-api-key" placeholder="API Anahtarını Girin" icon={KeyRound} disabled={useSingleApiKey}/>
                                            </div>
                                            <div className="space-y-2">
                                                 <Label htmlFor="support-model">Model Seçimi</Label>
                                                 <Select>
                                                    <SelectTrigger id="support-model"><SelectValue placeholder="Model seçin..."/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="local">Local</SelectItem>
                                                        <SelectItem value="api">API</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                         <Button variant="outline" type="button" className="w-full md:w-auto"><TestTube2 className="mr-2"/>Bağlantıyı Test Et</Button>
                                    </div>
                                     <Separator />
                                    <div className="space-y-4 p-4 border rounded-lg">
                                        <h3 className="font-semibold text-lg">Analytics (opsiyonel)</h3>
                                        <div className="grid md:grid-cols-3 gap-4 items-end">
                                            <div className="md:col-span-2 space-y-2">
                                                <Label htmlFor="analytics-api-key">API Key</Label>
                                                <Input id="analytics-api-key" placeholder="API Anahtarını Girin" icon={KeyRound} disabled={useSingleApiKey}/>
                                            </div>
                                            <div className="space-y-2">
                                                 <Label htmlFor="analytics-model">Model Seçimi</Label>
                                                 <Select>
                                                    <SelectTrigger id="analytics-model"><SelectValue placeholder="Model seçin..."/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="local">Local</SelectItem>
                                                        <SelectItem value="api">API</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                         <Button variant="outline" type="button" className="w-full md:w-auto"><TestTube2 className="mr-2"/>Bağlantıyı Test Et</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="email" className="mt-6">
                         <Card>
                            <CardHeader>
                                <CardTitle>Email Ayarları</CardTitle>
                                <CardDescription>Sistem tarafından gönderilecek e-postalar için varsayılan servisi ve ayarları yapılandırın.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="space-y-2">
                                    <Label htmlFor="default-email-service">Varsayılan Email Servisi</Label>
                                    <Select value={selectedEmailService} onValueChange={setSelectedEmailService}>
                                        <SelectTrigger id="default-email-service" className="w-full md:w-1/3">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="resend">Resend</SelectItem>
                                            <SelectItem value="sendgrid">SendGrid</SelectItem>
                                            <SelectItem value="postmark">Postmark</SelectItem>
                                            <SelectItem value="mailgun">Mailgun</SelectItem>
                                            <SelectItem value="ses">Amazon SES</SelectItem>
                                            <SelectItem value="gmail">Gmail SMTP</SelectItem>
                                            <SelectItem value="smtp">SMTP (Özel)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <Separator/>

                                <div>
                                    <h3 className="text-lg font-medium mb-4">API Anahtarları ve Yapılandırma</h3>
                                    <div className="space-y-4">
                                        {selectedEmailService === 'resend' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="resend-api-key">Resend API Key</Label>
                                                <Input id="resend-api-key" placeholder="re_..." icon={KeyRound}/>
                                            </div>
                                        )}
                                        {selectedEmailService === 'sendgrid' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="sendgrid-api-key">SendGrid API Key</Label>
                                                <Input id="sendgrid-api-key" placeholder="SG..." icon={KeyRound}/>
                                            </div>
                                        )}
                                         {selectedEmailService === 'postmark' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="postmark-api-key">Postmark API Key</Label>
                                                <Input id="postmark-api-key" placeholder="..." icon={KeyRound}/>
                                            </div>
                                        )}
                                        {selectedEmailService === 'mailgun' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="mailgun-api-key">Mailgun API Key</Label>
                                                <Input id="mailgun-api-key" placeholder="key-..." icon={KeyRound}/>
                                            </div>
                                        )}
                                        {selectedEmailService === 'ses' && (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="ses-access-key">Amazon SES Access Key</Label>
                                                    <Input id="ses-access-key" placeholder="AKIA..." icon={KeyRound}/>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="ses-secret-key">Amazon SES Secret Key</Label>
                                                    <Input id="ses-secret-key" type="password" icon={KeyRound}/>
                                                </div>
                                            </div>
                                        )}
                                         {selectedEmailService === 'gmail' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="gmail-app-pass">Gmail App Password</Label>
                                                <Input id="gmail-app-pass" type="password" placeholder="Google Hesabından oluşturulan uygulama şifresi" icon={KeyRound}/>
                                            </div>
                                        )}
                                         {selectedEmailService === 'smtp' && (
                                             <Card className="bg-secondary/50 p-4">
                                                <CardHeader className="p-2">
                                                    <CardTitle>Özel SMTP Ayarları</CardTitle>
                                                </CardHeader>
                                                 <CardContent className="p-2 space-y-4">
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div className="space-y-2"><Label htmlFor="smtp-host">Host</Label><Input id="smtp-host" placeholder="smtp.example.com"/></div>
                                                        <div className="space-y-2"><Label htmlFor="smtp-port">Port</Label><Input id="smtp-port" placeholder="587"/></div>
                                                    </div>
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div className="space-y-2"><Label htmlFor="smtp-user">Username</Label><Input id="smtp-user" placeholder="user@example.com"/></div>
                                                        <div className="space-y-2"><Label htmlFor="smtp-pass">Password</Label><Input id="smtp-pass" type="password"/></div>
                                                    </div>
                                                     <div className="grid md:grid-cols-2 gap-4">
                                                        <div className="space-y-2"><Label htmlFor="smtp-from-name">From Name</Label><Input id="smtp-from-name" defaultValue={effectiveSettings.companyName}/></div>
                                                        <div className="space-y-2"><Label htmlFor="smtp-from-email">From Email</Label><Input id="smtp-from-email" defaultValue={effectiveSettings.contact?.email}/></div>
                                                    </div>
                                                 </CardContent>
                                             </Card>
                                         )}
                                    </div>
                                </div>
                                
                                <Separator/>

                                <div>
                                    <h3 className="text-lg font-medium mb-4">Varsayılan Şablonlar</h3>
                                    <div className="space-y-4">
                                        <Input 
                                            placeholder="Şablon ara..." 
                                            icon={Search} 
                                            value={templateSearch} 
                                            onChange={(e) => setTemplateSearch(e.target.value)}
                                        />
                                        <ScrollArea className="h-60 w-full rounded-md border p-2">
                                            <div className="space-y-1">
                                                {filteredTemplates.length > 0 ? filteredTemplates.map(template => (
                                                    <div 
                                                        key={template.id} 
                                                        className={cn("p-2 rounded-md hover:bg-muted text-sm cursor-pointer", selectedTemplateId === template.id && "bg-primary/10 text-primary font-semibold")}
                                                        onClick={() => setSelectedTemplateId(template.id)}
                                                    >
                                                        {template.name}
                                                    </div>
                                                )) : (
                                                    <p className="p-2 text-sm text-muted-foreground text-center">Şablon bulunamadı.</p>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </div>
                            </CardContent>
                             <CardFooter className="flex justify-between items-center">
                                <Button type="button" variant="outline" onClick={handleSendTestEmail} disabled={!selectedTemplateId}>
                                    <Mail className="mr-2"/> Test Maili Gönder
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                    <TabsContent value="social" className="mt-6">
                        <div className="space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Sosyal Medya Hesapları</CardTitle>
                                    <CardDescription>Kullanıcıların sitenizde göreceği sosyal medya linklerini yönetin.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {Object.entries(dynamicSocials).map(([platform, url]) => {
                                        const Icon = socialIcons[platform] || Link2;
                                        return (
                                            <div key={platform} className="flex items-center gap-2">
                                                <div className="relative flex-grow flex items-center">
                                                    <Icon className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        id={`social-${platform}`} 
                                                        name={`social-${platform}`}
                                                        defaultValue={url || ''}
                                                        className="pl-10"
                                                        placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`}
                                                    />
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemoveSocialLink(platform)}>
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">{platform} hesabını sil</span>
                                                </Button>
                                            </div>
                                        )
                                    })}
                                    <div className="flex items-center gap-2 pt-4 border-t">
                                        <Select value={newSocialPlatform} onValueChange={setNewSocialPlatform}>
                                            <SelectTrigger className="flex-grow">
                                                <SelectValue placeholder="Eklemek için bir platform seçin..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availablePlatforms.map(platform => (
                                                    <SelectItem key={platform} value={platform}>
                                                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button type="button" onClick={handleAddSocialLink} disabled={!newSocialPlatform}>
                                            <PlusCircle className="mr-2 h-4 w-4"/> Ekle
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                 <CardHeader>
                                    <CardTitle>1. Varsayılan Platform</CardTitle>
                                    <CardDescription>Yeni AI önerilen gönderiler varsayılan olarak bu platforma hazırlanır.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Select defaultValue="twitter">
                                        <SelectTrigger className="w-full md:w-1/2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="twitter">Twitter</SelectItem>
                                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                                            <SelectItem value="instagram">Instagram</SelectItem>
                                            <SelectItem value="facebook">Facebook</SelectItem>
                                            <SelectItem value="tiktok">TikTok</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    <TabsContent value="analytics" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Analytics Ayarları</CardTitle>
                                <CardDescription>Google Analytics gibi izleme araçları için yapılandırmalar.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Dikkat</AlertTitle>
                                    <AlertDescription>
                                        Analytics yapılandırmaları henüz tamamlanmadı. Lütfen daha sonra tekrar kontrol edin.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="tab6" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Tab 6</CardTitle>
                                <CardDescription>Ek ayarlar ve yapılandırmalar.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Dikkat</AlertTitle>
                                    <AlertDescription>
                                        Bu sekme henüz yapılandırılmadı. Lütfen daha sonra tekrar kontrol edin.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
                <Card className="mt-8">
                    <CardFooter className="flex justify-end">
                        <SaveSettingsButton />
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
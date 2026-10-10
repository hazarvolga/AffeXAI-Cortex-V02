'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Save, Server, Cloud, Database, HardDrive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import settingsService, { StorageSettings, StorageProvider } from '@/lib/api/settingsService';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function StorageSettingsTab() {
    const [settings, setSettings] = useState<StorageSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);
    const { toast } = useToast();

    useEffect(() => {
        let active = true;
        settingsService.getStorageSettings()
            .then((data) => {
                if (!active) return;
                setSettings(data);
                setLoadError(null);
            })
            .catch(() => {
                if (!active) return;
                setSettings(null);
                setLoadError('Depolama ayarları yüklenemedi.');
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });
        return () => {
            active = false;
        };
    }, [reloadToken]);

    const handleSave = async () => {
        if (!settings) return;

        try {
            setIsSaving(true);
            await settingsService.updateStorageSettings(settings);
            const persisted = await settingsService.getStorageSettings();
            setSettings(persisted);
            toast({
                title: 'Başarılı',
                description: 'Depolama ayarları kaydedildi.',
            });
        } catch (error) {
            toast({
                title: 'Hata',
                description: 'Ayarlar kaydedilirken bir hata oluştu.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const updateProvider = (provider: StorageProvider) => {
        if (!settings) return;
        setSettings({ ...settings, provider });
    };

    const updateConfig = (section: keyof StorageSettings, key: string, value: any) => {
        if (!settings) return;
        setSettings({
            ...settings,
            [section]: {
                ...(settings[section] as any || {}),
                [key]: value
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (loadError || !settings) {
        return (
            <Alert className="border-red-500/30 bg-red-500/5">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertTitle>Depolama ayarları kullanılamıyor</AlertTitle>
                <AlertDescription className="flex items-center justify-between gap-4">
                    <span>{loadError || 'Depolama yapılandırması bulunamadı.'}</span>
                    <Button type="button" variant="outline" onClick={() => {
                        setIsLoading(true);
                        setLoadError(null);
                        setReloadToken((value) => value + 1);
                    }}>Yeniden dene</Button>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Card className="border-t-4 border-t-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-primary" />
                    Depolama Ayarları
                </CardTitle>
                <CardDescription>
                    Dosya yüklemeleri ve medya depolama için kullanılacak servisi yapılandırın.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Provider Selection */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="storage-provider">Depolama Sağlayıcısı</Label>
                        <Select value={settings.provider} onValueChange={(v) => updateProvider(v as StorageProvider)}>
                            <SelectTrigger id="storage-provider" className="w-full md:w-1/3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="local">
                                    <div className="flex items-center gap-2">
                                        <Server className="h-4 w-4" />
                                        <span>Yerel Sunucu</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="aws_s3">
                                    <div className="flex items-center gap-2">
                                        <Cloud className="h-4 w-4" />
                                        <span>Amazon S3</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="cloudflare_r2">
                                    <div className="flex items-center gap-2">
                                        <Cloud className="h-4 w-4" />
                                        <span>Cloudflare R2</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="digital_ocean_spaces">
                                    <div className="flex items-center gap-2">
                                        <Cloud className="h-4 w-4" />
                                        <span>DigitalOcean Spaces</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="minio">
                                    <div className="flex items-center gap-2">
                                        <Database className="h-4 w-4" />
                                        <span>MinIO (Özel)</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            {settings.provider === 'local'
                                ? 'Dosyalar uygulama sunucusunun kalıcı veri alanında saklanır.'
                                : 'Dosyalar harici bir bulut depolama servisinde saklanır. Sunucu yükünü azaltır ve ölçeklenebilir.'}
                        </p>
                    </div>

                    <div className="flex items-center space-x-2 border p-4 rounded-md bg-secondary/10">
                        <Switch
                            id="use-local-fallback"
                            checked={settings.useLocalFallback}
                            onCheckedChange={(checked) => setSettings({ ...settings, useLocalFallback: checked })}
                        />
                        <div className="space-y-1">
                            <Label htmlFor="use-local-fallback">Yedekleme Modu (Fallback)</Label>
                            <p className="text-xs text-muted-foreground">
                                Bulut sağlayıcısına erişilemezse, dosyaları geçici olarak yerel sunucuya kaydet.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Configuration Forms */}
                <div className="space-y-6">
                    {/* AWS S3 Config */}
                    {settings.provider === 'aws_s3' && (
                        <div className="grid gap-6 animate-in fade-in slide-in-from-top-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Access Key ID</Label>
                                    <Input
                                        value={settings.awsS3?.accessKeyId || ''}
                                        onChange={(e) => updateConfig('awsS3', 'accessKeyId', e.target.value)}
                                        placeholder="AKIA..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Secret Access Key</Label>
                                    <Input
                                        type="password"
                                        value={settings.awsS3?.secretAccessKey || ''}
                                        onChange={(e) => updateConfig('awsS3', 'secretAccessKey', e.target.value)}
                                        placeholder="Destructive action: Input masked"
                                    />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Region</Label>
                                    <Input
                                        value={settings.awsS3?.region || ''}
                                        onChange={(e) => updateConfig('awsS3', 'region', e.target.value)}
                                        placeholder="us-east-1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Bucket Name</Label>
                                    <Input
                                        value={settings.awsS3?.bucket || ''}
                                        onChange={(e) => updateConfig('awsS3', 'bucket', e.target.value)}
                                        placeholder="my-app-uploads"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cloudflare R2 Config */}
                    {settings.provider === 'cloudflare_r2' && (
                        <div className="grid gap-6 animate-in fade-in slide-in-from-top-4">
                            <div className="space-y-2">
                                <Label>Account ID</Label>
                                <Input
                                    value={settings.cloudflareR2?.accountId || ''}
                                    onChange={(e) => updateConfig('cloudflareR2', 'accountId', e.target.value)}
                                    placeholder="Cloudflare Account ID"
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Access Key ID</Label>
                                    <Input
                                        value={settings.cloudflareR2?.accessKeyId || ''}
                                        onChange={(e) => updateConfig('cloudflareR2', 'accessKeyId', e.target.value)}
                                        placeholder="R2 Access Key"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Secret Access Key</Label>
                                    <Input
                                        type="password"
                                        value={settings.cloudflareR2?.secretAccessKey || ''}
                                        onChange={(e) => updateConfig('cloudflareR2', 'secretAccessKey', e.target.value)}
                                        placeholder="Destructive action: Input masked"
                                    />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Bucket Name</Label>
                                    <Input
                                        value={settings.cloudflareR2?.bucket || ''}
                                        onChange={(e) => updateConfig('cloudflareR2', 'bucket', e.target.value)}
                                        placeholder="my-r2-bucket"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Public URL (Custom Domain)</Label>
                                    <Input
                                        value={settings.cloudflareR2?.publicUrl || ''}
                                        onChange={(e) => updateConfig('cloudflareR2', 'publicUrl', e.target.value)}
                                        placeholder="https://cdn.example.com"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {settings.provider === 'digital_ocean_spaces' && (
                        <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-4">
                            {[
                                ['accessKeyId', 'Access Key ID', 'text'],
                                ['secretAccessKey', 'Secret Access Key', 'password'],
                                ['region', 'Region', 'text'],
                                ['bucket', 'Bucket', 'text'],
                                ['endpoint', 'Endpoint', 'url'],
                                ['cdnUrl', 'CDN URL', 'url'],
                            ].map(([key, label, type]) => (
                                <div className="space-y-2" key={key}>
                                    <Label>{label}</Label>
                                    <Input
                                        type={type}
                                        value={String(settings.digitalOceanSpaces?.[key as keyof NonNullable<StorageSettings['digitalOceanSpaces']>] || '')}
                                        onChange={(event) => updateConfig('digitalOceanSpaces', key, event.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {settings.provider === 'minio' && (
                        <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-4">
                            {[
                                ['endPoint', 'Endpoint', 'text'],
                                ['port', 'Port', 'number'],
                                ['accessKey', 'Access Key', 'password'],
                                ['secretKey', 'Secret Key', 'password'],
                                ['bucket', 'Bucket', 'text'],
                                ['publicUrl', 'Public URL', 'url'],
                            ].map(([key, label, type]) => (
                                <div className="space-y-2" key={key}>
                                    <Label>{label}</Label>
                                    <Input
                                        type={type}
                                        value={String(settings.minio?.[key as keyof NonNullable<StorageSettings['minio']>] ?? '')}
                                        onChange={(event) => updateConfig('minio', key, type === 'number' ? Number(event.target.value) : event.target.value)}
                                    />
                                </div>
                            ))}
                            <div className="flex items-center justify-between border p-4 rounded-md bg-secondary/10">
                                <Label>HTTPS / TLS</Label>
                                <Switch
                                    checked={Boolean(settings.minio?.useSSL)}
                                    onCheckedChange={(checked) => updateConfig('minio', 'useSSL', checked)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Local storage uses the deployment's persistent volume. */}
                    {settings.provider === 'local' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                            <div className="p-4 bg-muted rounded-md border flex items-start gap-3">
                                <Database className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-sm">Yerel kalıcı depolama</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Dosyalar Docker persistent volume üzerinde saklanır. Ek sağlayıcı bilgisi gerekmez.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 bg-muted/10">
                <Button type="button" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Kaydediliyor...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Ayarları Kaydet
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, KeyRound, Loader2, Save } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import settingsService, { EmailProvider, EmailSettings } from '@/lib/api/settingsService';

const PROVIDERS: Array<{ value: EmailProvider; label: string }> = [
  { value: 'resend', label: 'Resend' },
  { value: 'sendgrid', label: 'SendGrid' },
  { value: 'postmark', label: 'Postmark' },
  { value: 'mailgun', label: 'Mailgun' },
  { value: 'ses', label: 'Amazon SES' },
  { value: 'smtp', label: 'SMTP' },
];

type IdentityKey = 'transactional' | 'marketing';

export function EmailSettingsTab() {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const value = await settingsService.getEmailSettings();
        if (active) setSettings(value);
      } catch {
        if (active) {
          setSettings(null);
          setError('Email ayarları yüklenemedi.');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [reloadToken]);

  const updateIdentity = (scope: IdentityKey, key: string, value: string) => {
    setSettings((current) => current ? {
      ...current,
      [scope]: { ...current[scope], [key]: value },
    } : current);
  };

  const updateProvider = (provider: EmailProvider) => {
    setSettings((current) => current ? { ...current, provider } : current);
  };

  const updateProviderConfig = (key: string, value: string | number | boolean) => {
    setSettings((current) => {
      if (!current) return current;
      const provider = current.provider;
      return {
        ...current,
        [provider]: { ...(current[provider] as Record<string, unknown> | undefined), [key]: value },
      };
    });
  };

  const save = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const persisted = await settingsService.updateEmailSettings(settings);
      setSettings(persisted);
      toast({ title: 'Email ayarları kaydedildi', description: 'Kalıcı yapılandırma yeniden okundu.' });
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Email ayarları kaydedilemedi.';
      toast({ title: 'Kayıt başarısız', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#ff8c00]" /></div>;
  }

  if (error || !settings) {
    return (
      <Alert className="border-red-500/30 bg-red-500/5">
        <AlertCircle className="h-4 w-4 text-red-400" />
        <AlertTitle>Email ayarları kullanılamıyor</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{error || 'Email yapılandırması bulunamadı.'}</span>
          <Button type="button" variant="outline" onClick={() => setReloadToken((value) => value + 1)}>Yeniden dene</Button>
        </AlertDescription>
      </Alert>
    );
  }

  const providerConfig = settings[settings.provider] as Record<string, any> | undefined;

  return (
    <Card className="bcc-glass border-none bg-white/[0.02]">
      <CardHeader className="border-b border-white/5">
        <CardTitle className="text-xs font-bold uppercase tracking-[0.3em]">Email Infrastructure</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 pt-8">
        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-widest text-white/40">Provider</Label>
          <Select value={settings.provider} onValueChange={(value: EmailProvider) => updateProvider(value)}>
            <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#0a0a0a] border-white/10">
              {PROVIDERS.map((provider) => <SelectItem key={provider.value} value={provider.value}>{provider.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <ProviderFields provider={settings.provider} config={providerConfig} update={updateProviderConfig} />

        <div className="grid gap-6 lg:grid-cols-2">
          {(['transactional', 'marketing'] as const).map((scope) => (
            <div key={scope} className="space-y-4 border border-white/10 bg-black/20 p-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#ff8c00]">{scope}</h3>
              {[
                ['domain', 'Domain'],
                ['fromName', 'Gönderen adı'],
                ['fromEmail', 'Gönderen email'],
                ['replyToEmail', 'Yanıt adresi'],
              ].map(([key, label]) => (
                <div className="space-y-2" key={key}>
                  <Label className="text-[10px] uppercase text-white/40">{label}</Label>
                  <Input
                    type={key.toLowerCase().includes('email') ? 'email' : 'text'}
                    value={String(settings[scope][key as keyof typeof settings[typeof scope]] || '')}
                    onChange={(event) => updateIdentity(scope, key, event.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['openTracking', 'Açılma takibi'],
            ['clickTracking', 'Tıklama takibi'],
          ].map(([key, label]) => (
            <div className="flex items-center justify-between border border-white/10 bg-black/20 p-4" key={key}>
              <Label className="text-[10px] uppercase tracking-widest">{label}</Label>
              <Switch
                checked={Boolean(settings.tracking?.[key as keyof NonNullable<EmailSettings['tracking']>])}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  tracking: { ...settings.tracking, [key]: checked },
                })}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={() => void save()} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Email ayarlarını kaydet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProviderFields({
  provider,
  config,
  update,
}: {
  provider: EmailProvider;
  config?: Record<string, any>;
  update: (key: string, value: string | number | boolean) => void;
}) {
  const fields: Record<EmailProvider, Array<{ key: string; label: string; secret?: boolean; number?: boolean }>> = {
    resend: [{ key: 'apiKey', label: 'Resend API Key', secret: true }],
    sendgrid: [{ key: 'apiKey', label: 'SendGrid API Key', secret: true }],
    postmark: [{ key: 'apiKey', label: 'Postmark API Key', secret: true }],
    mailgun: [{ key: 'apiKey', label: 'Mailgun API Key', secret: true }, { key: 'domain', label: 'Mailgun Domain' }],
    ses: [
      { key: 'accessKey', label: 'Access Key', secret: true },
      { key: 'secretKey', label: 'Secret Key', secret: true },
      { key: 'region', label: 'Region' },
    ],
    smtp: [
      { key: 'host', label: 'SMTP Host' },
      { key: 'port', label: 'Port', number: true },
      { key: 'user', label: 'Kullanıcı' },
      { key: 'password', label: 'Şifre', secret: true },
    ],
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {fields[provider].map((field) => (
        <div className="space-y-2" key={field.key}>
          <Label className="text-[10px] uppercase text-white/40">{field.label}</Label>
          <Input
            icon={field.secret ? KeyRound : undefined}
            type={field.secret ? 'password' : field.number ? 'number' : 'text'}
            value={String(config?.[field.key] ?? '')}
            onChange={(event) => update(field.key, field.number ? Number(event.target.value) : event.target.value)}
            autoComplete="new-password"
            className="bg-white/5 border-white/10"
          />
        </div>
      ))}
      {provider === 'smtp' && (
        <div className="flex items-center justify-between border border-white/10 bg-black/20 p-4">
          <Label className="text-[10px] uppercase tracking-widest">TLS</Label>
          <Switch checked={Boolean(config?.secure)} onCheckedChange={(checked) => update('secure', checked)} />
        </div>
      )}
    </div>
  );
}

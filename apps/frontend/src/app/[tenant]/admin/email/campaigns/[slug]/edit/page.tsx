'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Eye, Sparkles } from 'lucide-react';
import Link from 'next/link';
import emailCampaignsService, { EmailCampaign, UpdateCampaignDto } from '@/lib/api/emailCampaignsService';
import templatesService, { EmailTemplate } from '@/lib/api/templatesService';
import { Badge } from '@/components/ui/badge';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { EmailModuleNav } from '@/components/admin/email/EmailModuleNav';
import { format } from 'date-fns';

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;
  const slug = params.slug as string;

  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    templateId: '',
    fromName: '',
    fromEmail: '',
    replyTo: '',
  });

  useEffect(() => {
    if (slug) {
      fetchData();
    }
  }, [slug]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Try getBySlug first, fallback to ID if needed
      let campaignData: EmailCampaign;
      try {
        campaignData = await emailCampaignsService.getBySlug(slug);
      } catch (e) {
        if (slug.length > 20) {
          campaignData = await emailCampaignsService.getById(slug);
        } else {
          throw e;
        }
      }

      const templatesData = await templatesService.getAllTemplates();

      setCampaign(campaignData);
      setTemplates(templatesData);

      // Set form data - use type assertion for optional properties
      const campaignAny = campaignData as any;
      setFormData({
        name: campaignData.name || '',
        subject: campaignData.subject || '',
        content: campaignData.content || '',
        templateId: campaignAny.templateId || '',
        fromName: campaignAny.fromName || '',
        fromEmail: campaignAny.fromEmail || '',
        replyTo: campaignAny.replyTo || '',
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Veri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!campaign) return;

    try {
      setSaving(true);

      const updateData: Partial<UpdateCampaignDto> & Record<string, unknown> = {
        name: formData.name,
        subject: formData.subject,
        content: formData.content,
        templateId: formData.templateId || undefined,
        fromName: formData.fromName || undefined,
        fromEmail: formData.fromEmail || undefined,
        replyTo: formData.replyTo || undefined,
      };

      await emailCampaignsService.update(campaign.id, updateData as UpdateCampaignDto);

      // Redirect back to campaign detail
      router.push(`/${tenant}/admin/email/campaigns/${campaign.slug || campaign.id}`);
    } catch (err) {
      console.error('Error saving campaign:', err);
      setError('CRITICAL_SYNC_FAILURE: SAVE_INTERRUPT');
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    setFormData(prev => ({ ...prev, templateId }));

    // If it's a file template, we could potentially load its content
    // For now, just update the templateId
  };

  if (loading) {
    return (
      <BccEditorialWrapper headerTitle="Unit Configuration" headerBadge="Status" moduleNav={<EmailModuleNav />}>
        <div className="flex items-center justify-center py-48">
          <div className="font-mono text-[11px] uppercase tracking-[0.4em] text-[#ff8c00] animate-pulse">Establishing Signal...</div>
        </div>
      </BccEditorialWrapper>
    );
  }

  if (error || !campaign) {
    return (
      <BccEditorialWrapper headerTitle="Protocol Error" headerBadge="Failure" moduleNav={<EmailModuleNav />}>
        <div className="flex flex-col items-center justify-center py-48 gap-6 border border-white/5 bg-white/[0.01]">
          <div className="text-[11px] font-mono text-red-500 uppercase tracking-widest">{error || 'ID_NOT_FOUND'}</div>
          <Button variant="outline" className="rounded-none border-white/10 text-[10px] uppercase tracking-widest px-8" onClick={fetchData}>
            RE-SYNC
          </Button>
        </div>
      </BccEditorialWrapper>
    );
  }

  return (
    <BccEditorialWrapper
      headerTitle="CONFIGURE_UNIT"
      headerSubtitle={campaign.name}
      headerBadge="Edit_Mode"
      moduleNav={<EmailModuleNav />}
      telemetryData={[
        { label: "PROTOCOL_STATUS", value: "CONFIGURING", color: "#ff8c00" },
        { label: "LATTICE_SYNC", value: "STABLE", color: "#9df425" }
      ]}
    >
      <div className="space-y-12 animate-in fade-in duration-1000">
        <div className="flex items-center justify-between gap-6 bg-white/[0.02] border border-white/5 p-6 backdrop-blur-md">
          <Button variant="ghost" asChild className="rounded-none border border-white/5 bg-white/5 text-[9px] font-bold uppercase tracking-widest hover:text-[#ff8c00]">
            <Link href={`/${tenant}/admin/email/campaigns/${slug}`}>
              <ArrowLeft className="mr-2 h-3.5 w-3.5 opacity-40" /> BACK_TO_UNIT
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild className="rounded-none border-white/10 text-[9px] font-bold uppercase tracking-widest h-10 px-6">
              <Link href={`/${tenant}/admin/email/campaigns/${slug}`}>
                <Eye className="mr-2 h-3.5 w-3.5 opacity-40" /> PREVIEW_SIGNAL
              </Link>
            </Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-none bg-[#9df425] text-black hover:bg-[#86d11f] font-bold uppercase text-[9px] tracking-[0.2em] px-8 h-10 transition-all">
              <Save className="mr-2 h-3.5 w-3.5" /> {saving ? 'SYNCING...' : 'COMMIT_CHANGES'}
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 font-mono uppercase">
          <div className="lg:col-span-2 space-y-8">
            <BccHudTile title="UNIT_PROPERTIES" subtitle="Core transmission parameters" icon="settings">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] text-white/40 tracking-widest">Protocol_Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/5 border-white/10 rounded-none h-10 text-[10px] tracking-widest"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] text-white/40 tracking-widest">Subject_Vector</Label>
                  <div className="flex gap-4">
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      className="bg-white/5 border-white/10 rounded-none h-10 text-[10px] tracking-widest flex-1"
                    />
                    <Button variant="outline" size="icon" type="button" className="rounded-none border-white/10">
                      <Sparkles className="h-4 w-4 text-[#ff8c00]" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] text-white/40 tracking-widest">Initial_Source</Label>
                    <Input
                      value={formData.fromName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fromName: e.target.value }))}
                      className="bg-white/5 border-white/10 rounded-none h-10 text-[10px] tracking-widest"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] text-white/40 tracking-widest">Source_Email</Label>
                    <Input
                      type="email"
                      value={formData.fromEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, fromEmail: e.target.value }))}
                      className="bg-white/5 border-white/10 rounded-none h-10 text-[10px] tracking-widest"
                    />
                  </div>
                </div>
              </div>
            </BccHudTile>

            <BccHudTile title="PAYLOAD_EDITOR" subtitle="HTML Lattice Configuration" icon="edit">
              <div className="space-y-4">
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="bg-white/5 border-white/10 rounded-none min-h-[500px] text-[10px] font-mono tracking-widest leading-relaxed focus-visible:ring-[#9df425]/40"
                />
                <div className="flex items-center gap-2 text-[9px] text-white/20">
                  <Save className="w-3 h-3" />
                  <span>REAL-TIME_AUTO_BUFFERING_ACTIVE_V2.4</span>
                </div>
              </div>
            </BccHudTile>
          </div>

          <div className="space-y-8">
            <BccHudTile title="TEMPLATE_LATTICE" subtitle="Identity-based visual presets" icon="layout">
              <div className="space-y-6">
                <Select value={formData.templateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="bg-white/5 border-white/10 rounded-none h-10 text-[10px] tracking-widest">
                    <SelectValue placeholder="SELECT_LATTICE" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-none text-white font-mono uppercase">
                    <SelectItem value="none" className="text-[10px] tracking-widest">ZERO_TEMPLATE</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id} className="text-[10px] tracking-widest">
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {formData.templateId && formData.templateId !== 'none' && (
                  <div className="p-4 bg-[#9df425]/5 border border-[#9df425]/10">
                    <p className="text-[9px] text-[#9df425]/60 leading-relaxed">
                      LATTICE_SYNC_PROTOCOL_ACTIVE. PAYLOAD_WILL_DERIVE_FROM_SELECTED_PRESET.
                    </p>
                  </div>
                )}
              </div>
            </BccHudTile>

            <BccHudTile title="UNIT_STATUS" subtitle="Sync state registry" icon="activity">
              <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[9px] font-bold text-white/40 tracking-widest">CURRENT_STATE</span>
                  <Badge className="bg-white/10 text-white rounded-none border-none text-[8px] px-3 font-bold">{campaign.status.toUpperCase()}</Badge>
                </div>
                <div className="flex justify-between items-center px-2 border-t border-white/5 pt-4">
                  <span className="text-[9px] font-bold text-white/40 tracking-widest">LAST_SYNC</span>
                  <span className="text-[9px] text-white/60">{format(new Date(campaign.updatedAt), 'dd.MM.yyyy // HH:mm')}</span>
                </div>
              </div>
            </BccHudTile>

            <div className="p-6 bg-white/[0.02] border border-white/5 space-y-4">
              <h5 className="text-[10px] font-bold text-white/40 tracking-widest">COMMAND_LOGIC</h5>
              <div className="space-y-4">
                {[
                  "COMMIT_CHANGES will synchronize the local buffer with the main registry.",
                  "LATTICE presets will override the current payload buffer if applied.",
                  "SOURCE_EMAIL integrity is automatically verified during the send cycle."
                ].map((tip, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-[10px] font-mono text-[#ff8c00]">{(i + 1).toString().padStart(2, '0')}</span>
                    <p className="text-[9px] text-white/30 tracking-wider leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </BccEditorialWrapper>
  );
}
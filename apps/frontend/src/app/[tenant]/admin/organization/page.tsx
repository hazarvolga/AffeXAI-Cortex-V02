'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Building2, Link2, RefreshCw, ShieldCheck, UserMinus, Users } from 'lucide-react';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { OrganizationMember, OrganizationSummary, organizationsService } from '@/lib/api/organizationsService';
import { usePermissions } from '@/hooks/usePermissions';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function OrganizationPage() {
  const [organization, setOrganization] = useState<OrganizationSummary | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin, isLoading: permissionsLoading } = usePermissions();

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [current, currentMembers] = await Promise.all([
        organizationsService.getCurrent(),
        isAdmin ? organizationsService.listMembers() : Promise.resolve([]),
      ]);
      setOrganization(current); setMembers(currentMembers);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Beklenmeyen hata';
      setErrorMessage(message);
      toast({ title: 'Organizasyon yüklenemedi', description: message, variant: 'destructive' });
    } finally { setLoading(false); }
  }, [isAdmin, toast]);
  useEffect(() => { if (!permissionsLoading) void load(); }, [load, permissionsLoading]);

  const linkMember = async () => {
    setErrorMessage(null);
    if (!UUID_PATTERN.test(memberId)) { setErrorMessage('Geçerli bir kullanıcı UUID değeri girin.'); toast({ title: 'Geçersiz kullanıcı kimliği', description: 'Geçerli bir UUID girin.', variant: 'destructive' }); return; }
    setWorkingId(memberId);
    try { await organizationsService.linkMember(memberId); setMemberId(''); await load(); toast({ title: 'Üye bağlandı', description: 'Kullanıcı organizasyon üyeliğine eklendi.' }); }
    catch (error) { const message = error instanceof Error ? error.message : 'Beklenmeyen hata'; setErrorMessage(message); toast({ title: 'Üye bağlanamadı', description: message, variant: 'destructive' }); }
    finally { setWorkingId(null); }
  };
  const removeMember = async (member: OrganizationMember) => {
    setErrorMessage(null);
    setWorkingId(member.id);
    try { await organizationsService.removeMember(member.id); await load(); toast({ title: 'Üyelik kaldırıldı', description: `${member.email} için oturumlar iptal edildi.` }); }
    catch (error) {
      const rawMessage = error instanceof Error ? error.message : '';
      const message = rawMessage.toLowerCase().includes('last active organization administrator')
        ? 'Son aktif organizasyon yöneticisi kaldırılamaz.'
        : rawMessage || 'Üyelik kaldırılamadı.';
      setErrorMessage(message);
      toast({ title: 'Üyelik kaldırılamadı', description: message, variant: 'destructive' });
    }
    finally { setWorkingId(null); }
  };
  const activeAdmins = members.filter(member => member.isActive && member.roles.some(role => ['admin', 'organization_owner', 'organization_admin'].includes(role))).length;

  return <BccEditorialWrapper headerTitle="Organizasyon" headerSubtitle="Tenant kimliği // Üyelik // Oturum güvenliği" headerBadge={organization?.isActive ? 'ACTIVE' : 'INACTIVE'}
    telemetryData={[{ label: 'Tenant', value: organization?.slug || '—' }, { label: 'Aktif Üye', value: String(members.filter(member => member.isActive).length), suffix: 'UID' }, { label: 'Aktif Yönetici', value: String(activeAdmins), color: activeAdmins > 1 ? '#9df425' : '#ff8c00' }]}
    headerAction={<Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Yenile</Button>}>
    <div className="space-y-6 pb-20">
      {errorMessage && <div role="alert" className="flex items-start gap-3 border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-semibold">İşlem tamamlanamadı</p><p className="mt-1 text-red-200/80">{errorMessage}</p></div></div>}
      <div className="grid gap-6 md:grid-cols-3">
        <BccHudTile title="Organization Identity" icon="shield" accentColor="#9df425"><div className="flex items-center gap-3"><Building2 className="h-8 w-8 text-[#9df425]" /><div><p className="font-bold text-white">{organization?.name || 'Yükleniyor'}</p><p className="font-mono text-xs text-white/40">{organization?.slug || '—'}</p></div></div></BccHudTile>
        <BccHudTile title="Membership" icon="activity" accentColor="#60a5fa"><div className="text-3xl font-mono font-bold">{members.length}</div><p className="text-[10px] uppercase tracking-widest text-white/40">Kayıtlı kimlik</p></BccHudTile>
        <BccHudTile title="Admin Safety" icon="shield" accentColor={activeAdmins > 1 ? '#9df425' : '#ff8c00'}><div className="flex items-center gap-2"><ShieldCheck className="h-6 w-6" /><span className="text-lg font-bold">{activeAdmins > 1 ? 'Yedekli' : 'Tek Yönetici'}</span></div></BccHudTile>
      </div>
      {isAdmin && <div className="border border-white/10 bg-black/30 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Link2 className="h-4 w-4 text-[#9df425]" />Mevcut tenant kullanıcısını bağla</div><div className="flex flex-col gap-3 sm:flex-row"><Input value={memberId} onChange={event => setMemberId(event.target.value.trim())} placeholder="Kullanıcı UUID" className="font-mono" /><Button onClick={() => void linkMember()} disabled={workingId !== null}>Üye Ekle</Button></div><p className="mt-2 text-xs text-white/40">Kullanıcı önce aynı tenant içinde oluşturulmuş ve aktif olmalıdır.</p></div>}
      <div className="overflow-hidden border border-white/10 bg-white/[0.02]"><Table><TableHeader><TableRow><TableHead>Üye</TableHead><TableHead>Roller</TableHead><TableHead>Durum</TableHead><TableHead className="text-right">İşlem</TableHead></TableRow></TableHeader><TableBody>
        {loading ? <TableRow><TableCell colSpan={4} className="h-24 text-center">Organizasyon senkronize ediliyor…</TableCell></TableRow> : !isAdmin ? <TableRow><TableCell colSpan={4} className="h-24 text-center">Üye listesi yalnızca organizasyon yöneticilerine açıktır.</TableCell></TableRow> : members.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center">Organizasyonda üye yok.</TableCell></TableRow> : members.map(member => <TableRow key={member.id}><TableCell><div className="font-medium">{member.firstName} {member.lastName}</div><div className="font-mono text-xs text-muted-foreground">{member.email}</div></TableCell><TableCell className="space-x-1">{member.roles.map(role => <Badge key={role} variant="outline">{role}</Badge>)}</TableCell><TableCell><Badge variant={member.isActive ? 'default' : 'secondary'}>{member.isActive ? 'Aktif' : 'Devre dışı'}</Badge></TableCell><TableCell className="text-right"><Button variant="destructive" size="sm" disabled={!member.isActive || workingId !== null} onClick={() => void removeMember(member)}><UserMinus className="mr-2 h-4 w-4" />Kaldır</Button></TableCell></TableRow>)}
      </TableBody></Table></div>
      <div className="flex items-center gap-2 text-xs text-white/40"><Users className="h-4 w-4" />Son aktif organizasyon yöneticisi sistem tarafından korunur.</div>
    </div>
  </BccEditorialWrapper>;
}

'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Papa from 'papaparse';
import { ChevronLeft, ChevronRight, Edit3, Plus, Upload, UserRoundX } from 'lucide-react';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { crmService, type CreateCrmCustomerDto, type CrmCustomer } from '@/services/crm.service';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/lib/permissions/constants';

const PAGE_SIZE = 25;
const emptyForm: CreateCrmCustomerDto = { companyName: '', email: '', customerNumber: '', contactPerson: '', phone: '', address: '', city: '', country: '', notes: '', isActive: true };
const fieldClass = 'rounded-none border-white/10 bg-white/[0.03] text-white placeholder:text-white/20 focus-visible:ring-[#ff8c00]/50';
const commandButton = 'rounded-none border-[#ff8c00]/30 bg-[#ff8c00] text-black hover:bg-[#ff9f26] text-[10px] font-bold uppercase tracking-[0.18em]';
const secondaryButton = 'rounded-none border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white text-[10px] uppercase tracking-[0.16em]';
const errorMessage = (error: unknown, fallback: string) => error instanceof Error && error.message ? error.message : fallback;

export default function CrmManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenant } = useParams<{ tenant: string }>();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const canManage = isSuperAdmin || hasPermission(Permission.CRM_MANAGE);
  const [page, setPage] = useState(1);
  const [showEditor, setShowEditor] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [csvText, setCsvText] = useState('');
  const [formData, setFormData] = useState<CreateCrmCustomerDto>(emptyForm);

  const customersQuery = useQuery({ queryKey: ['crm-customers', tenant, page], queryFn: () => crmService.getPage(page, PAGE_SIZE) });
  const statsQuery = useQuery({ queryKey: ['crm-stats', tenant], queryFn: () => crmService.getStats() });
  const customerPage = customersQuery.data;
  const customers = customerPage?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((customerPage?.total ?? 0) / PAGE_SIZE));
  useEffect(() => setPage(1), [tenant]);
  useEffect(() => {
    if (customerPage && page > totalPages) setPage(totalPages);
  }, [customerPage, page, totalPages]);
  const refresh = async () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['crm-customers', tenant] }),
    queryClient.invalidateQueries({ queryKey: ['crm-stats', tenant] }),
  ]);
  const closeEditor = () => { setShowEditor(false); setEditingId(null); setFormData(emptyForm); };

  const createMutation = useMutation({
    mutationFn: (data: CreateCrmCustomerDto) => crmService.create(data),
    onSuccess: async () => { await refresh(); closeEditor(); toast({ title: 'Kayıt oluşturuldu', description: 'Müşteri kimliği CRM kayıtlarına eklendi.' }); },
    onError: (error) => toast({ title: 'Kayıt oluşturulamadı', description: errorMessage(error, 'Müşteri eklenemedi.'), variant: 'destructive' }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCrmCustomerDto }) => crmService.update(id, data),
    onSuccess: async () => { await refresh(); closeEditor(); toast({ title: 'Kayıt güncellendi', description: 'Müşteri bilgileri kaydedildi.' }); },
    onError: (error) => toast({ title: 'Güncelleme başarısız', description: errorMessage(error, 'Müşteri güncellenemedi.'), variant: 'destructive' }),
  });
  const importMutation = useMutation({
    mutationFn: (rows: CreateCrmCustomerDto[]) => crmService.bulkImport(rows),
    onSuccess: async (result) => { await refresh(); setShowImport(false); setCsvText(''); toast({ title: 'İçe aktarma tamamlandı', description: `${result.imported} kayıt eklendi, ${result.skipped} kayıt atlandı.` }); },
    onError: (error) => toast({ title: 'İçe aktarma başarısız', description: errorMessage(error, 'CSV işlenemedi.'), variant: 'destructive' }),
  });
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => crmService.remove(id),
    onSuccess: async () => { await refresh(); toast({ title: 'Kayıt pasifleştirildi' }); },
    onError: (error) => toast({ title: 'İşlem başarısız', description: errorMessage(error, 'Kayıt pasifleştirilemedi.'), variant: 'destructive' }),
  });

  const openCreate = () => { setEditingId(null); setFormData(emptyForm); setShowEditor(true); };
  const openEdit = (customer: CrmCustomer) => {
    setEditingId(customer.id);
    setFormData({ companyName: customer.companyName, email: customer.email, customerNumber: customer.customerNumber ?? '', contactPerson: customer.contactPerson ?? '', phone: customer.phone ?? '', address: customer.address ?? '', city: customer.city ?? '', country: customer.country ?? '', notes: customer.notes ?? '', isActive: customer.isActive });
    setShowEditor(true);
  };
  const saveCustomer = () => {
    if (!formData.companyName.trim() || !formData.email.trim()) { toast({ title: 'Eksik bilgi', description: 'Firma adı ve e-posta zorunludur.', variant: 'destructive' }); return; }
    editingId ? updateMutation.mutate({ id: editingId, data: formData }) : createMutation.mutate(formData);
  };
  const importCsv = () => {
    const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim() });
    if (parsed.errors.length || !['companyName', 'email'].every(h => parsed.meta.fields?.includes(h))) { toast({ title: 'CSV formatı geçersiz', description: 'companyName ve email başlıklarını kontrol edin.', variant: 'destructive' }); return; }
    const rows = parsed.data.map(row => ({ companyName: row.companyName?.trim() ?? '', email: row.email?.trim() ?? '', customerNumber: row.customerNumber?.trim(), contactPerson: row.contactPerson?.trim(), phone: row.phone?.trim(), city: row.city?.trim(), country: row.country?.trim() }));
    if (!rows.length || rows.some(row => !row.companyName || !row.email)) { toast({ title: 'CSV verisi eksik', description: 'Her satırda firma adı ve e-posta olmalıdır.', variant: 'destructive' }); return; }
    importMutation.mutate(rows);
  };

  const stats = statsQuery.data;
  const metric = (value: number | undefined) => statsQuery.isLoading ? '··' : statsQuery.isError ? '—' : String(value ?? 0).padStart(2, '0');
  const visibleStart = customerPage?.total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const visibleEnd = Math.min(page * PAGE_SIZE, customerPage?.total ?? 0);
  const deactivate = (id: string) => confirm('Bu müşteri kaydı pasifleştirilsin mi?') && deactivateMutation.mutate(id);

  return <BccEditorialWrapper theme="tenant-admin" headerTitle="CRM Registry" headerSubtitle="Müşteri kimliklerini, temas noktalarını ve ilişki durumunu yönetin." headerBadge="Customer Intelligence" telemetryData={[{ label: 'Tenant', value: tenant?.toUpperCase() || '—' }, { label: 'Registry', value: metric(stats?.total) }, { label: 'Active', value: metric(stats?.active), color: '#9df425' }]} headerAction={canManage ? <Button className={commandButton} onClick={openCreate}><Plus className="mr-2 h-3.5 w-3.5" />Yeni Kayıt</Button> : undefined}>
    <div className="space-y-8 pb-12">
      {statsQuery.isError && <div role="alert" className="border border-red-500/20 bg-red-500/5 px-5 py-3 text-xs text-red-300">CRM istatistikleri yüklenemedi. Kayıt listesi ayrı olarak kullanılmaya devam edebilir.</div>}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <BccHudTile title="Identity Registry" subtitle="Tüm müşteri kayıtları" icon="database"><div className="text-4xl font-light tabular-nums text-white">{metric(stats?.total)}</div></BccHudTile>
        <BccHudTile title="Active Relations" subtitle="Etkin müşteri kimlikleri" icon="hub" accentColor="#9df425"><div className="flex items-end gap-3"><span className="text-4xl font-light tabular-nums text-[#9df425]">{metric(stats?.active)}</span><span className="mb-1 text-[9px] uppercase tracking-[0.2em] text-white/30">online</span></div></BccHudTile>
        <BccHudTile title="Dormant Records" subtitle="Pasif ilişki kayıtları" icon="motion_photos_off"><div className="text-4xl font-light tabular-nums text-white/45">{metric(stats?.inactive)}</div></BccHudTile>
      </section>
      <BccHudTile title="Customer Registry" subtitle={`${visibleStart}-${visibleEnd} / ${customerPage?.total ?? 0} kayıt`} icon="manage_accounts" headerAction={canManage ? <Button variant="outline" className={secondaryButton} onClick={() => setShowImport(true)}><Upload className="mr-2 h-3.5 w-3.5" />CSV İçe Aktar</Button> : undefined} footer={<><span className="text-[9px] uppercase tracking-[0.18em] text-white/30">Sayfa {page} / {totalPages}</span><div className="flex gap-2"><Button aria-label="Önceki sayfa" variant="outline" className={secondaryButton} disabled={page <= 1} onClick={() => setPage(value => value - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button><Button aria-label="Sonraki sayfa" variant="outline" className={secondaryButton} disabled={page >= totalPages} onClick={() => setPage(value => value + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button></div></>}>
        {customersQuery.isLoading ? <div className="py-16 text-center text-[10px] uppercase tracking-[0.25em] text-white/35">Kayıt ağı yükleniyor…</div> : customersQuery.isError ? <div role="alert" className="border border-red-500/20 bg-red-500/5 px-5 py-8 text-center text-red-300">Müşteri kayıtları yüklenemedi.</div> : customers.length === 0 ? <div className="border border-dashed border-white/10 px-6 py-16 text-center"><p className="text-sm text-white/60">Henüz müşteri kaydı yok.</p>{canManage && <Button className={`${commandButton} mt-5`} onClick={openCreate}>İlk kaydı oluştur</Button>}</div> : <><div className="hidden overflow-x-auto lg:block"><table className="w-full border-collapse text-left"><thead><tr className="border-b border-white/10 text-[9px] uppercase tracking-[0.2em] text-white/30"><th className="px-3 py-4 font-medium">Firma / Kimlik</th><th className="px-3 py-4 font-medium">Temas</th><th className="px-3 py-4 font-medium">Müşteri No</th><th className="px-3 py-4 font-medium">Konum</th><th className="px-3 py-4 font-medium">Durum</th>{canManage && <th className="px-3 py-4 text-right font-medium">Komutlar</th>}</tr></thead><tbody>{customers.map(customer => <CustomerRow key={customer.id} customer={customer} canManage={canManage} onEdit={openEdit} onDeactivate={deactivate} />)}</tbody></table></div><div className="grid gap-3 lg:hidden">{customers.map(customer => <CustomerCard key={customer.id} customer={customer} canManage={canManage} onEdit={openEdit} onDeactivate={deactivate} />)}</div></>}
      </BccHudTile>
    </div>
    <CustomerDialog open={showEditor} editing={Boolean(editingId)} value={formData} busy={createMutation.isPending || updateMutation.isPending} onOpenChange={(open) => open ? setShowEditor(true) : closeEditor()} onChange={setFormData} onSave={saveCustomer} />
    <Dialog open={showImport} onOpenChange={setShowImport}><DialogContent className="max-w-2xl rounded-none border-white/10 bg-[#0a0a0a] text-white"><DialogHeader><DialogTitle className="font-mono uppercase tracking-tight">CSV İçe Aktar</DialogTitle><DialogDescription className="text-white/40">İlk satırda companyName ve email başlıkları bulunmalıdır. Bir seferde en fazla 200 kayıt işlenir.</DialogDescription></DialogHeader><pre className="overflow-x-auto border border-white/5 bg-white/[0.03] p-4 text-[10px] text-white/45">companyName,email,customerNumber,contactPerson,phone,city,country</pre><Textarea aria-label="CSV verisi" value={csvText} onChange={event => setCsvText(event.target.value)} rows={10} className={fieldClass} placeholder="XYZ Company,info@xyz-company.test,CRM-001,…" /><DialogFooter><Button variant="outline" className={secondaryButton} onClick={() => setShowImport(false)}>İptal</Button><Button className={commandButton} disabled={!csvText.trim() || importMutation.isPending} onClick={importCsv}>{importMutation.isPending ? 'İşleniyor…' : 'İçe Aktar'}</Button></DialogFooter></DialogContent></Dialog>
  </BccEditorialWrapper>;
}

function CustomerRow({ customer, canManage, onEdit, onDeactivate }: CustomerViewProps) {
  return <tr className="border-b border-white/5 transition-colors hover:bg-white/[0.025]"><td className="px-3 py-5"><div className="font-medium text-white">{customer.companyName}</div><div className="mt-1 text-[9px] uppercase tracking-widest text-white/25">{customer.id.slice(0, 8)}</div></td><td className="px-3 py-5"><div className="text-white/70">{customer.email}</div><div className="mt-1 text-[10px] text-white/30">{customer.contactPerson || customer.phone || 'Temas atanmamış'}</div></td><td className="px-3 py-5 text-white/45">{customer.customerNumber || '—'}</td><td className="px-3 py-5 text-white/45">{[customer.city, customer.country].filter(Boolean).join(' / ') || '—'}</td><td className="px-3 py-5"><Status active={customer.isActive} /></td>{canManage && <td className="px-3 py-5"><div className="flex justify-end gap-2"><IconCommand label="Müşteriyi düzenle" onClick={() => onEdit(customer)}><Edit3 className="h-3.5 w-3.5" /></IconCommand>{customer.isActive && <IconCommand label="Müşteriyi pasifleştir" onClick={() => onDeactivate(customer.id)}><UserRoundX className="h-3.5 w-3.5" /></IconCommand>}</div></td>}</tr>;
}

type CustomerViewProps = { customer: CrmCustomer; canManage: boolean; onEdit: (value: CrmCustomer) => void; onDeactivate: (id: string) => void };
function CustomerCard({ customer, canManage, onEdit, onDeactivate }: CustomerViewProps) {
  return <article className="border border-white/5 bg-white/[0.02] p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="text-sm font-medium text-white">{customer.companyName}</h3><p className="mt-1 break-all text-[11px] text-white/45">{customer.email}</p></div><Status active={customer.isActive} /></div><dl className="mt-4 grid grid-cols-2 gap-3 text-[10px]"><div><dt className="uppercase tracking-widest text-white/25">Müşteri No</dt><dd className="mt-1 text-white/60">{customer.customerNumber || '—'}</dd></div><div><dt className="uppercase tracking-widest text-white/25">Konum</dt><dd className="mt-1 text-white/60">{customer.city || customer.country || '—'}</dd></div></dl>{canManage && <div className="mt-4 flex gap-2 border-t border-white/5 pt-4"><Button variant="outline" className={`${secondaryButton} flex-1`} onClick={() => onEdit(customer)}><Edit3 className="mr-2 h-3.5 w-3.5" />Düzenle</Button>{customer.isActive && <Button aria-label="Müşteriyi pasifleştir" variant="outline" className={secondaryButton} onClick={() => onDeactivate(customer.id)}><UserRoundX className="h-3.5 w-3.5" /></Button>}</div>}</article>;
}
function Status({ active }: { active: boolean }) { return <span className={`inline-flex items-center gap-2 border px-2 py-1 text-[9px] uppercase tracking-[0.18em] ${active ? 'border-[#9df425]/25 bg-[#9df425]/5 text-[#9df425]' : 'border-white/10 bg-white/[0.03] text-white/35'}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[#9df425] shadow-[0_0_6px_#9df425]' : 'bg-white/30'}`} />{active ? 'Aktif' : 'Pasif'}</span>; }
function IconCommand({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) { return <Button aria-label={label} title={label} variant="ghost" size="icon" className="h-8 w-8 rounded-none border border-white/5 text-white/40 hover:border-[#ff8c00]/30 hover:bg-[#ff8c00]/10 hover:text-[#ff8c00]" onClick={onClick}>{children}</Button>; }

function CustomerDialog({ open, editing, value, busy, onOpenChange, onChange, onSave }: { open: boolean; editing: boolean; value: CreateCrmCustomerDto; busy: boolean; onOpenChange: (open: boolean) => void; onChange: (value: CreateCrmCustomerDto) => void; onSave: () => void }) {
  const set = (field: keyof CreateCrmCustomerDto, fieldValue: string | boolean) => onChange({ ...value, [field]: fieldValue });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto rounded-none border-white/10 bg-[#0a0a0a] text-white"><DialogHeader><DialogTitle className="font-mono uppercase tracking-tight">{editing ? 'Müşteri Kaydını Düzenle' : 'Yeni Müşteri Kaydı'}</DialogTitle><DialogDescription className="text-white/40">Firma kimliğini ve doğrulanmış temas bilgilerini kaydedin.</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><Field id="companyName" label="Firma Adı *" value={value.companyName} onChange={v => set('companyName', v)} /><Field id="email" label="E-posta *" type="email" value={value.email} onChange={v => set('email', v)} /><Field id="customerNumber" label="Müşteri Numarası" value={value.customerNumber} onChange={v => set('customerNumber', v)} /><Field id="contactPerson" label="İletişim Kişisi" value={value.contactPerson} onChange={v => set('contactPerson', v)} /><Field id="phone" label="Telefon" value={value.phone} onChange={v => set('phone', v)} /><Field id="city" label="Şehir" value={value.city} onChange={v => set('city', v)} /><Field id="country" label="Ülke" value={value.country} onChange={v => set('country', v)} /><Field id="address" label="Adres" value={value.address} onChange={v => set('address', v)} /><div className="space-y-2 sm:col-span-2"><Label htmlFor="notes" className="text-[10px] uppercase tracking-[0.16em] text-white/45">Notlar</Label><Textarea id="notes" value={value.notes ?? ''} onChange={event => set('notes', event.target.value)} className={fieldClass} rows={3} /></div>{editing && <label className="flex items-center gap-3 border border-white/5 bg-white/[0.02] p-3 text-[10px] uppercase tracking-widest text-white/50 sm:col-span-2"><input type="checkbox" checked={value.isActive !== false} onChange={event => set('isActive', event.target.checked)} className="accent-[#ff8c00]" />Müşteri kaydı aktif</label>}</div><DialogFooter><Button variant="outline" className={secondaryButton} onClick={() => onOpenChange(false)}>İptal</Button><Button className={commandButton} disabled={busy} onClick={onSave}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</Button></DialogFooter></DialogContent></Dialog>;
}
function Field({ id, label, value, type = 'text', onChange }: { id: string; label: string; value?: string; type?: string; onChange: (value: string) => void }) { return <div className="space-y-2"><Label htmlFor={id} className="text-[10px] uppercase tracking-[0.16em] text-white/45">{label}</Label><Input id={id} type={type} value={value ?? ''} onChange={event => onChange(event.target.value)} className={fieldClass} /></div>; }

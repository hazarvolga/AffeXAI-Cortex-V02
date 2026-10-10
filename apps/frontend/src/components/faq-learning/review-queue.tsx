'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaqLearningService } from '@/services/faq-learning.service';
import { authService } from '@/lib/api/authService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Queue = Awaited<ReturnType<typeof FaqLearningService.getReviewQueue>>;
type Item = Queue['items'][number];
type Stats = Awaited<ReturnType<typeof FaqLearningService.getReviewStats>>;
type Action = 'approve' | 'publish' | 'reject' | 'edit';
const statuses = {pending_review:'İnceleme bekleyen',approved:'Onaylı taslak',published:'Yayımlanmış',rejected:'Reddedilmiş'};
const selectClass = 'h-10 rounded-md border bg-background px-3 text-sm';

export function FaqReviewQueue() {
  const [queue,setQueue] = useState<Queue|null>(null);
  const [stats,setStats] = useState<Stats|null>(null);
  const [page,setPage] = useState(1);
  const [filters,setFilters] = useState({status:'pending_review',search:'',source:'',category:''});
  const [search,setSearch] = useState('');
  const [category,setCategory] = useState('');
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [selected,setSelected] = useState<string[]>([]);
  const [canBulk,setCanBulk] = useState(false);
  const [current,setCurrent] = useState<Item|null>(null);
  const [action,setAction] = useState<Action>('approve');
  const [answer,setAnswer] = useState('');
  const [editedCategory,setEditedCategory] = useState('');
  const [keywords,setKeywords] = useState('');
  const [reason,setReason] = useState('');
  const sequence = useRef(0);
  const saving = useRef(false);

  const load = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true); setError('');
    try {
      const [result,counts] = await Promise.all([
        FaqLearningService.getReviewQueue({status:[filters.status],search:filters.search,source:filters.source?[filters.source]:[],category:filters.category?[filters.category]:[],page,limit:10}),
        FaqLearningService.getReviewStats(),
      ]);
      if (request !== sequence.current) return;
      setQueue(result); setStats(counts); setSelected([]);
    } catch {
      if (request === sequence.current) setError('İnceleme verileri yüklenemedi. Yetkinizi ve bağlantınızı kontrol edip yeniden deneyin.');
    } finally { if (request === sequence.current) setLoading(false); }
  },[filters,page]);

  useEffect(() => { void load(); return () => { sequence.current += 1; }; },[load]);
  useEffect(() => {
    let active = true;
    void authService.getCurrentUser().then(user => {
      const roles = (user.roles || []).map((role: unknown) => typeof role === 'string' ? role : (role as {name?:string})?.name);
      if (active) setCanBulk(roles.some(role => role === 'admin' || role === 'support_manager'));
    }).catch(() => { if (active) setCanBulk(false); });
    return () => { active = false; };
  },[]);

  const filter = (changes: Partial<typeof filters>) => {
    setPage(1); setSelected([]); setFilters(previous => ({...previous,...changes}));
  };
  const open = (item: Item) => {
    setCurrent(item); setAnswer(item.answer); setEditedCategory(item.category || '');
    setKeywords(item.keywords.join(', ')); setReason(''); setError('');
    setAction(item.status === 'approved' ? 'publish' : item.status === 'published' ? 'reject' : 'approve');
  };
  const save = async () => {
    if (!current || saving.current) return;
    saving.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const result = await FaqLearningService.reviewFaq(current.id,action,{
        reason:reason || undefined,
        ...(action === 'edit' ? {editedAnswer:answer,editedCategory:editedCategory || undefined,editedKeywords:keywords.split(',').map(value=>value.trim()).filter(Boolean)} : {}),
      });
      if (!result.success) throw new Error('Review failed');
      setCurrent(null);
      setNotice(action === 'publish' ? 'Bilgi yayımlandı.' : action === 'reject' ? 'Bilgi reddedildi; yayımlanmış karşılığı geri çekildi.' : 'İnceleme kaydedildi. Bilgi onaylı taslak olarak saklandı.');
      await load();
    } catch { setError('İnceleme kaydedilemedi. Kayıt durumu veya yetkiniz değişmiş olabilir. Yenileyip tekrar deneyin.'); }
    finally { saving.current = false; setBusy(false); }
  };
  const bulk = async (bulkAction:'approve'|'reject') => {
    if (!selected.length || saving.current) return;
    saving.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const result = await FaqLearningService.bulkReview(selected,bulkAction);
      setNotice(`${result.results.successful.length} kayıt işlendi; ${result.results.failed.length} kayıt işlenemedi.`);
      await load();
      setSelected(result.results.failed.map(item=>item.faqId));
    } catch { setError('Toplu işlem sonucu alınamadı. Yenileyerek kayıtların son durumunu kontrol edin.'); }
    finally { saving.current = false; setBusy(false); }
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-semibold">FAQ İnceleme Kuyruğu</h1><p className="text-sm text-muted-foreground">Kaynağı inceleyin, taslağı onaylayın ve ayrı bir işlemle yayımlayın.</p></div>
      <Button variant="outline" disabled={loading || busy} onClick={()=>void load()}>Yenile</Button>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="text-sm">{notice}</p>}
    {stats && <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[
      ['İnceleme bekleyen',stats.pendingReview],['Onaylı taslak',stats.approved],['Yayımlanmış',stats.published],['Toplam',stats.total],
    ].map(([label,value])=><Card key={label}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></CardContent></Card>)}</div>}
    <form className="flex flex-wrap items-end gap-3" onSubmit={event=>{event.preventDefault();filter({search,category});}}>
      <div><Label htmlFor="faq-status">Durum</Label><select id="faq-status" className={`block ${selectClass}`} value={filters.status} disabled={busy} onChange={event=>filter({status:event.target.value})}>{Object.entries(statuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
      <div><Label htmlFor="faq-source">Kaynak</Label><select id="faq-source" className={`block ${selectClass}`} value={filters.source} disabled={busy} onChange={event=>filter({source:event.target.value})}><option value="">Tüm kaynaklar</option><option value="chat">Sohbet</option><option value="ticket">Destek talebi</option></select></div>
      <div><Label htmlFor="faq-search">Soru veya cevap</Label><Input id="faq-search" value={search} maxLength={200} disabled={busy} onChange={event=>setSearch(event.target.value)} /></div>
      <div><Label htmlFor="faq-category">Kategori</Label><Input id="faq-category" value={category} maxLength={100} disabled={busy} onChange={event=>setCategory(event.target.value)} placeholder="Tüm kategoriler" /></div>
      <Button type="submit" disabled={loading || busy}>Filtrele</Button>
    </form>
    {canBulk && !!selected.length && <div className="flex flex-wrap items-center gap-3"><span>{selected.length} kayıt seçildi</span><Button disabled={busy || loading} onClick={()=>void bulk('approve')}>{filters.status === 'published' ? 'Toplu yayından kaldır ve taslağa al' : 'Toplu taslak onayı'}</Button><Button variant="destructive" disabled={busy || loading} onClick={()=>void bulk('reject')}>Toplu reddet</Button></div>}
    <Card><CardHeader><CardTitle>İncelenecek bilgiler</CardTitle></CardHeader><CardContent className="space-y-4" aria-busy={loading || busy}>
      {loading ? <p role="status">İnceleme kuyruğu yükleniyor…</p> : queue?.items.map(item=><article key={item.id} className="space-y-3 rounded-md border p-4">
        <div className="flex items-start gap-3">
          {canBulk && <input type="checkbox" aria-label={`${item.question} seç`} disabled={busy} checked={selected.includes(item.id)} onChange={event=>setSelected(previous=>event.target.checked?[...previous,item.id]:previous.filter(id=>id!==item.id))} />}
          <div className="min-w-0 flex-1"><h2 className="font-medium">{item.question}</h2><p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{item.answer}</p></div>
          <Button variant="outline" disabled={busy} onClick={()=>open(item)}>İncele</Button>
        </div>
        <p className="break-words text-xs text-muted-foreground">{statuses[item.status]} · {item.confidence}% güven · Kaynak: {item.source} / {item.sourceId} · {item.createdAt.toLocaleDateString('tr-TR')}</p>
        {item.category && <p className="text-xs">Kategori: {item.category}</p>}
      </article>)}
      {!loading && !error && queue?.items.length === 0 && <p>Bu filtrelere uygun bilgi bulunamadı.</p>}
      {queue && <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm">Toplam {queue.total} · Sayfa {queue.page} / {Math.max(1,queue.totalPages)}</p><div className="flex gap-2"><Button variant="outline" disabled={loading || busy || page<=1} onClick={()=>setPage(value=>value-1)}>Önceki</Button><Button variant="outline" disabled={loading || busy || page>=queue.totalPages} onClick={()=>setPage(value=>value+1)}>Sonraki</Button></div></div>}
    </CardContent></Card>
    <Dialog open={!!current} onOpenChange={value=>{if(!value&&!busy)setCurrent(null);}}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Bilgiyi incele</DialogTitle><DialogDescription>Onay ve düzenleme bilgiyi taslak olarak saklar; mevcut yayın varsa geri çeker. Yayınlama bilgiyi erişime açar. Reddetme yayımlanmış karşılığını geri çeker.</DialogDescription></DialogHeader>
      {current && <div className="space-y-4"><h2 className="font-medium">{current.question}</h2><p className="whitespace-pre-wrap break-words text-sm">{current.answer}</p><p className="break-words text-xs text-muted-foreground">Kaynak: {current.source} / {current.sourceId}</p>{current.source === 'ticket' && <Link className="block text-sm underline" href={`/portal/support/${encodeURIComponent(current.sourceId)}`} target="_blank" rel="noopener noreferrer">Kaynak destek talebini aç</Link>}
        <div><Label htmlFor="faq-action">İşlem</Label><select id="faq-action" className={`block w-full ${selectClass}`} value={action} disabled={busy} onChange={event=>setAction(event.target.value as Action)}>
          <option value="approve">{current.status === 'published' ? 'Yayından kaldır ve onaylı taslağa al' : 'Taslağı onayla'}</option><option value="edit">Düzenle ve taslak olarak onayla</option><option value="publish" disabled={current.status!=='approved'}>Yayımla (onaylı taslak)</option><option value="reject">Reddet / yayından kaldır</option>
        </select></div>
        {action==='edit' && <><Label htmlFor="faq-answer">Düzenlenmiş cevap</Label><Textarea id="faq-answer" value={answer} maxLength={10000} disabled={busy} onChange={event=>setAnswer(event.target.value)} /><Label htmlFor="faq-edit-category">Kategori</Label><Input id="faq-edit-category" value={editedCategory} maxLength={100} disabled={busy} onChange={event=>setEditedCategory(event.target.value)} /><Label htmlFor="faq-keywords">Anahtar kelimeler (virgülle ayırın)</Label><Input id="faq-keywords" value={keywords} disabled={busy} onChange={event=>setKeywords(event.target.value)} /></>}
        <Label htmlFor="faq-reason">İnceleme notu</Label><Textarea id="faq-reason" value={reason} maxLength={1000} disabled={busy} onChange={event=>setReason(event.target.value)} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button disabled={busy || (action==='edit'&&!answer.trim())} onClick={()=>void save()}>{busy?'Kaydediliyor…':'Kararı kaydet'}</Button>
      </div>}
    </DialogContent></Dialog>
  </div>;
}

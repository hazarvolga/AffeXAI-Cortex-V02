'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, RefreshCw } from 'lucide-react';

interface HelpCategory { id:string; name:string; ticketCategoryId:string|null; }
interface TicketCategory { id:string; name:string; isActive:boolean; }

export function HelpCategoryMappings() {
  const [helpCategories,setHelpCategories]=useState<HelpCategory[]>([]);
  const [ticketCategories,setTicketCategories]=useState<TicketCategory[]>([]);
  const [name,setName]=useState('');
  const [mapping,setMapping]=useState('unmapped');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  const load=async()=>{
    setLoading(true);setError('');
    try{
      const [help,ticket]=await Promise.all([
        fetch('/api/admin/knowledge-base/help-categories',{cache:'no-store'}),
        fetch('/api/admin/knowledge-base/ticket-categories',{cache:'no-store'}),
      ]);
      if(!help.ok||!ticket.ok)throw new Error('Kategori bilgileri yüklenemedi.');
      setHelpCategories(await help.json());setTicketCategories((await ticket.json()).filter((item:TicketCategory)=>item.isActive));
    }catch(cause){setError(cause instanceof Error?cause.message:'Kategori bilgileri yüklenemedi.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{void load();},[]);

  const create=async()=>{
    setSaving('new');setError('');setNotice('');
    try{
      const response=await fetch('/api/admin/knowledge-base/help-categories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,ticketCategoryId:mapping==='unmapped'?null:mapping})});
      if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.message||'Yardım kategorisi oluşturulamadı.');}
      setName('');setMapping('unmapped');setNotice('Yardım kategorisi oluşturuldu.');await load();
    }catch(cause){setError(cause instanceof Error?cause.message:'Yardım kategorisi oluşturulamadı.');}
    finally{setSaving(null);}
  };

  const updateMapping=async(id:string,value:string)=>{
    setSaving(id);setError('');setNotice('');
    try{
      const response=await fetch(`/api/admin/knowledge-base/help-category-update?id=${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticketCategoryId:value==='unmapped'?null:value})});
      if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.message||'Eşleme güncellenemedi.');}
      setHelpCategories(current=>current.map(item=>item.id===id?{...item,ticketCategoryId:value==='unmapped'?null:value}:item));
      setNotice('Kategori eşlemesi güncellendi.');
    }catch(cause){setError(cause instanceof Error?cause.message:'Eşleme güncellenemedi.');await load();}
    finally{setSaving(null);}
  };

  return <Card>
    <CardHeader className="flex flex-row items-start justify-between gap-4">
      <div><CardTitle>Yardım merkezi kategorileri</CardTitle><CardDescription>Yardım klasörlerini talep sınıflarıyla açıkça eşleyin. Yalnızca eşlenen ve yayınlanmış makaleler müşteriye gösterilir.</CardDescription></div>
      <Button variant="outline" size="sm" onClick={()=>void load()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4"/>Yenile</Button>
    </CardHeader>
    <CardContent className="space-y-5">
      {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
      {notice&&<p role="status" className="text-sm text-emerald-600">{notice}</p>}
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div className="space-y-2"><Label htmlFor="help-category-name">Yeni yardım kategorisi</Label><Input id="help-category-name" value={name} onChange={event=>setName(event.target.value)} placeholder="Örn. Başlangıç rehberleri" maxLength={255}/></div>
        <div className="space-y-2"><Label>Talep kategorisi eşlemesi</Label><Select value={mapping} onValueChange={setMapping}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="unmapped">Henüz eşleme</SelectItem>{ticketCategories.map(item=><SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
        <Button onClick={()=>void create()} disabled={name.trim().length<2||saving==='new'}>{saving==='new'?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Plus className="mr-2 h-4 w-4"/>}Oluştur</Button>
      </div>
      {loading?<div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Kategoriler yükleniyor</div>:
       helpCategories.length===0?<p className="text-sm text-muted-foreground">Henüz yardım kategorisi yok.</p>:
       <div className="space-y-3">{helpCategories.map(item=><div key={item.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1fr] md:items-center"><div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">Yardım merkezi klasörü</p></div><Select value={item.ticketCategoryId||'unmapped'} onValueChange={value=>void updateMapping(item.id,value)} disabled={saving===item.id}><SelectTrigger aria-label={`${item.name} talep kategorisi eşlemesi`}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="unmapped">Henüz eşleme</SelectItem>{ticketCategories.map(category=><SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select></div>)}</div>}
    </CardContent>
  </Card>;
}

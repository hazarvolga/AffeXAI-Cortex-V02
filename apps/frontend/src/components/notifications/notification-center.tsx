'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { notificationService, type UserNotification } from '@/lib/api/notificationService';

export function NotificationCenter() {
  const [records, setRecords] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const sequence = useRef(0);
  const busy = useRef(false);

  const refresh = useCallback(async (offset = 0) => {
    const request = ++sequence.current;
    setLoading(true);
    setError('');
    try {
      const response = await notificationService.list({limit: 50, offset});
      if (request === sequence.current) {
        setRecords(previous => offset === 0 ? response : Array.from(new Map([...previous, ...response].map(record => [record.id, record])).values()));
        setNextOffset(offset + response.length);
        setHasMore(response.length === 50);
      }
    } catch {
      if (request === sequence.current) setError('Bildirimler yüklenemedi. Lütfen yeniden deneyin.');
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => { sequence.current += 1; };
  }, [refresh]);

  const markRead = async (id?: string) => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError('');
    setNotice('');
    try {
      if (id) {
        const saved = await notificationService.markRead(id);
        setRecords(previous => previous.map(record => record.id === saved.id ? saved : record));
      } else {
        await notificationService.markAllRead();
        // Reload authoritative state: a new notification may arrive during this operation.
        await refresh();
      }
      setNotice('Okundu bilgisi kaydedildi.');
    } catch {
      setError('Okundu bilgisi kaydedilemedi. Lütfen yeniden deneyin.');
    } finally {
      busy.current = false;
      setPending(false);
    }
  };

  return <Card>
    <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <CardTitle>Bildirim Merkezi</CardTitle>
        <CardDescription>Hesabınıza gönderilen bildirimler ve okundu durumları.</CardDescription>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={loading || pending} onClick={() => { setNotice(''); void refresh(); }}>Yenile</Button>
        <Button variant="outline" disabled={loading || pending || (!hasMore && !records.some(record => !record.isRead))} onClick={() => void markRead()}>Tümünü okundu işaretle</Button>
      </div>
    </CardHeader>
    <CardContent className="space-y-4" aria-busy={loading || pending}>
      {error && <div role="alert" className="text-sm text-destructive">{error}<Button variant="link" disabled={loading || pending} onClick={() => void refresh()}>Yeniden dene</Button></div>}
      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
      {loading ? <p role="status" className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Bildirimler yükleniyor…</p> : records.length ?
        <ul className="space-y-3">{records.map(record => <li key={record.id} className={`flex flex-wrap items-start gap-4 rounded-lg border p-4 ${record.isRead ? '' : 'bg-secondary/50'}`}>
          <Bell className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="whitespace-pre-wrap break-words text-sm">{record.message}</p>
            <p className="mt-2 text-xs text-muted-foreground"><time dateTime={record.createdAt}>{new Date(record.createdAt).toLocaleString('tr-TR')}</time> · {record.isRead ? 'Okundu' : 'Okunmadı'}</p>
          </div>
          {!record.isRead && <Button size="sm" variant="outline" disabled={pending} onClick={() => void markRead(record.id)}>Okundu işaretle</Button>}
        </li>)}</ul> : !error && <div className="py-12 text-center text-muted-foreground"><Bell className="mx-auto mb-4 h-10 w-10" aria-hidden="true" /><p>Henüz bildiriminiz yok.</p></div>}
      {!loading && hasMore && <Button variant="outline" disabled={pending} onClick={() => void refresh(nextOffset)}>Daha eski bildirimleri yükle</Button>}
    </CardContent>
  </Card>;
}

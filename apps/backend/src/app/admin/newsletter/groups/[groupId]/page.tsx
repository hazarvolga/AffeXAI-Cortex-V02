
'use client';

import { notFound, useRouter } from 'next/navigation';
import { subscribers, groups } from '@/lib/newsletter-data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Folder, Filter } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useRef } from "react";
import { use } from "react";

export default function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  // Unwrap the params promise using React.use()
  const unwrappedParams = use(params);
  const { groupId } = unwrappedParams;
  
  const router = useRouter();
  const [group, setGroup] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedGroup = useRef(false);

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedGroup.current) return;
    hasFetchedGroup.current = true;
    
    const fetchGroup = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch the group data from an API
        // For now, we're using mock data
        const groupData = groups.find(s => s.id === groupId);
        if (!groupData) {
          notFound();
          return;
        }
        setGroup(groupData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching group:', err);
        setError('Grup bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-12">{error}</div>;
  }

  if (!group) {
    notFound();
    return null;
  }

  const groupSubscribers = subscribers.filter(sub => sub.groups.includes(group.id));

  return (
    <div className="space-y-8">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
            <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
            </div>
            <p className="text-muted-foreground">{group.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Bu Gruptaki Aboneler</CardTitle>
            <CardDescription>"{group.name}" grubuna eklenmiş abonelerin listesi.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>E-posta</TableHead>
                        <TableHead>Kayıt Tarihi</TableHead>
                        <TableHead>Durum</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groupSubscribers.length > 0 ? groupSubscribers.map(sub => (
                        <TableRow key={sub.id}>
                            <TableCell className="font-medium">{sub.email}</TableCell>
                            <TableCell>{new Date(sub.subscribedAt).toLocaleDateString('tr-TR')}</TableCell>
                            <TableCell>
                                <Badge variant={sub.status === 'aktif' ? 'default' : 'secondary'}>{sub.status}</Badge>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">Bu grupta abone bulunmuyor.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Toplam <strong>{groupSubscribers.length}</strong> abone bu grupta.
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

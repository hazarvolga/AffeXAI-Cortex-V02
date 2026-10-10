
'use client';

import { notFound, useRouter } from 'next/navigation';
import { subscribers, segments } from '@/lib/newsletter-data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Folder, Filter } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useRef } from "react";
import { use } from "react";

export default function SegmentDetailPage({ params }: { params: Promise<{ segmentId: string }> }) {
  // Unwrap the params promise using React.use()
  const unwrappedParams = use(params);
  const { segmentId } = unwrappedParams;
  
  const router = useRouter();
  const [segment, setSegment] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedSegment = useRef(false);

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedSegment.current) return;
    hasFetchedSegment.current = true;
    
    const fetchSegment = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch the segment data from an API
        // For now, we're using mock data
        const segmentData = segments.find(s => s.id === segmentId);
        if (!segmentData) {
          notFound();
          return;
        }
        setSegment(segmentData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching segment:', err);
        setError('Segment bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchSegment();
  }, [segmentId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-12">{error}</div>;
  }

  if (!segment) {
    notFound();
    return null;
  }

  // Simulate filtering subscribers based on the segment. 
  // In a real app, this logic would be much more complex and database-driven.
  // For this demo, we'll check if the subscriber's `segments` array includes the segment name.
  const segmentSubscribers = subscribers.filter(sub => sub.segments.includes(segment.name));

  return (
    <div className="space-y-8">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
            <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-3xl font-bold tracking-tight">{segment.name}</h1>
            </div>
            <p className="text-muted-foreground">{segment.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Bu Segmentteki Aboneler</CardTitle>
            <CardDescription>"{segment.name}" segmentinin kurallarına uyan abonelerin listesi.</CardDescription>
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
                    {segmentSubscribers.length > 0 ? segmentSubscribers.map(sub => (
                        <TableRow key={sub.id}>
                            <TableCell className="font-medium">{sub.email}</TableCell>
                            <TableCell>{new Date(sub.subscribedAt).toLocaleDateString('tr-TR')}</TableCell>
                            <TableCell>
                                <Badge variant={sub.status === 'aktif' ? 'default' : 'secondary'}>{sub.status}</Badge>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">Bu segmentte abone bulunmuyor.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Toplam <strong>{segmentSubscribers.length}</strong> abone bu segmentte.
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

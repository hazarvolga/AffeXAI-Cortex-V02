'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Filter, PlusCircle, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import segmentsService, { CreateSegmentDto, Segment } from '@/lib/api/segmentsService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

export default function SegmentsManagementPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSegment, setNewSegment] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const data = await segmentsService.getAllSegments();
      setSegments(data);
    } catch (err) {
      console.error('Error fetching segments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSegment = async () => {
    try {
      await segmentsService.createSegment({
        name: newSegment.name,
        description: newSegment.description,
      });
      
      // Reset form
      setNewSegment({
        name: '',
        description: '',
      });
      
      // Refresh segments list
      fetchSegments();
      
      // Show success message
      alert('Segment başarıyla oluşturuldu!');
      setIsCreating(false);
    } catch (err) {
      console.error('Error creating segment:', err);
      alert('Segment oluşturulurken bir hata oluştu.');
    }
  };

  const handleDeleteSegment = async (id: string) => {
    try {
      await segmentsService.deleteSegment(id);
      // Refresh segments list
      fetchSegments();
      alert('Segment başarıyla silindi!');
    } catch (err) {
      console.error('Error deleting segment:', err);
      alert('Segment silinirken bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/newsletter">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Segmentleri Yönet</h1>
            <p className="text-muted-foreground">Abonelerinizi davranışlarına ve özelliklerine göre dinamik olarak gruplayın.</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Segmentler yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/newsletter">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Segmentleri Yönet</h1>
          <p className="text-muted-foreground">Abonelerinizi davranışlarına ve özelliklerine göre dinamik olarak gruplayın.</p>
        </div>
      </div>

      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle>Yeni Segment Oluştur</CardTitle>
            <CardDescription>
              Yeni bir segment tanımlayın.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="segment-name">Segment Adı</Label>
              <Input
                id="segment-name"
                value={newSegment.name}
                onChange={(e) => setNewSegment({...newSegment, name: e.target.value})}
                placeholder="Segment adı"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="segment-description">Açıklama</Label>
              <Textarea
                id="segment-description"
                value={newSegment.description}
                onChange={(e) => setNewSegment({...newSegment, description: e.target.value})}
                placeholder="Segment açıklaması"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                İptal
              </Button>
              <Button 
                onClick={handleCreateSegment}
                disabled={!newSegment.name}
              >
                Segment Oluştur
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Segmentler</CardTitle>
                  <CardDescription>
                    Mevcut segmentlerinizi görüntüleyin ve yönetin.
                  </CardDescription>
                </div>
                <Button onClick={() => setIsCreating(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Yeni Segment Oluştur
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {segments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Filter className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">Henüz hiç segmentiniz yok</h3>
                    <p className="text-muted-foreground">
                      Yeni segmentler oluşturarak abonelerinizi gruplandırın.
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Segment Adı</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Abone Sayısı</TableHead>
                      <TableHead><span className="sr-only">Eylemler</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {segments.map((segment) => (
                      <TableRow key={segment.id}>
                        <TableCell className="font-medium">{segment.name}</TableCell>
                        <TableCell className="text-muted-foreground">{segment.description || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{segment.subscriberCount}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Menüyü aç</span>
                                <span className="text-lg">⋮</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Düzenle
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Sil
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Bu işlem geri alınamaz. "{segment.name}" segmenti kalıcı olarak silinecek.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteSegment(segment.id)}>
                                      Sil
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Music, 
  Search, 
  Filter,
  X,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import mediaService, { Media } from '@/lib/api/mediaService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function MediaManagementPage() {
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const data = await mediaService.getAllMedia();
      setMediaItems(data);
    } catch (err) {
      console.error('Error fetching media:', err);
      toast({
        title: "Hata",
        description: "Medya dosyaları yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Check if file is an image
      if (!file.type.match('image.*')) {
        toast({
          title: "Geçersiz Dosya Türü",
          description: "Sadece resim dosyaları yüklenebilir (JPG, PNG, GIF, SVG, WEBP).",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      await mediaService.uploadFile(selectedFile);
      setSelectedFile(null);
      fetchMedia(); // Refresh the media list
      
      toast({
        title: "Başarılı",
        description: "Dosya başarıyla yüklendi."
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      toast({
        title: "Hata",
        description: "Dosya yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, fileName: string) => {
    if (!confirm(`"${fileName}" adlı dosyayı silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await mediaService.deleteMedia(id);
      fetchMedia(); // Refresh the media list
      
      toast({
        title: "Başarılı",
        description: "Dosya başarıyla silindi."
      });
    } catch (err) {
      console.error('Error deleting media:', err);
      toast({
        title: "Hata",
        description: "Dosya silinirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (media: Media) => {
    setSelectedMedia(media);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedMedia) return;

    try {
      await mediaService.updateMedia(selectedMedia.id, {
        title: selectedMedia.title,
        description: selectedMedia.description,
        altText: selectedMedia.altText
      });
      
      fetchMedia(); // Refresh the media list
      setIsEditDialogOpen(false);
      setSelectedMedia(null);
      
      toast({
        title: "Başarılı",
        description: "Dosya bilgileri güncellendi."
      });
    } catch (err) {
      console.error('Error updating media:', err);
      toast({
        title: "Hata",
        description: "Dosya bilgileri güncellenirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const filteredMedia = mediaItems.filter(media => {
    const matchesSearch = media.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (media.title && media.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (media.description && media.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || media.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getMediaTypeLabel = (type: string) => {
    switch (type) {
      case 'image':
        return 'Resim';
      case 'document':
        return 'Belge';
      case 'video':
        return 'Video';
      case 'audio':
        return 'Ses';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medya Yönetimi</h1>
          <p className="text-muted-foreground">Tüm medya dosyalarınızı buradan yönetin.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Medya dosyaları yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Medya Yönetimi</h1>
        <p className="text-muted-foreground">Tüm medya dosyalarınızı buradan yönetin.</p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Yeni Medya Yükle</CardTitle>
          <CardDescription>
            Yeni medya dosyaları yükleyin. Desteklenen formatlar: JPG, PNG, GIF, SVG, WEBP (Maksimum 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {isDragging ? 'Dosyayı bırakın' : 'Dosya sürükleyip bırakın ya da tıklayın'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, GIF, SVG, WEBP (Maksimum 5MB)
            </p>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          
          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleUpload} 
                  disabled={uploading}
                  size="sm"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? 'Yükleniyor...' : 'Yükle'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>Medya Dosyaları</CardTitle>
              <CardDescription>
                {mediaItems.length} medya dosyası
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ara..."
                  className="pl-8 w-40"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="image">Resim</SelectItem>
                  <SelectItem value="document">Belge</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Ses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">Henüz medya dosyası yok</h3>
                <p className="text-muted-foreground">
                  Yeni medya dosyaları yükleyerek kütüphanenizi oluşturun.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Önizleme</TableHead>
                  <TableHead>Dosya Adı</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Boyut</TableHead>
                  <TableHead>Oluşturulma Tarihi</TableHead>
                  <TableHead className="text-right">Eylemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedia.map((media) => (
                  <TableRow key={media.id}>
                    <TableCell>
                      {media.type === 'image' ? (
                        <div className="relative h-16 w-16 rounded-md overflow-hidden">
                          <Image
                            src={`http://localhost:9005${media.url}`}
                            alt={media.altText || media.originalName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-16 w-16 rounded-md bg-muted">
                          {getMediaTypeIcon(media.type)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{media.originalName}</div>
                      {media.title && (
                        <div className="text-sm text-muted-foreground">{media.title}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {getMediaTypeIcon(media.type)}
                        {getMediaTypeLabel(media.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(media.size)}</TableCell>
                    <TableCell>
                      {new Date(media.createdAt).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(media)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(media.id, media.originalName)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Media Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Medya Bilgilerini Düzenle</DialogTitle>
          </DialogHeader>
          {selectedMedia && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {selectedMedia.type === 'image' ? (
                  <div className="relative h-32 w-32 rounded-md overflow-hidden">
                    <Image
                      src={`http://localhost:9005${selectedMedia.url}`}
                      alt={selectedMedia.altText || selectedMedia.originalName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 w-32 rounded-md bg-muted">
                    {getMediaTypeIcon(selectedMedia.type)}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Başlık</Label>
                <Input
                  id="title"
                  value={selectedMedia.title || ''}
                  onChange={(e) => setSelectedMedia({...selectedMedia, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="altText">Alternatif Metin</Label>
                <Input
                  id="altText"
                  value={selectedMedia.altText || ''}
                  onChange={(e) => setSelectedMedia({...selectedMedia, altText: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={selectedMedia.description || ''}
                  onChange={(e) => setSelectedMedia({...selectedMedia, description: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleSaveEdit}>
                  Kaydet
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
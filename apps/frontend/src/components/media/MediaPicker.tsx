'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Music,
  Upload,
  Plus,
  X
} from 'lucide-react';
import mediaService, { Media } from '@/lib/api/mediaService';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

// Get base URL for media files - use env variable for production support
function getMediaBaseUrl(): string {
  // NEXT_PUBLIC_API_URL ends with /api, we need to remove it for media URLs
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006/api';
  return apiUrl.replace(/\/api\/?$/, '');
}

interface MediaPickerProps {
  value?: string;
  onChange: (mediaId: string | null) => void;
  placeholder?: string;
  filterType?: string; // 'image', 'video', 'audio', 'document', 'all'
}

export default function MediaPicker({ value, onChange, placeholder = "Medya seçin", filterType: initialFilterType = 'all' }: MediaPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>(initialFilterType);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedMediaId(value || null);
  }, [value]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const data = await mediaService.getAllMedia();
      setMediaItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching media:', err);
      setMediaItems([]); // Set to empty array on error
      toast({
        title: "Hata",
        description: "Medya dosyaları yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMedia = Array.isArray(mediaItems) ? mediaItems.filter(media => {
    const matchesSearch = media.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (media.title && media.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || media.type === filterType;
    
    return matchesSearch && matchesType;
  }) : [];

  const handleSelect = (mediaId: string) => {
    setSelectedMediaId(mediaId);
    onChange(mediaId);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedMediaId(null);
    onChange(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const media = await mediaService.uploadFile(selectedFile);
      // Refresh the media list
      await fetchMedia();
      // Select the newly uploaded file
      setSelectedMediaId(media.id);
      onChange(media.id);
      // Clear the file input
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Başarılı",
        description: "Dosya başarıyla yüklendi."
      });
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

  const selectedMedia = mediaItems.find(media => media.id === selectedMediaId);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              {selectedMedia ? (
                <div className="flex items-center gap-2">
                  {selectedMedia?.type === 'image' && selectedMedia?.url ? (
                    <div className="relative h-6 w-6 rounded overflow-hidden">
                      <Image
                        src={selectedMedia.url.startsWith('/uploads/')
                          ? `${getMediaBaseUrl()}${selectedMedia.url}`
                          : selectedMedia.url}
                        alt={selectedMedia.altText || selectedMedia.originalName}
                        width={24}
                        height={24}
                        className="object-cover"
                      />
                    </div>
                  ) : selectedMedia?.type ? (
                    <div className="flex items-center justify-center h-6 w-6">
                      {getMediaTypeIcon(selectedMedia.type)}
                    </div>
                  ) : null}
                  <span className="truncate">{selectedMedia?.title || selectedMedia?.originalName}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Medya Seç</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Upload Section */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Yeni Medya Yükle</h3>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                  <Button 
                    onClick={handleUpload} 
                    disabled={!selectedFile || uploading}
                  >
                    {uploading ? (
                      <>
                        <Upload className="mr-2 h-4 w-4 animate-spin" />
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Yükle
                      </>
                    )}
                  </Button>
                </div>
                {selectedFile && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Seçilen dosya: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </div>
                )}
              </div>
              
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ara..."
                    className="pl-8"
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
              
              {/* Media Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Medya dosyaları yükleniyor...</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredMedia.map((media) => (
                    <div 
                      key={media.id}
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-colors ${
                        selectedMediaId === media.id 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-muted hover:border-primary/50'
                      }`}
                      onClick={() => handleSelect(media.id)}
                    >
                      <div className="relative aspect-square">
                        {media.type === 'image' && media.url ? (
                          <Image
                            src={media.url.startsWith('/uploads/')
                              ? `${getMediaBaseUrl()}${media.url}`
                              : media.url}
                            alt={media.altText || media.originalName}
                            width={200}
                            height={200}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full bg-muted">
                            <div className="mb-2">
                              {getMediaTypeIcon(media.type)}
                            </div>
                            <span className="text-xs text-center px-1">
                              {getMediaTypeLabel(media.type)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <div className="text-xs font-medium truncate">
                          {media.title || media.originalName}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            {getMediaTypeLabel(media.type)}
                          </Badge>
                          <span>{formatFileSize(media.size)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(media.createdAt), 'dd.MM.yyyy', { locale: tr })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {selectedMediaId && (
          <Button variant="outline" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {selectedMedia && (
        <div className="text-sm text-muted-foreground">
          Seçilen: {selectedMedia.title || selectedMedia.originalName}
        </div>
      )}
    </div>
  );
}
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import NextImage from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Media, MediaType } from '@/lib/media/types';
import { mediaService } from '@/lib/api/mediaService';
import { Image, FileText, Video, Music, Upload, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MediaLibraryProps {
  onMediaSelect: (media: Media) => void;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ onMediaSelect }) => {
  const { toast } = useToast();
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const media = await mediaService.getAllMedia();
      setMediaItems(media);
      setFilteredMedia(media);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch media items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  useEffect(() => {
    let result = mediaItems;
    
    // Filter by type
    if (selectedType !== 'all') {
      result = result.filter(item => item.type === selectedType);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.originalName.toLowerCase().includes(query) ||
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }
    
    setFilteredMedia(result);
  }, [mediaItems, selectedType, searchQuery]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const media = await mediaService.uploadFile(file);
      
      // Ensure the media object has all required properties
      if (!media.url) {
        throw new Error('Uploaded file did not return a valid URL');
      }
      
      setMediaItems([media, ...mediaItems]);
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getMediaTypeIcon = (type: MediaType) => {
    switch (type) {
      case MediaType.IMAGE:
        return <Image className="h-4 w-4" />;
      case MediaType.DOCUMENT:
        return <FileText className="h-4 w-4" />;
      case MediaType.VIDEO:
        return <Video className="h-4 w-4" />;
      case MediaType.AUDIO:
        return <Music className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getMediaTypeLabel = (type: MediaType) => {
    switch (type) {
      case MediaType.IMAGE:
        return 'Image';
      case MediaType.DOCUMENT:
        return 'Document';
      case MediaType.VIDEO:
        return 'Video';
      case MediaType.AUDIO:
        return 'Audio';
      default:
        return 'File';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Media Library</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button 
              variant="outline" 
              disabled={uploading}
              className="flex items-center gap-2"
              onClick={triggerFileInput}
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </div>

          <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as MediaType | 'all')}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value={MediaType.IMAGE}>Images</TabsTrigger>
              <TabsTrigger value={MediaType.DOCUMENT}>Docs</TabsTrigger>
              <TabsTrigger value={MediaType.VIDEO}>Videos</TabsTrigger>
              <TabsTrigger value={MediaType.AUDIO}>Audio</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading media...
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? 'No media found matching your search' : 'No media items available'}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 p-4">
              {filteredMedia.map((media) => (
                <div
                  key={media.id}
                  className="relative group cursor-pointer border rounded-md overflow-hidden hover:border-primary transition-colors"
                  onClick={() => {
                    // Only allow selection if media has a valid URL
                    if (media.url) {
                      onMediaSelect(media);
                    }
                  }}
                >
                  {media.type === MediaType.IMAGE ? (
                    <div className="aspect-square bg-muted flex items-center justify-center">
                      {media.thumbnailUrl || media.url ? (
                        <NextImage 
                          src={media.thumbnailUrl || media.url} 
                          alt={media.altText || media.originalName}
                          width={200}
                          height={200}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Image className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                  ) : (
                    <div className="aspect-square bg-muted flex flex-col items-center justify-center p-2 text-center">
                      <div className="mb-2">
                        {getMediaTypeIcon(media.type)}
                      </div>
                      <span className="text-xs font-medium truncate w-full">
                        {getMediaTypeLabel(media.type)}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-1 text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {media.originalName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MediaLibrary;
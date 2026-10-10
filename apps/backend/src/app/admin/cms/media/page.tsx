'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Media, MediaType } from '@/lib/media/types';
import { mediaService } from '@/lib/media/media-service';
import { Image, FileText, Video, Music, Upload, Search, X, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MediaManagementPage = () => {
  const { toast } = useToast();
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [editingMedia, setEditingMedia] = useState<Partial<Media> | null>(null);

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
      e.target.value = ''; // Reset input
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media item?')) {
      return;
    }

    try {
      await mediaService.deleteMedia(id);
      setMediaItems(mediaItems.filter(item => item.id !== id));
      if (selectedMedia?.id === id) {
        setSelectedMedia(null);
      }
      toast({
        title: "Success",
        description: "Media item deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete media item",
        variant: "destructive",
      });
    }
  };

  const handleEditMedia = (media: Media) => {
    setEditingMedia({
      title: media.title,
      altText: media.altText,
      description: media.description,
    });
    setSelectedMedia(media);
  };

  const handleSaveEdit = async () => {
    if (!selectedMedia || !editingMedia) return;

    try {
      const updatedMedia = await mediaService.updateMedia(selectedMedia.id, editingMedia);
      setMediaItems(mediaItems.map(item => 
        item.id === selectedMedia.id ? updatedMedia : item
      ));
      setSelectedMedia(updatedMedia);
      setEditingMedia(null);
      toast({
        title: "Success",
        description: "Media item updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update media item",
        variant: "destructive",
      });
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
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Media Management</h1>
        <p className="text-muted-foreground">Manage your media library</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Media Library</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search media..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
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
                  <Select 
                    value={selectedType} 
                    onValueChange={(value) => setSelectedType(value as MediaType | 'all')}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value={MediaType.IMAGE}>Images</SelectItem>
                      <SelectItem value={MediaType.DOCUMENT}>Documents</SelectItem>
                      <SelectItem value={MediaType.VIDEO}>Videos</SelectItem>
                      <SelectItem value={MediaType.AUDIO}>Audio</SelectItem>
                    </SelectContent>
                  </Select>
                  <Label className="cursor-pointer">
                    <Button 
                      variant="default" 
                      disabled={uploading}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                    <Input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading media...</p>
              ) : filteredMedia.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery ? 'No media found matching your search' : 'No media items available'}
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredMedia.map((media) => (
                    <div
                      key={media.id}
                      className={`relative group cursor-pointer border rounded-md overflow-hidden hover:border-primary transition-colors ${
                        selectedMedia?.id === media.id ? 'border-primary ring-2 ring-primary/20' : ''
                      }`}
                      onClick={() => setSelectedMedia(media)}
                    >
                      {media.type === MediaType.IMAGE ? (
                        <div className="aspect-square bg-muted flex items-center justify-center">
                          {media.thumbnailUrl ? (
                            <img 
                              src={media.thumbnailUrl} 
                              alt={media.altText || media.originalName}
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
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMedia(media);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMedia(media.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedMedia ? 'Media Details' : 'Select Media'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMedia ? (
                <div className="space-y-4">
                  {selectedMedia.type === MediaType.IMAGE ? (
                    <div className="aspect-square bg-muted rounded-md overflow-hidden">
                      {selectedMedia.thumbnailUrl ? (
                        <img 
                          src={selectedMedia.thumbnailUrl} 
                          alt={selectedMedia.altText || selectedMedia.originalName}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-square bg-muted rounded-md flex flex-col items-center justify-center">
                      <div className="mb-2">
                        {getMediaTypeIcon(selectedMedia.type)}
                      </div>
                      <span className="text-sm font-medium">
                        {getMediaTypeLabel(selectedMedia.type)}
                      </span>
                    </div>
                  )}
                  
                  {editingMedia ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={editingMedia.title || ''}
                          onChange={(e) => setEditingMedia({...editingMedia, title: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="altText">Alt Text</Label>
                        <Input
                          id="altText"
                          value={editingMedia.altText || ''}
                          onChange={(e) => setEditingMedia({...editingMedia, altText: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={editingMedia.description || ''}
                          onChange={(e) => setEditingMedia({...editingMedia, description: e.target.value})}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={handleSaveEdit}>Save</Button>
                        <Button variant="outline" onClick={() => setEditingMedia(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">File Name</Label>
                        <p className="font-medium">{selectedMedia.originalName}</p>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Title</Label>
                        <p className="font-medium">{selectedMedia.title || 'No title'}</p>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Alt Text</Label>
                        <p className="font-medium">{selectedMedia.altText || 'No alt text'}</p>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <p className="font-medium">{selectedMedia.description || 'No description'}</p>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Type</Label>
                        <p className="font-medium capitalize">{selectedMedia.type}</p>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Size</Label>
                        <p className="font-medium">{(selectedMedia.size / 1024).toFixed(2)} KB</p>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">URL</Label>
                        <p className="font-mono text-xs break-all">{selectedMedia.url}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={() => handleEditMedia(selectedMedia)}>Edit</Button>
                        <Button variant="destructive" onClick={() => handleDeleteMedia(selectedMedia.id)}>Delete</Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Select a media item to view details
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MediaManagementPage;
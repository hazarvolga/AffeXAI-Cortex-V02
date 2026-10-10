import httpClient from './httpClient';

export interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'document' | 'video' | 'audio';
  storageType: 'local' | 'cloud';
  altText?: string;
  title?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMediaDto {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  type?: 'image' | 'document' | 'video' | 'audio';
  storageType?: 'local' | 'cloud';
  altText?: string;
  title?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateMediaDto {
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  thumbnailUrl?: string;
  type?: 'image' | 'document' | 'video' | 'audio';
  storageType?: 'local' | 'cloud';
  altText?: string;
  title?: string;
  description?: string;
  isActive?: boolean;
}

class MediaService {
  async getAllMedia(type?: string): Promise<Media[]> {
    const url = type ? `/media?type=${type}` : '/media';
    return httpClient.get<Media[]>(url);
  }

  async getMediaById(id: string): Promise<Media> {
    return httpClient.get<Media>(`/media/${id}`);
  }

  async createMedia(mediaData: CreateMediaDto): Promise<Media> {
    return httpClient.post<Media>('/media', mediaData);
  }

  async updateMedia(id: string, mediaData: UpdateMediaDto): Promise<Media> {
    return httpClient.patch<Media>(`/media/${id}`, mediaData);
  }

  async deleteMedia(id: string): Promise<void> {
    return httpClient.delete<void>(`/media/${id}`);
  }

  async uploadFile(file: File): Promise<Media> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('http://localhost:9005/api/media/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('File upload failed');
    }
    
    return response.json();
  }
}

export default new MediaService();
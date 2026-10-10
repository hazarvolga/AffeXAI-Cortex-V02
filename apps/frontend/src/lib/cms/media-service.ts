// Media Service
// This service handles media uploads and management for the CMS

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  altText?: string;
  caption?: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

interface UploadMediaDto {
  file: File;
  altText?: string;
  caption?: string;
}

export class MediaService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      credentials: 'include',
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null as T;
    }
    
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse server response');
    }
  }

  // Media methods
  async getMediaItems(): Promise<MediaItem[]> {
    return this.request<MediaItem[]>('/cms/media');
  }

  async getMediaItem(id: string): Promise<MediaItem> {
    return this.request<MediaItem>(`/cms/media/${id}`);
  }

  async uploadMedia(data: UploadMediaDto): Promise<MediaItem> {
    const formData = new FormData();
    formData.append('file', data.file);
    
    if (data.altText) {
      formData.append('altText', data.altText);
    }
    
    if (data.caption) {
      formData.append('caption', data.caption);
    }

    return this.request<MediaItem>('/cms/media', {
      method: 'POST',
      body: formData,
    });
  }

  async updateMedia(id: string, data: Partial<Omit<UploadMediaDto, 'file'>>): Promise<MediaItem> {
    return this.request<MediaItem>(`/cms/media/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async deleteMedia(id: string): Promise<void> {
    return this.request<void>(`/cms/media/${id}`, {
      method: 'DELETE',
    });
  }
}

export const mediaService = new MediaService();
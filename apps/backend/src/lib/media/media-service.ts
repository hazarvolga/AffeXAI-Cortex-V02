// Frontend Media Service
// This service interacts with the backend Media API

import { Media, MediaType, CreateMediaDto, UpdateMediaDto } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006/api';

export class MediaService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Media methods
  async getAllMedia(type?: MediaType): Promise<Media[]> {
    const query = type ? `?type=${type}` : '';
    return this.request<Media[]>(`/media${query}`);
  }

  async getMediaById(id: string): Promise<Media> {
    return this.request<Media>(`/media/${id}`);
  }

  async createMedia(data: CreateMediaDto): Promise<Media> {
    return this.request<Media>('/media', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMedia(id: string, data: UpdateMediaDto): Promise<Media> {
    return this.request<Media>(`/media/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMedia(id: string): Promise<void> {
    return this.request<void>(`/media/${id}`, {
      method: 'DELETE',
    });
  }

  // Upload file
  async uploadFile(file: File): Promise<Media> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/media/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
}

export const mediaService = new MediaService();
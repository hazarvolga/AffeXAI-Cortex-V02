import httpClient from './httpClient';

export interface Segment {
  id: string;
  name: string;
  description?: string;
  subscriberCount: number;
  criteria?: string;
  openRate: number;
  clickRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSegmentDto {
  name: string;
  description?: string;
  criteria?: string;
  openRate?: number;
  clickRate?: number;
}

export interface UpdateSegmentDto {
  name?: string;
  description?: string;
  criteria?: string;
  openRate?: number;
  clickRate?: number;
  subscriberCount?: number;
}

class SegmentsService {
  async getAllSegments(): Promise<Segment[]> {
    return httpClient.get<Segment[]>('/email-marketing/segments');
  }

  async getSegmentById(id: string): Promise<Segment> {
    return httpClient.get<Segment>(`/email-marketing/segments/${id}`);
  }

  async createSegment(segmentData: CreateSegmentDto): Promise<Segment> {
    return httpClient.post<Segment>('/email-marketing/segments', segmentData);
  }

  async updateSegment(id: string, segmentData: UpdateSegmentDto): Promise<Segment> {
    return httpClient.patch<Segment>(`/email-marketing/segments/${id}`, segmentData);
  }

  async deleteSegment(id: string): Promise<void> {
    return httpClient.delete<void>(`/email-marketing/segments/${id}`);
  }
}

export default new SegmentsService();
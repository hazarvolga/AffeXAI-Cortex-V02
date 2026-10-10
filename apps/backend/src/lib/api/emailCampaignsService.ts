import httpClient from './httpClient';

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  scheduledAt?: string;
  sentAt?: string;
  totalRecipients: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignDto {
  name: string;
  subject: string;
  content: string;
  status?: 'draft' | 'scheduled';
  scheduledAt?: string;
}

export interface UpdateCampaignDto {
  name?: string;
  subject?: string;
  content?: string;
  status?: 'draft' | 'scheduled';
  scheduledAt?: string;
}

class EmailCampaignsService {
  async getAllCampaigns(): Promise<EmailCampaign[]> {
    return httpClient.get<EmailCampaign[]>('/email-campaigns');
  }

  async getCampaignById(id: string): Promise<EmailCampaign> {
    return httpClient.get<EmailCampaign>(`/email-campaigns/${id}`);
  }

  async createCampaign(campaignData: CreateCampaignDto): Promise<EmailCampaign> {
    return httpClient.post<EmailCampaign>('/email-campaigns', campaignData);
  }

  async updateCampaign(id: string, campaignData: UpdateCampaignDto): Promise<EmailCampaign> {
    return httpClient.patch<EmailCampaign>(`/email-campaigns/${id}`, campaignData);
  }

  async deleteCampaign(id: string): Promise<void> {
    return httpClient.delete<void>(`/email-campaigns/${id}`);
  }

  async sendCampaign(id: string): Promise<void> {
    return httpClient.post<void>(`/email-campaigns/${id}/send`);
  }

  async getCampaignStats(id: string): Promise<any> {
    return httpClient.get<any>(`/email-campaigns/${id}/stats`);
  }
}

export default new EmailCampaignsService();
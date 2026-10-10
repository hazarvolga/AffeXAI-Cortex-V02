import httpClient from './httpClient';

export interface Subscriber {
  id: string;
  email: string;
  status: 'active' | 'pending' | 'unsubscribed';
  groups: string[];
  segments: string[];
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  customerStatus?: string;
  subscriptionType?: string;
  mailerCheckResult?: string;
  subscribedAt: string;
  lastUpdated: string;
  location?: string;
  sent?: number;
  opens?: number;
  clicks?: number;
}

export interface CreateSubscriberDto {
  email: string;
  status?: 'active' | 'pending' | 'unsubscribed';
  groups?: string[];
  segments?: string[];
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  customerStatus?: string;
  subscriptionType?: string;
  mailerCheckResult?: string;
}

export interface UpdateSubscriberDto {
  email?: string;
  status?: 'active' | 'pending' | 'unsubscribed';
  groups?: string[];
  segments?: string[];
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  customerStatus?: string;
  subscriptionType?: string;
  mailerCheckResult?: string;
}

class SubscribersService {
  async getAllSubscribers(): Promise<Subscriber[]> {
    return httpClient.get<Subscriber[]>('/email-marketing/subscribers');
  }

  async getSubscriberById(id: string): Promise<Subscriber> {
    return httpClient.get<Subscriber>(`/email-marketing/subscribers/${id}`);
  }

  async createSubscriber(subscriberData: CreateSubscriberDto): Promise<Subscriber> {
    return httpClient.post<Subscriber>('/email-marketing/subscribers', subscriberData);
  }

  async updateSubscriber(id: string, subscriberData: UpdateSubscriberDto): Promise<Subscriber> {
    return httpClient.patch<Subscriber>(`/email-marketing/subscribers/${id}`, subscriberData);
  }

  async deleteSubscriber(id: string): Promise<void> {
    return httpClient.delete<void>(`/email-marketing/subscribers/${id}`);
  }

  async subscribe(email: string): Promise<Subscriber> {
    return httpClient.post<Subscriber>('/email-marketing/subscribers/subscribe', { email });
  }

  async unsubscribe(email: string): Promise<Subscriber> {
    return httpClient.post<Subscriber>('/email-marketing/subscribers/unsubscribe', { email });
  }
}

export default new SubscribersService();
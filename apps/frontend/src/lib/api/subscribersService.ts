import { httpClient } from './http-client';
import { BaseApiService } from './base-service';
import type {
  Subscriber,
  CreateSubscriberDto,
  UpdateSubscriberDto,
} from '@affexai/shared-types';

// Re-export types for convenience
export type {
  Subscriber,
  CreateSubscriberDto,
  UpdateSubscriberDto,
};

/**
 * Subscribers Service
 * Handles email marketing subscriber operations extending BaseApiService
 */
class SubscribersService extends BaseApiService<Subscriber, CreateSubscriberDto, UpdateSubscriberDto> {
  constructor() {
    super({ endpoint: '/email-marketing/subscribers', useWrappedResponses: true });
  }

  async subscribe(email: string): Promise<Subscriber> {
    return httpClient.postWrapped<Subscriber>(`${this.endpoint}/subscribe`, { email });
  }

  async unsubscribe(email: string): Promise<Subscriber> {
    return httpClient.postWrapped<Subscriber>(`${this.endpoint}/unsubscribe`, { email });
  }
}

export const subscribersService = new SubscribersService();
export default subscribersService;
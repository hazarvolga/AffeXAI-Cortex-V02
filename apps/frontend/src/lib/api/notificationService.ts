import { httpClient } from './http-client';

export interface UserNotification {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

/** Recipient and tenant are resolved by the authenticated backend. */
export const notificationService = {
  list: (page?: {limit: number; offset: number}) => page
    ? httpClient.getWrapped<UserNotification[]>('/notifications', {params: {limit: page.limit, offset: page.offset}})
    : httpClient.getWrapped<UserNotification[]>('/notifications'),
  markRead: (id: string) => httpClient.postWrapped<UserNotification>(`/notifications/${encodeURIComponent(id)}/read`, {}),
  markAllRead: () => httpClient.postWrapped<{message: string}>('/notifications/read-all', {}),
};

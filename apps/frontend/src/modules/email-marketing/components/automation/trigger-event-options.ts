import { TriggerEvent } from '@/types/automation';

// Unsupported events remain visible but cannot be selected until backend support exists.
export const triggerEventGroups: { title: string; events: { value: string; event?: TriggerEvent; label: string }[] }[] = [
    {
      title: 'Subscriber Events',
      events: [
        { value: TriggerEvent.SUBSCRIBER_CREATED, event: TriggerEvent.SUBSCRIBER_CREATED, label: 'New Subscriber' },
        { value: TriggerEvent.SUBSCRIBER_UPDATED, event: TriggerEvent.SUBSCRIBER_UPDATED, label: 'Subscriber Updated' },
        { value: 'subscriber.unsubscribed', label: 'Unsubscribed (not yet supported)' },
      ],
    },
    {
      title: 'Email Events',
      events: [
        { value: TriggerEvent.EMAIL_OPENED, event: TriggerEvent.EMAIL_OPENED, label: 'Email Opened' },
        { value: TriggerEvent.EMAIL_CLICKED, event: TriggerEvent.EMAIL_CLICKED, label: 'Link Clicked' },
        { value: 'email.bounced', label: 'Email Bounced (not yet supported)' },
      ],
    },
    {
      title: 'Campaign Events',
      events: [
        { value: 'campaign.sent', label: 'Campaign Sent (not yet supported)' },
        { value: TriggerEvent.SUBSCRIBER_SEGMENT_ADDED, event: TriggerEvent.SUBSCRIBER_SEGMENT_ADDED, label: 'Joined Segment' },
        { value: TriggerEvent.SUBSCRIBER_SEGMENT_REMOVED, event: TriggerEvent.SUBSCRIBER_SEGMENT_REMOVED, label: 'Left Segment' },
      ],
    },
  ];

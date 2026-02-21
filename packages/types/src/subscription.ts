import type { AlertSeverity, AlertChannel, AlertLocale } from './alert';

export interface AlertSubscription {
  id: string;
  userId: string;
  expoPushToken: string | null;
  phoneNumber: string | null;
  preferredLocale: AlertLocale;
  subscribedChannels: AlertChannel;
  severityThreshold: AlertSeverity;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertSubscriptionInput {
  userId: string;
  expoPushToken?: string | null;
  phoneNumber?: string | null;
  preferredLocale?: AlertLocale;
  subscribedChannels?: AlertChannel;
  severityThreshold?: AlertSeverity;
}

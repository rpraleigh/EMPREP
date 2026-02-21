export type DeliveryStatus  = 'pending' | 'sent' | 'delivered' | 'failed' | 'error' | 'not_registered';
export type DeliveryChannel = 'push' | 'sms';

export interface AlertDelivery {
  id: string;
  alertId: string;
  subscriptionId: string;
  channel: DeliveryChannel;
  recipientToken: string | null;
  recipientPhone: string | null;
  status: DeliveryStatus;
  expoReceiptId: string | null;
  twilioSid: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  receiptCheckedAt: string | null;
  createdAt: string;
}

export interface AlertDeliveryStats {
  alertId: string;
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  failed: number;
  error: number;
  notRegistered: number;
}

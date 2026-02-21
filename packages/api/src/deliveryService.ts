import type { SupabaseClient } from '@supabase/supabase-js';
import type { AlertDelivery, AlertDeliveryStats, DeliveryStatus } from '@rpral/types';
import { Expo } from 'expo-server-sdk';

interface NewDeliveryRecord {
  subscriptionId: string;
  channel: 'push' | 'sms';
  recipientToken?: string;
  recipientPhone?: string;
}

export async function createDeliveryRecords(
  client: SupabaseClient,
  alertId: string,
  records: NewDeliveryRecord[],
): Promise<AlertDelivery[]> {
  const rows = records.map((r) => ({
    alert_id: alertId,
    subscription_id: r.subscriptionId,
    channel: r.channel,
    recipient_token: r.recipientToken ?? null,
    recipient_phone: r.recipientPhone ?? null,
    status: 'pending',
  }));

  const { data, error } = await client
    .from('alert_deliveries')
    .insert(rows)
    .select();

  if (error) throw new Error(`Failed to create delivery records: ${error.message}`);
  return (data ?? []).map(toDelivery);
}

export async function updateDeliveryStatus(
  client: SupabaseClient,
  deliveryId: string,
  status: DeliveryStatus,
  meta?: {
    expoReceiptId?: string;
    twilioSid?: string;
    errorMessage?: string;
    sentAt?: string;
    deliveredAt?: string;
    failedAt?: string;
    receiptCheckedAt?: string;
  },
): Promise<void> {
  const { error } = await client
    .from('alert_deliveries')
    .update({
      status,
      expo_receipt_id: meta?.expoReceiptId ?? undefined,
      twilio_sid: meta?.twilioSid ?? undefined,
      error_message: meta?.errorMessage ?? undefined,
      sent_at: meta?.sentAt ?? undefined,
      delivered_at: meta?.deliveredAt ?? undefined,
      failed_at: meta?.failedAt ?? undefined,
      receipt_checked_at: meta?.receiptCheckedAt ?? undefined,
    })
    .eq('id', deliveryId);

  if (error) throw new Error(`Failed to update delivery ${deliveryId}: ${error.message}`);
}

/**
 * Poll Expo Push Receipt API for all 'sent' push deliveries that have a receipt ID.
 * Updates delivery status to 'delivered', 'error', or 'not_registered' accordingly.
 * Also deactivates the expo_push_token for 'DeviceNotRegistered' errors.
 */
export async function pollExpoReceipts(
  client: SupabaseClient,
  expo: Expo,
): Promise<{ polled: number; updated: number }> {
  const { data, error } = await client
    .from('alert_deliveries')
    .select('id, expo_receipt_id, subscription_id')
    .eq('status', 'sent')
    .eq('channel', 'push')
    .not('expo_receipt_id', 'is', null);

  if (error) throw new Error(`Failed to fetch pending receipts: ${error.message}`);
  if (!data?.length) return { polled: 0, updated: 0 };

  const receiptIds = data.map((r) => r.expo_receipt_id as string);
  const receiptMap = await expo.getPushNotificationReceiptsAsync(receiptIds);

  let updated = 0;
  const now = new Date().toISOString();

  for (const row of data) {
    const receipt = receiptMap[row.expo_receipt_id as string];
    if (!receipt) continue;

    if (receipt.status === 'ok') {
      await updateDeliveryStatus(client, row.id as string, 'delivered', {
        deliveredAt: now,
        receiptCheckedAt: now,
      });
      updated++;
    } else if (receipt.status === 'error') {
      const isNotRegistered = receipt.details?.error === 'DeviceNotRegistered';
      const newStatus: DeliveryStatus = isNotRegistered ? 'not_registered' : 'error';

      await updateDeliveryStatus(client, row.id as string, newStatus, {
        errorMessage: receipt.message,
        failedAt: now,
        receiptCheckedAt: now,
      });

      if (isNotRegistered) {
        // Deactivate the stale push token so future dispatches skip this subscriber
        await client
          .from('alert_subscriptions')
          .update({ expo_push_token: null, updated_at: now })
          .eq('id', row.subscription_id as string);
      }

      updated++;
    }
  }

  return { polled: data.length, updated };
}

export async function getDeliveryStats(
  client: SupabaseClient,
  alertId: string,
): Promise<AlertDeliveryStats> {
  const { data, error } = await client
    .from('alert_deliveries')
    .select('status')
    .eq('alert_id', alertId);

  if (error) throw new Error(`Failed to fetch delivery stats: ${error.message}`);

  const counts = {
    pending: 0, sent: 0, delivered: 0, failed: 0, error: 0, not_registered: 0,
  };

  for (const row of data ?? []) {
    const s = row.status as keyof typeof counts;
    if (s in counts) counts[s]++;
  }

  return {
    alertId,
    total: (data ?? []).length,
    pending: counts.pending,
    sent: counts.sent,
    delivered: counts.delivered,
    failed: counts.failed,
    error: counts.error,
    notRegistered: counts.not_registered,
  };
}

export async function getDeliveriesForAlert(
  client: SupabaseClient,
  alertId: string,
  page = 1,
  pageSize = 50,
): Promise<AlertDelivery[]> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await client
    .from('alert_deliveries')
    .select('*')
    .eq('alert_id', alertId)
    .order('created_at', { ascending: true })
    .range(from, to);

  if (error) throw new Error(`Failed to fetch deliveries: ${error.message}`);
  return (data ?? []).map(toDelivery);
}

function toDelivery(row: Record<string, unknown>): AlertDelivery {
  return {
    id: row['id'] as string,
    alertId: row['alert_id'] as string,
    subscriptionId: row['subscription_id'] as string,
    channel: row['channel'] as 'push' | 'sms',
    recipientToken: (row['recipient_token'] as string | null) ?? null,
    recipientPhone: (row['recipient_phone'] as string | null) ?? null,
    status: row['status'] as DeliveryStatus,
    expoReceiptId: (row['expo_receipt_id'] as string | null) ?? null,
    twilioSid: (row['twilio_sid'] as string | null) ?? null,
    errorMessage: (row['error_message'] as string | null) ?? null,
    sentAt: (row['sent_at'] as string | null) ?? null,
    deliveredAt: (row['delivered_at'] as string | null) ?? null,
    failedAt: (row['failed_at'] as string | null) ?? null,
    receiptCheckedAt: (row['receipt_checked_at'] as string | null) ?? null,
    createdAt: row['created_at'] as string,
  };
}

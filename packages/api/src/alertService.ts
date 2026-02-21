import type { SupabaseClient } from '@supabase/supabase-js';
import { Expo } from 'expo-server-sdk';
import type { Alert, CreateAlertInput, AlertSeverity, AlertStatus } from '@rpral/types';
import type { TwilioClientWrapper } from './twilioClient';
import { getActiveSubscriptions } from './subscriptionService';
import { createDeliveryRecords, updateDeliveryStatus } from './deliveryService';

export async function createAlert(
  client: SupabaseClient,
  input: CreateAlertInput,
): Promise<Alert> {
  const { data, error } = await client
    .from('alerts')
    .insert({
      template_id: input.templateId ?? null,
      severity: input.severity,
      channel: input.channel,
      title: input.title,
      body: input.body,
      body_es: input.bodyEs ?? null,
      variables: input.variables ?? {},
      target_area: input.targetArea ?? null,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create alert: ${error.message}`);
  return toAlert(data);
}

/**
 * Dispatch an alert to all eligible subscribers across push and SMS channels.
 * Updates alert status through: dispatching → sent (or failed).
 */
export async function dispatchAlert(
  client: SupabaseClient,
  expo: Expo,
  twilio: TwilioClientWrapper,
  alertId: string,
  dispatchedBy: string,
): Promise<Alert> {
  // 1. Load the alert and mark as dispatching
  const alert = await getAlert(client, alertId);
  if (!alert) throw new Error(`Alert not found: ${alertId}`);

  await setAlertStatus(client, alertId, 'dispatching', dispatchedBy);

  try {
    // 2. Fetch eligible subscriptions
    const subscriptions = await getActiveSubscriptions(client, {
      alertSeverity: alert.severity,
    });

    if (subscriptions.length === 0) {
      return setAlertStatus(client, alertId, 'sent', dispatchedBy);
    }

    // 3. Create pending delivery records
    const deliveryInputs = subscriptions.flatMap((sub) => {
      const records = [];
      const wantsPush = (sub.subscribedChannels === 'push' || sub.subscribedChannels === 'both') && sub.expoPushToken;
      const wantsSms  = (sub.subscribedChannels === 'sms'  || sub.subscribedChannels === 'both') && sub.phoneNumber;

      if (wantsPush) {
        records.push({ subscriptionId: sub.id, channel: 'push' as const, recipientToken: sub.expoPushToken! });
      }
      if (wantsSms) {
        records.push({ subscriptionId: sub.id, channel: 'sms' as const, recipientPhone: sub.phoneNumber! });
      }
      return records;
    });

    const deliveries = await createDeliveryRecords(client, alertId, deliveryInputs);
    const deliveryBySub = new Map(deliveries.map((d) => [`${d.subscriptionId}:${d.channel}`, d]));

    const now = new Date().toISOString();

    // 4. Push notifications (batched in chunks of 100)
    const pushSubs = subscriptions.filter(
      (s) => (s.subscribedChannels === 'push' || s.subscribedChannels === 'both') && s.expoPushToken,
    );

    if (pushSubs.length > 0) {
      const messages = pushSubs.map((sub) => ({
        to: sub.expoPushToken!,
        title: alert.title,
        body: sub.preferredLocale === 'es' && alert.bodyEs ? alert.bodyEs : alert.body,
        sound: alert.severity === 'critical' ? ('default' as const) : null,
        priority: alert.severity === 'critical' ? ('high' as const) : ('normal' as const),
        data: { alertId: alert.id, severity: alert.severity },
      }));

      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        const tickets = await expo.sendPushNotificationsAsync(chunk);

        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          const sub = pushSubs[i];
          if (!sub || !ticket) continue;
          const delivery = deliveryBySub.get(`${sub.id}:push`);
          if (!delivery) continue;

          if (ticket.status === 'ok') {
            await updateDeliveryStatus(client, delivery.id, 'sent', {
              expoReceiptId: ticket.id,
              sentAt: now,
            });
          } else {
            await updateDeliveryStatus(client, delivery.id, 'error', {
              errorMessage: ticket.message,
              failedAt: now,
            });
          }
        }
      }
    }

    // 5. SMS (sequential to respect Twilio rate limits)
    const smsSubs = subscriptions.filter(
      (s) => (s.subscribedChannels === 'sms' || s.subscribedChannels === 'both') && s.phoneNumber,
    );

    for (const sub of smsSubs) {
      const delivery = deliveryBySub.get(`${sub.id}:sms`);
      if (!delivery) continue;

      const body =
        sub.preferredLocale === 'es' && alert.bodyEs
          ? `${alert.title}: ${alert.bodyEs}`
          : `${alert.title}: ${alert.body}`;

      try {
        const result = await twilio.sendSms(sub.phoneNumber!, body);
        await updateDeliveryStatus(client, delivery.id, 'sent', {
          twilioSid: result.sid,
          sentAt: now,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await updateDeliveryStatus(client, delivery.id, 'failed', {
          errorMessage: msg,
          failedAt: now,
        });
      }
    }

    return setAlertStatus(client, alertId, 'sent', dispatchedBy);
  } catch (err) {
    await setAlertStatus(client, alertId, 'failed', dispatchedBy);
    throw err;
  }
}

export async function cancelAlert(client: SupabaseClient, alertId: string): Promise<Alert> {
  const { data, error } = await client
    .from('alerts')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', alertId)
    .in('status', ['draft', 'pending'])
    .select()
    .single();

  if (error) throw new Error(`Failed to cancel alert: ${error.message}`);
  return toAlert(data);
}

export async function listAlerts(
  client: SupabaseClient,
  filters?: { status?: AlertStatus; severity?: AlertSeverity; page?: number; pageSize?: number },
): Promise<Alert[]> {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const from = (page - 1) * pageSize;

  let query = client
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.severity) query = query.eq('severity', filters.severity);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list alerts: ${error.message}`);
  return (data ?? []).map(toAlert);
}

export async function getAlert(client: SupabaseClient, alertId: string): Promise<Alert | null> {
  const { data, error } = await client
    .from('alerts')
    .select('*')
    .eq('id', alertId)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(`Failed to fetch alert: ${error.message}`);
  return toAlert(data);
}

async function setAlertStatus(
  client: SupabaseClient,
  alertId: string,
  status: AlertStatus,
  dispatchedBy?: string,
): Promise<Alert> {
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === 'dispatching' || status === 'sent') {
    updates['dispatched_by'] = dispatchedBy;
    updates['dispatched_at'] = new Date().toISOString();
  }

  const { data, error } = await client
    .from('alerts')
    .update(updates)
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update alert status: ${error.message}`);
  return toAlert(data);
}

function toAlert(row: Record<string, unknown>): Alert {
  return {
    id: row['id'] as string,
    templateId: (row['template_id'] as string | null) ?? null,
    severity: row['severity'] as AlertSeverity,
    channel: row['channel'] as Alert['channel'],
    title: row['title'] as string,
    body: row['body'] as string,
    bodyEs: (row['body_es'] as string | null) ?? null,
    variables: (row['variables'] as Record<string, string>) ?? {},
    targetArea: (row['target_area'] as string | null) ?? null,
    status: row['status'] as AlertStatus,
    dispatchedBy: (row['dispatched_by'] as string | null) ?? null,
    dispatchedAt: (row['dispatched_at'] as string | null) ?? null,
    cancelledAt: (row['cancelled_at'] as string | null) ?? null,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };
}

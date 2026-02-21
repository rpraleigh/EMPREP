import type { SupabaseClient } from '@supabase/supabase-js';
import type { AlertSeverity, AlertLocale, AlertChannel } from '@rpral/types';
import type { AlertSubscription, UpsertSubscriptionInput } from '@rpral/types';

const SEVERITY_ORDER: AlertSeverity[] = ['info', 'warning', 'critical'];

export async function upsertSubscription(
  client: SupabaseClient,
  input: UpsertSubscriptionInput,
): Promise<AlertSubscription> {
  const { data, error } = await client
    .from('alert_subscriptions')
    .upsert(
      {
        user_id: input.userId,
        expo_push_token: input.expoPushToken ?? null,
        phone_number: input.phoneNumber ?? null,
        preferred_locale: input.preferredLocale ?? 'en',
        subscribed_channels: input.subscribedChannels ?? 'both',
        severity_threshold: input.severityThreshold ?? 'info',
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to upsert subscription: ${error.message}`);
  return toSubscription(data);
}

export async function deactivateSubscription(
  client: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await client
    .from('alert_subscriptions')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to deactivate subscription: ${error.message}`);
}

/**
 * Return all active subscriptions eligible for an alert at the given severity.
 * Only subscriptions whose severity_threshold <= alertSeverity receive the alert.
 */
export async function getActiveSubscriptions(
  client: SupabaseClient,
  options?: { channel?: 'push' | 'sms' | 'both'; alertSeverity?: AlertSeverity },
): Promise<AlertSubscription[]> {
  let query = client
    .from('alert_subscriptions')
    .select('*')
    .eq('is_active', true);

  if (options?.channel && options.channel !== 'both') {
    query = query.in('subscribed_channels', [options.channel, 'both']);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch subscriptions: ${error.message}`);

  const rows = (data ?? []).map(toSubscription);

  // Filter by severity threshold client-side (enum ordering)
  if (options?.alertSeverity) {
    const alertLevel = SEVERITY_ORDER.indexOf(options.alertSeverity);
    return rows.filter(
      (s) => SEVERITY_ORDER.indexOf(s.severityThreshold) <= alertLevel,
    );
  }

  return rows;
}

export async function getSubscription(
  client: SupabaseClient,
  userId: string,
): Promise<AlertSubscription | null> {
  const { data, error } = await client
    .from('alert_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error?.code === 'PGRST116') return null; // no rows
  if (error) throw new Error(`Failed to fetch subscription: ${error.message}`);
  return toSubscription(data);
}

function toSubscription(row: Record<string, unknown>): AlertSubscription {
  return {
    id: row['id'] as string,
    userId: row['user_id'] as string,
    expoPushToken: (row['expo_push_token'] as string | null) ?? null,
    phoneNumber: (row['phone_number'] as string | null) ?? null,
    preferredLocale: row['preferred_locale'] as AlertLocale,
    subscribedChannels: row['subscribed_channels'] as AlertChannel,
    severityThreshold: row['severity_threshold'] as AlertSeverity,
    isActive: row['is_active'] as boolean,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };
}

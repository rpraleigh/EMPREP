import type { SupabaseClient } from '@supabase/supabase-js';
import type { FollowUpPlan, UpsertFollowUpPlanInput, FollowUpInterval } from '@rpral/types';

const INTERVAL_MONTHS: Record<FollowUpInterval, number> = {
  monthly:   1,
  quarterly: 3,
  biannual:  6,
  annual:    12,
};

function toFollowUpPlan(row: Record<string, unknown>): FollowUpPlan {
  return {
    id:              row['id']               as string,
    customerId:      row['customer_id']      as string,
    interval:        row['interval']         as FollowUpInterval,
    lastVisitAt:     (row['last_visit_at']   as string | null) ?? null,
    nextScheduledAt: (row['next_scheduled_at'] as string | null) ?? null,
    isActive:        (row['is_active']       as boolean) ?? true,
    createdAt:       row['created_at']       as string,
    updatedAt:       row['updated_at']       as string,
  };
}

function computeNextDate(from: Date, interval: FollowUpInterval): string {
  const next = new Date(from);
  next.setMonth(next.getMonth() + INTERVAL_MONTHS[interval]);
  return next.toISOString();
}

export async function upsertFollowUpPlan(
  client: SupabaseClient,
  input: UpsertFollowUpPlanInput,
): Promise<FollowUpPlan> {
  const nextScheduledAt = computeNextDate(new Date(), input.interval);

  const { data, error } = await client
    .from('follow_up_plans')
    .upsert(
      {
        customer_id:       input.customerId,
        interval:          input.interval,
        is_active:         input.isActive ?? true,
        next_scheduled_at: nextScheduledAt,
        updated_at:        new Date().toISOString(),
      },
      { onConflict: 'customer_id' },
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to upsert follow-up plan: ${error.message}`);
  return toFollowUpPlan(data as Record<string, unknown>);
}

export async function getFollowUpPlan(
  client: SupabaseClient,
  customerId: string,
): Promise<FollowUpPlan | null> {
  const { data, error } = await client
    .from('follow_up_plans')
    .select('*')
    .eq('customer_id', customerId)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch follow-up plan: ${error.message}`);
  return data ? toFollowUpPlan(data as Record<string, unknown>) : null;
}

/** Called after a completed visit to advance the next scheduled date. */
export async function recordVisitAndAdvancePlan(
  client: SupabaseClient,
  customerId: string,
  visitedAt: Date,
): Promise<FollowUpPlan | null> {
  const plan = await getFollowUpPlan(client, customerId);
  if (!plan || !plan.isActive) return plan;

  const nextScheduledAt = computeNextDate(visitedAt, plan.interval);

  const { data, error } = await client
    .from('follow_up_plans')
    .update({
      last_visit_at:     visitedAt.toISOString(),
      next_scheduled_at: nextScheduledAt,
      updated_at:        new Date().toISOString(),
    })
    .eq('customer_id', customerId)
    .select()
    .single();

  if (error) throw new Error(`Failed to advance follow-up plan: ${error.message}`);
  return toFollowUpPlan(data as Record<string, unknown>);
}

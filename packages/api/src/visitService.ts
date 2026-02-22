import type { SupabaseClient } from '@supabase/supabase-js';
import type { VisitRecord, VisitSupplyAction, CreateVisitRecordInput } from '@rpral/types';
import type { FollowUpInterval } from '@rpral/types';

function toVisitRecord(row: Record<string, unknown>): VisitRecord {
  return {
    id:               row['id']                as string,
    appointmentId:    row['appointment_id']    as string,
    employeeId:       row['employee_id']       as string,
    summary:          (row['summary']          as string | null) ?? null,
    recommendations:  (row['recommendations']  as string | null) ?? null,
    followUpNeeded:   (row['follow_up_needed'] as boolean) ?? false,
    followUpInterval: (row['follow_up_interval'] as FollowUpInterval | null) ?? null,
    completedAt:      row['completed_at']      as string,
    createdAt:        row['created_at']        as string,
  };
}

function toVisitSupplyAction(row: Record<string, unknown>): VisitSupplyAction {
  return {
    id:            row['id']              as string,
    visitRecordId: row['visit_record_id'] as string,
    supplyItemId:  row['supply_item_id']  as string,
    action:        row['action']          as VisitSupplyAction['action'],
    quantity:      row['quantity']        as number,
    condition:     (row['condition']      as string | null) ?? null,
    notes:         (row['notes']          as string | null) ?? null,
    createdAt:     row['created_at']      as string,
  };
}

export async function createVisitRecord(
  client: SupabaseClient,
  input: CreateVisitRecordInput,
): Promise<VisitRecord> {
  // Insert the visit record
  const { data: visitData, error: visitError } = await client
    .from('visit_records')
    .insert({
      appointment_id:    input.appointmentId,
      employee_id:       input.employeeId,
      summary:           input.summary          ?? null,
      recommendations:   input.recommendations  ?? null,
      follow_up_needed:  input.followUpNeeded,
      follow_up_interval: input.followUpInterval ?? null,
    })
    .select()
    .single();

  if (visitError) throw new Error(`Failed to create visit record: ${visitError.message}`);
  const visitRecord = toVisitRecord(visitData as Record<string, unknown>);

  // Insert supply actions
  if (input.supplyActions.length > 0) {
    const { error: actionsError } = await client
      .from('visit_supply_actions')
      .insert(
        input.supplyActions.map((a) => ({
          visit_record_id: visitRecord.id,
          supply_item_id:  a.supplyItemId,
          action:          a.action,
          quantity:        a.quantity,
          condition:       a.condition ?? null,
          notes:           a.notes    ?? null,
        })),
      );
    if (actionsError) throw new Error(`Failed to create supply actions: ${actionsError.message}`);
  }

  return visitRecord;
}

export async function getVisitRecord(
  client: SupabaseClient,
  appointmentId: string,
): Promise<VisitRecord | null> {
  const { data, error } = await client
    .from('visit_records')
    .select('*')
    .eq('appointment_id', appointmentId)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch visit record: ${error.message}`);
  return data ? toVisitRecord(data as Record<string, unknown>) : null;
}

export async function getVisitSupplyActions(
  client: SupabaseClient,
  visitRecordId: string,
): Promise<VisitSupplyAction[]> {
  const { data, error } = await client
    .from('visit_supply_actions')
    .select('*')
    .eq('visit_record_id', visitRecordId)
    .order('created_at');
  if (error) throw new Error(`Failed to fetch supply actions: ${error.message}`);
  return (data ?? []).map((r) => toVisitSupplyAction(r as Record<string, unknown>));
}

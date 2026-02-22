import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Appointment,
  CreateAppointmentInput,
  AssignAppointmentInput,
  AppointmentStatus,
} from '@rpral/types';

function toAppointment(row: Record<string, unknown>): Appointment {
  return {
    id:            row['id']             as string,
    customerId:    row['customer_id']    as string,
    employeeId:    (row['employee_id']   as string | null) ?? null,
    type:          row['type']           as Appointment['type'],
    status:        row['status']         as AppointmentStatus,
    scheduledAt:   (row['scheduled_at']  as string | null) ?? null,
    completedAt:   (row['completed_at']  as string | null) ?? null,
    customerNotes: (row['customer_notes'] as string | null) ?? null,
    adminNotes:    (row['admin_notes']   as string | null) ?? null,
    createdAt:     row['created_at']     as string,
    updatedAt:     row['updated_at']     as string,
  };
}

export async function createAppointment(
  client: SupabaseClient,
  input: CreateAppointmentInput,
): Promise<Appointment> {
  const { data, error } = await client
    .from('appointments')
    .insert({
      customer_id:    input.customerId,
      type:           input.type,
      status:         'requested',
      scheduled_at:   input.scheduledAt    ?? null,
      customer_notes: input.customerNotes  ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create appointment: ${error.message}`);
  return toAppointment(data as Record<string, unknown>);
}

export async function assignAppointment(
  client: SupabaseClient,
  input: AssignAppointmentInput,
): Promise<Appointment> {
  const { data, error } = await client
    .from('appointments')
    .update({
      employee_id:  input.employeeId,
      status:       'confirmed',
      ...(input.scheduledAt !== undefined && { scheduled_at: input.scheduledAt }),
      ...(input.adminNotes  !== undefined && { admin_notes:  input.adminNotes }),
      updated_at:   new Date().toISOString(),
    })
    .eq('id', input.appointmentId)
    .select()
    .single();
  if (error) throw new Error(`Failed to assign appointment: ${error.message}`);
  return toAppointment(data as Record<string, unknown>);
}

export async function updateAppointmentStatus(
  client: SupabaseClient,
  id: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === 'completed') updates['completed_at'] = new Date().toISOString();

  const { data, error } = await client
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update appointment status: ${error.message}`);
  return toAppointment(data as Record<string, unknown>);
}

export async function getAppointment(
  client: SupabaseClient,
  id: string,
): Promise<Appointment | null> {
  const { data, error } = await client
    .from('appointments')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch appointment: ${error.message}`);
  return data ? toAppointment(data as Record<string, unknown>) : null;
}

export async function listAppointments(
  client: SupabaseClient,
  options?: {
    customerId?:  string;
    employeeId?:  string;
    status?:      AppointmentStatus;
    limit?:       number;
  },
): Promise<Appointment[]> {
  let query = client.from('appointments').select('*');

  if (options?.customerId) query = query.eq('customer_id', options.customerId);
  if (options?.employeeId) query = query.eq('employee_id', options.employeeId);
  if (options?.status)     query = query.eq('status', options.status);

  query = query
    .order('scheduled_at', { ascending: true, nullsFirst: false })
    .limit(options?.limit ?? 100);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list appointments: ${error.message}`);
  return (data ?? []).map((r) => toAppointment(r as Record<string, unknown>));
}

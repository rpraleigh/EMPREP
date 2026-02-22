import type { SupabaseClient } from '@supabase/supabase-js';
import type { Employee, CreateEmployeeInput } from '@rpral/types';

function toEmployee(row: Record<string, unknown>): Employee {
  return {
    id:        row['id']         as string,
    userId:    row['user_id']    as string,
    fullName:  row['full_name']  as string,
    email:     row['email']      as string,
    phone:     (row['phone']     as string | null) ?? null,
    isActive:  (row['is_active'] as boolean) ?? true,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };
}

export async function listEmployees(
  client: SupabaseClient,
  options?: { includeInactive?: boolean },
): Promise<Employee[]> {
  let query = client.from('employees').select('*');
  if (!options?.includeInactive) query = query.eq('is_active', true);
  query = query.order('full_name');
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list employees: ${error.message}`);
  return (data ?? []).map((r) => toEmployee(r as Record<string, unknown>));
}

export async function getEmployee(
  client: SupabaseClient,
  id: string,
): Promise<Employee | null> {
  const { data, error } = await client
    .from('employees')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch employee: ${error.message}`);
  return data ? toEmployee(data as Record<string, unknown>) : null;
}

export async function getEmployeeByUserId(
  client: SupabaseClient,
  userId: string,
): Promise<Employee | null> {
  const { data, error } = await client
    .from('employees')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch employee by user: ${error.message}`);
  return data ? toEmployee(data as Record<string, unknown>) : null;
}

export async function createEmployee(
  client: SupabaseClient,
  input: CreateEmployeeInput,
): Promise<Employee> {
  const { data, error } = await client
    .from('employees')
    .insert({
      user_id:   input.userId,
      full_name: input.fullName,
      email:     input.email,
      phone:     input.phone ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create employee: ${error.message}`);
  return toEmployee(data as Record<string, unknown>);
}

export async function setEmployeeActive(
  client: SupabaseClient,
  id: string,
  isActive: boolean,
): Promise<Employee> {
  const { data, error } = await client
    .from('employees')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update employee: ${error.message}`);
  return toEmployee(data as Record<string, unknown>);
}

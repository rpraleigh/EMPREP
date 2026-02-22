import type { SupabaseClient } from '@supabase/supabase-js';
import type { CustomerProfile, CreateCustomerInput, UpdateCustomerInput } from '@rpral/types';

function toCustomer(row: Record<string, unknown>): CustomerProfile {
  return {
    id:               row['id']                as string,
    userId:           row['user_id']           as string,
    fullName:         row['full_name']         as string,
    email:            row['email']             as string,
    phone:            (row['phone']            as string | null) ?? null,
    addressLine1:     (row['address_line1']    as string | null) ?? null,
    addressLine2:     (row['address_line2']    as string | null) ?? null,
    city:             (row['city']             as string | null) ?? null,
    state:            (row['state']            as string | null) ?? null,
    zip:              (row['zip']              as string | null) ?? null,
    householdSize:    (row['household_size']   as number)        ?? 1,
    hasPets:          (row['has_pets']         as boolean)       ?? false,
    specialNeeds:     (row['special_needs']    as string | null) ?? null,
    stripeCustomerId: (row['stripe_customer_id'] as string | null) ?? null,
    createdAt:        row['created_at']        as string,
    updatedAt:        row['updated_at']        as string,
  };
}

export async function createCustomerProfile(
  client: SupabaseClient,
  input: CreateCustomerInput,
): Promise<CustomerProfile> {
  const { data, error } = await client
    .from('customer_profiles')
    .insert({
      user_id:        input.userId,
      full_name:      input.fullName,
      email:          input.email,
      phone:          input.phone          ?? null,
      address_line1:  input.addressLine1   ?? null,
      address_line2:  input.addressLine2   ?? null,
      city:           input.city           ?? null,
      state:          input.state          ?? null,
      zip:            input.zip            ?? null,
      household_size: input.householdSize  ?? 1,
      has_pets:       input.hasPets        ?? false,
      special_needs:  input.specialNeeds   ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create customer profile: ${error.message}`);
  return toCustomer(data as Record<string, unknown>);
}

export async function updateCustomerProfile(
  client: SupabaseClient,
  id: string,
  input: UpdateCustomerInput,
): Promise<CustomerProfile> {
  const { data, error } = await client
    .from('customer_profiles')
    .update({
      ...(input.fullName     !== undefined && { full_name:     input.fullName }),
      ...(input.email        !== undefined && { email:         input.email }),
      ...(input.phone        !== undefined && { phone:         input.phone }),
      ...(input.addressLine1 !== undefined && { address_line1: input.addressLine1 }),
      ...(input.addressLine2 !== undefined && { address_line2: input.addressLine2 }),
      ...(input.city         !== undefined && { city:          input.city }),
      ...(input.state        !== undefined && { state:         input.state }),
      ...(input.zip          !== undefined && { zip:           input.zip }),
      ...(input.householdSize !== undefined && { household_size: input.householdSize }),
      ...(input.hasPets      !== undefined && { has_pets:      input.hasPets }),
      ...(input.specialNeeds !== undefined && { special_needs: input.specialNeeds }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update customer profile: ${error.message}`);
  return toCustomer(data as Record<string, unknown>);
}

export async function getCustomerProfile(
  client: SupabaseClient,
  userId: string,
): Promise<CustomerProfile | null> {
  const { data, error } = await client
    .from('customer_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch customer profile: ${error.message}`);
  return data ? toCustomer(data as Record<string, unknown>) : null;
}

export async function getCustomerById(
  client: SupabaseClient,
  id: string,
): Promise<CustomerProfile | null> {
  const { data, error } = await client
    .from('customer_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch customer: ${error.message}`);
  return data ? toCustomer(data as Record<string, unknown>) : null;
}

export async function listCustomers(
  client: SupabaseClient,
  options?: { limit?: number; offset?: number; search?: string },
): Promise<CustomerProfile[]> {
  let query = client.from('customer_profiles').select('*');

  if (options?.search) {
    query = query.or(
      `full_name.ilike.%${options.search}%,email.ilike.%${options.search}%`,
    );
  }

  query = query
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 50);

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list customers: ${error.message}`);
  return (data ?? []).map((r) => toCustomer(r as Record<string, unknown>));
}

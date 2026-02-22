import type { SupabaseClient } from '@supabase/supabase-js';
import type { CustomerSupply, UpsertCustomerSupplyInput } from '@rpral/types';

function toCustomerSupply(row: Record<string, unknown>): CustomerSupply {
  return {
    id:           row['id']             as string,
    customerId:   row['customer_id']    as string,
    supplyItemId: row['supply_item_id'] as string,
    quantity:     row['quantity']       as number,
    purchasedAt:  (row['purchased_at']  as string | null) ?? null,
    expiresAt:    (row['expires_at']    as string | null) ?? null,
    notes:        (row['notes']         as string | null) ?? null,
    createdAt:    row['created_at']     as string,
    updatedAt:    row['updated_at']     as string,
  };
}

export async function getCustomerSupplies(
  client: SupabaseClient,
  customerId: string,
): Promise<CustomerSupply[]> {
  const { data, error } = await client
    .from('customer_supplies')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at');
  if (error) throw new Error(`Failed to fetch customer supplies: ${error.message}`);
  return (data ?? []).map((r) => toCustomerSupply(r as Record<string, unknown>));
}

export async function upsertCustomerSupply(
  client: SupabaseClient,
  input: UpsertCustomerSupplyInput,
): Promise<CustomerSupply> {
  const { data, error } = await client
    .from('customer_supplies')
    .upsert(
      {
        customer_id:   input.customerId,
        supply_item_id: input.supplyItemId,
        quantity:       input.quantity,
        purchased_at:  input.purchasedAt ?? null,
        expires_at:    input.expiresAt   ?? null,
        notes:         input.notes       ?? null,
        updated_at:    new Date().toISOString(),
      },
      { onConflict: 'customer_id,supply_item_id' },
    )
    .select()
    .single();
  if (error) throw new Error(`Failed to upsert customer supply: ${error.message}`);
  return toCustomerSupply(data as Record<string, unknown>);
}

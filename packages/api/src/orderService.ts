import type { SupabaseClient } from '@supabase/supabase-js';
import type { Order, OrderItem, CreateOrderInput, OrderStatus } from '@rpral/types';

function toOrder(row: Record<string, unknown>): Order {
  return {
    id:                    row['id']                       as string,
    customerId:            row['customer_id']              as string,
    status:                row['status']                   as OrderStatus,
    subtotalCents:         row['subtotal_cents']           as number,
    taxCents:              row['tax_cents']                as number,
    totalCents:            row['total_cents']              as number,
    stripePaymentIntentId: (row['stripe_payment_intent_id'] as string | null) ?? null,
    shippingAddress:       (row['shipping_address'] as Order['shippingAddress']) ?? null,
    notes:                 (row['notes']                   as string | null) ?? null,
    createdAt:             row['created_at']               as string,
    updatedAt:             row['updated_at']               as string,
  };
}

function toOrderItem(row: Record<string, unknown>): OrderItem {
  return {
    id:             row['id']             as string,
    orderId:        row['order_id']       as string,
    supplyItemId:   row['supply_item_id'] as string,
    quantity:       row['quantity']       as number,
    unitPriceCents: row['unit_price_cents'] as number,
    createdAt:      row['created_at']     as string,
  };
}

export async function createOrder(
  client: SupabaseClient,
  input: CreateOrderInput,
  itemPrices: Map<string, number>,
): Promise<Order> {
  const subtotalCents = input.items.reduce((sum, line) => {
    const price = itemPrices.get(line.supplyItemId) ?? 0;
    return sum + price * line.quantity;
  }, 0);
  const taxCents   = Math.round(subtotalCents * 0.08); // 8% tax — adjust as needed
  const totalCents = subtotalCents + taxCents;

  const { data: orderData, error: orderError } = await client
    .from('orders')
    .insert({
      customer_id:      input.customerId,
      status:           'pending',
      subtotal_cents:   subtotalCents,
      tax_cents:        taxCents,
      total_cents:      totalCents,
      shipping_address: input.shippingAddress ?? null,
      notes:            input.notes           ?? null,
    })
    .select()
    .single();

  if (orderError) throw new Error(`Failed to create order: ${orderError.message}`);
  const order = toOrder(orderData as Record<string, unknown>);

  const { error: itemsError } = await client
    .from('order_items')
    .insert(
      input.items.map((line) => ({
        order_id:        order.id,
        supply_item_id:  line.supplyItemId,
        quantity:        line.quantity,
        unit_price_cents: itemPrices.get(line.supplyItemId) ?? 0,
      })),
    );

  if (itemsError) throw new Error(`Failed to create order items: ${itemsError.message}`);
  return order;
}

export async function getOrder(
  client: SupabaseClient,
  id: string,
): Promise<Order | null> {
  const { data, error } = await client
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch order: ${error.message}`);
  return data ? toOrder(data as Record<string, unknown>) : null;
}

export async function getOrderItems(
  client: SupabaseClient,
  orderId: string,
): Promise<OrderItem[]> {
  const { data, error } = await client
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);
  if (error) throw new Error(`Failed to fetch order items: ${error.message}`);
  return (data ?? []).map((r) => toOrderItem(r as Record<string, unknown>));
}

export async function listOrders(
  client: SupabaseClient,
  options?: { customerId?: string; status?: OrderStatus; limit?: number },
): Promise<Order[]> {
  let query = client.from('orders').select('*');
  if (options?.customerId) query = query.eq('customer_id', options.customerId);
  if (options?.status)     query = query.eq('status', options.status);
  query = query.order('created_at', { ascending: false }).limit(options?.limit ?? 50);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list orders: ${error.message}`);
  return (data ?? []).map((r) => toOrder(r as Record<string, unknown>));
}

export async function updateOrderStatus(
  client: SupabaseClient,
  id: string,
  status: OrderStatus,
  stripePaymentIntentId?: string,
): Promise<Order> {
  const { data, error } = await client
    .from('orders')
    .update({
      status,
      ...(stripePaymentIntentId !== undefined && {
        stripe_payment_intent_id: stripePaymentIntentId,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update order status: ${error.message}`);
  return toOrder(data as Record<string, unknown>);
}

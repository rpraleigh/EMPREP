import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SupplyCategory,
  SupplyItem,
  KitContent,
  KitWithContents,
  CreateSupplyItemInput,
  UpdateSupplyItemInput,
} from '@rpral/types';

function toCategory(row: Record<string, unknown>): SupplyCategory {
  return {
    id:          row['id']          as string,
    name:        row['name']        as string,
    slug:        row['slug']        as string,
    description: (row['description'] as string | null) ?? null,
    sortOrder:   (row['sort_order'] as number) ?? 0,
    createdAt:   row['created_at']  as string,
  };
}

function toItem(row: Record<string, unknown>): SupplyItem {
  return {
    id:              row['id']               as string,
    categoryId:      (row['category_id']     as string | null) ?? null,
    name:            row['name']             as string,
    description:     (row['description']     as string | null) ?? null,
    sku:             (row['sku']             as string | null) ?? null,
    unit:            (row['unit']            as string) ?? 'each',
    priceCents:      row['price_cents']      as number,
    shelfLifeMonths: (row['shelf_life_months'] as number | null) ?? null,
    isKit:           (row['is_kit']          as boolean) ?? false,
    isActive:        (row['is_active']       as boolean) ?? true,
    imageUrl:        (row['image_url']       as string | null) ?? null,
    createdAt:       row['created_at']       as string,
    updatedAt:       row['updated_at']       as string,
  };
}

function toKitContent(row: Record<string, unknown>): KitContent {
  return {
    id:       row['id']      as string,
    kitId:    row['kit_id']  as string,
    itemId:   row['item_id'] as string,
    quantity: row['quantity'] as number,
  };
}

export async function listCategories(client: SupabaseClient): Promise<SupplyCategory[]> {
  const { data, error } = await client
    .from('supply_categories')
    .select('*')
    .order('sort_order');
  if (error) throw new Error(`Failed to list categories: ${error.message}`);
  return (data ?? []).map((r) => toCategory(r as Record<string, unknown>));
}

export async function listItems(
  client: SupabaseClient,
  options?: { categoryId?: string; kitsOnly?: boolean; includeInactive?: boolean },
): Promise<SupplyItem[]> {
  let query = client.from('supply_items').select('*');

  if (!options?.includeInactive) query = query.eq('is_active', true);
  if (options?.categoryId)       query = query.eq('category_id', options.categoryId);
  if (options?.kitsOnly)         query = query.eq('is_kit', true);

  query = query.order('name');
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list items: ${error.message}`);
  return (data ?? []).map((r) => toItem(r as Record<string, unknown>));
}

export async function getItem(
  client: SupabaseClient,
  id: string,
): Promise<SupplyItem | null> {
  const { data, error } = await client
    .from('supply_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch item: ${error.message}`);
  return data ? toItem(data as Record<string, unknown>) : null;
}

export async function getKitWithContents(
  client: SupabaseClient,
  kitId: string,
): Promise<KitWithContents | null> {
  const { data: kitData, error: kitError } = await client
    .from('supply_items')
    .select('*')
    .eq('id', kitId)
    .eq('is_kit', true)
    .maybeSingle();

  if (kitError) throw new Error(`Failed to fetch kit: ${kitError.message}`);
  if (!kitData) return null;

  const { data: contentsData, error: contentsError } = await client
    .from('kit_contents')
    .select('*, item:supply_items(*)')
    .eq('kit_id', kitId);

  if (contentsError) throw new Error(`Failed to fetch kit contents: ${contentsError.message}`);

  const kit = toItem(kitData as Record<string, unknown>);
  const contents = (contentsData ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      ...toKitContent(row),
      item: toItem(row['item'] as Record<string, unknown>),
    };
  });

  return { ...kit, contents };
}

export async function createSupplyItem(
  client: SupabaseClient,
  input: CreateSupplyItemInput,
): Promise<SupplyItem> {
  const { data, error } = await client
    .from('supply_items')
    .insert({
      category_id:       input.categoryId      ?? null,
      name:              input.name,
      description:       input.description     ?? null,
      sku:               input.sku             ?? null,
      unit:              input.unit            ?? 'each',
      price_cents:       input.priceCents,
      shelf_life_months: input.shelfLifeMonths ?? null,
      is_kit:            input.isKit           ?? false,
      image_url:         input.imageUrl        ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create item: ${error.message}`);
  return toItem(data as Record<string, unknown>);
}

export async function updateSupplyItem(
  client: SupabaseClient,
  id: string,
  input: UpdateSupplyItemInput,
): Promise<SupplyItem> {
  const { data, error } = await client
    .from('supply_items')
    .update({
      ...(input.categoryId      !== undefined && { category_id:       input.categoryId }),
      ...(input.name            !== undefined && { name:              input.name }),
      ...(input.description     !== undefined && { description:       input.description }),
      ...(input.sku             !== undefined && { sku:               input.sku }),
      ...(input.unit            !== undefined && { unit:              input.unit }),
      ...(input.priceCents      !== undefined && { price_cents:       input.priceCents }),
      ...(input.shelfLifeMonths !== undefined && { shelf_life_months: input.shelfLifeMonths }),
      ...(input.isActive        !== undefined && { is_active:         input.isActive }),
      ...(input.imageUrl        !== undefined && { image_url:         input.imageUrl }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update item: ${error.message}`);
  return toItem(data as Record<string, unknown>);
}

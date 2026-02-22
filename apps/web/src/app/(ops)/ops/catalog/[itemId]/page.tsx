import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getItem, listCategories, updateSupplyItem } from '@rpral/api';
import Link from 'next/link';

export default async function EditCatalogItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = (user.app_metadata as Record<string, unknown>)?.['user_role'];
  if (role !== 'admin') redirect('/ops/dashboard');

  const [item, categories] = await Promise.all([
    getItem(supabase, itemId),
    listCategories(supabase),
  ]);
  if (!item) notFound();

  async function saveItem(formData: FormData) {
    'use server';
    const s = await createClient();
    const priceDollars  = parseFloat((formData.get('price')         as string) || '0');
    const shelfLifeRaw  = formData.get('shelfLifeMonths') as string;
    const categoryIdRaw = formData.get('categoryId')     as string;
    const descRaw       = formData.get('description')   as string;
    const skuRaw        = formData.get('sku')           as string;
    await updateSupplyItem(s, itemId, {
      name:       (formData.get('name') as string).trim(),
      unit:       (formData.get('unit') as string) || 'each',
      priceCents: Math.round(priceDollars * 100),
      isActive:   formData.get('isActive') === 'on',
      ...(descRaw       ? { description:     descRaw }                     : {}),
      ...(skuRaw        ? { sku:             skuRaw }                      : {}),
      ...(shelfLifeRaw  ? { shelfLifeMonths: parseInt(shelfLifeRaw, 10) }  : {}),
      ...(categoryIdRaw ? { categoryId:      categoryIdRaw }               : {}),
    });
    redirect(`/ops/catalog/${itemId}`);
  }

  const priceDisplay = (item.priceCents / 100).toFixed(2);

  return (
    <div className="max-w-xl">
      <Link href="/ops/catalog" className="text-xs text-gray-500 hover:text-gray-300 mb-4 inline-block">
        ← Catalog
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">{item.name}</h1>
        {item.isKit && (
          <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">Kit</span>
        )}
        {!item.isActive && (
          <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">Inactive</span>
        )}
      </div>

      <form action={saveItem}>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
          <Field label="Name *">
            <input
              type="text"
              name="name"
              required
              defaultValue={item.name}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
            />
          </Field>

          <Field label="Description">
            <textarea
              name="description"
              rows={2}
              defaultValue={item.description ?? ''}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="SKU">
              <input
                type="text"
                name="sku"
                defaultValue={item.sku ?? ''}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              />
            </Field>
            <Field label="Unit">
              <input
                type="text"
                name="unit"
                defaultValue={item.unit}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Price ($) *">
              <input
                type="number"
                name="price"
                required
                min={0}
                step={0.01}
                defaultValue={priceDisplay}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              />
            </Field>
            <Field label="Shelf Life (months)">
              <input
                type="number"
                name="shelfLifeMonths"
                min={1}
                defaultValue={item.shelfLifeMonths ?? ''}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              />
            </Field>
          </div>

          <Field label="Category">
            <select
              name="categoryId"
              defaultValue={item.categoryId ?? ''}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">— none —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={item.isActive}
              className="accent-blue-500 w-4 h-4"
            />
            <span className="text-sm text-gray-300">Active (visible in customer catalog)</span>
          </label>
        </div>

        <button
          type="submit"
          className="mt-4 w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

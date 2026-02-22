import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { listCategories, createSupplyItem } from '@rpral/api';
import Link from 'next/link';

export default async function NewCatalogItemPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = (user.app_metadata as Record<string, unknown>)?.['user_role'];
  if (role !== 'admin') redirect('/ops/dashboard');

  const categories = await listCategories(supabase);

  async function createItem(formData: FormData) {
    'use server';
    const s = await createClient();
    const priceDollars   = parseFloat((formData.get('price')         as string) || '0');
    const shelfLifeRaw   = formData.get('shelfLifeMonths') as string;
    const categoryIdRaw  = formData.get('categoryId')     as string;
    const item = await createSupplyItem(s, {
      name:             (formData.get('name')        as string).trim(),
      ...(formData.get('description') ? { description: formData.get('description') as string } : {}),
      ...(formData.get('sku')         ? { sku:         formData.get('sku')         as string } : {}),
      unit:             (formData.get('unit')        as string) || 'each',
      priceCents:       Math.round(priceDollars * 100),
      ...(shelfLifeRaw  ? { shelfLifeMonths: parseInt(shelfLifeRaw, 10) }  : {}),
      ...(categoryIdRaw ? { categoryId:      categoryIdRaw }               : {}),
      isKit:            formData.get('isKit') === 'on',
    });
    redirect(`/ops/catalog/${item.id}`);
  }

  return (
    <div className="max-w-xl">
      <Link href="/ops/catalog" className="text-xs text-gray-500 hover:text-gray-300 mb-4 inline-block">
        ← Catalog
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">New Item</h1>

      <form action={createItem}>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
          <Field label="Name *">
            <input
              type="text"
              name="name"
              required
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
            />
          </Field>

          <Field label="Description">
            <textarea
              name="description"
              rows={2}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="SKU">
              <input
                type="text"
                name="sku"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              />
            </Field>
            <Field label="Unit">
              <input
                type="text"
                name="unit"
                defaultValue="each"
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
                placeholder="0.00"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              />
            </Field>
            <Field label="Shelf Life (months)">
              <input
                type="number"
                name="shelfLifeMonths"
                min={1}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              />
            </Field>
          </div>

          <Field label="Category">
            <select
              name="categoryId"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">— none —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="isKit" className="accent-blue-500 w-4 h-4" />
            <span className="text-sm text-gray-300">This is a kit (bundle of other items)</span>
          </label>
        </div>

        <button
          type="submit"
          className="mt-4 w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Create Item
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

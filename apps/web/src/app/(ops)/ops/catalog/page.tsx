import { createClient } from '@/lib/supabase-server';
import { listCategories, listItems } from '@rpral/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';

function fmtCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function OpsCatalogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = (user.app_metadata as Record<string, unknown>)?.['user_role'];
  if (role !== 'admin') redirect('/ops/dashboard');

  const [categories, items] = await Promise.all([
    listCategories(supabase),
    listItems(supabase, { includeInactive: true }),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const byCategory  = new Map<string | null, typeof items>();

  for (const item of items) {
    const key = item.categoryId ?? null;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(item);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Catalog</h1>
        <Link
          href="/ops/catalog/new"
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          + New Item
        </Link>
      </div>

      <div className="space-y-8">
        {/* Uncategorized first if present */}
        {byCategory.has(null) && (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Uncategorized</h2>
            <ItemTable items={byCategory.get(null)!} />
          </section>
        )}

        {categories.map((cat) => {
          const catItems = byCategory.get(cat.id);
          if (!catItems?.length) return null;
          return (
            <section key={cat.id}>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
                {cat.name}
              </h2>
              <ItemTable items={catItems} />
            </section>
          );
        })}
      </div>

      {items.length === 0 && (
        <p className="text-gray-500 text-sm">No items in catalog yet.</p>
      )}
    </div>
  );
}

function ItemTable({ items }: { items: Array<{
  id: string; name: string; sku: string | null; priceCents: number;
  shelfLifeMonths: number | null; isKit: boolean; isActive: boolean; unit: string;
}> }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-700/50">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/ops/catalog/${item.id}`}
          className="flex items-center justify-between px-5 py-4 hover:bg-gray-750 transition-colors"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white truncate">{item.name}</p>
              {item.isKit && (
                <span className="text-xs bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">Kit</span>
              )}
              {!item.isActive && (
                <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">Inactive</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {item.sku ? `SKU: ${item.sku} · ` : ''}
              {item.unit}
              {item.shelfLifeMonths ? ` · ${item.shelfLifeMonths}mo shelf life` : ''}
            </p>
          </div>
          <p className="text-sm font-semibold text-white shrink-0 ml-4">
            {`$${(item.priceCents / 100).toFixed(2)}`}
          </p>
        </Link>
      ))}
    </div>
  );
}

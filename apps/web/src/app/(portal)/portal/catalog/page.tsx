import { createClient } from '../../../lib/supabase-server';
import { listCategories, listItems } from '@rpral/api';
import Link from 'next/link';

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const [categories, items] = await Promise.all([
    listCategories(supabase),
    listItems(supabase, { ...(params.category ? { categoryId: params.category } : {}) }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Supply Catalog</h1>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href="/portal/catalog"
          className={`px-3 py-1.5 rounded-full text-sm font-medium border ${!params.category ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/portal/catalog?category=${cat.id}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${params.category === cat.id ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">No items found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/portal/catalog/${item.id}`}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 block"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-medium text-gray-900">{item.name}</p>
                {item.isKit && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Kit</span>
                )}
              </div>
              {item.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.description}</p>
              )}
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">${(item.priceCents / 100).toFixed(2)}</p>
                {item.shelfLifeMonths && (
                  <p className="text-xs text-gray-400">{item.shelfLifeMonths}mo shelf life</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import { createClient } from '@/lib/supabase-server';
import { listCategories, listItems } from '@rpral/api';
import Link from 'next/link';

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const supabase = await createClient();
  const params   = await searchParams;

  const [categories, items] = await Promise.all([
    listCategories(supabase),
    listItems(supabase, params.category ? { categoryId: params.category } : {}),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Supply Catalog</h1>

      {/* Category filter */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <Link
          href="/portal/catalog"
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            !params.category
              ? 'bg-red-600 text-white border-red-600'
              : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/portal/catalog?category=${cat.id}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              params.category === cat.id
                ? 'bg-red-600 text-white border-red-600'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
            }`}
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
              className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 hover:shadow transition-shadow block"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-gray-900 leading-snug">{item.name}</p>
                {item.isKit && (
                  <span className="shrink-0 ml-2 text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                    Kit
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{item.description}</p>
              )}
              <div className="flex items-end justify-between mt-auto">
                <p className="text-lg font-bold text-gray-900">
                  ${(item.priceCents / 100).toFixed(2)}
                </p>
                {item.shelfLifeMonths && (
                  <p className="text-xs text-gray-400">{item.shelfLifeMonths}-month shelf life</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

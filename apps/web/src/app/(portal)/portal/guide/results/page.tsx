import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { getCustomerProfile, listItems } from '@rpral/api';
import type { GuideResult, HazardProfile, RecommendedItem } from '@/lib/guide/types';
import BookAppointmentButton from './BookAppointmentButton';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const HAZARD_META: { key: keyof HazardProfile; label: string; icon: string }[] = [
  { key: 'flood',       label: 'Flood',        icon: '🌊' },
  { key: 'hurricane',   label: 'Hurricane',    icon: '🌀' },
  { key: 'wildfire',    label: 'Wildfire',     icon: '🔥' },
  { key: 'earthquake',  label: 'Earthquake',   icon: '🌍' },
  { key: 'tornado',     label: 'Tornado',      icon: '🌪️' },
  { key: 'winterStorm', label: 'Winter Storm', icon: '❄️' },
];

const PRIORITY_STYLE: Record<RecommendedItem['priority'], string> = {
  essential:   'bg-red-100 text-red-700',
  recommended: 'bg-amber-100 text-amber-700',
  optional:    'bg-gray-100 text-gray-500',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GuideResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ rec?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const profile = await getCustomerProfile(supabase, user.id);
  if (!profile) redirect('/portal/onboarding');

  const params = await searchParams;
  if (!params.rec) redirect('/portal/guide');

  let result: GuideResult;
  try {
    result = JSON.parse(atob(decodeURIComponent(params.rec))) as GuideResult;
  } catch (_) {
    redirect('/portal/guide');
  }

  // Fetch all items and filter by SKUs in the recommendation
  const allItems = await listItems(supabase, { includeInactive: false });
  const allKits  = await listItems(supabase, { kitsOnly: true });
  const allCatalog = [...allItems, ...allKits];

  const skuSet = new Set([result.primaryKit, ...result.items.map((i) => i.sku)]);
  const itemMap = new Map(
    allCatalog
      .filter((i) => i.sku !== null && skuSet.has(i.sku))
      .map((i) => [i.sku as string, i]),
  );

  const primaryKitItem = itemMap.get(result.primaryKit);
  const activeHazards = HAZARD_META.filter((h) => result.hazards[h.key] > 0);

  // Build appointment notes summary
  const bookingNotes = [
    `GUIDE ME recommendation — ${activeHazards.map((h) => h.label).join(', ') || 'General preparedness'}`,
    `Primary kit: ${primaryKitItem?.name ?? result.primaryKit}`,
    `Add-ons: ${result.items.map((i) => i.sku).join(', ')}`,
  ].join('\n');

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/portal/guide" className="text-sm text-gray-400 hover:text-gray-600">
          ← Start over
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Your Recommended Kit</h1>
        <p className="text-sm text-gray-500 mt-1">
          Based on your profile and local hazard data. Prices shown are current catalog rates.
        </p>
      </div>

      {/* Hazard pills */}
      {activeHazards.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">Local hazards factored in:</p>
          <div className="flex flex-wrap gap-2">
            {activeHazards.map((h) => {
              const level = result.hazards[h.key];
              return (
                <span
                  key={h.key}
                  className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full ${
                    level === 2 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {h.icon} {h.label} {level === 2 ? '(High)' : '(Moderate)'}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Book CTA — top */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-red-700 mb-1">Want expert help?</p>
        <p className="text-xs text-red-600 mb-4">
          Our technicians can assess your home in person, walk you through your kit, and ensure everything is set up correctly.
        </p>
        <BookAppointmentButton customerId={profile.id} notes={bookingNotes} />
      </div>

      {/* Primary Kit */}
      {primaryKitItem && (
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Foundation Kit</span>
              <h2 className="text-lg font-bold text-gray-900 mt-0.5">{primaryKitItem.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{primaryKitItem.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-bold text-gray-900">{fmtPrice(primaryKitItem.priceCents)}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href={`/portal/catalog/${primaryKitItem.id}`}
              className="text-sm text-red-600 hover:underline font-medium"
            >
              View in catalog →
            </Link>
          </div>
        </section>
      )}

      {/* Add-on items */}
      {result.items.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Recommended Add-ons
          </h2>
          <div className="space-y-3">
            {result.items.map((rec) => {
              const item = itemMap.get(rec.sku);
              return (
                <div key={rec.sku} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">
                          {item?.name ?? rec.name}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLE[rec.priority]}`}>
                          {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{rec.reason}</p>
                    </div>
                    {item && (
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900">{fmtPrice(item.priceCents)}</p>
                      </div>
                    )}
                  </div>
                  {item && (
                    <div className="mt-2">
                      <Link
                        href={`/portal/catalog/${item.id}`}
                        className="text-xs text-red-600 hover:underline"
                      >
                        View in catalog →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Notes */}
      {result.notes.length > 0 && (
        <section className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-2">
          <h2 className="text-sm font-semibold text-blue-800">Additional Notes for Your Household</h2>
          <ul className="space-y-1">
            {result.notes.map((note, i) => (
              <li key={i} className="text-xs text-blue-700 flex gap-2">
                <span className="shrink-0 mt-0.5">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Book CTA — bottom */}
      <div className="pb-4">
        <BookAppointmentButton customerId={profile.id} notes={bookingNotes} />
        <div className="mt-4 text-center">
          <Link href="/portal/catalog" className="text-sm text-gray-400 hover:text-gray-600 hover:underline">
            Browse full catalog
          </Link>
        </div>
      </div>
    </div>
  );
}

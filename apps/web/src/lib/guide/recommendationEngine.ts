import type { GuideInput, GuideResult, HazardProfile, RecommendedItem } from './types';

type Priority = RecommendedItem['priority'];
const PRIORITY_RANK: Record<Priority, number> = { essential: 2, recommended: 1, optional: 0 };

// ─── Internal accumulator ─────────────────────────────────────────────────────

interface Candidate {
  sku:      string;
  name:     string;
  reason:   string;
  priority: Priority;
}

function add(
  acc: Map<string, Candidate>,
  sku: string,
  name: string,
  reason: string,
  priority: Priority,
) {
  const existing = acc.get(sku);
  if (!existing || PRIORITY_RANK[priority] > PRIORITY_RANK[existing.priority]) {
    acc.set(sku, { sku, name, reason, priority });
  }
}

function elevate(acc: Map<string, Candidate>, skuPrefix: string, toPriority: Priority) {
  for (const [sku, item] of acc.entries()) {
    if (sku.startsWith(skuPrefix) && PRIORITY_RANK[toPriority] > PRIORITY_RANK[item.priority]) {
      acc.set(sku, { ...item, priority: toPriority });
    }
  }
}

// ─── Main function ────────────────────────────────────────────────────────────

export function buildRecommendation(input: GuideInput): GuideResult {
  const { profile, hazards, shelterDuration, budgetTier, hasCommPlan } = input;
  const acc = new Map<string, Candidate>();
  const notes: string[] = [];

  // ── Pass 1: Base Kit ──────────────────────────────────────────────────────

  const primaryKit =
    profile.householdSize >= 3 || (shelterDuration && shelterDuration !== '72hr')
      ? 'KIT-FAMILY4'
      : 'KIT-72HR';

  // ── Pass 2: Hazard Additions ──────────────────────────────────────────────

  if (hazards.flood >= 1) {
    add(acc, 'WTR-FILTER', 'Portable Water Filter',         'Flood risk: water sources may be contaminated',    'essential');
    add(acc, 'DOC-BAG',    'Waterproof Document Bag',        'Flood risk: protect vital documents from water damage', 'essential');
    add(acc, 'SHL-PONCHO', 'Waterproof Emergency Poncho',    'Flood risk: stay dry during evacuation',           'recommended');
  }
  if (hazards.flood >= 2) {
    add(acc, 'SHL-TENT2', 'Portable Emergency Tube Tent',   'High flood risk: shelter if displaced from home',  'recommended');
  }

  if (hazards.hurricane >= 1) {
    add(acc, 'COM-RADIO',  'Hand-Crank Emergency Radio',     'Hurricane risk: stay informed when power is out',  'essential');
    add(acc, 'WTR-TAB50',  'Water Purification Tablets',     'Hurricane risk: backup water purification',        'recommended');
    add(acc, 'SHL-MYLAR4', 'Emergency Mylar Blanket (4-pack)', 'Hurricane risk: warmth if shelter is compromised', 'recommended');
  }
  if (hazards.hurricane >= 2) {
    add(acc, 'FOOD-FD7D',  'Freeze-Dried Meal Pack (7-day)', 'Severe hurricane risk: extended shelter-in-place food supply', 'recommended');
  }

  if (hazards.wildfire >= 1) {
    add(acc, 'MED-N95-10', 'N95 Respirator Masks (10-pack)', 'Wildfire risk: smoke inhalation protection',       'essential');
  }
  if (hazards.wildfire >= 2) {
    add(acc, 'COM-RADIO',  'Hand-Crank Emergency Radio',     'High wildfire risk: evacuation alerts when power fails', 'essential');
  }

  if (hazards.earthquake >= 1) {
    add(acc, 'MED-TRAUMA', 'Trauma Wound Care Kit',          'Earthquake risk: trauma injuries common in structural damage', 'essential');
    add(acc, 'DOC-BAG',    'Waterproof Document Bag',        'Earthquake risk: grab essential documents quickly', 'essential');
  }
  if (hazards.earthquake >= 2) {
    add(acc, 'COM-POWER20K', 'Portable Power Bank (20,000mAh)', 'High earthquake risk: power outages can last days', 'recommended');
  }

  if (hazards.tornado >= 1) {
    add(acc, 'COM-RADIO',  'Hand-Crank Emergency Radio',     'Tornado risk: NOAA weather alerts are life-saving', 'essential');
    add(acc, 'SHL-MYLAR4', 'Emergency Mylar Blanket (4-pack)', 'Tornado risk: retain warmth in a storm shelter', 'recommended');
  }
  if (hazards.tornado >= 2) {
    add(acc, 'MED-TRAUMA', 'Trauma Wound Care Kit',          'High tornado risk: be ready to treat injuries', 'essential');
  }

  if (hazards.winterStorm >= 1) {
    add(acc, 'SHL-MYLAR4',    'Emergency Mylar Blanket (4-pack)', 'Winter storm risk: retain body heat during power outages', 'essential');
    add(acc, 'COM-CANDLE12',  'Emergency Candles (12-pack)',      'Winter storm risk: lighting and warmth backup',            'recommended');
    add(acc, 'COM-LAMP',      'LED Headlamp with Batteries',      'Winter storm risk: navigate safely in darkness',           'recommended');
  }
  if (hazards.winterStorm >= 2) {
    add(acc, 'FOOD-FD7D', 'Freeze-Dried Meal Pack (7-day)', 'Severe winter storm: roads may be impassable for days', 'recommended');
  }

  // ── Pass 3: Profile Additions ─────────────────────────────────────────────

  if (profile.hasInfants) {
    add(acc, 'DOC-TMPL', 'Emergency Document Template Kit', 'Infants need specialized emergency planning documentation', 'recommended');
    notes.push('Include infant formula, diapers, and feeding supplies in your kit (not available from EMPREP).');
  }

  if (profile.hasElderly) {
    add(acc, 'MED-RXORG', 'Emergency Prescription Organizer', 'Elderly household members often need multiple medications', 'essential');
    add(acc, 'DOC-TMPL',  'Emergency Document Template Kit',  'Document medical needs, insurance, and contacts for elderly members', 'recommended');
  }

  if (profile.powerDependentMedical) {
    add(acc, 'COM-POWER20K', 'Portable Power Bank (20,000mAh)', 'Power-dependent medical equipment needs backup power', 'essential');
    notes.push('Contact your utility company\'s medical baseline or life support program to register your address for priority restoration.');
  }

  if (profile.refrigeratedMedications) {
    add(acc, 'COM-POWER20K', 'Portable Power Bank (20,000mAh)', 'Refrigerated medications need backup power for cooling', 'essential');
    notes.push('Plan for medication refrigeration: a small cooler + ice or powered cooling bag for insulin and other temperature-sensitive drugs.');
  }

  if (profile.hasMobilityLimitations) {
    notes.push('Coordinate with neighbors, building management, or local emergency services for evacuation assistance in advance.');
  }

  if (profile.hasServiceAnimal) {
    notes.push('Include at least a 3-day supply of food and water for your service animal in your kit.');
  }

  if (profile.petCount !== null && profile.petCount > 0) {
    notes.push(`Include a ${shelterDuration === '2week' ? '14' : shelterDuration === '1week' ? '7' : '3'}-day supply of food and water for your ${profile.petCount === 1 ? 'pet' : `${profile.petCount} pets`}.`);
  }

  if (!profile.hasVehicle) {
    notes.push('Identify your nearest emergency shelter and public evacuation routes — contact your local emergency management office.');
    const anyHazard = (Object.values(hazards) as number[]).some((v) => v >= 1);
    if (anyHazard) {
      add(acc, 'SHL-TENT2', 'Portable Emergency Tube Tent', 'No vehicle available: shelter-in-place option if evacuation is impossible', 'recommended');
    }
  }

  if (hasCommPlan === false) {
    add(acc, 'DOC-TMPL', 'Emergency Document Template Kit', 'Includes a communication plan template for your household', 'recommended');
    notes.push('A written household communication plan is strongly recommended — who to contact, where to meet, and what to do if separated.');
  }

  // Elevate categories based on scenario intent
  if (profile.wantsGoKit) {
    elevate(acc, 'SHL-', 'essential');
    elevate(acc, 'COM-RADIO', 'essential');
  }
  if (profile.wantsShelterKit) {
    elevate(acc, 'FOOD-', 'essential');
    elevate(acc, 'WTR-', 'essential');
  }

  // ── Pass 4: Budget / Duration Trim (detailed path only) ───────────────────

  let items = [...acc.values()];

  if (shelterDuration === '2week') {
    // Ensure long-duration food is present
    if (!acc.has('FOOD-FD7D')) {
      items.push({ sku: 'FOOD-FD7D', name: 'Freeze-Dried Meal Pack (7-day)', reason: '2-week preparedness requires extended food supply', priority: 'recommended' });
    }
  }

  if (budgetTier === 'basic' || shelterDuration === '72hr') {
    items = items.filter((i) => i.priority === 'essential').slice(0, 7);
  } else if (budgetTier === 'standard' || shelterDuration === '1week') {
    items = items.filter((i) => i.priority !== 'optional');
  }

  if (budgetTier === 'premium') {
    if (!acc.has('COM-POWER20K')) {
      items.push({ sku: 'COM-POWER20K', name: 'Portable Power Bank (20,000mAh)', reason: 'Premium kit: ensure full power backup capability', priority: 'recommended' });
    }
  }

  // Sort: essential → recommended → optional
  items.sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]);

  return {
    hazards,
    primaryKit,
    items: items.map((i) => ({ sku: i.sku, name: i.name, reason: i.reason, priority: i.priority })),
    notes,
  };
}

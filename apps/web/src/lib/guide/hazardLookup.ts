import type { HazardProfile } from './types';

type PartialHazard = Partial<HazardProfile>;

// ─── State-level base profiles ────────────────────────────────────────────────

const STATE_HAZARDS: Record<string, PartialHazard> = {
  // High hurricane / flood
  FL: { flood: 2, hurricane: 2, tornado: 1, winterStorm: 0 },
  LA: { flood: 2, hurricane: 2, tornado: 1 },
  MS: { flood: 1, hurricane: 2, tornado: 1 },
  AL: { flood: 1, hurricane: 1, tornado: 2 },
  SC: { flood: 1, hurricane: 1, tornado: 1 },
  NC: { flood: 1, hurricane: 1, tornado: 1 },
  GA: { flood: 1, hurricane: 1, tornado: 1 },
  VA: { flood: 1, hurricane: 1, tornado: 1 },

  // Tornado alley
  TX: { tornado: 2, hurricane: 1, flood: 1 },
  OK: { tornado: 2, flood: 1 },
  KS: { tornado: 2, flood: 1 },
  NE: { tornado: 2, flood: 1, winterStorm: 1 },
  MO: { tornado: 2, flood: 1 },
  AR: { tornado: 1, flood: 1 },
  TN: { tornado: 1, flood: 1 },
  KY: { tornado: 1, flood: 1, winterStorm: 1 },
  IN: { tornado: 1, winterStorm: 1 },
  IL: { tornado: 1, winterStorm: 1 },
  OH: { tornado: 1, winterStorm: 1, flood: 1 },
  IA: { tornado: 1, winterStorm: 1, flood: 1 },
  MN: { tornado: 1, winterStorm: 2 },
  WI: { tornado: 1, winterStorm: 2 },
  MI: { winterStorm: 2 },
  SD: { tornado: 1, winterStorm: 2 },
  ND: { winterStorm: 2, flood: 1 },

  // West Coast — earthquake & wildfire
  CA: { earthquake: 2, wildfire: 2, flood: 1 },
  OR: { earthquake: 1, wildfire: 1, flood: 1 },
  WA: { earthquake: 1, wildfire: 1, flood: 1 },

  // Mountain West — wildfire
  CO: { wildfire: 2, winterStorm: 1 },
  MT: { wildfire: 1, winterStorm: 2 },
  ID: { wildfire: 1, winterStorm: 1 },
  WY: { wildfire: 1, winterStorm: 2 },
  UT: { wildfire: 1, earthquake: 1 },
  NV: { wildfire: 1, earthquake: 1 },
  AZ: { wildfire: 2, flood: 1 },
  NM: { wildfire: 2, flood: 1 },

  // Northeast — winter storms, some flood
  NY: { winterStorm: 2, flood: 1 },
  PA: { winterStorm: 1, flood: 1 },
  MA: { winterStorm: 2, hurricane: 1 },
  CT: { winterStorm: 1, hurricane: 1, flood: 1 },
  RI: { winterStorm: 1, hurricane: 1 },
  VT: { winterStorm: 2, flood: 1 },
  NH: { winterStorm: 2 },
  ME: { winterStorm: 2 },
  NJ: { winterStorm: 1, hurricane: 1, flood: 1 },
  DE: { winterStorm: 1, hurricane: 1, flood: 1 },
  MD: { winterStorm: 1, hurricane: 1, flood: 1 },
  DC: { winterStorm: 1, flood: 1 },
  WV: { winterStorm: 1, flood: 1 },

  // Lower flood/moderate
  AK: { earthquake: 2, winterStorm: 2, flood: 1 },
  HI: { hurricane: 1, earthquake: 1, flood: 1 },
};

// ─── ZIP prefix overrides (first 3 chars: state-ZZZ) ─────────────────────────
// Key format: "<ST>-<first-3-digits-of-zip>"

const ZIP_OVERRIDES: Record<string, PartialHazard> = {
  // South Florida — Miami/Keys: extreme hurricane + flood
  'FL-330': { hurricane: 2, flood: 2 },
  'FL-331': { hurricane: 2, flood: 2 },
  'FL-332': { hurricane: 2, flood: 2 },
  'FL-334': { hurricane: 2, flood: 2 },

  // Northern FL — less hurricane risk
  'FL-322': { hurricane: 1, flood: 1 },

  // Southern CA — Los Angeles/San Diego: earthquake + wildfire
  'CA-900': { earthquake: 2, wildfire: 2 },
  'CA-902': { earthquake: 2, wildfire: 2 },
  'CA-906': { earthquake: 2, wildfire: 2 },
  'CA-910': { earthquake: 2, wildfire: 1 },
  'CA-919': { earthquake: 2, wildfire: 2 },
  'CA-920': { earthquake: 2, wildfire: 2 },
  'CA-921': { earthquake: 2, wildfire: 2 },

  // Bay Area — high earthquake
  'CA-940': { earthquake: 2, wildfire: 1 },
  'CA-941': { earthquake: 2, wildfire: 1 },
  'CA-945': { earthquake: 2 },
  'CA-946': { earthquake: 2 },
  'CA-947': { earthquake: 2 },

  // Seattle metro — earthquake
  'WA-980': { earthquake: 2 },
  'WA-981': { earthquake: 2 },
  'WA-982': { earthquake: 1 },

  // Houston — extreme flood
  'TX-770': { flood: 2, hurricane: 1 },
  'TX-771': { flood: 2, hurricane: 1 },
  'TX-772': { flood: 2, hurricane: 1 },

  // Galveston — hurricane + flood
  'TX-775': { hurricane: 2, flood: 2 },

  // New Orleans metro
  'LA-700': { flood: 2, hurricane: 2 },
  'LA-701': { flood: 2, hurricane: 2 },

  // Oklahoma City / Moore / Norman — tornado alley
  'OK-730': { tornado: 2, flood: 1 },
  'OK-731': { tornado: 2 },

  // Wichita
  'KS-672': { tornado: 2 },

  // Denver — wildfire + winter storm
  'CO-800': { wildfire: 1, winterStorm: 2 },
  'CO-802': { wildfire: 2, winterStorm: 1 },

  // Phoenix — extreme heat / wildfire
  'AZ-850': { wildfire: 2, flood: 1 },
  'AZ-852': { wildfire: 2, flood: 1 },

  // Alaska earthquake zones
  'AK-995': { earthquake: 2, winterStorm: 2 },
  'AK-996': { earthquake: 2, winterStorm: 2 },

  // Hawaii
  'HI-967': { hurricane: 1, earthquake: 2, flood: 1 }, // Big Island (volcanic)
  'HI-968': { hurricane: 1, flood: 1 },
};

// ─── Lookup function ──────────────────────────────────────────────────────────

const DEFAULTS: HazardProfile = {
  flood: 0, hurricane: 0, wildfire: 0,
  earthquake: 0, tornado: 0, winterStorm: 0,
};

const FALLBACK: HazardProfile = { ...DEFAULTS, flood: 1 };

export function lookupHazards(state: string, zip: string): HazardProfile {
  const st = state.toUpperCase().trim();
  const base: PartialHazard = STATE_HAZARDS[st] ?? {};

  // Check ZIP override: try 5-char zip prefix key "<ST>-<first3>"
  const zipPrefix = zip.replace(/\D/g, '').slice(0, 3);
  const overrideKey = zipPrefix ? `${st}-${zipPrefix}` : '';
  const override: PartialHazard = overrideKey ? (ZIP_OVERRIDES[overrideKey] ?? {}) : {};

  // If state is completely unknown return safe fallback
  if (!STATE_HAZARDS[st]) return FALLBACK;

  return {
    flood:       clamp(override.flood       ?? base.flood       ?? 0),
    hurricane:   clamp(override.hurricane   ?? base.hurricane   ?? 0),
    wildfire:    clamp(override.wildfire    ?? base.wildfire    ?? 0),
    earthquake:  clamp(override.earthquake  ?? base.earthquake  ?? 0),
    tornado:     clamp(override.tornado     ?? base.tornado     ?? 0),
    winterStorm: clamp(override.winterStorm ?? base.winterStorm ?? 0),
  };
}

function clamp(v: number): 0 | 1 | 2 {
  if (v <= 0) return 0;
  if (v >= 2) return 2;
  return 1;
}

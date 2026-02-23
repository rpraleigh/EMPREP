'use client';

import { useState } from 'react';
import type { WizardState } from '@/lib/guide/types';

interface Props {
  state:    WizardState;
  onUpdate: (patch: Partial<WizardState>) => void;
  onNext:   () => void;
  onBack:   () => void;
}

// State abbreviation lookup for Nominatim region results
const STATE_ABBR: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
};

function extractZip(text: string): string | null {
  const m = text.match(/\b(\d{5})\b/);
  return m?.[1] ?? null;
}

function extractState(text: string): string | null {
  const upper = text.toUpperCase().trim();
  // Direct 2-letter abbreviation
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  // Full name
  const lower = upper.toLowerCase();
  return STATE_ABBR[lower] ?? null;
}

function nullify(v: string | undefined): string | null {
  return v ?? null;
}

export default function StepLocation({ state: wizState, onUpdate, onNext, onBack }: Props) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState(wizState.locationInput);

  const canProceed = !!wizState.detectedState && !!wizState.detectedZip;

  async function handleLocate() {
    setGeoError(null);
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }),
      );
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { 'User-Agent': 'EMPREP-WebApp/1.0' } },
      );
      const json = await res.json() as {
        address?: { state?: string; postcode?: string; country_code?: string };
        display_name?: string;
      };
      const addr = json.address ?? {};
      const stateRaw = addr.state ?? '';
      const zip = nullify(addr.postcode?.slice(0, 5)) ?? '';
      const detectedState = extractState(stateRaw) ?? stateRaw.toUpperCase().slice(0, 2);
      const display = json.display_name ?? `${stateRaw}, ${zip}`;
      setManualInput(display);
      onUpdate({ locationInput: display, detectedState, detectedZip: zip, geolocated: true });
    } catch {
      setGeoError('Could not detect your location. Please enter your address or ZIP code below.');
    } finally {
      setLocating(false);
    }
  }

  function handleManualChange(val: string) {
    setManualInput(val);
    const zip = extractZip(val);
    const st  = extractState(val.split(',').pop()?.trim() ?? val);
    onUpdate({
      locationInput: val,
      detectedZip:   zip,
      detectedState: st,
      geolocated:    false,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Where are you located?</h2>
        <p className="text-sm text-gray-500 mt-1">
          We use your location to assess local hazards such as flood plains, hurricane zones, and wildfire risk.
        </p>
      </div>

      {/* Locate me */}
      <div>
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-700 transition-colors disabled:opacity-50"
        >
          <span>{locating ? '📡 Detecting…' : '📍 Locate me'}</span>
        </button>
        {geoError && <p className="text-xs text-red-600 mt-2">{geoError}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">or enter manually</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Manual input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address or ZIP code
        </label>
        <input
          type="text"
          value={manualInput}
          onChange={(e) => handleManualChange(e.target.value)}
          placeholder="e.g. 123 Main St, Houston TX  or  77001"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-400 mt-1">
          Include your state (e.g. "Houston, TX" or "77001") for the most accurate hazard assessment.
        </p>
      </div>

      {/* Detected summary */}
      {wizState.detectedState && wizState.detectedZip && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          <span className="font-medium">Detected:</span> {wizState.detectedState} · ZIP {wizState.detectedZip}
          {wizState.geolocated && <span className="ml-2 text-xs text-green-600">(GPS)</span>}
        </div>
      )}
      {wizState.detectedState && !wizState.detectedZip && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          State detected: <span className="font-medium">{wizState.detectedState}</span>. Add your ZIP code for more precise hazard data.
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg px-6 py-2 text-sm font-semibold transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

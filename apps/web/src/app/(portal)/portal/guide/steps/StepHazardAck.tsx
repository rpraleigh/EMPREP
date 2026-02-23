'use client';

import type { HazardProfile } from '@/lib/guide/types';

interface Props {
  hazards: HazardProfile;
  onNext:  () => void;
  onBack:  () => void;
}

const HAZARD_META: {
  key:    keyof HazardProfile;
  label:  string;
  icon:   string;
  desc:   string;
}[] = [
  { key: 'flood',       label: 'Flood',        icon: '🌊', desc: 'River flooding, storm surge, heavy rainfall' },
  { key: 'hurricane',   label: 'Hurricane',    icon: '🌀', desc: 'Tropical storms and associated winds, rain, surge' },
  { key: 'wildfire',    label: 'Wildfire',     icon: '🔥', desc: 'Brush and forest fires, smoke inhalation' },
  { key: 'earthquake',  label: 'Earthquake',   icon: '🌍', desc: 'Seismic activity, structural damage' },
  { key: 'tornado',     label: 'Tornado',      icon: '🌪️', desc: 'Rotating thunderstorm winds, sudden strikes' },
  { key: 'winterStorm', label: 'Winter Storm', icon: '❄️', desc: 'Ice, snow, power outages, road closures' },
];

const LEVEL: Record<0 | 1 | 2, { label: string; color: string }> = {
  0: { label: 'Low',      color: 'bg-gray-100 text-gray-500' },
  1: { label: 'Moderate', color: 'bg-amber-100 text-amber-700' },
  2: { label: 'High',     color: 'bg-red-100 text-red-700' },
};

export default function StepHazardAck({ hazards, onNext, onBack }: Props) {
  const active = HAZARD_META.filter((h) => hazards[h.key] > 0);
  const inactive = HAZARD_META.filter((h) => hazards[h.key] === 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Your local hazard profile</h2>
        <p className="text-sm text-gray-500 mt-1">
          Based on your location, here are the risks we've identified. We'll tailor your kit recommendations accordingly.
        </p>
      </div>

      {active.length > 0 && (
        <div className="space-y-3">
          {active.map((h) => {
            const level = LEVEL[hazards[h.key]];
            return (
              <div key={h.key} className="flex items-start gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="text-2xl">{h.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{h.label}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${level.color}`}>
                      {level.label} Risk
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{h.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">Low / no identified risk:</p>
          <div className="flex flex-wrap gap-2">
            {inactive.map((h) => (
              <span key={h.key} className="text-xs bg-gray-100 text-gray-400 rounded-full px-3 py-1">
                {h.icon} {h.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Hazard data is based on regional averages by state and ZIP code. Your specific address may vary.
        We'll factor these into your recommendations.
      </p>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600">
          ← Back
        </button>
        <button
          onClick={onNext}
          className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-6 py-2 text-sm font-semibold transition-colors"
        >
          Looks right, continue →
        </button>
      </div>
    </div>
  );
}

'use client';

interface Props {
  value:     '72hr' | '1week' | '2week' | undefined;
  onChange:  (v: '72hr' | '1week' | '2week') => void;
  onNext:    () => void;
  onBack:    () => void;
}

const OPTIONS: { value: '72hr' | '1week' | '2week'; label: string; sub: string; recommended?: true }[] = [
  { value: '72hr',  label: '72 Hours',  sub: 'FEMA\'s minimum recommendation for most emergencies' },
  { value: '1week', label: '1 Week',    sub: 'Recommended for hurricane, winter storm, and flood zones', recommended: true },
  { value: '2week', label: '2 Weeks',   sub: 'Best for high-risk areas or households with medical needs' },
];

export default function StepShelterDuration({ value, onChange, onNext, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">How long do you want to be prepared?</h2>
        <p className="text-sm text-gray-500 mt-1">
          This sets the baseline supply quantity in your recommendation.
        </p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 cursor-pointer transition-colors"
            style={{ borderColor: value === opt.value ? '#dc2626' : '#f3f4f6' }}
          >
            <input
              type="radio"
              name="duration"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="accent-red-600"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">{opt.label}</span>
                {opt.recommended && (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!value}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg px-6 py-2 text-sm font-semibold transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

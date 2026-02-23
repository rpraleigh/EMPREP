'use client';

interface Props {
  value:    'basic' | 'standard' | 'premium' | undefined;
  onChange: (v: 'basic' | 'standard' | 'premium') => void;
  onNext:   () => void;
  onBack:   () => void;
}

const OPTIONS: { value: 'basic' | 'standard' | 'premium'; label: string; range: string; sub: string }[] = [
  { value: 'basic',    label: 'Basic',    range: '~$50–$150',  sub: 'Essential items only — the most critical supplies for your hazards' },
  { value: 'standard', label: 'Standard', range: '~$150–$400', sub: 'Essential + recommended — a well-rounded kit for most households' },
  { value: 'premium',  label: 'Premium',  range: '$400+',      sub: 'Full coverage including power backup, extended food supply, and all extras' },
];

export default function StepBudget({ value, onChange, onNext, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">What's your budget range?</h2>
        <p className="text-sm text-gray-500 mt-1">
          We'll trim the recommendation to fit. You can always add more later.
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
              name="budget"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="accent-red-600"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900 text-sm">{opt.label}</span>
                <span className="text-xs text-gray-400 font-mono">{opt.range}</span>
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

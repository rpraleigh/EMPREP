'use client';

interface Props {
  value:    boolean | undefined;
  onChange: (v: boolean) => void;
  onNext:   () => void;
  onBack:   () => void;
}

export default function StepCommPlan({ value, onChange, onNext, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Do you have a household communication plan?</h2>
        <p className="text-sm text-gray-500 mt-1">
          A communication plan tells everyone in your household what to do, who to contact, and where to meet
          if you're separated during an emergency.
        </p>
      </div>

      <div className="space-y-3">
        {([
          { val: true,  label: 'Yes',  sub: 'We have documented meeting points, out-of-area contacts, and family roles' },
          { val: false, label: 'No',   sub: "We haven't set one up yet — we'll include a template in your recommendations" },
        ] as const).map((opt) => (
          <label
            key={String(opt.val)}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 cursor-pointer transition-colors"
            style={{ borderColor: value === opt.val ? '#dc2626' : '#f3f4f6' }}
          >
            <input
              type="radio"
              name="commPlan"
              checked={value === opt.val}
              onChange={() => onChange(opt.val)}
              className="accent-red-600"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700">
        FEMA recommends every household have a written communication plan. Our technicians can help you
        set one up during an evaluation visit.
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={value === undefined}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg px-6 py-2 text-sm font-semibold transition-colors"
        >
          See my recommendations →
        </button>
      </div>
    </div>
  );
}

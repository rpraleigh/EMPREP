'use client';

import type { WizardPath } from '@/lib/guide/types';

interface Props {
  onChoose: (path: WizardPath) => void;
  onBack:   () => void;
}

export default function StepChoosePath({ onChoose, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">How would you like to proceed?</h2>
        <p className="text-sm text-gray-500 mt-1">
          Both paths generate a personalized supply recommendation based on your profile and local hazards.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          onClick={() => onChoose('quick')}
          className="text-left p-6 bg-white rounded-xl border-2 border-gray-100 hover:border-red-300 hover:shadow-md transition-all group"
        >
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-red-700 mb-1">
            Recommend for me
          </h3>
          <p className="text-sm text-gray-500">
            Just tell us your location. We'll combine it with your profile to instantly recommend what you need.
          </p>
          <div className="mt-4 text-xs font-medium text-red-600">~1 minute →</div>
        </button>

        <button
          onClick={() => onChoose('detailed')}
          className="text-left p-6 bg-white rounded-xl border-2 border-gray-100 hover:border-red-300 hover:shadow-md transition-all group"
        >
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-red-700 mb-1">
            Detailed walkthrough
          </h3>
          <p className="text-sm text-gray-500">
            Answer a few more questions about your specific hazards, shelter duration, and budget for a more tailored plan.
          </p>
          <div className="mt-4 text-xs font-medium text-red-600">~5 minutes →</div>
        </button>
      </div>

      <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600">
        ← Back to dashboard
      </button>
    </div>
  );
}

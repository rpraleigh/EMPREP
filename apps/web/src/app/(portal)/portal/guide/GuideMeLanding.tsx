'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GuideProfileInput, WizardState } from '@/lib/guide/types';
import { lookupHazards } from '@/lib/guide/hazardLookup';
import { buildRecommendation } from '@/lib/guide/recommendationEngine';
import StepChoosePath      from './steps/StepChoosePath';
import StepLocation        from './steps/StepLocation';
import StepHazardAck       from './steps/StepHazardAck';
import StepShelterDuration from './steps/StepShelterDuration';
import StepBudget          from './steps/StepBudget';
import StepCommPlan        from './steps/StepCommPlan';

const INITIAL: WizardState = {
  path:          null,
  locationInput: '',
  detectedState: null,
  detectedZip:   null,
  geolocated:    false,
};

interface Props {
  profile: GuideProfileInput;
}

// ── Step indices ──────────────────────────────────────────────────────────────
// 0: ChoosePath
// Quick path:    1: Location → generate
// Detailed path: 1: Location, 2: HazardAck, 3: ShelterDuration, 4: Budget, 5: CommPlan → generate

const QUICK_STEPS    = 1; // max step index before generate
const DETAILED_STEPS = 5;

function totalSteps(path: WizardState['path']): number {
  if (path === 'quick')    return QUICK_STEPS + 1;    // +1 for step 0
  if (path === 'detailed') return DETAILED_STEPS + 1;
  return 1;
}

export default function GuideMeLanding({ profile }: Props) {
  const router = useRouter();
  const [step, setStep]   = useState(0);
  const [wiz,  setWiz]    = useState<WizardState>(INITIAL);

  function patch(updates: Partial<WizardState>) {
    setWiz((prev) => ({ ...prev, ...updates }));
  }

  function next() { setStep((s) => s + 1); }
  function back() {
    if (step === 0) {
      router.push('/portal/dashboard');
    } else {
      setStep((s) => s - 1);
    }
  }

  function generate() {
    const state = wiz.detectedState ?? '';
    const zip   = wiz.detectedZip   ?? '';
    const hazards = lookupHazards(state, zip);

    const result = buildRecommendation({
      profile,
      hazards,
      ...(wiz.shelterDuration !== undefined ? { shelterDuration: wiz.shelterDuration } : {}),
      ...(wiz.budgetTier      !== undefined ? { budgetTier:      wiz.budgetTier }      : {}),
      ...(wiz.hasCommPlan     !== undefined ? { hasCommPlan:     wiz.hasCommPlan }     : {}),
    });

    const encoded = encodeURIComponent(btoa(JSON.stringify(result)));
    router.push(`/portal/guide/results?rec=${encoded}`);
  }

  // Progress dots (shown after path is chosen)
  const total = totalSteps(wiz.path);

  return (
    <div className="max-w-xl space-y-6">
      {/* Progress */}
      {wiz.path && step > 0 && (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total - 1 }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < step ? 'bg-red-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}

      {/* Step 0 — Choose path */}
      {step === 0 && (
        <StepChoosePath
          onChoose={(path) => { patch({ path }); next(); }}
          onBack={back}
        />
      )}

      {/* Step 1 — Location (both paths) */}
      {step === 1 && (
        <StepLocation
          state={wiz}
          onUpdate={patch}
          onNext={() => {
            if (wiz.path === 'quick') {
              generate();
            } else {
              next();
            }
          }}
          onBack={back}
        />
      )}

      {/* Steps 2–5: detailed path only */}
      {step === 2 && wiz.path === 'detailed' && (
        <StepHazardAck
          hazards={lookupHazards(wiz.detectedState ?? '', wiz.detectedZip ?? '')}
          onNext={next}
          onBack={back}
        />
      )}

      {step === 3 && wiz.path === 'detailed' && (
        <StepShelterDuration
          value={wiz.shelterDuration}
          onChange={(v) => patch({ shelterDuration: v })}
          onNext={next}
          onBack={back}
        />
      )}

      {step === 4 && wiz.path === 'detailed' && (
        <StepBudget
          value={wiz.budgetTier}
          onChange={(v) => patch({ budgetTier: v })}
          onNext={next}
          onBack={back}
        />
      )}

      {step === 5 && wiz.path === 'detailed' && (
        <StepCommPlan
          value={wiz.hasCommPlan}
          onChange={(v) => patch({ hasCommPlan: v })}
          onNext={generate}
          onBack={back}
        />
      )}
    </div>
  );
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getCustomerProfile } from '@rpral/api';
import GuideMeLanding from './GuideMeLanding';
import type { GuideProfileInput } from '@/lib/guide/types';

export default async function GuidePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const profile = await getCustomerProfile(supabase, user.id);
  if (!profile) redirect('/portal/onboarding');

  // Pass only the safe subset to the client — no sensitive fields
  const guideProfile: GuideProfileInput = {
    householdSize:           profile.householdSize,
    wantsGoKit:              profile.wantsGoKit,
    wantsShelterKit:         profile.wantsShelterKit,
    hasInfants:              profile.hasInfants,
    hasElderly:              profile.hasElderly,
    petCount:                profile.petCount,
    hasServiceAnimal:        profile.hasServiceAnimal,
    powerDependentMedical:   profile.powerDependentMedical,
    refrigeratedMedications: profile.refrigeratedMedications,
    hasMobilityLimitations:  profile.hasMobilityLimitations,
    hasVehicle:              profile.hasVehicle,
  };

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Guide Me</h1>
        <p className="text-sm text-gray-500 mt-1">
          Get a personalized emergency supply recommendation based on your location and household profile.
        </p>
      </div>
      <GuideMeLanding profile={guideProfile} />
    </div>
  );
}

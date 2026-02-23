export type WizardPath = 'quick' | 'detailed';

export interface HazardProfile {
  flood:       0 | 1 | 2;
  hurricane:   0 | 1 | 2;
  wildfire:    0 | 1 | 2;
  earthquake:  0 | 1 | 2;
  tornado:     0 | 1 | 2;
  winterStorm: 0 | 1 | 2;
}

export interface WizardState {
  path:             WizardPath | null;
  locationInput:    string;
  detectedState:    string | null;
  detectedZip:      string | null;
  geolocated:       boolean;
  shelterDuration?: '72hr' | '1week' | '2week';
  budgetTier?:      'basic' | 'standard' | 'premium';
  hasCommPlan?:     boolean;
}

export interface RecommendedItem {
  sku:      string;
  name:     string;
  reason:   string;
  priority: 'essential' | 'recommended' | 'optional';
}

export interface GuideResult {
  hazards:    HazardProfile;
  primaryKit: string;
  items:      RecommendedItem[];
  notes:      string[];
}

/** Safe subset of CustomerProfile passed from server → client (no sensitive fields) */
export interface GuideProfileInput {
  householdSize:          number;
  wantsGoKit:             boolean;
  wantsShelterKit:        boolean;
  hasInfants:             boolean;
  hasElderly:             boolean;
  petCount:               number | null;
  hasServiceAnimal:       boolean;
  powerDependentMedical:  boolean;
  refrigeratedMedications: boolean;
  hasMobilityLimitations: boolean;
  hasVehicle:             boolean;
}

export interface GuideInput {
  profile:          GuideProfileInput;
  hazards:          HazardProfile;
  shelterDuration?: '72hr' | '1week' | '2week';
  budgetTier?:      'basic' | 'standard' | 'premium';
  hasCommPlan?:     boolean;
}

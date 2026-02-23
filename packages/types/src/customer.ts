export interface CustomerProfile {
  id:               string;
  userId:           string;
  fullName:         string;
  email:            string;
  phone:            string | null;
  addressLine1:     string | null;
  addressLine2:     string | null;
  city:             string | null;
  state:            string | null;
  zip:              string | null;
  householdSize:    number;
  hasPets:          boolean;
  specialNeeds:     string | null;
  stripeCustomerId: string | null;
  // Emergency preparedness intake
  wantsGoKit:              boolean;
  wantsShelterKit:         boolean;
  hasInfants:              boolean;
  hasElderly:              boolean;
  petCount:                number | null;
  hasServiceAnimal:        boolean;
  powerDependentMedical:   boolean;
  refrigeratedMedications: boolean;
  hasMobilityLimitations:  boolean;
  hasVehicle:              boolean;
  createdAt:        string;
  updatedAt:        string;
}

export interface CreateCustomerInput {
  userId:        string;
  fullName:      string;
  email:         string;
  phone?:        string;
  addressLine1?: string;
  addressLine2?: string;
  city?:         string;
  state?:        string;
  zip?:          string;
  householdSize?: number;
  hasPets?:      boolean;
  specialNeeds?: string;
  // Emergency preparedness intake
  wantsGoKit?:              boolean;
  wantsShelterKit?:         boolean;
  hasInfants?:              boolean;
  hasElderly?:              boolean;
  petCount?:                number | null;
  hasServiceAnimal?:        boolean;
  powerDependentMedical?:   boolean;
  refrigeratedMedications?: boolean;
  hasMobilityLimitations?:  boolean;
  hasVehicle?:              boolean;
}

export interface UpdateCustomerInput extends Partial<Omit<CreateCustomerInput, 'userId'>> {}

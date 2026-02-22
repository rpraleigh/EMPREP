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
}

export interface UpdateCustomerInput extends Partial<Omit<CreateCustomerInput, 'userId'>> {}

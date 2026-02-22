export interface CustomerSupply {
  id:            string;
  customerId:    string;
  supplyItemId:  string;
  quantity:      number;
  purchasedAt:   string | null;
  expiresAt:     string | null;
  notes:         string | null;
  createdAt:     string;
  updatedAt:     string;
}

export interface UpsertCustomerSupplyInput {
  customerId:    string;
  supplyItemId:  string;
  quantity:      number;
  purchasedAt?:  string;
  expiresAt?:    string;
  notes?:        string;
}

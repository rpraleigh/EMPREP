export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id:                     string;
  customerId:             string;
  status:                 OrderStatus;
  subtotalCents:          number;
  taxCents:               number;
  totalCents:             number;
  stripePaymentIntentId:  string | null;
  shippingAddress:        ShippingAddress | null;
  notes:                  string | null;
  createdAt:              string;
  updatedAt:              string;
}

export interface OrderItem {
  id:            string;
  orderId:       string;
  supplyItemId:  string;
  quantity:      number;
  unitPriceCents: number;
  createdAt:     string;
}

export interface ShippingAddress {
  line1:  string;
  line2?: string;
  city:   string;
  state:  string;
  zip:    string;
}

export interface CreateOrderInput {
  customerId:      string;
  items:           Array<{ supplyItemId: string; quantity: number }>;
  shippingAddress?: ShippingAddress;
  notes?:          string;
}

export interface OrderWithItems extends Order {
  items: Array<OrderItem & { item: import('./catalog').SupplyItem }>;
}

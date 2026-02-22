export interface SupplyCategory {
  id:          string;
  name:        string;
  slug:        string;
  description: string | null;
  sortOrder:   number;
  createdAt:   string;
}

export interface SupplyItem {
  id:               string;
  categoryId:       string | null;
  name:             string;
  description:      string | null;
  sku:              string | null;
  unit:             string;
  priceCents:       number;
  shelfLifeMonths:  number | null;
  isKit:            boolean;
  isActive:         boolean;
  imageUrl:         string | null;
  createdAt:        string;
  updatedAt:        string;
}

export interface KitContent {
  id:       string;
  kitId:    string;
  itemId:   string;
  quantity: number;
}

/** SupplyItem with its kit contents pre-joined */
export interface KitWithContents extends SupplyItem {
  contents: Array<KitContent & { item: SupplyItem }>;
}

export interface CreateSupplyItemInput {
  categoryId?:       string;
  name:              string;
  description?:      string;
  sku?:              string;
  unit?:             string;
  priceCents:        number;
  shelfLifeMonths?:  number;
  isKit?:            boolean;
  imageUrl?:         string;
}

export interface UpdateSupplyItemInput extends Partial<CreateSupplyItemInput> {
  isActive?: boolean;
}

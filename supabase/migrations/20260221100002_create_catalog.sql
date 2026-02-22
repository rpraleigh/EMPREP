-- Top-level groupings: Food, Water, Medical, Tools, etc.
CREATE TABLE supply_categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  description TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual items and pre-packaged kits
CREATE TABLE supply_items (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id        UUID        REFERENCES supply_categories(id) ON DELETE SET NULL,
  name               TEXT        NOT NULL,
  description        TEXT,
  sku                TEXT        UNIQUE,
  unit               TEXT        NOT NULL DEFAULT 'each',
  price_cents        INTEGER     NOT NULL,
  shelf_life_months  INTEGER,                    -- NULL = no expiry
  is_kit             BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active          BOOLEAN     NOT NULL DEFAULT TRUE,
  image_url          TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items contained within a kit
CREATE TABLE kit_contents (
  id       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id   UUID    NOT NULL REFERENCES supply_items(id) ON DELETE CASCADE,
  item_id  UUID    NOT NULL REFERENCES supply_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  UNIQUE (kit_id, item_id)
);

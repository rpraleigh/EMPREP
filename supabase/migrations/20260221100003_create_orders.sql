-- Customer orders (pre-packaged kits or individual items)
CREATE TABLE orders (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id              UUID         NOT NULL REFERENCES customer_profiles(id) ON DELETE RESTRICT,
  status                   order_status NOT NULL DEFAULT 'pending',
  subtotal_cents           INTEGER      NOT NULL DEFAULT 0,
  tax_cents                INTEGER      NOT NULL DEFAULT 0,
  total_cents              INTEGER      NOT NULL DEFAULT 0,
  stripe_payment_intent_id TEXT,
  shipping_address         JSONB,
  notes                    TEXT,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Line items within an order
CREATE TABLE order_items (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  supply_item_id  UUID        NOT NULL REFERENCES supply_items(id) ON DELETE RESTRICT,
  quantity        INTEGER     NOT NULL,
  unit_price_cents INTEGER    NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

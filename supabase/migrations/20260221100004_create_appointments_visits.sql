-- Scheduled visits: initial evaluations, deliveries, and follow-ups
CREATE TABLE appointments (
  id              UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID               NOT NULL REFERENCES customer_profiles(id) ON DELETE RESTRICT,
  employee_id     UUID               REFERENCES employees(id) ON DELETE SET NULL,
  type            appointment_type   NOT NULL,
  status          appointment_status NOT NULL DEFAULT 'requested',
  scheduled_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  customer_notes  TEXT,
  admin_notes     TEXT,
  created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- Employee's post-visit report (one per appointment)
CREATE TABLE visit_records (
  id                   UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id       UUID             NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  employee_id          UUID             NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  summary              TEXT,
  recommendations      TEXT,
  follow_up_needed     BOOLEAN          NOT NULL DEFAULT FALSE,
  follow_up_interval   follow_up_interval,
  completed_at         TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  created_at           TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Per-item actions recorded during a visit
CREATE TABLE visit_supply_actions (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_record_id  UUID         NOT NULL REFERENCES visit_records(id) ON DELETE CASCADE,
  supply_item_id   UUID         NOT NULL REFERENCES supply_items(id) ON DELETE RESTRICT,
  action           visit_action NOT NULL,
  quantity         INTEGER      NOT NULL DEFAULT 1,
  condition        TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- What a customer currently has on hand (maintained by visits + orders)
CREATE TABLE customer_supplies (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID        NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  supply_item_id  UUID        NOT NULL REFERENCES supply_items(id) ON DELETE RESTRICT,
  quantity        INTEGER     NOT NULL DEFAULT 0,
  purchased_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, supply_item_id)
);

-- Recurring follow-up schedule per customer (opt-in)
CREATE TABLE follow_up_plans (
  id                UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       UUID               NOT NULL UNIQUE REFERENCES customer_profiles(id) ON DELETE CASCADE,
  interval          follow_up_interval NOT NULL,
  last_visit_at     TIMESTAMPTZ,
  next_scheduled_at TIMESTAMPTZ,
  is_active         BOOLEAN            NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

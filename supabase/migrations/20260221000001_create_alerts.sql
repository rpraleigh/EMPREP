CREATE TYPE alert_status AS ENUM (
  'draft', 'pending', 'dispatching', 'sent', 'failed', 'cancelled'
);

CREATE TABLE alerts (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id    UUID          REFERENCES alert_templates(id),
  severity       alert_severity NOT NULL,
  channel        alert_channel  NOT NULL DEFAULT 'both',
  title          TEXT          NOT NULL,
  body           TEXT          NOT NULL,
  body_es        TEXT,
  variables      JSONB         NOT NULL DEFAULT '{}',
  target_area    TEXT,
  status         alert_status  NOT NULL DEFAULT 'draft',
  dispatched_by  UUID          REFERENCES auth.users(id),
  dispatched_at  TIMESTAMPTZ,
  cancelled_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_status     ON alerts(status);
CREATE INDEX idx_alerts_severity   ON alerts(severity);
CREATE INDEX idx_alerts_dispatched ON alerts(dispatched_at DESC);

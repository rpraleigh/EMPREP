CREATE TYPE delivery_status AS ENUM (
  'pending', 'sent', 'delivered', 'failed', 'error', 'not_registered'
);

CREATE TYPE delivery_channel AS ENUM ('push', 'sms');

CREATE TABLE alert_deliveries (
  id                  UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id            UUID             NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  subscription_id     UUID             NOT NULL REFERENCES alert_subscriptions(id),
  channel             delivery_channel NOT NULL,
  recipient_token     TEXT,
  recipient_phone     TEXT,
  status              delivery_status  NOT NULL DEFAULT 'pending',
  expo_receipt_id     TEXT,
  twilio_sid          TEXT,
  error_message       TEXT,
  sent_at             TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  failed_at           TIMESTAMPTZ,
  receipt_checked_at  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deliveries_alert_id ON alert_deliveries(alert_id);
CREATE INDEX idx_deliveries_status   ON alert_deliveries(status);
CREATE INDEX idx_deliveries_receipt  ON alert_deliveries(expo_receipt_id)
  WHERE expo_receipt_id IS NOT NULL AND status = 'sent';

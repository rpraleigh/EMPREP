CREATE TABLE alert_subscriptions (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token      TEXT,
  phone_number         TEXT,                     -- E.164 format e.g. +19195551234
  preferred_locale     alert_locale  NOT NULL DEFAULT 'en',
  subscribed_channels  alert_channel NOT NULL DEFAULT 'both',
  severity_threshold   alert_severity NOT NULL DEFAULT 'info',
  is_active            BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  UNIQUE (user_id)
);

CREATE INDEX idx_alert_subscriptions_active ON alert_subscriptions(is_active)
  WHERE is_active = TRUE;
CREATE INDEX idx_alert_subscriptions_token  ON alert_subscriptions(expo_push_token)
  WHERE expo_push_token IS NOT NULL;

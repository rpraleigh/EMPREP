CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE alert_channel  AS ENUM ('push', 'sms', 'both');
CREATE TYPE alert_locale   AS ENUM ('en', 'es');

CREATE TABLE alert_templates (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  severity     alert_severity NOT NULL,
  locale       alert_locale   NOT NULL DEFAULT 'en',
  subject      TEXT        NOT NULL,
  body         TEXT        NOT NULL,
  channel      alert_channel  NOT NULL DEFAULT 'both',
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_by   UUID        REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (name, locale)
);

CREATE INDEX idx_alert_templates_severity ON alert_templates(severity);
CREATE INDEX idx_alert_templates_locale   ON alert_templates(locale);

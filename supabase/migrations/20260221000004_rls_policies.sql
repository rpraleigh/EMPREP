-- Enable RLS on all alert tables
ALTER TABLE alert_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_deliveries   ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an ops user?
-- Reads 'user_role' claim from the JWT (set via Supabase custom access token hook).
CREATE OR REPLACE FUNCTION is_ops_user()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'user_role') = 'ops',
    FALSE
  );
$$;

-- alert_templates
CREATE POLICY "ops_all_templates"   ON alert_templates FOR ALL  USING (is_ops_user());
CREATE POLICY "auth_read_templates" ON alert_templates FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- alerts
CREATE POLICY "ops_all_alerts"        ON alerts FOR ALL  USING (is_ops_user());
CREATE POLICY "auth_read_sent_alerts" ON alerts FOR SELECT
  USING (auth.role() = 'authenticated' AND status = 'sent');

-- alert_subscriptions: each user manages only their own row
CREATE POLICY "user_own_subscription"  ON alert_subscriptions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- ops can read all subscriptions for dispatch fan-out
CREATE POLICY "ops_read_subscriptions" ON alert_subscriptions FOR SELECT
  USING (is_ops_user());

-- alert_deliveries
CREATE POLICY "user_own_deliveries" ON alert_deliveries FOR SELECT
  USING (
    auth.uid() = (
      SELECT user_id FROM alert_subscriptions
      WHERE id = alert_deliveries.subscription_id
    )
  );
CREATE POLICY "ops_all_deliveries" ON alert_deliveries FOR ALL USING (is_ops_user());

-- ─── Helper functions ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb ->> 'user_role' = 'admin',
    false
  );
$$;

CREATE OR REPLACE FUNCTION is_employee()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb ->> 'user_role' IN ('admin', 'employee'),
    false
  );
$$;

CREATE OR REPLACE FUNCTION current_customer_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id FROM customer_profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION current_employee_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id FROM employees WHERE user_id = auth.uid();
$$;

-- ─── customer_profiles ───────────────────────────────────────────────────────

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_own_profile"
  ON customer_profiles FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_employee())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- ─── employees ───────────────────────────────────────────────────────────────

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_read_own"
  ON employees FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "admin_manage_employees"
  ON employees FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ─── supply_categories ───────────────────────────────────────────────────────

ALTER TABLE supply_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_read_categories"
  ON supply_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_manage_categories"
  ON supply_categories FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── supply_items ─────────────────────────────────────────────────────────────

ALTER TABLE supply_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_read_active_items"
  ON supply_items FOR SELECT TO authenticated
  USING (is_active = true OR is_admin());

CREATE POLICY "admin_manage_items"
  ON supply_items FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── kit_contents ────────────────────────────────────────────────────────────

ALTER TABLE kit_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_read_kit_contents"
  ON kit_contents FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_manage_kit_contents"
  ON kit_contents FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── orders ──────────────────────────────────────────────────────────────────

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_own_orders"
  ON orders FOR SELECT TO authenticated
  USING (customer_id = current_customer_id() OR is_admin());

CREATE POLICY "customers_create_orders"
  ON orders FOR INSERT TO authenticated
  WITH CHECK (customer_id = current_customer_id());

CREATE POLICY "admin_manage_orders"
  ON orders FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── order_items ─────────────────────────────────────────────────────────────

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_access"
  ON order_items FOR ALL TO authenticated
  USING (
    order_id IN (SELECT id FROM orders WHERE customer_id = current_customer_id())
    OR is_admin()
  )
  WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE customer_id = current_customer_id())
    OR is_admin()
  );

-- ─── appointments ────────────────────────────────────────────────────────────

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_read_own_appointments"
  ON appointments FOR SELECT TO authenticated
  USING (customer_id = current_customer_id() OR is_employee());

CREATE POLICY "customers_create_appointments"
  ON appointments FOR INSERT TO authenticated
  WITH CHECK (customer_id = current_customer_id());

CREATE POLICY "admin_assign_appointments"
  ON appointments FOR UPDATE TO authenticated
  USING (is_admin());

CREATE POLICY "employee_update_own_appointments"
  ON appointments FOR UPDATE TO authenticated
  USING (employee_id = current_employee_id());

-- ─── visit_records ───────────────────────────────────────────────────────────

ALTER TABLE visit_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_read_own_visit_records"
  ON visit_records FOR SELECT TO authenticated
  USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE customer_id = current_customer_id()
    )
    OR is_employee()
  );

CREATE POLICY "employees_write_visit_records"
  ON visit_records FOR INSERT TO authenticated
  WITH CHECK (employee_id = current_employee_id() OR is_admin());

CREATE POLICY "employees_update_visit_records"
  ON visit_records FOR UPDATE TO authenticated
  USING (employee_id = current_employee_id() OR is_admin());

-- ─── visit_supply_actions ────────────────────────────────────────────────────

ALTER TABLE visit_supply_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visit_actions_access"
  ON visit_supply_actions FOR ALL TO authenticated
  USING (
    visit_record_id IN (
      SELECT vr.id FROM visit_records vr
      JOIN appointments a ON a.id = vr.appointment_id
      WHERE a.customer_id = current_customer_id()
         OR vr.employee_id = current_employee_id()
         OR is_admin()
    )
  );

-- ─── customer_supplies ───────────────────────────────────────────────────────

ALTER TABLE customer_supplies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_read_own_supplies"
  ON customer_supplies FOR SELECT TO authenticated
  USING (customer_id = current_customer_id() OR is_employee());

CREATE POLICY "admin_manage_customer_supplies"
  ON customer_supplies FOR ALL TO authenticated
  USING (is_admin() OR current_employee_id() IS NOT NULL)
  WITH CHECK (is_admin() OR current_employee_id() IS NOT NULL);

-- ─── follow_up_plans ─────────────────────────────────────────────────────────

ALTER TABLE follow_up_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_own_follow_up_plans"
  ON follow_up_plans FOR SELECT TO authenticated
  USING (customer_id = current_customer_id() OR is_employee());

CREATE POLICY "admin_manage_follow_up_plans"
  ON follow_up_plans FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

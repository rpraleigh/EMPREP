-- Emergency preparedness intake fields for customer_profiles
ALTER TABLE customer_profiles
  ADD COLUMN wants_go_kit              BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN wants_shelter_kit         BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN has_infants               BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN has_elderly               BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN pet_count                 INTEGER,
  ADD COLUMN has_service_animal        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN power_dependent_medical   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN refrigerated_medications  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN has_mobility_limitations  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN has_vehicle               BOOLEAN NOT NULL DEFAULT TRUE;

-- ─────────────────────────────────────────────────────────────
-- EMPREP Seed Data
-- Run after migrations to populate the catalog for local dev.
-- ─────────────────────────────────────────────────────────────

-- ── Categories ───────────────────────────────────────────────

INSERT INTO supply_categories (name, slug, description, sort_order) VALUES
  ('Water & Hydration',      'water',    'Water storage, purification, and filtration supplies.',          1),
  ('Food & Nutrition',       'food',     'Emergency food rations, freeze-dried meals, and calorie bars.',  2),
  ('Medical & First Aid',    'medical',  'First aid kits, medications, and protective equipment.',         3),
  ('Shelter & Warmth',       'shelter',  'Emergency blankets, ponchos, and portable shelter.',             4),
  ('Communications & Power', 'comms',    'Radios, power banks, lighting, and backup power sources.',       5),
  ('Documents & Finances',   'docs',     'Waterproof storage for vital documents and records.',            6)
ON CONFLICT (slug) DO NOTHING;


-- ── Individual Items ─────────────────────────────────────────

INSERT INTO supply_items
  (category_id, name, sku, unit, price_cents, shelf_life_months, description)
VALUES

  -- Water & Hydration
  ((SELECT id FROM supply_categories WHERE slug = 'water'),
   'Emergency Water Storage Container (5 gal)', 'WTR-5GAL', 'each', 2499, 60,
   'FDA-grade 5-gallon BPA-free container with spigot. Rated for up to 5 years of sealed storage.'),

  ((SELECT id FROM supply_categories WHERE slug = 'water'),
   'Water Purification Tablets (50 ct)', 'WTR-TAB50', 'pack', 999, 60,
   'Treats up to 50 liters of water. Effective against bacteria, Giardia, and viruses.'),

  ((SELECT id FROM supply_categories WHERE slug = 'water'),
   'Portable Water Filter', 'WTR-FILTER', 'each', 3999, NULL,
   'Filters up to 100,000 gallons. Removes 99.9999% of bacteria and parasites.'),

  -- Food & Nutrition
  ((SELECT id FROM supply_categories WHERE slug = 'food'),
   'Emergency Food Ration Bar (3-day)', 'FOOD-BAR3D', 'each', 1499, 60,
   '2,400 calorie coconut-flavored ration bar. US Coast Guard approved. 3-day supply for one adult.'),

  ((SELECT id FROM supply_categories WHERE slug = 'food'),
   'Freeze-Dried Meal Pack (7-day)', 'FOOD-FD7D', 'kit', 14999, 300,
   'Assorted freeze-dried entrees providing 2,000 cal/day for one adult over 7 days. 25-year shelf life.'),

  ((SELECT id FROM supply_categories WHERE slug = 'food'),
   'Emergency Calorie Bar (2400 cal)', 'FOOD-CAL24', 'each', 899, 60,
   'Compact 400g bar providing 2,400 calories. Vanilla flavor, nut-free, non-thirst-provoking.'),

  -- Medical & First Aid
  ((SELECT id FROM supply_categories WHERE slug = 'medical'),
   'Premium First Aid Kit (200-piece)', 'MED-AID200', 'kit', 4999, 36,
   'Comprehensive kit with bandages, antiseptics, gauze, CPR mask, trauma pads, and first aid guide.'),

  ((SELECT id FROM supply_categories WHERE slug = 'medical'),
   'N95 Respirator Masks (10-pack)', 'MED-N95-10', 'pack', 1999, NULL,
   'NIOSH-approved N95 filtering facepiece respirators. Protection against airborne particles and smoke.'),

  ((SELECT id FROM supply_categories WHERE slug = 'medical'),
   'Emergency Prescription Organizer', 'MED-RXORG', 'each', 1299, NULL,
   'Waterproof, 7-day pill organizer with medication log insert. Fits standard prescription bottles.'),

  ((SELECT id FROM supply_categories WHERE slug = 'medical'),
   'Trauma Wound Care Kit', 'MED-TRAUMA', 'kit', 3499, 36,
   'Tourniquet, hemostatic gauze, chest seals, Israeli bandage, and nitrile gloves.'),

  -- Shelter & Warmth
  ((SELECT id FROM supply_categories WHERE slug = 'shelter'),
   'Emergency Mylar Blanket (4-pack)', 'SHL-MYLAR4', 'pack', 1199, NULL,
   'Retains up to 90% of body heat. Waterproof and windproof. Compact fold, each blanket 52" × 84".'),

  ((SELECT id FROM supply_categories WHERE slug = 'shelter'),
   'Waterproof Emergency Poncho', 'SHL-PONCHO', 'each', 699, NULL,
   'One-size-fits-all disposable emergency poncho. Tear-resistant polyethylene with hood.'),

  ((SELECT id FROM supply_categories WHERE slug = 'shelter'),
   'Portable Emergency Tube Tent (2-person)', 'SHL-TENT2', 'each', 1899, NULL,
   'Sets up in minutes with any rope or cord. 8-foot tube design fits two adults. Orange for visibility.'),

  -- Communications & Power
  ((SELECT id FROM supply_categories WHERE slug = 'comms'),
   'Hand-Crank Emergency Radio (AM/FM/NOAA)', 'COM-RADIO', 'each', 4999, NULL,
   'Receives NOAA Weather Alert broadcasts. Powers via hand crank, solar panel, or USB-C. Built-in LED flashlight.'),

  ((SELECT id FROM supply_categories WHERE slug = 'comms'),
   'Portable Power Bank (20,000mAh)', 'COM-POWER20K', 'each', 5999, NULL,
   'Charges two devices simultaneously via USB-A and USB-C. Also charges via solar panel (sold separately).'),

  ((SELECT id FROM supply_categories WHERE slug = 'comms'),
   'LED Headlamp with Batteries', 'COM-LAMP', 'each', 2499, NULL,
   '350-lumen headlamp with red night-vision mode. Adjustable strap. Includes 3× AAA batteries. IPX4 water resistant.'),

  ((SELECT id FROM supply_categories WHERE slug = 'comms'),
   'Emergency Candles (12-pack, 9hr each)', 'COM-CANDLE12', 'pack', 1499, NULL,
   'Dripless, odorless emergency candles. Each burns approximately 9 hours. 12-pack provides 108 hours of light.'),

  -- Documents & Finances
  ((SELECT id FROM supply_categories WHERE slug = 'docs'),
   'Waterproof Document Bag', 'DOC-BAG', 'each', 1999, NULL,
   'Fireproof and waterproof document pouch. Fits passports, birth certificates, insurance cards, and cash.'),

  ((SELECT id FROM supply_categories WHERE slug = 'docs'),
   'Emergency Document Template Kit', 'DOC-TMPL', 'each', 999, NULL,
   'Printed templates for emergency contacts, medical info, insurance policies, and asset inventory.')

ON CONFLICT (sku) DO NOTHING;


-- ── Kits ─────────────────────────────────────────────────────

INSERT INTO supply_items
  (name, sku, unit, price_cents, is_kit, description)
VALUES
  ('72-Hour Individual Survival Kit', 'KIT-72HR', 'each', 19999, true,
   'Everything one adult needs to shelter in place or evacuate for 72 hours. Includes water, food, first aid, warmth, light, and communication.'),

  ('Family Emergency Preparedness Kit (4-person)', 'KIT-FAMILY4', 'each', 49999, true,
   'Comprehensive 72-hour kit for a family of four. Includes supplies for water, food, medical, shelter, communications, and document storage.')

ON CONFLICT (sku) DO NOTHING;


-- ── Kit Contents ─────────────────────────────────────────────

INSERT INTO kit_contents (kit_id, item_id, quantity)
VALUES
  -- 72-Hour Individual Kit
  ((SELECT id FROM supply_items WHERE sku = 'KIT-72HR'), (SELECT id FROM supply_items WHERE sku = 'WTR-5GAL'),    1),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-72HR'), (SELECT id FROM supply_items WHERE sku = 'WTR-TAB50'),   1),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-72HR'), (SELECT id FROM supply_items WHERE sku = 'FOOD-BAR3D'),  3),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-72HR'), (SELECT id FROM supply_items WHERE sku = 'MED-AID200'),  1),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-72HR'), (SELECT id FROM supply_items WHERE sku = 'SHL-MYLAR4'),  1),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-72HR'), (SELECT id FROM supply_items WHERE sku = 'SHL-PONCHO'),  1),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-72HR'), (SELECT id FROM supply_items WHERE sku = 'COM-RADIO'),   1),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-72HR'), (SELECT id FROM supply_items WHERE sku = 'COM-LAMP'),    1),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-72HR'), (SELECT id FROM supply_items WHERE sku = 'DOC-BAG'),     1),

  -- Family Kit (4-person)
  ((SELECT id FROM supply_items WHERE sku = 'KIT-FAMILY4'), (SELECT id FROM supply_items WHERE sku = 'WTR-5GAL'),      4),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-FAMILY4'), (SELECT id FROM supply_items WHERE sku = 'WTR-TAB50'),     2),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-FAMILY4'), (SELECT id FROM supply_items WHERE sku = 'WTR-FILTER'),    1),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-FAMILY4'), (SELECT id FROM supply_items WHERE sku = 'FOOD-FD7D'),     1),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-FAMILY4'), (SELECT id FROM supply_items WHERE sku = 'FOOD-BAR3D'),    4),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-FAMILY4'), (SELECT id FROM supply_items WHERE sku = 'MED-AID200'),    1),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-FAMILY4'), (SELECT id FROM supply_items WHERE sku = 'MED-N95-10'),    1),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-FAMILY4'), (SELECT id FROM supply_items WHERE sku = 'MED-TRAUMA'),    1),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-FAMILY4'), (SELECT id FROM supply_items WHERE sku = 'SHL-MYLAR4'),    1),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-FAMILY4'), (SELECT id FROM supply_items WHERE sku = 'SHL-PONCHO'),    4),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-FAMILY4'), (SELECT id FROM supply_items WHERE sku = 'SHL-TENT2'),     1),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-FAMILY4'), (SELECT id FROM supply_items WHERE sku = 'COM-RADIO'),     1),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-FAMILY4'), (SELECT id FROM supply_items WHERE sku = 'COM-POWER20K'), 1),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-FAMILY4'), (SELECT id FROM supply_items WHERE sku = 'COM-LAMP'),      2),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-FAMILY4'), (SELECT id FROM supply_items WHERE sku = 'COM-CANDLE12'), 1),
  ((SELECT id FROM supply_items WHERE sku = 'KIT-FAMILY4'), (SELECT id FROM supply_items WHERE sku = 'DOC-BAG'),       1)

ON CONFLICT (kit_id, item_id) DO NOTHING;

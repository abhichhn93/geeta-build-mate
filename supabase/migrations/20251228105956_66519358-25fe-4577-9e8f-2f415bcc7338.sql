-- ==============================================
-- GEETA TRADERS PRODUCT CATALOG RESTRUCTURE
-- ==============================================

-- 1. UPDATE EXISTING CATEGORIES TO MATCH 8-CATEGORY STRUCTURE
-- ==============================================

-- Update TMT Sariya to Construction Steel - TMT Bars
UPDATE categories SET 
  name_en = 'TMT Bars',
  name_hi = 'टीएमटी सरिया',
  icon = 'construction',
  sort_order = 1
WHERE name_en = 'TMT Sariya';

-- Update MS Angles to Structural Steel
UPDATE categories SET 
  name_en = 'Structural Steel',
  name_hi = 'स्ट्रक्चरल स्टील',
  icon = 'ruler',
  sort_order = 2
WHERE name_en = 'MS Angles';

-- Update Binding Wire to Hardware & Consumables (broader category)
UPDATE categories SET 
  name_en = 'Hardware & Consumables',
  name_hi = 'हार्डवेयर व सामग्री',
  icon = 'wrench',
  sort_order = 7
WHERE name_en = 'Binding Wire';

-- Keep Cement as is, update sort
UPDATE categories SET 
  sort_order = 4
WHERE name_en = 'Cement';

-- Rename Stirrups to Services (Ring Making etc)
UPDATE categories SET 
  name_en = 'Services',
  name_hi = 'सेवाएं',
  icon = 'settings',
  sort_order = 8
WHERE name_en = 'Stirrups';

-- Rename Fasteners to be absorbed into Hardware or delete if no products
DELETE FROM categories WHERE name_en = 'Fasteners' AND id NOT IN (SELECT DISTINCT category_id FROM products WHERE category_id IS NOT NULL);

-- 2. ADD NEW CATEGORIES
-- ==============================================

-- Pipes & Tubes
INSERT INTO categories (name_en, name_hi, icon, sort_order)
VALUES ('Pipes & Tubes', 'पाइप व ट्यूब', 'cylinder', 3)
ON CONFLICT DO NOTHING;

-- Roofing & Sheets
INSERT INTO categories (name_en, name_hi, icon, sort_order)
VALUES ('Roofing & Sheets', 'शीट व छत', 'layout-grid', 5)
ON CONFLICT DO NOTHING;

-- Solar & GI Structures
INSERT INTO categories (name_en, name_hi, icon, sort_order)
VALUES ('Solar & GI Structures', 'सोलर व जीआई स्ट्रक्चर', 'sun', 6)
ON CONFLICT DO NOTHING;

-- 3. ADD MISSING BRANDS FOR TMT
-- ==============================================

-- Get TMT category ID for brand assignment
DO $$
DECLARE
  tmt_cat_id uuid;
  cement_cat_id uuid;
BEGIN
  SELECT id INTO tmt_cat_id FROM categories WHERE name_en = 'TMT Bars' LIMIT 1;
  SELECT id INTO cement_cat_id FROM categories WHERE name_en = 'Cement' LIMIT 1;

  -- TMT Brands
  INSERT INTO brands (name, category_id) VALUES ('Kamdhenu NXT', tmt_cat_id) ON CONFLICT DO NOTHING;
  INSERT INTO brands (name, category_id) VALUES ('Kay 2', tmt_cat_id) ON CONFLICT DO NOTHING;
  INSERT INTO brands (name, category_id) VALUES ('Ankur', tmt_cat_id) ON CONFLICT DO NOTHING;
  INSERT INTO brands (name, category_id) VALUES ('Singhal', tmt_cat_id) ON CONFLICT DO NOTHING;
  INSERT INTO brands (name, category_id) VALUES ('Radhe', tmt_cat_id) ON CONFLICT DO NOTHING;
  INSERT INTO brands (name, category_id) VALUES ('Tata Tiscon', tmt_cat_id) ON CONFLICT DO NOTHING;
  
  -- Cement Brands
  INSERT INTO brands (name, category_id) VALUES ('Bangur Power', cement_cat_id) ON CONFLICT DO NOTHING;
  INSERT INTO brands (name, category_id) VALUES ('Bangur Megna', cement_cat_id) ON CONFLICT DO NOTHING;
  INSERT INTO brands (name, category_id) VALUES ('Mycem', cement_cat_id) ON CONFLICT DO NOTHING;
  INSERT INTO brands (name, category_id) VALUES ('Dalmia', cement_cat_id) ON CONFLICT DO NOTHING;
END $$;
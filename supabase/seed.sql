-- Geeta Traders v2 — starting catalog and today's rates.
-- Run once, after 0001_init.sql. Golu edits everything in-app afterwards.

insert into categories (name_hi, name_en, unit, image_key, sort_order, is_active) values
  ('सीमेंट',          'Cement',          'bag',   'cement_bag',           1,  true),
  ('सरिया',           'TMT Sariya',      'kg',    'tmt_bar',              2,  true),
  ('एंगल',            'Angle',           'kg',    'ms_angle',             3,  true),
  ('पट्टी / प्लेट',     'Plate / Patti',   'kg',    'ms_angle',             4,  true),
  ('सोलर स्ट्रक्चर',    'Solar Structure', 'piece', 'solar_mounting_rail',  5,  true),
  ('स्प्रिंग',          'Spring',          'kg',    'spring',               6,  true),
  ('नट बोल्ट',         'Nut Bolt',        'kg',    'nut_bolt',             7,  true),
  ('पाइप',            'Pipe',            'kg',    'ms_round_pipe',        8,  false),
  ('चादर',            'Sheet',           'piece', 'colour_profile_sheet', 9,  false),
  ('बाइंडिंग तार',      'Binding Wire',    'kg',    'binding_wire',         10, false);

-- variants: (category name_en, brand, size, sort_order, price or null)
with v(cat, brand, size, sort, price) as (values
  ('Cement', 'ACC',       null, 1, 340),
  ('Cement', 'अल्ट्राटेक', null, 2, 340),
  ('Cement', 'अंबुजा',     null, 3, 340),
  ('Cement', 'बांगुर',     null, 4, 340),
  ('Cement', 'मायसेम',     null, 5, 340),
  ('Cement', 'डालमिया',    null, 6, 340),

  ('TMT Sariya', 'कामधेनु',     '8mm',  10, 62),
  ('TMT Sariya', 'कामधेनु',     '10mm', 11, 63),
  ('TMT Sariya', 'कामधेनु',     '12mm', 12, 64),
  ('TMT Sariya', 'कामधेनु',     '16mm', 13, 64),
  ('TMT Sariya', 'कामधेनु NXT', '8mm',  20, null),
  ('TMT Sariya', 'कामधेनु NXT', '10mm', 21, null),
  ('TMT Sariya', 'कामधेनु NXT', '12mm', 22, null),
  ('TMT Sariya', 'टाटा',        '8mm',  30, 68),
  ('TMT Sariya', 'टाटा',        '10mm', 31, 69),
  ('TMT Sariya', 'टाटा',        '12mm', 32, 70),
  ('TMT Sariya', 'टाटा टिस्कॉन',  '8mm',  40, null),
  ('TMT Sariya', 'टाटा टिस्कॉन',  '10mm', 41, null),
  ('TMT Sariya', 'टाटा टिस्कॉन',  '12mm', 42, null),
  ('TMT Sariya', 'जिंदल',       '8mm',  50, 65),
  ('TMT Sariya', 'जिंदल',       '10mm', 51, 66),
  ('TMT Sariya', 'जिंदल',       '12mm', 52, 67),
  ('TMT Sariya', 'Kay2',        '8mm',  60, 59),
  ('TMT Sariya', 'Kay2',        '10mm', 61, 60),
  ('TMT Sariya', 'Kay2',        '12mm', 62, 61),
  ('TMT Sariya', 'सिंघल',       '8mm',  70, 57),
  ('TMT Sariya', 'सिंघल',       '10mm', 71, 58),
  ('TMT Sariya', 'सिंघल',       '12mm', 72, 59),
  ('TMT Sariya', 'अंकुर',       '8mm',  80, null),
  ('TMT Sariya', 'अंकुर',       '10mm', 81, 59),
  ('TMT Sariya', 'अंकुर',       '12mm', 82, 59),

  ('Angle', null, '25x25', 1, null),
  ('Angle', null, '40x40', 2, null),
  ('Angle', null, '50x50', 3, null),

  ('Plate / Patti', null, '25x25', 1, null),
  ('Plate / Patti', null, '40x40', 2, null),
  ('Plate / Patti', null, '50x50', 3, null),

  ('Solar Structure', null, 'Base Plate', 1, null),
  ('Solar Structure', null, 'Clamp',      2, null),
  ('Solar Structure', null, 'Purlin',     3, null),

  ('Spring',   null, null, 1, null),
  ('Nut Bolt', null, null, 1, null)
),
ins as (
  insert into variants (category_id, brand, size, sort_order)
  select c.id, v.brand, v.size, v.sort
  from v join categories c on c.name_en = v.cat
  returning id, category_id, brand, size
)
insert into rates (variant_id, price)
select ins.id, v.price
from ins
join categories c on c.id = ins.category_id
join v on v.cat = c.name_en
      and v.brand is not distinct from ins.brand
      and v.size  is not distinct from ins.size
where v.price is not null;

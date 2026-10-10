-- v2.1 — allow gram-level quantities on weight-sold goods.
-- numeric(10,2) rounded 154 kg 325 g to 154.33; steel is sold by weight, so give it grams.
-- Additive and safe: widening scale preserves every existing row.

alter table order_items
  alter column ordered_qty   type numeric(10,3),
  alter column fulfilled_qty type numeric(10,3);

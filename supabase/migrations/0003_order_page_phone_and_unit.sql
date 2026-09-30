-- Paste into Supabase SQL Editor → Run.
--
-- 1. get_order_page now also returns the known customer's primary phone
--    (VIP links only; 'public' still returns null), so the order form can
--    prefill it the same way it already prefills the name.
-- 2. Fixes a bug: order_items.unit is NOT NULL, but the client wasn't
--    sending it, so every place_order call was silently failing.
--    That's a client-side fix (already applied), not a SQL change — this
--    migration only adds the phone lookup.

create or replace function get_order_page(p_token text, p_device text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_cust customers; v_result jsonb;
begin
  select * into v_cust from customers where link_token = p_token;

  if p_token <> 'public' then
    if v_cust.id is null then return jsonb_build_object('error','invalid'); end if;
    if p_device is not null then
      if v_cust.claimed_by is null then
        update customers set claimed_by = p_device where id = v_cust.id;
      elsif v_cust.claimed_by <> p_device then
        return jsonb_build_object('error','claimed');
      end if;
    end if;
  end if;

  select jsonb_build_object(
    'customer_name', v_cust.name,
    'customer_phone', (
      select phone from customer_phones
      where customer_id = v_cust.id
      order by is_primary desc
      limit 1
    ),
    'shop_phone', (select value from app_settings where key = 'shop_phone'),
    'items', coalesce(jsonb_agg(jsonb_build_object(
        'variant_id', v.id, 'category_hi', c.name_hi, 'category_en', c.name_en,
        'unit', c.unit, 'image_key', c.image_key,
        'brand', v.brand, 'size', v.size,
        'available', v.is_available, 'price', r.price
      ) order by c.sort_order, v.sort_order), '[]'::jsonb)
  ) into v_result
  from variants v
  join categories c on c.id = v.category_id
  left join lateral (
    select price from rates where variant_id = v.id order by rate_date desc limit 1
  ) r on true
  where v.is_active and c.is_active;

  return v_result;
end $$;

-- The seeded closing_line has 🙏, which showed as a broken symbol on
-- Golu's Android phone (see get_order_page comment above) — same fix.
update app_settings set value = 'आपका दिन शुभ हो' where key = 'closing_line' and value = 'आपका दिन शुभ हो 🙏';

-- v2.1 — VIP pricing. Nullable: null means "same as general" so Golu
-- doesn't have to type a second number for every item every morning.
-- Paste into Supabase SQL Editor → Run. Additive — nothing dropped.

alter table rates add column if not exists price_vip numeric(10,2);

-- latest_rates (used by the रेट screen) now also carries the VIP price.
create or replace view latest_rates with (security_invoker = true) as
select distinct on (variant_id) variant_id, rate_date, price, price_vip
from rates
order by variant_id, rate_date desc;

-- get_order_page: a VIP customer's personal link now returns price_vip
-- (falling back to the general price where it's null); 'public' and any
-- non-VIP customer always get the general price. Nothing else here changed.
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
        'available', v.is_available,
        'price', case
          when v_cust.tier = 'vip' then coalesce(r.price_vip, r.price)
          else r.price
        end
      ) order by c.sort_order, v.sort_order), '[]'::jsonb)
  ) into v_result
  from variants v
  join categories c on c.id = v.category_id
  left join lateral (
    select price, price_vip from rates where variant_id = v.id order by rate_date desc limit 1
  ) r on true
  where v.is_active and c.is_active;

  return v_result;
end $$;

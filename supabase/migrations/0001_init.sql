-- Geeta Traders v2 — schema, RLS, public functions.
-- Paste into Supabase dashboard → SQL Editor → Run. Then run seed.sql.

create extension if not exists pgcrypto with schema extensions;

-- ============ CATALOG ============

create table categories (
  id          uuid primary key default gen_random_uuid(),
  name_hi     text not null,
  name_en     text not null,
  unit        text not null check (unit in ('bag','kg','piece')),
  image_key   text,                    -- filename in src/assets/products/, no extension
  sort_order  int  not null default 0,
  is_active   boolean not null default true
);

-- A variant is one sellable line: category + optional brand + optional size.
create table variants (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references categories(id) on delete cascade,
  brand        text,
  size         text,
  is_available boolean not null default true,
  sort_order   int not null default 0,
  is_active    boolean not null default true
);
create index on variants(category_id);

-- One price per variant per day. Gives rate history for free.
create table rates (
  variant_id uuid not null references variants(id) on delete cascade,
  rate_date  date not null default current_date,
  price      numeric(10,2) not null,
  updated_at timestamptz not null default now(),
  primary key (variant_id, rate_date)
);

-- ============ CUSTOMERS ============

create table customers (
  id            uuid primary key default gen_random_uuid(),
  name          text,
  shop_name     text,
  address       text,
  tier          text not null default 'regular' check (tier in ('vip','regular')),
  opted_out     boolean not null default false,
  link_token    text not null unique default encode(extensions.gen_random_bytes(6),'hex'),
  claimed_by    text,                  -- device id; null = unclaimed
  created_at    timestamptz not null default now()
);
create index on customers(tier) where opted_out = false;

create table customer_phones (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  phone       text not null unique,    -- 10 digits, no +91
  is_primary  boolean not null default false
);
create index on customer_phones(customer_id);

-- ============ ORDERS ============

create table orders (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid references customers(id),
  customer_name  text,
  customer_phone text,
  note           text,
  status         text not null default 'new' check (status in ('new','done')),
  created_at     timestamptz not null default now()
);
create index on orders(created_at desc);

create table order_items (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references orders(id) on delete cascade,
  variant_id          uuid references variants(id),
  label               text not null,
  unit                text not null,
  ordered_qty         numeric(10,2) not null,
  fulfilled_qty       numeric(10,2),   -- null in v1
  unit_price_at_order numeric(10,2)
);
create index on order_items(order_id);

-- ============ SEND LOG ============

create table sends (
  id          uuid primary key default gen_random_uuid(),
  send_date   date not null default current_date,
  customer_id uuid references customers(id),   -- null = broadcast
  kind        text not null check (kind in ('vip','broadcast')),
  sent_at     timestamptz not null default now()
);
create index on sends(send_date);

-- ============ SETTINGS ============

create table app_settings (
  key   text primary key,
  value text
);
insert into app_settings(key,value) values
  ('shop_phone','919999999999'),
  ('closing_line','आपका दिन शुभ हो 🙏'),
  ('public_link_token','public');

-- ============ RLS ============

alter table categories      enable row level security;
alter table variants        enable row level security;
alter table rates           enable row level security;
alter table customers       enable row level security;
alter table customer_phones enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;
alter table sends           enable row level security;
alter table app_settings    enable row level security;

-- Only Golu and the helper have accounts, so "any authenticated user" is correct here.
create policy admin_all on categories      for all using (auth.role() = 'authenticated');
create policy admin_all on variants        for all using (auth.role() = 'authenticated');
create policy admin_all on rates           for all using (auth.role() = 'authenticated');
create policy admin_all on customers       for all using (auth.role() = 'authenticated');
create policy admin_all on customer_phones for all using (auth.role() = 'authenticated');
create policy admin_all on orders          for all using (auth.role() = 'authenticated');
create policy admin_all on order_items     for all using (auth.role() = 'authenticated');
create policy admin_all on sends           for all using (auth.role() = 'authenticated');
create policy admin_all on app_settings    for all using (auth.role() = 'authenticated');

-- ============ PUBLIC FUNCTIONS ============
-- Customers never touch tables directly; everything goes through these.

-- Catalog + latest rates for the order page.
-- p_device: null on first load (link-preview safe), set when the user taps "view rates".
create or replace function get_order_page(p_token text, p_device text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_cust customers; v_result jsonb;
begin
  select * into v_cust from customers where link_token = p_token;

  -- 'public' is the shared broadcast link: always allowed, never device-locked
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

create or replace function place_order(
  p_token text, p_name text, p_phone text, p_note text, p_items jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_cust_id uuid; v_order_id uuid; v_item jsonb;
begin
  if p_phone is null or length(regexp_replace(p_phone,'\D','','g')) <> 10 then
    raise exception 'invalid phone';
  end if;
  p_phone := regexp_replace(p_phone,'\D','','g');

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'empty order';
  end if;

  select id into v_cust_id from customers where link_token = p_token and p_token <> 'public';
  if v_cust_id is null then
    select customer_id into v_cust_id from customer_phones where phone = p_phone;
  end if;
  if v_cust_id is null then
    insert into customers(name) values (p_name) returning id into v_cust_id;
    insert into customer_phones(customer_id,phone,is_primary)
      values (v_cust_id,p_phone,true) on conflict (phone) do nothing;
  end if;

  insert into orders(customer_id,customer_name,customer_phone,note)
    values (v_cust_id,p_name,p_phone,p_note) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into order_items(order_id,variant_id,label,unit,ordered_qty,unit_price_at_order)
    values (v_order_id, (v_item->>'variant_id')::uuid, v_item->>'label',
            v_item->>'unit', (v_item->>'qty')::numeric, (v_item->>'price')::numeric);
  end loop;

  return v_order_id;
end $$;

revoke all on function get_order_page(text, text) from public;
revoke all on function place_order(text, text, text, text, jsonb) from public;
grant execute on function get_order_page(text, text) to anon, authenticated;
grant execute on function place_order(text, text, text, text, jsonb) to anon, authenticated;

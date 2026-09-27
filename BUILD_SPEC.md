# Geeta Traders v2 — Build Spec

Implementation spec for Sonnet. Architecture decisions are made; follow them. Where this
document is silent, prefer the simplest thing that works.

---

## 0. Locked decisions (do not redesign these)

| Decision | Choice |
|---|---|
| Approach | Fresh start in this repo, new branch. Wipe `src/` and `supabase/migrations/`. |
| Keep from old app | `src/assets/products/*.png` (20 files), `src/assets/geeta-traders-logo.png`, `tailwind.config.ts`, the CSS variables in `src/index.css`, installed shadcn components |
| Stack | Vite + React + TS + Tailwind + shadcn/ui + Supabase free + Vercel free |
| Language | **Hindi default**, English toggle in header |
| Admin auth | Supabase magic link, session persists indefinitely. No password, no login screen after first time. |
| Customer auth | None. Token in URL. |
| Stock | `is_available` boolean only. **Do not create any quantity field.** |
| Screens | 4 admin (Rates / Send / Orders / Customers) + 1 public order page |
| VIP count | 50 |
| Platforms | iPhone + Android, both via browser. PWA installable. |

**The framing that drives everything:** this is not two features. The morning rate message
*contains* the order link. Golu's ritual is "send today's rates" — ordering is what
customers do with that message. Build toward that single flow.

---

## 1. Schema

Single migration. Note there are **6 RLS policies total**, not 52 — public access goes
through SECURITY DEFINER functions instead of per-row policies. This is deliberate; the
old app's auth-keyed policy web is what made it unmaintainable.

```sql
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
-- TMT/Kamdhenu/8mm is a variant. Cement/ACC is a variant (no size).
-- Angle/null/40x40mm is a variant (no brand).
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
  name          text,                  -- what Golu types: "मुकेश"
  shop_name     text,
  address       text,
  tier          text not null default 'regular' check (tier in ('vip','regular')),
  opted_out     boolean not null default false,
  link_token    text not null unique default encode(gen_random_bytes(6),'hex'),
  claimed_by    text,                  -- device id; null = unclaimed
  created_at    timestamptz not null default now()
);
create index on customers(tier) where opted_out = false;

create table customer_phones (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  phone       text not null unique,    -- store as 10 digits, no +91
  is_primary  boolean not null default false
);
create index on customer_phones(customer_id);

-- ============ ORDERS ============

create table orders (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid references customers(id),   -- null if unknown walk-in
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
  label               text not null,   -- "कामधेनु सरिया 8mm" frozen at order time
  unit                text not null,
  ordered_qty         numeric(10,2) not null,
  fulfilled_qty       numeric(10,2),   -- null in v1. Billing later = sum(fulfilled*price)
  unit_price_at_order numeric(10,2)
);
create index on order_items(order_id);

-- ============ SEND LOG ============
-- Powers the VIP tick-off UI and answers "did Mukesh get today's rate?"

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
```

### RLS — 6 policies, that's all

```sql
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
```

Public (customer) access uses **no policies** — it goes through these two functions:

```sql
-- Returns catalog + today's rates for the order page.
-- device_id: null on first load (preview/crawler safe), set when user taps "view rates".
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

revoke all on function get_order_page from public;
revoke all on function place_order  from public;
grant execute on function get_order_page to anon;
grant execute on function place_order  to anon;
```

**Why this shape:** customers never touch a table directly, so there is nothing to write
per-customer policies for. Adding a feature later means adding a function, not auditing
52 policies.

---

## 2. Seed catalog

Golu edits all of this in-app afterwards. The point of seeding is **zero empty states** —
he must be able to send tomorrow's rate within two minutes of first opening the app.

Categories (`unit`, `image_key`):

| name_hi | name_en | unit | image_key |
|---|---|---|---|
| सीमेंट | Cement | bag | `cement_bag` |
| सरिया | TMT Sariya | kg | `tmt_bar` |
| एंगल | Angle | kg | `ms_angle` |
| पट्टी / प्लेट | Plate / Patti | kg | `ms_angle` |
| सोलर स्ट्रक्चर | Solar Structure | piece | `solar_mounting_rail` |
| स्प्रिंग | Spring | kg | `spring` |
| नट बोल्ट | Nut Bolt | kg | `nut_bolt` |
| पाइप | Pipe | kg | `ms_round_pipe` |
| चादर | Sheet | piece | `colour_profile_sheet` |
| बाइंडिंग तार | Binding Wire | kg | `binding_wire` |

Pipe/Sheet/Wire seeded as `is_active = false` — they exist, Golu switches them on if he
sells them. That answers the open question without having to ask it.

Variants — seed from the old app's rate board screenshot:
- **Cement**: ACC, अल्ट्राटेक, अंबुजा, बांगुर, मायसेम, डालमिया (no size)
- **सरिया**: Ankur, Jindal, Kamdhenu, Kamdhenu NXT, Kay2, Singhal, Tata, TATA Tiscon —
  each with sizes 8mm / 10mm / 12mm (add 16mm for Kamdhenu)
- **एंगल / पट्टी**: no brand; sizes 25x25, 40x40, 50x50
- **सोलर स्ट्रक्चर**: no brand; Base Plate, Clamp, Purlin
- **स्प्रिंग / नट बोल्ट**: no brand, no size — one variant each

Seed today's `rates` with the prices visible in the screenshot (Kamdhenu 8mm ₹62, 10mm ₹63,
12mm ₹64, 16mm ₹64; Tata 8mm ₹68, 10mm ₹69, 12mm ₹70; Jindal 8mm ₹65, 10mm ₹66, 12mm ₹67;
Kay2 8mm ₹59, 10mm ₹60, 12mm ₹61; Singhal 8mm ₹57, 10mm ₹58, 12mm ₹59; Ankur 10-25mm ₹59).
Cement ₹340 placeholder.

---

## 3. Screens

Bottom nav, 4 tabs, Hindi labels: **रेट · भेजें · ऑर्डर · ग्राहक**

### 3.1 रेट (home)

The home screen *is* the rate editor. Not a dashboard.

- One collapsible card per active category, showing the category image, Hindi name, unit,
  and a status chip: **✓ आज अपडेट** (green) or **⚠ अपडेट बाकी** (amber)
- Expanded: rows of variants. Each row = brand + size label, a number input, and an
  availability toggle
- **Yesterday's price is pre-filled.** He edits only what moved. Saving writes a row for
  today; untouched variants carry forward automatically on read (the `order by rate_date
  desc limit 1` in `get_order_page` handles this — no cron needed)
- Number inputs: `inputMode="decimal"`, large tap targets (min 44px), ₹ prefix
- Autosave on blur with a brief inline confirmation. No Save button to forget.
- Sticky bottom bar: **आज का रेट भेजें →** goes to the Send tab

### 3.2 भेजें (Send)

Two blocks, broadcast first because it covers the most people fastest.

**Block A — ब्रॉडकास्ट (सभी ग्राहक)**
- Preview of the exact message in a bordered card
- Big button **मैसेज कॉपी करें** → copies to clipboard → button turns green,
  "कॉपी हो गया ✓", and a hint appears: *WhatsApp खोलें → ब्रॉडकास्ट लिस्ट → पेस्ट करें*
- Second button **WhatsApp खोलें** (plain `https://wa.me/`)
- Logs a `sends` row with `kind='broadcast'`

**Block B — VIP (नाम के साथ) — 50 लोग**
- Header: progress **"32 / 50 भेजा गया"** + a reset-for-today link
- List of VIP customers. Each row: checkbox (all checked by default), name, phone,
  and a state chip — grey (pending) / green ✓ (sent today)
- Tapping a row opens `wa.me/<phone>?text=<personalised>` in a new tab **and immediately**
  marks it sent (insert into `sends`) and scrolls the next pending row into view
- Unchecking a row just skips it
- **Be honest in the UI**: a one-line note under the header reading
  *"एक-एक करके भेजना होगा — WhatsApp खुलेगा, भेजें दबाएँ, वापस आएँ"* so Golu is never
  surprised by the loop
- Selecting/deselecting all is a single header control

Sent-state is derived from `sends` where `send_date = current_date`, so closing the app
mid-way loses nothing.

### 3.3 ऑर्डर (Orders)

- Newest first. Card per order: customer name, phone, time-ago, item count, and the items
  as a compact list
- Tap → expands: full items, note, **WhatsApp पर जवाब दें** button (`wa.me/<their phone>`),
  and **पूरा हुआ** to mark done
- Unfulfilled orders get a subtle amber left border; done ones fade back
- Badge on the tab showing count of `status='new'`

### 3.4 ग्राहक (Customers)

A list, not a workflow.

- Search by name or phone
- Row: name, shop name, phone, VIP star (tap to toggle tier), opted-out state
- Add customer: name, shop name, phone, address — all optional except phone
- Edit sheet also has: **दूसरा नंबर जोड़ें** (adds to `customer_phones`),
  **लिंक रीसेट करें** (clears `claimed_by`), and **कॉपी लिंक**
- A **ब्रॉडकास्ट लिस्ट मिलाएँ** screen: shows all non-opted-out phone numbers as one
  copyable block, so Golu can reconcile against his WhatsApp list periodically. This
  exists because the two lists *will* drift.

### 3.5 Public order page — `/o/:token`

**One screen. No category grid, no search, no filters.** There are only ~40 variants.

- Header: shop logo, "आज का रेट", date
- First load shows a single button **आज का रेट देखें** — do *not* claim the device before
  this tap. WhatsApp prefetches link previews and would otherwise burn the claim.
- After tap: flat list grouped by category heading. Each row: image thumbnail (32px),
  label, price with unit, and a **− qty +** stepper. Out-of-stock rows are greyed with
  **स्टॉक ख़त्म** and no stepper.
- Sticky footer appears once anything is added: item count, running total,
  **ऑर्डर भेजें** button
- Order form: name (prefilled if known), phone (required, 10 digits), optional note
- On submit: call `place_order`, then open `wa.me/<shop_phone>?text=<order summary>` so a
  copy lands in Golu's WhatsApp too. Show a success screen either way — the order is
  already saved, WhatsApp is a bonus, not the critical path.
- Success screen carries a **हमारा नंबर सेव करें** button that downloads a vCard named
  "गीता ट्रेडर्स". This is what makes broadcast delivery work later.
- If `error = 'claimed'`: friendly message — *"यह लिंक किसी और फ़ोन पर खुल चुका है।
  गीता ट्रेडर्स से नया लिंक माँगें।"*

---

## 4. Message formats

Build these in `src/lib/message.ts`, one function, two greetings.

```
{greeting}

*गीता ट्रेडर्स* — आज का रेट
📅 {date in Hindi}
━━━━━━━━━━━━━━

*सीमेंट* (प्रति बोरी)
• ACC — ₹340
• अंबुजा — ₹345

*सरिया* (प्रति किलो)
• कामधेनु 8mm — ₹62
• कामधेनु 10mm — ₹63
• टाटा 8mm — ₹68

━━━━━━━━━━━━━━
ऑर्डर करें 👇
{link}

{closing_line from app_settings}
```

- VIP greeting: `{name} जी, नमस्ते 🙏` · Broadcast greeting: `प्रिय ग्राहक, नमस्ते 🙏`
- VIP link: `https://<domain>/o/{customer.link_token}` (device-locked)
- Broadcast link: `https://<domain>/o/public` (shared, **not** device-locked — one message
  to 150 people can only carry one link. Rate secrecy leaks here by design; say so.)
- Skip out-of-stock variants and any variant with no price
- `encodeURIComponent` the whole thing for `wa.me`

---

## 5. Build order

1. **Branch + clear.** `git checkout -b v2`. Delete `src/` except `assets/`, `index.css`,
   `main.tsx`; delete `supabase/migrations/*` and `supabase/functions/*`. Keep
   `tailwind.config.ts`, `components.json`, `package.json`. Remove Capacitor deps.
2. **Migration + seed.** The SQL above, then a seed script for catalog and today's rates.
3. **Supabase client + auth.** Magic link, `persistSession: true`, `autoRefreshToken: true`.
   A thin `<RequireAuth>` wrapper. First-run sends a link; after that it never asks again.
4. **Shell.** Bottom nav, 4 routes, Hindi/English toggle in header, PWA manifest +
   `apple-touch-icon` so "Add to Home Screen" looks right on iOS.
5. **रेट screen.** The most important screen — get the price-carry-forward and autosave
   right before moving on.
6. **message.ts + भेजें screen.** Broadcast block first, then the VIP queue.
7. **Public order page.** Both RPC calls, the claim flow, the vCard.
8. **ऑर्डर + ग्राहक screens.**
9. **Deploy.** Vercel, env vars, custom domain if there is one.
10. **Vercel cron** hitting a trivial endpoint every 5 days so the Supabase free tier
    never pauses.

---

## 6. Explicitly NOT in v1

Do not build, do not add fields for: stock quantity, billing or invoices, outstanding
balances or payments, delivery tracking, multi-branch stock, voice input, OCR, Tally sync,
a TMT calculator, customer login, analytics dashboards, chat.

`fulfilled_qty` exists as a nullable column and is the *only* concession to the future.
Leave it null.

---

## 7. UI quality bar

Reference the old app's look — it was the good part. Teal primary (`--primary: 174 72% 40%`),
white cards on `0 0% 97%` background, soft rounded corners, generous spacing.

- **Hindi first**, Devanagari at comfortable size — never below 15px
- Tap targets minimum 44px; this is used one-handed, at 7am, possibly outdoors
- Every action gives visible feedback. **Nothing fails silently** — a failed save, a
  failed order, a failed copy must all surface. Silent failure is how trust dies in week two.
- Loading states everywhere; rural connections are slow
- Test at 360px width (common Android) and on iPhone Safari with the home-screen PWA

---

## 8. Note for whoever picks this up later

The rule that keeps this alive: **any feature requested after launch waits 30 days.** If it
is still wanted after 30 days of real use, build it. Version 1 of this app died from
accumulating features nobody had asked for twice.

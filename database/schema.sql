-- SwiftDrop — Supabase/Postgres schema (ecommerce)

begin;

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists citext;

-- Enums
do $$ begin
  create type public.user_role as enum ('owner','admin','staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_status as enum ('draft','active','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'pending',
    'processing',
    'paid',
    'fulfilled',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum (
    'unpaid',
    'requires_action',
    'processing',
    'paid',
    'failed',
    'refunded',
    'partially_refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fulfillment_status as enum (
    'unfulfilled',
    'partial',
    'fulfilled',
    'shipped',
    'delivered',
    'returned',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.address_type as enum ('shipping','billing');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.cart_status as enum ('active','converted','abandoned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_provider as enum ('stripe','mercadopago','manual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_intent_status as enum (
    'requires_payment_method',
    'requires_confirmation',
    'requires_action',
    'processing',
    'succeeded',
    'canceled',
    'failed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.shipment_status as enum (
    'pending',
    'label_created',
    'shipped',
    'delivered',
    'returned',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.promotion_type as enum ('percent','fixed','free_shipping');
exception when duplicate_object then null; end $$;

-- Common triggers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Admin users (who can manage everything)
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'staff',
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger admin_users_set_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.disabled_at is null
  );
$$;

-- Customers
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  email citext,
  full_name text,
  phone text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_user_id_idx on public.customers(user_id);
create index if not exists customers_email_idx on public.customers(email);

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

-- Auto-create customer row on Supabase Auth signup
-- This keeps the rest of the schema (carts/orders RLS) functional out-of-the-box.
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customers (user_id, email, full_name, metadata)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    jsonb_build_object('source', 'auth.users')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();

-- Customer addresses
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text,
  is_default boolean not null default false,
  name text,
  phone text,
  line1 text not null,
  line2 text,
  city text,
  region text,
  postal_code text,
  country text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_addresses_customer_id_idx on public.customer_addresses(customer_id);

create trigger customer_addresses_set_updated_at
before update on public.customer_addresses
for each row execute function public.set_updated_at();

-- Ensure only one default address per customer
create or replace function public.enforce_single_default_address()
returns trigger
language plpgsql
as $$
begin
  if new.is_default then
    update public.customer_addresses
      set is_default = false,
          updated_at = now()
    where customer_id = new.customer_id
      and id <> new.id
      and is_default = true;
  end if;

  return new;
end;
$$;

drop trigger if exists customer_addresses_one_default on public.customer_addresses;
create trigger customer_addresses_one_default
after insert or update of is_default
on public.customer_addresses
for each row
when (new.is_default = true)
execute function public.enforce_single_default_address();

-- Categories (hierarchical: subcategory is a category with parent_id)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  cover_image_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_unique unique (slug)
);

create index if not exists categories_parent_id_idx on public.categories(parent_id);
create index if not exists categories_is_active_idx on public.categories(is_active);

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  legacy_product_id int unique,
  slug text not null,
  name text not null,
  description text,
  status public.product_status not null default 'draft',
  is_published boolean not null default false,
  badge text,
  currency char(3) not null default 'USD',
  base_price_cents int not null check (base_price_cents >= 0),
  compare_at_price_cents int check (compare_at_price_cents is null or compare_at_price_cents >= 0),
  primary_image_url text,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_slug_unique unique (slug)
);

create index if not exists products_status_idx on public.products(status);
create index if not exists products_is_published_idx on public.products(is_published);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- Product images
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt_text text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx on public.product_images(product_id);
create index if not exists product_images_position_idx on public.product_images(product_id, position);

-- Product-category relationship (many-to-many, with primary flag)
create table if not exists public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (product_id, category_id)
);

create index if not exists product_categories_category_id_idx on public.product_categories(category_id);

-- Variants (size/color/etc stored in option_values)
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text,
  title text,
  option_values jsonb not null default '{}'::jsonb,
  currency char(3) not null default 'USD',
  price_cents int check (price_cents is null or price_cents >= 0),
  compare_at_price_cents int check (compare_at_price_cents is null or compare_at_price_cents >= 0),
  image_url text,
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_sku_unique unique (sku)
);

create index if not exists product_variants_product_id_idx on public.product_variants(product_id);
create index if not exists product_variants_is_active_idx on public.product_variants(is_active);

create trigger product_variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

-- Inventory per variant
create table if not exists public.inventory_items (
  variant_id uuid primary key references public.product_variants(id) on delete cascade,
  track_inventory boolean not null default true,
  stock_on_hand int not null default 0 check (stock_on_hand >= 0),
  reserved int not null default 0 check (reserved >= 0),
  low_stock_threshold int not null default 0 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now()
);

create trigger inventory_items_set_updated_at
before update on public.inventory_items
for each row execute function public.set_updated_at();

-- Carts
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  status public.cart_status not null default 'active',
  currency char(3) not null default 'USD',
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists carts_one_active_per_customer_idx
on public.carts(customer_id)
where customer_id is not null and status = 'active';

create index if not exists carts_customer_id_idx on public.carts(customer_id);

create trigger carts_set_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity int not null check (quantity > 0),
  unit_price_cents int not null check (unit_price_cents >= 0),
  currency char(3) not null default 'USD',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cart_items_cart_id_idx on public.cart_items(cart_id);
create index if not exists cart_items_variant_id_idx on public.cart_items(variant_id);

create unique index if not exists cart_items_unique_variant_per_cart_idx
on public.cart_items(cart_id, variant_id)
where variant_id is not null;

create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated by default as identity,
  customer_id uuid references public.customers(id) on delete set null,
  email citext,
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  fulfillment_status public.fulfillment_status not null default 'unfulfilled',
  currency char(3) not null default 'USD',
  subtotal_cents int not null default 0 check (subtotal_cents >= 0),
  shipping_cents int not null default 0 check (shipping_cents >= 0),
  tax_cents int not null default 0 check (tax_cents >= 0),
  discount_cents int not null default 0 check (discount_cents >= 0),
  total_cents int not null default 0 check (total_cents >= 0),
  placed_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_order_number_unique unique (order_number)
);

create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  sku text,
  title text not null,
  image_url text,
  quantity int not null check (quantity > 0),
  unit_price_cents int not null check (unit_price_cents >= 0),
  tax_cents int not null default 0 check (tax_cents >= 0),
  discount_cents int not null default 0 check (discount_cents >= 0),
  line_total_cents int not null check (line_total_cents >= 0),
  currency char(3) not null default 'USD',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_items_variant_id_idx on public.order_items(variant_id);

create table if not exists public.order_addresses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  type public.address_type not null,
  name text,
  phone text,
  line1 text not null,
  line2 text,
  city text,
  region text,
  postal_code text,
  country text not null,
  created_at timestamptz not null default now(),
  constraint order_addresses_one_per_type unique (order_id, type)
);

create index if not exists order_addresses_order_id_idx on public.order_addresses(order_id);

-- Payments (provider-agnostic)
create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider public.payment_provider not null,
  provider_intent_id text,
  status public.payment_intent_status not null default 'requires_payment_method',
  amount_cents int not null check (amount_cents >= 0),
  currency char(3) not null default 'USD',
  provider_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_intents_provider_intent_unique unique (provider, provider_intent_id)
);

create index if not exists payment_intents_order_id_idx on public.payment_intents(order_id);
create index if not exists payment_intents_status_idx on public.payment_intents(status);

create trigger payment_intents_set_updated_at
before update on public.payment_intents
for each row execute function public.set_updated_at();

create table if not exists public.payment_refunds (
  id uuid primary key default gen_random_uuid(),
  payment_intent_id uuid not null references public.payment_intents(id) on delete cascade,
  provider_refund_id text,
  amount_cents int not null check (amount_cents >= 0),
  currency char(3) not null default 'USD',
  reason text,
  provider_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_refunds_intent_id_idx on public.payment_refunds(payment_intent_id);

-- Shipments
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.shipment_status not null default 'pending',
  carrier text,
  service_level text,
  tracking_number text,
  tracking_url text,
  shipping_cost_cents int not null default 0 check (shipping_cost_cents >= 0),
  currency char(3) not null default 'USD',
  shipped_at timestamptz,
  delivered_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shipments_order_id_idx on public.shipments(order_id);
create index if not exists shipments_status_idx on public.shipments(status);

create trigger shipments_set_updated_at
before update on public.shipments
for each row execute function public.set_updated_at();

-- Promotions
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  type public.promotion_type not null,
  value_percent numeric,
  value_cents int,
  currency char(3) not null default 'USD',
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  usage_limit int,
  per_customer_limit int,
  times_redeemed int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotions_code_unique unique (code),
  constraint promotions_value_check check (
    (type = 'percent' and value_percent is not null and value_percent > 0 and value_percent <= 100 and value_cents is null)
    or (type = 'fixed' and value_cents is not null and value_cents > 0 and value_percent is null)
    or (type = 'free_shipping' and value_percent is null and value_cents is null)
  )
);

create index if not exists promotions_active_idx on public.promotions(active);
create index if not exists promotions_code_idx on public.promotions(code);

create trigger promotions_set_updated_at
before update on public.promotions
for each row execute function public.set_updated_at();

create table if not exists public.order_promotions (
  order_id uuid not null references public.orders(id) on delete cascade,
  promotion_id uuid not null references public.promotions(id) on delete restrict,
  code text,
  discount_cents int not null default 0 check (discount_cents >= 0),
  created_at timestamptz not null default now(),
  primary key (order_id, promotion_id)
);

create index if not exists order_promotions_promotion_id_idx on public.order_promotions(promotion_id);

create table if not exists public.promotion_redemptions (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  redeemed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists promotion_redemptions_promotion_id_idx on public.promotion_redemptions(promotion_id);
create index if not exists promotion_redemptions_customer_id_idx on public.promotion_redemptions(customer_id);

-- Store settings (singleton)
create table if not exists public.store_settings (
  id int primary key default 1,
  store_name text,
  contact_email citext,
  store_description text,
  free_shipping_enabled boolean not null default false,
  international_shipping_enabled boolean not null default false,
  currency char(3) not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_settings_singleton check (id = 1)
);

create trigger store_settings_set_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

insert into public.store_settings(id) values (1)
on conflict (id) do nothing;

-- Webhook events (payment providers, etc.)
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider public.payment_provider not null,
  event_type text not null,
  provider_event_id text,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,
  constraint webhook_events_provider_event_unique unique (provider, provider_event_id)
);

create index if not exists webhook_events_received_at_idx on public.webhook_events(received_at desc);

-- =====================
-- Row Level Security
-- =====================

alter table public.admin_users enable row level security;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory_items enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_addresses enable row level security;
alter table public.payment_intents enable row level security;
alter table public.payment_refunds enable row level security;
alter table public.shipments enable row level security;
alter table public.promotions enable row level security;
alter table public.order_promotions enable row level security;
alter table public.promotion_redemptions enable row level security;
alter table public.store_settings enable row level security;
alter table public.webhook_events enable row level security;

-- Admin users: allow a user to read their own admin row (bootstrap), admins can manage the list
create policy admin_users_self_read
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

create policy admin_users_admin_all
on public.admin_users
for all
using (public.is_admin())
with check (public.is_admin());

-- Public catalog read
create policy categories_public_read
on public.categories
for select
using (is_active = true);

create policy products_public_read
on public.products
for select
using (is_published = true and status = 'active');

create policy product_images_public_read
on public.product_images
for select
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and p.is_published = true
      and p.status = 'active'
  )
);

create policy product_variants_public_read
on public.product_variants
for select
using (
  is_active = true
  and exists (
    select 1 from public.products p
    where p.id = product_variants.product_id
      and p.is_published = true
      and p.status = 'active'
  )
);

create policy product_categories_public_read
on public.product_categories
for select
using (
  exists (
    select 1 from public.products p
    where p.id = product_categories.product_id
      and p.is_published = true
      and p.status = 'active'
  )
  and exists (
    select 1 from public.categories c
    where c.id = product_categories.category_id
      and c.is_active = true
  )
);

-- Admin full access to catalog tables
create policy categories_admin_all
on public.categories
for all
using (public.is_admin())
with check (public.is_admin());

create policy products_admin_all
on public.products
for all
using (public.is_admin())
with check (public.is_admin());

create policy product_images_admin_all
on public.product_images
for all
using (public.is_admin())
with check (public.is_admin());

create policy product_categories_admin_all
on public.product_categories
for all
using (public.is_admin())
with check (public.is_admin());

create policy product_variants_admin_all
on public.product_variants
for all
using (public.is_admin())
with check (public.is_admin());

create policy inventory_items_admin_all
on public.inventory_items
for all
using (public.is_admin())
with check (public.is_admin());

create policy promotions_admin_all
on public.promotions
for all
using (public.is_admin())
with check (public.is_admin());

create policy store_settings_admin_all
on public.store_settings
for all
using (public.is_admin())
with check (public.is_admin());

create policy webhook_events_admin_all
on public.webhook_events
for all
using (public.is_admin())
with check (public.is_admin());

-- Customers: user can read/update self
create policy customers_self_read
on public.customers
for select
using (user_id = auth.uid());

create policy customers_self_insert
on public.customers
for insert
with check (user_id = auth.uid());

create policy customers_self_update
on public.customers
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy customers_admin_all
on public.customers
for all
using (public.is_admin())
with check (public.is_admin());

-- Addresses: self + admin
create policy customer_addresses_self_all
on public.customer_addresses
for all
using (
  exists (
    select 1 from public.customers c
    where c.id = customer_addresses.customer_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.customers c
    where c.id = customer_addresses.customer_id
      and c.user_id = auth.uid()
  )
);

create policy customer_addresses_admin_all
on public.customer_addresses
for all
using (public.is_admin())
with check (public.is_admin());

-- Carts/items: self + admin
create policy carts_self_all
on public.carts
for all
using (
  exists (
    select 1 from public.customers c
    where c.id = carts.customer_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.customers c
    where c.id = carts.customer_id
      and c.user_id = auth.uid()
  )
);

create policy carts_admin_all
on public.carts
for all
using (public.is_admin())
with check (public.is_admin());

create policy cart_items_self_all
on public.cart_items
for all
using (
  exists (
    select 1
    from public.carts c
    join public.customers cu on cu.id = c.customer_id
    where c.id = cart_items.cart_id
      and cu.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.carts c
    join public.customers cu on cu.id = c.customer_id
    where c.id = cart_items.cart_id
      and cu.user_id = auth.uid()
  )
);

create policy cart_items_admin_all
on public.cart_items
for all
using (public.is_admin())
with check (public.is_admin());

-- Orders: self read + admin all
create policy orders_self_read
on public.orders
for select
using (
  exists (
    select 1 from public.customers c
    where c.id = orders.customer_id
      and c.user_id = auth.uid()
  )
);

create policy orders_admin_all
on public.orders
for all
using (public.is_admin())
with check (public.is_admin());

create policy order_items_self_read
on public.order_items
for select
using (
  exists (
    select 1
    from public.orders o
    join public.customers c on c.id = o.customer_id
    where o.id = order_items.order_id
      and c.user_id = auth.uid()
  )
);

create policy order_items_admin_all
on public.order_items
for all
using (public.is_admin())
with check (public.is_admin());

create policy order_addresses_self_read
on public.order_addresses
for select
using (
  exists (
    select 1
    from public.orders o
    join public.customers c on c.id = o.customer_id
    where o.id = order_addresses.order_id
      and c.user_id = auth.uid()
  )
);

create policy order_addresses_admin_all
on public.order_addresses
for all
using (public.is_admin())
with check (public.is_admin());

-- Payments/shipments: self read + admin all
create policy payment_intents_self_read
on public.payment_intents
for select
using (
  exists (
    select 1
    from public.orders o
    join public.customers c on c.id = o.customer_id
    where o.id = payment_intents.order_id
      and c.user_id = auth.uid()
  )
);

create policy payment_intents_admin_all
on public.payment_intents
for all
using (public.is_admin())
with check (public.is_admin());

create policy payment_refunds_admin_all
on public.payment_refunds
for all
using (public.is_admin())
with check (public.is_admin());

create policy shipments_self_read
on public.shipments
for select
using (
  exists (
    select 1
    from public.orders o
    join public.customers c on c.id = o.customer_id
    where o.id = shipments.order_id
      and c.user_id = auth.uid()
  )
);

create policy shipments_admin_all
on public.shipments
for all
using (public.is_admin())
with check (public.is_admin());

-- Promotions: public can validate by code? (read-only limited)
create policy promotions_public_read
on public.promotions
for select
using (active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));

create policy order_promotions_self_read
on public.order_promotions
for select
using (
  exists (
    select 1
    from public.orders o
    join public.customers c on c.id = o.customer_id
    where o.id = order_promotions.order_id
      and c.user_id = auth.uid()
  )
);

create policy order_promotions_admin_all
on public.order_promotions
for all
using (public.is_admin())
with check (public.is_admin());

create policy promotion_redemptions_admin_all
on public.promotion_redemptions
for all
using (public.is_admin())
with check (public.is_admin());


-- Insert policies for Checkout (Public/Anon access)

create policy orders_insert_public
on public.orders
for insert
to public
with check (true);

create policy order_items_insert_public
on public.order_items
for insert
to public
with check (true);

create policy order_addresses_insert_public
on public.order_addresses
for insert
to public
with check (true);

create policy payment_intents_insert_public
on public.payment_intents
for insert
to public
with check (true);

commit;


-- PrimeCoat initial schema
-- Tables, enums, triggers, indexes and Row Level Security.
-- Order creation logic lives in 20261002120100_order_functions.sql.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums
create type public.product_category as enum (
  'interior', 'exterior', 'ceiling', 'primer', 'gloss', 'textured',
  'wood_finish', 'metal_finish', 'accessories', 'tools'
);
create type public.order_status as enum (
  'pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'
);
create type public.payment_method as enum ('pay_on_delivery', 'card', 'bank_transfer');
create type public.payment_status as enum ('unpaid', 'paid', 'refunded');
create type public.email_status as enum ('pending', 'sent', 'failed');
create type public.service_type as enum (
  'residential', 'commercial', 'interior', 'exterior',
  'colour_consultation', 'surface_preparation', 'repainting'
);
create type public.property_type as enum (
  'flat', 'detached_house', 'duplex', 'office', 'shop', 'warehouse', 'other'
);
create type public.service_request_status as enum ('new', 'contacted', 'scheduled', 'completed', 'closed');

-- ---------------------------------------------------------------- helpers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.profiles is 'One row per auth user, created by trigger on auth.users.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update
    set full_name  = coalesce(excluded.full_name, public.profiles.full_name),
        email      = coalesce(excluded.email, public.profiles.email),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        updated_at = now();
  return new;
end $$;

create trigger on_auth_user_created
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- products
create table public.products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  description       text not null default '',
  short_description text not null default '',
  category          public.product_category not null,
  price             numeric(12,2) not null check (price >= 0),
  image_url         text not null,
  size              text,
  colour_name       text,
  colour_hex        text check (colour_hex is null or colour_hex ~ '^#[0-9A-Fa-f]{6}$'),
  finish            text,
  coverage          text,
  stock_quantity    integer not null default 0 check (stock_quantity >= 0),
  is_active         boolean not null default true,
  is_featured       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index products_category_idx on public.products (category);
create index products_active_featured_idx on public.products (is_active, is_featured);
create index products_name_search_idx on public.products using gin (to_tsvector('english', name || ' ' || coalesce(colour_name, '') || ' ' || short_description));

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- orders
create table public.orders (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references auth.users (id) on delete cascade,
  order_number                text not null unique,
  customer_name               text not null,
  email                       text not null,
  phone                       text not null,
  delivery_address            text not null,
  city                        text not null,
  state                       text not null,
  delivery_instructions       text,
  subtotal                    numeric(12,2) not null check (subtotal >= 0),
  delivery_fee                numeric(12,2) not null check (delivery_fee >= 0),
  total                       numeric(12,2) not null check (total >= 0),
  status                      public.order_status not null default 'pending',
  payment_method              public.payment_method not null default 'pay_on_delivery',
  payment_status              public.payment_status not null default 'unpaid',
  confirmation_email_status   public.email_status not null default 'pending',
  confirmation_email_sent_at  timestamptz,
  confirmation_email_error    text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  constraint orders_total_matches check (total = subtotal + delivery_fee)
);
create index orders_user_created_idx on public.orders (user_id, created_at desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- order_items
create table public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  product_id        uuid references public.products (id) on delete set null,
  product_name      text not null,
  product_image_url text,
  unit_price        numeric(12,2) not null check (unit_price >= 0),
  quantity          integer not null check (quantity > 0),
  subtotal          numeric(12,2) not null check (subtotal >= 0),
  created_at        timestamptz not null default now(),
  constraint order_items_subtotal_matches check (subtotal = unit_price * quantity)
);
comment on column public.order_items.product_name is 'Snapshot at order time so history survives product edits.';
create index order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------- order number counters
create table public.order_number_counters (
  day         date primary key,
  last_value  integer not null default 0
);

-- ---------------------------------------------------------------- painting_service_requests
create table public.painting_service_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users (id) on delete set null,
  name            text not null,
  email           text not null,
  phone           text not null,
  service_type    public.service_type not null,
  property_type   public.property_type not null,
  address         text not null,
  preferred_date  date,
  message         text,
  status          public.service_request_status not null default 'new',
  created_at      timestamptz not null default now()
);
create index service_requests_user_idx on public.painting_service_requests (user_id);
create index service_requests_status_idx on public.painting_service_requests (status, created_at desc);

-- ---------------------------------------------------------------- Row Level Security
alter table public.profiles                  enable row level security;
alter table public.products                  enable row level security;
alter table public.orders                    enable row level security;
alter table public.order_items               enable row level security;
alter table public.order_number_counters     enable row level security;
alter table public.painting_service_requests enable row level security;

-- profiles: owner can read and update; inserts only via trigger (security definer)
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- products: public read of active products; no client writes
create policy "products_select_active" on public.products
  for select to anon, authenticated using (is_active = true);

-- orders: owner read only; inserts happen inside create_order() (security definer)
create policy "orders_select_own" on public.orders
  for select to authenticated using ((select auth.uid()) = user_id);

-- order_items: readable when the parent order is owned
create policy "order_items_select_own" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
  );

-- order_number_counters: no client access at all (only generate_order_number() writes it)

-- painting_service_requests: anyone may submit; owners may read theirs
create policy "service_requests_insert" on public.painting_service_requests
  for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));
create policy "service_requests_select_own" on public.painting_service_requests
  for select to authenticated using (user_id = (select auth.uid()));

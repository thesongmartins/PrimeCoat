-- Server-side cart: the browser stores nothing. One row per (user, product).

alter table public.profiles add column if not exists delivery_state text not null default 'Lagos';

create table public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  quantity    integer not null check (quantity between 1 and 999),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint cart_items_user_product_key unique (user_id, product_id)
);
create index cart_items_user_idx on public.cart_items (user_id, created_at);

create trigger cart_items_set_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

alter table public.cart_items enable row level security;

create policy "cart_items_select_own" on public.cart_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "cart_items_insert_own" on public.cart_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "cart_items_update_own" on public.cart_items
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "cart_items_delete_own" on public.cart_items
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Atomic add: increments an existing line, clamped to current stock. Runs as the caller (RLS applies).
create or replace function public.cart_add_item(p_product_id uuid, p_quantity integer default 1)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_stock integer;
  v_qty   integer;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if p_quantity is null or p_quantity < 1 then
    raise exception 'INVALID_QUANTITY' using errcode = '22023';
  end if;

  select stock_quantity into v_stock from public.products where id = p_product_id and is_active;
  if not found then
    raise exception 'PRODUCT_UNAVAILABLE' using errcode = '22023';
  end if;
  if v_stock < 1 then
    raise exception 'OUT_OF_STOCK' using errcode = '22023';
  end if;

  insert into public.cart_items (user_id, product_id, quantity)
  values (v_user, p_product_id, least(p_quantity, v_stock, 999))
  on conflict (user_id, product_id)
  do update set quantity = least(public.cart_items.quantity + excluded.quantity, v_stock, 999)
  returning quantity into v_qty;

  return v_qty;
end $$;

revoke execute on function public.cart_add_item(uuid, integer) from public, anon;
grant  execute on function public.cart_add_item(uuid, integer) to authenticated;

-- create_order(): unchanged pricing logic, plus it now empties the buyer's cart
-- inside the same transaction, so the cart is cleared if and only if the order commits.
create or replace function public.create_order(p_customer jsonb, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid := auth.uid();
  v_email     text := coalesce(nullif(auth.jwt() ->> 'email', ''), p_customer ->> 'email');
  v_subtotal  numeric(12,2) := 0;
  v_fee       numeric(12,2);
  v_order     public.orders;
  v_line      record;
  v_product   public.products;
  v_lines     jsonb := '[]'::jsonb;
  v_items     jsonb;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'CART_EMPTY' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'TOO_MANY_ITEMS' using errcode = '22023';
  end if;

  if coalesce(trim(p_customer ->> 'fullName'), '') = ''
     or coalesce(trim(p_customer ->> 'phone'), '') = ''
     or coalesce(trim(p_customer ->> 'deliveryAddress'), '') = ''
     or coalesce(trim(p_customer ->> 'city'), '') = ''
     or coalesce(trim(p_customer ->> 'state'), '') = ''
     or coalesce(trim(v_email), '') = '' then
    raise exception 'CUSTOMER_INCOMPLETE' using errcode = '22023';
  end if;

  for v_line in
    select (e ->> 'productId')::uuid as product_id, sum((e ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) e
    group by 1
    order by 1
  loop
    if v_line.quantity is null or v_line.quantity < 1 then
      raise exception 'INVALID_QUANTITY' using errcode = '22023';
    end if;

    select * into v_product from public.products where id = v_line.product_id and is_active for update;
    if not found then
      raise exception 'PRODUCT_UNAVAILABLE:%', v_line.product_id using errcode = '22023';
    end if;
    if v_product.stock_quantity < v_line.quantity then
      raise exception 'INSUFFICIENT_STOCK:%:%', v_product.name, v_product.stock_quantity using errcode = '22023';
    end if;

    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id, 'quantity', v_line.quantity, 'name', v_product.name,
      'image_url', v_product.image_url, 'unit_price', v_product.price
    );
    v_subtotal := v_subtotal + (v_product.price * v_line.quantity);
  end loop;

  v_fee := public.calculate_delivery_fee(v_subtotal, p_customer ->> 'state');

  insert into public.orders (
    user_id, order_number, customer_name, email, phone,
    delivery_address, city, state, delivery_instructions,
    subtotal, delivery_fee, total
  ) values (
    v_user_id, public.generate_order_number(), trim(p_customer ->> 'fullName'), lower(trim(v_email)), trim(p_customer ->> 'phone'),
    trim(p_customer ->> 'deliveryAddress'), trim(p_customer ->> 'city'), trim(p_customer ->> 'state'),
    nullif(trim(coalesce(p_customer ->> 'deliveryInstructions', '')), ''),
    v_subtotal, v_fee, v_subtotal + v_fee
  )
  returning * into v_order;

  insert into public.order_items (order_id, product_id, product_name, product_image_url, unit_price, quantity, subtotal)
  select v_order.id, l.product_id, l.name, l.image_url, l.unit_price, l.quantity, l.unit_price * l.quantity
  from jsonb_to_recordset(v_lines)
    as l(product_id uuid, quantity integer, name text, image_url text, unit_price numeric(12,2));

  -- Same transaction: the cart empties only when the order exists.
  delete from public.cart_items where user_id = v_user_id;

  update public.profiles set delivery_state = trim(p_customer ->> 'state') where id = v_user_id;

  select coalesce(jsonb_agg(to_jsonb(oi) order by oi.product_name), '[]'::jsonb)
  into v_items
  from public.order_items oi
  where oi.order_id = v_order.id;

  return to_jsonb(v_order) || jsonb_build_object('items', v_items);
end $$;

revoke execute on function public.create_order(jsonb, jsonb) from public, anon;
grant  execute on function public.create_order(jsonb, jsonb) to authenticated;

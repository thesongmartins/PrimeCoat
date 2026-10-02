-- Order creation: delivery fee, order numbers and the atomic create_order() RPC.

-- Mirrored in lib/cart/calculations.ts (estimate only). This function is the source of truth.
create or replace function public.calculate_delivery_fee(p_subtotal numeric, p_state text)
returns numeric
language sql
immutable
as $$
  select (case
    when p_subtotal <= 0 then 0
    when p_subtotal >= 150000 then 0
    when p_state = 'Lagos' then 2500
    when p_state in ('Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti') then 4000
    when p_state = 'FCT Abuja' then 5000
    else 7500
  end)::numeric(12,2);
$$;

-- PC-YYYYMMDD-NNNN using a per-day counter (Africa/Lagos calendar day). Concurrency-safe via upsert.
create or replace function public.generate_order_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (now() at time zone 'Africa/Lagos')::date;
  v_n   integer;
begin
  insert into public.order_number_counters (day, last_value)
  values (v_day, 1)
  on conflict (day) do update set last_value = public.order_number_counters.last_value + 1
  returning last_value into v_n;
  return 'PC-' || to_char(v_day, 'YYYYMMDD') || '-' || lpad(v_n::text, 4, '0');
end $$;

revoke execute on function public.generate_order_number() from public, anon, authenticated;

-- Atomic order creation for the signed-in user.
--   p_customer: { fullName, email, phone, deliveryAddress, city, state, deliveryInstructions? }
--   p_items:    [ { productId, quantity }, ... ]
-- Prices and totals are computed here from public.products; client values are never trusted.
-- The order email is always the authenticated user's email.
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
  v_lines     jsonb;
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

  -- Required customer fields (format validation is done with Zod on the server; this is the backstop).
  if coalesce(trim(p_customer ->> 'fullName'), '') = ''
     or coalesce(trim(p_customer ->> 'phone'), '') = ''
     or coalesce(trim(p_customer ->> 'deliveryAddress'), '') = ''
     or coalesce(trim(p_customer ->> 'city'), '') = ''
     or coalesce(trim(p_customer ->> 'state'), '') = ''
     or coalesce(trim(v_email), '') = '' then
    raise exception 'CUSTOMER_INCOMPLETE' using errcode = '22023';
  end if;

  -- Aggregate duplicate product ids, lock the product rows, validate stock and price everything.
  create temp table if not exists tmp_order_lines (
    product_id uuid, quantity integer, name text, image_url text, unit_price numeric(12,2)
  ) on commit drop;
  delete from tmp_order_lines;

  for v_line in
    select (e ->> 'productId')::uuid as product_id, sum((e ->> 'quantity')::integer) as quantity
    from jsonb_array_elements(p_items) e
    group by 1
  loop
    if v_line.quantity is null or v_line.quantity < 1 then
      raise exception 'INVALID_QUANTITY' using errcode = '22023';
    end if;

    select * into v_product
    from public.products
    where id = v_line.product_id and is_active
    for update;

    if not found then
      raise exception 'PRODUCT_UNAVAILABLE:%', v_line.product_id using errcode = '22023';
    end if;
    if v_product.stock_quantity < v_line.quantity then
      raise exception 'INSUFFICIENT_STOCK:%:%', v_product.name, v_product.stock_quantity using errcode = '22023';
    end if;

    insert into tmp_order_lines values (v_product.id, v_line.quantity, v_product.name, v_product.image_url, v_product.price);
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
  from tmp_order_lines l;

  select coalesce(jsonb_agg(to_jsonb(oi) order by oi.product_name), '[]'::jsonb)
  into v_lines
  from public.order_items oi
  where oi.order_id = v_order.id;

  return to_jsonb(v_order) || jsonb_build_object('items', v_lines);
end $$;

revoke execute on function public.create_order(jsonb, jsonb) from public, anon;
grant  execute on function public.create_order(jsonb, jsonb) to authenticated;

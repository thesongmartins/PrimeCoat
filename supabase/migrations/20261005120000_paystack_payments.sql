-- Paystack card payments (test or live keys; the code is identical).
-- Each payment attempt is a row in public.payments. An order is marked paid exactly once,
-- by finalize_paystack_payment(), which only the server (service role) may call.

create type public.payment_attempt_status as enum ('initialized', 'success', 'failed', 'abandoned');

create table public.payments (
  id                       uuid primary key default gen_random_uuid(),
  order_id                 uuid not null references public.orders (id) on delete cascade,
  user_id                  uuid not null references auth.users (id) on delete cascade,
  provider                 text not null default 'paystack' check (provider = 'paystack'),
  reference                text not null unique,
  amount_kobo              bigint not null check (amount_kobo > 0),
  currency                 text not null default 'NGN',
  status                   public.payment_attempt_status not null default 'initialized',
  provider_transaction_id  text,
  channel                  text,
  gateway_response         text,
  paid_at                  timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id, created_at desc);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

-- Owners may read their payment attempts. No client writes: the server records attempts
-- and outcomes with the service role after talking to Paystack.
create policy "payments_select_own" on public.payments
  for select to authenticated using ((select auth.uid()) = user_id);

alter table public.orders add column if not exists paid_at timestamptz;

-- Marks a verified Paystack charge as paid. Idempotent and race-safe: the payment row is
-- locked, so the browser callback and the webhook can both call it and only one wins.
create or replace function public.finalize_paystack_payment(
  p_reference text,
  p_amount_kobo bigint,
  p_currency text,
  p_transaction_id text,
  p_channel text,
  p_gateway_response text,
  p_paid_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_order   public.orders;
begin
  select * into v_payment from public.payments where reference = p_reference for update;
  if not found then
    raise exception 'PAYMENT_NOT_FOUND' using errcode = '22023';
  end if;

  if v_payment.status = 'success' then
    return jsonb_build_object('order_id', v_payment.order_id, 'newly_paid', false);
  end if;

  if p_amount_kobo <> v_payment.amount_kobo or upper(p_currency) <> v_payment.currency then
    update public.payments set status = 'failed', gateway_response = 'amount_or_currency_mismatch'
    where id = v_payment.id;
    return jsonb_build_object('order_id', v_payment.order_id, 'newly_paid', false, 'error', 'AMOUNT_MISMATCH');
  end if;

  select * into v_order from public.orders where id = v_payment.order_id for update;

  update public.payments
  set status = 'success', provider_transaction_id = p_transaction_id, channel = p_channel,
      gateway_response = p_gateway_response, paid_at = coalesce(p_paid_at, now())
  where id = v_payment.id;

  if v_order.payment_status = 'paid' then
    -- Another attempt already paid this order (e.g. two tabs). Record it, don't double-confirm.
    return jsonb_build_object('order_id', v_order.id, 'newly_paid', false, 'duplicate', true);
  end if;

  update public.orders
  set payment_status = 'paid', status = 'confirmed', paid_at = coalesce(p_paid_at, now())
  where id = v_order.id;

  return jsonb_build_object('order_id', v_order.id, 'newly_paid', true);
end $$;

revoke execute on function public.finalize_paystack_payment(text, bigint, text, text, text, text, timestamptz) from public, anon, authenticated;
grant  execute on function public.finalize_paystack_payment(text, bigint, text, text, text, text, timestamptz) to service_role;

-- create_order(): adds the payment method (pay_on_delivery or card). Everything else unchanged,
-- including emptying the cart in the same transaction.
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
  v_method    public.payment_method := coalesce(nullif(p_customer ->> 'paymentMethod', ''), 'pay_on_delivery')::public.payment_method;
begin
  if v_method not in ('pay_on_delivery', 'card') then
    raise exception 'INVALID_PAYMENT_METHOD' using errcode = '22023';
  end if;

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
    subtotal, delivery_fee, total, payment_method
  ) values (
    v_user_id, public.generate_order_number(), trim(p_customer ->> 'fullName'), lower(trim(v_email)), trim(p_customer ->> 'phone'),
    trim(p_customer ->> 'deliveryAddress'), trim(p_customer ->> 'city'), trim(p_customer ->> 'state'),
    nullif(trim(coalesce(p_customer ->> 'deliveryInstructions', '')), ''),
    v_subtotal, v_fee, v_subtotal + v_fee, v_method
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

-- Checkout hardening: transactional order creation + tighter insert surface
-- Run in Supabase SQL Editor or migration pipeline.

begin;

create or replace function public.create_checkout_order(
  p_email text,
  p_address jsonb,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_customer_id uuid;
  v_order_id uuid;
  v_subtotal_cents int := 0;
  v_shipping_cents int := 0;
  v_total_cents int := 0;
  v_item jsonb;
  v_legacy_product_id int;
  v_quantity int;
  v_size text;
  v_color text;
  v_product_id uuid;
  v_price_cents int;
  v_product_name text;
  v_product_image text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_email is null or btrim(p_email) = '' then
    raise exception 'EMAIL_REQUIRED';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ITEMS';
  end if;

  if coalesce(p_address->>'line1', '') = '' or coalesce(p_address->>'country', '') = '' then
    raise exception 'INVALID_ADDRESS';
  end if;

  select c.id
    into v_customer_id
  from public.customers c
  where c.user_id = v_user_id
  limit 1;

  if v_customer_id is null then
    insert into public.customers (user_id, email)
    values (v_user_id, p_email)
    returning id into v_customer_id;
  end if;

  v_order_id := gen_random_uuid();

  insert into public.orders (
    id,
    customer_id,
    email,
    status,
    payment_status,
    fulfillment_status,
    currency,
    subtotal_cents,
    shipping_cents,
    total_cents,
    placed_at,
    notes
  ) values (
    v_order_id,
    v_customer_id,
    p_email,
    'pending',
    'requires_action',
    'unfulfilled',
    'COP',
    0,
    0,
    0,
    now(),
    'Pedido Contra Entrega'
  );

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_legacy_product_id := nullif(v_item->>'productId', '')::int;
    v_quantity := greatest(1, coalesce(nullif(v_item->>'quantity', '')::int, 1));
    v_size := nullif(v_item->>'size', '');
    v_color := nullif(v_item->>'color', '');

    if v_legacy_product_id is null then
      raise exception 'INVALID_PRODUCT';
    end if;

    select p.id, p.base_price_cents, p.name, p.primary_image_url
      into v_product_id, v_price_cents, v_product_name, v_product_image
    from public.products p
    where p.legacy_product_id = v_legacy_product_id
      and p.is_published = true
      and p.status = 'active'
    limit 1;

    if v_product_id is null then
      raise exception 'PRODUCT_NOT_AVAILABLE:%', v_legacy_product_id;
    end if;

    v_subtotal_cents := v_subtotal_cents + (v_price_cents * v_quantity);

    insert into public.order_items (
      order_id,
      product_id,
      title,
      image_url,
      quantity,
      unit_price_cents,
      line_total_cents,
      currency,
      metadata
    ) values (
      v_order_id,
      v_product_id,
      v_product_name,
      v_product_image,
      v_quantity,
      v_price_cents,
      (v_price_cents * v_quantity),
      'COP',
      jsonb_build_object('size', v_size, 'color', v_color)
    );
  end loop;

  v_total_cents := v_subtotal_cents + v_shipping_cents;

  update public.orders
  set subtotal_cents = v_subtotal_cents,
      shipping_cents = v_shipping_cents,
      total_cents = v_total_cents,
      updated_at = now()
  where id = v_order_id;

  insert into public.order_addresses (
    order_id,
    type,
    name,
    phone,
    line1,
    line2,
    city,
    region,
    postal_code,
    country
  ) values (
    v_order_id,
    'shipping',
    p_address->>'name',
    p_address->>'phone',
    p_address->>'line1',
    nullif(p_address->>'line2', ''),
    nullif(p_address->>'city', ''),
    nullif(p_address->>'region', ''),
    nullif(p_address->>'postal_code', ''),
    p_address->>'country'
  );

  insert into public.payment_intents (
    order_id,
    provider,
    status,
    amount_cents,
    currency
  ) values (
    v_order_id,
    'manual',
    'requires_payment_method',
    v_total_cents,
    'COP'
  );

  insert into public.customer_addresses (
    customer_id,
    label,
    is_default,
    name,
    phone,
    line1,
    line2,
    city,
    region,
    postal_code,
    country
  ) values (
    v_customer_id,
    'Predeterminada',
    true,
    p_address->>'name',
    p_address->>'phone',
    p_address->>'line1',
    nullif(p_address->>'line2', ''),
    nullif(p_address->>'city', ''),
    nullif(p_address->>'region', ''),
    nullif(p_address->>'postal_code', ''),
    p_address->>'country'
  )
  on conflict do nothing;

  return v_order_id;
end;
$$;

revoke all on function public.create_checkout_order(text, jsonb, jsonb) from public;
grant execute on function public.create_checkout_order(text, jsonb, jsonb) to authenticated;

-- Remove direct public inserts for checkout-critical tables; checkout must go through RPC.
drop policy if exists orders_insert_public on public.orders;
drop policy if exists order_items_insert_public on public.order_items;
drop policy if exists order_addresses_insert_public on public.order_addresses;
drop policy if exists payment_intents_insert_public on public.payment_intents;

commit;

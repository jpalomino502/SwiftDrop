-- Migration: Add customer_type to customers for retail/wholesale differentiation
-- Date: 2026-05-26

begin;

-- Add customer_type enum
do $$ begin
  create type public.customer_type as enum ('retail', 'wholesale');
exception when duplicate_object then null; end $$;

-- Add customer_type column to customers
alter table public.customers
add column if not exists customer_type public.customer_type not null default 'retail';

-- Add loyalty_points column directly on customers for quick access
alter table public.customers
add column if not exists loyalty_points int not null default 0 check (loyalty_points >= 0);

-- Add wholesale_price_cents to product_variants for wholesale pricing
alter table public.product_variants
add column if not exists wholesale_price_cents int check (wholesale_price_cents is null or wholesale_price_cents >= 0);

commit;

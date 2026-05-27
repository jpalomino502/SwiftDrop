-- Migration: Add delivery pin columns to orders
-- These columns may already exist in some Supabase instances but are missing from schema.sql
-- Date: 2026-05-26

begin;

-- Add delivery_pin column if it doesn't exist
alter table public.orders
add column if not exists delivery_pin text;

-- Add delivery_pin_verified column if it doesn't exist
alter table public.orders
add column if not exists delivery_pin_verified boolean not null default false;

-- Add index for quick lookup by delivery_pin
create index if not exists orders_delivery_pin_idx on public.orders(delivery_pin);

commit;

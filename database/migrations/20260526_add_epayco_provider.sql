-- Migration: Add epayco to payment_provider enum
-- Date: 2026-05-26

begin;

-- PostgreSQL enums cannot be altered directly; we need a workaround.
-- Add 'epayco' to the payment_provider enum by creating a new enum and swapping.

-- Only run if 'epayco' is not already present
do $$
declare
  epayco_exists boolean;
begin
  select exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'payment_provider' and e.enumlabel = 'epayco'
  ) into epayco_exists;

  if not epayco_exists then
    -- rename old enum
    alter type public.payment_provider rename to payment_provider_old;
    -- create new enum with all values including epayco
    create type public.payment_provider as enum ('stripe', 'mercadopago', 'manual', 'epayco');
    -- update columns
    alter table public.payment_intents alter column provider type public.payment_provider using provider::text::public.payment_provider;
    alter table public.webhook_events alter column provider type public.payment_provider using provider::text::public.payment_provider;
    -- drop old enum
    drop type public.payment_provider_old;
  end if;
end $$;

commit;

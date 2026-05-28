-- Migration: Add epayco callback logs table for debugging
-- Date: 2026-05-28

begin;

create table if not exists public.epayco_callback_logs (
  id uuid primary key default gen_random_uuid(),
  order_id text,
  ref_payco text,
  query_params jsonb not null default '{}',
  validation_response jsonb,
  created_at timestamptz not null default now()
);

create index if not exists epayco_callback_logs_order_id_idx on public.epayco_callback_logs(order_id);
create index if not exists epayco_callback_logs_created_at_idx on public.epayco_callback_logs(created_at desc);

-- RLS
alter table public.epayco_callback_logs enable row level security;

drop policy if exists epayco_callback_logs_admin_all on public.epayco_callback_logs;
create policy epayco_callback_logs_admin_all
on public.epayco_callback_logs for all using (public.is_admin()) with check (public.is_admin());

commit;

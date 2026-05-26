-- Migration: Add loyalty program tables
-- Date: 2026-05-26

begin;

create table if not exists public.loyalty_rules (
  id int primary key default 1,
  points_per_cents int not null default 10000, -- e.g. 1 point per 10000 cents ($100 COP or $100 USD depending on currency)
  retail_multiplier numeric not null default 1.0,
  wholesale_multiplier numeric not null default 2.0,
  points_to_cents_conversion int not null default 5000, -- e.g. 100 points = 5000 cents
  updated_at timestamptz not null default now(),
  constraint loyalty_rules_singleton check (id = 1)
);

insert into public.loyalty_rules(id) values (1)
on conflict (id) do nothing;

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  type text not null check (type in ('accrual', 'redemption', 'adjustment')),
  points int not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists loyalty_transactions_customer_id_idx on public.loyalty_transactions(customer_id);
create index if not exists loyalty_transactions_order_id_idx on public.loyalty_transactions(order_id);

-- RLS
alter table public.loyalty_rules enable row level security;
alter table public.loyalty_transactions enable row level security;

drop policy if exists loyalty_rules_public_read on public.loyalty_rules;
create policy loyalty_rules_public_read
on public.loyalty_rules for select to authenticated using (true);

drop policy if exists loyalty_rules_admin_all on public.loyalty_rules;
create policy loyalty_rules_admin_all
on public.loyalty_rules for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists loyalty_transactions_self_read on public.loyalty_transactions;
create policy loyalty_transactions_self_read
on public.loyalty_transactions for select
using (
  exists (
    select 1 from public.customers c where c.id = loyalty_transactions.customer_id and c.user_id = auth.uid()
  )
);

drop policy if exists loyalty_transactions_admin_all on public.loyalty_transactions;
create policy loyalty_transactions_admin_all
on public.loyalty_transactions for all using (public.is_admin()) with check (public.is_admin());

commit;

-- Migration: Add SMS notifications table for mock and real SMS delivery tracking
-- Date: 2026-05-26

begin;

create table if not exists public.sms_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  phone text not null,
  message text not null,
  provider text not null default 'mock',
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'mocked')),
  provider_response jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists sms_notifications_order_id_idx on public.sms_notifications(order_id);
create index if not exists sms_notifications_status_idx on public.sms_notifications(status);

-- RLS
alter table public.sms_notifications enable row level security;

drop policy if exists sms_notifications_self_read on public.sms_notifications;
create policy sms_notifications_self_read
on public.sms_notifications for select
using (
  exists (
    select 1
    from public.orders o
    join public.customers c on c.id = o.customer_id
    where o.id = sms_notifications.order_id and c.user_id = auth.uid()
  )
);

drop policy if exists sms_notifications_admin_all on public.sms_notifications;
create policy sms_notifications_admin_all
on public.sms_notifications for all using (public.is_admin()) with check (public.is_admin());

commit;

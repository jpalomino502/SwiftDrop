-- Migration: Add drones, maintenance and alerts tables
-- Date: 2026-05-26

begin;

-- Drone status enum
do $$ begin
  create type public.drone_status as enum ('available', 'assigned', 'maintenance', 'inactive');
exception when duplicate_object then null; end $$;

-- Maintenance type enum
do $$ begin
  create type public.maintenance_type as enum ('preventive', 'corrective', 'inspection', 'battery_replacement');
exception when duplicate_object then null; end $$;

-- Alert severity enum
do $$ begin
  create type public.alert_severity as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null; end $$;

-- Alert type enum
do $$ begin
  create type public.alert_type as enum ('maintenance_due', 'battery_low', 'payload_exceeded', 'distance_exceeded', 'gps_lost', 'general');
exception when duplicate_object then null; end $$;

create table if not exists public.drones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  serial_number text unique,
  status public.drone_status not null default 'available',
  battery_level int not null default 100 check (battery_level between 0 and 100),
  max_payload_kg numeric not null default 3.0 check (max_payload_kg > 0),
  max_distance_km numeric not null default 8.0 check (max_distance_km > 0),
  current_lat numeric,
  current_lng numeric,
  last_maintenance_at timestamptz,
  next_maintenance_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  create trigger drones_set_updated_at
  before update on public.drones
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

create table if not exists public.drone_maintenance (
  id uuid primary key default gen_random_uuid(),
  drone_id uuid not null references public.drones(id) on delete cascade,
  type public.maintenance_type not null,
  description text,
  performed_at timestamptz not null default now(),
  technician text,
  cost_cents int not null default 0 check (cost_cents >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.drone_alerts (
  id uuid primary key default gen_random_uuid(),
  drone_id uuid not null references public.drones(id) on delete cascade,
  type public.alert_type not null,
  severity public.alert_severity not null default 'medium',
  message text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- Indexes
create index if not exists drones_status_idx on public.drones(status);
create index if not exists drone_maintenance_drone_id_idx on public.drone_maintenance(drone_id);
create index if not exists drone_alerts_drone_id_idx on public.drone_alerts(drone_id);
create index if not exists drone_alerts_resolved_idx on public.drone_alerts(resolved);

-- RLS
alter table public.drones enable row level security;
alter table public.drone_maintenance enable row level security;
alter table public.drone_alerts enable row level security;

drop policy if exists drones_public_read on public.drones;
create policy drones_public_read
on public.drones for select to public using (true);

drop policy if exists drones_admin_all on public.drones;
create policy drones_admin_all
on public.drones for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists drone_maintenance_public_read on public.drone_maintenance;
create policy drone_maintenance_public_read
on public.drone_maintenance for select to public using (true);

drop policy if exists drone_maintenance_admin_all on public.drone_maintenance;
create policy drone_maintenance_admin_all
on public.drone_maintenance for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists drone_alerts_public_read on public.drone_alerts;
create policy drone_alerts_public_read
on public.drone_alerts for select to public using (true);

drop policy if exists drone_alerts_admin_all on public.drone_alerts;
create policy drone_alerts_admin_all
on public.drone_alerts for all using (public.is_admin()) with check (public.is_admin());

commit;

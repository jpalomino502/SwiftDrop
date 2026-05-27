-- Migration: Add logistics tables (vehicles, assignments, GPS tracking)
-- Date: 2026-05-26

begin;

-- Vehicle type enum
do $$ begin
  create type public.vehicle_type as enum ('drone', 'motorcycle', 'bicycle');
exception when duplicate_object then null; end $$;

-- Assignment status enum
do $$ begin
  create type public.assignment_status as enum ('pending', 'assigned', 'in_transit', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.delivery_vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.vehicle_type not null,
  license_plate text,
  max_payload_kg numeric not null default 15.0 check (max_payload_kg > 0),
  max_distance_km numeric not null default 20.0 check (max_distance_km > 0),
  is_available boolean not null default true,
  current_lat numeric,
  current_lng numeric,
  battery_or_fuel_level int not null default 100 check (battery_or_fuel_level between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  create trigger delivery_vehicles_set_updated_at
  before update on public.delivery_vehicles
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

create table if not exists public.delivery_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  vehicle_id uuid references public.delivery_vehicles(id) on delete set null,
  drone_id uuid references public.drones(id) on delete set null,
  status public.assignment_status not null default 'pending',
  estimated_weight_kg numeric not null default 1.0,
  estimated_distance_km numeric not null default 5.0,
  assigned_vehicle_type public.vehicle_type,
  assigned_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- ensure only one assignment per order
  constraint delivery_assignments_order_id_unique unique (order_id)
);

do $$ begin
  create trigger delivery_assignments_set_updated_at
  before update on public.delivery_assignments
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

create table if not exists public.gps_coordinates (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.delivery_assignments(id) on delete cascade,
  lat numeric not null,
  lng numeric not null,
  altitude_m numeric,
  speed_kmh numeric,
  recorded_at timestamptz not null default now(),
  is_simulated boolean not null default true
);

-- Indexes
create index if not exists delivery_vehicles_type_idx on public.delivery_vehicles(type);
create index if not exists delivery_vehicles_available_idx on public.delivery_vehicles(is_available);
create index if not exists delivery_assignments_order_id_idx on public.delivery_assignments(order_id);
create index if not exists delivery_assignments_status_idx on public.delivery_assignments(status);
create index if not exists gps_coordinates_assignment_id_idx on public.gps_coordinates(assignment_id);

-- RLS
alter table public.delivery_vehicles enable row level security;
alter table public.delivery_assignments enable row level security;
alter table public.gps_coordinates enable row level security;

drop policy if exists delivery_vehicles_public_read on public.delivery_vehicles;
create policy delivery_vehicles_public_read
on public.delivery_vehicles for select to public using (true);

drop policy if exists delivery_vehicles_admin_all on public.delivery_vehicles;
create policy delivery_vehicles_admin_all
on public.delivery_vehicles for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists delivery_assignments_self_read on public.delivery_assignments;
create policy delivery_assignments_self_read
on public.delivery_assignments for select
using (
  exists (
    select 1 from public.orders o
    join public.customers c on c.id = o.customer_id
    where o.id = delivery_assignments.order_id and c.user_id = auth.uid()
  )
);

drop policy if exists delivery_assignments_admin_all on public.delivery_assignments;
create policy delivery_assignments_admin_all
on public.delivery_assignments for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists gps_coordinates_self_read on public.gps_coordinates;
create policy gps_coordinates_self_read
on public.gps_coordinates for select
using (
  exists (
    select 1
    from public.delivery_assignments da
    join public.orders o on o.id = da.order_id
    join public.customers c on c.id = o.customer_id
    where da.id = gps_coordinates.assignment_id and c.user_id = auth.uid()
  )
);

drop policy if exists gps_coordinates_admin_all on public.gps_coordinates;
create policy gps_coordinates_admin_all
on public.gps_coordinates for all using (public.is_admin()) with check (public.is_admin());

commit;

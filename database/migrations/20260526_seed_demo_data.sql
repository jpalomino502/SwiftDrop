-- Migration: Seed demo data for drones, vehicles, maintenance, alerts and loyalty rules
-- Date: 2026-05-26

begin;

-- Drones
insert into public.drones (name, serial_number, status, battery_level, max_payload_kg, max_distance_km, current_lat, current_lng, last_maintenance_at, next_maintenance_at)
values
  ('Drone Alpha', 'DRN-001-BGA', 'available', 92, 3.0, 8.0, 7.12539, -73.1198, now() - interval '15 days', now() + interval '15 days'),
  ('Drone Beta', 'DRN-002-BGA', 'available', 85, 2.5, 6.0, 7.13000, -73.1100, now() - interval '30 days', now() + interval '10 days'),
  ('Drone Gamma', 'DRN-003-BGA', 'maintenance', 45, 3.5, 10.0, 7.12000, -73.1250, now() - interval '60 days', now() - interval '5 days')
on conflict (serial_number) do nothing;

-- Delivery vehicles (motorcycles and bicycles)
insert into public.delivery_vehicles (name, type, license_plate, max_payload_kg, max_distance_km, is_available, current_lat, current_lng, battery_or_fuel_level)
values
  ('Moto Rojo', 'motorcycle', 'MOT-123-BGA', 15.0, 20.0, true, 7.12500, -73.11800, 78),
  ('Moto Azul', 'motorcycle', 'MOT-456-BGA', 15.0, 20.0, true, 7.12800, -73.11500, 65),
  ('Bici Eco 1', 'bicycle', 'BIC-001-BGA', 5.0, 5.0, true, 7.12200, -73.12000, 90),
  ('Bici Eco 2', 'bicycle', 'BIC-002-BGA', 5.0, 5.0, true, 7.12400, -73.12200, 88)
on conflict do nothing;

-- Maintenance records for demo
insert into public.drone_maintenance (drone_id, type, description, performed_at, technician, cost_cents, notes)
select
  d.id,
  'preventive',
  'Revisión general y limpieza de hélices',
  now() - interval '15 days',
  'Técnico Juan',
  45000,
  'Todo en óptimas condiciones'
from public.drones d
where d.serial_number = 'DRN-001-BGA'
on conflict do nothing;

insert into public.drone_maintenance (drone_id, type, description, performed_at, technician, cost_cents, notes)
select
  d.id,
  'battery_replacement',
  'Cambio de batería por degradación',
  now() - interval '30 days',
  'Técnica María',
  120000,
  'Batería nueva instalada'
from public.drones d
where d.serial_number = 'DRN-002-BGA'
on conflict do nothing;

-- Alerts for demo
insert into public.drone_alerts (drone_id, type, severity, message, resolved, created_at)
select
  d.id,
  'maintenance_due',
  'high',
  'El mantenimiento programado venció hace 5 días.',
  false,
  now() - interval '5 days'
from public.drones d
where d.serial_number = 'DRN-003-BGA'
on conflict do nothing;

insert into public.drone_alerts (drone_id, type, severity, message, resolved, created_at)
select
  d.id,
  'battery_low',
  'medium',
  'Batería por debajo del 50%. Recomendado recargar.',
  false,
  now() - interval '2 hours'
from public.drones d
where d.serial_number = 'DRN-003-BGA'
on conflict do nothing;

-- Update loyalty rules if empty
insert into public.loyalty_rules (id, points_per_cents, retail_multiplier, wholesale_multiplier, points_to_cents_conversion)
values (1, 10000, 1.0, 2.0, 5000)
on conflict (id) do update set
  points_per_cents = excluded.points_per_cents,
  retail_multiplier = excluded.retail_multiplier,
  wholesale_multiplier = excluded.wholesale_multiplier,
  points_to_cents_conversion = excluded.points_to_cents_conversion,
  updated_at = now();

commit;

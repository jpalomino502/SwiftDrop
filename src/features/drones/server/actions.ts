"use server";

import { getSupabaseServerClientWithCookies } from "@/src/lib/supabase/ssr";

export async function getDrones() {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return { drones: [], error: "Supabase no configurado" };

  const { data, error } = await supabase
    .from("drones")
    .select("*")
    .order("created_at", { ascending: false });

  return { drones: data ?? [], error: error?.message };
}

export async function getDroneById(id: string) {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return { drone: null, error: "Supabase no configurado" };

  const { data, error } = await supabase
    .from("drones")
    .select("*, drone_maintenance(*), drone_alerts(*)")
    .eq("id", id)
    .maybeSingle();

  return { drone: data, error: error?.message };
}

export async function updateDroneStatus(id: string, status: string) {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return { success: false, error: "Supabase no configurado" };

  const { error } = await supabase
    .from("drones")
    .update({ status })
    .eq("id", id);

  return { success: !error, error: error?.message };
}

export async function createMaintenanceRecord(input: {
  drone_id: string;
  type: string;
  description: string;
  technician: string;
  cost_cents: number;
  notes?: string;
}) {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return { success: false, error: "Supabase no configurado" };

  const { error } = await supabase.from("drone_maintenance").insert({
    drone_id: input.drone_id,
    type: input.type,
    description: input.description,
    technician: input.technician,
    cost_cents: input.cost_cents,
    notes: input.notes || null,
  });

  if (!error) {
    // Update drone last_maintenance_at and next_maintenance_at
    await supabase
      .from("drones")
      .update({
        last_maintenance_at: new Date().toISOString(),
        next_maintenance_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "available",
      })
      .eq("id", input.drone_id);
  }

  return { success: !error, error: error?.message };
}

export async function resolveDroneAlert(alertId: string) {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return { success: false, error: "Supabase no configurado" };

  const { error } = await supabase
    .from("drone_alerts")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("id", alertId);

  return { success: !error, error: error?.message };
}

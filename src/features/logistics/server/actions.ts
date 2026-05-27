"use server";

import { getSupabaseServerClientWithCookies } from "@/src/lib/supabase/ssr";
import type { VehicleType } from "@/src/features/logistics/domain/DeliveryAssignment";

export async function getDeliveryVehicles() {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return { vehicles: [], error: "Supabase no configurado" };

  const { data, error } = await supabase
    .from("delivery_vehicles")
    .select("*")
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  return { vehicles: data ?? [], error: error?.message };
}

export async function getPendingAssignments() {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return { assignments: [], error: "Supabase no configurado" };

  const { data, error } = await supabase
    .from("delivery_assignments")
    .select("*, orders(id, order_number, total_cents, status), delivery_vehicles(*), drones(*)")
    .in("status", ["pending", "assigned", "in_transit"])
    .order("created_at", { ascending: false })
    .limit(200);

  return { assignments: data ?? [], error: error?.message };
}

export async function getTrackingByOrder(orderId: string) {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return { assignment: null, coordinates: [], error: "Supabase no configurado" };

  const { data: assignment, error: assignErr } = await supabase
    .from("delivery_assignments")
    .select("*, delivery_vehicles(*), drones(*)")
    .eq("order_id", orderId)
    .maybeSingle();

  if (assignErr || !assignment) {
    return { assignment: null, coordinates: [], error: assignErr?.message };
  }

  const { data: coords, error: coordsErr } = await supabase
    .from("gps_coordinates")
    .select("*")
    .eq("assignment_id", assignment.id)
    .order("recorded_at", { ascending: true });

  return { assignment, coordinates: coords ?? [], error: coordsErr?.message };
}

export async function assignDelivery(input: {
  orderId: string;
  estimatedWeightKg: number;
  estimatedDistanceKm: number;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}) {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return { success: false, error: "Supabase no configurado" };

  const { data: vehicles, error: vehErr } = await supabase
    .from("delivery_vehicles")
    .select("*")
    .eq("is_available", true);

  if (vehErr) return { success: false, error: vehErr.message };

  const { data: drones, error: droneErr } = await supabase
    .from("drones")
    .select("*")
    .eq("status", "available");

  if (droneErr) return { success: false, error: droneErr.message };

  const allVehicles = [
    ...(drones ?? []).map((d) => ({ ...d, kind: "drone" as const, maxPayload: d.max_payload_kg, maxDistance: d.max_distance_km })),
    ...(vehicles ?? []).map((v) => ({ ...v, kind: "vehicle" as const, maxPayload: v.max_payload_kg, maxDistance: v.max_distance_km })),
  ];

  // Assignment algorithm
  let chosen: typeof allVehicles[number] | null = null;

  if (input.estimatedWeightKg <= 3 && input.estimatedDistanceKm <= 8) {
    // Prefer drone
    chosen = allVehicles.find((v) => v.kind === "drone" && v.maxPayload >= input.estimatedWeightKg && v.maxDistance >= input.estimatedDistanceKm) ?? null;
  }

  if (!chosen && input.estimatedWeightKg <= 5 && input.estimatedDistanceKm <= 5) {
    // Try bicycle
    chosen = allVehicles.find((v) => v.type === "bicycle" && v.maxPayload >= input.estimatedWeightKg && v.maxDistance >= input.estimatedDistanceKm) ?? null;
  }

  if (!chosen && input.estimatedWeightKg <= 15 && input.estimatedDistanceKm <= 20) {
    // Try motorcycle
    chosen = allVehicles.find((v) => v.type === "motorcycle" && v.maxPayload >= input.estimatedWeightKg && v.maxDistance >= input.estimatedDistanceKm) ?? null;
  }

  if (!chosen) {
    // Fallback: any vehicle that can handle it
    chosen = allVehicles.find((v) => v.maxPayload >= input.estimatedWeightKg && v.maxDistance >= input.estimatedDistanceKm) ?? null;
  }

  if (!chosen) {
    // Create pending assignment without vehicle
    const { error } = await supabase.from("delivery_assignments").insert({
      order_id: input.orderId,
      status: "pending",
      estimated_weight_kg: input.estimatedWeightKg,
      estimated_distance_km: input.estimatedDistanceKm,
    });
    return { success: !error, error: error?.message, assigned: false };
  }

  const isDrone = chosen.kind === "drone";
  const vehicleId = isDrone ? null : chosen.id;
  const droneId = isDrone ? chosen.id : null;
  const assignedType = isDrone ? "drone" : (chosen.type as VehicleType);

  const { error: assignError } = await supabase.from("delivery_assignments").insert({
    order_id: input.orderId,
    vehicle_id: vehicleId,
    drone_id: droneId,
    status: "assigned",
    estimated_weight_kg: input.estimatedWeightKg,
    estimated_distance_km: input.estimatedDistanceKm,
    assigned_vehicle_type: assignedType,
    assigned_at: new Date().toISOString(),
  });

  if (assignError) return { success: false, error: assignError.message };

  // Mark vehicle/drone as assigned/unavailable
  if (isDrone) {
    await supabase.from("drones").update({ status: "assigned" }).eq("id", droneId);
  } else {
    await supabase.from("delivery_vehicles").update({ is_available: false }).eq("id", vehicleId);
  }

  // Generate simulated GPS route
  const assignmentRes = await supabase
    .from("delivery_assignments")
    .select("id")
    .eq("order_id", input.orderId)
    .maybeSingle();

  if (assignmentRes.data) {
    await generateSimulatedGpsRoute(supabase, assignmentRes.data.id, input.originLat, input.originLng, input.destLat, input.destLng);
  }

  return { success: true, assigned: true, vehicleType: assignedType };
}

async function generateSimulatedGpsRoute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  assignmentId: string,
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
) {
  const steps = 20;
  const coordinates = [];
  const now = Date.now();

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = originLat + (destLat - originLat) * t;
    const lng = originLng + (destLng - originLng) * t;
    // Add small noise for realism
    const noiseLat = (Math.random() - 0.5) * 0.0005;
    const noiseLng = (Math.random() - 0.5) * 0.0005;

    coordinates.push({
      assignment_id: assignmentId,
      lat: lat + noiseLat,
      lng: lng + noiseLng,
      altitude_m: i === 0 || i === steps ? null : 50 + Math.random() * 30,
      speed_kmh: i === 0 ? 0 : 15 + Math.random() * 20,
      recorded_at: new Date(now + i * 30000).toISOString(), // 30 seconds apart
      is_simulated: true,
    });
  }

  await supabase.from("gps_coordinates").insert(coordinates);
}

export async function updateAssignmentStatus(assignmentId: string, status: string) {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return { success: false, error: "Supabase no configurado" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Debes iniciar sesión." };

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id, disabled_at")
    .eq("user_id", user.id)
    .is("disabled_at", null)
    .maybeSingle();

  if (!adminRow) return { success: false, error: "No tienes permisos de administrador." };

  const { error } = await supabase
    .from("delivery_assignments")
    .update({ status })
    .eq("id", assignmentId);

  if (!error && status === "delivered") {
    await supabase
      .from("delivery_assignments")
      .update({ delivered_at: new Date().toISOString() })
      .eq("id", assignmentId);

    // Free vehicle/drone
    const { data } = await supabase
      .from("delivery_assignments")
      .select("vehicle_id, drone_id")
      .eq("id", assignmentId)
      .maybeSingle();

    if (data?.drone_id) {
      await supabase.from("drones").update({ status: "available" }).eq("id", data.drone_id);
    }
    if (data?.vehicle_id) {
      await supabase.from("delivery_vehicles").update({ is_available: true }).eq("id", data.vehicle_id);
    }
  }

  return { success: !error, error: error?.message };
}

export async function verifyAndDeliverAssignment(assignmentId: string, pinInput: string) {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return { success: false, error: "Supabase no configurado" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Debes iniciar sesión." };

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id, disabled_at")
    .eq("user_id", user.id)
    .is("disabled_at", null)
    .maybeSingle();

  if (!adminRow) return { success: false, error: "No tienes permisos de administrador." };

  const pin = (pinInput || "").trim();
  if (!pin) return { success: false, error: "Debes ingresar el PIN de entrega." };

  const { data: assignment, error: assignmentErr } = await supabase
    .from("delivery_assignments")
    .select("id, order_id, vehicle_id, drone_id, status, orders(id, delivery_pin, delivery_pin_verified)")
    .eq("id", assignmentId)
    .maybeSingle();

  if (assignmentErr || !assignment) {
    return { success: false, error: assignmentErr?.message || "No se encontró la asignación." };
  }

  const orderRel = Array.isArray(assignment.orders) ? assignment.orders[0] : assignment.orders;
  if (!orderRel) return { success: false, error: "No se encontró la orden asociada." };

  const expectedPin = (orderRel.delivery_pin || "").trim();
  if (!expectedPin) return { success: false, error: "Esta orden no tiene PIN configurado." };

  if (pin !== expectedPin) {
    return { success: false, error: "PIN incorrecto. Verifica e intenta de nuevo." };
  }

  const now = new Date().toISOString();

  const { error: assignmentUpdateErr } = await supabase
    .from("delivery_assignments")
    .update({ status: "delivered", delivered_at: now })
    .eq("id", assignmentId);

  if (assignmentUpdateErr) return { success: false, error: assignmentUpdateErr.message };

  const { error: orderUpdateErr } = await supabase
    .from("orders")
    .update({
      status: "delivered",
      fulfillment_status: "delivered",
      delivery_pin_verified: true,
      updated_at: now,
    })
    .eq("id", assignment.order_id);

  if (orderUpdateErr) return { success: false, error: orderUpdateErr.message };

  if (assignment.drone_id) {
    await supabase.from("drones").update({ status: "available" }).eq("id", assignment.drone_id);
  }
  if (assignment.vehicle_id) {
    await supabase.from("delivery_vehicles").update({ is_available: true }).eq("id", assignment.vehicle_id);
  }

  return { success: true };
}

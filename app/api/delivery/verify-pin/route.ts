import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";

/**
 * Delivery driver PIN verification — public endpoint
 * Allows drivers to verify the delivery PIN and mark an order as delivered.
 */
export async function POST(req: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Server misconfigured" }, { status: 500 });
  }

  let body: { orderId?: string; pin?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = (body.orderId || "").trim();
  const pinInput = (body.pin || "").trim();

  if (!orderId || !pinInput) {
    return NextResponse.json({ success: false, error: "Orden y PIN son requeridos." }, { status: 400 });
  }

  // Fetch order and assignment
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, status, delivery_pin, delivery_pin_verified")
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr || !order) {
    return NextResponse.json({ success: false, error: "Pedido no encontrado." }, { status: 404 });
  }

  const { data: assignment, error: assignErr } = await supabase
    .from("delivery_assignments")
    .select("id, status, vehicle_id, drone_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (assignErr) {
    return NextResponse.json({ success: false, error: "Error consultando la entrega." }, { status: 500 });
  }

  if (!assignment) {
    return NextResponse.json({ success: false, error: "Este pedido no tiene asignación de entrega." }, { status: 400 });
  }

  if (assignment.status === "delivered") {
    return NextResponse.json({ success: false, error: "Este pedido ya fue entregado." }, { status: 400 });
  }

  if (assignment.status !== "in_transit" && assignment.status !== "assigned") {
    return NextResponse.json({ success: false, error: "La entrega aún no está en tránsito." }, { status: 400 });
  }

  const expectedPin = (order.delivery_pin || "").trim();
  if (!expectedPin) {
    return NextResponse.json({ success: false, error: "Este pedido no tiene PIN configurado." }, { status: 400 });
  }

  if (pinInput !== expectedPin) {
    return NextResponse.json({ success: false, error: "PIN incorrecto. Verifica e intenta de nuevo." }, { status: 403 });
  }

  const now = new Date().toISOString();

  // Mark assignment delivered
  const { error: assignUpdateErr } = await supabase
    .from("delivery_assignments")
    .update({ status: "delivered", delivered_at: now })
    .eq("id", assignment.id);

  if (assignUpdateErr) {
    return NextResponse.json({ success: false, error: "No se pudo actualizar la entrega." }, { status: 500 });
  }

  // Mark order delivered
  const { error: orderUpdateErr } = await supabase
    .from("orders")
    .update({
      status: "delivered",
      fulfillment_status: "delivered",
      delivery_pin_verified: true,
      updated_at: now,
    })
    .eq("id", orderId);

  if (orderUpdateErr) {
    return NextResponse.json({ success: false, error: "No se pudo actualizar el pedido." }, { status: 500 });
  }

  // Free vehicle/drone
  if (assignment.drone_id) {
    await supabase.from("drones").update({ status: "available" }).eq("id", assignment.drone_id);
  }
  if (assignment.vehicle_id) {
    await supabase.from("delivery_vehicles").update({ is_available: true }).eq("id", assignment.vehicle_id);
  }

  return NextResponse.json({ success: true, message: "Entrega confirmada correctamente." });
}

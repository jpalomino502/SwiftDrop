import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
  }

  try {
    const { data: assignment, error: aErr } = await supabase
      .from("delivery_assignments")
      .select("*, delivery_vehicles(*), drones(*)")
      .eq("order_id", orderId)
      .maybeSingle();

    if (aErr) throw aErr;

    if (!assignment) {
      return NextResponse.json({ assignment: null, coordinates: [], progress: 0 });
    }

    const { data: coords, error: cErr } = await supabase
      .from("gps_coordinates")
      .select("*")
      .eq("assignment_id", assignment.id)
      .order("recorded_at", { ascending: true });

    if (cErr) throw cErr;

    const coordinates = coords ?? [];

    // Calculate progress
    let progress = 0;
    if (assignment.status === "delivered") {
      progress = 100;
    } else if (assignment.status === "assigned") {
      progress = 10;
    } else if (assignment.status === "in_transit" && coordinates.length > 0) {
      // Simple progress: how far along the route based on timestamp
      const first = new Date(coordinates[0].recorded_at).getTime();
      const last = new Date(coordinates[coordinates.length - 1].recorded_at).getTime();
      const now = Date.now();
      if (now >= last) progress = 95;
      else if (now <= first) progress = 15;
      else progress = 15 + ((now - first) / (last - first)) * 80;
    }

    return NextResponse.json({ assignment, coordinates, progress });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de tracking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

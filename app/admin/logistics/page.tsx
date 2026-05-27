"use client";

import { useEffect, useState } from "react";
import { Route, RefreshCw } from "lucide-react";

import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";
import { useAdminAccess } from "@/src/features/admin/ui/client/useAdminAccess";
import { AssignmentCard } from "@/src/features/logistics/ui/components/AssignmentCard";
import type { DeliveryAssignment, DeliveryVehicle } from "@/src/features/logistics/domain/DeliveryAssignment";
import type { Drone } from "@/src/features/drones/domain/Drone";
import { updateAssignmentStatus, verifyAndDeliverAssignment } from "@/src/features/logistics/server/actions";

export default function LogisticsPage() {
  const access = useAdminAccess();
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [vehicles, setVehicles] = useState<DeliveryVehicle[]>([]);
  const [drones, setDrones] = useState<Drone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);

    try {
      const [{ data: a }, { data: v }, { data: d }] = await Promise.all([
        supabase
          .from("delivery_assignments")
          .select("*, orders(id, order_number, total_cents, status), delivery_vehicles(*), drones(*)")
          .in("status", ["pending", "assigned", "in_transit"])
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("delivery_vehicles").select("*").order("type"),
        supabase.from("drones").select("*").order("name"),
      ]);
      setAssignments((a ?? []) as DeliveryAssignment[]);
      setVehicles((v ?? []) as DeliveryVehicle[]);
      setDrones((d ?? []) as Drone[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando logística");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(assignmentId: string, status: string, pin?: string) {
    setError("");
    if (status === "delivered") {
      const res = await verifyAndDeliverAssignment(assignmentId, pin ?? "");
      if (!res.success) {
        setError(res.error || "No se pudo verificar el PIN de entrega.");
        return;
      }
      await load();
      return;
    }

    const res = await updateAssignmentStatus(assignmentId, status);
    if (!res.success) {
      setError(res.error || "No se pudo actualizar el estado de la entrega.");
      return;
    }
    await load();
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access.status]);

  if (access.status !== "ready") {
    return (
      <div className="bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-normal">Logística</h2>
        <p className="mt-2 text-sm text-gray-600">Acceso restringido.</p>
      </div>
    );
  }

  const availableDrones = drones.filter((d) => d.status === "available").length;
  const availableMotorcycles = vehicles.filter((v) => v.type === "motorcycle" && v.is_available).length;
  const availableBicycles = vehicles.filter((v) => v.type === "bicycle" && v.is_available).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-normal">Logística Multimodal</h2>
          <p className="text-sm text-gray-500 font-light mt-1">Asignación de entregas y flota de transporte simulada.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {error && <div className="border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {/* Fleet summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
          <p className="text-xs text-gray-400 uppercase">Drones disponibles</p>
          <p className="text-2xl font-medium mt-1">{availableDrones}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
          <p className="text-xs text-gray-400 uppercase">Motos disponibles</p>
          <p className="text-2xl font-medium mt-1">{availableMotorcycles}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
          <p className="text-xs text-gray-400 uppercase">Bicicletas disponibles</p>
          <p className="text-2xl font-medium mt-1">{availableBicycles}</p>
        </div>
      </div>

      {/* Assignments */}
      <div>
        <h3 className="text-lg font-normal mb-4">Entregas activas</h3>
        {loading && <p className="text-sm text-gray-500">Cargando…</p>}
        {!loading && assignments.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-lg p-8 text-center">
            <Route size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No hay entregas activas.</p>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {assignments.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              onUpdateStatus={(status, pin) => void updateStatus(a.id, status, pin)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

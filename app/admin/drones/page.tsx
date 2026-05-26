"use client";

import { useEffect, useState } from "react";
import { Plane, AlertTriangle, Wrench, Battery, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";

import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";
import { useAdminAccess } from "@/src/features/admin/ui/client/useAdminAccess";
import { DroneStatusBadge } from "@/src/features/drones/ui/components/DroneStatusBadge";
import type { Drone, DroneAlert } from "@/src/features/drones/domain/Drone";

export default function DronesPage() {
  const access = useAdminAccess();
  const [drones, setDrones] = useState<Drone[]>([]);
  const [alerts, setAlerts] = useState<DroneAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);

    try {
      const [{ data: d }, { data: a }] = await Promise.all([
        supabase.from("drones").select("*").order("created_at", { ascending: false }),
        supabase.from("drone_alerts").select("*").eq("resolved", false).order("created_at", { ascending: false }),
      ]);
      setDrones((d ?? []) as Drone[]);
      setAlerts((a ?? []) as DroneAlert[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando drones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access.status]);

  if (access.status !== "ready") {
    return (
      <div className="bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-normal">Drones</h2>
        <p className="mt-2 text-sm text-gray-600">Acceso restringido al panel de administración.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-normal">Gestión de Drones</h2>
          <p className="text-sm text-gray-500 font-light mt-1">Monitorea tu flota de entrega aérea simulada.</p>
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

      {error && (
        <div className="border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white border border-amber-100 rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-600" />
            <h3 className="text-sm font-medium text-amber-800">Alertas activas ({alerts.length})</h3>
          </div>
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-2">
                {a.message} — <span className="text-xs opacity-70">{a.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drones grid */}
      {loading && <p className="text-sm text-gray-500">Cargando drones…</p>}

      {!loading && drones.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-lg p-8 text-center">
          <Plane size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No hay drones registrados.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {drones.map((drone) => (
          <Link
            key={drone.id}
            href={`/admin/drones/${drone.id}`}
            className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm hover:border-black transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                  <Plane size={18} strokeWidth={1.5} className="text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium group-hover:underline">{drone.name}</h3>
                  <p className="text-xs text-gray-400">{drone.serial_number}</p>
                </div>
              </div>
              <DroneStatusBadge status={drone.status} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-gray-500">
              <div className="bg-gray-50 rounded-md p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Battery size={12} />
                  <span>Batería</span>
                </div>
                <span className="text-sm font-medium text-black">{drone.battery_level}%</span>
              </div>
              <div className="bg-gray-50 rounded-md p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wrench size={12} />
                  <span>Carga máx</span>
                </div>
                <span className="text-sm font-medium text-black">{drone.max_payload_kg} kg</span>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-400">
              {drone.next_maintenance_at
                ? `Próx. mantenimiento: ${new Date(drone.next_maintenance_at).toLocaleDateString("es-CO")}`
                : "Sin mantenimiento programado"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

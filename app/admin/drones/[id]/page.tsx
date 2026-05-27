"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Plane, Battery, Wrench, Save, AlertTriangle } from "lucide-react";
import Link from "next/link";

import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";
import { useAdminAccess } from "@/src/features/admin/ui/client/useAdminAccess";
import { DroneStatusBadge } from "@/src/features/drones/ui/components/DroneStatusBadge";
import { DroneAlertCard } from "@/src/features/drones/ui/components/DroneAlertCard";
import { MaintenanceTimeline } from "@/src/features/drones/ui/components/MaintenanceTimeline";
import type { Drone, DroneMaintenance, DroneAlert } from "@/src/features/drones/domain/Drone";

export default function DroneDetailPage() {
  const access = useAdminAccess();
  const params = useParams();
  const id = params?.id as string;

  const [drone, setDrone] = useState<Drone | null>(null);
  const [maintenance, setMaintenance] = useState<DroneMaintenance[]>([]);
  const [alerts, setAlerts] = useState<DroneAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");

  async function load() {
    if (!id) return;
    setError("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);

    try {
      const { data: d, error: dErr } = await supabase
        .from("drones")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (dErr) throw dErr;
      setDrone(d as Drone);
      setNewStatus((d as Drone).status);

      const { data: m } = await supabase
        .from("drone_maintenance")
        .select("*")
        .eq("drone_id", id)
        .order("performed_at", { ascending: false });
      setMaintenance((m ?? []) as DroneMaintenance[]);

      const { data: a } = await supabase
        .from("drone_alerts")
        .select("*")
        .eq("drone_id", id)
        .order("created_at", { ascending: false });
      setAlerts((a ?? []) as DroneAlert[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando drone");
    } finally {
      setLoading(false);
    }
  }

  async function saveStatus() {
    if (!id || !newStatus) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSaving(true);
    const { error: err } = await supabase.from("drones").update({ status: newStatus }).eq("id", id);
    if (!err) await load();
    setSaving(false);
  }

  async function addMaintenance(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!id) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const fd = new FormData(e.currentTarget);
    const { error: err } = await supabase.from("drone_maintenance").insert({
      drone_id: id,
      type: fd.get("type") as string,
      description: fd.get("description") as string,
      technician: fd.get("technician") as string,
      cost_cents: Number(fd.get("cost_cents") ?? 0),
      notes: fd.get("notes") as string,
    });
    if (!err) {
      await supabase.from("drones").update({
        last_maintenance_at: new Date().toISOString(),
        next_maintenance_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq("id", id);
      await load();
      e.currentTarget.reset();
    }
  }

  async function resolveAlert(alertId: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.from("drone_alerts").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", alertId);
    await load();
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, access.status]);

  if (access.status !== "ready") {
    return (
      <div className="bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-normal">Detalle del Drone</h2>
        <p className="mt-2 text-sm text-gray-600">Acceso restringido.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/drones" className="text-gray-400 hover:text-black transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-normal">{drone?.name ?? "Detalle del Drone"}</h2>
          {drone && <p className="text-sm text-gray-400 mt-1">{drone.serial_number}</p>}
        </div>
      </div>

      {error && <div className="border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading && <p className="text-sm text-gray-500">Cargando…</p>}

      {!loading && drone && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Info */}
            <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                    <Plane size={22} strokeWidth={1.5} className="text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-normal">{drone.name}</h3>
                    <DroneStatusBadge status={drone.status} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Batería</p>
                  <p className={`text-lg font-medium ${drone.battery_level < 30 ? "text-red-600" : "text-black"}`}>
                    {drone.battery_level}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-xs text-gray-400">Carga máx</p>
                  <p className="text-sm font-medium">{drone.max_payload_kg} kg</p>
                </div>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-xs text-gray-400">Distancia máx</p>
                  <p className="text-sm font-medium">{drone.max_distance_km} km</p>
                </div>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-xs text-gray-400">Últ. mantenimiento</p>
                  <p className="text-sm font-medium">
                    {drone.last_maintenance_at
                      ? new Date(drone.last_maintenance_at).toLocaleDateString("es-CO")
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-xs text-gray-400">Próx. mantenimiento</p>
                  <p className="text-sm font-medium">
                    {drone.next_maintenance_at
                      ? new Date(drone.next_maintenance_at).toLocaleDateString("es-CO")
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <label className="text-xs text-gray-500 block mb-2">Cambiar estado</label>
                <div className="flex items-center gap-3">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-md text-sm px-3 py-2 outline-none"
                  >
                    <option value="available">Disponible</option>
                    <option value="assigned">Asignado</option>
                    <option value="maintenance">En mantenimiento</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void saveStatus()}
                    disabled={saving || newStatus === drone.status}
                    className="inline-flex items-center gap-2 bg-black text-white text-xs px-4 py-2 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    <Save size={14} />
                    {saving ? "Guardando…" : "Guardar"}
                  </button>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} />
                <h3 className="text-sm font-medium">Alertas</h3>
              </div>
              <div className="space-y-3">
                {alerts.filter((a) => !a.resolved).length === 0 && (
                  <p className="text-sm text-gray-400">Sin alertas activas.</p>
                )}
                {alerts
                  .filter((a) => !a.resolved)
                  .map((a) => (
                    <DroneAlertCard key={a.id} alert={a} onResolve={() => void resolveAlert(a.id)} />
                  ))}
              </div>
            </div>
          </div>

          {/* Maintenance */}
          <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Wrench size={16} />
              <h3 className="text-sm font-medium">Historial de mantenimiento</h3>
            </div>
            <MaintenanceTimeline records={maintenance} />

            <form onSubmit={addMaintenance} className="mt-6 border-t border-gray-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <h4 className="sm:col-span-2 text-sm font-medium">Registrar mantenimiento simulado</h4>
              <select name="type" required className="bg-gray-50 border border-gray-200 rounded-md text-sm px-3 py-2 outline-none">
                <option value="preventive">Preventivo</option>
                <option value="corrective">Correctivo</option>
                <option value="inspection">Inspección</option>
                <option value="battery_replacement">Cambio de batería</option>
              </select>
              <input name="technician" placeholder="Técnico" required className="bg-gray-50 border border-gray-200 rounded-md text-sm px-3 py-2 outline-none" />
              <input name="description" placeholder="Descripción" required className="sm:col-span-2 bg-gray-50 border border-gray-200 rounded-md text-sm px-3 py-2 outline-none" />
              <input name="cost_cents" type="number" placeholder="Costo (centavos)" defaultValue={0} className="bg-gray-50 border border-gray-200 rounded-md text-sm px-3 py-2 outline-none" />
              <input name="notes" placeholder="Notas" className="bg-gray-50 border border-gray-200 rounded-md text-sm px-3 py-2 outline-none" />
              <div className="sm:col-span-2">
                <button type="submit" className="bg-black text-white text-xs px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors">
                  Registrar mantenimiento
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

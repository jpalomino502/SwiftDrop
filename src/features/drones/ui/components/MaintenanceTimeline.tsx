import type { DroneMaintenance, MaintenanceType } from "../../domain/Drone";

const TYPE_LABELS: Record<MaintenanceType, string> = {
  preventive: "Preventivo",
  corrective: "Correctivo",
  inspection: "Inspección",
  battery_replacement: "Cambio de batería",
};

export function MaintenanceTimeline({ records }: { records: DroneMaintenance[] }) {
  if (!records || records.length === 0) {
    return <p className="text-sm text-gray-500">Sin registros de mantenimiento.</p>;
  }

  return (
    <div className="space-y-4">
      {records.map((r) => (
        <div key={r.id} className="flex gap-4 items-start">
          <div className="mt-1.5 w-2 h-2 rounded-full bg-gray-400 shrink-0" />
          <div className="flex-1 border-l border-gray-100 pl-4 pb-4">
            <p className="text-sm font-medium">{TYPE_LABELS[r.type as MaintenanceType] ?? r.type}</p>
            <p className="text-sm text-gray-600 mt-0.5">{r.description || "Sin descripción"}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span>{new Date(r.performed_at).toLocaleDateString("es-CO")}</span>
              {r.technician && <span>• {r.technician}</span>}
              {r.cost_cents > 0 && <span>• ${(r.cost_cents / 100).toLocaleString("es-CO")}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

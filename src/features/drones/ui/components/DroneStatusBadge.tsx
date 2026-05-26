import type { DroneStatus } from "../../domain/Drone";

const STATUS_LABELS: Record<DroneStatus, string> = {
  available: "Disponible",
  assigned: "Asignado",
  maintenance: "En mantenimiento",
  inactive: "Inactivo",
};

const STATUS_CLASSES: Record<DroneStatus, string> = {
  available: "bg-green-50 text-green-700 border-green-100",
  assigned: "bg-blue-50 text-blue-700 border-blue-100",
  maintenance: "bg-amber-50 text-amber-700 border-amber-100",
  inactive: "bg-gray-50 text-gray-500 border-gray-100",
};

export function DroneStatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status as DroneStatus] ?? status;
  const cls = STATUS_CLASSES[status as DroneStatus] ?? "bg-gray-50 text-gray-500 border-gray-100";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-normal border ${cls}`}>
      {label}
    </span>
  );
}

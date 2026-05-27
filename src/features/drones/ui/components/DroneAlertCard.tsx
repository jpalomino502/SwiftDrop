import type { DroneAlert, AlertSeverity } from "../../domain/Drone";

const SEVERITY_CLASSES: Record<AlertSeverity, string> = {
  low: "bg-blue-50 text-blue-700 border-blue-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

export function DroneAlertCard({ alert, onResolve }: { alert: DroneAlert; onResolve?: () => void }) {
  return (
    <div className={`border rounded-lg p-4 ${SEVERITY_CLASSES[alert.severity]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{alert.message}</p>
          <p className="text-xs mt-1 opacity-80">{alert.type} — {new Date(alert.created_at).toLocaleDateString("es-CO")}</p>
        </div>
        {!alert.resolved && onResolve && (
          <button
            type="button"
            onClick={onResolve}
            className="text-xs underline opacity-80 hover:opacity-100"
          >
            Resolver
          </button>
        )}
        {alert.resolved && (
          <span className="text-xs opacity-70">Resuelto</span>
        )}
      </div>
    </div>
  );
}

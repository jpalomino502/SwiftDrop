import type { DeliveryAssignment } from "../../domain/DeliveryAssignment";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  in_transit: "En tránsito",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const VEHICLE_EMOJI: Record<string, string> = {
  drone: "🚁",
  motorcycle: "🏍️",
  bicycle: "🚲",
};

export function AssignmentCard({
  assignment,
  onUpdateStatus,
}: {
  assignment: DeliveryAssignment & {
    orders?: { id: string; order_number: number; total_cents: number; status: string } | null;
    delivery_vehicles?: { name: string; type: string } | null;
    drones?: { name: string } | null;
  };
  onUpdateStatus?: (status: string, pin?: string) => void;
}) {
  const order = assignment.orders;
  const vehicle = assignment.delivery_vehicles;
  const drone = assignment.drones;
  const name = drone?.name ?? vehicle?.name ?? "Sin vehículo";
  const type = assignment.assigned_vehicle_type ?? "motorcycle";

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Pedido</p>
          <p className="text-sm font-medium mt-0.5">
            #{order ? String(order.order_number).padStart(4, "0") : assignment.order_id.slice(0, 8)}
          </p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-1 text-xs border border-gray-100">
            {STATUS_LABELS[assignment.status] ?? assignment.status}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="text-2xl">{VEHICLE_EMOJI[type] ?? "🚚"}</div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-gray-500 capitalize">{type}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
        <div>Peso estimado: {assignment.estimated_weight_kg} kg</div>
        <div>Distancia: {assignment.estimated_distance_km} km</div>
      </div>

      {onUpdateStatus && assignment.status !== "delivered" && assignment.status !== "cancelled" && (
        <div className="mt-4 flex gap-2">
          {assignment.status === "pending" && (
            <button
              type="button"
              onClick={() => onUpdateStatus("assigned")}
              className="text-xs bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors"
            >
              Asignar
            </button>
          )}
          {assignment.status === "assigned" && (
            <button
              type="button"
              onClick={() => onUpdateStatus("in_transit")}
              className="text-xs bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors"
            >
              Iniciar tránsito
            </button>
          )}
          {assignment.status === "in_transit" && (
            <button
              type="button"
              onClick={() => {
                const pin = window.prompt("Ingresa el PIN de entrega para confirmar:");
                if (!pin) return;
                onUpdateStatus("delivered", pin);
              }}
              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-700 transition-colors"
            >
              Marcar entregado
            </button>
          )}
        </div>
      )}
    </div>
  );
}

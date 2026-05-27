import type { VehicleType } from "@/src/features/logistics/domain/DeliveryAssignment";

export function determineVehicleType(
  weightKg: number,
  distanceKm: number,
  availableDrones: number,
  availableMotorcycles: number,
  availableBicycles: number
): { type: VehicleType | null; reason: string } {
  if (weightKg <= 3 && distanceKm <= 8 && availableDrones > 0) {
    return { type: "drone", reason: "Peso y distancia aptos para dron" };
  }

  if (weightKg <= 5 && distanceKm <= 5 && availableBicycles > 0) {
    return { type: "bicycle", reason: "Peso y distancia aptos para bicicleta" };
  }

  if (weightKg <= 15 && distanceKm <= 20 && availableMotorcycles > 0) {
    return { type: "motorcycle", reason: "Asignación por motocicleta (fallback o por distancia/peso)" };
  }

  if (availableMotorcycles > 0) {
    return { type: "motorcycle", reason: "Asignación por motocicleta (último recurso)" };
  }

  return { type: null, reason: "No hay vehículos disponibles para este pedido" };
}

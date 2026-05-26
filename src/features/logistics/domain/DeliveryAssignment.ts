export type VehicleType = "drone" | "motorcycle" | "bicycle";

export type AssignmentStatus = "pending" | "assigned" | "in_transit" | "delivered" | "cancelled";

export type DeliveryVehicle = {
  id: string;
  name: string;
  type: VehicleType;
  license_plate: string | null;
  max_payload_kg: number;
  max_distance_km: number;
  is_available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  battery_or_fuel_level: number;
  created_at: string;
  updated_at: string;
};

export type DeliveryAssignment = {
  id: string;
  order_id: string;
  vehicle_id: string | null;
  drone_id: string | null;
  status: AssignmentStatus;
  estimated_weight_kg: number;
  estimated_distance_km: number;
  assigned_vehicle_type: VehicleType | null;
  assigned_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GpsCoordinate = {
  id: string;
  assignment_id: string;
  lat: number;
  lng: number;
  altitude_m: number | null;
  speed_kmh: number | null;
  recorded_at: string;
  is_simulated: boolean;
};

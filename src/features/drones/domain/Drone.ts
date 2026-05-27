export type DroneStatus = "available" | "assigned" | "maintenance" | "inactive";

export type Drone = {
  id: string;
  name: string;
  serial_number: string | null;
  status: DroneStatus;
  battery_level: number;
  max_payload_kg: number;
  max_distance_km: number;
  current_lat: number | null;
  current_lng: number | null;
  last_maintenance_at: string | null;
  next_maintenance_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MaintenanceType = "preventive" | "corrective" | "inspection" | "battery_replacement";

export type DroneMaintenance = {
  id: string;
  drone_id: string;
  type: MaintenanceType;
  description: string | null;
  performed_at: string;
  technician: string | null;
  cost_cents: number;
  notes: string | null;
  created_at: string;
};

export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertType = "maintenance_due" | "battery_low" | "payload_exceeded" | "distance_exceeded" | "gps_lost" | "general";

export type DroneAlert = {
  id: string;
  drone_id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
};

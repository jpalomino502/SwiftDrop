export type { DeliveryAssignment, DeliveryVehicle, GpsCoordinate, VehicleType, AssignmentStatus } from "./domain/DeliveryAssignment";
export { TrackingMap } from "./ui/client/TrackingMap.client";
export { AssignmentCard } from "./ui/components/AssignmentCard";
export { determineVehicleType } from "./lib/assignmentAlgorithm";
export { interpolateRoute, calculateDistanceKm, BUCARAMANGA_WAREHOUSE } from "./lib/gpsSimulator";

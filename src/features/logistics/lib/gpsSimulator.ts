export type LatLng = { lat: number; lng: number };

export function interpolateRoute(origin: LatLng, dest: LatLng, steps: number): LatLng[] {
  const coords: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = origin.lat + (dest.lat - origin.lat) * t;
    const lng = origin.lng + (dest.lng - origin.lng) * t;
    coords.push({ lat, lng });
  }
  return coords;
}

export function addRouteNoise(coords: LatLng[], amplitude: number = 0.0003): LatLng[] {
  return coords.map((c) => ({
    lat: c.lat + (Math.random() - 0.5) * amplitude,
    lng: c.lng + (Math.random() - 0.5) * amplitude,
  }));
}

export function calculateDistanceKm(a: LatLng, b: LatLng): number {
  const R = 6371; // km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * y;
}

// Bucaramanga approximate coordinates for demo
export const BUCARAMANGA_WAREHOUSE: LatLng = { lat: 7.12539, lng: -73.1198 };

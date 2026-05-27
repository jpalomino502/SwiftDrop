"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon in webpack/next.js
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src || markerIcon2x,
  iconUrl: markerIcon.src || markerIcon,
  shadowUrl: markerShadow.src || markerShadow,
});

const warehouseIcon = new L.DivIcon({
  className: "custom-div-icon",
  html: `<div style="background:#111;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;">B</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const vehicleIcon = new L.DivIcon({
  className: "custom-div-icon",
  html: `<div style="background:#fbbf24;color:#000;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;border:2px solid #000;">V</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const destIcon = new L.DivIcon({
  className: "custom-div-icon",
  html: `<div style="background:#22c55e;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;border:2px solid #fff;">D</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

type Props = {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  currentPosition?: { lat: number; lng: number };
  route?: { lat: number; lng: number }[];
  progressPercent?: number;
  height?: string;
};

export function TrackingMap({
  origin,
  destination,
  currentPosition,
  route,
  progressPercent = 0,
  height = "300px",
}: Props) {
  const center = useMemo(() => {
    return {
      lat: (origin.lat + destination.lat) / 2,
      lng: (origin.lng + destination.lng) / 2,
    };
  }, [origin, destination]);

  const polylinePositions = useMemo(() => {
    if (route && route.length > 0) return route.map((r) => [r.lat, r.lng] as [number, number]);
    return [
      [origin.lat, origin.lng] as [number, number],
      [destination.lat, destination.lng] as [number, number],
    ];
  }, [route, origin, destination]);

  const activePos = currentPosition ?? origin;

  return (
    <div style={{ height, width: "100%" }} className="rounded-lg overflow-hidden border border-gray-100">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[origin.lat, origin.lng]} icon={warehouseIcon}>
          <Popup>Bodega / Centro logístico</Popup>
        </Marker>
        <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
          <Popup>Destino de entrega</Popup>
        </Marker>
        <Marker position={[activePos.lat, activePos.lng]} icon={vehicleIcon}>
          <Popup>Ubicación actual del vehículo</Popup>
        </Marker>
        <Polyline positions={polylinePositions} color="#111" weight={3} opacity={0.8} />
      </MapContainer>
      {progressPercent > 0 && (
        <div className="bg-white border-t border-gray-100 px-4 py-2 text-xs text-gray-500 flex items-center justify-between">
          <span>Progreso de entrega</span>
          <span className="font-medium text-black">{Math.round(progressPercent)}%</span>
        </div>
      )}
    </div>
  );
}

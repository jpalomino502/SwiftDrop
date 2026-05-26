"use client";

import { Input, Button } from "@heroui/react";
import { CheckCircle, Search, MapPin, Package, Truck } from "lucide-react";
import { useState, FormEvent, useEffect } from "react";
import dynamic from "next/dynamic";

import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";
import type { DeliveryAssignment } from "@/src/features/logistics/domain/DeliveryAssignment";
import type { GpsCoordinate } from "@/src/features/logistics/domain/DeliveryAssignment";
import { BUCARAMANGA_WAREHOUSE } from "@/src/features/logistics/lib/gpsSimulator";

const TrackingMap = dynamic(
  () => import("@/src/features/logistics/ui/client/TrackingMap.client").then((m) => m.TrackingMap),
  { ssr: false }
);

type TrackingResult = {
  order: {
    id: string;
    order_number: number;
    status: string;
    delivery_pin: number;
    delivery_pin_verified: boolean;
  } | null;
  assignment: DeliveryAssignment | null;
  coordinates: GpsCoordinate[];
  progress: number;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  paid: "Pagado",
  fulfilled: "Preparado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const VEHICLE_EMOJI: Record<string, string> = {
  drone: "🚁 Drone",
  motorcycle: "🏍️ Moto",
  bicycle: "🚲 Bicicleta",
};

export function TrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");
  const [liveProgress, setLiveProgress] = useState(0);

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!orderId) return;
    setIsSearching(true);
    setError("");
    setResult(null);

    try {
      const supabase = getSupabaseBrowserClient();

      // Normalize input: handle #ORD-000001, ORD-000001, or raw number
      let searchId = orderId.trim();
      let searchNumber: number | null = null;

      // Try to parse order number from formats like #ORD-000001 or ORD-000001
      const ordMatch = searchId.match(/ORD[-\s]?(\d+)/i);
      if (ordMatch) {
        searchNumber = parseInt(ordMatch[1], 10);
      } else if (/^\d+$/.test(searchId)) {
        // Raw number
        searchNumber = parseInt(searchId, 10);
      }

      // Build query: try exact ID match OR order_number match
      let query = supabase
        ?.from("orders")
        .select("id, order_number, status, delivery_pin, delivery_pin_verified");

      let orderData = null;

      if (searchNumber !== null) {
        const { data } = await query?.eq("order_number", searchNumber).maybeSingle() ?? { data: null };
        orderData = data;
      }

      // If not found by number and input looks like a UUID, try by ID
      if (!orderData && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchId)) {
        const { data } = await supabase
          ?.from("orders")
          .select("id, order_number, status, delivery_pin, delivery_pin_verified")
          .eq("id", searchId)
          .maybeSingle() ?? { data: null };
        orderData = data;
      }

      if (!orderData) {
        setError("Pedido no encontrado. Intenta con el número de orden (ej: ORD-000001) o el ID completo.");
        setIsSearching(false);
        return;
      }

      // Fetch tracking from API
      const res = await fetch(`/api/tracking/${orderData.id}`);
      const tracking = await res.json();

      setResult({
        order: orderData as TrackingResult["order"],
        assignment: tracking.assignment,
        coordinates: tracking.coordinates ?? [],
        progress: tracking.progress ?? 0,
      });
      setLiveProgress(tracking.progress ?? 0);
    } catch {
      setError("Error buscando el pedido.");
    } finally {
      setIsSearching(false);
    }
  };

  // Animate progress slightly for demo feel
  useEffect(() => {
    if (!result || result.progress >= 100 || result.progress <= 0) return;
    const interval = setInterval(() => {
      setLiveProgress((p) => {
        if (p >= 95) return p;
        return p + 0.5;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [result]);

  const origin = BUCARAMANGA_WAREHOUSE;
  const destination = result?.coordinates.length
    ? result.coordinates[result.coordinates.length - 1]
    : origin;
  const currentPos = result?.coordinates.length
    ? result.coordinates[Math.floor((liveProgress / 100) * (result.coordinates.length - 1))] ?? origin
    : origin;

  return (
    <div className="pb-24 px-6 max-w-5xl mx-auto min-h-screen">
      <div className="text-center mb-16">
        <h2 className="text-[10px] uppercase tracking-[0.5em] text-gray-400 mb-4">Logística Premium</h2>
        <h1 className="text-5xl md:text-7xl font-normal tracking-tighter mb-8">Rastrea tu Pedido</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto font-normal leading-relaxed">
          Introduce tu número de pedido para conocer la ubicación exacta de tu selección.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="relative mb-12">
          <Input
            value={orderId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrderId(e.target.value)}
            placeholder="NÚMERO DE PEDIDO"
            classNames={{
              inputWrapper: "bg-zinc-100 pr-32",
            }}
          />
          <Button
            type="submit"
            size="sm"
            radius="full"
            className="absolute right-2 top-2 bottom-2 bg-black text-white px-8 rounded-full text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center"
          >
            {isSearching ? "Buscando..." : "Rastrear"}
          </Button>
        </form>

        {error && (
          <div className="border border-red-100 bg-red-50 p-4 text-sm text-red-700 text-center rounded-lg">
            {error}
          </div>
        )}

        {result && result.order && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
            {/* Order header */}
            <div className="p-8 border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-white">
              <div className="text-center md:text-left">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Pedido</p>
                <p className="text-xl font-normal">#{String(result.order.order_number).padStart(4, "0")}</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Estado</p>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
                  <p className="text-xl font-normal">{STATUS_LABELS[result.order.status] ?? result.order.status}</p>
                </div>
              </div>
              <div className="text-center md:text-left">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">PIN de entrega</p>
                <p className="text-xl font-normal tracking-widest">{result.order.delivery_pin}</p>
              </div>
            </div>

            {/* Map */}
            {result.coordinates.length > 0 && (
              <div className="border border-gray-100 bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} />
                  <h3 className="text-sm font-medium">Seguimiento en mapa (simulado)</h3>
                </div>
                <TrackingMap
                  origin={origin}
                  destination={destination}
                  currentPosition={currentPos}
                  route={result.coordinates}
                  progressPercent={liveProgress}
                  height="320px"
                />
              </div>
            )}

            {/* Assignment info */}
            {result.assignment && (
              <div className="border border-gray-100 bg-white p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Truck size={16} />
                  <h3 className="text-sm font-medium">Vehículo asignado</h3>
                </div>
                <p className="text-sm text-gray-600">
                  {VEHICLE_EMOJI[result.assignment.assigned_vehicle_type ?? "motorcycle"] ?? "🚚 Vehículo"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Peso estimado: {result.assignment.estimated_weight_kg} kg — Distancia: {result.assignment.estimated_distance_km.toFixed(1)} km
                </p>
              </div>
            )}

            {/* Timeline */}
            <div className="border border-gray-100 bg-white p-6">
              <h3 className="text-sm font-medium mb-4">Estados del pedido</h3>
              <div className="space-y-4">
                {[
                  { label: "Pedido creado", completed: true },
                  { label: "Pago confirmado", completed: result.order.status !== "pending" && result.order.status !== "cancelled" },
                  { label: "Vehículo asignado", completed: !!result.assignment },
                  { label: "En ruta", completed: result.assignment?.status === "in_transit" || result.assignment?.status === "delivered" },
                  { label: "Cerca del destino", completed: liveProgress > 70 },
                  { label: "Entregado", completed: result.order.status === "delivered" },
                ].map((step, idx) => (
                  <div key={idx} className={`flex items-center gap-3 ${step.completed ? "opacity-100" : "opacity-30"}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${step.completed ? "bg-black" : "bg-gray-200"}`}>
                      {step.completed && <CheckCircle size={10} className="text-white" />}
                    </div>
                    <span className="text-sm">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* No tracking data fallback */}
            {!result.coordinates.length && !result.assignment && (
              <div className="border border-gray-100 bg-white p-6 text-center">
                <Package size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Tu pedido aún no tiene asignación de entrega.</p>
                <p className="text-xs text-gray-400 mt-1">Se actualizará en cuanto sea asignado a un vehículo.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

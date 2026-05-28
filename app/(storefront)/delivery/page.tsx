"use client";

import { useState } from "react";
import { Truck, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function DeliveryPage() {
  const [orderId, setOrderId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!orderId.trim() || !pin.trim()) {
      setError("Ingresa el número de orden y el PIN.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/delivery/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim(), pin: pin.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "No se pudo confirmar la entrega.");
      } else {
        setSuccess(data.message || "Entrega confirmada correctamente.");
        setPin("");
        setOrderId("");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-black text-white p-3 rounded-full">
            <Truck size={24} />
          </div>
        </div>
        <h1 className="text-center text-2xl font-normal mb-2">Confirmar entrega</h1>
        <p className="text-center text-sm text-gray-500 mb-8">
          Ingresa el ID de la orden y el PIN que el cliente te proporcionará.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5">
              ID de la orden
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Ej: ORD-000006"
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5">
              PIN de entrega
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="6 dígitos"
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 tracking-widest"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black text-white py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            {loading ? "Verificando…" : "Confirmar entrega"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          Si no tienes el PIN, pídeselo al cliente. Este PIN le fue enviado por SMS cuando su pedido salió en camino.
        </p>
      </div>
    </div>
  );
}

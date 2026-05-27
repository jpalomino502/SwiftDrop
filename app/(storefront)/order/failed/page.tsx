"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { XCircle, ArrowLeft } from "lucide-react";

export default function OrderFailedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order");
  const reason = searchParams.get("reason");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <XCircle className="mx-auto h-14 w-14 text-red-500 mb-5" />
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Pago no completado</h1>
        <p className="text-gray-600 mb-2">
          El pago fue rechazado o cancelado. No se realizó ningún cargo a tu tarjeta.
        </p>
        {reason === "payment_rejected" && (
          <p className="text-sm text-gray-500 mb-6">
            Puedes intentar con otro método de pago o contactar a tu banco.
          </p>
        )}
        {orderId && (
          <p className="text-xs text-gray-400 mb-6">Pedido: {orderId.slice(0, 8)}...</p>
        )}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/cart")}
            className="w-full rounded-xl bg-gray-900 text-white py-3 font-medium hover:bg-gray-800 transition-colors"
          >
            Volver al carrito
          </button>
          <button
            onClick={() => router.push("/checkout")}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-gray-700 border border-gray-300 py-3 font-medium hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
            Intentar de nuevo
          </button>
        </div>
      </div>
    </div>
  );
}

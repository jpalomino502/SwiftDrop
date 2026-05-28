"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function OrderCheckingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const reason = searchParams.get("reason");
  const orderId = searchParams.get("order");
  const refPayco = searchParams.get("ref");

  const [status, setStatus] = useState<"checking" | "approved" | "rejected" | "pending" | "error">("checking");
  const [message, setMessage] = useState("Verificando el estado de tu pago con ePayco...");
  const [attempts, setAttempts] = useState(0);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [checkError, setCheckError] = useState("");

  const maxAttempts = 6; // ~30 seconds total

  useEffect(() => {
    // If we have no ref_payco at all, we can't check anything
    if (!refPayco && !orderId) {
      setStatus("error");
      setMessage("No pudimos identificar tu transacción. Si ya realizaste el pago, contacta soporte.");
      return;
    }

    // If we only have reason=no_order_id but no refPayco, we can't query ePayco
    if (reason === "no_order_id" && !refPayco) {
      setStatus("error");
      setMessage("No recibimos el número de referencia de ePayco. Si ya pagaste, verifica tu correo o contacta soporte.");
      return;
    }

    const checkStatus = async () => {
      try {
        const url = new URL("/api/epayco/check-status", window.location.origin);
        if (refPayco) url.searchParams.set("ref_payco", refPayco);
        if (orderId) url.searchParams.set("order_id", orderId);

        const res = await fetch(url.toString());
        const data = await res.json();

        if (!data.success) {
          setCheckError(data.error || "Error consultando ePayco");
          if (data.isApproved && !data.orderId) {
            // Payment approved but we can't identify the order
            setStatus("error");
            setMessage("Tu pago fue aprobado, pero no pudimos identificar tu pedido. Contacta soporte con la referencia: " + refPayco);
            return;
          }
          // Retry if we haven't reached max attempts
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000);
            setAttempts((a) => a + 1);
          } else {
            setStatus("error");
            setMessage("No pudimos verificar tu pago en este momento. Revisa tu historial de pedidos más tarde.");
          }
          return;
        }

        if (data.isApproved) {
          setStatus("approved");
          setMessage("¡Tu pago fue aprobado! Redirigiendo...");
          setRedirectUrl(data.redirectUrl);
          setTimeout(() => {
            router.push(data.redirectUrl);
          }, 2000);
          return;
        }

        // Payment failed/rejected
        if (data.numericCode && data.numericCode !== 3) {
          setStatus("rejected");
          setMessage(`El pago fue rechazado o cancelado (código: ${data.numericCode}). Redirigiendo...`);
          setRedirectUrl(data.redirectUrl);
          setTimeout(() => {
            router.push(data.redirectUrl);
          }, 3000);
          return;
        }

        // Still pending (code 3 or no code yet)
        if (attempts < maxAttempts) {
          setStatus("pending");
          setMessage(`Tu pago aún está siendo procesado por ePayco. Verificando de nuevo en 5 segundos... (intento ${attempts + 1}/${maxAttempts})`);
          setTimeout(checkStatus, 5000);
          setAttempts((a) => a + 1);
        } else {
          setStatus("pending");
          setMessage("Tu pago sigue en proceso. Te enviaremos un correo cuando se confirme.");
        }
      } catch {
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
          setAttempts((a) => a + 1);
        } else {
          setStatus("error");
          setMessage("Error de conexión verificando tu pago. Intenta más tarde.");
        }
      }
    };

    // Start checking immediately
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusConfig = {
    checking: { icon: <Loader2 className="animate-spin h-10 w-10 text-amber-500" />, color: "text-amber-600", bg: "bg-amber-50" },
    pending: { icon: <Loader2 className="animate-spin h-10 w-10 text-blue-500" />, color: "text-blue-600", bg: "bg-blue-50" },
    approved: { icon: <CheckCircle className="h-10 w-10 text-green-500" />, color: "text-green-600", bg: "bg-green-50" },
    rejected: { icon: <AlertCircle className="h-10 w-10 text-red-500" />, color: "text-red-600", bg: "bg-red-50" },
    error: { icon: <AlertCircle className="h-10 w-10 text-gray-500" />, color: "text-gray-600", bg: "bg-gray-50" },
  };

  const current = statusConfig[status];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className={`mx-auto h-16 w-16 rounded-full ${current.bg} flex items-center justify-center mb-4`}>
          {current.icon}
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-2">Verificando tu pago</h1>
        <p className={`text-sm ${current.color} mb-6`}>{message}</p>

        {checkError && (
          <p className="text-xs text-red-500 mb-4">Error: {checkError}</p>
        )}

        {(status === "error" || status === "rejected") && (
          <div className="space-y-3">
            {redirectUrl && (
              <Link
                href={redirectUrl}
                className="block w-full rounded-xl bg-gray-900 text-white py-3 font-medium hover:bg-gray-800 transition-colors text-center"
              >
                Continuar
              </Link>
            )}
            <Link
              href="/profile/orders"
              className="block w-full rounded-xl bg-white text-gray-700 border border-gray-300 py-3 font-medium hover:bg-gray-50 transition-colors text-center"
            >
              Ver mis pedidos
            </Link>
          </div>
        )}

        {status === "approved" && redirectUrl && (
          <Link
            href={redirectUrl}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 text-white py-3 px-6 font-medium hover:bg-green-700 transition-colors"
          >
            Ver confirmación <ArrowRight size={16} />
          </Link>
        )}

        {status === "pending" && (
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
          >
            <RefreshCw size={14} />
            Verificar ahora
          </button>
        )}

        <p className="text-xs text-gray-400 mt-6">
          Ref: {refPayco || "—"} | Pedido: {orderId ? orderId.slice(0, 8) : "—"}
        </p>
      </div>
    </div>
  );
}

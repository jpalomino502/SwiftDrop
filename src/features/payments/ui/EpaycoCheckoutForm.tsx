"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";

interface EpaycoCheckoutData {
  name: string;
  description: string;
  invoice: string;
  currency: string;
  amount: string;
  tax_base: string;
  tax: string;
  country: string;
  lang: string;
  external: string;
  confirmation: string;
  response: string;
  email: string;
  extra1?: string;
  extra2?: string;
  extra3?: string;
  extra4?: string;
  extra5?: string;
  extra6?: string;
  extra7?: string;
  extra8?: string;
}

declare global {
  interface Window {
    ePayco?: {
      checkout: {
        configure: (config: { key: string; test: boolean }) => {
          open: (data: EpaycoCheckoutData & { autoclick?: string }) => void;
        };
      };
    };
  }
}

export function EpaycoCheckoutForm({
  publicKey,
  checkoutData,
  isTest,
}: {
  publicKey: string;
  checkoutData: EpaycoCheckoutData;
  isTest: boolean;
}) {
  const router = useRouter();
  const scriptLoaded = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [showTestAmount, setShowTestAmount] = useState(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    // If ePayco is already loaded
    if (window.ePayco?.checkout) {
      setStatus("ready");
      openEpaycoCheckout(checkoutData);
      return;
    }

    // Dynamically load ePayco checkout.js
    const script = document.createElement("script");
    script.src = "https://checkout.epayco.co/checkout.js";
    script.async = true;
    script.charset = "utf-8";

    script.onload = () => {
      if (window.ePayco?.checkout) {
        setStatus("ready");
        openEpaycoCheckout(checkoutData);
      } else {
        setStatus("error");
        setErrorMessage("No se pudo inicializar ePayco. Intenta recargar la página.");
      }
    };

    script.onerror = () => {
      setStatus("error");
      setErrorMessage("No se pudo cargar el SDK de ePayco. Verifica tu conexión a internet.");
    };

    document.body.appendChild(script);

    return () => {
      // Don't remove script as it might be used by other components
    };
  }, [publicKey, checkoutData, isTest]);

  function openEpaycoCheckout(data: EpaycoCheckoutData & { autoclick?: string }) {
    try {
      const handler = window.ePayco!.checkout.configure({
        key: publicKey,
        test: isTest,
      });

      handler.open({
        ...data,
        autoclick: "true",
      });
    } catch (e) {
      setStatus("error");
      setErrorMessage("Error al abrir el checkout de ePayco. Intenta de nuevo.");
      // eslint-disable-next-line no-console
      console.error("[ePayco] Error opening checkout:", e);
    }
  }

  const handleManualOpen = () => {
    if (!window.ePayco?.checkout) {
      setStatus("error");
      setErrorMessage("El SDK de ePayco no está disponible. Intenta recargar la página.");
      return;
    }
    openEpaycoCheckout({ ...checkoutData, autoclick: "false" });
  };

  const handleTestAmount = () => {
    const testData = {
      ...checkoutData,
      amount: "10000.00",
      tax_base: "10000.00",
      tax: "0.00",
      description: `${checkoutData.description} (monto de prueba)`,
      autoclick: "false",
    };
    openEpaycoCheckout(testData);
    setShowTestAmount(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="bg-[#f6a821] text-white font-bold text-sm px-3 py-1.5 rounded inline-block mb-4">
          ePayco
        </div>

        {status === "error" ? (
          <>
            <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-3" />
            <h1 className="text-lg font-semibold text-gray-900 mb-2">No se pudo iniciar el pago</h1>
            <p className="text-gray-600 text-sm mb-4">{errorMessage}</p>

            {isTest && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-left">
                <p className="text-xs text-amber-800 font-medium mb-1">Posible causa en sandbox:</p>
                <p className="text-xs text-amber-700">
                  Tu cuenta ePayco en sandbox puede tener un límite de monto menor a {checkoutData.amount}. Configúralo en tu Dashboard ePayco (Configuración → Medios de pago → Rangos de pago).
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleManualOpen}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#f6a821] hover:bg-[#e09516] text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
                Intentar de nuevo
              </button>

              {isTest && (
                <button
                  onClick={() => setShowTestAmount(!showTestAmount)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  Usar monto de prueba
                </button>
              )}

              {showTestAmount && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
                  <p className="text-xs text-blue-800 mb-2">
                    Para verificar que la integración funciona, puedes usar un monto de prueba ($10,000). En producción usarás el monto real.
                  </p>
                  <button
                    onClick={handleTestAmount}
                    className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    Probar con $10,000
                  </button>
                </div>
              )}

              <button
                onClick={() => router.push("/cart")}
                className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Volver al carrito
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Iniciando pago con ePayco</h1>
            <p className="text-gray-600 text-sm mb-2">
              Se abrirá la pasarela de pagos de ePayco de forma segura.
            </p>
            <p className="text-lg font-bold text-gray-900 mb-6">
              {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(Number(checkoutData.amount))}
            </p>

            <div className="flex justify-center mb-6">
              <Loader2 className="animate-spin h-8 w-8 text-[#f6a821]" />
            </div>

            <button
              onClick={handleManualOpen}
              className="inline-flex items-center justify-center gap-2 bg-[#f6a821] hover:bg-[#e09516] text-white font-medium px-6 py-3 rounded-lg transition-colors w-full"
            >
              <ExternalLink size={16} />
              Abrir ePayco ahora
            </button>

            <p className="text-xs text-gray-400 mt-4">
              Si no se abrió automáticamente, haz clic en el botón de arriba.
            </p>
          </>
        )}

        <p className="text-xs text-gray-400 mt-6">
          {isTest ? "Entorno de pruebas (sandbox) — No se realizará ningún cargo real." : ""}
        </p>
      </div>
    </div>
  );
}

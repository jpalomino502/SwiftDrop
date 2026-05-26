"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink } from "lucide-react";

interface EpaycoFormData {
  p_cust_id_cliente: string;
  p_key: string;
  p_amount: string;
  p_tax: string;
  p_amount_base: string;
  p_currency_code: string;
  p_signature: string;
  p_description: string;
  p_url_response: string;
  p_url_confirmation: string;
  p_extra1: string;
  p_extra2: string;
  p_test_request: string;
  p_email: string;
  p_name?: string;
  ref_payco: string;
}

function submitFormToEpayco(data: EpaycoFormData) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://checkout.epayco.co/checkout";
  form.style.display = "none";

  const entries = Object.entries(data) as [string, string][];
  for (const [key, value] of entries) {
    if (value == null || value === undefined) continue;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  // Cleanup after submit
  setTimeout(() => {
    document.body.removeChild(form);
  }, 1000);
}

export function EpaycoCheckoutForm({ formData }: { formData: EpaycoFormData }) {
  const router = useRouter();
  const submitted = useRef(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (submitted.current) return;

    // Countdown
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    // Auto-submit after 3 seconds
    const timer = setTimeout(() => {
      if (!submitted.current) {
        submitted.current = true;
        try {
          submitFormToEpayco(formData);
        } catch {
          // If auto-submit fails, show manual button
        }
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [formData]);

  const handleManualSubmit = () => {
    if (!submitted.current) {
      submitted.current = true;
      submitFormToEpayco(formData);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="bg-[#f6a821] text-white font-bold text-sm px-3 py-1.5 rounded inline-block mb-4">
          ePayco
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Redirigiendo a ePayco</h1>
        <p className="text-gray-600 text-sm mb-6">
          Serás enviado a la pasarela de pagos de ePayco para completar tu compra de forma segura.
        </p>

        <div className="flex justify-center mb-6">
          <Loader2 className="animate-spin h-8 w-8 text-[#f6a821]" />
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Redirección automática en {countdown} segundos...
        </p>

        <button
          onClick={handleManualSubmit}
          className="inline-flex items-center gap-2 bg-[#f6a821] hover:bg-[#e09516] text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          <ExternalLink size={16} />
          Ir a ePayco ahora
        </button>

        <p className="text-xs text-gray-400 mt-6">
          Entorno de pruebas (sandbox) — No se realizará ningún cargo real.
        </p>
      </div>
    </div>
  );
}

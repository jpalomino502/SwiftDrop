import { notFound } from "next/navigation";
import { createHash } from "crypto";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { EpaycoCheckoutForm } from "@/src/features/payments/ui/EpaycoCheckoutForm";

function md5(text: string): string {
  return createHash("md5").update(text).digest("hex");
}

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function EpaycoSimulatePage({ params }: PageProps) {
  const { orderId } = await params;

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error de configuración</h1>
          <p className="text-gray-600">No se pudo conectar con la base de datos.</p>
        </div>
      </div>
    );
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, total_cents, currency, email, metadata")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    notFound();
  }

  // ePayco credentials from env
  const pCustIdCliente = process.env.EPAYCO_CUSTOMER_ID ?? "";
  const pKey = process.env.EPAYCO_P_KEY ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!pCustIdCliente || !pKey) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error de configuración</h1>
          <p className="text-gray-600">Faltan credenciales de ePayco en el servidor.</p>
        </div>
      </div>
    );
  }

  // Convert our internal amount to COP pesos (our DB stores in a unit where *10 = COP)
  const amountCents = typeof order.total_cents === "number" ? order.total_cents : 0;
  const amountCOP = amountCents * 10;
  const pAmount = amountCOP.toString();

  const refPayco = `ORD-${String(order.order_number).padStart(6, "0")}-${Date.now()}`;
  const currencyCode = order.currency || "COP";

  // ePayco Standard Checkout signature
  // Formula: MD5( p_cust_id_cliente + "^" + p_key + "^" + ref_payco + "^" + p_amount + "^" + p_currency_code )
  const signatureString = `${pCustIdCliente}^${pKey}^${refPayco}^${pAmount}^${currencyCode}`;
  const pSignature = md5(signatureString);

  // Extract customer name from metadata if available
  let customerName = "";
  try {
    const meta = order.metadata as Record<string, unknown> | null;
    if (meta && typeof meta === "object") {
      const name = (meta as Record<string, string>).customer_name ?? "";
      if (name) customerName = name;
    }
  } catch {
    // ignore
  }

  const formData = {
    p_cust_id_cliente: pCustIdCliente,
    p_key: pKey,
    p_amount: pAmount,
    p_tax: "0",
    p_amount_base: pAmount,
    p_currency_code: currencyCode,
    p_signature: pSignature,
    p_description: `Pedido SwiftDrop #ORD-${String(order.order_number).padStart(6, "0")}`,
    p_url_response: `${siteUrl}/api/epayco/callback`,
    p_url_confirmation: `${siteUrl}/api/epayco/confirm`,
    p_extra1: orderId,
    p_extra2: refPayco,
    p_test_request: process.env.EPAYCO_TEST === "true" ? "true" : "false",
    p_email: order.email || "",
    p_name: customerName,
    ref_payco: refPayco,
  };

  return <EpaycoCheckoutForm formData={formData} />;
}

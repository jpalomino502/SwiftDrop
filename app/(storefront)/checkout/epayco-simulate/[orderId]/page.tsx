import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { EpaycoCheckoutForm } from "@/src/features/payments/ui/EpaycoCheckoutForm";

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
  const publicKey = process.env.EPAYCO_PUBLIC_KEY ?? "";
  const isTest = process.env.EPAYCO_TEST === "true";
  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto") ?? "http";
  const forwardedHost = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const requestSiteUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? requestSiteUrl ?? "http://localhost:3000";

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error de configuración</h1>
          <p className="text-gray-600">Falta la clave pública de ePayco (EPAYCO_PUBLIC_KEY).</p>
        </div>
      </div>
    );
  }

  // Extract customer info from metadata
  let customerName = "";
  try {
    const meta = order.metadata as Record<string, unknown> | null;
    if (meta && typeof meta === "object") {
      customerName = (meta.customer_name as string) || "";
    }
  } catch {
    // ignore
  }

  // Amount in COP as stored in the DB (no extra scaling)
  const amountCOP = typeof order.total_cents === "number" ? order.total_cents : 0;

  const invoiceRef = `ORD-${String(order.order_number).padStart(6, "0")}`;

  const checkoutData = {
    name: `Pedido SwiftDrop ${invoiceRef}`,
    description: `Compra en SwiftDrop — ${invoiceRef}`,
    invoice: invoiceRef,
    currency: (order.currency || "COP").toLowerCase(),
    amount: amountCOP.toFixed(2),
    tax_base: amountCOP.toFixed(2),
    tax: "0.00",
    country: "co",
    lang: "es",
    external: "false", // false = checkout ePayco iframe/modal
    confirmation: `${siteUrl}/api/epayco/confirm`,
    response: `${siteUrl}/api/epayco/callback`,
    email: order.email || "",
    extra1: orderId,
    extra2: invoiceRef,
  };

  return <EpaycoCheckoutForm publicKey={publicKey} checkoutData={checkoutData} isTest={isTest} />;
}

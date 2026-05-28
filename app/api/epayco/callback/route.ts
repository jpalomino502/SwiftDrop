import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { sendOrderConfirmationEmail } from "@/src/lib/email/resend";

/**
 * ePayco Standard Checkout — Response URL (p_url_response)
 * ePayco redirects the customer here after payment.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // ePayco can send params with or without x_ prefix depending on version
  const refPayco = searchParams.get("x_ref_payco") ?? searchParams.get("ref_payco") ?? "";
  const transactionState = searchParams.get("x_transaction_state") ?? searchParams.get("transactionState") ?? "";
  const codResponse = searchParams.get("x_cod_response") ?? searchParams.get("cod_response") ?? "";
  const responseText = searchParams.get("x_response") ?? searchParams.get("response") ?? "";
  const extra1 = searchParams.get("x_extra1") ?? searchParams.get("extra1") ?? "";
  const extra2 = searchParams.get("x_extra2") ?? searchParams.get("extra2") ?? "";
  const responseReasonText = searchParams.get("x_response_reason_text") ?? searchParams.get("response_reason_text") ?? "";

  const orderId = extra1;

  if (!orderId) {
    return NextResponse.redirect(new URL("/order/failed?reason=no_order_id", req.url));
  }

  const supabase = getSupabaseServerClient();

  // ePayco standard checkout response codes (x_cod_response):
  // 1 = Aceptada, 2 = Rechazada, 3 = Pendiente, 4 = Fallida, 9 = Expirada, 10 = Anulada, 11 = Reversada
  // We also support x_response text ("Aceptada") and legacy x_transaction_state for compatibility.
  const isApproved =
    codResponse === "1" ||
    responseText.toLowerCase() === "aceptada" ||
    transactionState === "1" ||
    transactionState.toLowerCase() === "aceptada";

  if (isApproved) {
    if (supabase) {
      // Fetch order details needed for email
      const { data: orderRow } = await supabase
        .from("orders")
        .select("order_number,total_cents,currency,email,metadata")
        .eq("id", orderId)
        .maybeSingle();

      const { data: orderItems } = await supabase
        .from("order_items")
        .select("title,quantity,line_total_cents")
        .eq("order_id", orderId);

      // Update order status
      await supabase
        .from("orders")
        .update({
          status: "processing",
          payment_status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      // Record the ePayco transaction reference
      try {
        await supabase.from("payment_intents").insert({
          order_id: orderId,
          provider: "epayco",
          provider_intent_id: refPayco || extra2 || `epayco-${Date.now()}`,
          status: "succeeded",
          amount_cents: 0,
          currency: "COP",
          provider_metadata: {
            ref_payco: refPayco,
            cod_response: codResponse,
            response_text: responseText,
            transaction_state: transactionState,
            response_reason: responseReasonText,
          },
        });
      } catch {
        // ignore duplicate or error
      }

      // Send confirmation email now that payment is approved
      try {
        const meta = (orderRow?.metadata ?? {}) as Record<string, unknown>;
        const customerName = (meta?.customer_name as string) || "";
        const safeItems = (orderItems ?? []).map((item) => ({
          title: item.title ?? "Producto",
          quantity: typeof item.quantity === "number" ? item.quantity : 1,
          lineTotalCents: typeof item.line_total_cents === "number" ? item.line_total_cents : 0,
        }));

        await sendOrderConfirmationEmail({
          to: orderRow?.email || "",
          customerName,
          orderId,
          orderNumber: orderRow?.order_number ?? null,
          currency: orderRow?.currency ?? "COP",
          totalCents: orderRow?.total_cents ?? 0,
          items: safeItems,
        });
      } catch {
        // ignore email failures
      }
    }

    return NextResponse.redirect(new URL(`/order/success/${orderId}?epayco=confirmed&ref=${refPayco}`, req.url));
  }

  // Payment failed/rejected/cancelled
  if (supabase) {
    await supabase
      .from("orders")
      .update({
        status: "cancelled",
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);
  }

  const reason = encodeURIComponent(responseReasonText || "payment_rejected");
  return NextResponse.redirect(new URL(`/order/failed?order=${orderId}&reason=${reason}`, req.url));
}

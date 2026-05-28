import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { sendOrderConfirmationEmail } from "@/src/lib/email/resend";

async function fetchEpaycoValidation(refPayco: string) {
  try {
    const res = await fetch(`https://secure.epayco.co/validation/v1/reference/${refPayco}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json || !json.data) return null;
    return json.data as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * ePayco Standard Checkout — Response URL (p_url_response)
 * ePayco redirects the customer here after payment.
 *
 * ePayco usually sends only ?ref_payco=... in the response URL.
 * We must query their validation API to get the real transaction state.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // ePayco can send params with or without x_ prefix depending on version
  let refPayco = searchParams.get("x_ref_payco") ?? searchParams.get("ref_payco") ?? "";
  let transactionState = searchParams.get("x_transaction_state") ?? searchParams.get("transactionState") ?? "";
  let codResponse = searchParams.get("x_cod_response") ?? searchParams.get("cod_response") ?? "";
  let responseText = searchParams.get("x_response") ?? searchParams.get("response") ?? "";
  let extra1 = searchParams.get("x_extra1") ?? searchParams.get("extra1") ?? "";
  let extra2 = searchParams.get("x_extra2") ?? searchParams.get("extra2") ?? "";
  let responseReasonText = searchParams.get("x_response_reason_text") ?? searchParams.get("response_reason_text") ?? "";

  // If ePayco only sent ref_payco in the response URL, query their validation API
  // to get the full transaction details including order id (extra1) and response codes.
  if (refPayco && (!extra1 || !codResponse)) {
    const validation = await fetchEpaycoValidation(refPayco);
    if (validation) {
      const val = validation;
      codResponse =
        (typeof val["x_cod_transaction_state"] === "string" ? val["x_cod_transaction_state"] : "") ||
        (typeof val["x_cod_response"] === "string" ? val["x_cod_response"] : "") ||
        (typeof val["codTransactionState"] === "string" ? val["codTransactionState"] : "") ||
        (typeof val["cod_response"] === "string" ? val["cod_response"] : "") ||
        codResponse;
      transactionState =
        (typeof val["x_transaction_state"] === "string" ? val["x_transaction_state"] : "") || transactionState;
      responseText = (typeof val["x_response"] === "string" ? val["x_response"] : "") || responseText;
      extra1 = (typeof val["extra1"] === "string" ? val["extra1"] : "") || extra1;
      extra2 = (typeof val["extra2"] === "string" ? val["extra2"] : "") || extra2;
      responseReasonText =
        (typeof val["x_response_reason_text"] === "string" ? val["x_response_reason_text"] : "") || responseReasonText;
    }
  }

  const orderId = extra1;

  if (!orderId) {
    return NextResponse.redirect(new URL("/order/failed?reason=no_order_id", req.url));
  }

  const supabase = getSupabaseServerClient();

  // ePayco standard checkout response codes (x_cod_response / x_cod_transaction_state):
  // 1 = Aceptada, 2 = Rechazada, 3 = Pendiente, 4 = Fallida, 9 = Expirada, 10 = Anulada, 11 = Reversada
  const numericCode = parseInt(codResponse || transactionState, 10);
  const isApproved = numericCode === 1 || responseText.toLowerCase() === "aceptada";

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

  // Payment failed/rejected/cancelled/pending
  if (supabase) {
    await supabase
      .from("orders")
      .update({
        status: numericCode === 3 ? "pending" : "cancelled",
        payment_status: numericCode === 3 ? "pending" : "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);
  }

  const reason = encodeURIComponent(responseReasonText || `epayco_code_${numericCode || "unknown"}`);
  return NextResponse.redirect(new URL(`/order/failed?order=${orderId}&reason=${reason}`, req.url));
}

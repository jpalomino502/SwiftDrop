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
 * ePayco may send params directly or only ?ref_payco=... in the response URL.
 * We query their validation API when needed and fall back gracefully.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Collect every query param for debugging
  const rawParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    rawParams[key] = value;
  });

  // ePayco can send params with or without x_ prefix depending on version
  let refPayco = searchParams.get("x_ref_payco") ?? searchParams.get("ref_payco") ?? "";
  let transactionState = searchParams.get("x_transaction_state") ?? searchParams.get("transactionState") ?? "";
  let codResponse = searchParams.get("x_cod_response") ?? searchParams.get("cod_response") ?? "";
  let responseText = searchParams.get("x_response") ?? searchParams.get("response") ?? "";
  let extra1 = searchParams.get("x_extra1") ?? searchParams.get("extra1") ?? "";
  let extra2 = searchParams.get("x_extra2") ?? searchParams.get("extra2") ?? "";
  let responseReasonText = searchParams.get("x_response_reason_text") ?? searchParams.get("response_reason_text") ?? "";

  const supabase = getSupabaseServerClient();

  // If ePayco only sent ref_payco (or we still miss order id / code), query their validation API
  let validationData: Record<string, unknown> | null = null;
  if (refPayco && (!extra1 || !codResponse)) {
    validationData = await fetchEpaycoValidation(refPayco);
    if (validationData) {
      const val = validationData;
      codResponse =
        (typeof val["x_cod_transaction_state"] === "string" ? val["x_cod_transaction_state"] : "") ||
        (typeof val["x_cod_response"] === "string" ? val["x_cod_response"] : "") ||
        (typeof val["codTransactionState"] === "string" ? val["codTransactionState"] : "") ||
        (typeof val["cod_response"] === "string" ? val["cod_response"] : "") ||
        codResponse;
      transactionState =
        (typeof val["x_transaction_state"] === "string" ? val["x_transaction_state"] : "") || transactionState;
      responseText = (typeof val["x_response"] === "string" ? val["x_response"] : "") || responseText;
      extra1 =
        (typeof val["x_extra1"] === "string" ? val["x_extra1"] : "") ||
        (typeof val["extra1"] === "string" ? val["extra1"] : "") ||
        extra1;
      extra2 =
        (typeof val["x_extra2"] === "string" ? val["x_extra2"] : "") ||
        (typeof val["extra2"] === "string" ? val["extra2"] : "") ||
        extra2;
      responseReasonText =
        (typeof val["x_response_reason_text"] === "string" ? val["x_response_reason_text"] : "") || responseReasonText;
    }
  }

  // Persist debug log (best-effort)
  try {
    if (supabase) {
      await supabase.from("epayco_callback_logs").insert({
        order_id: extra1 || null,
        ref_payco: refPayco || null,
        query_params: rawParams,
        validation_response: validationData,
      });
    }
  } catch {
    // ignore log errors
  }

  let orderId = extra1;

  // If we still don't have orderId, try to find it in recent callback logs by refPayco
  if (!orderId && refPayco && supabase) {
    try {
      const { data: logRow } = await supabase
        .from("epayco_callback_logs")
        .select("order_id")
        .eq("ref_payco", refPayco)
        .not("order_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (logRow?.order_id) {
        orderId = logRow.order_id;
      }
    } catch {
      // ignore
    }
  }

  if (!orderId) {
    // We cannot identify the order. Redirect to checking page with ref_payco so it can try to look it up.
    const checkingUrl = refPayco
      ? `/order/checking?reason=no_order_id&ref=${encodeURIComponent(refPayco)}`
      : "/order/checking?reason=no_order_id";
    return NextResponse.redirect(new URL(checkingUrl, req.url));
  }

  // ePayco standard checkout response codes (x_cod_response / x_cod_transaction_state):
  // 1 = Aceptada, 2 = Rechazada, 3 = Pendiente, 4 = Fallida, 9 = Expirada, 10 = Anulada, 11 = Reversada
  const numericCode = parseInt(codResponse || transactionState, 10);
  const isApproved = numericCode === 1 || responseText.toLowerCase() === "aceptada";

  // If we could not determine the code at all, redirect to checking page instead of marking as failed
  if (!codResponse && !transactionState && !responseText && !validationData) {
    return NextResponse.redirect(new URL(`/order/checking?order=${orderId}&ref=${refPayco}`, req.url));
  }

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

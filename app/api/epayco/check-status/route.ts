import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";

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
 * Check ePayco transaction status by ref_payco.
 * Used by the /order/checking page to verify payment after redirect.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const refPayco = searchParams.get("ref_payco") ?? "";
  const orderId = searchParams.get("order_id") ?? "";

  if (!refPayco) {
    return NextResponse.json({ success: false, error: "ref_payco requerido" }, { status: 400 });
  }

  const validation = await fetchEpaycoValidation(refPayco);
  if (!validation) {
    return NextResponse.json({ success: false, error: "No se pudo consultar ePayco" }, { status: 503 });
  }

  const val = validation;
  const codResponse =
    (typeof val["x_cod_transaction_state"] === "string" ? val["x_cod_transaction_state"] : "") ||
    (typeof val["x_cod_response"] === "string" ? val["x_cod_response"] : "") ||
    (typeof val["codTransactionState"] === "string" ? val["codTransactionState"] : "") ||
    (typeof val["cod_response"] === "string" ? val["cod_response"] : "");

  const responseText = (typeof val["x_response"] === "string" ? val["x_response"] : "") || "";
  const numericCode = parseInt(codResponse, 10);
  const isApproved = numericCode === 1 || responseText.toLowerCase() === "aceptada";

  // If we have an orderId, update the order in the database
  const supabase = getSupabaseServerClient();
  if (supabase && orderId) {
    if (isApproved) {
      await supabase
        .from("orders")
        .update({
          status: "processing",
          payment_status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      // Upsert payment intent
      try {
        const providerIntentId = refPayco || `epayco-${Date.now()}`;
        const { data: existing } = await supabase
          .from("payment_intents")
          .select("id")
          .eq("provider_intent_id", providerIntentId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("payment_intents")
            .update({
              status: "succeeded",
              provider_metadata: {
                ref_payco: refPayco,
                cod_response: codResponse,
                response_text: responseText,
                confirmed_via: "checking_page",
              },
            })
            .eq("provider_intent_id", providerIntentId);
        } else {
          await supabase.from("payment_intents").insert({
            order_id: orderId,
            provider: "epayco",
            provider_intent_id: providerIntentId,
            status: "succeeded",
            amount_cents: 0,
            currency: "COP",
            provider_metadata: {
              ref_payco: refPayco,
              cod_response: codResponse,
              response_text: responseText,
              confirmed_via: "checking_page",
            },
          });
        }
      } catch {
        // ignore
      }
    } else if (numericCode && numericCode !== 3) {
      // Failed/rejected (not pending)
      await supabase
        .from("orders")
        .update({
          status: "cancelled",
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    }
  }

  return NextResponse.json({
    success: true,
    isApproved,
    numericCode,
    responseText,
    refPayco,
    orderId: orderId || null,
    redirectUrl: isApproved
      ? `/order/success/${orderId || ""}?epayco=confirmed&ref=${refPayco}`
      : `/order/failed?order=${orderId || ""}&reason=epayco_code_${numericCode || "unknown"}`,
  });
}

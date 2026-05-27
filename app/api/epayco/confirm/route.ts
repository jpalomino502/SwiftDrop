import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";

/**
 * ePayco Standard Checkout — Confirmation URL (p_url_confirmation)
 * ePayco POSTs webhook data here to confirm the transaction.
 */
export async function POST(req: Request) {
  let body: Record<string, string> = {};

  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    params.forEach((value, key) => {
      body[key] = value;
    });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // ePayco webhook fields (can be with or without x_ prefix)
  const refPayco = body.x_ref_payco ?? body.ref_payco ?? "";
  const transactionState = body.x_transaction_state ?? body.transactionState ?? "";
  const extra1 = body.x_extra1 ?? body.extra1 ?? "";
  const extra2 = body.x_extra2 ?? body.extra2 ?? "";
  const amount = body.x_amount ?? body.amount ?? "";
  const currency = body.x_currency_code ?? body.currency_code ?? "COP";
  const responseReason = body.x_response_reason_text ?? body.response_reason_text ?? "";

  const orderId = extra1;

  if (!orderId) {
    return NextResponse.json({ error: "No order id" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  // ePayco state 4 = Approved
  const isApproved = transactionState === "4" || transactionState.toLowerCase() === "aceptada";

  // Update order
  await supabase
    .from("orders")
    .update({
      status: isApproved ? "processing" : "cancelled",
      payment_status: isApproved ? "paid" : "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  // Upsert payment intent record
  const providerIntentId = refPayco || extra2 || `epayco-webhook-${Date.now()}`;

  // Check if record exists
  const { data: existing } = await supabase
    .from("payment_intents")
    .select("id")
    .eq("provider_intent_id", providerIntentId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("payment_intents")
      .update({
        status: isApproved ? "succeeded" : "failed",
        provider_metadata: {
          ref_payco: refPayco,
          transaction_state: transactionState,
          response_reason: responseReason,
          amount,
          currency,
          confirmed_via: "webhook",
        },
      })
      .eq("provider_intent_id", providerIntentId);
  } else {
    await supabase.from("payment_intents").insert({
      order_id: orderId,
      provider: "epayco",
      provider_intent_id: providerIntentId,
      status: isApproved ? "succeeded" : "failed",
      amount_cents: 0,
      currency,
      provider_metadata: {
        ref_payco: refPayco,
        transaction_state: transactionState,
        response_reason: responseReason,
        amount,
        currency,
        confirmed_via: "webhook",
      },
    });
  }

  return NextResponse.json({ success: true, received: true });
}

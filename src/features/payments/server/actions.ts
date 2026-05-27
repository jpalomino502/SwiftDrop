"use server";

import { getSupabaseServerClientWithCookies } from "@/src/lib/supabase/ssr";

export async function createEpaycoMockPayment(input: {
  orderId: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
}) {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return { success: false, error: "Supabase no configurado" };

  // In mock mode we simulate ePayco by creating a payment_intent with provider=epayco
  const transactionId = `epayco-mock-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  const { error } = await supabase.from("payment_intents").insert({
    order_id: input.orderId,
    provider: "epayco",
    provider_intent_id: transactionId,
    status: "requires_confirmation",
    amount_cents: input.amountCents,
    currency: input.currency || "COP",
    provider_metadata: {
      mock: true,
      customer_email: input.customerEmail,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
    },
  });

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    transactionId,
    redirectUrl: `/api/epayco/confirm?order_id=${input.orderId}&tx=${transactionId}`,
  };
}

export async function confirmEpaycoMockPayment(orderId: string, transactionId: string, approve: boolean) {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return { success: false, error: "Supabase no configurado" };

  const status = approve ? "succeeded" : "failed";
  const paymentStatus = approve ? "paid" : "failed";

  // Update payment_intent
  const { error: piErr } = await supabase
    .from("payment_intents")
    .update({
      status,
      provider_metadata: {
        mock: true,
        confirmed_at: new Date().toISOString(),
        approved: approve,
      },
    })
    .eq("order_id", orderId)
    .eq("provider_intent_id", transactionId);

  if (piErr) return { success: false, error: piErr.message };

  // Update order
  const { error: orderErr } = await supabase
    .from("orders")
    .update({
      payment_status: paymentStatus,
      status: approve ? "processing" : "cancelled",
    })
    .eq("id", orderId);

  if (orderErr) return { success: false, error: orderErr.message };

  return { success: true };
}

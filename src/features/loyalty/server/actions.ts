"use server";

import { getSupabaseServerClientWithCookies } from "@/src/lib/supabase/ssr";

export async function getCustomerLoyalty(customerId: string) {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return { points: 0, transactions: [], rules: null, error: "Supabase no configurado" };

  const { data: customer } = await supabase
    .from("customers")
    .select("loyalty_points, customer_type")
    .eq("id", customerId)
    .maybeSingle();

  const { data: transactions } = await supabase
    .from("loyalty_transactions")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: rules } = await supabase
    .from("loyalty_rules")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  return {
    points: customer?.loyalty_points ?? 0,
    customerType: customer?.customer_type ?? "retail",
    transactions: transactions ?? [],
    rules: rules ?? null,
    error: null,
  };
}

export async function accrueLoyaltyPoints(orderId: string, customerId: string, amountCents: number) {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return { success: false, error: "Supabase no configurado" };

  const { data: customer } = await supabase
    .from("customers")
    .select("customer_type, loyalty_points")
    .eq("id", customerId)
    .maybeSingle();

  const { data: rules } = await supabase
    .from("loyalty_rules")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (!rules || !customer) return { success: false, error: "No se encontraron reglas de fidelización" };

  const multiplier = customer.customer_type === "wholesale" ? rules.wholesale_multiplier : rules.retail_multiplier;
  const rawPoints = Math.floor(amountCents / rules.points_per_cents);
  const points = Math.round(rawPoints * multiplier);

  if (points <= 0) return { success: true, points: 0 };

  const { error: txErr } = await supabase.from("loyalty_transactions").insert({
    customer_id: customerId,
    order_id: orderId,
    type: "accrual",
    points,
    description: `Puntos ganados por compra de ${amountCents} centavos`,
  });

  if (txErr) return { success: false, error: txErr.message };

  const { error: updErr } = await supabase
    .from("customers")
    .update({ loyalty_points: (customer.loyalty_points ?? 0) + points })
    .eq("id", customerId);

  return { success: !updErr, points, error: updErr?.message };
}

export async function redeemLoyaltyPoints(customerId: string, pointsToRedeem: number, orderId?: string) {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return { success: false, error: "Supabase no configurado", discountCents: 0 };

  const { data: customer } = await supabase
    .from("customers")
    .select("loyalty_points")
    .eq("id", customerId)
    .maybeSingle();

  const { data: rules } = await supabase
    .from("loyalty_rules")
    .select("points_to_cents_conversion")
    .eq("id", 1)
    .maybeSingle();

  if (!customer || !rules) return { success: false, error: "Datos insuficientes", discountCents: 0 };
  if ((customer.loyalty_points ?? 0) < pointsToRedeem) {
    return { success: false, error: "Puntos insuficientes", discountCents: 0 };
  }

  // 100 points = points_to_cents_conversion cents
  const discountCents = Math.floor((pointsToRedeem / 100) * rules.points_to_cents_conversion);

  const { error: txErr } = await supabase.from("loyalty_transactions").insert({
    customer_id: customerId,
    order_id: orderId || null,
    type: "redemption",
    points: -pointsToRedeem,
    description: `Canje de ${pointsToRedeem} puntos por descuento`,
  });

  if (txErr) return { success: false, error: txErr.message, discountCents: 0 };

  const { error: updErr } = await supabase
    .from("customers")
    .update({ loyalty_points: customer.loyalty_points - pointsToRedeem })
    .eq("id", customerId);

  return { success: !updErr, discountCents, error: updErr?.message };
}

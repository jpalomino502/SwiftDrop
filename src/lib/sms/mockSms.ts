"use server";

import { getSupabaseServerClientWithCookies } from "@/src/lib/supabase/ssr";

export async function sendMockSms(input: {
  phone: string;
  message: string;
  orderId?: string;
}) {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) {
    return { success: false, status: "failed" as const, error: "Supabase no configurado" };
  }

  // Normalize phone
  const phone = input.phone.trim();
  if (!phone) {
    return { success: false, status: "failed" as const, error: "Teléfono requerido" };
  }

  const { data, error } = await supabase
    .from("sms_notifications")
    .insert({
      order_id: input.orderId || null,
      phone,
      message: input.message,
      provider: "mock",
      status: "mocked",
      provider_response: { simulated: true, at: new Date().toISOString() },
      sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, status: "failed" as const, error: error.message };
  }

  return { success: true, status: "mocked" as const, notificationId: data?.id as string | undefined };
}

export async function sendDeliveryPinSms(phone: string, orderId: string, pin: string) {
  const message = `SwiftDrop: Tu PIN de entrega para el pedido ${orderId.slice(0, 8).toUpperCase()} es ${pin}. Entrégalo únicamente al repartidor. (SIMULADO - Prototipo)`;
  return sendMockSms({ phone, message, orderId });
}

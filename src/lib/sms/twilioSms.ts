"use server";

import twilio from "twilio";

import { getSupabaseServerClientWithCookies } from "@/src/lib/supabase/ssr";

type SendTwilioSmsInput = {
  phone: string;
  message: string;
  orderId?: string;
};

function normalizePhoneForTwilio(rawPhone: string) {
  const compact = rawPhone.replace(/[\s()-]/g, "");
  if (!compact) return "";

  // 0034... -> +34...
  if (compact.startsWith("00")) {
    return `+${compact.slice(2)}`;
  }

  // Already in E.164
  if (compact.startsWith("+")) {
    return compact;
  }

  // Colombia mobile common local format: 3XXXXXXXXX
  if (/^3\d{9}$/.test(compact)) {
    return `+57${compact}`;
  }

  // Colombia with country digits but without plus
  if (/^57\d{10}$/.test(compact)) {
    return `+${compact}`;
  }

  return compact;
}

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim() || null;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim() || null;
  if (!accountSid || !authToken) return null;
  if (!fromNumber && !messagingServiceSid) return null;
  return { accountSid, authToken, fromNumber, messagingServiceSid };
}

export async function sendTwilioSms(input: SendTwilioSmsInput) {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) {
    return { success: false, status: "failed" as const, error: "Supabase no configurado" };
  }

  const phone = normalizePhoneForTwilio(input.phone.trim());
  if (!phone) {
    return { success: false, status: "failed" as const, error: "Teléfono requerido" };
  }

  const cfg = getTwilioConfig();
  if (!cfg) {
    await supabase.from("sms_notifications").insert({
      order_id: input.orderId || null,
      phone,
      message: input.message,
      provider: "twilio",
      status: "failed",
      provider_response: { error: "missing_twilio_env" },
    });
    return {
      success: false,
      status: "failed" as const,
      error: "Faltan variables de entorno de Twilio (SID/TOKEN y TWILIO_FROM_NUMBER o TWILIO_MESSAGING_SERVICE_SID).",
    };
  }

  try {
    const client = twilio(cfg.accountSid, cfg.authToken);
    const payload: {
      to: string;
      body: string;
      from?: string;
      messagingServiceSid?: string;
    } = {
      to: phone,
      body: input.message,
    };

    if (cfg.messagingServiceSid) {
      payload.messagingServiceSid = cfg.messagingServiceSid;
    } else if (cfg.fromNumber) {
      payload.from = cfg.fromNumber;
    }

    const response = await client.messages.create(payload);

    const { data, error } = await supabase
      .from("sms_notifications")
      .insert({
        order_id: input.orderId || null,
        phone,
        message: input.message,
        provider: "twilio",
        status: "sent",
        provider_response: {
          sid: response.sid,
          status: response.status,
          errorCode: response.errorCode,
          errorMessage: response.errorMessage,
        },
        sent_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, status: "failed" as const, error: error.message };
    }

    return { success: true, status: "sent" as const, notificationId: data?.id as string | undefined };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown_error";
    await supabase.from("sms_notifications").insert({
      order_id: input.orderId || null,
      phone,
      message: input.message,
      provider: "twilio",
      status: "failed",
      provider_response: { error: reason },
    });
    return { success: false, status: "failed" as const, error: reason };
  }
}

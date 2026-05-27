"use server";

import { sendMockSms } from "./mockSms";
import { sendTwilioSms } from "./twilioSms";

function toStatusLabel(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "Pendiente";
    case "processing":
      return "Procesando";
    case "fulfilled":
      return "Preparado";
    case "shipped":
      return "Enviado";
    case "delivered":
      return "Entregado";
    case "cancelled":
      return "Cancelado";
    case "refunded":
      return "Reembolsado";
    default:
      return "Actualizado";
  }
}

function buildDeliveryPinMessage(orderId: string, pin: string, status?: string) {
  const shortOrder = orderId.slice(0, 8).toUpperCase();
  const statusLabel = toStatusLabel(status);
  return `SwiftDrop: Pedido ${shortOrder} - Estado: ${statusLabel}. PIN de confirmación: ${pin}. Compártelo solo al momento de la entrega.`;
}

export async function sendDeliveryPinSms(phone: string, orderId: string, pin: string, status?: string) {
  const provider = (process.env.SMS_PROVIDER || "mock").trim().toLowerCase();
  const message = buildDeliveryPinMessage(orderId, pin, status);

  if (provider === "twilio") {
    return sendTwilioSms({ phone, message, orderId });
  }

  return sendMockSms({ phone, message: `${message} (SIMULADO - Prototipo)`, orderId });
}

"use server";

import { getSupabaseServerClientWithCookies } from "@/src/lib/supabase/ssr";
import { sendDeliveryPinSms } from "@/src/lib/sms";

const ALLOWED_ORDER_STATUSES = new Set([
    "pending",
    "processing",
    "paid",
    "fulfilled",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
]);

type OrderForStatusUpdate = {
    id: string;
    status: string;
    delivery_pin: string | null;
    metadata: Record<string, unknown> | null;
    customer: Array<{ phone: string | null }> | null;
    order_addresses: Array<{ type: "shipping" | "billing"; phone: string | null }>;
};

function createDeliveryPin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getPhoneForOrder(order: OrderForStatusUpdate) {
    const shippingPhone = order.order_addresses?.find((a) => a.type === "shipping")?.phone ?? null;
    const customerPhone = order.customer?.[0]?.phone ?? null;
    const metadataPhone =
        order.metadata && typeof order.metadata.customer_phone === "string"
            ? order.metadata.customer_phone
            : null;
    return (shippingPhone || customerPhone || metadataPhone || "").trim();
}

export async function updateOrderStatus(orderId: string, status: string) {
    const supabase = await getSupabaseServerClientWithCookies();
    if (!supabase) {
        return { success: false, error: "No se pudo conectar con la base de datos." };
    }

    const normalizedStatus = status.trim().toLowerCase();
    if (!ALLOWED_ORDER_STATUSES.has(normalizedStatus)) {
        return { success: false, error: "Estado de orden inválido." };
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Debes iniciar sesión." };
        }

        // Verify admin access
        const { data: adminRow } = await supabase
            .from("admin_users")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (!adminRow) {
            return { success: false, error: "No tienes permisos de administrador." };
        }

        const { data: orderRow, error: orderReadError } = await supabase
            .from("orders")
            .select("id,status,delivery_pin,metadata,customer:customers(phone),order_addresses(type,phone)")
            .eq("id", orderId)
            .single();

        if (orderReadError) {
            return { success: false, error: orderReadError.message };
        }

        const order = orderRow as OrderForStatusUpdate;
        const pin = order.delivery_pin?.trim() || createDeliveryPin();

        const { error } = await supabase
            .from("orders")
            .update({
                status: normalizedStatus,
                delivery_pin: pin,
                updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

        if (error) {
            return { success: false, error: error.message };
        }

        // Only send PIN SMS when the order is shipped (or if a new PIN was generated and order is paid/processing)
        const shouldSendPin =
            normalizedStatus === "shipped" ||
            (normalizedStatus === "processing" && !order.delivery_pin);

        if (!shouldSendPin) {
            return { success: true };
        }

        const phone = getPhoneForOrder(order);
        if (!phone) {
            return {
                success: true,
                smsWarning: "Estado actualizado, pero la orden no tiene teléfono para enviar SMS.",
            };
        }

        const smsResult = await sendDeliveryPinSms(phone, orderId, pin, normalizedStatus);
        if (!smsResult.success) {
            return {
                success: true,
                smsWarning: `Estado actualizado, pero falló el SMS: ${smsResult.error || "error desconocido"}`,
            };
        }

        return { success: true };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : "Error desconocido" };
    }
}

export async function resendDeliveryPin(orderId: string) {
    const supabase = await getSupabaseServerClientWithCookies();
    if (!supabase) {
        return { success: false, error: "No se pudo conectar con la base de datos." };
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Debes iniciar sesión." };
        }

        const { data: adminRow } = await supabase
            .from("admin_users")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (!adminRow) {
            return { success: false, error: "No tienes permisos de administrador." };
        }

        const { data: orderRow, error: orderReadError } = await supabase
            .from("orders")
            .select("id,status,delivery_pin,metadata,customer:customers(phone),order_addresses(type,phone)")
            .eq("id", orderId)
            .single();

        if (orderReadError || !orderRow) {
            return { success: false, error: orderReadError?.message || "Orden no encontrada." };
        }

        const order = orderRow as OrderForStatusUpdate;
        const pin = order.delivery_pin?.trim() || createDeliveryPin();

        if (!order.delivery_pin) {
            await supabase
                .from("orders")
                .update({ delivery_pin: pin, updated_at: new Date().toISOString() })
                .eq("id", orderId);
        }

        const phone = getPhoneForOrder(order);
        if (!phone) {
            return { success: false, error: "La orden no tiene teléfono para enviar SMS." };
        }

        const smsResult = await sendDeliveryPinSms(phone, orderId, pin, order.status);
        if (!smsResult.success) {
            return { success: false, error: `Falló el SMS: ${smsResult.error || "error desconocido"}` };
        }

        return { success: true, pin };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : "Error desconocido" };
    }
}

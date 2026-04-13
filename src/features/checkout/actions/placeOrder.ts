"use server";

import { getSupabaseServerClientWithCookies } from "@/src/lib/supabase/ssr";
import { sendOrderConfirmationEmail } from "@/src/lib/email/resend";
import { calculateShippingQuote } from "../lib/shipping";

interface OrderItem {
    id: string;
    productId: number;
    title?: string;
    quantity: number;
    unitPrice?: number;
    imageUrl?: string;
    size?: string;
    color?: string;
}

interface AddressData {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country: string;
}

interface CreateOrderParams {
    items: OrderItem[];
    email: string;
    address: AddressData;
}

type RpcCheckoutItem = {
    productId: number;
    quantity: number;
    size: string | null;
    color: string | null;
};

function sanitizeCheckoutItems(items: OrderItem[]): RpcCheckoutItem[] {
    return items
        .map((item) => ({
            productId: Number(item.productId),
            quantity: Math.max(1, Math.floor(Number(item.quantity))),
            size: typeof item.size === "string" && item.size.trim() ? item.size.trim() : null,
            color: typeof item.color === "string" && item.color.trim() ? item.color.trim() : null,
        }))
        .filter((item) => Number.isFinite(item.productId) && item.productId > 0 && Number.isFinite(item.quantity) && item.quantity > 0);
}

export async function createOrder({ items, email, address }: CreateOrderParams) {
    const supabase = await getSupabaseServerClientWithCookies();
    if (!supabase) {
        throw new Error("No se pudo conectar con la base de datos (Error de configuración).");
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Debes iniciar sesión para completar el pedido." };
        }

        const checkoutEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        const accountEmail = typeof user?.email === "string" ? user.email.trim().toLowerCase() : "";
        const orderEmail = checkoutEmail || accountEmail;
        if (!orderEmail) {
            throw new Error("El correo electrónico es obligatorio.");
        }

        const safeItems = sanitizeCheckoutItems(items);
        if (safeItems.length === 0) {
            return { success: false, error: "No hay productos validos en el pedido." };
        }

        const { data: rpcData, error: rpcError } = await supabase.rpc("create_checkout_order", {
            p_email: orderEmail,
            p_address: {
                name: address.name,
                phone: address.phone,
                line1: address.line1,
                line2: address.line2 ?? null,
                city: address.city ?? null,
                region: address.region ?? null,
                postal_code: address.postal_code ?? null,
                country: address.country,
            },
            p_items: safeItems,
        });

        if (rpcError) {
            throw new Error(rpcError.message || "No se pudo crear la orden.");
        }

        const orderId = typeof rpcData === "string" ? rpcData : null;
        if (!orderId) {
            throw new Error("La respuesta del servidor no incluye un ID de orden valido.");
        }

        // Recalculate shipping with current business rules and persist on order/payment.
        const { data: orderForTotals, error: orderReadError } = await supabase
            .from("orders")
            .select("subtotal_cents")
            .eq("id", orderId)
            .maybeSingle();

        if (orderReadError) {
            throw new Error(orderReadError.message || "No se pudo calcular el envío del pedido.");
        }

        const subtotalCents = typeof orderForTotals?.subtotal_cents === "number" ? orderForTotals.subtotal_cents : 0;
        const shippingQuote = calculateShippingQuote({
            city: address.city,
            subtotalCents,
            items: safeItems.map((item) => ({ quantity: item.quantity })),
        });
        const totalCents = subtotalCents + shippingQuote.shippingCents;

        const { error: orderUpdateError } = await supabase
            .from("orders")
            .update({
                shipping_cents: shippingQuote.shippingCents,
                tax_cents: 0,
                total_cents: totalCents,
            })
            .eq("id", orderId);

        if (orderUpdateError) {
            throw new Error(orderUpdateError.message || "No se pudo actualizar el total del pedido.");
        }

        const { error: paymentUpdateError } = await supabase
            .from("payment_intents")
            .update({ amount_cents: totalCents })
            .eq("order_id", orderId)
            .eq("provider", "manual");

        if (paymentUpdateError) {
            throw new Error(paymentUpdateError.message || "No se pudo actualizar el monto de pago.");
        }

        // Best effort email (non-blocking): checkout should succeed even if email provider fails.
        try {
            const [{ data: orderRow }, { data: orderItems }] = await Promise.all([
                supabase
                    .from("orders")
                    .select("order_number,total_cents,currency")
                    .eq("id", orderId)
                    .maybeSingle(),
                supabase
                    .from("order_items")
                    .select("title,quantity,line_total_cents")
                    .eq("order_id", orderId),
            ]);

            const safeItems = (orderItems ?? []).map((item) => ({
                title: item.title ?? "Producto",
                quantity: typeof item.quantity === "number" ? item.quantity : 1,
                lineTotalCents: typeof item.line_total_cents === "number" ? item.line_total_cents : 0,
            }));

            const mailResult = await sendOrderConfirmationEmail({
                to: orderEmail,
                customerName: address.name,
                orderId,
                orderNumber: orderRow?.order_number ?? null,
                currency: orderRow?.currency ?? "COP",
                totalCents: orderRow?.total_cents ?? 0,
                items: safeItems,
            });

            if (!mailResult.ok) {
                const reason = mailResult.reason || "unknown_email_error";
                // eslint-disable-next-line no-console
                console.error("[Checkout] Failed to send confirmation email", {
                    orderId,
                    to: orderEmail,
                    reason,
                    skipped: mailResult.skipped,
                });

                const { data: existingOrder } = await supabase
                    .from("orders")
                    .select("metadata")
                    .eq("id", orderId)
                    .maybeSingle();

                const currentMetadata =
                    existingOrder?.metadata && typeof existingOrder.metadata === "object"
                        ? (existingOrder.metadata as Record<string, unknown>)
                        : {};

                const nextMetadata = {
                    ...currentMetadata,
                    email_confirmation: {
                        status: "failed",
                        reason,
                        at: new Date().toISOString(),
                        to: orderEmail,
                    },
                };

                await supabase
                    .from("orders")
                    .update({ metadata: nextMetadata })
                    .eq("id", orderId);
            } else {
                const { data: existingOrder } = await supabase
                    .from("orders")
                    .select("metadata")
                    .eq("id", orderId)
                    .maybeSingle();

                const currentMetadata =
                    existingOrder?.metadata && typeof existingOrder.metadata === "object"
                        ? (existingOrder.metadata as Record<string, unknown>)
                        : {};

                const nextMetadata = {
                    ...currentMetadata,
                    email_confirmation: {
                        status: "sent",
                        at: new Date().toISOString(),
                        to: orderEmail,
                    },
                };

                await supabase
                    .from("orders")
                    .update({ metadata: nextMetadata })
                    .eq("id", orderId);
            }
        } catch {
            // ignore email failures in checkout flow
        }

        return { success: true, orderId };

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "No se pudo procesar el pedido.";
        return { success: false, error: message };
    }
}

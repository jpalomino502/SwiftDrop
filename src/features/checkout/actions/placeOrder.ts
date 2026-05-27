"use server";

import { getSupabaseServerClientWithCookies } from "@/src/lib/supabase/ssr";
import { sendOrderConfirmationEmail } from "@/src/lib/email/resend";
import { sendDeliveryPinSms } from "@/src/lib/sms";
import { accrueLoyaltyPoints } from "@/src/features/loyalty/server/actions";
import { assignDelivery } from "@/src/features/logistics/server/actions";
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
    paymentProvider?: "manual" | "epayco";
    appliedDiscountCents?: number;
    redeemedPoints?: number;
    promoCode?: string;
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
            size:
                typeof item.size === "string" && item.size.trim()
                    ? item.size.trim()
                    : null,
            color:
                typeof item.color === "string" && item.color.trim()
                    ? item.color.trim()
                    : null,
        }))
        .filter(
            (item) =>
                Number.isFinite(item.productId) &&
                item.productId > 0 &&
                Number.isFinite(item.quantity) &&
                item.quantity > 0
        );
}

export async function createOrder({
    items,
    email,
    address,
    paymentProvider = "manual",
    appliedDiscountCents = 0,
    redeemedPoints = 0,
    promoCode,
}: CreateOrderParams) {
    const supabase = await getSupabaseServerClientWithCookies();

    if (!supabase) {
        throw new Error(
            "No se pudo conectar con la base de datos (Error de configuración)."
        );
    }

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                error: "Debes iniciar sesión para completar el pedido.",
            };
        }

        const checkoutEmail =
            typeof email === "string" ? email.trim().toLowerCase() : "";

        const accountEmail =
            typeof user?.email === "string"
                ? user.email.trim().toLowerCase()
                : "";

        const orderEmail = checkoutEmail || accountEmail;

        if (!orderEmail) {
            throw new Error("El correo electrónico es obligatorio.");
        }

        const safeItems = sanitizeCheckoutItems(items);

        if (safeItems.length === 0) {
            return {
                success: false,
                error: "No hay productos validos en el pedido.",
            };
        }

        const { data: rpcData, error: rpcError } = await supabase.rpc(
            "create_checkout_order",
            {
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
            }
        );

        if (rpcError) {
            throw new Error(
                rpcError.message || "No se pudo crear la orden."
            );
        }

        const orderId = typeof rpcData === "string" ? rpcData : null;

        const deliveryPin = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        if (!orderId) {
            throw new Error(
                "La respuesta del servidor no incluye un ID de orden valido."
            );
        }

        const { error: pinError } = await supabase
            .from("orders")
            .update({
                delivery_pin: deliveryPin,
            })
            .eq("id", orderId);

        if (pinError) {
            throw new Error(
                pinError.message || "No se pudo generar el PIN del pedido."
            );
        }

        // Recalculate shipping with current business rules and persist on order/payment.
        const { data: orderForTotals, error: orderReadError } =
            await supabase
                .from("orders")
                .select("subtotal_cents, customer_id")
                .eq("id", orderId)
                .maybeSingle();

        if (orderReadError) {
            throw new Error(
                orderReadError.message ||
                    "No se pudo calcular el envío del pedido."
            );
        }

        const subtotalCents =
            typeof orderForTotals?.subtotal_cents === "number"
                ? orderForTotals.subtotal_cents
                : 0;

        const shippingQuote = calculateShippingQuote({
            city: address.city,
            subtotalCents,
            items: safeItems.map((item) => ({
                quantity: item.quantity,
            })),
        });

        const discountCents = Math.max(
            0,
            Math.floor(appliedDiscountCents)
        );

        const totalCents = Math.max(
            0,
            subtotalCents +
                shippingQuote.shippingCents -
                discountCents
        );

        const { error: orderUpdateError } = await supabase
            .from("orders")
            .update({
                shipping_cents: shippingQuote.shippingCents,
                tax_cents: 0,
                discount_cents: discountCents,
                total_cents: totalCents,
                metadata: {
                    payment_provider: paymentProvider,
                    redeemed_points: redeemedPoints,
                    promo_code: promoCode || null,
                    customer_name: address.name,
                    customer_phone: address.phone,
                    notes:
                        paymentProvider === "epayco"
                            ? "Pago con ePayco (sandbox)"
                            : "Pedido Contra Entrega",
                },
            })
            .eq("id", orderId);

        if (orderUpdateError) {
            throw new Error(
                orderUpdateError.message ||
                    "No se pudo actualizar el total del pedido."
            );
        }

        // Update payment intent
        const { error: paymentUpdateError } = await supabase
            .from("payment_intents")
            .update({
                amount_cents: totalCents,
            })
            .eq("order_id", orderId)
            .eq("provider", "manual");

        if (paymentUpdateError) {
            throw new Error(
                paymentUpdateError.message ||
                    "No se pudo actualizar el monto de pago."
            );
        }

        // SMS mock delivery PIN
        try {
            await sendDeliveryPinSms(
                address.phone,
                orderId,
                deliveryPin,
                "processing"
            );
        } catch {
            // SMS is best-effort/mock for prototype
        }

        // Loyalty points accrual
        try {
            const customerId = orderForTotals?.customer_id;

            if (customerId && totalCents > 0) {
                await accrueLoyaltyPoints(
                    orderId,
                    customerId,
                    totalCents
                );
            }
        } catch {
            // Best-effort loyalty
        }

        // Logistics assignment (simulated)
        try {
            await assignDelivery({
                orderId,
                estimatedWeightKg: safeItems.reduce(
                    (sum, i) => sum + i.quantity * 0.8,
                    0
                ),
                estimatedDistanceKm: 5 + Math.random() * 10,
                originLat: 7.12539,
                originLng: -73.1198,
                destLat: 7.12 + (Math.random() - 0.5) * 0.02,
                destLng: -73.12 + (Math.random() - 0.5) * 0.02,
            });
        } catch {
            // Best-effort assignment
        }

        // Best effort email (non-blocking): only for manual/contra-entrega.
        // For ePayco, the confirmation email is sent after payment is approved in the callback.
        if (paymentProvider !== "epayco") {
            try {
                const [{ data: orderRow }, { data: orderItems }] =
                    await Promise.all([
                        supabase
                            .from("orders")
                            .select(
                                "order_number,total_cents,currency"
                            )
                            .eq("id", orderId)
                            .maybeSingle(),

                        supabase
                            .from("order_items")
                            .select(
                                "title,quantity,line_total_cents"
                            )
                            .eq("order_id", orderId),
                    ]);

                const safeOrderItems = (orderItems ?? []).map(
                    (item) => ({
                        title: item.title ?? "Producto",
                        quantity:
                            typeof item.quantity === "number"
                                ? item.quantity
                                : 1,
                        lineTotalCents:
                            typeof item.line_total_cents ===
                            "number"
                                ? item.line_total_cents
                                : 0,
                    })
                );

                const mailResult =
                    await sendOrderConfirmationEmail({
                        to: orderEmail,
                        customerName: address.name,
                        orderId,
                        orderNumber:
                            orderRow?.order_number ?? null,
                        currency:
                            orderRow?.currency ?? "COP",
                        totalCents:
                            orderRow?.total_cents ?? 0,
                        items: safeOrderItems,
                    });

                if (!mailResult.ok) {
                    const reason =
                        mailResult.reason ||
                        "unknown_email_error";

                    console.error(
                        "[Checkout] Failed to send confirmation email",
                        {
                            orderId,
                            to: orderEmail,
                            reason,
                            skipped: mailResult.skipped,
                        }
                    );

                    const { data: existingOrder } =
                        await supabase
                            .from("orders")
                            .select("metadata")
                            .eq("id", orderId)
                            .maybeSingle();

                    const currentMetadata =
                        existingOrder?.metadata &&
                        typeof existingOrder.metadata ===
                            "object"
                            ? (existingOrder.metadata as Record<
                                  string,
                                  unknown
                              >)
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
                        .update({
                            metadata: nextMetadata,
                        })
                        .eq("id", orderId);
                } else {
                    const { data: existingOrder } =
                        await supabase
                            .from("orders")
                            .select("metadata")
                            .eq("id", orderId)
                            .maybeSingle();

                    const currentMetadata =
                        existingOrder?.metadata &&
                        typeof existingOrder.metadata ===
                            "object"
                            ? (existingOrder.metadata as Record<
                                  string,
                                  unknown
                              >)
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
                        .update({
                            metadata: nextMetadata,
                        })
                        .eq("id", orderId);
                }
            } catch {
                // ignore email failures in checkout flow
            }
        }

        // Award loyalty points
        const { error: pointsError } = await supabase.rpc(
            "award_order_points",
            {
                p_order_id: orderId,
            }
        );

        if (pointsError) {
            console.error(
                "[LOYALTY_POINTS_ERROR]",
                pointsError
            );
        }

        return {
            success: true,
            orderId,
            paymentProvider,
        };
    } catch (error: unknown) {
        const message =
            error instanceof Error
                ? error.message
                : "No se pudo procesar el pedido.";

        return {
            success: false,
            error: message,
        };
    }
}
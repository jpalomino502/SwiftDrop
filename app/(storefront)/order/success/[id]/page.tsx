import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import OrderSuccessActions from "@/src/features/home/ui/components/OrderSuccessActions";
import { buildStorefrontMetadata } from "@/src/lib/seo";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { sendOrderConfirmationEmail } from "@/src/lib/email/resend";

type OrderSuccessPageProps = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({
    params,
}: OrderSuccessPageProps): Promise<Metadata> {
    const { id } = await params;
    const shortOrderId = id.slice(0, 8).toUpperCase();

    return buildStorefrontMetadata({
        title: `Pedido recibido #${shortOrderId}`,
        description:
            "Tu compra fue confirmada. Consulta el resumen del pedido y los siguientes pasos.",
        path: `/order/success/${id}`,
        noIndex: true,
    });
}

export default async function OrderSuccessPage({
    params,
}: OrderSuccessPageProps) {
    const { id } = await params;
    const supabase = getSupabaseServerClient();

    if (supabase) {
        try {
            const { data: order } = await supabase
                .from("orders")
                .select("status, payment_status, email, metadata, order_number, total_cents, currency")
                .eq("id", id)
                .maybeSingle();

            if (order && order.payment_status === "paid") {
                const meta = (order.metadata ?? {}) as Record<string, unknown>;
                const emailConfirmation = (meta?.email_confirmation as Record<string, unknown>) ?? {};

                if (!emailConfirmation || emailConfirmation.status !== "sent") {
                    const { data: orderItems } = await supabase
                        .from("order_items")
                        .select("title, quantity, line_total_cents")
                        .eq("order_id", id);

                    const customerName = (meta?.customer_name as string) || "";
                    const safeItems = (orderItems ?? []).map((item) => ({
                        title: item.title ?? "Producto",
                        quantity: typeof item.quantity === "number" ? item.quantity : 1,
                        lineTotalCents: typeof item.line_total_cents === "number" ? item.line_total_cents : 0,
                    }));

                    const mailResult = await sendOrderConfirmationEmail({
                        to: order.email || "",
                        customerName,
                        orderId: id,
                        orderNumber: order.order_number ?? null,
                        currency: order.currency ?? "COP",
                        totalCents: order.total_cents ?? 0,
                        items: safeItems,
                    });

                    if (mailResult.ok) {
                        const nextMetadata = {
                            ...meta,
                            email_confirmation: {
                                status: "sent",
                                at: new Date().toISOString(),
                                to: order.email,
                            },
                        };
                        await supabase.from("orders").update({ metadata: nextMetadata }).eq("id", id);
                    } else {
                        const nextMetadata = {
                            ...meta,
                            email_confirmation: {
                                status: "failed",
                                reason: mailResult.reason || "unknown",
                                at: new Date().toISOString(),
                                to: order.email,
                            },
                        };
                        await supabase.from("orders").update({ metadata: nextMetadata }).eq("id", id);
                    }
                }
            }
        } catch {
            // Best effort: if email fails, page still renders
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="max-w-2xl w-full text-center">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 mx-auto">
                    <CheckCircle2 className="w-12 h-12 text-green-500" strokeWidth={1.5} />
                </div>

                <h1 className="text-4xl md:text-5xl mb-6">¡Gracias por tu compra!</h1>

                <p className="text-gray-600 text-lg mb-8">
                    Hemos recibido tu pedido correctamente.
                </p>

                <div className="bg-gray-50 px-6 py-4  mb-8 inline-block border border-gray-100">
                    <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">
                        Número de pedido
                    </p>
                    <p className="text-xl font-mono">#{id.slice(0, 8)}</p>
                </div>

                <p className="text-sm text-gray-500 max-w-md mx-auto mb-10">
                    Te enviaremos un correo electrónico con los detalles de tu pedido y la información de envío.
                    Recuerda tener listo el efectivo para el pago contra entrega.
                </p>

                <OrderSuccessActions />
            </div>
        </div>
    );
}

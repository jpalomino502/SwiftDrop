"use client";

import { StatusBadge } from "../components/StatusBadge";
import { ArrowLeft, MapPin, CreditCard, Calendar, Printer, Download } from "lucide-react";
import Link from "next/link";
import { cn, Button } from "@heroui/react";

import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";
import { getAdminBootstrapSql, useAdminAccess } from "../client/useAdminAccess";
import { formatCOP } from "@/src/shared/presentation/ui";

type OrderAddressRow = {
    type: "shipping" | "billing";
    name: string | null;
    phone: string | null;
    line1: string;
    line2: string | null;
    city: string | null;
    region: string | null;
    postal_code: string | null;
    country: string;
};

type OrderItemRow = {
    id: string;
    title: string;
    sku: string | null;
    image_url: string | null;
    quantity: number;
    unit_price_cents: number;
    line_total_cents: number;
};

type PaymentIntentRow = {
    id: string;
    provider: string;
    provider_intent_id: string | null;
    status: string;
    amount_cents: number;
    created_at: string;
};

type OrderRow = {
    id: string;
    order_number: number;
    status: string;
    payment_status: string;
    fulfillment_status: string;
    subtotal_cents: number;
    shipping_cents: number;
    tax_cents: number;
    discount_cents: number;
    total_cents: number;
    created_at: string;
    placed_at: string | null;
    email: string | null;
    customer: { id: string; full_name: string | null; email: string | null; phone: string | null }[] | null;
    order_items: OrderItemRow[];
    order_addresses: OrderAddressRow[];
};

function formatOrderId(orderNumber: number) {
    return `#ORD-${String(orderNumber).padStart(6, "0")}`;
}

function fmtDateTime(iso: string) {
    return new Intl.DateTimeFormat("es-CO", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(iso));
}

function buildTimeline(order: OrderRow) {
    const placedAt = order.placed_at || order.created_at;
    const itemsCount = order.order_items.reduce((sum, i) => sum + i.quantity, 0);

    const steps = [
        { status: "Orden Realizada", active: true, date: fmtDateTime(placedAt) },
        { status: "Pago", active: order.payment_status !== "unpaid", date: order.payment_status !== "unpaid" ? fmtDateTime(placedAt) : "Pendiente" },
        { status: "Preparación", active: order.fulfillment_status !== "unfulfilled", date: order.fulfillment_status !== "unfulfilled" ? fmtDateTime(placedAt) : "Pendiente" },
        { status: "Enviado", active: order.fulfillment_status === "shipped" || order.fulfillment_status === "delivered", date: order.fulfillment_status === "shipped" || order.fulfillment_status === "delivered" ? fmtDateTime(placedAt) : "Pendiente" },
        { status: "Entregado", active: order.fulfillment_status === "delivered", date: order.fulfillment_status === "delivered" ? fmtDateTime(placedAt) : "Pendiente" },
    ];

    return { steps, itemsCount, placedAt };
}

export function OrderDetailsPage({ params }: { params: { id: string } }) {
    const access = useAdminAccess();
    const [order, setOrder] = useState<OrderRow | null>(null);
    const [paymentIntents, setPaymentIntents] = useState<PaymentIntentRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const timeline = useMemo(() => (order ? buildTimeline(order) : null), [order]);
    const shipping = useMemo(
        () => order?.order_addresses?.find((a) => a.type === "shipping") ?? null,
        [order],
    );

    async function load() {
        setError("");
        if (access.status !== "ready") return;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        setLoading(true);
        try {
            const [{ data, error }, { data: pi, error: piErr }] = await Promise.all([
                supabase
                    .from("orders")
                    .select(
                        "id,order_number,status,payment_status,fulfillment_status,subtotal_cents,shipping_cents,tax_cents,discount_cents,total_cents,created_at,placed_at,email,customer:customers(id,full_name,email,phone),order_items(id,title,sku,image_url,quantity,unit_price_cents,line_total_cents),order_addresses(type,name,phone,line1,line2,city,region,postal_code,country)",
                    )
                    .eq("id", params.id)
                    .single(),
                supabase
                    .from("payment_intents")
                    .select("id,provider,provider_intent_id,status,amount_cents,created_at")
                    .eq("order_id", params.id)
                    .order("created_at", { ascending: false })
                    .limit(5),
            ]);
            if (error) throw error;
            if (piErr) throw piErr;
            setOrder((data ?? null) as OrderRow | null);
            setPaymentIntents((pi ?? []) as PaymentIntentRow[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error cargando orden");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [access.status, params.id]);

    if (access.status === "missing-env") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Order</h2>
                <p className="mt-2 text-sm text-gray-600">{access.message}</p>
            </div>
        );
    }

    if (access.status === "loading") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-600">Cargando…</p>
            </div>
        );
    }

    if (access.status === "unauthenticated") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Order</h2>
                <p className="mt-2 text-sm text-gray-600">Inicia sesión para acceder al panel de admin.</p>
                <p className="mt-2 text-xs text-gray-400">Usa el login del storefront (header).</p>
            </div>
        );
    }

    if (access.status === "forbidden") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Order</h2>
                <p className="mt-2 text-sm text-gray-600">Tu usuario no tiene permisos de admin.</p>
                <p className="mt-4 text-xs text-gray-500">Ejecuta esto en Supabase SQL Editor:</p>
                <pre className="mt-2  bg-gray-50 p-4 text-xs overflow-auto">{getAdminBootstrapSql(access.userId)}</pre>
            </div>
        );
    }

    if (loading && !order) {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-600">Cargando orden…</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Order</h2>
                <p className="mt-2 text-sm text-gray-600">No se encontró la orden.</p>
                {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
            </div>
        );
    }

    const displayId = formatOrderId(order.order_number);
    const itemsCount = timeline?.itemsCount ?? 0;
    const placedAt = timeline?.placedAt ?? order.created_at;
    const mainStatus = order.status;
    const payment = paymentIntents[0] ?? null;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/orders" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-normal">Orden {displayId}</h2>
                            <StatusBadge status={mainStatus} />
                        </div>
                        <p className="text-sm text-gray-500 font-light mt-1">{fmtDateTime(placedAt)} • {itemsCount} Ítems</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="lg"
                        radius="full"
                        className="bg-zinc-100 text-black"
                    >
                        <Printer size={16} />
                        <span>Imprimir</span>
                    </Button>
                    <Button
                        size="lg"
                        radius="full"
                        className="bg-zinc-100 text-black"
                    >
                        <Download size={16} />
                        <span>Factura</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Items & Payment */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Items */}
                    <div className=" bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-normal mb-6">Ítems de Orden</h3>
                        <div className="space-y-6">
                            {order.order_items.map((item) => (
                                <div key={item.id} className="flex items-center gap-4">
                                    <div className="h-20 w-20 shrink-0 overflow-hidden  bg-gray-100">
                                        <img src={item.image_url || "/placeholder.svg"} alt={item.title} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm">{item.title}</h4>
                                        <p className="text-gray-500 text-xs mt-1">{item.sku || "Defecto"}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-sm">{formatCOP(item.unit_price_cents)}</p>
                                        <p className="text-gray-500 text-xs mt-1">Cant: {item.quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 border-t border-gray-100 pt-6 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span>{formatCOP(order.subtotal_cents)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Envío</span>
                                <span>{formatCOP(order.shipping_cents)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Impuesto</span>
                                <span>{formatCOP(order.tax_cents)}</span>
                            </div>
                            {order.discount_cents > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Descuento</span>
                                    <span>-{formatCOP(order.discount_cents)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base font-medium pt-2">
                                <span>Total</span>
                                <span>{formatCOP(order.total_cents)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment & Shipping info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className=" bg-white p-6 shadow-sm">
                            <h3 className="text-base font-normal mb-4 flex items-center gap-2">
                                <MapPin size={18} className="text-gray-400" />
                                Dirección de Envío
                            </h3>
                            <div className="text-sm text-gray-600 leading-relaxed">
                                {!shipping ? (
                                    <p className="text-gray-500">Sin dirección de envío</p>
                                ) : (
                                    <>
                                        <p className="font-medium text-black">{shipping.name || "(Sin nombre)"}</p>
                                        <p>{shipping.line1}</p>
                                        {shipping.line2 && <p>{shipping.line2}</p>}
                                        <p>{[shipping.city, shipping.region, shipping.postal_code].filter(Boolean).join(", ")}</p>
                                        <p>{shipping.country}</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className=" bg-white p-6 shadow-sm">
                            <h3 className="text-base font-normal mb-4 flex items-center gap-2">
                                <CreditCard size={18} className="text-gray-400" />
                                Detalles de Pago
                            </h3>
                            <div className="text-sm text-gray-600 space-y-3">
                                <div className="flex justify-between">
                                    <span>Método de Pago</span>
                                    <span className="text-black font-medium">{payment ? payment.provider : "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>ID Pago</span>
                                    <span className="text-black font-medium">{payment?.provider_intent_id || payment?.id || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Fecha</span>
                                    <span className="text-black font-medium">{payment ? fmtDateTime(payment.created_at) : "-"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Timeline & Customer */}
                <div className="space-y-6">
                    {/* Customer Card */}
                    <div className=" bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-normal mb-4">Cliente</h3>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-medium">
                                {(order.customer?.[0]?.full_name || order.customer?.[0]?.email || "?").slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium">{order.customer?.[0]?.full_name || order.customer?.[0]?.email || "(Sin cliente)"}</p>
                                <p className="text-xs text-gray-500">{order.email || order.customer?.[0]?.email || ""}</p>
                            </div>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3 text-gray-600">
                                <span className="w-20 text-gray-400">Email</span>
                                <span className="truncate">{order.customer?.[0]?.email || order.email || "-"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                                <span className="w-20 text-gray-400">Teléfono</span>
                                <span>{order.customer?.[0]?.phone || shipping?.phone || "-"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className=" bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-normal mb-6 flex items-center gap-2">
                            <Calendar size={18} className="text-gray-400" />
                            Cronología
                        </h3>
                        <div className="relative pl-4 border-l border-gray-100 space-y-6">
                            {(timeline?.steps ?? []).map((event, index) => (
                                <div key={index} className="relative">
                                    <span className={cn(
                                        "absolute -left-5.5 top-1.5 h-3 w-3 rounded-full border-2 bg-white",
                                        event.active ? "border-black" : "border-gray-200"
                                    )} />
                                    <p className={cn("text-sm font-medium", event.active ? "text-black" : "text-gray-400")}>
                                        {event.status}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">{event.date}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className=" border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}
        </div>
    );
}

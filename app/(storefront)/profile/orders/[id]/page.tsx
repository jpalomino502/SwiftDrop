"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    MapPin,
    Package,
    Truck,
} from "lucide-react";

import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";

type OrderStatus =
    | "pending"
    | "processing"
    | "paid"
    | "fulfilled"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";

type OrderItem = {
    id: string;
    title: string;
    quantity: number;
    unit_price_cents: number;
    line_total_cents: number;
    image_url: string | null;
};

type OrderData = {
    id: string;
    order_number: number;
    created_at: string;
    status: OrderStatus;
    subtotal_cents: number;
    shipping_cents: number;
    total_cents: number;
    currency: string;
    order_items: OrderItem[];
};

function formatMoney(amountCents: number, currency: string) {
    const amount = amountCents / 100;

    try {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: currency || "COP",
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `${amount.toFixed(2)} ${currency}`;
    }
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function getProgress(status: OrderStatus) {
    switch (status) {
        case "pending":
            return 15;
        case "processing":
        case "paid":
            return 40;
        case "fulfilled":
        case "shipped":
            return 75;
        case "delivered":
            return 100;
        default:
            return 0;
    }
}

function getStatusLabel(status: OrderStatus) {
    switch (status) {
        case "pending":
            return "Pendiente";
        case "processing":
            return "Procesando";
        case "paid":
            return "Pagado";
        case "fulfilled":
            return "Preparado";
        case "shipped":
            return "En camino";
        case "delivered":
            return "Entregado";
        case "cancelled":
            return "Cancelado";
        case "refunded":
            return "Reembolsado";
        default:
            return status;
    }
}

export default function OrderDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const [orderId, setOrderId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [order, setOrder] = useState<OrderData | null>(null);

    useEffect(() => {
        async function unwrapParams() {
            const resolved = await params;
            setOrderId(resolved.id);
        }

        void unwrapParams();
    }, [params]);

    useEffect(() => {
        if (!orderId) return;

        async function run() {
            setLoading(true);
            setError("");

            try {
                const supabase = getSupabaseBrowserClient();

                if (!supabase) {
                    throw new Error("Supabase no disponible.");
                }

                const { data, error } = await supabase
                    .from("orders")
                    .select(`
            id,
            order_number,
            created_at,
            status,
            subtotal_cents,
            shipping_cents,
            total_cents,
            currency,
            order_items (
              id,
              title,
              quantity,
              unit_price_cents,
              line_total_cents,
              image_url
            )
          `)
                    .eq("id", orderId)
                    .single();

                if (error) {
                    throw error;
                }

                setOrder(data as unknown as OrderData);
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "No se pudo cargar el pedido.";

                setError(message);
            } finally {
                setLoading(false);
            }
        }

        void run();
    }, [orderId]);

    const subtotal = useMemo(
        () => order?.subtotal_cents ?? 0,
        [order],
    );

    const shipping = useMemo(
        () => order?.shipping_cents ?? 0,
        [order],
    );

    const total = useMemo(
        () => order?.total_cents ?? 0,
        [order],
    );

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-20">
                <p className="text-gray-500">Cargando pedido...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-20">
                <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6"
                >
                    <ArrowLeft size={16} />
                    Volver
                </Link>

                <div className="border border-red-100 bg-red-50 p-6 text-red-700">
                    Pedido no encontrado.
                </div>
            </div>
        );
    }

    const progress = getProgress(order.status);

    return (
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
            <Link
                href="/profile"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-10"
            >
                <ArrowLeft size={16} />
                Volver a mi cuenta
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-12">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">
                        Pedido
                    </p>

                    <h1 className="text-3xl font-light">
                        #{String(order.order_number).padStart(4, "0")}
                    </h1>

                    <p className="text-sm text-gray-500 mt-3">
                        Realizado el {formatDate(order.created_at)}
                    </p>
                </div>

                <div className="flex items-center gap-3 border border-gray-200 rounded-full px-5 py-3">
                    <Clock3 size={18} strokeWidth={1.5} />
                    <span className="text-sm">
                        {getStatusLabel(order.status)}
                    </span>
                </div>
            </div>

            <div className="border border-gray-100 bg-white p-6 md:p-8 mb-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium">
                        Estado del envío
                    </h2>

                    <span className="text-sm text-gray-500">
                        {progress}%
                    </span>
                </div>

                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-8">
                    <div
                        className="h-full bg-black transition-all duration-700"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="flex flex-col items-center text-center">
                        <CheckCircle2
                            className={progress >= 15 ? "text-black" : "text-gray-300"}
                            strokeWidth={1.5}
                        />
                        <p className="text-xs mt-3">Pedido recibido</p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <Package
                            className={progress >= 40 ? "text-black" : "text-gray-300"}
                            strokeWidth={1.5}
                        />
                        <p className="text-xs mt-3">Preparando</p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <Truck
                            className={progress >= 75 ? "text-black" : "text-gray-300"}
                            strokeWidth={1.5}
                        />
                        <p className="text-xs mt-3">En camino</p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <MapPin
                            className={progress >= 100 ? "text-black" : "text-gray-300"}
                            strokeWidth={1.5}
                        />
                        <p className="text-xs mt-3">Entregado</p>
                    </div>
                </div>
            </div>

            <div className="border border-gray-100 bg-white overflow-hidden mb-10">
                <div className="p-6 md:p-8 border-b border-gray-100">
                    <h2 className="text-lg font-medium">
                        Seguimiento en tiempo real
                    </h2>
                </div>

                <div className="relative h-[350px] bg-[#f5f5f5] overflow-hidden">
                    <img
                        src="https://maps.googleapis.com/maps/api/staticmap?center=Bogota,Colombia&zoom=11&size=1200x400&maptype=roadmap"
                        alt="Mapa de seguimiento"
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />

                    <div
                        className="absolute transition-all duration-1000"
                        style={{
                            left: `${Math.max(progress - 5, 5)}%`,
                            top: "45%",
                        }}
                    >
                        <div className="relative">
                            <div className="w-5 h-5 rounded-full bg-black border-4 border-white shadow-lg" />
                            <Truck
                                size={22}
                                className="absolute -top-8 -left-2 text-black"
                            />
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm border border-gray-200 px-5 py-4 rounded-2xl shadow-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">
                            Última actualización
                        </p>

                        <p className="text-sm text-black">
                            El repartidor está cerca de tu ubicación
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 border border-gray-100 bg-white">
                    <div className="p-6 md:p-8 border-b border-gray-100">
                        <h2 className="text-lg font-medium">
                            Productos
                        </h2>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {order.order_items?.map((item) => (
                            <div
                                key={item.id}
                                className="p-6 md:p-8 flex gap-5"
                            >
                                <div className="w-24 h-28 bg-[#f5f5f5] overflow-hidden shrink-0">
                                    <img
                                        src={
                                            item.image_url ||
                                            "/placeholder.svg"
                                        }
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-medium mb-2">
                                        {item.title}
                                    </h3>

                                    <p className="text-sm text-gray-500 mb-1">
                                        Cantidad: {item.quantity}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        Precio unitario:{" "}
                                        {formatMoney(
                                            item.unit_price_cents,
                                            order.currency,
                                        )}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="text-base font-medium">
                                        {formatMoney(
                                            item.line_total_cents,
                                            order.currency,
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border border-gray-100 bg-white h-fit">
                    <div className="p-6 md:p-8 border-b border-gray-100">
                        <h2 className="text-lg font-medium">
                            Resumen
                        </h2>
                    </div>

                    <div className="p-6 md:p-8 space-y-5">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span>
                                {formatMoney(subtotal, order.currency)}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Envío</span>
                            <span>
                                {formatMoney(shipping, order.currency)}
                            </span>
                        </div>

                        <div className="border-t border-gray-100 pt-5 flex justify-between">
                            <span className="text-base font-medium">
                                Total
                            </span>

                            <span className="text-lg font-semibold">
                                {formatMoney(total, order.currency)}
                            </span>
                        </div>

                        <button
                            type="button"
                            className="w-full bg-black text-white rounded-full py-4 text-sm hover:bg-gray-800 transition-colors"
                        >
                            Descargar factura
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
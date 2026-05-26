"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    Download,
    MapPin,
    Package,
    Truck,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";

type TrackingAssignment = {
    assigned_vehicle_type?: string;
    estimated_weight_kg?: number;
    estimated_distance_km?: number;
    drones?: { name?: string } | null;
    delivery_vehicles?: { name?: string } | null;
};

function OrderTrackingSection({ orderId }: { orderId: string }) {
    const [assignment, setAssignment] = useState<TrackingAssignment | null>(null);
    const [coords, setCoords] = useState<unknown[]>([]);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/tracking/${orderId}`);
                const data = await res.json();
                setAssignment(data.assignment as TrackingAssignment | null);
                setCoords(data.coordinates ?? []);
                setProgress(data.progress ?? 0);
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [orderId]);

    if (loading) {
        return (
            <div className="border border-gray-100 bg-white p-8">
                <p className="text-sm text-gray-500">Cargando seguimiento…</p>
            </div>
        );
    }

    const VEHICLE_EMOJI: Record<string, string> = {
        drone: "🚁 Drone",
        motorcycle: "🏍️ Moto",
        bicycle: "🚲 Bicicleta",
    };

    return (
        <div className="border border-gray-100 bg-white overflow-hidden">
            <div className="p-8 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                    <Truck size={20} strokeWidth={1.5} />
                    <h2 className="text-xl font-normal">Seguimiento</h2>
                </div>
                <p className="text-sm text-gray-500">Estado actual de tu envío.</p>
            </div>

            {assignment ? (
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">{VEHICLE_EMOJI[assignment.assigned_vehicle_type ?? ""] ?? "🚚"}</span>
                        <div>
                            <p className="text-sm font-medium">
                                {assignment.drones?.name ?? assignment.delivery_vehicles?.name ?? "Vehículo asignado"}
                            </p>
                            <p className="text-xs text-gray-400 capitalize">{assignment.assigned_vehicle_type}</p>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-4">
                        Peso: {assignment.estimated_weight_kg ?? 0} kg — Distancia: {(assignment.estimated_distance_km ?? 0).toFixed(1)} km
                    </div>
                    {coords.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs text-gray-400 mb-2">Progreso: {Math.round(progress)}%</p>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-black transition-all" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}
                    <p className="text-xs text-gray-400">Mapa interactivo disponible en /track-order</p>
                </div>
            ) : (
                <div className="p-8 text-center">
                    <Package size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">Tu pedido aún no tiene asignación de entrega.</p>
                </div>
            )}
        </div>
    );
}

type Props = {
    params: Promise<{
        id: string;
    }>;
};

type Order = {
    id: string;
    order_number: number;
    created_at: string;
    status: string;
    subtotal_cents: number;
    shipping_cents: number;
    total_cents: number;
    currency: string;
    delivery_pin: number;
    delivery_pin_verified: boolean;
    metadata?: Record<string, unknown> | null;
};

type OrderItem = {
    id: string;
    title: string;
    quantity: number;
    unit_price_cents: number;
    line_total_cents: number;
    image_url: string | null;
};

type Address = {
    name: string | null;
    phone: string | null;
    line1: string;
    line2: string | null;
    city: string | null;
    region: string | null;
    postal_code: string | null;
    country: string;
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

function formatDate(iso: string) {
    const d = new Date(iso);

    return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export default function OrderDetailsPage({ params }: Props) {
    const resolvedParams = use(params);

    const [loading, setLoading] = useState(true);

    const [order, setOrder] = useState<Order | null>(null);

    const [items, setItems] = useState<OrderItem[]>([]);

    const [address, setAddress] = useState<Address | null>(null);

    useEffect(() => {
        async function run() {
            const supabase = getSupabaseBrowserClient();

            if (!supabase) return;

            setLoading(true);

            const { data: orderData } = await supabase
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
                    delivery_pin,
                    delivery_pin_verified
                `)
                .eq("id", resolvedParams.id)
                .maybeSingle();

            if (!orderData) {
                setLoading(false);
                return;
            }

            setOrder(orderData as Order);

            const { data: itemsData } = await supabase
                .from("order_items")
                .select(`
                    id,
                    title,
                    quantity,
                    unit_price_cents,
                    line_total_cents,
                    image_url
                `)
                .eq("order_id", resolvedParams.id);

            setItems((itemsData ?? []) as OrderItem[]);

            const { data: addressData } = await supabase
                .from("order_addresses")
                .select(`
                    name,
                    phone,
                    line1,
                    line2,
                    city,
                    region,
                    postal_code,
                    country
                `)
                .eq("order_id", resolvedParams.id)
                .eq("type", "shipping")
                .maybeSingle();

            setAddress(addressData as Address);

            setLoading(false);
        }

        void run();
    }, [resolvedParams.id]);

    const humanStatus = useMemo(() => {
        switch (order?.status) {
            case "delivered":
                return "Entregado";
            case "shipped":
                return "Enviado";
            case "cancelled":
                return "Cancelado";
            default:
                return "Procesando";
        }
    }, [order]);

    const isShipped =
        order?.status === "shipped" ||
        order?.status === "delivered";

    function downloadInvoice() {
        if (!order) return;

        const doc = new jsPDF({
            unit: "pt",
            format: "a4",
        });

        const pageWidth = doc.internal.pageSize.getWidth();

        const black: [number, number, number] = [15, 15, 15];
        const gray: [number, number, number] = [120, 120, 120];
        const lightGray: [number, number, number] = [235, 235, 235];

        doc.setFillColor(15, 15, 15);
        doc.rect(0, 0, pageWidth, 90, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(28);
        doc.text("SWIFTDROP", 48, 55);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text("Factura / Invoice", pageWidth - 140, 55);

        doc.setTextColor(...black);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Detalles del pedido", 48, 130);

        doc.setDrawColor(...lightGray);
        doc.line(48, 142, pageWidth - 48, 142);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);

        const orderDate = new Date(order.created_at).toLocaleDateString("es-ES");

        doc.text(`Pedido: #${String(order.order_number).padStart(4, "0")}`, 48, 170);
        doc.text(`Fecha: ${orderDate}`, 48, 190);
        doc.text(`Estado: ${humanStatus}`, 48, 210);
        doc.text(`Método de pago: ${order.metadata?.payment_provider === "epayco" ? "ePayco (simulado)" : "Contra entrega"}`, 48, 230);
        doc.text(`NIT simulado: 900.123.456-7`, 48, 250);
        doc.text(`Resolución DIAN simulada: 18760000001-2024`, 48, 270);

        doc.setTextColor(...gray);
        doc.setFontSize(9);
        doc.text("Este documento es una factura electrónica simulada sin validez fiscal para prototipo académico.", 48, 295);
        doc.setTextColor(...black);
        doc.setFontSize(11);

        if (address) {
            doc.setFont("helvetica", "bold");
            doc.text("Dirección de envío", 340, 170);

            doc.setFont("helvetica", "normal");

            const addressLines = [
                address.name,
                address.line1,
                address.line2,
                `${address.city ?? ""} ${address.region ?? ""}`,
                `${address.country ?? ""}`,
            ].filter(Boolean);

            let y = 190;

            for (const line of addressLines) {
                doc.text(String(line), 340, y);
                y += 18;
            }
        }

        autoTable(doc, {
            startY: 260,
            margin: { left: 48, right: 48 },
            head: [["Producto", "Cantidad", "Precio"]],
            body: items.map((item) => [
                item.title,
                String(item.quantity),
                formatMoney(item.line_total_cents, order.currency),
            ]),
            styles: {
                font: "helvetica",
                fontSize: 10,
                cellPadding: 12,
                textColor: black,
            },
            headStyles: {
                fillColor: black,
                textColor: [255, 255, 255],
                fontStyle: "bold",
            },
            alternateRowStyles: {
                fillColor: [248, 248, 248],
            },
            tableLineColor: lightGray,
            tableLineWidth: 0.5,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalY = (doc as any).lastAutoTable.finalY + 30;

        doc.setFillColor(250, 250, 250);

        doc.roundedRect(
            pageWidth - 240,
            finalY,
            190,
            100,
            12,
            12,
            "F"
        );

        doc.setFont("helvetica", "normal");

        doc.setFontSize(11);

        doc.text("Subtotal", pageWidth - 220, finalY + 28);

        doc.text(
            formatMoney(order.subtotal_cents ?? 0, order.currency),
            pageWidth - 70,
            finalY + 28,
            { align: "right" }
        );

        doc.text("Envío", pageWidth - 220, finalY + 52);

        doc.text(
            formatMoney(order.shipping_cents ?? 0, order.currency),
            pageWidth - 70,
            finalY + 52,
            { align: "right" }
        );

        doc.setDrawColor(...lightGray);

        doc.line(
            pageWidth - 220,
            finalY + 65,
            pageWidth - 70,
            finalY + 65
        );

        doc.setFont("helvetica", "bold");

        doc.setFontSize(13);

        doc.text("Total", pageWidth - 220, finalY + 88);

        doc.text(
            formatMoney(order.total_cents, order.currency),
            pageWidth - 70,
            finalY + 88,
            { align: "right" }
        );

        doc.setTextColor(...gray);

        doc.setFont("helvetica", "normal");

        doc.setFontSize(9);

        doc.text(
            "Gracias por comprar en SwiftDrop.",
            48,
            760
        );

        doc.text(
            "Este documento es una representación digital de tu factura.",
            48,
            776
        );

        doc.save(`factura-${order.order_number}.pdf`);
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-sm text-gray-500">
                    Cargando pedido...
                </p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6">
                <Package size={48} strokeWidth={1} className="text-gray-300" />

                <div className="text-center">
                    <h1 className="text-2xl font-normal mb-2">
                        Pedido no encontrado
                    </h1>

                    <p className="text-gray-500 text-sm">
                        Este pedido no existe o fue eliminado.
                    </p>
                </div>

                <Link
                    href="/profile"
                    className="rounded-full bg-black text-white px-6 py-3 text-xs uppercase"
                >
                    Volver al perfil
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">

                <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors mb-10"
                >
                    <ArrowLeft size={16} />
                    Volver
                </Link>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">
                            Pedido
                        </p>

                        <h1 className="text-3xl font-normal mb-3">
                            #{String(order.order_number).padStart(4, "0")}
                        </h1>

                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            <Clock3 size={16} strokeWidth={1.5} />
                            {formatDate(order.created_at)}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">

                        <div className={`
                            px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.2em]
                            border
                            ${humanStatus === "Entregado"
                                ? "bg-green-50 border-green-100 text-green-700"
                                : "bg-gray-50 border-gray-100 text-gray-600"
                            }
                        `}>
                            {humanStatus}
                        </div>

                        <button
                            onClick={downloadInvoice}
                            className="rounded-full bg-black text-white px-6 py-3 text-xs uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-gray-800 transition-colors"
                        >
                            <Download size={16} />
                            Descargar factura
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    <div className="lg:col-span-8 space-y-8">

                        {/* TRACKING */}
                        <OrderTrackingSection orderId={resolvedParams.id} />

                        {/* DELIVERY PIN */}
                        <div className="border border-gray-200 rounded-3xl p-6 bg-white mt-8">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-3">
                                Verificación de entrega
                            </p>

                            <h2 className="text-2xl font-light mb-3">
                                PIN de entrega
                            </h2>

                            <p className="text-sm text-gray-500 mb-6 max-w-xl">
                                Muestra este PIN al repartidor cuando llegue tu pedido.
                                Esto confirma que el pedido fue entregado correctamente.
                            </p>

                            {order.delivery_pin_verified ? (
                                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-green-50 text-green-700 border border-green-200">
                                    Pedido verificado y entregado
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="text-4xl tracking-[0.4em] font-light px-8 py-5 rounded-2xl bg-black text-white">
                                        {order.delivery_pin}
                                    </div>

                                    <div className="text-sm text-gray-500">
                                        Entrégalo únicamente al repartidor.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ITEMS */}
                        <div className="border border-gray-100 bg-white">
                            <div className="p-8 border-b border-gray-100">
                                <h2 className="text-xl font-normal">
                                    Productos
                                </h2>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-6 flex items-center justify-between gap-5"
                                    >
                                        <div className="flex items-center gap-5 min-w-0">

                                            <div className="w-20 h-24 bg-[#f7f7f7] overflow-hidden shrink-0">
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package
                                                            size={28}
                                                            strokeWidth={1}
                                                            className="text-gray-300"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <h3 className="text-base font-normal mb-2">
                                                    {item.title}
                                                </h3>

                                                <p className="text-sm text-gray-500">
                                                    Cantidad: {item.quantity}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-base">
                                                {formatMoney(
                                                    item.line_total_cents,
                                                    order.currency
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR */}
                    <div className="lg:col-span-4 space-y-6">

                        <div className="border border-gray-100 bg-white p-8">
                            <h2 className="text-xl font-normal mb-8">
                                Resumen
                            </h2>

                            <div className="space-y-5 text-sm">

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">
                                        Subtotal
                                    </span>

                                    <span>
                                        {formatMoney(
                                            order.subtotal_cents,
                                            order.currency
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">
                                        Envío
                                    </span>

                                    <span>
                                        {formatMoney(
                                            order.shipping_cents,
                                            order.currency
                                        )}
                                    </span>
                                </div>

                                <div className="border-t border-gray-100 pt-5 flex items-center justify-between text-base">
                                    <span>Total</span>

                                    <span>
                                        {formatMoney(
                                            order.total_cents,
                                            order.currency
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {address && (
                            <div className="border border-gray-100 bg-white p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <CheckCircle2
                                        size={18}
                                        strokeWidth={1.5}
                                    />

                                    <h2 className="text-xl font-normal">
                                        Dirección
                                    </h2>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 leading-relaxed">

                                    {address.name && (
                                        <p className="text-black">
                                            {address.name}
                                        </p>
                                    )}

                                    <p>{address.line1}</p>

                                    {address.line2 && (
                                        <p>{address.line2}</p>
                                    )}

                                    <p>
                                        {[address.city, address.region]
                                            .filter(Boolean)
                                            .join(", ")}
                                    </p>

                                    <p>{address.country}</p>

                                    {address.phone && (
                                        <p className="pt-3">
                                            {address.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
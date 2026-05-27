"use client";

import { StatusBadge } from "../components/StatusBadge";
import { ArrowLeft, Mail, Phone, MapPin, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { cn, Button } from "@heroui/react";

import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";
import { getAdminBootstrapSql, useAdminAccess } from "../client/useAdminAccess";
import { formatCOP } from "@/src/shared/presentation/ui";

type CustomerRow = {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    created_at: string;
    metadata: unknown;
    loyalty_points: number | null;
};

type AddressRow = {
    id: string;
    is_default: boolean;
    name: string | null;
    phone: string | null;
    line1: string;
    line2: string | null;
    city: string | null;
    region: string | null;
    postal_code: string | null;
    country: string;
};

type OrderListRow = {
    id: string;
    order_number: number;
    created_at: string;
    placed_at: string | null;
    status: string;
    total_cents: number;
    item_count: number;
};

function formatOrderId(orderNumber: number) {
    return `#ORD-${String(orderNumber).padStart(6, "0")}`;
}

function fmtDate(iso: string) {
    return new Intl.DateTimeFormat("es-CO", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(iso));
}

function parseMetadata(obj: unknown): Record<string, unknown> {
    if (!obj || typeof obj !== "object") return {};
    return obj as Record<string, unknown>;
}

export function CustomerProfilePage({ params }: { params: { id: string } }) {
    const access = useAdminAccess();
    const [customer, setCustomer] = useState<CustomerRow | null>(null);
    const [defaultAddress, setDefaultAddress] = useState<AddressRow | null>(null);
    const [orders, setOrders] = useState<OrderListRow[]>([]);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");

    const stats = useMemo(() => {
        const totalSpent = orders.reduce((sum, o) => sum + (typeof o.total_cents === "number" ? o.total_cents : 0), 0);
        const count = orders.length;
        const avg = count > 0 ? Math.round(totalSpent / count) : 0;
        return { totalSpent, count, avg };
    }, [orders]);

    async function load() {
        setError("");
        setSuccess("");
        if (access.status !== "ready") return;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        setLoading(true);
        try {
            const [{ data: cust, error: custErr }, { data: addr, error: addrErr }, { data: ords, error: ordErr }] = await Promise.all([
                supabase
                    .from("customers")
                    .select("id,full_name,email,phone,status,created_at,metadata")
                    .eq("id", params.id)
                    .single(),
                supabase
                    .from("customer_addresses")
                    .select("id,is_default,name,phone,line1,line2,city,region,postal_code,country")
                    .eq("customer_id", params.id)
                    .order("is_default", { ascending: false })
                    .order("created_at", { ascending: false })
                    .limit(10),
                supabase
                    .from("orders")
                    .select("id,order_number,created_at,placed_at,status,total_cents,item_count")
                    .eq("customer_id", params.id)
                    .order("created_at", { ascending: false })
                    .limit(200),
            ]);
            if (custErr) throw custErr;
            if (addrErr) throw addrErr;
            if (ordErr) throw ordErr;

            const c = cust as CustomerRow;
            setCustomer(c);
            const md = parseMetadata(c.metadata);
            setNote(typeof md.admin_note === "string" ? (md.admin_note as string) : "");

            const addresses = (addr ?? []) as AddressRow[];
            setDefaultAddress(addresses.find((a) => a.is_default) ?? addresses[0] ?? null);
            setOrders((ords ?? []) as OrderListRow[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error cargando cliente");
        } finally {
            setLoading(false);
        }
    }

    async function saveNote() {
        setError("");
        setSuccess("");
        if (access.status !== "ready") return;
        if (!customer) return;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        setSaving(true);
        try {
            const md = parseMetadata(customer.metadata);
            const next = { ...md, admin_note: note };
            const { error } = await supabase
                .from("customers")
                .update({ metadata: next })
                .eq("id", customer.id);
            if (error) throw error;
            setSuccess("Nota guardada.");
            setCustomer((p) => (p ? { ...p, metadata: next } : p));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error guardando nota");
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [access.status, params.id]);

    if (access.status === "missing-env") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Perfil de Cliente</h2>
                <p className="mt-2 text-sm text-gray-600">{access.message}</p>
            </div>
        );
    }

    if (access.status === "loading") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-600">Cargando...</p>
            </div>
        );
    }

    if (access.status === "unauthenticated") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Perfil de Cliente</h2>
                <p className="mt-2 text-sm text-gray-600">Inicia sesión para acceder al panel de admin.</p>
                <p className="mt-2 text-xs text-gray-400">Usa el login del storefront (header).</p>
            </div>
        );
    }

    if (access.status === "forbidden") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Perfil de Cliente</h2>
                <p className="mt-2 text-sm text-gray-600">Tu usuario no tiene permisos de admin.</p>
                <p className="mt-4 text-xs text-gray-500">Ejecuta esto en Supabase SQL Editor:</p>
                <pre className="mt-2  bg-gray-50 p-4 text-xs overflow-auto">{getAdminBootstrapSql(access.userId)}</pre>
            </div>
        );
    }

    if (loading && !customer) {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-600">Cargando cliente...</p>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Perfil de Cliente</h2>
                <p className="mt-2 text-sm text-gray-600">No se encontró el cliente.</p>
                {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
            </div>
        );
    }

    const name = customer.full_name || customer.email || "(Sin nombre)";
    const memberSince = new Intl.DateTimeFormat("es-CO", { year: "numeric", month: "short" }).format(new Date(customer.created_at));
    const addressLine = defaultAddress
        ? `${defaultAddress.line1}${defaultAddress.line2 ? `, ${defaultAddress.line2}` : ""}`
        : null;
    const addressCity = defaultAddress
        ? [defaultAddress.city, defaultAddress.region, defaultAddress.postal_code].filter(Boolean).join(", ")
        : null;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/customers" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h2 className="text-2xl font-normal">Perfil de Cliente</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar Profile */}
                <div className="space-y-6">
                    <div className=" bg-white p-8 shadow-sm text-center">
                        <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-medium mb-4">
                            {name.slice(0, 2).toUpperCase()}
                        </div>
                        <h3 className="text-xl font-normal">{name}</h3>
                        <p className="text-sm text-gray-500 mb-6">Miembro desde {memberSince}</p>

                        <div className="flex justify-center gap-2 mb-6">
                            <StatusBadge status={customer.status} />
                        </div>

                        <div className="border-t border-gray-100 pt-6 space-y-4 text-left">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Mail size={16} className="text-gray-400" />
                                <span>{customer.email || "-"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Phone size={16} className="text-gray-400" />
                                <span>{customer.phone || defaultAddress?.phone || "-"}</span>
                            </div>
                            <div className="flex items-start gap-3 text-sm text-gray-600">
                                <MapPin size={16} className="text-gray-400 mt-0.5" />
                                <span>
                                    {addressLine ? <>{addressLine}<br /></> : "Sin dirección"}
                                    {addressCity || ""}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className=" bg-white p-6 shadow-sm">
                        <h4 className="font-medium mb-4">Notas</h4>
                        <textarea
                            className="w-full h-32 p-3 text-sm bg-gray-50  resize-none outline-none focus:ring-1 focus:ring-black"
                            placeholder="Agrega notas internas sobre este cliente..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                        <Button
                            size="lg"
                            radius="full"
                            className="bg-black text-white w-full mt-3"
                            isDisabled={saving}
                            onPress={() => void saveNote()}
                        >
                            Guardar Nota
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className=" bg-white p-6 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">Total Gastado</p>
                            <p className="text-2xl font-normal">{formatCOP(stats.totalSpent)}</p>
                        </div>
                        <div className=" bg-white p-6 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">Órdenes</p>
                            <p className="text-2xl font-normal">{stats.count}</p>
                        </div>
                        <div className=" bg-white p-6 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">Promedio</p>
                            <p className="text-2xl font-normal">{formatCOP(stats.avg)}</p>
                        </div>
                    </div>

                    {/* Order History */}
                    <div className=" bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-normal mb-6 flex items-center gap-2">
                            <ShoppingBag size={18} className="text-gray-400" />
                            Historial de Compras
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-gray-100">
                                    <tr>
                                        <th className="pb-3 font-normal text-gray-500">Orden</th>
                                        <th className="pb-3 font-normal text-gray-500">Fecha</th>
                                        <th className="pb-3 font-normal text-gray-500">Items</th>
                                        <th className="pb-3 font-normal text-gray-500">Total</th>
                                        <th className="pb-3 font-normal text-gray-500">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {orders.length === 0 && (
                                        <tr>
                                            <td className="py-6 text-sm text-gray-500" colSpan={5}>Este cliente aún no tiene órdenes.</td>
                                        </tr>
                                    )}

                                    {orders.map((order) => (
                                        <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 font-medium text-black">
                                                <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                                                    {formatOrderId(order.order_number)}
                                                </Link>
                                            </td>
                                            <td className="py-4 text-gray-500">{fmtDate(order.placed_at || order.created_at)}</td>
                                            <td className="py-4 text-gray-500">{order.item_count} artículos</td>
                                            <td className="py-4 font-medium">{formatCOP(order.total_cents)}</td>
                                            <td className="py-4">
                                                <StatusBadge status={order.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className=" border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}
            {success && (
                <div className=" border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                    {success}
                </div>
            )}
        </div>
    );
}

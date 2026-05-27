"use client";

import { StatusBadge } from "../components/StatusBadge";
import { Search, Filter, MoreHorizontal, Eye, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@heroui/react";

import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";
import { getAdminBootstrapSql, useAdminAccess } from "../client/useAdminAccess";
import { formatCOP } from "@/src/shared/presentation/ui";
import { updateOrderStatus } from "../../server/actions";

type OrderRow = {
    id: string;
    order_number: number;
    email: string | null;
    status: string;
    total_cents: number;
    created_at: string;
    placed_at: string | null;
    customer: { full_name: string | null; email: string | null }[] | null;
};

function formatOrderId(orderNumber: number) {
    return `#ORD-${String(orderNumber).padStart(6, "0")}`;
}

function formatDate(iso: string) {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("es-CO", { year: "numeric", month: "short", day: "2-digit" }).format(d);
}

export function OrdersPage() {
    const access = useAdminAccess();
    const [rows, setRows] = useState<OrderRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [query, setQuery] = useState("");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    async function load() {
        setError("");
        if (access.status !== "ready") return;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("orders")
                .select("id,order_number,email,status,total_cents,created_at,placed_at,customer:customers(full_name,email)")
                .order("created_at", { ascending: false })
                .limit(200);
            if (error) throw error;
            setRows((data ?? []) as OrderRow[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error cargando órdenes");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [access.status]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((o) => {
            const customerName = o.customer?.[0]?.full_name ?? "";
            const customerEmail = o.customer?.[0]?.email ?? "";
            const email = o.email ?? "";
            const id = formatOrderId(o.order_number);
            return (
                id.toLowerCase().includes(q) ||
                customerName.toLowerCase().includes(q) ||
                customerEmail.toLowerCase().includes(q) ||
                email.toLowerCase().includes(q)
            );
        });
    }, [rows, query]);

    if (access.status === "missing-env") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Orders</h2>
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
                <h2 className="text-2xl font-normal">Orders</h2>
                <p className="mt-2 text-sm text-gray-600">Inicia sesión para acceder al panel de admin.</p>
                <p className="mt-2 text-xs text-gray-400">Usa el login del storefront (header).</p>
            </div>
        );
    }

    if (access.status === "forbidden") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Órdenes</h2>
                <p className="mt-2 text-sm text-gray-600">Tu usuario no tiene permisos de admin.</p>
                <p className="mt-4 text-xs text-gray-500">Ejecuta esto en Supabase SQL Editor:</p>
                <pre className="mt-2  bg-gray-50 p-4 text-xs overflow-auto">{getAdminBootstrapSql(access.userId)}</pre>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-normal">Órdenes</h2>
                    <p className="text-sm text-gray-500 font-light mt-1">Administra y rastrea las órdenes de tus clientes.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="lg"
                        radius="full"
                        className="bg-zinc-100 text-black"
                    >
                        <Filter size={16} />
                        <span>Filtrar</span>
                    </Button>
                    <Button
                        size="lg"
                        radius="full"
                        className="bg-black text-white"
                    >
                        Exportar
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 bg-white p-4  shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar órdenes..."
                        className="w-full h-10 pl-12 pr-4 bg-gray-50  outline-none focus:ring-1 focus:ring-gray-200 text-sm"
                    />
                </div>
            </div>

            {error && (
                <div className=" border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className=" bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-100 bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 font-normal text-gray-500">ID Orden</th>
                                <th className="px-6 py-4 font-normal text-gray-500">Cliente</th>
                                <th className="px-6 py-4 font-normal text-gray-500">Fecha</th>
                                <th className="px-6 py-4 font-normal text-gray-500">Estado</th>
                                <th className="px-6 py-4 font-normal text-gray-500 text-right">Total</th>
                                <th className="px-6 py-4 font-normal text-gray-500 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && (
                                <tr>
                                    <td className="px-6 py-6 text-sm text-gray-500" colSpan={6}>
                                        Cargando órdenes…
                                    </td>
                                </tr>
                            )}

                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td className="px-6 py-6 text-sm text-gray-500" colSpan={6}>
                                        No hay órdenes.
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                filtered.map((order) => {
                                    const displayId = formatOrderId(order.order_number);
                                    const customerName = order.customer?.[0]?.full_name || order.customer?.[0]?.email || order.email || "(Sin cliente)";
                                    const date = formatDate(order.placed_at || order.created_at);
                                    return (
                                        <tr key={order.id} className="group transition-colors hover:bg-gray-50/50">
                                            <td className="px-6 py-4 font-medium">{displayId}</td>
                                            <td className="px-6 py-4">{customerName}</td>
                                            <td className="px-6 py-4 text-gray-500">{date}</td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={order.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium">
                                                {formatCOP(order.total_cents)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2 relative">
                                                    <Link
                                                        href={`/admin/orders/${order.id}`}
                                                        className="p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100"
                                                        title="Ver Detalles"
                                                    >
                                                        <Eye size={18} />
                                                    </Link>
                                                    <div ref={openMenuId === order.id ? menuRef : undefined} className="relative">
                                                        <button
                                                            className="p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100"
                                                            type="button"
                                                            onClick={() => setOpenMenuId(openMenuId === order.id ? null : order.id)}
                                                        >
                                                            <MoreHorizontal size={18} />
                                                        </button>
                                                        {openMenuId === order.id && (
                                                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 shadow-lg rounded-lg z-50 py-1">
                                                                <p className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Cambiar estado</p>
                                                                {[
                                                                    { value: "pending", label: "Pendiente" },
                                                                    { value: "processing", label: "Procesando" },
                                                                    { value: "fulfilled", label: "Preparado" },
                                                                    { value: "shipped", label: "Enviado" },
                                                                    { value: "delivered", label: "Entregado" },
                                                                    { value: "cancelled", label: "Cancelado" },
                                                                ].map((status) => (
                                                                    <button
                                                                        key={status.value}
                                                                        type="button"
                                                                        disabled={updatingId === order.id || order.status === status.value}
                                                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${order.status === status.value ? "text-gray-400 cursor-default" : "text-gray-700"}`}
                                                                        onClick={async () => {
                                                                            if (order.status === status.value) return;
                                                                            setUpdatingId(order.id);
                                                                            const res = await updateOrderStatus(order.id, status.value);
                                                                            if (res.success) {
                                                                                setOpenMenuId(null);
                                                                                if (res.smsWarning) {
                                                                                    alert(res.smsWarning);
                                                                                }
                                                                                await load();
                                                                            } else {
                                                                                alert(res.error || "No se pudo actualizar el estado");
                                                                            }
                                                                            setUpdatingId(null);
                                                                        }}
                                                                    >
                                                                        {updatingId === order.id ? "Actualizando..." : status.label}
                                                                        {order.status === status.value && (
                                                                            <span className="ml-2 text-xs text-gray-400">(actual)</span>
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-sm text-gray-500">
                    <span>Mostrando {filtered.length} de {rows.length} órdenes</span>
                    <button className="px-3 py-1 rounded-lg hover:bg-gray-100" type="button" onClick={() => void load()}>
                        Actualizar
                    </button>
                </div>
            </div>
        </div>
    );
}

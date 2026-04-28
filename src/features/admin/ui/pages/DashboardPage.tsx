"use client";

import { MetricCard } from "../components/MetricCard";
import { DollarSign, ShoppingBag, Users, Layers } from "lucide-react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    BarChart,
    Bar,
    Legend,
} from "recharts";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";
import { getAdminBootstrapSql, useAdminAccess } from "../client/useAdminAccess";
import { formatCOP } from "@/src/shared/presentation/ui";

const BOOT_KEY = "swiftdrop_admin_booted_v1";

type OrderRow = {
    id: string;
    order_number: number;
    total_cents: number;
    created_at: string;
    status: string;
    customer: { full_name: string | null; email: string | null }[] | null;
};
type CustomerCountRow = { id: string; status: string };
type ProductCountRow = { id: string; status: string; is_published: boolean };

function monthKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function last12MonthKeys(now: Date) {
    const keys: string[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(now.getMonth() - i);
        keys.push(monthKey(d));
    }
    return keys;
}

function formatOrderId(orderNumber: number) {
    return `#ORD-${String(orderNumber).padStart(6, "0")}`;
}

export function DashboardPage() {
    const access = useAdminAccess();
    const [booted, setBooted] = useState(() => {
        if (typeof window === "undefined") return true;
        try {
            return window.sessionStorage.getItem(BOOT_KEY) === "1";
        } catch {
            return true;
        }
    });
    useEffect(() => {
        if (!booted && access.status !== "loading") {
            try {
                window.sessionStorage.setItem(BOOT_KEY, "1");
            } catch { }
            setBooted(true);
        }
    }, [access.status, booted]);
    const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
    const [revenue12m, setRevenue12m] = useState<number[]>(Array.from({ length: 12 }, () => 0));
    const [orders12m, setOrders12m] = useState<number[]>(Array.from({ length: 12 }, () => 0));
    const [totalRevenueCents, setTotalRevenueCents] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);
    const [activeCustomers, setActiveCustomers] = useState(0);
    const [activeProducts, setActiveProducts] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const now = useMemo(() => new Date(), []);

    async function load() {
        setError("");
        if (access.status !== "ready") return;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        setLoading(true);
        try {
            const since = new Date(now);
            since.setMonth(now.getMonth() - 11);
            since.setHours(0, 0, 0, 0);
            const sinceIso = since.toISOString();

            const [{ data: ordersData, error: ordersErr }, { data: customersData, error: customersErr }, { data: productsData, error: productsErr }] = await Promise.all([
                supabase
                    .from("orders")
                    .select("id,order_number,total_cents,created_at,status,customer:customers(full_name,email)")
                    .gte("created_at", sinceIso)
                    .order("created_at", { ascending: false })
                    .limit(5000),
                supabase
                    .from("customers")
                    .select("id,status")
                    .limit(5000),
                supabase
                    .from("products")
                    .select("id,status,is_published")
                    .limit(5000),
            ]);
            if (ordersErr) throw ordersErr;
            if (customersErr) throw customersErr;
            if (productsErr) throw productsErr;

            const orders = (ordersData ?? []) as OrderRow[];
            const customers = (customersData ?? []) as CustomerCountRow[];
            const products = (productsData ?? []) as ProductCountRow[];

            setRecentOrders(orders.slice(0, 10));
            setTotalOrders(orders.length);
            setTotalRevenueCents(orders.reduce((sum, o) => sum + (typeof o.total_cents === "number" ? o.total_cents : 0), 0));
            setActiveCustomers(customers.filter((c) => (c.status || "").toLowerCase() === "active").length);
            setActiveProducts(products.filter((p) => p.is_published && (p.status || "").toLowerCase() === "active").length);

            const keys = last12MonthKeys(now);
            const revMap = new Map<string, number>();
            const cntMap = new Map<string, number>();
            for (const k of keys) {
                revMap.set(k, 0);
                cntMap.set(k, 0);
            }
            for (const o of orders) {
                const d = new Date(o.created_at);
                const k = monthKey(d);
                if (!revMap.has(k)) continue;
                revMap.set(k, (revMap.get(k) ?? 0) + (typeof o.total_cents === "number" ? o.total_cents : 0));
                cntMap.set(k, (cntMap.get(k) ?? 0) + 1);
            }

            setRevenue12m(keys.map((k) => (revMap.get(k) ?? 0) / 100));
            setOrders12m(keys.map((k) => cntMap.get(k) ?? 0));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error cargando dashboard");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [access.status]);

    if (access.status === "missing-env") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Dashboard</h2>
                <p className="mt-2 text-sm text-gray-600">{access.message}</p>
            </div>
        );
    }

    if (access.status === "loading" && !booted) {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-600">Cargando…</p>
            </div>
        );
    }

    if (access.status === "unauthenticated") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Dashboard</h2>
                <p className="mt-2 text-sm text-gray-600">Inicia sesión para acceder al panel de admin.</p>
                <p className="mt-2 text-xs text-gray-400">Usa el login del storefront (header).</p>
            </div>
        );
    }

    if (access.status === "forbidden") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Panel de Control</h2>
                <p className="mt-2 text-sm text-gray-600">Tu usuario no tiene permisos de admin.</p>
                <p className="mt-4 text-xs text-gray-500">Ejecuta esto en Supabase SQL Editor:</p>
                <pre className="mt-2  bg-gray-50 p-4 text-xs overflow-auto">{getAdminBootstrapSql(access.userId)}</pre>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-normal">Panel de Control</h2>
                <p className="text-gray-500 font-light">Bienvenido de nuevo, esto es lo que está pasando hoy.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    label="Ingresos Totales"
                    value={formatCOP(totalRevenueCents)}
                    trend={loading ? "Cargando…" : "Últimos 12 meses"}
                    trendUp={true}
                    icon={<DollarSign size={20} />}
                />
                <MetricCard
                    label="Órdenes"
                    value={String(totalOrders)}
                    trend={loading ? "Cargando…" : "Últimos 12 meses"}
                    trendUp={true}
                    icon={<ShoppingBag size={20} />}
                />
                <MetricCard
                    label="Clientes Activos"
                    value={String(activeCustomers)}
                    trend={loading ? "Cargando…" : "Clientes activos"}
                    trendUp={true}
                    icon={<Users size={20} />}
                />
                <MetricCard
                    label="Productos Activos"
                    value={String(activeProducts)}
                    trend={loading ? "Cargando…" : "Publicados + activos"}
                    trendUp={true}
                    icon={<Layers size={20} />}
                />
            </div>

            {error && (
                <div className=" border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="bg-white  p-8 shadow-sm">
                    <div className="mb-8 flex items-center justify-between">
                        <h3 className="text-lg font-normal">Resumen de Ingresos</h3>
                        <span className="text-xs text-gray-400">Últimos 12 Meses</span>
                    </div>
                    <div style={{ width: "100%", height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={last12MonthKeys(now).map((k, i) => ({ month: k, revenue: revenue12m[i] ?? 0 }))}
                                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={(v) => `$${v}`} />
                                <Tooltip formatter={(v: any) => [v, "Ingresos"]} />
                                <Line type="monotone" dataKey="revenue" stroke="#111" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white  p-8 shadow-sm">
                    <div className="mb-8 flex items-center justify-between">
                        <h3 className="text-lg font-normal">Resumen de Órdenes</h3>
                        <span className="text-xs text-gray-400">Últimos 12 Meses</span>
                    </div>
                    <div style={{ width: "100%", height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={last12MonthKeys(now).map((k, i) => ({ month: k, orders: orders12m[i] ?? 0 }))}
                                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="orders" fill="#9ca3af" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Orders Table Preview (Optional for now, but adding structure) */}
            <div className="bg-white  p-8 shadow-sm overflow-hidden">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-normal">Órdenes Recientes</h3>
                    <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-black transition-colors">Ver Todo</Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="pb-4 font-normal">ID Orden</th>
                                <th className="pb-4 font-normal">Cliente</th>
                                <th className="pb-4 font-normal">Fecha</th>
                                <th className="pb-4 font-normal">Estado</th>
                                <th className="pb-4 font-normal text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && (
                                <tr>
                                    <td className="py-6 text-sm text-gray-500" colSpan={5}>Cargando órdenes…</td>
                                </tr>
                            )}

                            {!loading && recentOrders.length === 0 && (
                                <tr>
                                    <td className="py-6 text-sm text-gray-500" colSpan={5}>Aún no hay órdenes.</td>
                                </tr>
                            )}

                            {!loading && recentOrders.map((o) => (
                                <tr key={o.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 font-medium">
                                        <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                                            {formatOrderId(o.order_number)}
                                        </Link>
                                    </td>
                                    <td className="py-4">{o.customer?.[0]?.full_name || o.customer?.[0]?.email || "(Sin cliente)"}</td>
                                    <td className="py-4 text-gray-500">{new Intl.DateTimeFormat("es-CO", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(o.created_at))}</td>
                                    <td className="py-4">
                                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs text-gray-700">
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">{formatCOP(o.total_cents)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}

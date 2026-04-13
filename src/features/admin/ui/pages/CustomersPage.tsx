"use client";

import { Search, Mail, Phone, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react";

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
};

type OrderAggRow = {
    customer_id: string | null;
    total_cents: number;
};

function initials(name: string) {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    if (parts.length === 0) return "?";
    return parts.map((p) => p.charAt(0).toUpperCase()).join("");
}

export function CustomersPage() {
    const access = useAdminAccess();
    const [customers, setCustomers] = useState<CustomerRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [query, setQuery] = useState("");

    const [ordersByCustomer, setOrdersByCustomer] = useState<Record<string, { count: number; spentCents: number }>>({});

    async function load() {
        setError("");
        if (access.status !== "ready") return;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        setLoading(true);
        try {
            const [{ data: custData, error: custErr }, { data: orderData, error: orderErr }] = await Promise.all([
                supabase
                    .from("customers")
                    .select("id,full_name,email,phone,status,created_at")
                    .order("created_at", { ascending: false })
                    .limit(500),
                supabase
                    .from("orders")
                    .select("customer_id,total_cents")
                    .not("customer_id", "is", null)
                    .limit(5000),
            ]);
            if (custErr) throw custErr;
            if (orderErr) throw orderErr;

            const cs = (custData ?? []) as CustomerRow[];
            const orders = (orderData ?? []) as OrderAggRow[];
            const agg: Record<string, { count: number; spentCents: number }> = {};
            for (const o of orders) {
                if (!o.customer_id) continue;
                if (!agg[o.customer_id]) agg[o.customer_id] = { count: 0, spentCents: 0 };
                agg[o.customer_id].count += 1;
                agg[o.customer_id].spentCents += typeof o.total_cents === "number" ? o.total_cents : 0;
            }

            setCustomers(cs);
            setOrdersByCustomer(agg);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error cargando clientes");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [access.status]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return customers;
        return customers.filter((c) => {
            const name = c.full_name ?? "";
            const email = c.email ?? "";
            const phone = c.phone ?? "";
            return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || phone.toLowerCase().includes(q);
        });
    }, [customers, query]);

    if (access.status === "missing-env") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Customers</h2>
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
                <h2 className="text-2xl font-normal">Customers</h2>
                <p className="mt-2 text-sm text-gray-600">Inicia sesión para acceder al panel de admin.</p>
                <p className="mt-2 text-xs text-gray-400">Usa el login del storefront (header).</p>
            </div>
        );
    }

    if (access.status === "forbidden") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Clientes</h2>
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
                    <h2 className="text-2xl font-normal">Clientes</h2>
                    <p className="text-sm text-gray-500 font-light mt-1">Busca y administra tu base de clientes.</p>
                </div>
                <Button
                    size="lg"
                    radius="full"
                    className="bg-zinc-100 text-black"
                >
                    <span>Exportar CSV</span>
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 bg-white p-4  shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar clientes..."
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
                                <th className="px-6 py-4 font-normal text-gray-500">Cliente</th>
                                <th className="px-6 py-4 font-normal text-gray-500">Contacto</th>
                                <th className="px-6 py-4 font-normal text-gray-500">Órdenes</th>
                                <th className="px-6 py-4 font-normal text-gray-500">Total Gastado</th>
                                <th className="px-6 py-4 font-normal text-gray-500">Estado</th>
                                <th className="px-6 py-4 font-normal text-gray-500 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && (
                                <tr>
                                    <td className="px-6 py-6 text-sm text-gray-500" colSpan={6}>
                                        Cargando clientes…
                                    </td>
                                </tr>
                            )}

                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td className="px-6 py-6 text-sm text-gray-500" colSpan={6}>
                                        No hay clientes.
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                filtered.map((customer) => {
                                    const name = customer.full_name || customer.email || "(Sin nombre)";
                                    const agg = ordersByCustomer[customer.id] || { count: 0, spentCents: 0 };
                                    const badgeClass = customer.status === "vip"
                                        ? "bg-purple-50 text-purple-600"
                                        : customer.status === "inactive"
                                            ? "bg-gray-100 text-gray-600"
                                            : "bg-emerald-50 text-emerald-600";

                                    return (
                                        <tr key={customer.id} className="group transition-colors hover:bg-gray-50/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-medium">
                                                        {initials(name)}
                                                    </div>
                                                    <Link href={`/admin/customers/${customer.id}`} className="font-medium hover:underline">
                                                        {name}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {customer.email && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <Mail size={12} /> {customer.email}
                                                        </div>
                                                    )}
                                                    {customer.phone && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <Phone size={12} /> {customer.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{agg.count} órdenes</td>
                                            <td className="px-6 py-4 font-medium">{formatCOP(agg.spentCents)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>
                                                    {customer.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100" type="button">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

"use client";

import { StatusBadge } from "../components/StatusBadge";
import { Search, RotateCw, AlertTriangle } from "lucide-react";
import { cn, Button } from "@heroui/react";

import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";
import { getAdminBootstrapSql, useAdminAccess } from "../client/useAdminAccess";

const BOOT_KEY = "swiftdrop_admin_booted_v1";

type InventoryItemRow = {
    variant_id: string;
    stock_on_hand: number;
    reserved: number;
    low_stock_threshold: number;
};

type VariantRow = {
    id: string;
    sku: string | null;
    title: string | null;
    option_values: unknown;
    product_id: { id: string; name: string } | { id: string; name: string }[] | null;
    inventory: InventoryItemRow | InventoryItemRow[] | null;
};

function parseOptionValues(obj: unknown): Record<string, unknown> {
    if (!obj || typeof obj !== "object") return {};
    return obj as Record<string, unknown>;
}

function normalizeArray<T>(val: T | T[] | null | undefined): T[] {
    if (val == null) return [];
    if (Array.isArray(val)) return val;
    return [val];
}

function getSingleRelation<T>(relation: T | T[] | null | undefined): T | null {
    if (!relation) return null;
    return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export function InventoryPage() {
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
    const [rows, setRows] = useState<VariantRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [query, setQuery] = useState("");
    const [deltaByVariant, setDeltaByVariant] = useState<Record<string, string>>({});

    async function load() {
        setError("");
        if (access.status !== "ready") return;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("product_variants")
                .select("id,sku,title,option_values,product_id:products(id,name),inventory:inventory_items(variant_id,stock_on_hand,reserved,low_stock_threshold)")
                .order("created_at", { ascending: false })
                .limit(500);
            if (error) throw error;
            setRows((data ?? []) as VariantRow[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error cargando inventario");
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
        if (!q) return rows;
        return rows.filter((v) => {
            const ov = parseOptionValues(v.option_values);
            const variantLabel = v.title || (typeof ov.title === "string" ? (ov.title as string) : "");
            const products = normalizeArray(v.product_id);
            const productName = products[0]?.name ?? "";
            return (
                productName.toLowerCase().includes(q) ||
                (v.sku ?? "").toLowerCase().includes(q) ||
                variantLabel.toLowerCase().includes(q)
            );
        });
    }, [rows, query]);

    const lowStockCount = useMemo(() => {
        return filtered.filter((v) => {
            const inv = normalizeArray(v.inventory)[0];
            const stock = inv?.stock_on_hand ?? 0;
            const thr = inv?.low_stock_threshold ?? 0;
            return stock > 0 && stock <= thr;
        }).length;
    }, [filtered]);

    async function applyDelta(variant: VariantRow) {
        setError("");
        if (access.status !== "ready") return;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        const raw = (deltaByVariant[variant.id] ?? "").trim();
        const delta = Number(raw);
        if (!Number.isFinite(delta) || !Number.isInteger(delta)) {
            setError("Ingresa un número entero en Update (delta). Ej: 5 o -2");
            return;
        }

        const inv = normalizeArray(variant.inventory)[0] ?? null;
        const current = inv?.stock_on_hand ?? 0;
        const next = Math.max(0, current + delta);
        const lowThr = inv?.low_stock_threshold ?? 0;

        const { error } = await supabase
            .from("inventory_items")
            .upsert({
                variant_id: variant.id,
                track_inventory: true,
                stock_on_hand: next,
                reserved: inv?.reserved ?? 0,
                low_stock_threshold: lowThr,
            });
        if (error) {
            setError(error.message);
            return;
        }

        setDeltaByVariant((p) => ({ ...p, [variant.id]: "" }));
        await load();
    }

    if (access.status === "missing-env") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Inventory</h2>
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
                <h2 className="text-2xl font-normal">Inventory</h2>
                <p className="mt-2 text-sm text-gray-600">Inicia sesión para acceder al panel de admin.</p>
                <p className="mt-2 text-xs text-gray-400">Usa el login del storefront (header).</p>
            </div>
        );
    }

    if (access.status === "forbidden") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Inventario</h2>
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
                    <h2 className="text-2xl font-normal">Inventario</h2>
                    <p className="text-sm text-gray-500 font-light mt-1">Gestiona niveles de stock por variante.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="lg"
                        radius="full"
                        className="bg-zinc-100 text-black"
                    >
                        <RotateCw size={16} />
                        <span>Sincronizar Stock</span>
                    </Button>
                    <Button
                        size="lg"
                        radius="full"
                        className="bg-zinc-100 text-black"
                    >
                        <AlertTriangle size={16} className="text-amber-500" />
                        <span>Alerta Stock Bajo ({lowStockCount})</span>
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
                        placeholder="Buscar por SKU, nombre..."
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
                                <th className="px-6 py-4 font-normal text-gray-500">Producto</th>
                                <th className="px-6 py-4 font-normal text-gray-500">Variante</th>
                                <th className="px-6 py-4 font-normal text-gray-500 text-center">Stock Actual</th>
                                <th className="px-6 py-4 font-normal text-gray-500">Estado</th>
                                <th className="px-6 py-4 font-normal text-gray-500 text-right">Actualizar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && (
                                <tr>
                                    <td className="px-6 py-6 text-sm text-gray-500" colSpan={5}>Cargando inventario…</td>
                                </tr>
                            )}

                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td className="px-6 py-6 text-sm text-gray-500" colSpan={5}>Aún no hay variantes.</td>
                                </tr>
                            )}

                            {!loading && filtered.map((variant) => {
                                const ov = parseOptionValues(variant.option_values);
                                const label = variant.title || (typeof ov.title === "string" ? (ov.title as string) : variant.sku || "Default");
                                const inv = getSingleRelation(variant.inventory);
                                const stock = inv?.stock_on_hand ?? 0;
                                const thr = inv?.low_stock_threshold ?? 0;
                                const low = stock > 0 && stock <= thr;
                                const productName = getSingleRelation(variant.product_id)?.name ?? "(Sin producto)";
                                return (
                                    <tr key={variant.id} className="group transition-colors hover:bg-gray-50/50">
                                        <td className="px-6 py-4 font-medium">{productName}</td>
                                        <td className="px-6 py-4 text-gray-500">{label}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={cn("font-medium", low || stock === 0 ? "text-rose-500" : "text-emerald-600")}>
                                                {stock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={stock === 0 ? "out_of_stock" : low ? "low_stock" : "active"} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <input
                                                    type="number"
                                                    value={deltaByVariant[variant.id] ?? ""}
                                                    onChange={(e) => setDeltaByVariant((p) => ({ ...p, [variant.id]: e.target.value }))}
                                                    className="w-20 px-2 py-1 rounded-lg border border-gray-200 text-right text-sm outline-none focus:border-black"
                                                    placeholder="+ / -"
                                                />
                                                <Button
                                                    size="sm"
                                                    radius="full"
                                                    className="bg-black text-white"
                                                    onPress={() => void applyDelta(variant)}
                                                >
                                                    Actualizar
                                                </Button>
                                            </div>
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

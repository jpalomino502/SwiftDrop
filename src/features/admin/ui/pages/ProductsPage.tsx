"use client";

import { StatusBadge } from "../components/StatusBadge";
import { Search, Filter, Plus, Grid, List as ListIcon, Trash2 } from "lucide-react";
import { ProductTileCard } from "@/src/shared/presentation/ui/product/ProductTileCard";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn, Button } from "@heroui/react";

import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";
import { getAdminBootstrapSql, useAdminAccess } from "../client/useAdminAccess";
import { formatCOP } from "@/src/shared/presentation/ui";

const BOOT_KEY = "tribuna90_admin_booted_v1";

type InventoryRow = { stock_on_hand: number; low_stock_threshold: number };
type VariantRow = { id: string; inventory_items: InventoryRow | InventoryRow[] | null };
type ProductRow = {
    id: string;
    name: string;
    slug: string;
    status: string;
    is_published: boolean;
    base_price_cents: number;
    primary_image_url: string | null;
    attributes: unknown;
    product_variants: VariantRow[];
};

function parseAttributes(obj: unknown): Record<string, unknown> {
    if (!obj || typeof obj !== "object") return {};
    return obj as Record<string, unknown>;
}

function getInventory(row: VariantRow): InventoryRow | null {
    const inv = row.inventory_items;
    if (!inv) return null;
    if (Array.isArray(inv)) return inv[0] ?? null;
    return inv;
}

export function ProductsPage() {
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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [rows, setRows] = useState<ProductRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [query, setQuery] = useState("");

    async function load() {
        setError("");
        if (access.status !== "ready") return;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("products")
                .select(
                    "id,name,slug,status,is_published,base_price_cents,primary_image_url,attributes,product_variants(id,inventory_items(stock_on_hand,low_stock_threshold))",
                )
                .order("created_at", { ascending: false })
                .limit(500);
            if (error) throw error;
            setRows((data ?? []) as ProductRow[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error cargando productos");
        } finally {
            setLoading(false);
        }
    }

    async function togglePublish(product: ProductRow) {
        setError("");
        if (access.status !== "ready") return;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        const next = !product.is_published;
        const { error } = await supabase
            .from("products")
            .update({ is_published: next, status: next ? "active" : "draft" })
            .eq("id", product.id);
        if (error) {
            setError(error.message);
            return;
        }
        await load();
    }

    async function deleteProduct(product: ProductRow) {
        if (!window.confirm(`¿Eliminar producto "${product.name}"?`)) return;
        setError("");
        if (access.status !== "ready") return;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        setLoading(true);
        const { error } = await supabase.from("products").delete().eq("id", product.id);
        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }
        await load();
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [access.status]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((p) => {
            const attrs = parseAttributes(p.attributes);
            const category = typeof attrs.category === "string" ? attrs.category : "";
            return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || category.toLowerCase().includes(q);
        });
    }, [rows, query]);

    const normalized = useMemo(() => {
        return filtered.map((p) => {
            const attrs = parseAttributes(p.attributes);
            const category = typeof attrs.category === "string" ? attrs.category : "-";
            const stock = (p.product_variants ?? []).reduce((sum, v) => sum + (getInventory(v)?.stock_on_hand ?? 0), 0);
            const lowThreshold = (p.product_variants ?? []).reduce((sum, v) => sum + (getInventory(v)?.low_stock_threshold ?? 0), 0);
            const statusBadge = !p.is_published || p.status === "draft" ? "draft" : p.status;
            const stockState = stock === 0 ? "out_of_stock" : stock <= lowThreshold ? "low_stock" : "ok";

            return {
                ...p,
                category,
                stock,
                statusBadge,
                stockState,
                price: formatCOP(p.base_price_cents),
                image: p.primary_image_url || "/placeholder.svg",
            };
        });
    }, [filtered]);

    // wishlist handled inside ProductTileCard

    if (access.status === "missing-env") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Products</h2>
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
                <h2 className="text-2xl font-normal">Products</h2>
                <p className="mt-2 text-sm text-gray-600">Inicia sesión para acceder al panel de admin.</p>
                <p className="mt-2 text-xs text-gray-400">Usa el login del storefront (header).</p>
            </div>
        );
    }

    if (access.status === "forbidden") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Productos</h2>
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
                    <h2 className="text-2xl font-normal">Productos</h2>
                    <p className="text-sm text-gray-500 font-light mt-1">Gestiona tu catálogo de productos.</p>
                </div>
                <Button
                    as={Link}
                    href="/admin/products/new"
                    size="lg"
                    radius="full"
                    className="bg-black text-white"
                >
                    <Plus size={18} />
                    <span>Agregar Producto</span>
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4  shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar productos..."
                        className="w-full h-10 pl-12 pr-4 bg-gray-50  outline-none focus:ring-1 focus:ring-gray-200 text-sm"
                    />
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
                    <div className="flex bg-gray-50  p-1 border border-gray-100">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn("p-2 rounded-xl transition-all", viewMode === 'grid' ? "bg-white shadow-sm" : "text-gray-400 hover:text-black")}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn("p-2 rounded-xl transition-all", viewMode === 'list' ? "bg-white shadow-sm" : "text-gray-400 hover:text-black")}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className=" border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {viewMode === 'list' ? (
                // List View
                <div className=" bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-gray-100 bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 font-normal text-gray-500">Producto</th>
                                    <th className="px-6 py-4 font-normal text-gray-500">Categoría</th>
                                    <th className="px-6 py-4 font-normal text-gray-500">Stock</th>
                                    <th className="px-6 py-4 font-normal text-gray-500">Precio</th>
                                    <th className="px-6 py-4 font-normal text-gray-500">Estado</th>
                                    <th className="px-6 py-4 font-normal text-gray-500 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading && (
                                    <tr>
                                        <td className="px-6 py-6 text-sm text-gray-500" colSpan={6}>Cargando productos…</td>
                                    </tr>
                                )}

                                {!loading && normalized.length === 0 && (
                                    <tr>
                                        <td className="px-6 py-6 text-sm text-gray-500" colSpan={6}>Aún no hay productos.</td>
                                    </tr>
                                )}

                                {!loading && normalized.map((product) => (
                                    <tr key={product.id} className="group transition-colors hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100">
                                                    <img src={product.image} alt="" className="h-full w-full object-cover" />
                                                </div>
                                                <Link href={`/admin/products/${product.id}`} className="font-medium hover:underline">{product.name}</Link>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{product.category}</td>
                                        <td className="px-6 py-4 text-gray-500">{product.stock} unidades</td>
                                        <td className="px-6 py-4 font-medium">{product.price}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={product.statusBadge} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button className="text-gray-400 hover:text-black text-xs uppercase " type="button" onClick={() => void togglePublish(product)}>
                                                    {product.is_published ? "Despublicar" : "Publicar"}
                                                </button>
                                                <Link href={`/admin/products/${product.id}`} className="text-gray-400 hover:text-black text-xs uppercase ">Editar</Link>
                                                <button className="text-gray-400 hover:text-red-600 pl-2" type="button" onClick={() => void deleteProduct(product)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // Grid View
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {loading && (
                        <div className=" bg-white p-6 shadow-sm text-sm text-gray-500">Cargando productos…</div>
                    )}

                    {!loading && normalized.map((product) => {
                        const idNum = Number(product.id);
                        const canWishlist = !Number.isNaN(idNum);

                        return (
                            <div key={product.id}>
                                <ProductTileCard
                                    href={`/admin/products/${product.id}`}
                                    name={product.name}
                                    imageUrl={product.image}
                                    badge={product.statusBadge}
                                    subcategory={product.category}
                                    price={product.price}
                                    wishlist={canWishlist ? { productId: idNum, title: product.name, imageUrl: product.image, price: (product.base_price_cents ?? 0) / 100 } : undefined}
                                />

                                <div className="mt-2 flex justify-between items-center">
                                    <button className="text-gray-400 hover:text-red-600" type="button" onClick={() => void deleteProduct(product)}>
                                        <Trash2 size={16} />
                                    </button>
                                    <button className="text-xs text-gray-500 hover:text-black" type="button" onClick={() => void togglePublish(product)}>
                                        {product.is_published ? "Despublicar" : "Publicar"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

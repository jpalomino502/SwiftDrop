"use client";

import { Folder, ChevronRight, ChevronDown, Plus, MoreHorizontal, GripVertical } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react";

import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";

import { getAdminBootstrapSql, useAdminAccess } from "../client/useAdminAccess";
import { slugify } from "../client/slugify";

type CategoryRow = {
    id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    is_active: boolean;
    sort_order: number;
};

type CategoryNode = CategoryRow & { children: CategoryNode[] };

export function CategoriesPage() {
    const access = useAdminAccess();
    const [rows, setRows] = useState<CategoryRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const [form, setForm] = useState({
        name: "",
        slug: "",
        parent_id: "",
        cover_image_url: "",
    });

    useEffect(() => {
        setForm((prev) => ({
            ...prev,
            slug: prev.slug || slugify(prev.name),
        }));
    }, [form.name]);

    const tree = useMemo(() => {
        const byId = new Map<string, CategoryNode>();
        for (const row of rows) {
            byId.set(row.id, { ...row, children: [] });
        }
        const roots: CategoryNode[] = [];
        for (const node of byId.values()) {
            if (node.parent_id && byId.has(node.parent_id)) {
                byId.get(node.parent_id)!.children.push(node);
            } else {
                roots.push(node);
            }
        }

        const sortFn = (a: CategoryNode, b: CategoryNode) =>
            a.sort_order !== b.sort_order ? a.sort_order - b.sort_order : a.name.localeCompare(b.name);

        const sortRec = (nodes: CategoryNode[]) => {
            nodes.sort(sortFn);
            for (const n of nodes) sortRec(n.children);
        };
        sortRec(roots);

        return roots;
    }, [rows]);

    async function load() {
        setError("");
        if (access.status !== "ready") return;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("categories")
                .select("id,parent_id,name,slug,is_active,sort_order")
                .order("sort_order", { ascending: true })
                .order("name", { ascending: true });
            if (error) throw error;
            setRows((data ?? []) as CategoryRow[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error cargando categorías");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [access.status]);

    const toggleExpand = (id: string) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    async function createCategory() {
        setError("");
        if (access.status !== "ready") return;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        const name = form.name.trim();
        const slug = (form.slug || slugify(name)).trim();
        if (!name || !slug) {
            setError("Nombre y slug son obligatorios.");
            return;
        }

        const { error } = await supabase.from("categories").insert({
            name,
            slug,
            parent_id: form.parent_id || null,
            cover_image_url: form.cover_image_url || null,
            is_active: true,
        });
        if (error) {
            setError(error.message);
            return;
        }

        setForm({ name: "", slug: "", parent_id: "", cover_image_url: "" });
        await load();
    }

    if (access.status === "missing-env") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Categorías</h2>
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
                <h2 className="text-2xl font-normal">Categorías</h2>
                <p className="mt-2 text-sm text-gray-600">Inicia sesión para acceder al panel de admin.</p>
                <p className="mt-2 text-xs text-gray-400">Usa el login del storefront (header).</p>
            </div>
        );
    }

    if (access.status === "forbidden") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Categorías</h2>
                <p className="mt-2 text-sm text-gray-600">Tu usuario no tiene permisos de admin.</p>
                <p className="mt-4 text-xs text-gray-500">Ejecuta esto en Supabase SQL Editor:</p>
                <pre className="mt-2  bg-gray-50 p-4 text-xs overflow-auto">{getAdminBootstrapSql(access.userId)}</pre>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Category Tree */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-normal">Categorías</h2>
                            <p className="text-sm text-gray-500 font-light mt-1">Estructura tu catálogo de productos.</p>
                        </div>
                    </div>

                    <div className=" bg-white p-2 shadow-sm">
                        {loading && (
                            <div className="p-4 text-sm text-gray-500">Cargando categorías…</div>
                        )}
                        {!loading && tree.length === 0 && (
                            <div className="p-4 text-sm text-gray-500">Aún no hay categorías.</div>
                        )}

                        {tree.map((cat) => (
                            <div key={cat.id} className="mb-2 last:mb-0">
                                <div className="group flex items-center justify-between  p-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <button className="text-gray-400 hover:text-black" cursor-grab="true">
                                            <GripVertical size={16} />
                                        </button>
                                        <button onClick={() => toggleExpand(cat.id)} className="p-1 rounded-full hover:bg-gray-200">
                                            {cat.children.length > 0 ? (
                                                expanded[cat.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                                            ) : (
                                                <div className="w-4" />
                                            )}
                                        </button>
                                        <span className="font-medium">{cat.name}</span>
                                        <span className="text-xs text-gray-400">({cat.slug})</span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="text-xs font-medium hover:underline" onClick={() => setForm((p) => ({ ...p, parent_id: cat.id }))}>
                                            Agregar Sub
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-black" type="button">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>
                                </div>

                                {expanded[cat.id] && cat.children.length > 0 && (
                                    <div className="ml-10 mt-1 space-y-1 border-l border-gray-100 pl-4 py-1">
                                        {cat.children.map((sub) => (
                                            <div
                                                key={sub.id}
                                                className="group flex items-center justify-between  p-2 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm">{sub.name}</span>
                                                    <span className="text-xs text-gray-400">({sub.slug})</span>
                                                </div>
                                                <button className="p-1 text-gray-400 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity" type="button">
                                                    <MoreHorizontal size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className=" border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                </div>

                {/* Create Form */}
                <div className="space-y-6">
                    <div className=" bg-white p-6 shadow-sm sticky top-24">
                        <h3 className="text-lg font-normal mb-6">Crear Categoría</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Nombre</label>
                                <input
                                    type="text"
                                    placeholder="Nombre de categoría"
                                    value={form.name}
                                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                    className="w-full h-12 px-4  bg-gray-50 border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Slug</label>
                                <input
                                    type="text"
                                    placeholder="slug-categoria"
                                    value={form.slug}
                                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                                    className="w-full h-12 px-4  bg-gray-50 border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Categoría Padre</label>
                                <select
                                    value={form.parent_id}
                                    onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value }))}
                                    className="w-full h-12 px-4  bg-gray-50 border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Ninguna (Nivel Superior)</option>
                                    {rows.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Imagen de Portada</label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={form.cover_image_url}
                                    onChange={(e) => setForm((p) => ({ ...p, cover_image_url: e.target.value }))}
                                    className="w-full h-12 px-4  bg-gray-50 border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all"
                                />
                            </div>
                            <Button
                                size="lg"
                                radius="full"
                                className="bg-black text-white w-full"
                                onPress={() => void createCategory()}
                            >
                                Crear Categoría
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

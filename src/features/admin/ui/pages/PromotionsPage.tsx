"use client";

import { StatusBadge } from "../components/StatusBadge";
import { Plus, Tag, Clock, Calendar } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react";

import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";
import { getAdminBootstrapSql, useAdminAccess } from "../client/useAdminAccess";
import { formatCOP } from "@/src/shared/presentation/ui";

const BOOT_KEY = "tribuna90_admin_booted_v1";

type PromotionRow = {
    id: string;
    name: string;
    code: string | null;
    type: "percent" | "fixed" | "free_shipping";
    value_percent: number | null;
    value_cents: number | null;
    starts_at: string | null;
    ends_at: string | null;
    active: boolean;
};

function formatDateRange(startsAt: string | null, endsAt: string | null) {
    if (!startsAt && !endsAt) return "En curso";
    const fmt = new Intl.DateTimeFormat("es-CO", { year: "numeric", month: "short", day: "2-digit" });
    if (startsAt && endsAt) return `${fmt.format(new Date(startsAt))} - ${fmt.format(new Date(endsAt))}`;
    if (startsAt) return `Desde ${fmt.format(new Date(startsAt))}`;
    return `Hasta ${fmt.format(new Date(endsAt!))}`;
}

function toCardStatus(p: PromotionRow) {
    const now = new Date();
    if (!p.active) return "cancelled";
    if (p.starts_at && new Date(p.starts_at) > now) return "processing";
    if (p.ends_at && new Date(p.ends_at) < now) return "cancelled";
    return "active";
}

function formatValue(p: PromotionRow) {
    if (p.type === "percent") return `${p.value_percent ?? 0}% OFF`;
    if (p.type === "fixed") return `${formatCOP(p.value_cents ?? 0)} OFF`;
    return "Envío Gratis";
}

export function PromotionsPage() {
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
    const [rows, setRows] = useState<PromotionRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    async function load() {
        setError("");
        if (access.status !== "ready") return;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("promotions")
                .select("id,name,code,type,value_percent,value_cents,starts_at,ends_at,active")
                .order("created_at", { ascending: false })
                .limit(200);
            if (error) throw error;
            setRows((data ?? []) as PromotionRow[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error cargando promociones");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [access.status]);

    const cards = useMemo(() => rows.map((p) => ({
        ...p,
        status: toCardStatus(p),
        value: formatValue(p),
        dates: formatDateRange(p.starts_at, p.ends_at),
    })), [rows]);

    if (access.status === "missing-env") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Promociones</h2>
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
                <h2 className="text-2xl font-normal">Promociones</h2>
                <p className="mt-2 text-sm text-gray-600">Inicia sesión para acceder al panel de admin.</p>
                <p className="mt-2 text-xs text-gray-400">Usa el login del storefront (header).</p>
            </div>
        );
    }

    if (access.status === "forbidden") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Promociones</h2>
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
                    <h2 className="text-2xl font-normal">Promociones</h2>
                    <p className="text-sm text-gray-500 font-light mt-1">Gestiona campañas de marketing y lanzamientos.</p>
                </div>
                <Button
                    size="lg"
                    radius="full"
                    className="bg-black text-white"
                >
                    <Plus size={18} />
                    <span>Crear Promoción</span>
                </Button>
            </div>

            {error && (
                <div className=" border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading && (
                    <div className=" bg-white p-6 shadow-sm text-sm text-gray-500">Cargando promociones…</div>
                )}

                {!loading && cards.map((promo) => (
                    <div key={promo.id} className="relative group  bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute top-6 right-6">
                            <StatusBadge status={promo.status} />
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-12 w-12  bg-gray-50 flex items-center justify-center">
                                {promo.type === 'free_shipping' ? <Clock size={20} className="text-purple-600" /> : <Tag size={20} className="text-emerald-600" />}
                            </div>
                            <div>
                                <h3 className="font-medium">{promo.name}</h3>
                                <p className="text-xs text-gray-500">{promo.type}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm p-3  bg-gray-50/50">
                                <span className="text-gray-500">Valor</span>
                                <span className="font-medium">{promo.value}</span>
                            </div>
                            {promo.code && (
                                <div className="flex justify-between items-center text-sm p-3  bg-gray-50/50">
                                    <span className="text-gray-500">Código</span>
                                    <span className="font-mono font-medium">{promo.code}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm p-3  bg-gray-50/50">
                                <span className="text-gray-500 flex items-center gap-2"><Calendar size={14} /> Duración</span>
                                <span className="font-medium">{promo.dates}</span>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            radius="full"
                            className="bg-zinc-100 text-black w-full mt-6"
                        >
                            Gestionar Detalles
                        </Button>
                    </div>
                ))}

                {/* Add New Placeholder Card */}
                <button className="flex flex-col items-center justify-center gap-4  border-2 border-dashed border-gray-200 p-6 text-gray-400 transition-all hover:border-black hover:text-black hover:bg-gray-50">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                        <Plus size={24} />
                    </div>
                    <span className="font-medium">Crear Nueva Campaña</span>
                </button>
            </div>
        </div>
    );
}

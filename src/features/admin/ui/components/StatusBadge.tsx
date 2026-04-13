import { cn } from "@heroui/react";

export type StatusType = "pending" | "processing" | "shipped" | "completed" | "cancelled" | "active" | "draft" | "archived" | "low_stock" | "out_of_stock" | "unpaid" | "paid" | "unfulfilled" | "delivered";

const STATUS_STYLES: Record<StatusType, string> = {
    pending: "bg-orange-50 text-orange-600 border-orange-100",
    processing: "bg-blue-50 text-blue-600 border-blue-100",
    shipped: "bg-purple-50 text-purple-600 border-purple-100",
    completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
    cancelled: "bg-rose-50 text-rose-600 border-rose-100",
    active: "bg-emerald-50 text-emerald-600 border-emerald-100",
    draft: "bg-gray-100 text-gray-500 border-gray-200",
    archived: "bg-gray-50 text-gray-600 border-gray-200",
    low_stock: "bg-amber-50 text-amber-600 border-amber-100",
    out_of_stock: "bg-rose-50 text-rose-600 border-rose-100",
    unpaid: "bg-gray-50 text-gray-600 border-gray-200",
    paid: "bg-emerald-50 text-emerald-600 border-emerald-100",
    unfulfilled: "bg-yellow-50 text-yellow-600 border-yellow-100",
    delivered: "bg-green-50 text-green-600 border-green-100",
};

const STATUS_LABELS: Record<StatusType, string> = {
    out_of_stock: "Sin stock",
    low_stock: "Stock bajo",
    draft: "Borrador",
    archived: "Archivado",
    active: "Activo",
    pending: "Pendiente",
    processing: "Procesando",
    shipped: "Enviado",
    completed: "Completado",
    cancelled: "Cancelado",
    unpaid: "No pagado",
    paid: "Pagado",
    unfulfilled: "No enviado",
    delivered: "Entregado",
};

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const normalizedStatus = status.toLowerCase() as StatusType;
    const style = STATUS_STYLES[normalizedStatus] || "bg-gray-50 text-gray-600 border-gray-100";
    const label = STATUS_LABELS[normalizedStatus] ?? status.replaceAll("_", " ");

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                style,
                className
            )}
        >
            {label}
        </span>
    );
}

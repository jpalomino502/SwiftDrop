"use client";

import { cn } from "@heroui/react";
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    Package,
    Layers,
    Tag,
    Settings,
    Menu,
    X,
    Box,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const NAV_ITEMS = [
    { label: "Inicio", href: "/admin", icon: LayoutDashboard },
    { label: "Órdenes", href: "/admin/orders", icon: ShoppingBag },
    { label: "Productos", href: "/admin/products", icon: Package },
    { label: "Clientes", href: "/admin/customers", icon: Users },
    { label: "Categorías", href: "/admin/categories", icon: Layers },
    { label: "Inventario", href: "/admin/inventory", icon: Box },
    { label: "Promociones", href: "/admin/promotions", icon: Tag },
    { label: "Configuración", href: "/admin/settings", icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const navHrefs = useMemo(() => NAV_ITEMS.map((item) => item.href), []);

    useEffect(() => {
        const prefetchAll = () => {
            for (const href of navHrefs) {
                router.prefetch(href);
            }
        };

        const win = window as unknown as {
            requestIdleCallback?: (cb: () => void, options?: { timeout?: number }) => number;
            cancelIdleCallback?: (id: number) => void;
        };

        if (typeof win.requestIdleCallback === "function") {
            const idleId = win.requestIdleCallback(prefetchAll, { timeout: 2000 });
            return () => win.cancelIdleCallback?.(idleId);
        }

        const timeoutId = window.setTimeout(prefetchAll, 250);
        return () => window.clearTimeout(timeoutId);
    }, [router, navHrefs]);

    return (
        <>
            <button
                className="fixed top-4 left-4 z-50 md:hidden p-2 bg-white rounded-full shadow-sm"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 transform bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out md:translate-x-0 md:top-0 md:left-0 md:h-screen md:overflow-y-auto",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    className
                )}
            >
                <div className="flex h-full flex-col px-6 py-8">
                    <div className="mb-12 px-2">
                        <Link href="/admin" className="inline-flex items-center gap-3">
                            <img src="/logo.png" alt="Tribuna 90" width={44} height={44} />
                            <h1 className="text-xl font-normal ">Tribuna 90</h1>
                        </Link>
                    </div>

                    <nav className="flex-1 space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    prefetch={true}
                                    onMouseEnter={() => router.prefetch(item.href)}
                                    onFocus={() => router.prefetch(item.href)}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3  px-4 py-3 text-sm transition-all duration-200",
                                        isActive
                                            ? "bg-black text-white shadow-md"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-black"
                                    )}
                                >
                                    <item.icon size={18} strokeWidth={1.5} />
                                    <span className="font-normal">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto px-2 opacity-50">
                        <p className="text-xs text-center font-light">Admin v1.0</p>
                    </div>
                </div>
            </aside>

            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}

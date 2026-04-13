"use client";

import { cn } from "@heroui/react";
import { ReactNode } from "react";

interface MetricCardProps {
    label: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon?: ReactNode;
    className?: string;
}

export function MetricCard({
    label,
    value,
    trend,
    trendUp,
    icon,
    className,
}: MetricCardProps) {
    return (
        <div
            className={cn(
                "flex flex-col justify-between  bg-white p-6 shadow-sm transition-all hover:shadow-md",
                className
            )}
        >
            <div className="flex items-start justify-between">
                <span className="text-sm font-normal text-gray-500">{label}</span>
                {icon && <div className="text-gray-400">{icon}</div>}
            </div>
            <div className="mt-4">
                <h3 className="text-3xl font-normal ">{value}</h3>
                {trend && (
                    <div className="mt-1 flex items-center gap-1 text-xs">
                        <span
                            className={cn(
                                "font-medium",
                                trendUp ? "text-emerald-500" : "text-rose-500"
                            )}
                        >
                            {trendUp ? "+" : ""}
                            {trend}
                        </span>
                        <span className="text-gray-400">vs mes anterior</span>
                    </div>
                )}
            </div>
        </div>
    );
}

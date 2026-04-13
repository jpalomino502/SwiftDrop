"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function AnnouncementBar({
    onDismiss,
}: {
    onDismiss: () => void;
}) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="relative z-60 h-10 w-full bg-black text-white text-xs md:text-sm font-medium py-2 px-4 flex items-center justify-center">
            <div className="flex items-center gap-2 text-center uppercase tracking-wider">
                <span>⚽️ Camisetas retro que son historia del fútbol</span>
                <Link
                    href="/catalog?cat=Camisetas&sub=Camisetas%20Retro"
                    className="underline underline-offset-4 font-bold hover:text-gray-300 transition-colors ml-1"
                >
                    DESCÚBRELAS AQUÍ
                </Link>
            </div>
            <button
                onClick={() => {
                    setIsVisible(false);
                    onDismiss();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Cerrar anuncio"
            >
                <X size={16} />
            </button>
        </div>
    );
}
"use client";

import { LogOut } from "lucide-react";
import { Avatar } from "@heroui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";
import { useAdminAccess } from "../client/useAdminAccess";

export function Header() {
    const access = useAdminAccess();
    const router = useRouter();
    const [displayName, setDisplayName] = useState<string>("Admin");
    const [isSigningOut, setIsSigningOut] = useState(false);
    const session = access.status === "ready" || access.status === "forbidden" ? access.session : null;
    const email = session?.user.email ?? "";
    const avatarUrl =
        typeof session?.user.user_metadata?.avatar_url === "string"
            ? (session.user.user_metadata.avatar_url as string)
            : undefined;

    useEffect(() => {
        async function loadName() {
            if (access.status !== "ready" && access.status !== "forbidden") {
                setDisplayName("Administrador");
                return;
            }
            const supabase = getSupabaseBrowserClient();
            if (!supabase) {
                setDisplayName(access.session.user.email ?? "Administrador");
                return;
            }

            const metaName = (access.session.user.user_metadata as Record<string, unknown> | null | undefined)?.full_name;
            if (typeof metaName === "string" && metaName.trim()) {
                setDisplayName(metaName.trim());
                return;
            }

            const { data, error } = await supabase
                .from("customers")
                .select("full_name")
                .eq("user_id", access.userId)
                .maybeSingle();

            if (!error && data?.full_name) {
                setDisplayName(data.full_name);
                return;
            }

            setDisplayName(access.session.user.email ?? "Administrador");
        }

        void loadName();
    }, [access.status, access.status === "ready" || access.status === "forbidden" ? access.userId : null]);

    async function handleSignOut() {
        const supabase = getSupabaseBrowserClient();
        setIsSigningOut(true);
        try {
            if (supabase) {
                await supabase.auth.signOut();
            }
        } finally {
            router.replace("/auth/admin?reason=session");
            router.refresh();
            setIsSigningOut(false);
        }
    }

    return (
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between bg-white/80 px-8 backdrop-blur-md md:h-24">
            <div className="flex-1" />

            <div className="flex items-center gap-6">
                <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    disabled={isSigningOut}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <LogOut size={18} strokeWidth={1.5} />
                    <span>{isSigningOut ? "Cerrando..." : "Cerrar sesion"}</span>
                </button>

                <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
                    <div className="text-right hidden md:block">
                        <p className="text-sm">{displayName}</p>
                        <p className="text-xs text-gray-400">{email || ""}</p>
                    </div>
                    <Avatar
                        size="sm"
                        name={email || "Cuenta"}
                        src={avatarUrl}
                        className="h-10 w-10 cursor-pointer ring-2 ring-gray-100 transition-all hover:ring-black"
                    />
                </div>
            </div>
        </header>
    );
}

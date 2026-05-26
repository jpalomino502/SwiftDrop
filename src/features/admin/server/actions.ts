"use server";

import { getSupabaseServerClientWithCookies } from "@/src/lib/supabase/ssr";

export async function updateOrderStatus(orderId: string, status: string) {
    const supabase = await getSupabaseServerClientWithCookies();
    if (!supabase) {
        return { success: false, error: "No se pudo conectar con la base de datos." };
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Debes iniciar sesión." };
        }

        // Verify admin access
        const { data: adminRow } = await supabase
            .from("admin_users")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

        if (!adminRow) {
            return { success: false, error: "No tienes permisos de administrador." };
        }

        const { error } = await supabase
            .from("orders")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", orderId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : "Error desconocido" };
    }
}

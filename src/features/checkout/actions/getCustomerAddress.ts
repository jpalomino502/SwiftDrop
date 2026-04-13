"use server";

import { getSupabaseServerClientWithCookies } from "@/src/lib/supabase/ssr";

export async function getCustomerAddress() {
    const supabase = await getSupabaseServerClientWithCookies();

    if (!supabase) return null;

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log("[getCustomerAddress] Auth user:", user?.id, "Error:", authError);

        if (!user) return null;

        const { data: customer } = await supabase
            .from("customers")
            .select("id, full_name, phone, email")
            .eq("user_id", user.id)
            .maybeSingle();

        // Prepare base profile data from Auth or Customer table
        const profileData = {
            email: user.email || customer?.email || "",
            name: customer?.full_name || user.user_metadata?.full_name || "",
            phone: customer?.phone || "",
        };

        if (!customer) {
            return { ...profileData, address: null };
        }

        const { data: address } = await supabase
            .from("customer_addresses")
            .select("*")
            .eq("customer_id", customer.id)
            .eq("is_default", true)
            .maybeSingle();

        // If no default, try getting the most recent one
        if (!address) {
            const { data: recentAddress } = await supabase
                .from("customer_addresses")
                .select("*")
                .eq("customer_id", customer.id)
                .order("updated_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            return { ...profileData, address: recentAddress };
        }

        return { ...profileData, address };

    } catch (error) {
        console.error("Error fetching customer address:", error);
        return null;
    }
}

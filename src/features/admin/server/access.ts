import { getSupabaseServerClientWithCookies } from "@/src/lib/supabase/ssr";

export type AdminServerAccess =
  | { status: "ready"; userId: string }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "missing-env" };

export async function getAdminServerAccess(): Promise<AdminServerAccess> {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) {
    return { status: "missing-env" };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "unauthenticated" };
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id,disabled_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data || data.disabled_at) {
    return { status: "forbidden" };
  }

  return { status: "ready", userId: user.id };
}

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ServerUserSnapshot = {
  email: string | null;
  avatar_url?: string;
};

export type HeaderCategory = {
  id: string;
  name: string;
  slug: string;
};

export type HeaderCategoryNode = HeaderCategory & {
  children: HeaderCategoryNode[];
  sort_order?: number;
};

export async function getSupabaseServerClientWithCookies(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !anonKey) return null;

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      // In Server Components we only need reads; token refresh/cookie writes are handled client-side.
      setAll() {},
    },
  });
}

export async function getServerUserSnapshot(): Promise<ServerUserSnapshot | null> {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const email = data.user.email ?? null;
  const avatar_url =
    typeof (data.user.user_metadata as Record<string, unknown> | null | undefined)?.avatar_url === "string"
      ? ((data.user.user_metadata as Record<string, unknown>).avatar_url as string)
      : undefined;

  return { email, avatar_url };
}

export async function getServerHeaderCategories(): Promise<HeaderCategory[]> {
  const tree = await getServerHeaderCategoryTree();
  return tree.map(({ children: _children, ...rest }) => rest);
}

export async function getServerHeaderCategoryTree(): Promise<HeaderCategoryNode[]> {
  const supabase = await getSupabaseServerClientWithCookies();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("id,parent_id,name,slug,is_active,sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return [];

  type Row = {
    id: unknown;
    parent_id: unknown;
    name: unknown;
    slug: unknown;
    sort_order?: unknown;
  };

  const rows = (data ?? []) as Row[];
  const nodesById = new Map<string, HeaderCategoryNode>();
  const parentById = new Map<string, string | null>();

  for (const r of rows) {
    const id = String(r.id);
    const parent_id = r.parent_id == null ? null : String(r.parent_id);
    const sort_order = typeof r.sort_order === "number" ? r.sort_order : 0;
    parentById.set(id, parent_id);
    nodesById.set(id, {
      id,
      name: String(r.name),
      slug: String(r.slug),
      children: [],
      sort_order,
    });
  }

  const roots: HeaderCategoryNode[] = [];
  for (const [id, node] of nodesById) {
    const parentId = parentById.get(id) ?? null;
    if (parentId && nodesById.has(parentId)) nodesById.get(parentId)!.children.push(node);
    else roots.push(node);
  }

  // Order was applied in SQL, but we re-sort to be deterministic after tree wiring.
  const byOrder = (a: HeaderCategoryNode, b: HeaderCategoryNode) =>
    (a.sort_order ?? 0) !== (b.sort_order ?? 0)
      ? (a.sort_order ?? 0) - (b.sort_order ?? 0)
      : a.name.localeCompare(b.name);
  const sortRec = (list: HeaderCategoryNode[]) => {
    list.sort(byOrder);
    for (const n of list) sortRec(n.children);
  };
  sortRec(roots);

  return roots;
}

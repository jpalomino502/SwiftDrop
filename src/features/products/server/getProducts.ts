import type { Product } from "../domain/Product";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";

type DbProductCategoryRow = {
  category_id: string;
  is_primary: boolean;
  categories: {
    id: string;
    name: string;
    parent_id: string | null;
  } | null;
};

type DbVariantRow = {
  option_values: Record<string, string>;
  is_active?: boolean | null;
};

type DbProductRow = {
  legacy_product_id: number | null;
  name: string;
  base_price_cents: number;
  compare_at_price_cents: number | null;
  primary_image_url: string | null;
  badge: string | null;
  attributes: unknown;
  product_variants: DbVariantRow[];
  product_categories: DbProductCategoryRow[];
  product_images: { url: string; position: number }[];
};

function toDisplaySubcategory(
  nombre: string,
  categoria: string,
): Product["subcategory"] {
  const n = nombre.toLowerCase();

  if (n.includes("vestido")) return "Vestidos";
  if (n.includes("falda")) return "Bottoms";
  if (
    n.includes("pantal") ||
    n.includes("jeans") ||
    n.includes("jogger") ||
    n.includes("bermuda") ||
    n.includes("short")
  ) {
    return "Bottoms";
  }
  if (
    n.includes("chaqueta") ||
    n.includes("abrigo") ||
    n.includes("gabardina") ||
    n.includes("trench") ||
    n.includes("chaleco")
  ) {
    return "Outerwear";
  }
  if (
    n.includes("camisa") ||
    n.includes("camiseta") ||
    n.includes("blusa") ||
    n.includes("top") ||
    n.includes("hoodie") ||
    n.includes("sudadera") ||
    n.includes("jersey") ||
    n.includes("polo")
  ) {
    return "Tops";
  }

  if (categoria === "Accesorios") return "Bolsos";
  return "Tops";
}

function parseAttributes(obj: unknown): Record<string, unknown> {
  if (!obj || typeof obj !== "object") return {};
  return obj as Record<string, unknown>;
}

function getOptionValue(
  optionValues: unknown,
  keys: string[],
): string | undefined {
  if (!optionValues || typeof optionValues !== "object") return undefined;
  const record = optionValues as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function logServer(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log("[getProducts]", ...args);
}

function logServerError(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.error("[getProducts]", ...args);
}

function normalizeDbProduct(p: DbProductRow): Product | null {
  if (typeof p.legacy_product_id !== "number") return null;

  const attributes = parseAttributes(p.attributes);

  // Collect all linked categories
  const allCategories = new Set<string>();
  const allSubcategories = new Set<string>();

  // Default primary from attributes fallback
  let primaryCategory = typeof attributes.category === "string" ? attributes.category : "Mujer";
  let primarySubcategory = typeof attributes.subcategory === "string" ? attributes.subcategory : null;

  // Process joined categories
  if (Array.isArray(p.product_categories)) {
    for (const pc of p.product_categories) {
      const cat = pc.categories;
      if (!cat) continue;

      // If it has a parent, it's a subcategory
      if (cat.parent_id) {
        allSubcategories.add(cat.name);
      } else {
        // It's a root category
        allCategories.add(cat.name);
      }

      // If we have a primary flag, potentially update primary display (though attributes usually source of truth for display card)
      if (pc.is_primary) {
        // Logic to update primary if needed, but we rely on persisted attributes for Card Display speed
        // However, for filtering, we need the sets.
      }
    }
  }

  // Ensure primary are in the lists (legacy fallback)
  if (primaryCategory) allCategories.add(primaryCategory);
  if (primarySubcategory) allSubcategories.add(primarySubcategory);

  if (!primarySubcategory) {
    primarySubcategory = toDisplaySubcategory(p.name, primaryCategory);
    if (primarySubcategory) allSubcategories.add(primarySubcategory);
  }

  // Extract from variants
  const variants = p.product_variants ?? [];
  const colorSet = new Set<string>();
  const sizeSet = new Set<string>();

  for (const v of variants) {
    if (v.is_active === false) continue;
    const opts = v.option_values || {};
    const color = getOptionValue(opts, ["Color", "color", "COLOUR", "colour", "COLOR"]);
    const size = getOptionValue(opts, ["Size", "size", "SIZE", "Talla", "talla"]);
    if (color) colorSet.add(color);
    if (size) sizeSet.add(size.toUpperCase());
  }

  // Fallback to attributes if no variants (legacy support)
  if (colorSet.size === 0) {
    const rawColors = attributes.colors;
    if (Array.isArray(rawColors) && rawColors.every((c) => typeof c === "string")) {
      rawColors.forEach(c => colorSet.add(c as string));
    }
  }

  if (sizeSet.size === 0) {
    const rawSizes = attributes.sizes || attributes.availableSizes || attributes.available_sizes;
    if (Array.isArray(rawSizes)) {
      for (const s of rawSizes) {
        if (typeof s === "string" && s.trim()) sizeSet.add(s.trim().toUpperCase());
      }
    }
  }

  const badge = typeof p.badge === "string" ? p.badge : undefined;
  const allowedBadge = badge === "Nuevo" || badge === "Limited" || badge === "Sale" ? badge : undefined;

  // Extract additional images
  const extraImages = (p.product_images || [])
    .sort((a, b) => a.position - b.position)
    .map((i) => i.url);

  // Ensure primary image is first if not already (or just use the list from product_images if strictly ordered)
  // The query fetches all images. We can just use that list as the gallery.
  // But strictly speaking, `primary_image_url` is the main one.
  // Let's just pass the extra images.

  return {
    id: p.legacy_product_id,
    name: p.name,
    // Keep prices in cents (no division) so formatting is applied consistently
    // at render-time using the shared `formatCOP` helper.
    price: p.base_price_cents,
    originalPrice: typeof p.compare_at_price_cents === "number" ? p.compare_at_price_cents : undefined,
    image: p.primary_image_url || "/placeholder.svg",
    images: extraImages,
    category: primaryCategory,
    subcategory: primarySubcategory ?? "",
    badge: allowedBadge,
    colors: Array.from(colorSet),
    availableSizes: Array.from(sizeSet),
    allCategories: Array.from(allCategories),
    allSubcategories: Array.from(allSubcategories),
  };
}

export async function getProducts(limit?: number, offset?: number): Promise<Product[]> {
  return getProductsInternal({ requireSupabase: true, limit, offset });
}

export async function getProductsInternal(options?: { requireSupabase?: boolean; limit?: number; offset?: number }): Promise<Product[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error(
      "Supabase no está configurado en el servidor. Agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) en el entorno.",
    );
  }

  try {
    logServer("starting", {
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
    });

    const q = supabase
      .from("products")
      .select(
        "legacy_product_id,name,base_price_cents,compare_at_price_cents,primary_image_url,badge,attributes,product_variants(option_values,is_active),product_categories(category_id,is_primary,categories(id,name,parent_id)),product_images(url,position)",
      )
      .eq("is_published", true)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    // Support simple pagination via range if limit/offset provided.
    let dataResult;
    if (typeof options?.limit === "number") {
      const off = typeof options?.offset === "number" ? options.offset : 0;
      const from = off;
      const to = off + Math.max(0, options.limit - 1);
      dataResult = await q.range(from, to);
    } else {
      // Default to previous safe limit for backward compatibility
      dataResult = await q.limit(200);
    }

    const { data, error } = dataResult as any;

    if (error) throw error;
    const rows = (data ?? []) as unknown as DbProductRow[];
    logServer("rows", rows.length);

    return rows
      .map((row) => normalizeDbProduct(row))
      .filter((p): p is Product => Boolean(p));
  } catch (e) {
    logServerError("failed primary query", e);

    if (options?.requireSupabase) throw e;
    throw e;
  }
}

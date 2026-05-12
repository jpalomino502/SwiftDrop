import type { Product } from "@/src/features/products";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";

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

export async function getProductById(productId: number): Promise<Product | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase no está configurado en el servidor.");

  try {
    // Fetch product with images and description directly for detail page
    const { data, error } = await supabase
      .from("products")
      .select(
        `legacy_product_id,name,base_price_cents,compare_at_price_cents,primary_image_url,badge,attributes,description,product_images(url),product_variants(option_values,is_active)`,
      )
      .eq("legacy_product_id", productId)
      .eq("is_published", true)
      .eq("status", "active")
      .maybeSingle();

    if (error) throw error;
    if (!data || typeof data.legacy_product_id !== "number") return null;

    const attributes = (data.attributes ?? {}) as Record<string, unknown>;

    // Validate image URL (must start with http/https and not be malformed)
    const isValidImageUrl = (url: string): boolean => {
      if (!url || typeof url !== "string") return false;
      const trimmed = url.trim();
      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return false;
      // Check for common malformed URLs (e.g., 'ttps://' missing 'h')
      if (trimmed.toLowerCase().startsWith("ttp://") || trimmed.toLowerCase().startsWith("ttps://")) return false;
      // Basic URL format check - must have at least domain and extension
      const urlPattern = /^https?:\/\/.+\..+/i;
      return urlPattern.test(trimmed);
    };

    // Build images array: primary image plus any product_images rows
    const images: string[] = [];
    if (data.primary_image_url && isValidImageUrl(data.primary_image_url)) {
      images.push(data.primary_image_url);
    }
    if (Array.isArray(data.product_images)) {
      for (const r of data.product_images as Array<{ url?: string }>) {
        if (r && typeof r.url === "string" && r.url && isValidImageUrl(r.url)) {
          // Avoid duplicate of primary
          if (!images.includes(r.url)) images.push(r.url);
        }
      }
    }

    const price = typeof data.base_price_cents === "number" ? data.base_price_cents : 0;
    const originalPrice = typeof data.compare_at_price_cents === "number" ? data.compare_at_price_cents : undefined;

    // colors and sizes may be present in attributes
    const colorSet = new Set<string>();
    const sizeSet = new Set<string>();

    if (Array.isArray(data.product_variants)) {
      for (const v of data.product_variants as Array<{ option_values?: unknown; is_active?: boolean | null }>) {
        if (v && v.is_active === false) continue;
        const color = getOptionValue(v?.option_values, ["Color", "color", "COLOUR", "colour", "COLOR"]);
        if (color) colorSet.add(color);

        const size = getOptionValue(v?.option_values, ["Size", "size", "SIZE", "Talla", "talla"]);
        if (size) sizeSet.add(size.toUpperCase());
      }
    }

    const rawColors = attributes.colors;
    if (Array.isArray(rawColors)) {
      for (const c of rawColors) if (typeof c === "string" && c.trim()) colorSet.add(c.trim());
    }
    const rawSizes = attributes.sizes || attributes.availableSizes || attributes.available_sizes;
    if (Array.isArray(rawSizes)) {
      for (const s of rawSizes) if (typeof s === "string" && s.trim()) sizeSet.add(s.trim().toUpperCase());
    }

    const product: Product = {
      id: data.legacy_product_id,
      name: data.name,
      price,
      originalPrice,
      image: images[0] ?? "/placeholder.svg",
      images: images.length > 0 ? images : undefined,
      description: typeof data.description === "string" && data.description ? data.description : (typeof attributes.description === "string" ? attributes.description : undefined),
      category: typeof attributes.category === "string" ? attributes.category : "Mujer",
      subcategory: typeof attributes.subcategory === "string" ? attributes.subcategory : "",
      badge: typeof data.badge === "string" ? (data.badge as any) : undefined,
      colors: Array.from(colorSet),
      availableSizes: sizeSet.size > 0 ? Array.from(sizeSet) : undefined,
    };

    return product;
  } catch (err) {
    // Fallback: return null so caller handles notFound
    return null;
  }
}

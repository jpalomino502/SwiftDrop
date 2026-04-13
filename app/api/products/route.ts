import { NextResponse } from "next/server";

import { getProductsInternal } from "@/src/features/products/server/getProducts";
import { smartSearchProducts } from "@/src/features/products/listing/ui/lib/smartSearch";

export const runtime = "nodejs";

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;

  if (err && typeof err === "object") {
    const maybe = err as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [
      typeof maybe.message === "string" ? maybe.message : null,
      typeof maybe.details === "string" ? maybe.details : null,
      typeof maybe.hint === "string" ? maybe.hint : null,
      typeof maybe.code === "string" ? `code=${maybe.code}` : null,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(" | ");
  }

  return "Unknown error";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQ = (searchParams.get("q") ?? "").trim();
    const q = rawQ;

    const limitParam = Number(searchParams.get("limit") ?? "");
    const offsetParam = Number(searchParams.get("offset") ?? "");
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined;
    const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;

    // If there's no search query, support pagination via limit/offset.
    if (!q) {
      const products = await getProductsInternal({ requireSupabase: true, limit, offset });
      return NextResponse.json({ products }, { status: 200 });
    }

    // For search queries we need full set and then apply smart ranking + pagination.
    const products = await getProductsInternal({ requireSupabase: true });
    const searched = smartSearchProducts(products, q);

    const from = Math.max(0, offset);
    const to = limit ? from + limit : undefined;
    const paginated = searched.products.slice(from, to);

    return NextResponse.json(
      { products: paginated, query: rawQ, searchMode: searched.mode, total: searched.products.length },
      { status: 200 },
    );
  } catch (err) {
    const message = toErrorMessage(err);
    return NextResponse.json({ error: "Failed to fetch products", message }, { status: 502 });
  }
}


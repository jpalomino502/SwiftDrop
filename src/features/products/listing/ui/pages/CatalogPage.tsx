import { getProducts } from "@/src/features/products/server/getProducts";
import { getServerHeaderCategoryTree } from "@/src/lib/supabase/ssr";

import { CatalogClientPage } from "../client/CatalogClientPage";
import { CatalogHero } from "../components/sections/CatalogHero";

export async function CatalogPage() {
  const categoryTree = await getServerHeaderCategoryTree();

  const PAGE_SIZE = 24;
  const { products, productsError } = await (async () => {
    try {
      const products = await getProducts(PAGE_SIZE, 0);
      return { products, productsError: null as string | null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { products: [], productsError: message };
    }
  })();

  return (
    <main className="min-h-screen bg-background">
      {/* <CatalogHero /> */}
      <CatalogClientPage initialProducts={products} productsError={productsError} categoryTree={categoryTree} />
    </main>
  );
}

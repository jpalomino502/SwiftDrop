import { notFound } from "next/navigation";

import { getProductById } from "../../server/getProductById";
import { getProducts } from "@/src/features/products/server/getProducts";
import { ProductDetailClient } from "../client/ProductDetailClient";

export async function ProductDetailPage({ productId }: { productId: number }) {
  const product = await getProductById(productId);
  if (!product) notFound();

  const allProducts = await getProducts().catch(() => []);
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id)
    .filter((p) => p.category === product.category || p.subcategory === product.subcategory)
    .slice(0, 4);

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}

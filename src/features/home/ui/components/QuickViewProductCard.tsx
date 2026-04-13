"use client";

import type { Product } from "@/src/features/products";
import { formatCOP, ProductTileCard } from "@/src/shared/presentation/ui";

export function QuickViewProductCard({
  product,
  onQuickView,
}: {
  product: Product;
  onQuickView: () => void;
}) {
  return (
    <ProductTileCard
      href={`/products/${product.id}`}
      name={product.name}
      imageUrl={product.image || "/placeholder.svg"}
      badge={product.badge}
      subcategory={product.subcategory}
      price={formatCOP(product.price)}
      originalPrice={product.originalPrice ? formatCOP(product.originalPrice) : undefined}
      colors={product.colors}
      wishlist={{
        productId: product.id,
        title: product.name,
        imageUrl: product.image || "/placeholder.svg",
        price: product.price,
      }}
      onQuickView={onQuickView}
    />
  );
}

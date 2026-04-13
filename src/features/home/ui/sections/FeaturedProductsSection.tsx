"use client";

import type { Product } from "@/src/features/products";
import { QuickViewModal } from "@/src/features/products";
import { useMemo, useState } from "react";
import { formatCOP, ProductHeroCard } from "@/src/shared/presentation/ui";

export function FeaturedProductsSection({ products }: { products: Product[] }) {
  const [quickView, setQuickView] = useState<Product | null>(null);

  const featuredProducts = useMemo(() => {
    const preferred = products.filter(
      (p) => p.badge === "Nuevo" || p.badge === "Limited"
    );

    if (preferred.length >= 5) return preferred.slice(0, 5);

    const preferredIds = new Set(preferred.map((p) => p.id));
    const rest = products.filter((p) => !preferredIds.has(p.id));

    return [...preferred, ...rest].slice(0, 5);
  }, [products]);

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12 md:mb-16">
          <div>
            <p className="text-sm font-normal text-muted-foreground mb-3">
              Selección
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal text-foreground">
              Productos destacados
            </h2>
          </div>
          <a
            href="/catalog"
            className="self-start md:self-auto text-sm font-normal text-foreground/70 hover:text-foreground transition-colors underline underline-offset-4"
          >
            Ver todo
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 auto-rows-[200px] md:auto-rows-[320px]">
          {featuredProducts.map((product, index) => {
            const isLarge = index === 0;
            const isWide = index === 3;

            return (
              <ProductHeroCard
                key={product.id}
                title={product.name}
                price={formatCOP(product.price)}
                tag={product.category}
                imageUrl={product.image}
                href={`/products/${product.id}`}
                colSpan={isLarge || isWide ? 2 : 1}
                rowSpan={isLarge ? 2 : 1}
                wishlist={{
                  productId: product.id,
                  title: product.name,
                  imageUrl: product.image || "/placeholder.svg",
                  price: product.price,
                }}
                onQuickView={() => setQuickView(product)}
                secondaryImageUrl={product.images?.[1]}
              />
            );
          })}
        </div>
      </div>

      {quickView && (
        <QuickViewModal
          product={quickView}
          onClose={() => setQuickView(null)}
        />
      )}
    </section>
  );
}
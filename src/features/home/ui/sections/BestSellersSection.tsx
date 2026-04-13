"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@heroui/react";

import type { Product } from "@/src/features/products";
import { QuickViewModal } from "@/src/features/products";
import { ProductTileCard, formatCOP } from "@/src/shared/presentation/ui";

export function BestSellersSection({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [quickView, setQuickView] = useState<Product | null>(null);

  const bestSellers = useMemo(() => {
    const preferred = products.filter((p) => p.badge === "Limited" || p.badge === "Nuevo");
    if (preferred.length >= 10) return preferred.slice(0, 10);

    const preferredIds = new Set(preferred.map((p) => p.id));
    const rest = products.filter((p) => !preferredIds.has(p.id));
    return [...preferred, ...rest].slice(0, 10);
  }, [products]);

  function scroll(direction: "left" | "right") {
    const container = scrollRef.current;
    if (!container) return;
    const delta = direction === "left" ? -360 : 360;
    container.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <section className="py-24 md:py-32">
      <div className="mb-12 flex flex-col gap-4 md:mb-16 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-sm font-normal  text-muted-foreground ">
            Los más elegidos
          </p>
          <h2 className="text-3xl font-normal  text-foreground md:text-4xl lg:text-5xl">
            Best Sellers
          </h2>
        </div>

        <div className="flex gap-2">
          <Button
            isIconOnly
            radius="full"
            size="lg"
            onPress={() => scroll("left")}
            aria-label="Anterior"
            isDisabled={bestSellers.length === 0}
            className="bg-zinc-100 text-black h-12 w-12"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            isIconOnly
            radius="full"
            size="lg"
            onPress={() => scroll("right")}
            aria-label="Siguiente"
            isDisabled={bestSellers.length === 0}
            className="bg-zinc-100 text-black h-12 w-12"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-4 overflow-x-auto pb-4 sm:gap-6"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {bestSellers.map((product) => (
          <div key={product.id} className="w-70 shrink-0 md:w-[320px]">
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
              onQuickView={() => setQuickView(product)}
              secondaryImageUrl={product.images?.[1]}
            />
          </div>
        ))}
      </div>

      {quickView && (
        <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
      )}
    </section>
  );
}

import type { Product } from "../../types";
import { Button } from "@heroui/react";
import { ProductTileCard, formatCOP } from "@/src/shared/presentation/ui";

type SearchMode = "exact" | "related" | "none";

export function CatalogProductsSection({
  isLoading,
  error,
  onRetry,
  products,
  gridCols,
  onQuickView,
  onClearFilters,
  searchQuery,
  searchMode,
}: {
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  products: Product[];
  gridCols: 2 | 3;
  onQuickView: (product: Product) => void;
  onClearFilters: () => void;
  searchQuery?: string;
  searchMode?: SearchMode;
}) {
  if (isLoading) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-normal text-muted-foreground mb-4">Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-normal text-muted-foreground mb-4">Error cargando productos</p>
        <p className="text-sm font-normal text-muted-foreground/80 mb-6">{error}</p>
        <Button
          onPress={onRetry}
          size="lg"
          radius="full"
          className="bg-black text-white w-full"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-normal text-muted-foreground mb-4">No se encontraron productos</p>
        <Button
          onPress={onClearFilters}
          size="lg"
          radius="full"
          className="bg-zinc-100 text-black w-full"
        >
          Limpiar filtros
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchMode === "related" && (searchQuery?.trim() ?? "") !== "" && (
        <div className=" border border-border bg-muted/30 px-4 py-3 text-sm text-foreground/80">
          No encontramos coincidencias exactas para <span className="font-medium">“{searchQuery}”</span>. Mostrando resultados relacionados.
        </div>
      )}

      <div
        className={`grid gap-4 md:gap-6 ${gridCols === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"
          }`}
      >
        {products.map((product, index) => (
          <ProductTileCard
            key={`${product.id}-${index}`}
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
            onQuickView={() => onQuickView(product)}
            secondaryImageUrl={product.images?.[1]}
          />
        ))}
      </div>
    </div>
  );
}

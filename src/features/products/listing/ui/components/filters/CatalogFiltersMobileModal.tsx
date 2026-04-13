import { X } from "lucide-react";
import { Button, Input } from "@heroui/react";

export function CatalogFiltersMobileModal({
  isOpen,
  onClose,
  hasActiveFilters,
  onClearFilters,
  categories,
  selectedCategory,
  onSelectCategory,
  subcategories,
  selectedSubcategory,
  onSelectSubcategory,
  colors,
  selectedColors,
  onToggleColor,
  minPrice,
  maxPrice,
  priceRange,
  onPriceRangeChange,
  productCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  categories: readonly string[];
  selectedCategory: string;
  onSelectCategory: (value: string) => void;
  subcategories: readonly string[];
  selectedSubcategory: string;
  onSelectSubcategory: (value: string) => void;
  colors: readonly string[];
  selectedColors: Set<string>;
  onToggleColor: (color: string) => void;
  minPrice: number;
  maxPrice: number;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  productCount: number;
}) {
  if (!isOpen) return null;

  const clampRange = (next: [number, number]) => {
    const lo = Math.max(minPrice, Math.min(next[0], next[1]));
    const hi = Math.min(maxPrice, Math.max(next[0], next[1]));
    return [lo, hi] as [number, number];
  };

  return (
    <div className="md:hidden fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm">
      <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-4xl max-h-[80vh] overflow-auto">
        <div className="sticky top-0 bg-background p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-normal text-foreground">Filtros</h3>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onClose}
            aria-label="Cerrar filtros"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <p className="text-sm font-normal text-foreground mb-3">Categoría</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  onPress={() => onSelectCategory(cat)}
                  size="lg"
                  radius="full"
                  className={selectedCategory === cat ? "bg-black text-white" : "bg-zinc-100 text-black"}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-normal text-foreground mb-3">Tipo de prenda</p>
            <div className="flex flex-wrap gap-2">
              {subcategories.map((sub) => (
                <Button
                  key={sub}
                  onPress={() => onSelectSubcategory(sub)}
                  size="lg"
                  radius="full"
                  className={selectedSubcategory === sub ? "bg-black text-white" : "bg-zinc-100 text-black"}
                >
                  {sub}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-normal text-foreground mb-3">Precio</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Input
                type="number"
                size="sm"
                radius="full"
                value={String(priceRange[0])}
                onChange={(e) =>
                  onPriceRangeChange(clampRange([Number(e.target.value), priceRange[1]]))
                }
                min={minPrice}
                max={maxPrice}
                className="bg-muted/50 border-0"
                placeholder="Min"
              />
              <Input
                type="number"
                size="sm"
                radius="full"
                value={String(priceRange[1])}
                onChange={(e) =>
                  onPriceRangeChange(clampRange([priceRange[0], Number(e.target.value)]))
                }
                min={minPrice}
                max={maxPrice}
                className="bg-muted/50 border-0"
                placeholder="Max"
              />
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min={minPrice}
                max={maxPrice}
                value={priceRange[0]}
                onChange={(e) =>
                  onPriceRangeChange(clampRange([Number(e.target.value), priceRange[1]]))
                }
                className="w-full accent-foreground"
                aria-label="Precio mínimo"
              />
              <input
                type="range"
                min={minPrice}
                max={maxPrice}
                value={priceRange[1]}
                onChange={(e) =>
                  onPriceRangeChange(clampRange([priceRange[0], Number(e.target.value)]))
                }
                className="w-full accent-foreground"
                aria-label="Precio máximo"
              />
            </div>
            <p className="mt-2 text-xs text-foreground/50">
              {priceRange[0]} – {priceRange[1]}
            </p>
          </div>

          <div>
            <p className="text-sm font-normal text-foreground mb-3">Color</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => {
                const active = selectedColors.has(c.toUpperCase());
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onToggleColor(c)}
                    aria-pressed={active}
                    className={`h-10 w-10 rounded-full border transition-colors ${
                      active ? "border-foreground" : "border-border"
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-background p-4 border-t border-border flex gap-3">
          {hasActiveFilters && (
            <Button
              onPress={onClearFilters}
              size="lg"
              radius="full"
              className="bg-zinc-100 text-black flex-1"
            >
              Limpiar
            </Button>
          )}
          <Button
            onPress={onClose}
            size="lg"
            radius="full"
            className="bg-black text-white flex-1"
          >
            Ver {productCount} productos
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button, Input } from "@heroui/react";
import type { HeaderCategoryNode } from "@/src/lib/supabase/ssr";
import { formatCOP } from "@/src/shared/presentation/ui";

export function CatalogFiltersSidebar({
  hasActiveFilters,
  onClearFilters,
  categories,
  categoryTree,
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
  expandedFilter,
  onSetExpandedFilter,
}: {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  categories: readonly string[];
  categoryTree: HeaderCategoryNode[];
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
  expandedFilter: string | null;
  onSetExpandedFilter: (value: string | null) => void;
}) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const minPriceDisplay = Math.round(minPrice / 100);
  const maxPriceDisplay = Math.round(maxPrice / 100);
  const rangeMinDisplay = Math.round(priceRange[0] / 100);
  const rangeMaxDisplay = Math.round(priceRange[1] / 100);

  // Auto-expand selected category
  useEffect(() => {
    if (selectedCategory && selectedCategory !== "Todos") {
      setExpandedNodes(prev => {
        const next = new Set(prev);
        next.add(selectedCategory);
        return next;
      });
    }
  }, [selectedCategory]);

  const toggleNode = (name: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const clampRange = (next: [number, number]) => {
    // ... existing clampRange
    const lo = Math.max(minPrice, Math.min(next[0], next[1]));
    const hi = Math.min(maxPrice, Math.max(next[0], next[1]));
    return [lo, hi] as [number, number];
  };

  return (
    <aside className="hidden md:block w-64 shrink-0">
      <div className="sticky top-40 space-y-6">
        <div className="border-b border-border pb-6">
          {/* ... Categoría Button ... */}
          {expandedFilter === "categoria" && (
            <div className="space-y-4 pt-2">
              <Button
                variant="light"
                onPress={() => onSelectCategory("Todos")}
              // ...
              >
                Ver Todo
              </Button>

              {categoryTree.map((node) => {
                const isSelected = selectedCategory === node.name;
                const isExpanded = expandedNodes.has(node.name);
                const hasChildren = node.children.length > 0;

                return (
                  <div key={node.id} className="space-y-1">
                    <div className="flex items-center gap-1 group">
                      {hasChildren ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNode(node.name);
                          }}
                          className="p-1 text-gray-400 hover:text-black transition-colors"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : "-rotate-90"}`}
                          />
                        </button>
                      ) : <div className="w-6" />}

                      <Button
                        onPress={() => {
                          onSelectCategory(node.name);
                          if (!isExpanded) toggleNode(node.name);
                        }}
                        variant="light"
                        size="sm"
                        className={`flex-1 justify-start font-medium -ml-1 ${isSelected ? "text-black" : "text-gray-500"
                          }`}
                      >
                        {node.name}
                      </Button>
                    </div>

                    {hasChildren && isExpanded && (
                      <div className="pl-7 space-y-1 border-l border-gray-100 ml-3">
                        {node.children.map(child => (
                          <Button
                            key={child.id}
                            onPress={() => {
                              if (selectedCategory !== node.name) onSelectCategory(node.name);
                              onSelectSubcategory(child.name);
                            }}
                            variant="light"
                            size="sm"
                            className={`w-full justify-start h-8 text-xs ${selectedSubcategory === child.name
                              ? "text-black font-medium"
                              : "text-gray-400 font-normal"
                              }`}
                          >
                            {child.name}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {/* ... rest of rendering */}

        <div className="border-b border-border pb-6">
          <Button
            onPress={() =>
              onSetExpandedFilter(expandedFilter === "precio" ? null : "precio")
            }
            variant="light"
            size="sm"
            className="w-full justify-between text-foreground"
            endContent={
              <ChevronDown
                className={`w-4 h-4 transition-transform ${expandedFilter === "precio" ? "rotate-180" : ""
                  }`}
              />
            }
          >
            Precio
          </Button>

          {expandedFilter === "precio" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  size="sm"
                  radius="full"
                  labelPlacement="outside"
                  value={String(rangeMinDisplay)}
                  onChange={(e) =>
                    onPriceRangeChange(clampRange([Number(e.target.value) * 100, priceRange[1]]))
                  }
                  min={minPriceDisplay}
                  max={maxPriceDisplay}
                  className="bg-muted/50 border-0"
                  placeholder="Min"
                />
                <Input
                  type="number"
                  size="sm"
                  radius="full"
                  labelPlacement="outside"
                  value={String(rangeMaxDisplay)}
                  onChange={(e) =>
                    onPriceRangeChange(clampRange([priceRange[0], Number(e.target.value) * 100]))
                  }
                  min={minPriceDisplay}
                  max={maxPriceDisplay}
                  className="bg-muted/50 border-0"
                  placeholder="Max"
                />
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min={minPriceDisplay}
                  max={maxPriceDisplay}
                  value={rangeMinDisplay}
                  onChange={(e) =>
                    onPriceRangeChange(clampRange([Number(e.target.value) * 100, priceRange[1]]))
                  }
                  className="w-full accent-foreground"
                  aria-label="Precio mínimo"
                />
                <input
                  type="range"
                  min={minPriceDisplay}
                  max={maxPriceDisplay}
                  value={rangeMaxDisplay}
                  onChange={(e) =>
                    onPriceRangeChange(clampRange([priceRange[0], Number(e.target.value) * 100]))
                  }
                  className="w-full accent-foreground"
                  aria-label="Precio máximo"
                />
              </div>

              <p className="text-xs text-foreground/50">
                {formatCOP(priceRange[0])} – {formatCOP(priceRange[1])}
              </p>
            </div>
          )}
        </div>

        <div className="border-b border-border pb-6">
          <Button
            onPress={() =>
              onSetExpandedFilter(expandedFilter === "color" ? null : "color")
            }
            variant="light"
            size="sm"
            className="w-full justify-between text-foreground"
            endContent={
              <ChevronDown
                className={`w-4 h-4 transition-transform ${expandedFilter === "color" ? "rotate-180" : ""
                  }`}
              />
            }
          >
            Color
          </Button>

          {expandedFilter === "color" && (
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => {
                const active = selectedColors.has(c.toUpperCase());
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onToggleColor(c)}
                    aria-pressed={active}
                    className={`h-9 w-9 rounded-full border transition-colors ${active ? "border-foreground" : "border-border"
                      }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="border-b border-border pb-6">
          <Button
            onPress={() =>
              onSetExpandedFilter(expandedFilter === "tipo" ? null : "tipo")
            }
            variant="light"
            size="sm"
            className="w-full justify-between text-foreground"
            endContent={
              <ChevronDown
                className={`w-4 h-4 transition-transform ${expandedFilter === "tipo" ? "rotate-180" : ""
                  }`}
              />
            }
          >
            Tipo de prenda
          </Button>
          {expandedFilter === "tipo" && (
            <div className="space-y-2">
              {subcategories.map((sub) => (
                <Button
                  key={sub}
                  onPress={() => onSelectSubcategory(sub)}
                  variant="light"
                  size="sm"
                  className={`w-full justify-start ${selectedSubcategory === sub
                    ? "text-foreground"
                    : "text-foreground/50"
                    }`}
                >
                  {sub}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

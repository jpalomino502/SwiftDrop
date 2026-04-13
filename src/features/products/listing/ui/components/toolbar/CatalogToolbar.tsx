"use client";

import { Grid3X3, LayoutGrid, Search, SlidersHorizontal } from "lucide-react";
import type { SortOption } from "../../types";
import { Button, Input } from "@heroui/react";
import { useState } from "react";

const sortOptions: Array<{ key: SortOption; label: string }> = [
  { key: "relevancia", label: "Relevancia" },
  { key: "novedades", label: "Novedades" },
  { key: "precio-asc", label: "Precio: menor" },
  { key: "precio-desc", label: "Precio: mayor" },
];

export function CatalogToolbar({
  isFilterOpen,
  onToggleFilter,
  hasActiveFilters,
  activeFiltersCount,
  isLoadingProducts,
  productCount,
  query,
  onQueryChange,
  sortBy,
  onSortChange,
  gridCols,
  onGridColsChange,
}: {
  isFilterOpen: boolean;
  onToggleFilter: () => void;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
  isLoadingProducts: boolean;
  productCount: number;
  query: string;
  onQueryChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  gridCols: 2 | 3;
  onGridColsChange: (value: 2 | 3) => void;
}) {
  const [isSortActive, setIsSortActive] = useState(false);

  return (
    <section
      id="catalog-toolbar"
      className="sticky top-15 z-40 bg-background border-b border-default-200 scroll-mt-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="flex items-center justify-between gap-3 md:flex-1">
            <Button
              onPress={onToggleFilter}
              variant="light"
              size="sm"
              className="flex md:hidden gap-2 text-foreground/70"
              aria-expanded={isFilterOpen}
              startContent={<SlidersHorizontal className="w-4 h-4" />}
            >
              Filtros
              {hasActiveFilters && (
                <span className="ml-1 w-5 h-5 bg-foreground text-background text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            {/* 
            <p className="hidden md:block text-sm font-normal text-muted-foreground">
              {isLoadingProducts ? "Cargando productos..." : `${productCount} productos`}
            </p> */}

            <div className="hidden md:block w-90">
              <Input
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                radius="full"
                size="sm"
                className="bg-muted/50 border-0"
                startContent={<Search size={16} strokeWidth={1} className="text-foreground/50" />}
                placeholder="Buscar en el catálogo"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 md:justify-end md:gap-4">
            <div className="md:hidden flex-1">
              <Input
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                radius="full"
                size="sm"
                className="bg-muted/50 border-0"
                startContent={<Search size={16} strokeWidth={1} className="text-foreground/50" />}
                placeholder="Buscar"
              />
            </div>
            <div className="hidden md:flex items-center gap-1 border-l border-border pl-4">
              <Button
                isIconOnly
                size="lg"
                className={gridCols === 2 ? "bg-black text-white" : "bg-zinc-100 text-black"}
                onPress={() => onGridColsChange(2)}
                aria-label="Grid 2 columnas"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                isIconOnly
                size="lg"
                className={gridCols === 3 ? "bg-black text-white" : "bg-zinc-100 text-black"}
                onPress={() => onGridColsChange(3)}
                aria-label="Grid 3 columnas"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

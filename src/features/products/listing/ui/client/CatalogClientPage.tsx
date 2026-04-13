"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Product, SortOption } from "../types";
import { QuickViewModal } from "@/src/features/products";
import { CatalogToolbar } from "../components/toolbar/CatalogToolbar";
import { CatalogFiltersSidebar } from "../components/filters/CatalogFiltersSidebar";
import { CatalogFiltersMobileModal } from "../components/filters/CatalogFiltersMobileModal";
import { CatalogProductsSection } from "../components/products/CatalogProductsSection";
import { smartSearchProducts } from "../lib/smartSearch";
import type { HeaderCategoryNode } from "@/src/lib/supabase/ssr";

export function CatalogClientPage({
  initialProducts,
  productsError,
  categoryTree,
}: {
  initialProducts: Product[];
  productsError: string | null;
  categoryTree: HeaderCategoryNode[];
}) {
  const PAGE_SIZE = 24;

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length === PAGE_SIZE);
  const isLoadingProducts = false;
  const retry = () => { };
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadPage = useCallback(
    async (offset: number) => {
      setIsLoadingMore(true);
      try {
        const qs = new URLSearchParams(searchParamsString);
        qs.set("limit", String(PAGE_SIZE));
        qs.set("offset", String(offset));
        const res = await fetch(`/api/products?${qs.toString()}`);
        const payload = await res.json();
        const next: Product[] = payload.products ?? [];
        return next;
      } finally {
        setIsLoadingMore(false);
      }
    },
    [searchParamsString],
  );

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const next = await loadPage(products.length);
      setProducts((p) => [...p, ...next]);
      if (next.length < PAGE_SIZE) setHasMore(false);
    } catch (e) {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, loadPage, products.length]);

  // Reset / refetch when search params (filters) change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoadingMore(true);
      try {
        const next = await loadPage(0);
        if (cancelled) return;
        setProducts(next);
        setHasMore(next.length === PAGE_SIZE);
      } catch (e) {
        setProducts([]);
        setHasMore(false);
      } finally {
        if (!cancelled) setIsLoadingMore(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParamsString, loadPage]);

  // Infinite scroll using IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    if (!hasMore) return;
    const node = sentinelRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void loadMore();
          }
        }
      },
      { root: null, rootMargin: "300px", threshold: 0.1 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [loadMore, hasMore]);

  const params = useMemo(() => new URLSearchParams(searchParamsString), [searchParamsString]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [gridCols, setGridCols] = useState<2 | 3>(3);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [expandedFilter, setExpandedFilter] = useState<string | null>("categoria");

  const allColors = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      for (const c of p.colors || []) set.add(c.toUpperCase());
    }
    return Array.from(set).slice(0, 14);
  }, [products]);

  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 };
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const p of products) {
      min = Math.min(min, p.price);
      max = Math.max(max, p.price);
    }
    return { min: Math.floor(min), max: Math.ceil(max) };
  }, [products]);

  const replaceParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParamsString);
      for (const [key, value] of Object.entries(updates)) {
        const v = value?.trim();
        if (!v) next.delete(key);
        else next.set(key, v);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParamsString],
  );

  const query = params.get("q") ?? "";
  const [searchInputValue, setSearchInputValue] = useState(query);

  // Sync local state with URL query (for back/forward navigation)
  useEffect(() => {
    setSearchInputValue(query);
  }, [query]);

  // Debounce URL update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputValue !== query) {
        replaceParams({ q: searchInputValue || null });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInputValue, query, replaceParams]);

  const catParam = params.get("cat") ?? "Todos";
  const subParam = params.get("sub") ?? "Todos";
  const sortBy = (params.get("sort") ?? "relevancia") as SortOption;
  const colorsRaw = params.get("colors") ?? "";
  const minParam = params.get("min");
  const maxParam = params.get("max");
  const minRaw = minParam == null || minParam.trim() === "" ? Number.NaN : Number(minParam);
  const maxRaw = maxParam == null || maxParam.trim() === "" ? Number.NaN : Number(maxParam);

  const categoryOptions = useMemo(() => {
    const names = categoryTree.map((c) => c.name).filter(Boolean);
    return ["Todos", ...names];
  }, [categoryTree]);

  const selectedCategory = categoryOptions.includes(catParam) ? catParam : "Todos";

  const subcategoryOptions = useMemo(() => {
    if (selectedCategory === "Todos") {
      const set = new Set<string>();
      for (const root of categoryTree) {
        for (const child of root.children) set.add(child.name);
      }
      return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
    }

    const root = categoryTree.find((c) => c.name === selectedCategory);
    const subs = root?.children.map((c) => c.name) ?? [];
    return ["Todos", ...subs];
  }, [categoryTree, selectedCategory]);

  const selectedSubcategory = subcategoryOptions.includes(subParam) ? subParam : "Todos";

  const selectedColors = useMemo(() => {
    return new Set(
      colorsRaw
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => (c.startsWith("#") ? c : `#${c}`).toUpperCase()),
    );
  }, [colorsRaw]);

  const priceRange = useMemo((): [number, number] => {
    const min = Number.isFinite(minRaw) ? minRaw : priceBounds.min;
    const max = Number.isFinite(maxRaw) ? maxRaw : priceBounds.max;
    const lo = Math.max(priceBounds.min, Math.min(min, max));
    const hi = Math.min(priceBounds.max, Math.max(min, max));
    return [lo, hi];
  }, [maxRaw, minRaw, priceBounds.max, priceBounds.min]);

  const filteredAndSortedProducts = useMemo(() => {
    const searched = smartSearchProducts(products, query);
    let filtered = searched.products;

    if (selectedCategory !== "Todos") {
      filtered = filtered.filter((p) =>
        p.category === selectedCategory ||
        (p.allCategories && p.allCategories.includes(selectedCategory))
      );
    }

    if (selectedSubcategory !== "Todos") {
      filtered = filtered.filter((p) =>
        p.subcategory === selectedSubcategory ||
        (p.allSubcategories && p.allSubcategories.includes(selectedSubcategory))
      );
    }

    if (selectedColors.size > 0) {
      filtered = filtered.filter((p) => p.colors?.some((c) => selectedColors.has(c.toUpperCase())));
    }

    filtered = filtered.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sortBy) {
      case "precio-asc":
        return { products: [...filtered].sort((a, b) => a.price - b.price), searchMode: searched.mode };
      case "precio-desc":
        return { products: [...filtered].sort((a, b) => b.price - a.price), searchMode: searched.mode };
      case "novedades":
        return {
          products: [...filtered].sort((a) => (a.badge === "Nuevo" ? -1 : 1)),
          searchMode: searched.mode,
        };
      default:
        return { products: filtered, searchMode: searched.mode };
    }
  }, [products, query, selectedCategory, selectedSubcategory, selectedColors, priceRange, sortBy]);

  const clearFilters = () => {
    replaceParams({ q: null, cat: null, sub: null, colors: null, min: null, max: null, sort: null });
  };

  const hasActiveFilters =
    (query?.trim() ?? "") !== "" ||
    selectedCategory !== "Todos" ||
    selectedSubcategory !== "Todos" ||
    selectedColors.size > 0 ||
    priceRange[0] !== priceBounds.min ||
    priceRange[1] !== priceBounds.max;

  const activeFiltersCount =
    ((query?.trim() ?? "") !== "" ? 1 : 0) +
    (selectedCategory !== "Todos" ? 1 : 0) +
    (selectedSubcategory !== "Todos" ? 1 : 0) +
    (selectedColors.size > 0 ? 1 : 0) +
    (priceRange[0] !== priceBounds.min || priceRange[1] !== priceBounds.max ? 1 : 0);

  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <section id="catalog" className=" pb-8 md:pb-12 scroll-mt-28">
          <p className="text-sm font-normal text-muted-foreground mb-3">Colección</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal text-foreground">
            Catálogo
          </h1>
        </section>
      </div>

      <CatalogToolbar
        isFilterOpen={isFilterOpen}
        onToggleFilter={() => setIsFilterOpen((v) => !v)}
        hasActiveFilters={hasActiveFilters}
        activeFiltersCount={activeFiltersCount}
        isLoadingProducts={isLoadingProducts}
        productCount={filteredAndSortedProducts.products.length}
        query={searchInputValue}
        onQueryChange={setSearchInputValue}
        sortBy={sortBy}
        onSortChange={(value) => replaceParams({ sort: value === "relevancia" ? null : value })}
        gridCols={gridCols}
        onGridColsChange={setGridCols}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <CatalogFiltersSidebar
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            categoryTree={categoryTree}
            categories={categoryOptions}
            selectedCategory={selectedCategory}
            onSelectCategory={(value) =>
              replaceParams({
                cat: value === "Todos" ? null : value,
                sub: null,
              })
            }
            subcategories={subcategoryOptions}
            selectedSubcategory={selectedSubcategory}
            onSelectSubcategory={(value) => replaceParams({ sub: value === "Todos" ? null : value })}
            colors={allColors}
            selectedColors={selectedColors}
            onToggleColor={(color) => {
              const next = new Set(selectedColors);
              const key = color.toUpperCase();
              if (next.has(key)) next.delete(key);
              else next.add(key);
              replaceParams({
                colors:
                  next.size > 0
                    ? Array.from(next)
                      .map((c) => c.replace(/^#/, ""))
                      .join(",")
                    : null,
              });
            }}
            minPrice={priceBounds.min}
            maxPrice={priceBounds.max}
            priceRange={priceRange}
            onPriceRangeChange={(nextRange) => {
              replaceParams({
                min: nextRange[0] === priceBounds.min ? null : String(nextRange[0]),
                max: nextRange[1] === priceBounds.max ? null : String(nextRange[1]),
              });
            }}
            expandedFilter={expandedFilter}
            onSetExpandedFilter={setExpandedFilter}
          />

          <CatalogFiltersMobileModal
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            categories={categoryOptions}
            selectedCategory={selectedCategory}
            onSelectCategory={(value) =>
              replaceParams({
                cat: value === "Todos" ? null : value,
                sub: null,
              })
            }
            subcategories={subcategoryOptions}
            selectedSubcategory={selectedSubcategory}
            onSelectSubcategory={(value) => replaceParams({ sub: value === "Todos" ? null : value })}
            colors={allColors}
            selectedColors={selectedColors}
            onToggleColor={(color) => {
              const next = new Set(selectedColors);
              const key = color.toUpperCase();
              if (next.has(key)) next.delete(key);
              else next.add(key);
              replaceParams({
                colors:
                  next.size > 0
                    ? Array.from(next)
                      .map((c) => c.replace(/^#/, ""))
                      .join(",")
                    : null,
              });
            }}
            minPrice={priceBounds.min}
            maxPrice={priceBounds.max}
            priceRange={priceRange}
            onPriceRangeChange={(nextRange) => {
              replaceParams({
                min: nextRange[0] === priceBounds.min ? null : String(nextRange[0]),
                max: nextRange[1] === priceBounds.max ? null : String(nextRange[1]),
              });
            }}
            productCount={filteredAndSortedProducts.products.length}
          />

          <div className="flex-1">
            <CatalogProductsSection
              isLoading={isLoadingProducts}
              error={productsError}
              onRetry={retry}
              products={filteredAndSortedProducts.products}
              gridCols={gridCols}
              onQuickView={setQuickView}
              onClearFilters={clearFilters}
              searchQuery={query}
              searchMode={filteredAndSortedProducts.searchMode}
            />

            <div className="mt-6">
              <div ref={sentinelRef} />
              {isLoadingMore && (
                <div className="text-center py-3 text-sm text-muted-foreground">Cargando...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {quickView && (
        <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
      )}
    </div>
  );
}


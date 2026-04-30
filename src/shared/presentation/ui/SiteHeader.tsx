"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Accordion, AccordionItem, Avatar, Button, Input } from "@heroui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, Search, ShoppingBag, Heart, X } from "lucide-react";

import { AuthModal } from "@/src/features/auth";
import { useWishlist } from "@/src/features/wishlist";
import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";
import type { HeaderCategoryNode, ServerUserSnapshot } from "@/src/lib/supabase/ssr";

type SiteHeaderProps = {
  brandName?: string;
  cartCount?: number;
  onCartClick?: () => void;
  initialUser?: ServerUserSnapshot | null;
  initialCategories?: HeaderCategoryNode[];
};

type ProductSuggestion = {
  id: string | number;
  name: string;
  price?: number;
  category?: string;
  subcategory?: string;
  image?: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function SiteHeader({
  brandName = "SwiftDrop",
  cartCount = 0,
  onCartClick,
  initialUser = null,
  initialCategories = [],
  className,
}: SiteHeaderProps & { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { totalItems: wishlistCount } = useWishlist();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<ServerUserSnapshot | null>(initialUser);
  const [categories] = useState<HeaderCategoryNode[]>(initialCategories);
  const [scrolled, setScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchHovered, setIsSearchHovered] = useState(false);

  const isHome = pathname === "/";

  const rootRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const goToSearch = (value: string) => {
    const q = value.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const base = params.toString() ? `/catalog?${params.toString()}` : "/catalog";
    router.push(base);
  };

  const goToProduct = (id: string | number) => {
    router.push(`/products/${encodeURIComponent(String(id))}`);
    setIsSuggestionsOpen(false);
    setHighlightIndex(-1);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        setUser(null);
        return;
      }
      const email = data.user.email ?? null;
      const avatar_url =
        typeof (data.user.user_metadata as Record<string, unknown> | null | undefined)?.avatar_url === "string"
          ? ((data.user.user_metadata as Record<string, unknown>).avatar_url as string)
          : undefined;
      setUser({ email, avatar_url });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      const nextUser = next?.user;
      if (!nextUser) {
        setUser(null);
        return;
      }
      const email = nextUser.email ?? null;
      const avatar_url = typeof nextUser.user_metadata?.avatar_url === "string" ? nextUser.user_metadata.avatar_url : undefined;
      setUser({ email, avatar_url });
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const isLoggedIn = !!user?.email;
  const isSearchExpanded = searchValue.length > 0 || isSuggestionsOpen || isSearchHovered || isSearchFocused;

  const activeCategory = searchParams.get("cat");
  const activeSubcategory = searchParams.get("sub");

  const activeRoot = useMemo(() => {
    if (pathname !== "/catalog") return null;
    if (!activeCategory) return null;
    return categories.find((c) => c.name === activeCategory) ?? null;
  }, [activeCategory, categories, pathname]);

  useEffect(() => {
    function onDocumentPointerDown(event: PointerEvent) {
      if (!rootRef.current) return;
      if (event.target instanceof Node && rootRef.current.contains(event.target)) return;
      setIsSuggestionsOpen(false);
      setHighlightIndex(-1);
    }

    document.addEventListener("pointerdown", onDocumentPointerDown);
    return () => document.removeEventListener("pointerdown", onDocumentPointerDown);
  }, []);

  useEffect(() => {
    const query = searchValue.trim();
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    if (!query) {
      abortRef.current?.abort();
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      setIsLoadingSuggestions(false);
      setHighlightIndex(-1);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { products?: ProductSuggestion[] };
        const nextSuggestions = Array.isArray(data.products) ? data.products : [];
        setSuggestions(nextSuggestions);
        setIsSuggestionsOpen(true);
        setHighlightIndex(-1);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSuggestions([]);
        setIsSuggestionsOpen(false);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 180);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [searchValue]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={`sticky z-50 w-full transition-all duration-300 bg-white ${scrolled ? "py-3" : "py-4"} ${className ?? "top-0"}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          
          <Link href="/" className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
            <img src="/logo.png" alt={brandName} width={40} height={40} className="w-10 h-10 object-contain" />
            <span className="text-2xl pt-1 font-(family-name:--font-bebas-neue) transition-colors text-black">{brandName}</span>
          </Link>

          <nav className={`hidden flex-1 items-center justify-center gap-4 lg:gap-6 text-sm font-medium md:flex transition-opacity duration-300 ${isSearchExpanded ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
            <Link
              href="/catalog"
              className={`px-3 py-2 text-md uppercase transition-colors ${pathname === "/catalog" && !activeCategory && !activeSubcategory
                ? "text-black font-bold"
                : "text-gray-600 hover:text-black"
                }`}
            >
              Todo
            </Link>

            {categories.slice(0, 4).map((c) => {
              const href = `/catalog?cat=${encodeURIComponent(c.name)}`;
              const active = pathname === "/catalog" && activeCategory === c.name;
              const hasChildren = c.children.length > 0;

              return (
                <div key={c.id} className="group">
                  <Link
                    href={href}
                    className={`inline-flex items-center px-3 py-2 text-md uppercase text-center transition-colors ${active
                      ? "text-black font-bold"
                      : "text-gray-600 hover:text-black"
                      }`}
                    aria-haspopup={hasChildren ? "menu" : undefined}
                    aria-expanded={hasChildren ? false : undefined}
                  >
                    {c.name}
                  </Link>

                  {hasChildren ? (
                    <div
                      className="invisible absolute left-1/2 top-full z-50 w-screen -translate-x-1/2 -mt-5 pt-5 opacity-0 transition-all duration-300 group-hover:visible group-hover:opacity-100"
                      role="menu"
                    >
                      <div className="border-t border-black/5 bg-white shadow-xl">
                        <div className="mx-auto grid max-w-7xl grid-cols-12 gap-8 px-4 py-8 sm:px-6 lg:px-8">
                          <div className="col-span-3">
                            <h3 className="mb-4 text-lg font-bold text-black">{c.name}</h3>
                            <Link
                              href={href}
                              className="mb-2 block text-sm font-medium text-gray-900 underline decoration-gray-400 underline-offset-4 hover:text-black hover:decoration-black"
                            >
                              Ver todo
                            </Link>
                          </div>

                          <div className="col-span-9 grid grid-cols-3 gap-8 border-l border-gray-100 pl-8">
                            {["Destacados", "Novedades", "Colecciones"].map((title, i) => {
                              const items = c.children.filter((_, idx) => idx % 3 === i);
                              if (items.length === 0) return null;
                              return (
                                <div key={i} className="flex flex-col gap-3">
                                  <h4 className="text-xs font-semibold uppercase  text-gray-500">
                                    {title}
                                  </h4>
                                  <div className="flex flex-col gap-2">
                                    {items.map((sub) => (
                                      <Link
                                        key={sub.id}
                                        href={`/catalog?cat=${encodeURIComponent(c.name)}&sub=${encodeURIComponent(sub.name)}`}
                                        className="text-sm text-gray-600 hover:text-black hover:underline hover:underline-offset-4"
                                      >
                                        {sub.name}
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div className="hidden sm:block">
              <div
                className="relative group"
                ref={rootRef}
                onMouseEnter={() => setIsSearchHovered(true)}
                onMouseLeave={() => setIsSearchHovered(false)}
              >
                <div className={`transition-all duration-300 ease-in-out ${isSearchExpanded ? "w-64" : "w-10"} overflow-hidden`}>
                  <Input
                    radius="full"
                    size="sm"
                    classNames={{
                      base: "w-full",
                      inputWrapper: "pl-10 h-10 transition-colors bg-gray-100 hover:bg-gray-200 text-black placeholder:text-gray-500",
                      input: "text-black",
                    }}
                    startContent={
                      <Search size={18} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    }
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onFocus={() => {
                      setIsSearchFocused(true);
                      if (suggestions.length > 0) setIsSuggestionsOpen(true);
                    }}
                    onBlur={() => setIsSearchFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        if (!isSuggestionsOpen) {
                          setIsSuggestionsOpen(true);
                        }
                        setHighlightIndex((idx) => {
                          const max = suggestions.length - 1;
                          if (max < 0) return -1;
                          return Math.min(max, idx + 1);
                        });
                        e.preventDefault();
                        return;
                      }
                      if (e.key === "ArrowUp") {
                        setHighlightIndex((idx) => Math.max(-1, idx - 1));
                        e.preventDefault();
                        return;
                      }
                      if (e.key === "Enter") {
                        if (highlightIndex >= 0 && suggestions[highlightIndex]) {
                          goToProduct(suggestions[highlightIndex].id);
                          return;
                        }
                        goToSearch(searchValue);
                      }
                      if (e.key === "Escape") {
                        setSearchValue("");
                        setIsSuggestionsOpen(false);
                        setHighlightIndex(-1);
                      }
                    }}
                    placeholder="Buscar..."
                  />
                </div>

                {isSuggestionsOpen && (isLoadingSuggestions || suggestions.length > 0) && (
                  <div className="absolute right-0 top-full z-60 mt-3 w-80 md:w-96 overflow-hidden  border border-gray-100 bg-white shadow-2xl ring-1 ring-black/5">
                    <div className="flex items-center justify-between px-4 py-3 text-[10px] font-bold uppercase  text-gray-400 bg-gray-50/50">
                      <span>{isLoadingSuggestions ? "Buscando..." : "Sugerencias"}</span>
                    </div>

                    <ul className="max-h-[60vh] overflow-auto py-1">
                      {suggestions.map((p, idx) => {
                        const active = idx === highlightIndex;
                        return (
                          <li key={p.id}>
                            <button
                              type="button"
                              className={`flex w-full items-center gap-4 px-4 py-3 text-left transition-colors ${active ? "bg-gray-50" : "hover:bg-gray-50"
                                }`}
                              onMouseEnter={() => setHighlightIndex(idx)}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => goToProduct(p.id)}
                            >
                              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                                {p.image && (
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    width={56}
                                    height={56}
                                    className="absolute inset-0 h-full w-full object-contain bg-white"
                                    loading="lazy"
                                  />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium text-gray-900">{p.name}</div>
                                <div className="truncate text-xs text-gray-500">
                                  {[p.category, p.subcategory].filter(Boolean).join(" · ")}
                                </div>
                                {typeof p.price === "number" && (
                                  <div className="mt-1 text-sm font-semibold text-black">
                                    {formatCurrency(p.price)}
                                  </div>
                                )}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="border-t border-gray-100 bg-gray-50 p-3">
                      <button
                        type="button"
                        className="flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition-transform active:scale-95"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => goToSearch(searchValue)}
                      >
                        Ver todos los resultados
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              as={Link}
              href="/wishlist"
              isIconOnly
              radius="full"
              size="sm"
              className="relative border-0 overflow-visible transition-colors bg-gray-100 text-black hover:bg-gray-200"
              aria-label="Favoritos"
            >
              <Heart size={18} strokeWidth={1} />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-5 h-5 rounded-full bg-red-600 text-white text-[10px] leading-5 text-center">
                  {wishlistCount}
                </span>
              )}
            </Button>

            {onCartClick ? (
              <Button
                isIconOnly
                radius="full"
                size="sm"
                onPress={onCartClick}
                className="relative border-0 overflow-visible transition-colors bg-gray-100 text-black hover:bg-gray-200"
              >
                <ShoppingBag size={18} strokeWidth={1} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-5 h-5 rounded-full bg-red-600 text-white text-[10px] leading-5 text-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            ) : (
              <Button
                as={Link}
                href="/cart"
                isIconOnly
                radius="full"
                size="sm"
                className="relative border-0 overflow-visible transition-colors bg-gray-100 text-black hover:bg-gray-200"
              >
                <ShoppingBag size={18} strokeWidth={1} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-5 h-5 rounded-full bg-red-600 text-white text-[10px] leading-5 text-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            )}

            {!isLoggedIn ? (
              <Button
                radius="full"
                size="sm"
                onPress={() => setAuthModalOpen(true)}
                className="hidden sm:inline-flex bg-black text-white font-semibold hover:bg-gray-800"
              >
                Iniciar sesión
              </Button>
            ) : (
              <Link href="/profile" className="hidden sm:block">
                <Avatar
                  size="sm"
                  name={user?.email ?? "Cuenta"}
                  src={typeof user?.avatar_url === "string" ? user.avatar_url : undefined}
                />
              </Link>
            )}

            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-black"
            >
              <Menu size={22} strokeWidth={1} />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-60 bg-white overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header del menú mobile */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <span className="text-lg font-bold text-black">Menú</span>
              <button
                aria-label="Cerrar menú"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            {/* Contenido del menú */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex w-full flex-col gap-0 px-0">
                <Link
                  href="/catalog"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-base font-semibold border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  Todo
                </Link>

                <Accordion
                  selectionMode="single"
                  className="w-full px-0"
                  itemClasses={{
                    title: "px-4 py-3 text-base font-semibold hover:bg-gray-50",
                    trigger: "justify-start data-[open=true]:bg-gray-50",
                    content: "flex flex-col gap-0 pb-0 px-0",
                    base: "border-b border-gray-100"
                  }}
                >
                  {categories.slice(0, 10).map((c) => (
                    <AccordionItem key={c.id} aria-label={c.name} title={c.name}>
                      <Link
                        href={`/catalog?cat=${encodeURIComponent(c.name)}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-6 py-2 text-sm font-medium text-black bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        Ver todo
                      </Link>
                      {c.children.slice(0, 12).map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/catalog?cat=${encodeURIComponent(c.name)}&sub=${encodeURIComponent(sub.name)}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-8 py-2 text-sm text-gray-700 hover:text-black hover:bg-gray-100 transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>

            {/* Footer del menú */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              {!isLoggedIn ? (
                <Button
                  fullWidth
                  onClick={() => {
                    setAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="bg-black text-white font-semibold hover:bg-gray-800 rounded-lg h-10"
                >
                  Iniciar sesión
                </Button>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Avatar
                    size="md"
                    name={user?.email ?? "Cuenta"}
                    src={typeof user?.avatar_url === "string" ? user.avatar_url : undefined}
                  />
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-black hover:underline">
                    Mi cuenta
                  </Link>
                  <button
                    onClick={async () => {
                      const supabase = getSupabaseBrowserClient();
                      await supabase?.auth.signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
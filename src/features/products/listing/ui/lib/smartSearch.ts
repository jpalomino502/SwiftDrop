import Fuse from "fuse.js";

import type { Product } from "../types";

const SYNONYMS: Record<string, string[]> = {
  remera: ["camiseta"],
  playera: ["camiseta"],
  camiseta: ["remera"],
  buzo: ["hoodie", "sudadera"],
  hoodie: ["buzo", "sudadera"],
  sudadera: ["buzo", "hoodie"],
  pantalon: ["pantalon", "pantalón"],
  zapato: ["zapatos", "zapatilla", "zapatillas"],
  zapatos: ["zapato", "zapatilla", "zapatillas"],
  zapatilla: ["zapatillas", "zapato", "zapatos"],
  zapatillas: ["zapatilla", "zapato", "zapatos"],
};

type SearchDoc = {
  product: Product;
  name: string;
  category: string;
  subcategory: string;
};

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandQueryVariants(query: string): string[] {
  const q = normalize(query);
  if (!q) return [];

  const tokens = q.split(" ").filter(Boolean);
  const variants = new Set<string>([q]);

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const syns = SYNONYMS[t];
    if (!syns || syns.length === 0) continue;

    for (const syn of syns) {
      const replacement = [...tokens];
      replacement[i] = normalize(syn);
      variants.add(replacement.join(" "));
    }
  }

  return Array.from(variants).filter(Boolean);
}

function trigrams(input: string): string[] {
  const s = normalize(input).replace(/\s+/g, " ");
  if (s.length <= 3) return [s];
  const grams: string[] = [];
  for (let i = 0; i <= s.length - 3; i++) grams.push(s.slice(i, i + 3));
  return grams;
}

function diceCoefficient(a: string, b: string): number {
  const aGrams = trigrams(a);
  const bGrams = trigrams(b);
  if (aGrams.length === 0 || bGrams.length === 0) return 0;

  const bCounts = new Map<string, number>();
  for (const g of bGrams) bCounts.set(g, (bCounts.get(g) ?? 0) + 1);

  let intersection = 0;
  for (const g of aGrams) {
    const c = bCounts.get(g) ?? 0;
    if (c > 0) {
      intersection++;
      bCounts.set(g, c - 1);
    }
  }

  return (2 * intersection) / (aGrams.length + bGrams.length);
}

function buildIndex(products: Product[], threshold: number): Fuse<SearchDoc> {
  const docs: SearchDoc[] = products.map((product) => ({
    product,
    name: normalize(product.name),
    category: normalize(product.category),
    subcategory: normalize(product.subcategory),
  }));

  return new Fuse(docs, {
    includeScore: true,
    threshold,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
      { name: "name", weight: 0.75 },
      { name: "subcategory", weight: 0.2 },
      { name: "category", weight: 0.05 },
    ],
  });
}

export type SmartSearchResult = {
  products: Product[];
  mode: "exact" | "related" | "none";
};

export function smartSearchProducts(products: Product[], query: string): SmartSearchResult {
  const q = normalize(query);
  if (!q) return { products, mode: "none" };

  const directHits = products.filter((p) => {
    const name = normalize(p.name);
    const category = normalize(p.category);
    const subcategory = normalize(p.subcategory);
    const haystack = `${name} ${category} ${subcategory}`;
    if (haystack.includes(q)) return true;

    const tokens = haystack.split(" ").filter(Boolean);
    return tokens.some((token) => token.startsWith(q));
  });

  if (directHits.length > 0) {
    return { products: directHits, mode: "exact" };
  }

  // For very short queries, Fuse with minMatchCharLength=2 will always return empty.
  // Use a lightweight substring match so 1-letter queries still show results.
  if (q.length < 2) {
    const hits = products.filter((p) => {
      const haystack = `${normalize(p.name)} ${normalize(p.category)} ${normalize(p.subcategory)}`;
      return haystack.includes(q);
    });

    return hits.length > 0 ? { products: hits, mode: "exact" } : { products, mode: "none" };
  }

  const variants = expandQueryVariants(q);
  const primary = variants[0] ?? q;

  const exactIndex = buildIndex(products, 0.35);
  const bestExactById = new Map<Product["id"], { product: Product; score: number }>();
  for (const v of variants.length > 0 ? variants : [primary]) {
    const hits = exactIndex.search(v, { limit: 60 });
    for (const h of hits) {
      const prev = bestExactById.get(h.item.product.id);
      const score = h.score ?? 1;
      if (!prev || score < prev.score) bestExactById.set(h.item.product.id, { product: h.item.product, score });
    }
  }

  const exactHits = Array.from(bestExactById.values())
    .sort((a, b) => a.score - b.score)
    .map((x) => x.product);

  if (exactHits.length > 0) {
    return {
      products: exactHits,
      mode: variants.length > 1 ? "related" : "exact",
    };
  }

  // Fallback: more tolerant search for typos/related matches.
  const relatedIndex = buildIndex(products, 0.6);
  const bestRelatedById = new Map<Product["id"], { product: Product; score: number }>();
  for (const v of variants.length > 0 ? variants : [primary]) {
    const hits = relatedIndex.search(v, { limit: 60 });
    for (const h of hits) {
      const prev = bestRelatedById.get(h.item.product.id);
      const score = h.score ?? 1;
      if (!prev || score < prev.score) bestRelatedById.set(h.item.product.id, { product: h.item.product, score });
    }
  }

  const relatedHits = Array.from(bestRelatedById.values())
    .sort((a, b) => a.score - b.score)
    .map((x) => x.product);

  if (relatedHits.length > 0) {
    return { products: relatedHits, mode: "related" };
  }

  // N-gram fallback (trigram Dice coefficient) for partial/fragmented typos.
  // This helps cases where Fuse finds nothing but there is still a close match.
  if (q.length >= 3) {
    const ranked = products
      .map((p) => {
        const score = Math.max(
          diceCoefficient(q, p.name),
          diceCoefficient(q, p.subcategory),
          diceCoefficient(q, p.category),
        );
        return { p, score };
      })
      .filter((x) => x.score >= 0.18)
      .sort((a, b) => b.score - a.score)
      .slice(0, 60)
      .map((x) => x.p);

    if (ranked.length > 0) return { products: ranked, mode: "related" };
  }

  return { products: [], mode: "none" };
}

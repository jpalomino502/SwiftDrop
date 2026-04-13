/**
 * Product domain model.
 *
 * Note: `price` and `originalPrice` are stored in centavos (integer cents),
 * not in whole currency units. Use the shared `formatCOP` helper when
 * rendering (it expects an amount in cents and will format appropriately).
 */
export type Product = {
  id: number;
  name: string;
  // price in centavos (e.g., 11_000_000 represents COP 110.000)
  price: number;
  // originalPrice in centavos (optional)
  originalPrice?: number;
  image: string;
  /** Optional longer description for product detail page (HTML or plain text) */
  description?: string;
  /** Additional image URLs for gallery. First image should match `image` when available. */
  images?: string[];
  category: string;
  subcategory: string;
  badge?: "Nuevo" | "Limited" | "Sale";
  colors: string[];
  availableSizes?: string[];
  /** Full list of categories for filtering */
  allCategories?: string[];
  /** Full list of subcategories for filtering */
  allSubcategories?: string[];
};

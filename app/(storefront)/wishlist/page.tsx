import type { Metadata } from "next";
import { WishlistPage } from "@/src/features/wishlist";
import { buildStorefrontMetadata } from "@/src/lib/seo";

export const metadata: Metadata = buildStorefrontMetadata({
  title: "Lista de Deseos",
  description: "Guarda tus productos favoritos y vuelve cuando quieras para comprarlos.",
  path: "/wishlist",
  noIndex: true,
});

export default function WishlistRoute() {
  return <WishlistPage />;
}

import type { Metadata } from "next";
import { CatalogPage } from "@/src/features/products/listing";
import { buildStorefrontMetadata } from "@/src/lib/seo";

export const metadata: Metadata = buildStorefrontMetadata({
  title: "Catalogo",
  description: "Explora el catalogo completo de camisetas y colecciones de SwiftDrop.",
  path: "/catalog",
});

export default function Catalog() {
  return <CatalogPage />;
}

import type { Metadata } from "next";
import { HomePage } from "@/src/features/home";
import { buildStorefrontMetadata } from "@/src/lib/seo";

export const metadata: Metadata = buildStorefrontMetadata({
  title: "Inicio",
  description: "Descubre repuestos automotrices de calidad con entrega ultrarapida en SwiftDrop.",
  path: "/",
});

export default function Home() {
  return <HomePage />;
}


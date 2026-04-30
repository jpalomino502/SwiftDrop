import type { Metadata } from "next";
import { AboutPage } from "@/src/features/about";
import { buildStorefrontMetadata } from "@/src/lib/seo";

export const metadata: Metadata = buildStorefrontMetadata({
  title: "Acerca de Nosotros",
  description: "Conoce la historia de SwiftDrop, nuestra misión y el equipo detrás de la entrega ultrarrápida de repuestos automotrices en Bucaramanga.",
  path: "/about",
});

export default function About() {
  return <AboutPage />;
}

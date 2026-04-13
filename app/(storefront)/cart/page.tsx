import type { Metadata } from "next";
import { CartPage } from "@/src/features/cart";
import { buildStorefrontMetadata } from "@/src/lib/seo";

export const metadata: Metadata = buildStorefrontMetadata({
  title: "Carrito",
  description: "Revisa tus productos antes de finalizar tu compra.",
  path: "/cart",
  noIndex: true,
});

export default function Page() {
  return <CartPage />;
}

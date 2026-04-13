import type { Metadata } from "next";
import { CheckoutPage } from "@/src/features/checkout/ui/pages/CheckoutPage.client";
import { buildStorefrontMetadata } from "@/src/lib/seo";

export const metadata: Metadata = buildStorefrontMetadata({
    title: "Checkout",
    description: "Finaliza tu pedido de forma segura en SwiftDrop.",
    path: "/checkout",
    noIndex: true,
});

export default function Page() {
    return <CheckoutPage />;
}

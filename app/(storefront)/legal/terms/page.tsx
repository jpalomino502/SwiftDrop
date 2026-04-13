import type { Metadata } from "next";
import { TermsPage } from "@/src/features/legal";
import { buildStorefrontMetadata } from "@/src/lib/seo";

export const metadata: Metadata = buildStorefrontMetadata({
    title: "Terminos y Condiciones",
    description: "Revisa los terminos de uso y compra de SwiftDrop.",
    path: "/legal/terms",
});

export default function Terms() {
    return <TermsPage />;
}

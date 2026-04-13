import type { Metadata } from "next";
import { PrivacyPage } from "@/src/features/legal";
import { buildStorefrontMetadata } from "@/src/lib/seo";

export const metadata: Metadata = buildStorefrontMetadata({
    title: "Politica de Privacidad",
    description: "Conoce como SwiftDrop protege y trata tus datos personales.",
    path: "/legal/privacy",
});

export default function Privacy() {
    return <PrivacyPage />;
}

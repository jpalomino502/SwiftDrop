import type { Metadata } from "next";
import { FaqPage } from "@/src/features/faq";
import { buildStorefrontMetadata } from "@/src/lib/seo";

export const metadata: Metadata = buildStorefrontMetadata({
    title: "Preguntas Frecuentes",
    description: "Resuelve dudas sobre pagos, envios, cambios y devoluciones.",
    path: "/faq",
});

export default function Faq() {
    return <FaqPage />;
}

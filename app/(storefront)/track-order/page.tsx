import type { Metadata } from "next";
import { TrackingPage } from "@/src/features/tracking";
import { buildStorefrontMetadata } from "@/src/lib/seo";

export const metadata: Metadata = buildStorefrontMetadata({
    title: "Rastrear Pedido",
    description: "Consulta el estado y seguimiento de tu pedido en tiempo real.",
    path: "/track-order",
    noIndex: true,
});

export default function TrackOrder() {
    return <TrackingPage />;
}

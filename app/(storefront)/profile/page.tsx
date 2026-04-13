import type { Metadata } from "next";
import { ProfilePage } from "@/src/features/profile";
import { buildStorefrontMetadata } from "@/src/lib/seo";

export const metadata: Metadata = buildStorefrontMetadata({
  title: "Mi Perfil",
  description: "Administra tus datos, direcciones e historial de pedidos.",
  path: "/profile",
  noIndex: true,
});

export default function Page() {
  return <ProfilePage />;
}

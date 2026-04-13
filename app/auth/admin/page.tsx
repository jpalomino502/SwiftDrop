import { getAdminServerAccess } from "@/src/features/admin/server/access";
import { AdminLoginPage } from "@/src/features/admin/ui/pages/AdminLoginPage";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Administrador - Tribuna 90",
  description: "Panel de administración",
};

export default async function Page() {
  const access = await getAdminServerAccess();
  if (access.status === "ready") {
    redirect("/admin");
  }

  return <AdminLoginPage />;
}

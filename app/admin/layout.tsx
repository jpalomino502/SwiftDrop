import { AdminLayout } from "@/src/features/admin/ui/layout/AdminLayout";
import { AdminAccessProvider } from "@/src/features/admin/ui/client/useAdminAccess";
import { getAdminServerAccess } from "@/src/features/admin/server/access";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
    const access = await getAdminServerAccess();
    if (access.status !== "ready") {
        if (access.status === "forbidden") {
            redirect("/auth/admin?reason=forbidden");
        }
        redirect("/auth/admin?reason=session");
    }

    return (
        <AdminAccessProvider>
            <AdminLayout>{children}</AdminLayout>
        </AdminAccessProvider>
    );
}

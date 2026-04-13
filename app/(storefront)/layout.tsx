import StorefrontShell from "./StorefrontShell.client";
import { getServerHeaderCategoryTree, getServerUserSnapshot } from "@/src/lib/supabase/ssr";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

export default async function StorefrontLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const initialUser = await getServerUserSnapshot();
    const initialCategories = await getServerHeaderCategoryTree();

    return (
        <Suspense fallback={null}>
            <StorefrontShell initialUser={initialUser} initialCategories={initialCategories}>
                {children}
            </StorefrontShell>
            <Analytics />
            <SpeedInsights />
        </Suspense>
    );
}

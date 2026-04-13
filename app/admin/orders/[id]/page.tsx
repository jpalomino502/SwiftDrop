import { OrderDetailsPage } from "@/src/features/admin/ui/pages/OrderDetailsPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <OrderDetailsPage params={{ id }} />;
}

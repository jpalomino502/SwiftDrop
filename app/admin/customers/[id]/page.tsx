import { CustomerProfilePage } from "@/src/features/admin/ui/pages/CustomerProfilePage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <CustomerProfilePage params={{ id }} />;
}

import { ProductEditorPage } from "@/src/features/admin/ui/pages/ProductEditorPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <ProductEditorPage params={{ id }} />;
}

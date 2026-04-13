import type { Metadata } from "next";
import { ProductDetailPage } from "@/src/features/products/details";
import { getProductById } from "@/src/features/products/details/server/getProductById";
import { buildStorefrontMetadata } from "@/src/lib/seo";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isFinite(productId)) {
    return buildStorefrontMetadata({
      title: "Producto",
      description: "Consulta los detalles, precio y disponibilidad de este producto.",
      path: `/products/${id}`,
      noIndex: true,
    });
  }

  const product = await getProductById(productId);

  if (!product) {
    return buildStorefrontMetadata({
      title: "Producto no disponible",
      description: "Este producto no está disponible en este momento.",
      path: `/products/${id}`,
      noIndex: true,
    });
  }

  return buildStorefrontMetadata({
    title: product.name,
    description:
      product.description ??
      "Explora los detalles, materiales y tallas disponibles antes de comprar.",
    path: `/products/${id}`,
  });
}

export default async function Page({ params }: ProductPageProps) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isFinite(productId)) {
    return <div className="px-6 py-24">Producto inválido.</div>;
  }

  return <ProductDetailPage productId={productId} />;
}

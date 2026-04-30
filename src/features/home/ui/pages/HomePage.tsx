import { BenefitsSection } from "../sections/BenefitsSection";
import { BestSellersSection } from "../sections/BestSellersSection";
import { FeaturedProductsSection } from "../sections/FeaturedProductsSection";
import { FinalCtaSection } from "../sections/FinalCtaSection";
import { HomeHero } from "../sections/HomeHero";
import { BrandManifesto } from "../sections/BrandManifesto";
import { LookbookSection } from "../sections/LookbookSection";

import { getProducts } from "@/src/features/products/server/getProducts";

export async function HomePage() {
  const products = await getProducts(50).catch(() => []);

  // Take first 3 products for the lookbook section
  const repuestosDestacados = products.slice(0, 3);

  return (
    <div>
      <HomeHero />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FeaturedProductsSection products={products} />
        <BrandManifesto />
      </div>
      <LookbookSection repuestosDestacados={repuestosDestacados} />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <BestSellersSection products={products} />
        <BenefitsSection />
        <FinalCtaSection />
      </div>
    </div>
  );
}


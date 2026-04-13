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

  const retroProducts = products.filter(p =>
    p.subcategory === "Camisetas Retro" ||
    p.allSubcategories?.includes("Camisetas Retro")
  ).slice(0, 3); // We likely need 2 or 3 for the layout

  return (
    <div>
      <HomeHero />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FeaturedProductsSection products={products} />
        <BrandManifesto />
      </div>
      <LookbookSection retroProducts={retroProducts} />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <BestSellersSection products={products} />
        <BenefitsSection />
        <FinalCtaSection />
      </div>
    </div>
  );
}


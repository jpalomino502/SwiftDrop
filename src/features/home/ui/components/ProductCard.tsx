"use client";

import { ProductHeroCard } from "@/src/shared/presentation/ui";

export type ProductCardProps = {
  title: string;
  price: string;
  imageUrl: string;
  href?: string;
  tag?: string;
  large?: boolean;
  onQuickView?: () => void;
};

export function ProductCard({
  title,
  price,
  tag,
  imageUrl,
  href,
  large = false,
  onQuickView,
}: ProductCardProps) {
  return (
    <ProductHeroCard
      title={title}
      price={price}
      tag={tag}
      imageUrl={imageUrl}
      href={href}
      colSpan={large ? 2 : 1}
      rowSpan={large ? 2 : 1}
      onQuickView={onQuickView}
    />
  );
}

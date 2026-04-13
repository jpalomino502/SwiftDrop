"use client";

import Link from "next/link";
import { Heart, Plus } from "lucide-react";

import { useWishlist } from "@/src/features/wishlist";

export type ProductHeroCardProps = {
  title: string;
  price: string;
  imageUrl: string;
  href?: string;
  tag?: string;
  rowSpan?: 1 | 2;
  colSpan?: 1 | 2;
  onQuickView?: () => void;
  wishlist?: {
    productId: number;
    title: string;
    imageUrl: string;
    price: number;
  };
  primaryAction?: "navigate" | "quickView";
  secondaryImageUrl?: string;
};

export function ProductHeroCard({
  title,
  price,
  imageUrl,
  href,
  tag,
  rowSpan = 1,
  colSpan = 1,
  // onQuickView,
  wishlist,
  primaryAction = "navigate",
  secondaryImageUrl,
}: ProductHeroCardProps) {
  const { hasItem, toggleItem } = useWishlist();

  // Remove quick view logic
  const navigateEnabled = !!href;

  const isWishlisted = wishlist ? hasItem(wishlist.productId) : false;

  const CardContent = (
    <div
      className={`group relative h-full w-full overflow-hidden cursor-pointer transition-transform duration-200 active:scale-[0.99] ${colSpan === 2 ? "col-span-2" : "col-span-1"
        } ${rowSpan === 2 ? "row-span-2" : "row-span-1"}`}
    >
      <div className="relative h-full min-h-40 md:min-h-0">
        {navigateEnabled && href && (
          <Link href={href} aria-label={`Ver ${title}`} className="absolute inset-0 z-10">
            <span className="sr-only">Ver {title}</span>
          </Link>
        )}

        <img
          src={imageUrl}
          alt={title}
          width={900}
          height={1200}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${secondaryImageUrl ? "group-hover:opacity-0" : "group-hover:scale-105 transition-transform duration-700"}`}
          loading="lazy"
        />

        {secondaryImageUrl && (
          <img
            src={secondaryImageUrl}
            alt={title}
            width={900}
            height={1200}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            loading="lazy"
          />
        )}

        <div className="pointer-events-none absolute inset-0 z-10 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

        {wishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleItem(wishlist);
            }}
            aria-label={
              isWishlisted
                ? `Quitar ${wishlist.title} de favoritos`
                : `Guardar ${wishlist.title} en favoritos`
            }
            className={`absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 hover:scale-105 md:opacity-0 md:group-hover:opacity-100 ${isWishlisted
              ? "bg-foreground text-background"
              : "bg-background/90 text-foreground hover:bg-background"
              }`}
          >
            <Heart className="w-5 h-5" fill={isWishlisted ? "currentColor" : "none"} />
          </button>
        )}

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 p-5 md:p-6 bg-linear-to-t from-black/75 via-black/25 to-transparent">
          {tag && <p className="text-xs font-normal text-white/75 mb-1 ">{tag}</p>}
          <h3 className="text-lg md:text-xl font-normal text-white mb-1 drop-shadow-sm">
            <span className="hover:underline underline-offset-4">{title}</span>
          </h3>
          <p className="text-sm font-normal text-white/85 drop-shadow-sm">{price}</p>
        </div>
      </div>
    </div>
  );

  return CardContent;
}

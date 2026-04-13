"use client";

import Link from "next/link";
import { Heart, Plus } from "lucide-react";

import { useWishlist } from "@/src/features/wishlist";

export type ProductTileCardProps = {
  href: string;
  name: string;
  imageUrl: string;
  badge?: string;
  subcategory?: string;
  price: string;
  originalPrice?: string;
  colors?: string[];
  onQuickView?: () => void;
  wishlist?: {
    productId: number;
    title: string;
    imageUrl: string;
    price: number;
  };
  primaryAction?: "navigate" | "quickView";
  sizes?: string;
  availableSizes?: string[];
  secondaryImageUrl?: string;
};

export function ProductTileCard({
  href,
  name,
  imageUrl,
  badge,
  subcategory,
  price,
  originalPrice,
  colors,
  wishlist,
  primaryAction = "navigate",
  sizes = "(min-width: 1024px) 33vw, (min-width: 768px) 33vw, 50vw",
  availableSizes,
  secondaryImageUrl,
}: ProductTileCardProps) {
  const { hasItem, toggleItem } = useWishlist();

  // Remove quick view logic
  const navigateEnabled = true;

  const isWishlisted = wishlist ? hasItem(wishlist.productId) : false;

  const CardContent = (
    <div className="group relative cursor-pointer transition-transform duration-200 active:scale-[0.99]">
      <div className="relative bg-card overflow-hidden mb-4 shadow-sm transition-shadow duration-300 group-hover:shadow-md">
        <div className="relative aspect-3/4">
          {navigateEnabled && (
            <Link href={href} aria-label={`Ver ${name}`} className="absolute inset-0 z-10">
              <span className="sr-only">Ver {name}</span>
            </Link>
          )}

          <img
            src={imageUrl || "/placeholder.svg"}
            alt={name}
            width={900}
            height={1200}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${secondaryImageUrl ? "group-hover:opacity-0" : "group-hover:scale-105 transition-transform duration-700"}`}
            loading="lazy"
          />

          {secondaryImageUrl && (
            <img
              src={secondaryImageUrl}
              alt={name}
              width={900}
              height={1200}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100"
              loading="lazy"
            />
          )}

          {(wishlist || badge) && (
            <>
              {wishlist && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 hover:scale-105 md:opacity-0 md:group-hover:opacity-100 ${isWishlisted
                      ? "bg-foreground text-background"
                      : "bg-background/90 text-foreground hover:bg-background"
                      }`}
                  >
                    <Heart
                      className="w-5 h-5"
                      fill={isWishlisted ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              )}
              {badge && (
                <div className={`absolute top-4 left-4 z-20`}>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-normal ${badge === "Sale"
                      ? "bg-foreground text-background"
                      : "bg-background/90 text-foreground backdrop-blur-sm"
                      }`}
                  >
                    {badge}
                  </span>
                </div>
              )}
            </>
          )}

          <div className="pointer-events-none absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300" />
        </div>
      </div>

      <div className="px-1">
        {subcategory && (
          <p className="text-xs font-normal text-muted-foreground mb-1 ">
            {subcategory}
          </p>
        )}

        <h3 className="text-sm md:text-base font-normal text-foreground mb-2">
          <span className="group-hover:underline underline-offset-4">{name}</span>
        </h3>

        <div className="flex items-center gap-2 mb-3">
          <p className="text-sm font-normal text-foreground">{price}</p>
          {originalPrice && (
            <p className="text-sm font-normal text-muted-foreground line-through">
              {originalPrice}
            </p>
          )}
        </div>

        {colors && colors.length > 0 && (
          <div className="flex gap-1.5 items-center">
            {colors.slice(0, 4).map((color) => (
              <span
                key={color}
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: color }}
                aria-label="Color"
              />
            ))}
          </div>
        )}
        {availableSizes && availableSizes.length > 0 && (
          <div className="flex gap-1 mt-2">
            {availableSizes.slice(0, 4).map(size => (
              <span key={size} className="text-[10px] uppercase text-muted-foreground border border-border px-1.5 py-0.5 rounded">
                {size}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return CardContent;
}

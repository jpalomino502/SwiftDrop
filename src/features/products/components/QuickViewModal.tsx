"use client";

import { useState } from "react";
import { X } from "lucide-react";

import type { Product } from "../domain/Product";
import { formatCOP } from "@/src/shared/presentation/ui";
import { useCart } from "@/src/features/cart";

export function QuickViewModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { addItem, openDrawer } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const hasSizes = Boolean(product.availableSizes && product.availableSizes.length > 0);
  const hasColors = product.colors.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-background  max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors"
          aria-label="Cerrar vista rápida"
          type="button"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        <div className="grid md:grid-cols-2">
          <div className="relative aspect-3/4">
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              width={900}
              height={1200}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            {product.badge && (
              <span
                className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-normal ${product.badge === "Sale"
                  ? "bg-foreground text-background"
                  : "bg-background/90 text-foreground backdrop-blur-sm"
                  }`}
              >
                {product.badge}
              </span>
            )}
          </div>
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <p className="text-xs font-normal  text-muted-foreground mb-3 ">
              {product.subcategory}
            </p>
            <h3 className="text-2xl md:text-3xl font-normal text-foreground mb-4">
              {product.name}
            </h3>
            <div className="flex items-center gap-3 mb-6">
              <p className="text-xl font-normal text-foreground">{formatCOP(product.price)}</p>
              {product.originalPrice && (
                <p className="text-lg font-normal text-muted-foreground line-through">
                  {formatCOP(product.originalPrice)}
                </p>
              )}
            </div>
            <p className="text-sm font-normal text-muted-foreground mb-8 ">
              Confeccionado con materiales de primera calidad. Diseño atemporal que
              combina comodidad y elegancia para cualquier ocasión.
            </p>

            {hasColors && (
              <div className="mb-6">
                <p className="text-sm font-normal text-foreground mb-3">Color</p>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded-full border-2 border-border hover:border-foreground transition-colors"
                      style={{ backgroundColor: color }}
                      aria-label="Seleccionar color"
                      type="button"
                    />
                  ))}
                </div>
              </div>
            )}

            {hasSizes && (
              <div className="mb-8">
                <p className="text-sm font-normal text-foreground mb-3">Talla</p>
                <div className="flex gap-2">
                  {product.availableSizes!.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12  text-sm font-normal transition-colors ${selectedSize === size
                        ? "bg-foreground text-background"
                        : "border border-border text-foreground hover:border-foreground"
                        }`}
                      type="button"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              className="w-full bg-foreground text-background py-4  font-normal text-sm  hover:bg-foreground/90 transition-colors"
              type="button"
              disabled={hasSizes && !selectedSize}
              onClick={() => {
                if (hasSizes && !selectedSize) return;
                addItem({
                  productId: product.id,
                  title: product.name,
                  imageUrl: product.image,
                  unitPrice: product.price,
                  quantity: 1,
                  size: hasSizes ? (selectedSize ?? undefined) : undefined,
                });
                onClose();
                openDrawer();
              }}
            >
              Añadir al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

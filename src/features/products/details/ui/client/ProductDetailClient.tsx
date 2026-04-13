"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Heart, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react"
import type { Product } from "@/src/features/products";
import { QuickViewModal } from "@/src/features/products";
import { formatCOP, ProductTileCard } from "@/src/shared/presentation/ui";
import { useCart } from "@/src/features/cart";
import { useWishlist } from "@/src/features/wishlist";

export function ProductDetailClient({
  product,
  relatedProducts,
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const { addItem, openDrawer } = useCart();
  const { toggleItem, hasItem } = useWishlist();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [viewersNow, setViewersNow] = useState<number | null>(null);
  const autoRotateRef = useRef(true);

  // Prepare images array: use product.images if available, otherwise fallback to single image
  const displayImages = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    return [product.image];
  }, [product.images, product.image]);

  const currentImage = displayImages[currentImageIndex];

  // Auto-rotate images every 4 seconds
  useEffect(() => {
    if (displayImages.length <= 1) return;

    const interval = setInterval(() => {
      if (autoRotateRef.current) {
        setDirection(1);
        setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [displayImages.length]);

  useEffect(() => {
    const randomViewers = () => Math.floor(Math.random() * 27) + 8; // 8-34
    setViewersNow(randomViewers());

    const interval = setInterval(() => {
      setViewersNow(randomViewers());
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const pauseAutoRotate = () => {
    autoRotateRef.current = false;
    // Resume auto-rotation after 10 seconds of inactivity
    setTimeout(() => {
      autoRotateRef.current = true;
    }, 10000);
  };

  const handleThumbnailClick = (index: number) => {
    setDirection(index > currentImageIndex ? 1 : -1);
    setCurrentImageIndex(index);
    pauseAutoRotate();
  };

  const nextImage = () => {
    setDirection(1);
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    pauseAutoRotate();
  };

  const prevImage = () => {
    setDirection(-1);
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    pauseAutoRotate();
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: product.name,
      text: product.description || `Descubre ${product.name}`,
      url: url,
    };

    try {
      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(url);
        alert("Enlace copiado al portapapeles");
      }
    } catch (error) {
      // If user cancelled or error occurred, try clipboard as last resort
      if (error instanceof Error && error.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(url);
          alert("Enlace copiado al portapapeles");
        } catch (clipboardError) {
          console.error("Error al compartir:", clipboardError);
        }
      }
    }
  };

  const priceLabel = useMemo(() => {
    return formatCOP(product.price);
  }, [product.price]);

  const isFavorite = hasItem(product.id);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className=" pb-24 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="flex items-center space-x-2 text-sm text-gray-400 mb-12">
        <Link href="/" className="hover:text-black">
          Home
        </Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-black">
          Colecciones
        </Link>
        <span>/</span>
        <span className="text-black">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32">
        <div className="space-y-6">
          {/* Main Image with Navigation & Swipe */}
          <div className="overflow-hidden bg-[#f7f7f7] aspect-4/5 relative transition-all duration-500 group/image">
            <AnimatePresence initial={false} custom={direction}>
              <motion.img
                key={currentImageIndex}
                src={currentImage}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = Math.abs(offset.x) > 50 || Math.abs(velocity.x) > 500;
                  if (swipe) {
                    if (offset.x > 0) {
                      prevImage();
                    } else {
                      nextImage();
                    }
                  }
                }}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover cursor-grab active:cursor-grabbing"
                loading="eager"
              />
            </AnimatePresence>

            {/* Navigation Arrows */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 hover:bg-white"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 hover:bg-white"
                  aria-label="Siguiente imagen"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Counter for mobile */}
                <div className="absolute bottom-4 right-4 z-20 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full md:hidden">
                  {currentImageIndex + 1} / {displayImages.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {displayImages.length > 1 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {displayImages.map((img, index) => {
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleThumbnailClick(index)}
                    className={`overflow-hidden bg-[#f7f7f7] aspect-square relative transition-all duration-300 ${currentImageIndex === index
                      ? "ring-2 ring-black ring-offset-2"
                      : "opacity-60 hover:opacity-100"
                      }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} - imagen ${index + 1}`}
                      width={400}
                      height={400}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <div className="mb-10">
            {product.badge && (
              <span className="text-[10px] text-gray-400 block mb-4">
                {product.badge}
              </span>
            )}
            <h1 className="text-4xl lg:text-6xl mb-4">
              {product.name}
            </h1>
            <p className="text-2xl text-gray-900">{priceLabel}</p>
            {viewersNow !== null && (
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                <Eye size={14} />
                {viewersNow} personas viendo este producto ahora
              </p>
            )}
          </div>

          {product.description?.trim() && (
            <p className="text-gray-500 leading-relaxed mb-10 max-w-md">
              {product.description}
            </p>
          )}

          <div className="mb-10">
            {product.availableSizes && product.availableSizes.length > 0 && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs">Seleccionar Talla</span>
                  <button
                    className="text-[10px] text-gray-400 border-b border-gray-200 pb-1"
                    type="button"
                  >
                    Guía de tallas
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-14 h-14 rounded-full border text-xs flex items-center justify-center transition-all ${selectedSize === size
                        ? "bg-black text-white border-black"
                        : "border-gray-200 hover:border-black"
                        }`}
                      type="button"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </>
            )}
            {/* If multiple colors exist, we should probably show them too, but for now focusing on Size as per existing UI */}
          </div>

          <div className="flex flex-col space-y-4 mb-12">
            <Button
              size="lg"
              radius="full"
              className="w-full bg-black text-white"
              type="button"
              disabled={!!(product.availableSizes && product.availableSizes.length > 0 && !selectedSize)}
              onClick={() => {
                if (product.availableSizes && product.availableSizes.length > 0 && !selectedSize) return;
                addItem({
                  productId: product.id,
                  title: product.name,
                  imageUrl: product.image,
                  unitPrice: product.price,
                  quantity: 1,
                  size: selectedSize ?? undefined,
                });
                openDrawer();
              }}
            >
              Añadir a la bolsa
            </Button>
            <div className="flex space-x-4">
              <Button
                size="lg"
                radius="full"
                className={`flex-1 ${isFavorite ? "bg-black text-white" : "bg-zinc-100"}`}
                type="button"
                onClick={() =>
                  toggleItem({
                    productId: product.id,
                    title: product.name,
                    imageUrl: product.image,
                    price: product.price,
                  })
                }
              >
                <Heart size={16} strokeWidth={1} />
                <span>{isFavorite ? "Guardado" : "Favoritos"}</span>
              </Button>
              <Button
                isIconOnly
                size="lg"
                radius="full"
                className="bg-zinc-100"
                aria-label="Compartir"
                onClick={handleShare}
              >
                <Share2 size={16} strokeWidth={1} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <section className="border-t border-gray-100 ">
        <h2 className="text-2xl mb-12 text-center">Completa el Look</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProducts.map((p) => (
            <ProductTileCard
              key={p.id}
              href={`/products/${p.id}`}
              name={p.name}
              imageUrl={p.image || "/placeholder.svg"}
              badge={p.badge}
              subcategory={p.subcategory}
              price={formatCOP(p.price)}
              originalPrice={p.originalPrice ? formatCOP(p.originalPrice) : undefined}
              colors={p.colors}
              wishlist={{
                productId: p.id,
                title: p.name,
                imageUrl: p.image || "/placeholder.svg",
                price: p.price,
              }}
              onQuickView={() => setQuickViewProduct(p)}
            />
          ))}
        </div>
      </section>

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}

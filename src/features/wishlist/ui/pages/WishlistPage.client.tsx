"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { formatCOP } from "@/src/shared/presentation/ui";
import { useWishlist } from "../client/wishlistStore";

export function WishlistPage() {
  const router = useRouter();
  const { items, removeItem, clear } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="pt-40 pb-24 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-4xl mb-8">Tus favoritos están vacíos</h1>
        <button
          onClick={() => router.push("/catalog")}
          className="bg-black text-white px-10 py-4 rounded-full text-xs uppercase"
          type="button"
        >
          Explorar la colección
        </button>
      </div>
    );
  }

  return (
    <div className=" pb-24 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-6 mb-12">
        <h1 className="text-5xl">Favoritos</h1>
        <button
          onClick={() => clear()}
          className="text-[10px] uppercase text-gray-400 hover:text-black border-b border-gray-200 pb-1"
          type="button"
        >
          Vaciar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item) => (
          <div key={item.productId} className="group">
            <div className="relative aspect-3/4 bg-[#f7f7f7]  overflow-hidden">
              <Link href={`/products/${item.productId}`} className="absolute inset-0 z-10" aria-label={item.title}>
                <span className="sr-only">Ver {item.title}</span>
              </Link>
              <img
                src={item.imageUrl}
                alt={item.title}
                width={900}
                height={1200}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            </div>

            <div className="pt-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate text-lg">{item.title}</div>
                <div className="mt-1 text-sm text-gray-700">{formatCOP(item.price)}</div>
              </div>

              <button
                onClick={() => removeItem(item.productId)}
                className="shrink-0 text-[10px] uppercase text-gray-400 hover:text-black border-b border-gray-200 pb-1"
                type="button"
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

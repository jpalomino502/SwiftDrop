"use client";

import { CartProvider } from "@/src/features/cart";
import { WishlistProvider } from "@/src/features/wishlist";
import { ProgressBar } from "@/src/shared/presentation/ui";
import { Suspense } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <Suspense fallback={null}>
          <ProgressBar />
        </Suspense>
        {children}
      </WishlistProvider>
    </CartProvider>
  );
}

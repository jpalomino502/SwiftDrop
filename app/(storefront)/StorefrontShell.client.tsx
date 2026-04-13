"use client";

import { type ReactNode, useState } from "react";

import { CartDrawer, useCart } from "@/src/features/cart";
import { SiteFooter, SiteHeader, AnnouncementBar } from "@/src/shared/presentation/ui";
import type { HeaderCategoryNode, ServerUserSnapshot } from "@/src/lib/supabase/ssr";

export default function StorefrontShell({
  children,
  initialUser,
  initialCategories,
}: {
  children: ReactNode;
  initialUser: ServerUserSnapshot | null;
  initialCategories: HeaderCategoryNode[];
}) {
  const { openDrawer, totalItems } = useCart();
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  return (
    <>
      {showAnnouncement && (
        <AnnouncementBar onDismiss={() => setShowAnnouncement(false)} />
      )}
      <SiteHeader
        className="top-0"
        onCartClick={openDrawer}
        cartCount={totalItems}
        initialUser={initialUser}
        initialCategories={initialCategories}
      />
      <main>{children}</main>
      <SiteFooter categories={initialCategories} />
      <CartDrawer />
    </>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import type { WishlistItem, WishlistItemId } from "../../domain/WishlistItem";
import { toWishlistItemId } from "../../domain/WishlistItem";

const STORAGE_KEY = "ecommerce:wishlist:v1";

const EMPTY_WISHLIST_ITEMS: WishlistItem[] = [];

type AddToWishlistInput = {
  productId: number;
  title: string;
  imageUrl: string;
  price: number;
};

type WishlistApi = {
  items: WishlistItem[];

  addItem: (input: AddToWishlistInput) => void;
  removeItem: (id: WishlistItemId) => void;
  toggleItem: (input: AddToWishlistInput) => void;
  hasItem: (id: WishlistItemId) => boolean;
  clear: () => void;

  totalItems: number;
};

const WishlistContext = createContext<WishlistApi | null>(null);

function safeParseWishlist(raw: string | null): WishlistItem[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const items: WishlistItem[] = [];
    for (const item of parsed) {
      const maybe = item as Partial<WishlistItem>;
      if (
        typeof maybe.productId !== "number" ||
        typeof maybe.title !== "string" ||
        typeof maybe.imageUrl !== "string" ||
        typeof maybe.price !== "number" ||
        typeof maybe.addedAt !== "string"
      ) {
        continue;
      }

      items.push({
        productId: maybe.productId,
        title: maybe.title,
        imageUrl: maybe.imageUrl,
        price: maybe.price,
        addedAt: maybe.addedAt,
      });
    }

    return items;
  } catch {
    return [];
  }
}

let cachedRaw: string | null = null;
let cachedItems: WishlistItem[] = [];
const listeners = new Set<() => void>();
let storageListenerCount = 0;

function emitChange() {
  for (const listener of listeners) listener();
}

function getRawFromStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getClientSnapshot(): WishlistItem[] {
  if (typeof window === "undefined") return EMPTY_WISHLIST_ITEMS;

  const raw = getRawFromStorage();
  if (raw === cachedRaw) return cachedItems;

  cachedRaw = raw;
  cachedItems = safeParseWishlist(raw);
  return cachedItems;
}

function getServerSnapshot(): WishlistItem[] {
  return EMPTY_WISHLIST_ITEMS;
}

function onStorageEvent(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;

  cachedRaw = event.newValue;
  cachedItems = safeParseWishlist(event.newValue);
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (typeof window !== "undefined") {
    if (storageListenerCount === 0) {
      window.addEventListener("storage", onStorageEvent);
    }
    storageListenerCount += 1;
  }

  return () => {
    listeners.delete(listener);

    if (typeof window !== "undefined") {
      storageListenerCount = Math.max(0, storageListenerCount - 1);
      if (storageListenerCount === 0) {
        window.removeEventListener("storage", onStorageEvent);
      }
    }
  };
}

function writeWishlistItems(items: WishlistItem[]) {
  const raw = JSON.stringify(items);
  cachedRaw = raw;
  cachedItems = items;

  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // ignore (storage unavailable)
  }

  emitChange();
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const addItem = useCallback((input: AddToWishlistInput) => {
    const id = toWishlistItemId({ productId: input.productId });

    const prev = getClientSnapshot();
    if (prev.some((p) => p.productId === id)) return;

    const next: WishlistItem[] = [
      {
        productId: input.productId,
        title: input.title,
        imageUrl: input.imageUrl,
        price: input.price,
        addedAt: new Date().toISOString(),
      },
      ...prev,
    ];

    writeWishlistItems(next);
  }, []);

  const removeItem = useCallback((id: WishlistItemId) => {
    const prev = getClientSnapshot();
    writeWishlistItems(prev.filter((p) => p.productId !== id));
  }, []);

  const hasItem = useCallback(
    (id: WishlistItemId) => {
      return items.some((p) => p.productId === id);
    },
    [items],
  );

  const toggleItem = useCallback(
    (input: AddToWishlistInput) => {
      const id = toWishlistItemId({ productId: input.productId });
      if (hasItem(id)) removeItem(id);
      else addItem(input);
    },
    [addItem, hasItem, removeItem],
  );

  const clear = useCallback(() => writeWishlistItems([]), []);

  const totalItems = useMemo(() => items.length, [items.length]);

  const value: WishlistApi = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      toggleItem,
      hasItem,
      clear,
      totalItems,
    }),
    [addItem, clear, hasItem, items, removeItem, toggleItem, totalItems],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistApi {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}

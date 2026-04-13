"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import type { CartItem, CartItemId } from "../../domain/CartItem";
import { toCartItemId } from "../../domain/CartItem";

const STORAGE_KEY = "ecommerce:cart:v1";

const EMPTY_CART_ITEMS: CartItem[] = [];

type AddToCartInput = {
  productId: number;
  title: string;
  imageUrl: string;
  unitPrice: number;
  quantity?: number;
  size?: string;
  color?: string;
};

type CartState = {
  items: CartItem[];
  isDrawerOpen: boolean;
};

type CartApi = CartState & {
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;

  addItem: (input: AddToCartInput) => void;
  updateQuantity: (id: CartItemId, delta: number) => void;
  setQuantity: (id: CartItemId, quantity: number) => void;
  removeItem: (id: CartItemId) => void;
  clear: () => void;

  totalItems: number;
  subtotal: number;
};

const CartContext = createContext<CartApi | null>(null);

function safeParseCart(raw: string | null): CartItem[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const items: CartItem[] = [];
    for (const item of parsed) {
      const maybe = item as Partial<CartItem>;
      if (
        typeof maybe.id !== "string" ||
        typeof maybe.productId !== "number" ||
        typeof maybe.title !== "string" ||
        typeof maybe.imageUrl !== "string" ||
        typeof maybe.unitPrice !== "number" ||
        typeof maybe.quantity !== "number"
      ) {
        continue;
      }

      items.push({
        id: maybe.id,
        productId: maybe.productId,
        title: maybe.title,
        imageUrl: maybe.imageUrl,
        unitPrice: maybe.unitPrice,
        quantity: Math.max(1, Math.floor(maybe.quantity)),
        size: typeof maybe.size === "string" ? maybe.size : undefined,
        color: typeof maybe.color === "string" ? maybe.color : undefined,
      });
    }

    return items;
  } catch {
    return [];
  }
}

let cachedRaw: string | null = null;
let cachedItems: CartItem[] = [];
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

function getClientSnapshot(): CartItem[] {
  if (typeof window === "undefined") return EMPTY_CART_ITEMS;

  const raw = getRawFromStorage();
  if (raw === cachedRaw) return cachedItems;

  cachedRaw = raw;
  cachedItems = safeParseCart(raw);
  return cachedItems;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY_CART_ITEMS;
}

function onStorageEvent(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;

  cachedRaw = event.newValue;
  cachedItems = safeParseCart(event.newValue);
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

function writeCartItems(items: CartItem[]) {
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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((v) => !v), []);

  const addItem = useCallback((input: AddToCartInput) => {
    const quantity = Math.max(1, Math.floor(input.quantity ?? 1));
    const id = toCartItemId({ productId: input.productId, size: input.size, color: input.color });

    const prev = getClientSnapshot();
    const existing = prev.find((p) => p.id === id);
    if (!existing) {
      writeCartItems([
        ...prev,
        {
          id,
          productId: input.productId,
          title: input.title,
          imageUrl: input.imageUrl,
          unitPrice: input.unitPrice,
          quantity,
          size: input.size,
          color: input.color,
        },
      ]);
      return;
    }

    writeCartItems(
      prev.map((p) => (p.id === id ? { ...p, quantity: p.quantity + quantity } : p)),
    );
  }, []);

  const updateQuantity = useCallback((id: CartItemId, delta: number) => {
    const prev = getClientSnapshot();
    writeCartItems(
      prev
        .map((p) => (p.id === id ? { ...p, quantity: p.quantity + delta } : p))
        .filter((p) => p.quantity > 0),
    );
  }, []);

  const setQuantity = useCallback((id: CartItemId, quantity: number) => {
    const normalized = Math.max(0, Math.floor(quantity));
    const prev = getClientSnapshot();
    writeCartItems(
      prev
        .map((p) => (p.id === id ? { ...p, quantity: normalized } : p))
        .filter((p) => p.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((id: CartItemId) => {
    const prev = getClientSnapshot();
    writeCartItems(prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => writeCartItems([]), []);

  const totalItems = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
    [items],
  );

  const value: CartApi = useMemo(
    () => ({
      items,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      addItem,
      updateQuantity,
      setQuantity,
      removeItem,
      clear,
      totalItems,
      subtotal,
    }),
    [
      addItem,
      clear,
      closeDrawer,
      isDrawerOpen,
      items,
      openDrawer,
      removeItem,
      setQuantity,
      subtotal,
      toggleDrawer,
      totalItems,
      updateQuantity,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

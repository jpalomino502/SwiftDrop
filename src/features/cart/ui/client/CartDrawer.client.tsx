"use client";

import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react"
import { formatCOP } from "@/src/shared/presentation/ui";
import { useCart } from "./cartStore";

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    subtotal,
  } = useCart();

  const hasItems = items.length > 0;

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar carrito"
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-60 transition-opacity duration-500 ${isDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={closeDrawer}
      />

      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-70 shadow-2xl transition-transform duration-500 ease-out ${isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito"
      >
        <div className="flex flex-col h-full">
          <div className="p-8 flex justify-between items-center border-b border-gray-100">
            <h2 className="text-lg uppercase">
              Tu Bolsa ({items.length})
            </h2>
            <button
              onClick={closeDrawer}
              className="hover:rotate-90 transition-transform duration-300"
              aria-label="Cerrar"
              type="button"
            >
              <X size={24} strokeWidth={1} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {!hasItems ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <ShoppingBag size={48} strokeWidth={0.5} className="text-gray-200" />
                <p className="text-gray-400 text-sm">Tu bolsa está vacía</p>
                <button
                  onClick={() => {
                    closeDrawer();
                    router.push("/catalog");
                  }}
                  className="text-xs uppercase border-b border-black pb-1"
                  type="button"
                >
                  Ir a la tienda
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex space-x-6">
                  <div className="relative w-24 h-32 bg-[#f7f7f7]  overflow-hidden shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      width={96}
                      height={128}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm leading-snug">
                          {item.title}
                        </h3>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-black transition-colors"
                          aria-label="Eliminar"
                          type="button"
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 uppercase mt-1">
                        Talla: {item.size || "M"}
                      </p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="flex items-center border border-gray-100 rounded-full px-2 py-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:opacity-50"
                          aria-label="Disminuir"
                          type="button"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:opacity-50"
                          aria-label="Aumentar"
                          type="button"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-sm">
                        {formatCOP(item.unitPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {hasItems && (
            <div className="p-8 border-t border-gray-100 bg-[#fafafa]">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs uppercase text-gray-400">
                  Subtotal
                </span>
                <span className="text-lg">{formatCOP(subtotal)}</span>
              </div>
              <Button
                onClick={() => {
                  closeDrawer();
                  router.push("/cart");
                }}
                radius="full"
                className="w-full bg-black text-white"
                type="button"
                size="lg"
              >
                Finalizar Pedido
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

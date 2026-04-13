"use client";

import { CreditCard, Minus, Plus, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react"
import { formatCOP } from "@/src/shared/presentation/ui";
import { useCart } from "../client/cartStore";

export function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  const total = subtotal;

  if (items.length === 0) {
    return (
      <div className="pt-40 pb-24 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-4xl mb-8">Tu bolsa está vacía</h1>
        <button
          onClick={() => router.push("/catalog")}
          className="bg-black text-white px-10 py-4 rounded-full text-xs uppercase"
          type="button"
        >
          Volver a la colección
        </button>
      </div>
    );
  }

  return (
    <div className=" pb-24 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <h1 className="text-5xl mb-16 text-center">
        Tu Bolsa
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8 space-y-12">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row space-y-6 sm:space-y-0 sm:space-x-8 pb-12 border-b border-gray-100 last:border-0"
            >
              <div className="relative w-full sm:w-48 aspect-3/4 bg-[#f7f7f7]  overflow-hidden shrink-0">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  width={480}
                  height={640}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-400 uppercase mb-4">
                      {item.color && (
                        <span className="mr-3">
                          Color:
                          <span
                            className="inline-block w-3 h-3 rounded-full border border-gray-200 ml-1 align-middle"
                            style={{ backgroundColor: item.color }}
                            title={item.color}
                          />
                        </span>
                      )}
                      {item.size && (
                        <span>Talla: {item.size}</span>
                      )}
                    </p>
                    <p className="text-sm mb-6">Ref: {item.productId}</p>
                  </div>
                  <p className="text-xl">{formatCOP(item.unitPrice)}</p>
                </div>

                <div className="flex justify-between items-center mt-auto">
                  <div className="flex items-center border border-gray-100 rounded-full px-4 py-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 hover:opacity-50"
                      aria-label="Disminuir"
                      type="button"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-6 text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 hover:opacity-50"
                      aria-label="Aumentar"
                      type="button"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-[10px] uppercase text-gray-400 hover:text-black border-b border-gray-200 pb-1"
                    type="button"
                  >
                    Eliminar pieza
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-zinc-100 p-10  sticky top-32">
            <h2 className="text-xs uppercase mb-10 pb-4 border-b border-gray-100">
              Resumen del pedido
            </h2>

            <div className="space-y-6 mb-10">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCOP(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Envío</span>
                <span className="text-right text-xs text-gray-500">
                  Gratis en Bucaramanga, Piedecuesta, Girón y Floridablanca. En otras ciudades normalmente inicia desde $10.100.
                </span>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-gray-100 pt-8 mb-10">
              <span className="text-xs uppercase">Total</span>
              <span className="text-3xl">
                {formatCOP(total)}
              </span>
            </div>

            <Button
              onClick={() => router.push("/checkout")}
              radius="full"
              size="lg"
              className="w-full bg-black text-white"
              type="button"
            >
              Proceder al pago
            </Button>

            <div className="mt-8 space-y-4">
              <div className="flex items-center space-x-3 text-xs text-gray-400 uppercase">
                <Truck size={14} />
                <span>Entrega en 2-4 días laborables</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@heroui/react";

export default function NotFound() {
  return (
    <div className=" pb-24 px-6 min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

        {/* Visual */}
        <div className="relative aspect-4/5 bg-[#f7f7f7]  overflow-hidden group">
          <img
            src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=2000&auto=format&fit=crop"
            alt="Pagina no encontrada"
            className="w-full h-full object-cover grayscale opacity-60 group-hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[12rem] md:text-[16rem] font-normal  text-black/10 select-none">
              404
            </span>
          </div>
        </div>

        {/* Texto */}
        <div className="space-y-10 text-center md:text-left">
          <div className="space-y-4">
            <h2 className="text-[10px] uppercase 5em] text-gray-400">
              Fuera de Tendencia
            </h2>
            <h1 className="text-5xl md:text-7xl font-normal  leading-none">
              Página no <br /> encontrada.
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto md:mx-0 pt-4">
              Parece que la pieza que buscas ya no está en nuestra colección o el enlace ha perdido su estructura.
            </p>
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Button
              as={Link}
              href="/"
              radius="full"
              size="lg"
              className="bg-black text-white"
            >
              Volver al inicio
            </Button>

            <Button
              as={Link}
              href="/catalog"
              radius="full"
              size="lg"
              className="bg-zinc-100 text-black"
            >
              Explorar catálogo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

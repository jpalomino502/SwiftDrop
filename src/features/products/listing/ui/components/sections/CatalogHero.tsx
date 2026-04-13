"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@heroui/react";

export function CatalogHero() {
  return (
    <div className="px-0 md:px-12 pt-18">
      <section className="w-full">
        <div className="relative h-[70vh] overflow-hidden md:">
          <img
            src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTc1fHxmYXNoaW9ufGVufDB8fDB8fHww"
            alt="Hero Background"
            width={1600}
            height={900}
            className="absolute inset-0 h-full w-full object-cover brightness-[0.85]"
            loading="eager"
          />

          <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-8 md:px-12 text-white">
            <div className="max-w-3xl">
              <span className="mb-6 inline-block animate-pulse text-xs  opacity-80">
                Colección
              </span>

              <h1 className="mb-8 text-5xl font-normal md:text-8xl">
                Catálogo
                <br />
                piezas para durar.
              </h1>

              <p className="mb-10 max-w-xl text-sm font-normal text-white/80 md:text-base">
                Explora la selección completa y usa los filtros para encontrar tu fit: categoría,
                tipo de prenda y orden por precio o novedades.
              </p>

              {/* <Button
              as="a"
              href="#catalog"
              radius="full"
              size="lg"
              className="group bg-white text-black px-10"
              endContent={<ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />}
            >
              Ver catálogo
            </Button> */}
            </div>
          </div>

          <div className="absolute bottom-12 left-1/2 z-10 hidden -translate-x-1/2 text-xs  text-white/50 md:block">
            SCROLL DOWN
          </div>
        </div>
      </section>
    </div>
  );
}

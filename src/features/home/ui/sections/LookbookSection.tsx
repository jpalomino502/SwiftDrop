"use client";

import { motion, Variants } from "framer-motion";
import type { Product } from "@/src/features/products";
import { formatCOP } from "@/src/shared/presentation/ui";
import Link from "next/link";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1]
    }
  },
};

export function LookbookSection({ repuestosDestacados = [] }: { repuestosDestacados?: Product[] }) {
  // Use first 3 products for the layout
  const p1 = repuestosDestacados[0];
  const p2 = repuestosDestacados[1];
  const p3 = repuestosDestacados[2];

  return (
    <section className="px-3 md:px-3 mt-[3px]">
      <div className="bento-grid grid grid-cols-2 md:grid-cols-12 grid-rows-[auto]">
        <motion.div
          className="col-span-2 md:col-span-12 py-5 md:py-8 flex items-center justify-between"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <span className="text-label text-muted-foreground font-grotesk">Destacados — 001</span>
          <span className="text-micro text-accent font-mono-code">Disponible</span>
        </motion.div>

        {/* Large product spotlight */}
        <motion.div
          className="col-span-2 md:col-span-6 h-[400px] md:h-[560px] relative overflow-hidden group cursor-pointer"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {p1 && (
            <Link href={`/products/${p1.id}`} className="block h-full w-full">
              <img
                src={p1.image}
                alt={p1.name}
                className="w-full h-full object-cover img-archival transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-black/50" />
              <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8">
                <p className="text-micro text-white/60 mb-2">{p1.badge || "Repuesto Premium"}</p>
                <h3 className="font-serif-display text-2xl md:text-3xl text-white">{p1.name}</h3>
                <p className="text-sm text-white/80 mt-1">{formatCOP(p1.price)}</p>
              </div>
            </Link>
          )}
        </motion.div>

        {/* Supporting pieces stacked */}
        <div className="col-span-2 md:col-span-3 flex flex-col gap-[3px]">
          {/* Second product */}
          <motion.div
            className="h-[200px] md:h-[279px] relative overflow-hidden group cursor-pointer"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {p2 && (
              <Link href={`/products/${p2.id}`} className="block h-full w-full">
                <img
                  src={p2.image}
                  alt={p2.name}
                  className="w-full h-full object-cover img-archival transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-xs text-white">{p2.name}</p>
                  <p className="text-xs text-white/50">{formatCOP(p2.price)}</p>
                </div>
              </Link>
            )}
          </motion.div>

          {/* Third product or generic block */}
          <motion.div
            className="h-[200px] md:h-[278px] relative overflow-hidden group cursor-pointer"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {p3 ? (
              <Link href={`/products/${p3.id}`} className="block h-full w-full">
                <img
                  src={p3.image}
                  alt={p3.name}
                  className="w-full h-full object-cover img-archival transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-xs text-white">{p3.name}</p>
                  <p className="text-xs text-white/50">{formatCOP(p3.price)}</p>
                </div>
              </Link>
            ) : (
              <div className="h-full flex flex-col justify-end p-5 group cursor-pointer hover:bg-muted transition-colors duration-700">
                <p className="text-micro text-muted-foreground font-grotesk mb-2">Proximamente</p>
                <p className="font-serif-display text-lg text-secondary-foreground">Nuevos Repuestos</p>
                <p className="font-grotesk text-xs text-muted-foreground mt-1">Ofertas Especiales</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Typographic reinforcement */}
        <motion.div
          className="col-span-2 md:col-span-3 bg-card p-6 md:p-8 flex flex-col justify-between h-[260px] md:h-auto"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <div>
            <p className="font-serif-display text-editorial text-foreground leading-[1.05]">
              Autopartes
            </p>
            <p className="font-serif-display text-editorial text-foreground italic leading-[1.05] mt-1">
              Premium
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-grotesk leading-relaxed">
              Seleccionamos los mejores repuestos automotrices. Productos de calidad, curados para el desempeno de tu vehiculo.
            </p>
            <Link
              href="/catalog?cat=Motores"
              className="text-micro text-foreground font-grotesk border-b border-foreground/30 hover:border-foreground transition-colors mt-4 inline-block uppercase tracking-widest pb-1"
            >
              Explorar Catalogo
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
;


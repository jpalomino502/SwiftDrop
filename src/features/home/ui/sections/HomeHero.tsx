"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

export function HomeHero() {
  return (
    <section className="px-3 md:px-3">
      <div className="bento-grid grid grid-cols-2 md:grid-cols-12 grid-rows-[280px_200px_180px] md:grid-rows-[320px_280px] gap-3">

        <Link href="/catalog?cat=Camisetas&sub=Camisetas%20Retro" className="col-span-2 md:col-span-7 md:row-span-2 relative overflow-hidden group cursor-pointer">
          <motion.div
            className="w-full h-full"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <img
              src="https://64.media.tumblr.com/db8472cfbb89a155148003b053d5f3de/4d6d987e0cee7307-8e/s400x225/158142e8e876044a6191733a02f6ee5ac1643b58.gif"
              alt="Campaña Retro"
              className="w-full h-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 max-w-[22ch]">
              <span className="text-xs md:text-base text-white/80 font-grotesk font-medium tracking-wide uppercase block mb-2">
                Drop Retrô 2026
              </span>
              <h2 className="text-white text-xl sm:text-2xl md:text-4xl font-serif-display leading-tight break-words">
                Estilo de época,
                <br />
                cultura de hoy.
              </h2>
            </div>
          </motion.div>
        </Link>

        <motion.div
          className="col-span-1 md:col-span-5 bg-card flex flex-col justify-end p-5 md:p-8 border border-border/50 overflow-hidden"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <p className="text-xs md:text-sm text-muted-foreground mb-3 font-grotesk uppercase tracking-wider">
            SwiftDrop
          </p>
          <h1 className="font-serif-display text-xl sm:text-2xl md:text-4xl lg:text-5xl text-foreground leading-[1.1] break-words max-w-[22ch]">
            Piezas de archivo para
            <br className="hidden md:block" />
            nostálgicos del fútbol.
          </h1>
        </motion.div>

        <motion.div
          className="col-span-1 md:col-span-2 relative overflow-hidden group cursor-pointer"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <img
            src="https://i.pinimg.com/originals/14/f4/35/14f435eaaf8d107cca5055ce150eaf47.gif"
            alt="Textura de tela clásica"
            className="w-full h-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
          />
        </motion.div>

        <Link href="/catalog?cat=Camisetas&sub=Camisetas%20Liga%20Colombiana" className="col-span-2 md:col-span-3">
          <motion.div
            className="h-full bg-black flex flex-col justify-between p-5 md:p-8 group cursor-pointer transition-colors duration-700"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <span className="text-xs md:text-sm text-white font-grotesk uppercase tracking-wider">
              Liga Colombiana
            </span>
            <div>
              <p className="font-serif-display text-lg sm:text-xl md:text-2xl text-white break-words">
                Cápsula Tricolor
              </p>
              <p className="text-xs md:text-sm text-white/60 mt-2 font-grotesk">
                Explorar colección
              </p>
            </div>
          </motion.div>
        </Link>

      </div>
    </section>
  );
}
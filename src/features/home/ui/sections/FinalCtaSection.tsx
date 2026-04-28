"use client";

import { Button } from "@heroui/react";
import { ArrowRight, Instagram, Sparkles, Users } from "lucide-react";

export function FinalCtaSection() {
  return (
    <section className="w-full max-w-6xl mx-auto py-16 md:py-24">
      <div className="relative overflow-hidden bg-black">
        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center px-8 py-16 md:px-20 md:py-24">
          {/* Columna de Texto */}
          <div className="text-left">
            <h2 className="text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight tracking-tight">
              Revive la gloria, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500">
                viste la historia.
              </span>
            </h2>

            <p className="text-lg text-zinc-400 mb-10 max-w-md leading-relaxed">
              No te pierdas nuestros drops exclusivos de indumentaria retro y ofertas preventa solo para la comunidad de SwiftDrop.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                radius="full"
                size="lg"
                className="bg-white"
              >
                Explorar Joyas Retro
              </Button>

              <Button
                as="a"
                radius="full"
                size="lg"
                href="https://www.instagram.com/tribuna.noventa/"
                target="_blank"
                className="bg-zinc-900 text-white"
              >
                <Instagram className="w-5 h-5 text-pink-500" />
                @tribuna.noventa
              </Button>
            </div>
          </div>

          {/* Columna de Visual / Social Proof */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[320px] aspect-square lg:aspect-auto lg:h-[400px]">
              {/* Tarjeta Flotante Principal */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5  flex flex-col items-center justify-center p-8 text-center rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl">
                <div className="w-20 h-20 bg-gradient-to-tr from-orange-400 via-pink-500 to-purple-500 rounded-full p-1 mb-6">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                    <img src="/logo.png" alt="SwiftDrop" />
                  </div>
                </div>

                <h3 className="text-white text-2xl mb-1 italic">SwiftDrop</h3>
                <p className="text-zinc-500 text-sm mb-6 uppercase tracking-widest">Cultura de Grada</p>

                <div className="grid grid-cols-2 gap-4 w-full border-t border-white/10 pt-6">
                  {/* <div>
                    <p className="text-white text-xl">+10k</p>
                    <p className="text-zinc-500 text-xs">Hinchas</p>
                  </div> */}
                  <div>
                    <p className="text-white text-xl">Nuevos</p>
                    <p className="text-zinc-500 text-xs">Drops</p>
                  </div>
                </div>
              </div>

              {/* Badge Flotante "Community" */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4  shadow-xl flex items-center gap-3 -rotate-6 animate-bounce [animation-duration:3s]">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-zinc-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="fan" />
                    </div>
                  ))}
                </div>
                <div className="pr-2">
                  <p className="text-[10px] text-zinc-500 uppercase">Únete a</p>
                  <p className="text-sm text-black font-black leading-tight italic">LA GRADA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
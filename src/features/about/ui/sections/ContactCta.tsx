"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@heroui/react";

export function ContactCta() {
  return (
    <section className="py-16 md:py-24">
      <div className="bg-black rounded-3xl p-12 md:p-16 text-center">
        <MessageCircle className="mx-auto mb-6 text-white" size={48} strokeWidth={1} />
        <h3 className="text-3xl md:text-4xl text-white mb-4">
          ¿Quieres trabajar con nosotros?
        </h3>
        <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
          Siempre estamos buscando talento y nuevas oportunidades de colaboración. Contacta con nosotros para conocer más sobre nuestras ofertas de trabajo y alianzas.
        </p>
        <Button
          as="a"
          href="https://wa.me/1234567890"
          radius="full"
          size="lg"
          className="bg-white text-black px-10"
        >
          Enviar mensaje
        </Button>
      </div>
    </section>
  );
}

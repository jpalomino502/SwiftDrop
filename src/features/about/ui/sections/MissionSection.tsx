"use client";

import { Zap, Rocket, Award } from "lucide-react";

export function MissionSection() {
  const items = [
    {
      icon: Zap,
      title: "Nuestra Misión",
      description: "Revolucionar la distribución de repuestos automotrices en Bucaramanga mediante tecnología innovadora y entregas ultrarrápidas que superen las expectativas de nuestros clientes.",
    },
    {
      icon: Rocket,
      title: "Nuestra Visión",
      description: "Ser la plataforma líder de logística multimodal en Colombia, expandiendo nuestro servicio a todo el país y estableciendo nuevos estándares de rapidez y confiabilidad.",
    },
    {
      icon: Award,
      title: "Nuestros Valores",
      description: "Velocidad, transparencia, confiabilidad e innovación. Cada decisión que tomamos se alinea con estos principios para garantizar la mejor experiencia a nuestros clientes.",
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="space-y-8 md:space-y-12">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-6 md:gap-8">
            <div className="flex-shrink-0">
              <div className="rounded-full bg-gray-100 p-4">
                <item.icon size={28} strokeWidth={1.5} />
              </div>
            </div>
            <div className="flex-grow">
              <h3 className="text-2xl md:text-3xl mb-3">
                {item.title}
              </h3>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

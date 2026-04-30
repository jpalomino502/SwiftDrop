"use client";

import { Zap, Brain, MapPin, Monitor, Bell, Lock } from "lucide-react";

const technologies = [
  {
    title: "Drones de Entrega",
    description: "Flotas de drones autónomos de última generación para entregas ultrarrápidas en Bucaramanga.",
    icon: Zap,
  },
  {
    title: "Algoritmo IA",
    description: "Sistema inteligente que optimiza rutas y asigna el mejor medio de transporte para cada pedido.",
    icon: Brain,
  },
  {
    title: "Seguimiento GPS",
    description: "Rastreo en tiempo real de todas tus entregas con precisión de metros.",
    icon: MapPin,
  },
  {
    title: "Plataforma Web",
    description: "Interfaz moderna y responsive para una experiencia de compra sin fricciones.",
    icon: Monitor,
  },
  {
    title: "Notificaciones SMS",
    description: "Actualizaciones instantáneas sobre el estado de tu pedido directamente en tu celular.",
    icon: Bell,
  },
  {
    title: "Pagos Seguros",
    description: "Integración con las principales pasarelas de pago con encriptación de nivel bancario.",
    icon: Lock,
  },
];

export function TechSection() {
  return (
    <section className="py-16 md:py-24 border-t border-gray-200">
      <div className="mb-12 md:mb-16">
        <h2 className="text-4xl md:text-5xl mb-4">
          Tecnología
        </h2>
        <p className="text-base md:text-lg text-gray-600">
          Innovación en cada aspecto
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {technologies.map((tech, index) => (
          <div key={index} className="flex flex-col">
            <div className="rounded-full bg-gray-100 p-3 w-fit mb-4">
              <tech.icon size={24} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-medium mb-2">
              {tech.title}
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              {tech.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

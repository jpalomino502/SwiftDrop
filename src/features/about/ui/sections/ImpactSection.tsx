"use client";

const impacts = [
  {
    number: "50,000+",
    label: "Entregas Completadas",
    description: "Millones de kilómetros recorridos sin comprometer la calidad",
  },
  {
    number: "35,000+",
    label: "Clientes Satisfechos",
    description: "Personas que confían en SwiftDrop para sus necesidades",
  },
  {
    number: "4.8★",
    label: "Calificación Promedio",
    description: "Reconocimiento de la excelencia en servicio",
  },
  {
    number: "60 min",
    label: "Tiempo de Entrega",
    description: "Promedio de entrega en Bucaramanga y área metropolitana",
  },
];

export function ImpactSection() {
  return (
    <section className="py-16 md:py-24 bg-black rounded-2xl px-8 md:px-16">
      <div className="mb-12 md:mb-16 text-center">
        <h2 className="text-4xl md:text-5xl text-white">
          Nuestro Impacto
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
        {impacts.map((impact, index) => (
          <div key={index} className="text-center text-white">
            <p className="text-4xl md:text-5xl font-medium mb-3">
              {impact.number}
            </p>
            <p className="text-sm font-medium mb-2">
              {impact.label}
            </p>
            <p className="text-sm text-white/70">
              {impact.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

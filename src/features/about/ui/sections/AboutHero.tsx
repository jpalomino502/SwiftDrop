"use client";

export function AboutHero() {
  return (
    <section className="px-0 md:px-12">
      <div className="relative h-[50vh] overflow-hidden bg-black">
        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-8 md:px-12 text-white">
          <div className="max-w-3xl">
            <h1 className="mb-8 text-5xl md:text-7xl">
              Acerca de <br />
              SwiftDrop
            </h1>
            <p className="text-lg text-white/80 max-w-xl leading-relaxed">
              Desde 2023, revolucionamos la distribución de repuestos automotrices en Bucaramanga mediante tecnología innovadora, entregas ultrarrápidas y un servicio de excelencia.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

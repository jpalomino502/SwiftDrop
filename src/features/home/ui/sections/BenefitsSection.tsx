import { Award, RefreshCw, Truck } from "lucide-react";

export function BenefitsSection() {
  return (
    <section className="border-t border-gray-100 py-20">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 rounded-full bg-gray-50 p-4">
            <Truck size={24} strokeWidth={1} />
          </div>
          <h5 className="mb-2 text-sm font-normal  ">
            Envío Gratuito
          </h5>
          <p className="text-xs font-normal  text-gray-500">
            En todos los pedidos superiores a 150.000 COP.
          </p>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="mb-6 rounded-full bg-gray-50 p-4">
            <Award size={24} strokeWidth={1} />
          </div>
          <h5 className="mb-2 text-sm font-normal  ">
            Calidad Premium
          </h5>
          <p className="text-xs font-normal  text-gray-500">
            Materiales certificados y producción ética controlada.
          </p>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="mb-6 rounded-full bg-gray-50 p-4">
            <RefreshCw size={24} strokeWidth={1} />
          </div>
          <h5 className="mb-2 text-sm font-normal  ">
            Devoluciones Fáciles
          </h5>
          <p className="text-xs font-normal  text-gray-500">
            Dispones de 30 días para realizar cualquier cambio o devolución.
          </p>
        </div>
      </div>
    </section>
  );
}

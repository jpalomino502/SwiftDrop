import Link from "next/link";

export default function OrderCheckingPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <span className="text-amber-500 text-xl">⏳</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Verificando tu pago</h1>
        <p className="text-gray-600 text-sm mb-6">
          Estamos confirmando el estado de tu transacción con ePayco. Si el pago fue aprobado, tu pedido se actualizará automáticamente en unos segundos.
        </p>
        <div className="space-y-3">
          <Link
            href="/profile/orders"
            className="block w-full rounded-xl bg-gray-900 text-white py-3 font-medium hover:bg-gray-800 transition-colors text-center"
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/"
            className="block w-full rounded-xl bg-white text-gray-700 border border-gray-300 py-3 font-medium hover:bg-gray-50 transition-colors text-center"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

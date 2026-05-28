"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";
import { useAdminAccess } from "@/src/features/admin/ui/client/useAdminAccess";

type EpaycoLog = {
  id: string;
  order_id: string | null;
  ref_payco: string | null;
  query_params: Record<string, string>;
  validation_response: Record<string, unknown> | null;
  created_at: string;
};

export default function EpaycoLogsPage() {
  const access = useAdminAccess();
  const [logs, setLogs] = useState<EpaycoLog[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (access.status !== "ready") return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("epayco_callback_logs")
      .select("id,order_id,ref_payco,query_params,validation_response,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error) setLogs((data ?? []) as EpaycoLog[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access.status]);

  if (access.status !== "ready") {
    return (
      <div className="bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-normal">Logs ePayco</h2>
        <p className="mt-2 text-sm text-gray-600">Acceso restringido.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-normal">Logs ePayco Callback</h2>
            <p className="text-sm text-gray-500 font-light mt-1">
              Parámetros recibidos en cada redirección de ePayco.
            </p>
          </div>
        </div>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500">Cargando…</p>}

      {!loading && logs.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">No hay logs registrados todavía.</p>
        </div>
      )}

      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString("es-CO")}</p>
                <p className="text-sm font-medium mt-1">
                  Order: {log.order_id ? log.order_id.slice(0, 8) : "—"} | Ref: {log.ref_payco || "—"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Query Params</p>
                <pre className="text-[10px] text-gray-700 overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(log.query_params, null, 2)}
                </pre>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Validation API Response</p>
                <pre className="text-[10px] text-gray-700 overflow-auto whitespace-pre-wrap">
                  {log.validation_response ? JSON.stringify(log.validation_response, null, 2) : "No consultado"}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

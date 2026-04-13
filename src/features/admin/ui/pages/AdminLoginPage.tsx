"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Card, CardBody, CardHeader } from "@heroui/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient, getSupabaseMissingEnvMessage } from "@/src/lib/supabase/browser";

export function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason === "forbidden") {
      setError("Tu usuario no tiene permisos de administrador.");
      return;
    }
    if (reason === "session") {
      setError("Tu sesion expiro o no esta activa. Inicia sesion nuevamente.");
    }
  }, [searchParams]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        const msg = getSupabaseMissingEnvMessage();
        throw new Error(msg || "Supabase no configurado");
      }

      // Intentar login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        throw new Error("No se pudo validar la sesion.");
      }

      const { data: adminRow, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id,disabled_at")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (adminError || !adminRow || adminRow.disabled_at) {
        await supabase.auth.signOut();
        throw new Error("Tu usuario no tiene permisos de administrador.");
      }

      // Solo navegamos si el usuario realmente tiene permisos admin.
      router.replace("/admin");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-white/70" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden overflow-hidden border-r border-white/10 lg:block">
          <img
            src="/assets/banner.jpeg"
            alt="SwiftDrop"
            className="h-full w-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/45 to-black/20" />
          <div className="absolute inset-x-0 bottom-0 p-10">
            <p className="mb-3 text-xs tracking-[0.25em] text-white/70">SwiftDrop</p>
            <h2 className="text-4xl font-semibold leading-tight text-white">
              Panel privado
              <br />
              para el equipo admin.
            </h2>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-8">
          <Card className="w-full max-w-md border border-white/10 bg-white text-neutral-900 shadow-2xl">
            <CardHeader className="flex flex-col items-center gap-4 px-7 pt-8">
              <img src="/logo.png" alt="Tribuna 90" className="h-14 w-14 object-contain" />
              <div className="text-center">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">Admin Access</p>
                <h1 className="mt-2 text-3xl font-semibold text-neutral-900">Inicia sesion</h1>
                <p className="mt-2 text-sm text-neutral-500">Usa tu cuenta autorizada para entrar al dashboard.</p>
              </div>
            </CardHeader>

            <CardBody className="gap-5 px-7 pb-8">
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-600">Email</label>
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    isClearable
                    onClear={() => setEmail("")}
                    variant="bordered"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-600">Contrasena</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      variant="bordered"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-800 disabled:opacity-50"
                      aria-label="Mostrar u ocultar contrasena"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  isLoading={isLoading}
                  disabled={isLoading || !email || !password}
                  className="mt-2 bg-neutral-900 text-white hover:bg-neutral-800"
                >
                  {isLoading ? "Ingresando..." : "Entrar al panel"}
                </Button>
              </form>

              <p className="text-center text-[11px] uppercase tracking-[0.08em] text-neutral-400">
                Solo administradores autorizados
              </p>
            </CardBody>
          </Card>
        </section>
      </div>
    </div>
  );
}

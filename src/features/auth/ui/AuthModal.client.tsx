"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader2, X } from "lucide-react";

import {
  getSupabaseBrowserClient,
  getSupabaseMissingEnvMessage,
} from "@/src/lib/supabase/browser";

type AuthMode = "login" | "register";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const variants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 6 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -6 },
    }),
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSuccess("");
  }, [isOpen, authMode]);

  const handleInputChange = (
    key: keyof typeof formData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const dismissError = () => setError("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      setError(getSupabaseMissingEnvMessage());
      return;
    }

    try {
      const email = formData.email.trim().toLowerCase();
      const password = formData.password;

      if (!email) throw new Error("El email es obligatorio.");
      if (!password || password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres.");
      }

      if (authMode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        onClose();
        return;
      }

      // register
      const fullName = formData.fullName.trim();
      if (!fullName) throw new Error("Tu nombre es obligatorio.");
      if (formData.confirmPassword !== password) {
        throw new Error("Las contraseñas no coinciden.");
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (signUpError) throw signUpError;

      // Supabase puede requerir confirmación por email: si no hay sesión, mostramos mensaje.
      if (!data.session) {
        setSuccess("Cuenta creada. Revisa tu correo para confirmar el acceso.");
        return;
      }

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="md"
      placement="center"
      hideCloseButton
      backdrop="blur"
      scrollBehavior="inside"
    >
      <ModalContent className=" w-full h-fit max-w-sm sm:max-w-md">
        <ModalHeader className="sm:pt-8 relative flex items-center text-center font-normal justify-center pt-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={authMode}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl text-black mb-2">
                {authMode === "login" ? "Bienvenido de vuelta" : "Crear cuenta"}
              </h2>
              <p className="text-black text-sm">
                {authMode === "login"
                  ? "Inicia sesión para continuar"
                  : "Regístrate para empezar"}
              </p>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={() => onClose()}
            className="absolute right-3 top-4 sm:right-4 sm:top-6 text-black/60 hover:text-black hover:bg-black/5 z-10 rounded-full p-1.5 sm:p-2 transition-colors"
            aria-label="Cerrar"
            type="button"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </ModalHeader>

        <ModalBody className="px-0 pb-5 sm:pb-8">
          {error && (
            <div className="mb-4 sm:mb-6 mx-5 sm:mx-8 p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs sm:text-sm rounded relative">
              <button
                onClick={dismissError}
                className="absolute right-2 top-2 text-red-500 hover:text-red-700 transition-colors"
                aria-label="Cerrar error"
                type="button"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              <div className="font-medium">Error</div>
              <div className="pr-4 sm:pr-6">{error}</div>
            </div>
          )}

          {success && (
            <div className="mb-4 sm:mb-6 mx-5 sm:mx-8 p-3 sm:p-4 bg-green-50 border-l-4 border-green-500 text-green-800 text-xs sm:text-sm rounded">
              <div className="font-medium">Listo</div>
              <div>{success}</div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={authMode}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.2 }}
            >
              <form
                onSubmit={handleSubmit}
                className="px-5 sm:px-8 space-y-4 sm:space-y-5"
              >
                {authMode === "register" && (
                  <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
                    <Input
                      id="fullName"
                      type="text"
                      label="Nombre"
                      labelPlacement="inside"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      size="md"
                      radius="full"
                      classNames={{
                        inputWrapper:
                          "bg-zinc-100 data-[hover=true]:bg-zinc-100 data-[focus=true]:bg-zinc-100 group-data-[focus=true]:bg-zinc-100",
                      }}
                      required
                    />
                  </div>
                )}

                <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
                  <Input
                    id="email"
                    type="email"
                    label="Email"
                    labelPlacement="inside"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    size="md"
                    radius="full"
                    classNames={{
                      inputWrapper:
                        "bg-zinc-100 data-[hover=true]:bg-zinc-100 data-[focus=true]:bg-zinc-100 group-data-[focus=true]:bg-zinc-100",
                    }}
                    required
                  />
                </div>

                <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    label="Contraseña"
                    labelPlacement="inside"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    endContent={
                      <div className="flex items-center h-full">
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="text-black/40 hover:text-black transition-colors"
                          aria-label={showPassword ? "Ocultar" : "Mostrar"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                          ) : (
                            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                        </button>
                      </div>
                    }
                    size="md"
                    radius="full"
                    classNames={{
                      inputWrapper:
                        "bg-zinc-100 data-[hover=true]:bg-zinc-100 data-[focus=true]:bg-zinc-100 group-data-[focus=true]:bg-zinc-100",
                    }}
                    required
                  />
                </div>

                {authMode === "register" && (
                  <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      label="Confirmar contraseña"
                      labelPlacement="inside"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      endContent={
                        <div className="flex items-center h-full">
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="text-black/40 hover:text-black transition-colors"
                            aria-label={showConfirmPassword ? "Ocultar" : "Mostrar"}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                          </button>
                        </div>
                      }
                      size="md"
                      radius="full"
                      classNames={{
                        inputWrapper:
                          "bg-zinc-100 data-[hover=true]:bg-zinc-100 data-[focus=true]:bg-zinc-100 group-data-[focus=true]:bg-zinc-100",
                      }}
                      required
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  radius="full"
                  className="bg-black text-white w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2" />
                  ) : null}
                  {authMode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                </Button>
              </form>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-black/60 text-xs sm:text-sm">
              {authMode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
              <button
                type="button"
                onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                className="text-black hover:text-black/70 transition-colors"
              >
                {authMode === "login" ? "Regístrate" : "Inicia sesión"}
              </button>
            </p>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";

interface CheckoutAuthProps {
    onAuthSuccess: (user: any, details?: { name: string; phone: string; email: string }) => void;
}

type AuthMode = "register" | "login";

export function CheckoutAuth({ onAuthSuccess }: CheckoutAuthProps) {
    const [mode, setMode] = useState<AuthMode>("register");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    const handleInputChange = (key: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        if (error) setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
            setError("Error de configuración del sistema.");
            setIsLoading(false);
            return;
        }

        try {
            const email = formData.email.trim().toLowerCase();
            const password = formData.password;

            if (!email || !password) throw new Error("Por favor completa todos los campos requeridos.");

            if (mode === "register") {
                const fullName = formData.fullName.trim();
                const phone = formData.phone.trim();

                if (!fullName) throw new Error("Tu nombre es obligatorio.");
                if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
                if (formData.confirmPassword !== password) throw new Error("Las contraseñas no coinciden.");

                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            phone: phone,
                        },
                    },
                });

                if (signUpError) throw signUpError;

                if (data.user) {
                    // If session is established (no email confirm required or auto-sign in)
                    if (data.session) {
                        onAuthSuccess(data.user, { name: fullName, phone, email });
                    } else {
                        // If email confirmation is required, we might still want to proceed or show a message
                        // For this flow, we'll assume we want to let them proceed if possible,
                        // or show a success message.
                        // But usually for checkout, we want immediate access.
                        // If the project requires email confirmation, this might be a blocker.
                        // Assuming default supabase behavior might sign them in if email confirm is disabled.
                        // If not, we should probably warn them.
                        // Let's assume for now we treat it as success but maybe with a warning if no session.
                        // Actually, if no session, we can't proceed to checkout as authenticated user.
                        if (!data.session && !data.user.identities?.length) {
                            setError("Error al crear cuenta. El correo ya podría estar registrado.");
                            return;
                        }
                        if (!data.session) {
                            setError("Cuenta creada. Por favor verifica tu correo para continuar.");
                            return;
                        }
                    }
                }
            } else {
                // Login
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                if (data.session) {
                    // We don't have name/phone from login response metadata easily unless we fetch profile.
                    // But verify if we need to fetch it. The parent component loads address on mount.
                    // So we can just call onSuccess.
                    onAuthSuccess(data.user);
                }
            }
        } catch (err: any) {
            setError(err.message || "Ocurrió un error inesperado.");
        } finally {
            setIsLoading(false);
        }
    };

    const variants = {
        hidden: { opacity: 0, x: mode === "login" ? -20 : 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: mode === "login" ? 20 : -20 },
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white p-6 sm:p-8  shadow-sm border border-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-medium mb-2">
                    {mode === "register" ? "¿Eres nuevo por aquí?" : "¡Hola de nuevo!"}
                </h2>
                <p className="text-gray-500 text-sm">
                    {mode === "register"
                        ? "Crea una cuenta para completar tu compra más rápido."
                        : "Inicia sesión para usar tus direcciones guardadas."}
                </p>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={mode}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={variants}
                    transition={{ duration: 0.2 }}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === "register" && (
                            <>
                                <Input
                                    label="Nombre completo"
                                    placeholder="Juan Pérez"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                                    radius="full"
                                    classNames={{
                                        inputWrapper: "bg-gray-50 border-transparent hover:bg-gray-100 focus-within:bg-white focus-within:ring-2 ring-black",
                                    }}
                                />
                                <div className="grid grid-cols-1 gap-4">
                                    <Input
                                        label="Teléfono"
                                        placeholder="300 123 4567"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                        radius="full"
                                        classNames={{
                                            inputWrapper: "bg-gray-50 border-transparent hover:bg-gray-100 focus-within:bg-white focus-within:ring-2 ring-black",
                                        }}
                                    />
                                </div>
                            </>
                        )}

                        <Input
                            type="email"
                            label="Correo electrónico"
                            placeholder="juan@ejemplo.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            radius="full"
                            classNames={{
                                inputWrapper: "bg-gray-50 border-transparent hover:bg-gray-100 focus-within:bg-white focus-within:ring-2 ring-black",
                            }}
                        />

                        <Input
                            type={showPassword ? "text" : "password"}
                            label="Contraseña"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => handleInputChange("password", e.target.value)}
                            radius="full"
                            endContent={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            }
                            classNames={{
                                inputWrapper: "bg-gray-50 border-transparent hover:bg-gray-100 focus-within:bg-white focus-within:ring-2 ring-black",
                            }}
                        />

                        {mode === "register" && (
                            <Input
                                type={showConfirmPassword ? "text" : "password"}
                                label="Confirmar contraseña"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                radius="full"
                                endContent={
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                }
                                classNames={{
                                    inputWrapper: "bg-gray-50 border-transparent hover:bg-gray-100 focus-within:bg-white focus-within:ring-2 ring-black",
                                }}
                            />
                        )}

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                        <Button
                            type="submit"
                            className="w-full bg-black text-white font-medium shadow-lg hover:shadow-xl transition-shadow"
                            size="lg"
                            radius="full"
                            isLoading={isLoading}
                        >
                            {mode === "register" ? "Crear cuenta y continuar" : "Iniciar sesión"}
                        </Button>
                    </form>
                </motion.div>
            </AnimatePresence>

            <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                    {mode === "register" ? "¿Ya tienes una cuenta?" : "¿No tienes cuenta aún?"}{" "}
                    <button
                        onClick={() => {
                            setMode(mode === "register" ? "login" : "register");
                            setError("");
                        }}
                        className="text-black font-medium hover:underline focus:outline-none"
                    >
                        {mode === "register" ? "Inicia sesión" : "Regístrate"}
                    </button>
                </p>
            </div>
        </div>
    );
}

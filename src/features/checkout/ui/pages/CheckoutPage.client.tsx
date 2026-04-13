"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@heroui/react";
import { createOrder } from "../../actions/placeOrder";
import { getCustomerAddress } from "../../actions/getCustomerAddress";
import { useCart } from "@/src/features/cart";
import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";
import { CheckoutAuth } from "../components/CheckoutAuth.client";
import { formatCOP } from "@/src/shared/presentation/ui";

interface Address {
    name: string;
    phone: string;
    email: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
}

export function CheckoutPage() {
    const router = useRouter();
    const { items, subtotal, clear } = useCart();
    const estimatedShippingMin = 1010000;
    const estimatedShippingMax = 2810000;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    // Auth state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const [address, setAddress] = useState<Address>({
        name: "",
        phone: "",
        email: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "CO",
    });

    // Check auth status
    useEffect(() => {
        const checkAuth = async () => {
            const supabase = getSupabaseBrowserClient();
            if (!supabase) {
                setIsAuthLoading(false);
                return;
            }
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);
            setIsAuthLoading(false);
        };
        checkAuth();
    }, []);

    useEffect(() => {
        if (items.length === 0 && !orderSuccess) {
            router.push("/catalog");
        }
    }, [items, router, orderSuccess]);

    // Load saved address and profile
    useEffect(() => {
        if (!isAuthenticated) return;

        const loadAddress = async () => {
            const data = await getCustomerAddress();
            if (data) {
                setAddress((prev) => ({
                    ...prev,
                    email: data.email || prev.email,
                    name: data.name || prev.name,
                    phone: data.phone || prev.phone,
                    ...(data.address ? {
                        name: data.address.name || data.name || "",
                        phone: data.address.phone || data.phone || "",
                        line1: data.address.line1 || "",
                        line2: data.address.line2 || "",
                        city: data.address.city || "",
                        state: data.address.region || "",
                        postal_code: data.address.postal_code || "",
                        country: data.address.country || "CO",
                    } : {})
                }));
            }
        };
        loadAddress();
    }, [isAuthenticated]);

    const handleAuthSuccess = (user: any, details?: { name: string; phone: string; email: string }) => {
        setIsAuthenticated(true);
        if (details) {
            setAddress(prev => ({
                ...prev,
                name: details.name,
                phone: details.phone,
                email: details.email
            }));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setAddress((prev) => ({ ...prev, [name]: value }));
    };

    const handleUseMyLocation = async () => {
        setGeoLoading(true);
        if (!navigator.geolocation) {
            alert("Tu navegador no soporta geolocalización");
            setGeoLoading(false);
            return;
        }

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                });
            });

            const { latitude, longitude } = position.coords;
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();

            if (data.address) {
                setAddress((prev) => ({
                    ...prev,
                    line1: `${data.address.road || ""} ${data.address.house_number || ""}`.trim(),
                    city: data.address.city || data.address.town || data.address.village || "",
                    state: data.address.state || "",
                    postal_code: data.address.postcode || "",
                    country: data.address.country_code?.toUpperCase() || "CO",
                }));
            }
        } catch (error: any) {
            console.error("[v0] Error getting location:", {
                code: error.code,
                message: error.message,
                errorObject: error
            });

            // Geolocation codes: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
            // We use raw numbers to avoid dependency on global GeolocationPositionError type availability
            if (error.code === 1) {
                alert("Permiso denegado para obtener ubicación. Por favor habilitalo en tu navegador.");
            } else if (error.code === 2) {
                alert("La ubicación no está disponible actualmente.");
            } else if (error.code === 3) {
                alert("Se agotó el tiempo de espera para obtener la ubicación.");
            } else {
                alert("Ocurrió un error al intentar obtener tu ubicación.");
            }
        } finally {
            setGeoLoading(false);
        }

    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const orderData = {
                items: items.map((item) => ({
                    id: item.id,
                    productId: item.productId,
                    title: item.title,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    imageUrl: item.imageUrl,
                    size: item.size,
                    color: item.color,
                })),
                email: address.email,
                address: {
                    name: address.name,
                    phone: address.phone,
                    line1: address.line1,
                    line2: address.line2,
                    city: address.city,
                    region: address.state,
                    postal_code: address.postal_code,
                    country: address.country,
                },
            };

            console.log("[Checkout] Submitting order...", orderData);
            const result = await createOrder(orderData);
            console.log("[Checkout] createOrder result:", result);

            if (result.success && result.orderId) {
                setOrderSuccess(true);
                console.log("[Checkout] Order created successfully, redirecting to:", `/order/success/${result.orderId}`);
                clear();
                router.push(`/order/success/${result.orderId}`);
            } else {
                console.error("[Checkout] Order creation failed:", result);
                alert(result.error || "Error al crear la orden");
            }
        } catch (error) {
            console.error("[v0] Error submitting order:", error);
            alert("Error al procesar el pedido");
        } finally {
            setIsSubmitting(false);
        }
    };



    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-sm text-gray-500 hover:text-black mb-8 transition-colors"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Volver
                </button>

                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl mb-4">Finalizar compra</h1>
                    <p className="text-gray-600">Completa tus datos para recibir tu pedido</p>
                </div>

                {isAuthLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
                    </div>
                ) : !isAuthenticated ? (
                    <div className="max-w-md mx-auto py-8">
                        <CheckoutAuth onAuthSuccess={handleAuthSuccess} />
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Formulario */}
                        <div>
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Información Personal */}
                                <div>
                                    <h2 className="text-xl mb-6">Información de contacto</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm text-gray-600 mb-2">
                                                Nombre completo
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                required
                                                value={address.name}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                                placeholder="Juan Pérez"
                                            />
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="email" className="block text-sm text-gray-600 mb-2">
                                                    Correo electrónico
                                                </label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    required
                                                    value={address.email}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                                    placeholder="juan@email.com"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="phone" className="block text-sm text-gray-600 mb-2">
                                                    Teléfono
                                                </label>
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    name="phone"
                                                    required
                                                    value={address.phone}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                                    placeholder="3001234567"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Dirección de Envío */}
                                <div>
                                    <h2 className="text-xl mb-6">Dirección de envío</h2>

                                    <button
                                        type="button"
                                        onClick={handleUseMyLocation}
                                        disabled={geoLoading}
                                        className="mb-6 flex items-center justify-center w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-black rounded-full transition-colors"
                                    >
                                        {geoLoading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin mr-2" />
                                                Obteniendo ubicación...
                                            </>
                                        ) : (
                                            <>
                                                <MapPin size={18} className="mr-2" />
                                                Usar mi ubicación actual
                                            </>
                                        )}
                                    </button>

                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="line1" className="block text-sm text-gray-600 mb-2">
                                                Dirección (Calle, Carrera, #)
                                            </label>
                                            <input
                                                type="text"
                                                id="line1"
                                                name="line1"
                                                required
                                                value={address.line1}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                                placeholder="Calle 123 # 45-67"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="line2" className="block text-sm text-gray-600 mb-2">
                                                Apartamento, suite, etc. (opcional)
                                            </label>
                                            <input
                                                type="text"
                                                id="line2"
                                                name="line2"
                                                value={address.line2}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                                placeholder="Apto 301"
                                            />
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="city" className="block text-sm text-gray-600 mb-2">
                                                    Ciudad
                                                </label>
                                                <input
                                                    type="text"
                                                    id="city"
                                                    name="city"
                                                    required
                                                    value={address.city}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                                    placeholder="Bogotá"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="state" className="block text-sm text-gray-600 mb-2">
                                                    Departamento
                                                </label>
                                                <input
                                                    type="text"
                                                    id="state"
                                                    name="state"
                                                    required
                                                    value={address.state}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                                    placeholder="Cundinamarca"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="postal_code" className="block text-sm text-gray-600 mb-2">
                                                Código postal
                                            </label>
                                            <input
                                                type="text"
                                                id="postal_code"
                                                name="postal_code"
                                                required
                                                value={address.postal_code}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                                placeholder="110111"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    radius="full"
                                    size="lg"
                                    className="w-full bg-black text-white"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin mr-2" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={18} className="mr-2" />
                                            Confirmar pedido
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>

                        {/* Resumen del Pedido */}
                        <div>
                            <div className="bg-gray-50  p-8 sticky top-8">
                                <h2 className="text-xl mb-6">Resumen del pedido</h2>

                                <div className="space-y-4 mb-6">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="w-20 h-20 bg-white rounded-xl overflow-hidden shrink-0">
                                                <img
                                                    src={item.imageUrl || "/placeholder.jpg"}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-sm mb-1">{item.title}</h3>
                                                {(item.size || item.color) && (
                                                    <p className="text-xs text-gray-500">
                                                        {item.size && item.size} {item.size && item.color && "/"} {item.color && item.color}
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Cantidad: {item.quantity}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm">
                                                    {formatCOP(item.unitPrice * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-gray-200 pt-6 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span>{formatCOP(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Envío</span>
                                        <span>Se notificará por correo</span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Normalmente entre {formatCOP(estimatedShippingMin)} y {formatCOP(estimatedShippingMax)}.
                                    </p>
                                    <div className="flex justify-between text-lg pt-3 border-t border-gray-200">
                                        <span>Total (sin envío)</span>
                                        <span>{formatCOP(subtotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

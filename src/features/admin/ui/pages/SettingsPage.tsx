"use client";

import { Save } from "lucide-react";
import { Button } from "@heroui/react";

export function SettingsPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-normal">Configuración</h2>
                    <p className="text-sm text-gray-500 font-light mt-1">Configuración general de tu tienda.</p>
                </div>
                <Button
                    size="lg"
                    radius="full"
                    className="bg-black text-white"
                >
                    <Save size={18} />
                    <span>Guardar Cambios</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Brand Info */}
                <div className=" bg-white p-6 shadow-sm space-y-6">
                    <h3 className="text-lg font-normal">Información de Marca</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">Nombre de la Tienda</label>
                            <input
                                type="text"
                                defaultValue="Fashion Brand"
                                className="w-full h-12 px-4  bg-gray-50 border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">Email de Contacto</label>
                            <input
                                type="email"
                                defaultValue="contact@brand.com"
                                className="w-full h-12 px-4  bg-gray-50 border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium ml-1">Descripción de la Tienda</label>
                            <textarea
                                rows={3}
                                defaultValue="Premium fashion for the modern era."
                                className="w-full p-4  bg-gray-50 border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Shipping & Policies */}
                <div className=" bg-white p-6 shadow-sm space-y-6">
                    <h3 className="text-lg font-normal">Envío y Políticas</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4  bg-gray-50">
                            <div>
                                <h4 className="font-medium text-sm">Envío Gratis</h4>
                                <p className="text-xs text-gray-500">Habilitar envío gratis en todas las órdenes</p>
                            </div>
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                                <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4  bg-gray-50">
                            <div>
                                <h4 className="font-medium text-sm">Envío Internacional</h4>
                                <p className="text-xs text-gray-500">Permitir órdenes desde fuera del país</p>
                            </div>
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-black">
                                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

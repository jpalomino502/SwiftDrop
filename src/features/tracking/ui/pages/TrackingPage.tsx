"use client";

import { Input, Button } from "@heroui/react";
import { CheckCircle } from "lucide-react";
import { useState, FormEvent } from "react";

export function TrackingPage() {
    const [orderId, setOrderId] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [orderStatus, setOrderStatus] = useState<any | null>(null);

    const handleSearch = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!orderId) return;
        setIsSearching(true);
        setTimeout(() => {
            setOrderStatus({
                id: orderId.toUpperCase(),
                date: "22 Ene, 2024",
                status: "En tránsito",
                steps: [
                    { label: "Confirmado", date: "22 Ene, 09:15", completed: true },
                    { label: "Procesado", date: "22 Ene, 14:30", completed: true },
                    { label: "En Tránsito", date: "23 Ene, 08:00", completed: true, current: true },
                    { label: "En Reparto", date: "Pendiente", completed: false },
                    { label: "Entregado", date: "Pendiente", completed: false },
                ],
            });
            setIsSearching(false);
        }, 1500);
    };

    return (
        <div className=" pb-24 px-6 max-w-5xl mx-auto min-h-screen">
            <div className="text-center mb-16">
                <h2 className="text-[10px] uppercase tracking-[0.5em] text-gray-400 mb-4">Logística Premium</h2>
                <h1 className="text-5xl md:text-7xl font-normal tracking-tighter mb-8">Rastrea tu Pedido</h1>
                <p className="text-sm text-gray-500 max-w-md mx-auto font-normal leading-relaxed">
                    Introduce tu número de referencia para conocer la ubicación exacta de tu selección.
                </p>
            </div>

            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSearch} className="relative mb-20">
                    <Input
                        value={orderId}
                        onChange={(e: any) => setOrderId(e.target.value)}
                        placeholder="Nº DE PEDIDO (EJ: MN-2024-X)"
                    />
                    <Button
                        type="submit"
                        size="sm"
                        radius="full"
                        className="absolute right-2 top-2 bottom-2 bg-black text-white px-8 rounded-full text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center"
                        onPress={() => { }}
                    >
                        {isSearching ? "Buscando..." : "Rastrear"}
                    </Button>
                </form>

                {orderStatus && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="p-10 border border-gray-100  mb-12 flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="text-center md:text-left">
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Pedido</p>
                                <p className="text-xl font-normal">#{orderStatus.id}</p>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Estado</p>
                                <div className="flex items-center space-x-2">
                                    <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
                                    <p className="text-xl font-normal">{orderStatus.status}</p>
                                </div>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Fecha estimada</p>
                                <p className="text-xl font-normal">25 Ene, 2024</p>
                            </div>
                        </div>

                        <div className="relative px-4">
                            <div className="absolute left-[26px] md:left-1/2 top-0 bottom-0 w-px bg-gray-100 hidden md:block"></div>
                            <div className="space-y-12 relative">
                                {orderStatus.steps.map((step: any, idx: number) => (
                                    <div key={idx} className={`flex items-start md:justify-center relative ${step.completed ? "opacity-100" : "opacity-30"}`}>
                                        <div className="flex flex-col md:flex-row items-start md:items-center w-full md:w-auto">
                                            <div className="hidden md:block w-48 text-right pr-8">
                                                <p className="text-[10px] uppercase tracking-widest text-gray-400">{step.date}</p>
                                            </div>

                                            <div className={`z-10 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${step.current ? "bg-black scale-125" : step.completed ? "bg-gray-800" : "bg-gray-200"}`}>
                                                {step.completed && !step.current && <CheckCircle size={10} className="text-white" />}
                                            </div>

                                            <div className="pl-6 md:pl-8 md:w-48">
                                                <h4 className={`text-sm uppercase tracking-widest ${step.current ? "text-black" : "text-gray-500"}`}>{step.label}</h4>
                                                <p className="md:hidden text-[10px] uppercase tracking-widest text-gray-400 mt-1">{step.date}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

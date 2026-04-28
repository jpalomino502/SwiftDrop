"use client";

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Package, Shield, MessageCircle } from "lucide-react";
import { Button } from "@heroui/react";

export function FaqPage() {
    const [openIndex, setOpenIndex] = useState<string | null>(null);

    const faqs = [
        {
            category: "Logística y Pagos",
            icon: Package,
            questions: [
                {
                    q: "¿Cómo funciona el pago contra entrega?",
                    a: "Es nuestra prioridad darte seguridad. Realizas tu pedido y solo pagas en efectivo o transferencia en el momento exacto en que recibes tu 'armadura' en la puerta de tu casa. Sin pagos adelantados, sin riesgos."
                },
                {
                    q: "¿Cuáles son los tiempos de envío?",
                    a: "Despachamos desde nuestro archivo central. Los envíos suelen tardar entre 24 a 48 horas hábiles en ciudades principales. Recibirás tu número de guía para seguir el rastro de tu drop en tiempo real."
                },
                {
                    q: "¿El pago contra entrega tiene costo extra?",
                    a: "No cobramos comisión por recaudo. El precio que ves es el que pagas al recibir, sumando el envío estándar si tu zona lo requiere."
                }
            ]
        },
        {
            category: "Calidad y Tallaje",
            icon: Shield,
            questions: [
                {
                    q: "¿Qué calidad tienen las camisetas?",
                    a: "Hablamos de calidad Premium (G5/Thai). Telas transpirables, escudos bordados de alta definición y etiquetas de época. Es el equilibrio perfecto entre la nostalgia de los 90 y la tecnología textil actual."
                },
                {
                    q: "¿Versión Fan o Versión Player?",
                    a: "La versión 'Fan' tiene un corte clásico y cómodo para el día a día. La versión 'Player' es un corte atlético (ajustado), diseñada para el rendimiento en cancha. Si prefieres algo holgado en versión player, te recomendamos pedir una talla más."
                }
            ]
        },
        {
            category: "Garantía SwiftDrop",
            icon: HelpCircle,
            questions: [
                {
                    q: "¿Puedo cambiar mi repuesto si llega defectuoso?",
                    a: "Claro. Tienes 7 días desde la recepción para solicitar un cambio o devolución. El repuesto debe estar sin instalar, en su empaque original y sin daños físicos causados por el cliente."
                },
                {
                    q: "¿Qué cubre la garantía de los repuestos?",
                    a: "Cubre cualquier defecto de fabricación. Todos nuestros repuestos son revisados antes de enviarse. Si algo falla por defecto de fábrica, nos hacemos cargo del cambio total del producto."
                }
            ]
        }
    ];

    const toggleFaq = (index: string) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="px-0 md:px-12">
                <section className="w-full">
                    <div className="relative h-[50vh] overflow-hidden md:">
                        <img
                            src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1600&auto=format&fit=crop&q=80"
                            alt="FAQ Hero"
                            className="absolute inset-0 h-full w-full object-cover brightness-[0.7]"
                        />
                        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-8 md:px-12 text-white">
                            <div className="max-w-3xl">
                                <h1 className="mb-8 text-5xl md:text-7xl">
                                    Preguntas <br />
                                    frecuentes
                                </h1>
                                <p className="text-lg text-white/80 max-w-xl">
                                    Resolvemos tus dudas sobre el Archivo 90s y nuestra logística de seguridad.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* FAQ Content */}
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="space-y-16">
                    {faqs.map((cat, catIdx) => (
                        <div key={catIdx}>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="rounded-full bg-gray-50 p-3">
                                    <cat.icon size={20} strokeWidth={1.5} />
                                </div>
                                <h2 className="text-2xl">{cat.category}</h2>
                            </div>

                            <div className="space-y-3">
                                {cat.questions.map((faq, faqIdx) => {
                                    const globalIdx = `${catIdx}-${faqIdx}`;
                                    const isOpen = openIndex === globalIdx;

                                    return (
                                        <div
                                            key={faqIdx}
                                            className=" overflow-hidden"
                                        >
                                            <button
                                                onClick={() => toggleFaq(globalIdx)}
                                                className="w-full px-6 py-5 flex items-center justify-between text-left bg-white hover:bg-gray-50 transition-colors"
                                            >
                                                <span className="text-base pr-4">
                                                    {faq.q}
                                                </span>
                                                <ChevronDown
                                                    className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                                    size={20}
                                                />
                                            </button>

                                            {isOpen && (
                                                <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed bg-gray-50 border-t border-gray-100">
                                                    {faq.a}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact CTA */}
                <div className="mt-24 bg-black rounded-[2.5rem] p-12 md:p-16 text-center">
                    <MessageCircle className="mx-auto mb-6 text-white" size={48} strokeWidth={1} />
                    <h3 className="text-3xl md:text-4xl text-white mb-4">
                        ¿Aún tienes dudas?
                    </h3>
                    <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                        Nuestro equipo de soporte técnico y asesores de talla están listos para ayudarte a elegir la mejor opción para tu colección.
                    </p>
                    <Button
                        as="a"
                        href="https://wa.me/1234567890"
                        radius="full"
                        size="lg"
                        className="bg-white text-black px-10"
                    >
                        Contactar soporte
                    </Button>
                </div>
            </div>
        </div>
    );
}

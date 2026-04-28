"use client";

import { BlogCard } from "../components/BlogCard";

export function BlogPage() {
    const posts = [
        {
            title: "Guía completa de cambio de aceite en tu vehículo",
            excerpt: "Aprende los pasos esenciales para cambiar el aceite de tu auto y mantener el motor en óptimas condiciones.",
            date: "24 Ene, 2024",
            category: "Mantenimiento",
            imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2000&auto=format&fit=crop",
        },
        {
            title: "5 piezas de repuesto que todo motorista debe tener",
            excerpt: "Los repuestos más importantes que deberías tener a mano para emergencias en el camino.",
            date: "20 Ene, 2024",
            category: "Consejos",
            imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2000&auto=format&fit=crop",
        },
        {
            title: "Cómo elegir las pastillas de freno correctas",
            excerpt: "Todo lo que necesitas saber para seleccionar las pastillas de freno adecuadas para tu vehículo.",
            date: "15 Ene, 2024",
            category: "Educación",
            imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2000&auto=format&fit=crop",
        },
        {
            title: "Mantenimiento preventivo: Inspección de neumáticos",
            excerpt: "Descubre cómo mantener tus neumáticos en perfecto estado y alargar su vida útil.",
            date: "10 Ene, 2024",
            category: "Mantenimiento",
            imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2000&auto=format&fit=crop",
        },
    ];

    return (
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold  text-gray-900 sm:text-5xl">Blog SwiftDrop</h1>
                <p className="mt-4 text-base leading-7 text-gray-600">
                    Guías de mantenimiento, consejos de autopartes y tendencias automotrices.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post, index) => (
                    <BlogCard key={index} {...post} />
                ))}
            </div>
        </div>
    );
}

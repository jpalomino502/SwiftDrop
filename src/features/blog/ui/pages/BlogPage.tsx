"use client";

import { BlogCard } from "../components/BlogCard";

export function BlogPage() {
    const posts = [
        {
            title: "La evolución de la ropa deportiva urbana",
            excerpt: "Descubre cómo el estilo deportivo ha conquistado las calles y se ha convertido en un estándar de moda global.",
            date: "24 Ene, 2024",
            category: "Tendencias",
            imageUrl: "https://images.unsplash.com/photo-1556906781-9a412961d289?q=80&w=2000&auto=format&fit=crop",
        },
        {
            title: "Cómo cuidar tus prendas técnicas",
            excerpt: "Guía completa para lavar y mantener tu ropa de entrenamiento para que dure más tiempo.",
            date: "20 Ene, 2024",
            category: "Guías",
            imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2000&auto=format&fit=crop",
        },
        {
            title: "Nueva colección de invierno",
            excerpt: "Presentamos nuestra línea más cálida y versátil hasta la fecha, diseñada para el rendimiento en climas fríos.",
            date: "15 Ene, 2024",
            category: "Lanzamientos",
            imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2000&auto=format&fit=crop",
        },
        {
            title: "Entrevista con atletas locales",
            excerpt: "Hablamos con las promesas del deporte local sobre sus rutinas y su equipamiento favorito.",
            date: "10 Ene, 2024",
            category: "Comunidad",
            imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2000&auto=format&fit=crop",
        },
    ];

    return (
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold  text-gray-900 sm:text-5xl">Tribuna Magazine</h1>
                <p className="mt-4 text-base leading-7 text-gray-600">
                    Noticias, tendencias y cultura deportiva.
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

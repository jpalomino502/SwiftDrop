"use client";

import { ReactNode } from "react";

interface LegalLayoutProps {
    children: ReactNode;
    title: string;
    updateDate: string;
}

export function LegalLayout({ children, title, updateDate }: LegalLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="mb-12 pb-8 border-b border-gray-100">
                    <h1 className="text-4xl md:text-5xl mb-4">{title}</h1>
                    <p className="text-sm text-gray-500">Última actualización: {updateDate}</p>
                </div>
                <div className="prose prose-lg prose-gray max-w-none">
                    {children}
                </div>
            </div>
        </div>
    );
}

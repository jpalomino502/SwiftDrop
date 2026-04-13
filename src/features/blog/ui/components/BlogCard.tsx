"use client";

import { Card, CardBody, CardFooter, Button } from "@heroui/react";
import Link from "next/link";

interface BlogCardProps {
    title: string;
    excerpt: string;
    date: string;
    imageUrl: string;
    category: string;
}

export function BlogCard({ title, excerpt, date, imageUrl, category }: BlogCardProps) {
    return (
        <Card className="h-full border-none shadow-none hover:bg-gray-50 transition-colors" isPressable>
            <div className="aspect-[4/3] relative overflow-hidden  mb-4">
                <img
                    alt={title}
                    className="h-full w-full object-cover"
                    src={imageUrl}
                    loading="lazy"
                />
            </div>
            <CardBody className="p-0 text-left">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold bg-black text-white px-2 py-1 rounded-full">{category}</span>
                    <span className="text-xs text-gray-500">{date}</span>
                </div>
                <h3 className="text-xl font-bold mb-2 leading-tight">{title}</h3>
                <p className="text-gray-500 text-sm line-clamp-2">{excerpt}</p>
            </CardBody>
            <CardFooter className="p-0 pt-4">
                <Button variant="light" className="p-0 h-auto text-sm font-medium hover:bg-transparent justify-start" endContent={<span>&rarr;</span>}>
                    Leer más
                </Button>
            </CardFooter>
        </Card>
    );
}

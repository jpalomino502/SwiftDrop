"use client";

import { Button } from "@heroui/react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function OrderSuccessActions() {
    return (
        <Button
            as={Link}
            href="/catalog"
            radius="full"
            size="lg"
            className="bg-black text-white px-10"
            endContent={<ArrowRight size={18} />}
        >
            <ShoppingBag size={18} />
            Seguir comprando
        </Button>
    );
}

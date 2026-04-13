import type { Metadata } from "next";
import { BlogPage } from "@/src/features/blog";
import { buildStorefrontMetadata } from "@/src/lib/seo";

export const metadata: Metadata = buildStorefrontMetadata({
    title: "Blog",
    description: "Historias, cultura y nostalgia del futbol en el blog de SwiftDrop.",
    path: "/blog",
});

export default function Blog() {
    return <BlogPage />;
}

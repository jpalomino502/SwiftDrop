import type { Metadata } from "next";

const SITE_NAME = "SwiftDrop";

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.tribunanoventa.shop";
}

function toAbsoluteUrl(path: string) {
  return new URL(path, getSiteUrl()).toString();
}

type StorefrontMetadataInput = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
};

export function buildStorefrontMetadata(input: StorefrontMetadataInput): Metadata {
  const fullTitle = `${input.title} | ${SITE_NAME}`;
  const canonical = toAbsoluteUrl(input.path);

  return {
    title: fullTitle,
    description: input.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: fullTitle,
      description: input.description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "es_CO",
      type: "website",
      images: [
        {
          url: toAbsoluteUrl("/logo.png"),
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: input.description,
      images: [toAbsoluteUrl("/logo.png")],
    },
    robots: input.noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : undefined,
  };
}

import { Button, Input } from "@heroui/react"
import Link from "next/link"

import type { HeaderCategoryNode } from "@/src/lib/supabase/ssr"

interface SiteFooterProps {
  categories?: HeaderCategoryNode[]
}

export function SiteFooter({ categories = [] }: SiteFooterProps) {
  return (
    <div>
      <footer className="bg-black text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">

          {/* Top */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-16">

            {/* Brand */}
            <div className="sm:col-span-2 md:col-span-1">
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-3 text-lg md:text-xl"
              >
                <img src="/logo.png" alt="Tribuna 90" width={44} height={44} />
                <span className="font-(family-name:--font-bebas-neue) text-2xl tracking-wide">Tribuna 90</span>
              </Link>
              <p className="text-sm text-white/60 max-w-sm">
                Moda contemporánea para quienes buscan un estilo auténtico y atemporal.
              </p>
            </div>

            {/* Tienda */}
            <FooterColumn
              title="Tienda"
              items={[
                { label: "Todo", href: "/catalog" },
                ...categories.slice(0, 6).map((c) => ({
                  label: c.name,
                  href: `/catalog?cat=${encodeURIComponent(c.name)}`,
                })),
              ]}
            />

            {/* Ayuda */}
            <FooterColumn
              title="Ayuda"
              items={[
                { label: "FAQ", href: "/faq" },
                { label: "Privacidad", href: "/legal/privacy" },
                { label: "Términos", href: "/legal/terms" }
              ]}
            />
          </div>

          {/* Newsletter */}
          <div className="border-t border-white/10 pt-12 mb-12">
            <div className="max-w-md">
              <h4 className="text-base md:text-lg mb-2 text-white">
                Únete a nuestra newsletter
              </h4>
              <p className="text-sm text-white/60 mb-5">
                Recibe novedades, acceso anticipado y ofertas exclusivas.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  radius="full"
                  size="lg"
                  placeholder="Tu email"
                  classNames={{
                    input: "text-white placeholder:text-white/50",
                    inputWrapper: "bg-white/10 hover:bg-white/20 group-data-[focus=true]:bg-white/20",
                  }}
                />
                <Button
                  radius="full"
                  size="lg"
                  className="bg-white text-black font-medium hover:bg-gray-200">
                  Suscribir
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4 border-t border-white/10 pt-8 text-center md:text-left">
            <p className="text-xs text-neutral-500">
              © 2026 Tribuna 90. Todos los derechos reservados.
            </p>

            <div className="flex gap-6">
              {["Instagram", "Pinterest", "TikTok"].map((social) => (
                <Link
                  key={social}
                  href="#"
                  className="text-xs text-neutral-500 hover:text-white transition-colors"
                >
                  {social}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* Helper component */
function FooterColumn({
  title,
  items,
}: {
  title: string
  items: { label: string; href: string }[]
}) {
  return (
    <div>
      <h4 className="mb-5 text-xs text-neutral-500 font-bold uppercase tracking-wider">
        {title}
      </h4>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

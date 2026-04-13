# Arquitectura — Feature‑Based + Server‑First (Next.js App Router)

> Objetivo: documentar una arquitectura **feature-based** con enfoque **server-first** para un ecommerce en **Next.js (App Router)**. El objetivo práctico es: menos acoplamiento, menos “capas ceremoniales”, y aprovechar RSC/Server Actions para construir UI rápida y segura.

---

## 1) Principios

### Server‑First (por defecto)
- **Todo componente es Server Component** salvo que necesite interacción del navegador.
- Solo usar `"use client"` para UI interactiva (inputs, modales, estados locales, etc.).
- La lectura de datos y reglas de negocio que requieran credenciales/IO se ejecutan en el **servidor** (RSC, Route Handlers, Server Actions).

### Feature‑Based (por defecto)
- Organiza el código por **feature** (catálogo, carrito, órdenes, pagos, identidad), no por “tipo de archivo”.
- Cada feature expone una **API pública** pequeña (exports desde `index.ts`) y oculta detalles internos.

### Regla de dependencias (import rules)

Regla general:

```
app/ (routes)  -> src/features/*
src/features/*/ui         -> src/features/*/server | domain | shared
src/features/*/server     -> src/features/*/domain | shared | lib
src/features/*/domain     -> shared (solo types/utilidades puras)

src/shared -> (no depende de features)
src/lib    -> (infra transversal: db, http, env; no depende de features)
```

Nunca:
- `domain` importando desde Next/React, DB clients, `fetch`, `cookies`, etc.
- Features importándose por rutas profundas de otras features (p. ej. `features/cart/server/…`). Si necesitas algo, expón una función en el `index.ts` público.

### ¿Dónde vive la lógica?
- **`domain/`**: reglas puras, invariantes, value objects, funciones deterministas.
- **`server/`**: acceso a datos (DB/fetch), auth, casos de uso “server”, caching/revalidate.
- **`ui/`**: componentes (Server o Client), presentational + composición.
- **`app/`**: routing de Next, layouts, pages, route handlers; idealmente **thin**.

---

## 2) Estructura recomendada

Estructura base (App Router):

```
app/
  layout.tsx
  page.tsx
  globals.css
  api/
    .../route.ts
  (shop)/
    catalog/page.tsx
    product/[slug]/page.tsx
    cart/page.tsx
    orders/[id]/page.tsx

src/
  features/
    catalog/
      domain/
      server/
      ui/
      index.ts
    cart/
      domain/
      server/
      ui/
      index.ts
    orders/
      domain/
      server/
      ui/
      index.ts
    payments/
      ...
    identity/
      ...

  shared/
    domain/
      errors/
      identifiers/
      money/
      result/
    ui/
      SiteHeader.tsx
      SiteFooter.tsx
      index.ts

  lib/
    env.ts
    http.ts
    db/
      client.ts
```

Notas:
- `src/features/*` agrupa todo lo de la feature (UI + server + domain) para maximizar cohesión.
- `src/shared` es para cosas realmente transversales. Mantenerlo pequeño.
- `src/lib` es infraestructura transversal (DB, env, wrappers de fetch). No contiene reglas de negocio.

---

## 3) Patrón de implementación por feature

### `domain/` (puro)
- No depende de Next, React, ni IO.
- Ideal para invariantes y modelos.

Ejemplo: Value Object `Money` (puro)

```ts
// src/shared/domain/money/Money.ts
export class Money {
  private constructor(
    public readonly amountInCents: number,
    public readonly currency: string,
  ) {
    if (!Number.isInteger(amountInCents) || amountInCents < 0) {
      throw new Error('Money amount must be a non-negative integer (cents)')
    }
    if (!currency || currency.length !== 3) {
      throw new Error('Currency must be ISO 4217 (e.g., "USD")')
    }
  }

  static fromCents(amountInCents: number, currency: string) {
    return new Money(amountInCents, currency.toUpperCase())
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) throw new Error('Currency mismatch')
    return new Money(this.amountInCents + other.amountInCents, this.currency)
  }
}
```

### `server/` (casos de uso + data access)
- Contiene queries/commands del lado servidor.
- Puede usar `cookies()`, `headers()`, DB client, `fetch`, etc.
- Debe ser el lugar donde definimos caching (`cache()`, `unstable_cache`, `revalidateTag`).

Convención práctica:
- `server/queries/*.ts`: lecturas.
- `server/actions/*.ts`: mutaciones (Server Actions).
- `server/repositories/*.ts`: persistencia (si aplica).

### `ui/` (Server Components + Client Components)
- Server Components para páginas/sections: renderizan data ya preparada por `server/`.
- Client Components solo si necesitas estado/handlers/refs (marcar con `"use client"`).

---

## 4) Next.js App Router: reglas específicas

### Data fetching
- Preferir `server` → `ui (server component)`.
- Evitar “fetch en el cliente” salvo que sea estrictamente necesario.

### Server Actions
- Usar Server Actions para mutaciones desde formularios/UX server-first.
- Validación de forma (DTO) en el borde (action/route handler) + invariantes en `domain/`.

### Route Handlers (`app/api/**/route.ts`)
- Útiles para:
  - Integraciones externas (webhooks, callbacks).
  - Clientes que requieran HTTP puro.
  - Casos donde Server Actions no aplica.
- Deben mapear HTTP ↔︎ use-cases en `src/features/*/server`.

### Caching y revalidación
- Definir una estrategia explícita por query (estático, ISR, dinámico).
- Preferir tags por feature (p. ej. `catalog:products`, `cart:user:{id}`).

---

## 5) Convenciones de nombres

### Carpetas
- `kebab-case` para carpetas comunes.
- Features en `src/features/<feature-name>/`.

### Archivos (recomendación pragmática)
- `domain/`:
  - Clases y VOs en PascalCase: `Product.ts`, `Money.ts`.
  - Errores en PascalCase: `InvalidMoneyError.ts`.
- `server/`:
  - Queries/Actions en `camelCase` o `verb-noun` claro: `getCatalogProducts.ts`, `addItemToCart.ts`.
- `ui/`:
  - Componentes React en PascalCase: `CatalogPage.tsx`, `ProductCard.tsx`.
  - Client components con sufijo opcional: `CartDrawer.client.tsx`.

### API pública de cada feature
- Exportar desde `src/features/<feature>/index.ts`.
- Evitar imports profundos cross-feature.

---

## 6) Ejemplos de wiring (App → Feature)

### UI (page server) llamando a una query de feature

```ts
// app/(shop)/catalog/page.tsx
import { CatalogPage } from '@/src/features/catalog'

export default async function Page() {
  return <CatalogPage />
}
```

```ts
// src/features/catalog/index.ts
export { CatalogPage } from './ui/CatalogPage'
```

```ts
// src/features/catalog/ui/CatalogPage.tsx
import { getCatalogProducts } from '../server/queries/getCatalogProducts'

export async function CatalogPage() {
  const products = await getCatalogProducts()
  return (
    <main>
      <h1>Catalog</h1>
      {/* render */}
      <pre>{JSON.stringify(products, null, 2)}</pre>
    </main>
  )
}
```

### Route Handler delegando a server layer

```ts
// app/api/cart/items/route.ts
import { NextResponse } from 'next/server'
import { addItemToCart } from '@/src/features/cart/server/actions/addItemToCart'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body?.productId || !body?.quantity) {
    return NextResponse.json({ error: 'productId and quantity are required' }, { status: 400 })
  }

  const result = await addItemToCart({ productId: body.productId, quantity: body.quantity })
  return NextResponse.json(result, { status: 201 })
}
```

---

## 7) Testing (pirámide práctica)

- **`domain/`**: unit tests de invariantes/value objects.
- **`server/`**: tests de queries/actions con repos fakes (o DB de test si aplica).
- **`ui/`**: tests de componentes (si hay testing setup) y/o smoke tests.

---

## 8) Migración (incremental)

Este repo está organizado por `src/features/*`. Si vienes de una estructura anterior (por ejemplo `src/contexts/*` o por capas globales), migra sin romper todo así:

1) Crear `src/features/` y empezar por una feature (p. ej. `catalog`).
2) Mover UI primero → `features/<feature>/ui`.
3) Mover lectura/escritura (IO, auth, caching) → `features/<feature>/server`.
4) Mantener `domain/` solo para reglas puras que valgan la pena.
5) Exponer el API público en `features/<feature>/index.ts` y actualizar imports.

---

## 9) Checklist (ecommerce)

- Estrategia de auth (cookies/session/JWT) y boundaries server.
- Estrategia de caching por feature (tags + revalidate).
- Idempotencia para pagos y webhooks.
- Validación de precios/totales siempre en server.
- Observabilidad: requestId + userId + orderId en logs.

# SwiftDrop — Prototipo de E-commerce Dropshipping con Logística Multimodal

Este es un proyecto [Next.js](https://nextjs.org) con App Router, React 19, TypeScript, Supabase/PostgreSQL y despliegue en Vercel.

## Stack Tecnológico

- Next.js 16.1.6 (App Router)
- React 19.2.4
- TypeScript 5
- Tailwind CSS v4
- HeroUI
- Supabase (Auth + PostgreSQL + Storage)
- Framer Motion
- Recharts
- jsPDF + jspdf-autotable
- Leaflet + react-leaflet
- Resend (email)

## Dependencias

```bash
npm install
```

## Variables de entorno

Crea `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
RESEND_API_KEY=tu-api-key        # opcional
RESEND_FROM_EMAIL=SwiftDrop <onboarding@tribunanoventa.shop>
NEXT_PUBLIC_SITE_URL=https://www.tribunanoventa.shop

# ePayco (opcional — el proyecto funciona en modo mock/simulado sin credenciales reales)
# EPAYCO_PUBLIC_KEY=
# EPAYCO_PRIVATE_KEY=
# EPAYCO_P_KEY=
# EPAYCO_TEST=true

# SMS (opcional — el proyecto usa mock por defecto)
# SMS_PROVIDER=mock
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_FROM_NUMBER=
```

## Base de datos (Supabase)

1. Ve a Supabase SQL Editor.
2. Ejecuta en orden:
   1. `database/schema.sql`
   2. `database/migrations/20260321_checkout_hardening.sql`
   3. `database/migrations/20260430_initial_product_data.sql`
   4. `database/migrations/20260526_add_delivery_pin_columns.sql`
   5. `database/migrations/20260526_add_customer_type.sql`
   6. `database/migrations/20260526_add_loyalty_tables.sql`
   7. `database/migrations/20260526_add_sms_notifications.sql`
   8. `database/migrations/20260526_add_epayco_provider.sql`
   9. `database/migrations/20260526_add_drones_tables.sql`
   10. `database/migrations/20260526_add_logistics_tables.sql`
   11. `database/migrations/20260526_seed_demo_data.sql`
3. Verifica tablas en Database → Tables.

## Cómo correr

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Qué está implementado

### Sprint 1 — Base
- Auth Supabase (login/registro)
- Panel admin protegido con roles (owner/admin/staff)
- RLS en todas las tablas

### Sprint 2 — E-commerce Core
- Catálogo de 24 productos con 41 SKUs desde BD
- Carrito (localStorage)
- Checkout con creación transaccional de pedidos (RPC)
- Perfil de usuario con direcciones CRUD
- Diferenciación minorista/mayorista (`customer_type`)
- Programa de fidelización: acumulación de puntos por compra

### Sprint 3 — Pagos, Pedidos y Comunicaciones
- Pedidos con estados y detalle
- PIN de entrega generado automáticamente
- SMS mock: guarda intento de envío en tabla `sms_notifications` (simulado para prototipo)
- ePayco Sandbox simulado: permite elegir "ePayco Sandbox (simulado)" en checkout
- Factura PDF simulada con NIT y resolución DIAN simulada (sin validez fiscal)
- Email de confirmación con Resend

### Sprint 4 — Logística, Drones y GPS
- Drones simulados: tabla, estado, batería, carga máxima
- Mantenimiento de drones: historial y registro
- Alertas de mantenimiento/batería
- Logística multimodal: asignación automática por drone, moto o bicicleta según peso/distancia/disponibilidad
- GPS simulado: coordenadas generadas entre origen (Bucaramanga) y destino
- Mapa interactivo con Leaflet en tracking
- Seguimiento de pedido por número con progreso
- Admin de drones y admin de logística

## Qué está simulado (prototipo académico)

- **Drones**: 100% simulados, sin hardware real.
- **GPS**: Coordenadas generadas algorítmicamente, no GPS real.
- **SMS**: Servicio mock que guarda en BD. Sin Twilio real por defecto.
- **ePayco**: Sin SDK real. Simula checkout y confirmación internamente.
- **Factura**: PDF simple sin validez fiscal ni conexión DIAN real.
- **Asignación logística**: Algoritmo simple basado en peso/distancia/disponibilidad.

## Rutas importantes

- `/` — Home / Catálogo
- `/catalog` — Catálogo filtrable
- `/products/[id]` — Detalle de producto
- `/cart` — Carrito
- `/checkout` — Checkout (contra entrega o ePayco simulado)
- `/profile` — Perfil, pedidos, direcciones, puntos
- `/track-order` — Rastreo de pedido con mapa
- `/admin` — Dashboard admin
- `/admin/drones` — Gestión de drones
- `/admin/logistics` — Logística multimodal
- `/admin/orders` — Órdenes
- `/admin/products` — Productos
- `/admin/inventory` — Inventario

## Demo rápida

1. Regístrate como cliente.
2. Agrega productos al carrito.
3. Ve a checkout, elige método de pago.
4. Completa dirección y confirma.
5. En `/profile` verás tu pedido y PIN de entrega.
6. En `/track-order` busca tu número de pedido para ver el mapa.
7. Inicia sesión como admin (requiere insertar tu user_id en `admin_users`).
8. En `/admin/drones` y `/admin/logistics` gestiona la flota.

## Créditos

Proyecto académico — SwiftDrop Team.

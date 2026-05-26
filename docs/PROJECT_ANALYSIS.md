# Análisis Completo del Proyecto SwiftDrop

**Última Actualización:** 30 de Abril de 2026  
**Versión:** 1.0 - MVP (Minimum Viable Product)

---

## 📋 RESUMEN EJECUTIVO

**SwiftDrop** es una plataforma de e-commerce basada en el modelo **Dropshipping** especializada en la venta de **insumos y repuestos automotrices** en Bucaramanga, Santander, Colombia.

### Características Clave:
- ✅ Portal web de compra integral (minoristas + mayoristas)
- ✅ Múltiples canales de entrega (Drones, Motos, Bicicletas)
- ✅ Seguimiento GPS en tiempo real
- ✅ Facturación electrónica DIAN
- ✅ Notificaciones SMS con PIN de confirmación
- ✅ Gestión de flota de drones
- ✅ Programa de fidelización de clientes

---

## 🏛️ ARQUITECTURA GENERAL

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (Presentación)                │
├─────────────────────────────────────────────────────────┤
│ • Next.js 16.1.6 (React 19, App Router)                 │
│ • TypeScript + Tailwind CSS v4                          │
│ • UI Components: HeroUI, Lucide React, Framer Motion    │
│ • Maps: Google Maps API (real-time tracking)            │
│ • Estado: React Context + Server Components (RSC)       │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│               BACKEND & BaaS (Supabase)                  │
├─────────────────────────────────────────────────────────┤
│ • PostgreSQL 15+                                        │
│ • Autenticación JWT (Auth0-style)                       │
│ • Almacenamiento S3-compatible                          │
│ • APIs REST + WebSockets (Real-time)                    │
│ • RLS (Row Level Security) para datos                   │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│               INTEGRACIONES EXTERNAS                     │
├─────────────────────────────────────────────────────────┤
│ • Google Maps API: Geolocalización & Mapas              │
│ • ePayco: Pasarela de pagos (COP)                       │
│ • Twilio: SMS notifications & PIN delivery              │
│ • DIAN: Facturación electrónica (UBL 2.1)              │
│ • Vercel: Hosting & CI/CD                              │
└─────────────────────────────────────────────────────────┘
```

### Principios Arquitectónicos

#### 1. **Server-First + Feature-Based**
- Componentes son **Server Components** por defecto
- Solo `"use client"` cuando hay interacción del navegador
- Organización por **features** (no por tipo de archivo)
- Separación clara de capas: `domain/`, `server/`, `ui/`

#### 2. **Reglas de Dependencias**

```
✅ Permitido:
  app/ → src/features/*/ui
  src/features/*/ui → src/features/*/server | domain | shared
  src/features/*/server → src/features/*/domain | shared | lib
  src/features/*/domain → shared (solo types puros)

❌ Prohibido:
  src/features/*/domain → React/Next/fetch/DB clients
  Importaciones de rutas profundas entre features
  Circular dependencies
```

#### 3. **Modularidad Feature-Based**

Cada feature expone una **API pública** limpia mediante `index.ts`:

```typescript
// src/features/products/index.ts (API Pública)
export { searchProducts } from './server/search'
export { ProductCard } from './ui/ProductCard'
export type { Product, ProductFilter } from './domain/Product'
```

---

## 📁 ESTRUCTURA DEL PROYECTO

```
SwiftDrop/
│
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout + providers
│   ├── page.tsx                 # Home page
│   ├── not-found.tsx            # 404 handler
│   ├── providers.tsx            # Context providers
│   │
│   ├── (storefront)/            # Grupo de rutas públicas
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Home/Catalog
│   │   ├── blog/                # Blog posts
│   │   ├── cart/                # Carrito de compras
│   │   ├── catalog/             # Listado productos
│   │   ├── checkout/            # Proceso de compra
│   │   ├── faq/                 # Preguntas frecuentes
│   │   ├── legal/               # Términos y privacidad
│   │   ├── order/[id]/          # Seguimiento de orden
│   │   ├── products/[id]/       # Detalle de producto
│   │   ├── profile/             # Mi cuenta
│   │   ├── track-order/         # Rastreo GPS
│   │   └── wishlist/            # Lista de deseos
│   │
│   ├── admin/                   # Panel administrativo
│   │   ├── page.tsx             # Dashboard
│   │   ├── categories/          # Gestión categorías
│   │   ├── customers/[id]/      # Detalle cliente
│   │   ├── inventory/           # Stock
│   │   ├── orders/[id]/         # Detalle orden
│   │   ├── products/[id]/       # Editar producto
│   │   ├── products/new/        # Crear producto
│   │   ├── promotions/          # Ofertas
│   │   └── settings/            # Configuración
│   │
│   ├── api/                     # Route Handlers
│   │   └── products/route.ts    # API endpoints
│   │
│   └── auth/                    # Auth pages
│       └── admin/page.tsx       # Admin login
│
├── src/
│   │
│   ├── features/                # Feature modules (Feature-based)
│   │   ├── admin/               # Módulo administrativo
│   │   │   ├── server/
│   │   │   │   └── access.ts    # Validar permisos admin
│   │   │   ├── ui/
│   │   │   │   ├── client/      # Componentes interactivos
│   │   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   └── pages/
│   │   │   └── index.ts
│   │   │
│   │   ├── auth/                # Autenticación
│   │   │   ├── ui/
│   │   │   │   └── AuthModal.client.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── blog/                # Blog/Contenido
│   │   │   ├── ui/
│   │   │   │   ├── components/
│   │   │   │   └── pages/
│   │   │   └── index.ts
│   │   │
│   │   ├── cart/                # Carrito de compras
│   │   │   ├── domain/
│   │   │   │   └── CartItem.ts  # Tipos puros
│   │   │   ├── ui/
│   │   │   │   ├── client/
│   │   │   │   └── pages/
│   │   │   └── index.ts
│   │   │
│   │   ├── checkout/            # Proceso de compra
│   │   │   ├── actions/
│   │   │   │   ├── getCustomerAddress.ts   # Server action
│   │   │   │   └── placeOrder.ts          # Server action
│   │   │   ├── lib/
│   │   │   │   └── shipping.ts  # Lógica de envío
│   │   │   ├── ui/
│   │   │   │   ├── components/
│   │   │   │   └── pages/
│   │   │   └── index.ts
│   │   │
│   │   ├── faq/                 # Preguntas frecuentes
│   │   ├── home/                # Home page
│   │   ├── legal/               # T&C, Privacy
│   │   ├── products/            # Catálogo de productos
│   │   │   ├── components/
│   │   │   ├── data/            # Data fetching
│   │   │   ├── details/         # Detalle producto
│   │   │   ├── domain/          # Tipos puros
│   │   │   ├── listing/         # Listado
│   │   │   ├── server/          # Search, queries
│   │   │   └── index.ts
│   │   │
│   │   ├── profile/             # Perfil de usuario
│   │   ├── tracking/            # Rastreo GPS
│   │   ├── wishlist/            # Lista de deseos
│   │   │
│   │   └── README.md            # Convenciones de features
│   │
│   ├── lib/                     # Librerías transversales
│   │   ├── README.md
│   │   ├── seo.ts              # SEO utilities
│   │   ├── utils.ts            # Utilidades generales
│   │   ├── email/
│   │   │   └── resend.ts       # Email service (Resend)
│   │   ├── supabase/
│   │   │   ├── browser.ts      # Client-side Supabase
│   │   │   ├── server.ts       # Server-side Supabase
│   │   │   └── ssr.ts          # SSR helper
│   │   └── README.md
│   │
│   └── shared/                  # Código compartido (UI + tipos)
│       ├── README.md
│       ├── presentation/
│       │   ├── styles/
│       │   │   └── globals.css
│       │   └── ui/              # Componentes globales
│       └── types/               # Tipos globales
│
├── database/                    # Scripts de DB
│   ├── schema.sql              # Schema PostgreSQL
│   ├── storage_product_images.sql
│   ├── migrations/
│   │   ├── 20260321_checkout_hardening.sql
│   │   └── 20260430_initial_product_data.sql  # 👈 NEW!
│   └── README.md
│
├── public/                      # Assets estáticos
│   ├── assets/
│   └── favicon/
│
├── scripts/
│   └── dev.js                   # Node script para dev
│
├── docs/
│   ├── ARCHITECTURE.md          # Documentación técnica
│   └── README.md
│
├── eslint.config.mjs            # Linting config
├── next.config.ts              # Next.js config
├── tsconfig.json               # TypeScript
├── package.json                # Dependencies
├── postcss.config.mjs           # PostCSS
├── tailwind.config.ts          # Tailwind CSS
├── proxy.ts                    # Dev proxy config
└── README.md
```

---

## 🗄️ ESQUEMA DE BASE DE DATOS

### ENUMS & TIPOS

```sql
-- Enums principales
user_role: 'owner' | 'admin' | 'staff'
product_status: 'draft' | 'active' | 'archived'
order_status: 'pending' | 'processing' | 'paid' | 'fulfilled' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
payment_status: 'unpaid' | 'requires_action' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
fulfillment_status: 'unfulfilled' | 'partial' | 'fulfilled' | 'shipped' | 'delivered' | 'returned' | 'cancelled'
shipping_method: 'drone' | 'bike' | 'motorcycle' | 'commercial_partner'
promotion_type: 'percent' | 'fixed' | 'free_shipping'
```

### TABLAS PRINCIPALES

```sql
┌────────────────────────┐
│    admin_users         │  Usuarios administrativos
├────────────────────────┤
│ user_id (PK, FK)       │
│ role                   │
│ disabled_at            │
│ created_at, updated_at │
└────────────────────────┘

┌────────────────────────┐
│    customers           │  Clientes (minorista/mayorista)
├────────────────────────┤
│ id (PK)                │
│ user_id (FK)           │
│ email                  │
│ full_name              │
│ phone                  │
│ status                 │
│ metadata (JSONB)       │
├────────────────────────┤
│ customer_addresses     │ Direcciones por cliente
│ • id (PK)              │
│ • customer_id (FK)     │
│ • is_default           │
│ • line1, line2, city   │
└────────────────────────┘

┌────────────────────────┐
│    categories          │  Categorías + subcategorías
├────────────────────────┤
│ id (PK)                │
│ parent_id (FK, NULL)   │ Jerárquica: parent=NULL es main
│ name, slug             │
│ description            │
│ cover_image_url        │
│ is_active              │
│ sort_order             │
└────────────────────────┘

┌────────────────────────────┐
│    products                │  Productos
├────────────────────────────┤
│ id (PK)                    │
│ slug (UNIQUE)              │
│ name, description          │
│ status                     │ draft|active|archived
│ badge (ej: "BESTSELLER")   │
│ base_price_cents           │
│ compare_at_price_cents     │
│ primary_image_url          │
│ attributes (JSONB)         │
├────────────────────────────┤
│ product_images (1:Many)    │ Galería de imágenes
│ product_variants (1:Many)  │ SKU/Talla/Color
│ product_categories (M:Many)│ Relación con categorías
└────────────────────────────┘

┌────────────────────────┐
│ product_variants       │  Variantes (SKU, talla, color)
├────────────────────────┤
│ id (PK)                │
│ product_id (FK)        │
│ sku (UNIQUE)           │
│ title (ej: "Red S")    │
│ option_values (JSONB)  │
│ price_cents            │
│ image_url              │
│ is_active              │
│ is_default             │
├────────────────────────┤
│ inventory_items (1:1)  │ Stock por variante
│ • stock_on_hand        │
│ • reserved             │
│ • low_stock_threshold  │
└────────────────────────┘

┌────────────────────────┐
│    carts               │  Carrito de compras
├────────────────────────┤
│ id (PK)                │
│ customer_id (FK)       │
│ status: 'active' (uno) │
│ currency               │
│ expires_at             │
├────────────────────────┤
│ cart_items (1:Many)    │ Items en carrito
│ • product_id (FK)      │
│ • variant_id (FK)      │
│ • quantity             │
│ • unit_price_cents     │
└────────────────────────┘

┌────────────────────────────┐
│    orders                  │  Órdenes/Pedidos
├────────────────────────────┤
│ id, order_number (BIGINT)  │
│ customer_id (FK)           │
│ status                     │ pending→processing→shipped→delivered
│ payment_status             │
│ fulfillment_status         │
│ subtotal_cents             │
│ shipping_cents             │
│ tax_cents                  │
│ discount_cents             │
│ total_cents                │
│ placed_at (timestamp)      │
├────────────────────────────┤
│ order_items (1:Many)       │ Ítems en orden
│ order_addresses (1:Many)   │ Shipping + Billing
│ payment_intents (1:Many)   │ Historial de pagos
│ shipments (1:Many)         │ Envíos
└────────────────────────────┘

┌──────────────────────────┐
│ payment_intents          │  Intenciones de pago
├──────────────────────────┤
│ id (PK)                  │
│ order_id (FK)            │
│ provider (ePayco)        │
│ provider_intent_id       │
│ status                   │
│ amount_cents             │
│ provider_metadata (JSON) │
├──────────────────────────┤
│ payment_refunds (1:Many) │ Reembolsos
└──────────────────────────┘

┌──────────────────────────┐
│ shipments                │  Envíos / Logística
├──────────────────────────┤
│ id (PK)                  │
│ order_id (FK)            │
│ status                   │
│ carrier                  │ drone|bike|motorcycle
│ tracking_number          │
│ estimated_delivery_at    │
│ delivered_at             │
│ metadata (GPS coords)    │
└──────────────────────────┘

┌──────────────────────────┐
│ promotions               │  Promociones / Descuentos
├──────────────────────────┤
│ id (PK)                  │
│ name, code (UNIQUE)      │
│ type: percent|fixed|free │
│ value                    │
│ max_uses, used_count     │
│ valid_from, valid_until  │
│ metadata (JSONB)         │
└──────────────────────────┘
```

---

## 📊 MIGRACIÓN SQL CREADA

### Archivo: `database/migrations/20260430_initial_product_data.sql`

Esta migración incluye:

#### **1. Categorías (10 principales + 12 subcategorías)**
- ✅ Motores y Componentes (Correas, Juntas, etc.)
- ✅ Sistema Eléctrico (Baterías, Alternadores, etc.)
- ✅ Suspensión y Dirección
- ✅ Sistema de Frenos
- ✅ Transmisión y Embrague
- ✅ Lubricantes y Fluidos
- ✅ Neumáticos y Ruedas
- ✅ Filtros
- ✅ Sistema de Escape
- ✅ Accesorios Generales

#### **2. Productos (24 productos)**

| Categoría | Productos |
|-----------|-----------|
| **Baterías** | Bosch 12V 65Ah, Exell 70Ah, AC Delco 55Ah, Trojan 100Ah, Heavy Duty 24V |
| **Frenos** | Pastillas Delant/Trasera, Discos 330mm/280mm |
| **Lubricantes** | Aceites 15W40/5W30, Refrigerante, Fluido Frenos, ATF |
| **Filtros** | Aire, Aceite, Combustible, Cabina |
| **Amortiguadores** | Delantero/Trasero Estándar, Sport, Kit Completo 4pcs |
| **Neumáticos** | 175/70R14, 185/65R15, 205/55R16, 225/65R17 |

#### **3. Variantes (41 SKUs únicos)**
- Cada producto tiene 1-4 variantes con opciones específicas
- Precios en COP (Pesos Colombianos)

#### **4. Inventario (41 stocks iniciales)**
- Stock On Hand: 50-200 unidades por variante
- Reserved: 5-20 unidades
- Low Stock Threshold: 10-30 unidades

---

## 🌐 MÓDULOS PRINCIPALES

### 1. **STOREFRONT (Frontend Público)**

#### Rutas Principales:
- `/` - Home y catálogo
- `/catalog` - Listado productos filtrable
- `/products/[id]` - Detalle producto + reviews
- `/cart` - Carrito interactivo
- `/checkout` - Proceso de compra (Payment Gateway)
- `/track-order/[id]` - Rastreo GPS simulado
- `/profile` - Mi cuenta, órdenes, direcciones
- `/wishlist` - Lista de deseos
- `/faq` - Preguntas frecuentes
- `/legal/privacy` - Privacidad
- `/legal/terms` - Términos

#### Características:
- ✅ Responsive design (mobile-first)
- ✅ Búsqueda y filtros avanzados
- ✅ Gestión de carrito persistente
- ✅ Checkout seguro con ePayco
- ✅ Notificaciones en tiempo real
- ✅ Rastreo GPS interactivo (Google Maps)

### 2. **ADMIN PANEL (Panel Administrativo)**

#### Rutas:
- `/admin` - Dashboard con métricas
- `/admin/products` - Gestión de catálogo
- `/admin/products/new` - Crear producto
- `/admin/categories` - Organizar categorías
- `/admin/inventory` - Gestionar stock
- `/admin/orders` - Historial de pedidos
- `/admin/orders/[id]` - Detalle orden + rastreo
- `/admin/customers/[id]` - Detalles cliente
- `/admin/promotions` - Ofertas y descuentos
- `/admin/settings` - Configuración del sistema

#### Características:
- ✅ Dashboard con gráficos de ventas
- ✅ Editor drag-drop para productos
- ✅ Importación bulk de SKUs
- ✅ Mapa en tiempo real de entregas
- ✅ Generación de reportes
- ✅ Integración con DIAN

### 3. **AUTENTICACIÓN & SEGURIDAD**

#### Métodos:
- Supabase Auth (Email + Password)
- Roles: Owner, Admin, Staff
- Row Level Security (RLS) por cliente
- 2FA opcional

#### Protecciones:
- ✅ Validación de JWT
- ✅ Encriptación de datos sensibles
- ✅ Prevención de CSRF
- ✅ Rate limiting en API
- ✅ Compliance PCI DSS

### 4. **INTEGRACIONES EXTERNAS**

#### Google Maps API
```typescript
// Muestra ubicación en tiempo real de:
- Drones en operación
- Órdenes en tránsito
- Puntos de entrega

// Features:
- Rutas optimizadas
- ETA (Estimated Time of Arrival)
- Geofencing (solo Bucaramanga)
```

#### ePayco (Pasarela de Pagos)
```typescript
// Métodos aceptados:
- Tarjeta de crédito/débito
- PSE (Débito directo)
- Transferencia bancaria

// Entorno:
- Sandbox para pruebas
- Modo producción con certificados
```

#### Twilio (SMS Notifications)
```typescript
// Notificaciones automáticas:
1. Confirmación de orden + PIN
2. Cambios de estado de envío
3. Alertas especiales (retrasos, etc.)

// Timeframe: <30 segundos post-evento
```

---

## 🎯 USER FLOWS PRINCIPALES

### Flow 1: Compra Minorista

```
1. Cliente → Home/Catálogo
2. Busca producto (filtros: categoría, precio)
3. Ve detalle (imágenes, specs, reviews)
4. Añade al carrito (selecciona variante + cantidad)
5. Procede a checkout:
   a) Login/Registro
   b) Dirección de entrega (selecciona tipo: drone/moto/bici)
   c) Método de pago (ePayco)
   d) Confirma con PIN (SMS)
6. Orden creada ✓
7. Recibe notificación SMS con tracking URL
8. Puede ver orden en precio y time tracking real
```

### Flow 2: Seguimiento GPS

```
1. Cliente recibe SMS con link de rastreo
2. Abre link → Mapa interactivo
3. Ve:
   - Su ubicación (pin azul)
   - Ubicación del medio de entrega (pin móvil)
   - Ruta estimada
   - ETA
   - Estado actual (preparación/en ruta/entregado)
4. Map se actualiza cada 3-5 segundos
5. Al entregar, cliente confirma con PIN
```

### Flow 3: Gestión de Inventario (Admin)

```
1. Admin → /admin/inventory
2. Ve tabla de SKUs con stock
3. Si stock < threshold → Alerta visual
4. Puede:
   - Actualizar stock manual
   - Importar CSV
   - Crear alertas de reorden
   - Ver histórico de movimientos
```

### Flow 4: Mantenimiento de Drones (Tech Support)

```
1. Soporte técnico → /admin/drones (no en MVP, pero preparado)
2. Ve flota con estado:
   - Verde: Activo
   - Amarillo: En mantenimiento
   - Rojo: Fuera de servicio
3. Puede:
   - Registrar novedad (daño, calibración)
   - Ver historial completo
   - Programar mantenimiento preventivo
   - Generar reporte de conformidad
```

---

## 📱 RESPONSIVIDAD Y UX

### Breakpoints (Tailwind)
```css
xs: 0px       (mobile)
sm: 640px     (tablet vertical)
md: 768px     (tablet)
lg: 1024px    (laptop)
xl: 1280px    (desktop)
2xl: 1536px   (ultra-wide)
```

### Tiempo de Aprendizaje (Requerimiento)
- **Minorista**: < 10 min para completar compra
- **Admin**: < 4 horas de entrenamiento
- **Soporte**: < 2 horas

### Performance Targets
- Búsqueda producto: < 2 minutos
- Pago + PIN: < 3 minutos
- Rastreo GPS: < 1 minuto
- Generación reporte: < 3 minutos
- **Tiempo respuesta general: < 3 segundos**

---

## 🔒 COMPLIANCE & NORMATIVA

### Leyes Colombianas Aplicables
- ✅ **Ley 527/1999**: Comercio Electrónico en Colombia
- ✅ **Ley 1581/2012**: Protección de Datos Personales (Habeas Data)
- ✅ **Ley 1480/2011**: Estatuto del Consumidor
- ✅ **Norma DIAN**: Facturación Electrónica (UBL 2.1)

### Estándares Técnicos
- ✅ **PCI DSS 3.2.1**: Seguridad datos de tarjeta
- ✅ **IEEE 830-1998**: Especificación de Requerimientos de Software
- ✅ **ISO 27001**: Gestión de seguridad de la información

### Certifications en Supabase
- ✅ Backups automáticos c/24h
- ✅ Encriptación en reposo (AES-256)
- ✅ TLS 1.3 en tránsito
- ✅ GDPR-compliant (data residency EU/US)

---

## 🚀 DEPLOYMENT & INFRAESTRUCTURA

### Hosting: Vercel
```
- Frontend: Next.js optimizado
- Edge Functions: Serverless
- CI/CD: Deploy automático desde GitHub
- Analytics: Vercel Web Analytics
- Regions: Global CDN
```

### Base de Datos: Supabase
```
- PostgreSQL managed
- Region: South America (São Paulo)
- Backups: Daily + retention 30 días
- Realtime: WebSockets para GPS tracking
```

### Monitoreo & Observabilidad
```
✅ Vercel Analytics (Core Web Vitals)
✅ Supabase Dashboard (DB queries, storage)
✅ Sentry (Error tracking real-time)
✅ GitHub Actions (CI/CD pipelines)
```

---

## 📈 MÉTRICAS CLAVE (SLA)

| Métrica | Target | Justificación |
|---------|--------|---------------|
| Disponibilidad | 90% 24/7 | Crítico para ventas online |
| MTBF (Tiempo entre fallos) | 168h (1 semana) | Mantenimiento preventivo 5h/semana |
| MTTR (Tiempo reparación) | 2h (crítica) / 24h (menor) | Impacto negocio |
| Latencia GPS | < 5 segundos | Experiencia usuario |
| SMS Delivery | < 30 segundos | Confirmación inmediata |
| Carga catálogo | < 3 segundos | Conversión |
| Tasa error | < 5 por 1000 LOC | Código quality |

---

## 🛠️ STACK TÉCNICO FINAL

### Frontend
```json
{
  "framework": "Next.js 16.1.6",
  "ui": "React 19 + TypeScript",
  "styling": "Tailwind CSS v4",
  "components": "HeroUI + custom",
  "animation": "Framer Motion",
  "state": "React Context + Server Components",
  "maps": "Google Maps API",
  "auth": "Supabase Auth"
}
```

### Backend
```json
{
  "database": "PostgreSQL 15+ (Supabase)",
  "auth": "JWT + Row Level Security",
  "api": "REST + WebSockets (Realtime)",
  "storage": "S3-compatible (Supabase Storage)",
  "caching": "Database query optimization"
}
```

### DevOps
```json
{
  "hosting": "Vercel",
  "database_host": "Supabase",
  "vcs": "GitHub",
  "ci_cd": "GitHub Actions",
  "monitoring": "Sentry + Vercel Analytics",
  "domain": "DNS managed"
}
```

---

## ✅ ESTADO ACTUAL (MVP + Sprint 4 Prototipo)

### ✅ Implementado
- [x] Esquema PostgreSQL completo con RLS
- [x] Autenticación Supabase (login/registro)
- [x] Roles admin (owner/admin/staff)
- [x] Catálogo de 24 productos + 41 SKUs desde BD
- [x] Carrito (localStorage)
- [x] Checkout transaccional con RPC
- [x] Diferenciación minorista/mayorista (`customer_type`)
- [x] Programa de fidelización: acumulación y visualización de puntos
- [x] ePayco Sandbox simulado (modo mock sin SDK real)
- [x] Factura PDF simulada (jsPDF, sin validez fiscal)
- [x] PIN de entrega generado y almacenado
- [x] SMS mock (guarda en BD, sin Twilio real por defecto)
- [x] Drones simulados: tabla, estado, batería, mantenimiento, alertas
- [x] Logística multimodal: asignación automática drone/moto/bicicleta
- [x] GPS simulado: coordenadas generadas algorítmicamente
- [x] Mapa interactivo con Leaflet (OpenStreetMap)
- [x] Seguimiento de pedido con progreso
- [x] Panel admin: dashboard, órdenes, productos, categorías, inventario, clientes, promociones, drones, logística
- [x] Email de confirmación (Resend)
- [x] Promociones (tabla, validación básica en checkout)

### 🚧 Simulado / Prototipo
- Drones: sin hardware real
- GPS: coordenadas generadas, no GPS real
- SMS: servicio mock, sin Twilio real
- ePayco: sin SDK real, simulación interna
- Factura: PDF simple sin validez fiscal ni DIAN real

### 📋 Backlog Post-MVP
- [ ] App móvil nativa
- [ ] Integración hardware IoT real
- [ ] SDK real de ePayco con credenciales
- [ ] Twilio real con credenciales
- [ ] Facturación DIAN UBL 2.1
- [ ] Machine Learning para recomendaciones
- [ ] Marketplace con múltiples vendedores
- [ ] Webhooks para integraciones B2B

---

## 📞 CONTACTO & EQUIPO

**Equipo de Desarrollo (4 miembros):**
- Wilson Javier Gómez Mantilla
- Joseph Samuel Palomino Contreras
- Santiago Mejia Wilches
- Mariana Carolina Barragán Suárez

**Plazo:** 8 semanas (Deadline: Junio 2026)  
**Versión SRS:** 1.0 (Aprobado 06/04/2026)

---

## 🔗 REFERENCIAS

- IEEE Std 830-1998: Software Requirements
- DIAN: Facturación Electrónica
- Google Cloud: Maps API Documentation
- Supabase: PostgreSQL + Realtime Guide
- Next.js: App Router Documentation
- PCI DSS: Security Standards

---

**Última Actualización:** 30 de Abril, 2026

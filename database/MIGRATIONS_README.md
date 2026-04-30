# Database Migrations - SwiftDrop

## 📁 Estructura

```
database/
├── schema.sql                          # Schema PostgreSQL completo
├── storage_product_images.sql          # Configuración de storage S3
├── migrations/
│   ├── 20260321_checkout_hardening.sql    # Checkpoint de seguridad
│   └── 20260430_initial_product_data.sql  # 👈 NUEVA - Datos iniciales MVP
└── README.md (este archivo)
```

---

## 🚀 Quick Start

### Paso 1: Asegúrate de tener el schema base
La migración `20260430_initial_product_data.sql` depende de que `schema.sql` esté aplicado.

```bash
# En Supabase SQL Editor:
# 1. Abre un "New Query"
# 2. Copia contenido de schema.sql
# 3. Run
```

### Paso 2: Carga los datos iniciales
```bash
# En Supabase SQL Editor:
# 1. Abre otro "New Query"
# 2. Copia contenido de migrations/20260430_initial_product_data.sql
# 3. Run
```

### Paso 3: Verifica
```bash
# Ejecuta en SQL Editor:
SELECT COUNT(*) as "Total Products" FROM public.products;
SELECT COUNT(*) as "Total Variants" FROM public.product_variants;
SELECT COUNT(*) as "Total Categories" FROM public.categories;
```

Deberías ver:
- Total Products: **24**
- Total Variants: **41**
- Total Categories: **22**

---

## 📊 Contenido de Migraciones

### `schema.sql`
- ✅ Enums (user_role, product_status, order_status, etc.)
- ✅ Tablas core (users, customers, products, orders, etc.)
- ✅ Relaciones y constraints
- ✅ Índices para performance
- ✅ Triggers para `updated_at`
- ✅ RLS (Row Level Security)

**Requerido:**  `schema.sql` debe ejecutarse PRIMERO

---

### `20260321_checkout_hardening.sql`
- Mejoras de seguridad en checkout
- Validaciones de integridad
- Constraints adicionales

**Estado:** Aplicado ✓

---

### `20260430_initial_product_data.sql` ⭐ NUEVA

#### Inserta:

| Recurso | Cantidad | Details |
|---------|----------|---------|
| **Categorías** | 22 | 10 principales + 12 subcategorías jerárquicas |
| **Productos** | 24 | 6 categorías principales con productos funcionales |
| **Variantes** | 41 | SKUs únicos con opciones específicas |
| **Imágenes** | 0* | Sistema listo para agregar URLs |
| **Inventario** | 41 | Stock inicial por variante |

*Las imágenes son placeholder URLs. En producción, usar Supabase Storage.

#### Estructura de Datos:

```
Categories (Jerárquica)
├── Motores y Componentes
│   ├── Correas y Poleas
│   ├── Rodillos y Tensores
│   └── Juntas y Sellos
├── Sistema Eléctrico
│   ├── Baterías (5 productos)
│   ├── Alternadores
│   └── Motores de Arranque
├── Suspensión y Dirección
│   ├── Amortiguadores (4 productos)
│   └── Muelles y Resortes
├── Sistema de Frenos
│   ├── Pastillas de Freno (2 productos)
│   ├── Discos y Tambores (2 productos)
│   └── Cilindros Maestros
├── Lubricantes y Fluidos (5 productos)
├── Neumáticos y Ruedas (4 productos)
├── Filtros (4 productos)
├── Transmisión y Embrague
├── Sistema de Escape
└── Accesorios Generales
```

#### Productos por Categoría:

```
Baterías (5):
  • Bosch 12V 65Ah - $550 COP
  • Exell 12V 70Ah - $520 COP
  • AC Delco 12V 55Ah - $480 COP
  • Trojan 12V 100Ah - $1,200 COP
  • Heavy Duty 24V 190Ah - $2,800 COP

Frenos (5):
  • Pastilla Delantera Estándar - $350 COP
  • Pastilla Delantera Sport - $650 COP
  • Pastilla Trasera Estándar - $320 COP
  • Disco Ventilado 330mm - $890 COP
  • Disco Sólido 280mm - $520 COP

Lubricantes (5):
  • Aceite 15W40 4L - $380 COP
  • Aceite 5W30 5L - $920 COP
  • Refrigerante Rojo 5L - $420 COP
  • Fluido Frenos DOT4 1L - $180 COP
  • ATF 3L - $680 COP

Filtros (4):
  • Filtro Aire - $280 COP
  • Filtro Aceite - $220 COP
  • Filtro Combustible Diesel - $350 COP
  • Filtro Cabina Antipolvo - $450 COP

Amortiguadores (4):
  • Delantero Estándar - $1,250 COP
  • Trasero Estándar - $1,150 COP
  • Delantero Sport - $2,800 COP
  • Kit Completo 4pcs - $6,800 COP

Neumáticos (4):
  • 175/70R14 Cityrun - $1,650 COP
  • 185/65R15 AllSeason - $2,150 COP
  • 205/55R16 Performance - $3,650 COP
  • 225/65R17 SUV - $4,250 COP
```

---

## 🔧 Operaciones Comunes

### Ver todos los productos
```sql
SELECT 
  id, name, base_price_cents/100 as precio_cop, status, is_published
FROM public.products
ORDER BY created_at DESC;
```

### Ver inventario bajo
```sql
SELECT 
  p.name as producto,
  pv.sku,
  ii.stock_on_hand,
  ii.low_stock_threshold
FROM public.inventory_items ii
JOIN public.product_variants pv ON ii.variant_id = pv.id
JOIN public.products p ON pv.product_id = p.id
WHERE ii.stock_on_hand <= ii.low_stock_threshold
ORDER BY ii.stock_on_hand ASC;
```

### Agregar nuevo producto
```sql
-- 1. Crear producto
INSERT INTO public.products (slug, name, description, status, is_published, base_price_cents)
VALUES (
  'mi-nuevo-producto',
  'Mi Nuevo Producto',
  'Descripción detallada',
  'active',
  true,
  15000  -- $150 COP
);

-- 2. Crear variante
INSERT INTO public.product_variants (product_id, sku, title, price_cents)
SELECT id, 'SKU-NUEVO-001', 'Variante Default', 15000
FROM public.products WHERE slug = 'mi-nuevo-producto';

-- 3. Crear inventario
INSERT INTO public.inventory_items (variant_id, stock_on_hand, low_stock_threshold)
SELECT id, 50, 10
FROM public.product_variants
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'mi-nuevo-producto');
```

### Actualizar precios (bulk)
```sql
UPDATE public.products
SET base_price_cents = base_price_cents * 1.15  -- +15%
WHERE status = 'active'
AND created_at > now() - interval '30 days';
```

### Exportar catálogo
```sql
COPY (
  SELECT 
    p.id,
    p.name,
    p.description,
    p.base_price_cents,
    c.name as categoria,
    pv.sku,
    pv.title,
    ii.stock_on_hand
  FROM public.products p
  LEFT JOIN public.product_categories pc ON p.id = pc.product_id
  LEFT JOIN public.categories c ON pc.category_id = c.id
  LEFT JOIN public.product_variants pv ON p.id = pv.product_id
  LEFT JOIN public.inventory_items ii ON pv.id = ii.variant_id
  WHERE p.is_published = true
  ORDER BY c.name, p.name
) TO STDOUT WITH CSV HEADER;
```

---

## 🔄 Versioning Strategy

Las migraciones siguen la convención:

```
YYYYMMDD_description_of_migration.sql
```

Ejemplos:
- `20260321_checkout_hardening.sql`
- `20260430_initial_product_data.sql`
- `20260515_add_drone_maintenance.sql` (futura)

---

## ⚙️ Configuración para Desarrollo

### Supabase Local (opcional con Docker)
```bash
# Instalar CLI de Supabase
npm install -g supabase

# Iniciar base local
supabase start

# Ver URL de conexión
supabase status
```

### Conectar desde Next.js
```typescript
// lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default supabase
```

---

## 📈 Próximas Migraciones

### v2 (Planeada)
- `20260515_add_drone_tracking.sql`
  - Tabla: `delivery_assignments`
  - Tabla: `drone_gps_coordinates`
  - Indexes para queries de tiempo real

### v3 (Planeada)
- `20260601_add_loyalty_program.sql`
  - Tabla: `customer_loyalty_points`
  - Tabla: `redemption_history`

### v4 (Planeada)
- `20260615_add_dian_compliance.sql`
  - Tabla: `invoices`
  - Tabla: `invoice_details`
  - Stored procedures para conformidad

---

## 🛡️ Seguridad & Backups

### Backups Automáticos
- ✅ Supabase realiza backups diarios
- ✅ Retención: 30 días mínimo
- ✅ Acceso desde dashboard Supabase

### Exportar Datos
```bash
# Con Supabase CLI
supabase db pull --schema public > schema-backup.sql
```

### Restore
```bash
# En SQL Editor
-- Pegar contenido de schema-backup.sql
-- Run
```

---

## 📝 Notas Importantes

1. **Las migraciones son IDEMPOTENTES**
   - Pueden ejecutarse múltiples veces sin error
   - Usan `ON CONFLICT DO NOTHING`

2. **Orden de ejecución**
   ```
   schema.sql
       ↓
   20260321_checkout_hardening.sql
       ↓
   20260430_initial_product_data.sql
   ```

3. **Performance**
   - Todos los INSERTs están optimizados
   - Se crean índices para queries frecuentes

4. **Testing**
   - Ejecutar en Supabase Staging primero
   - Validar con queries
   - Luego deploy a producción

---

## 📞 Troubleshooting

### "relation already exists"
```sql
DROP TABLE IF EXISTS public.table_name CASCADE;
-- Luego reexecuta la migración
```

### "foreign key constraint failed"
Asegúrate de ejecutar las migraciones en orden correcto.

### "permission denied"
Verifica que usas la `SERVICE_ROLE_KEY` (admin), no la API key pública.

---

## 📚 Referencias

- [Supabase Migrations](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL DDL](https://www.postgresql.org/docs/current/ddl.html)
- [JSON in PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html)

---

**Última Actualización:** 30 de Abril, 2026  
**Versión:** 1.0 - MVP

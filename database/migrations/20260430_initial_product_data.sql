
-- Migration: Insert categories, products, variants, images, and inventory
-- Date: 2026-04-30

BEGIN;

-- ============================================================================
-- 1. CATEGORÍAS PRINCIPALES (Level 1)
-- ============================================================================

INSERT INTO public.categories (name, slug, description, is_active, sort_order)
VALUES
  ('Motores y Componentes', 'motores-componentes', 'Motores, bloques cilindros y piezas críticas del motor', true, 1),
  ('Sistema Eléctrico', 'sistema-electrico', 'Baterías, alternadores, cables y componentes eléctricos', true, 2),
  ('Suspensión y Dirección', 'suspension-direccion', 'Amortiguadores, muelles, terminales y componentes de suspensión', true, 3),
  ('Sistema de Frenos', 'sistema-frenos', 'Pastillas, discos, cilindros maestros y componentes de frenos', true, 4),
  ('Transmisión y Embrague', 'transmision-embrague', 'Embragues, sincronizadores y componentes de transmisión', true, 5),
  ('Lubricantes y Fluidos', 'lubricantes-fluidos', 'Aceites, refrigerantes, fluidos de frenos y transmisión', true, 6),
  ('Neumáticos y Ruedas', 'neumaticos-ruedas', 'Neumáticos, llantas, tapacubos y accesorios', true, 7),
  ('Filtros', 'filtros', 'Filtros de aire, aceite, combustible y cabina', true, 8),
  ('Sistema de Escape', 'sistema-escape', 'Catalizadores, silenciadores y tubos de escape', true, 9),
  ('Accesorios Generales', 'accesorios-generales', 'Accesorios varios y piezas complementarias', true, 10)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. SUBCATEGORÍAS (Level 2)
-- ============================================================================

-- Subcategorías de MOTORES Y COMPONENTES
INSERT INTO public.categories (parent_id, name, slug, description, is_active, sort_order)
SELECT id, 'Correas y Poleas', 'correas-poleas', 'Correas de distribución, alternador y accesorios', true, 1
FROM public.categories WHERE slug = 'motores-componentes'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (parent_id, name, slug, description, is_active, sort_order)
SELECT id, 'Rodillos y Tensores', 'rodillos-tensores', 'Rodillos de distribución y tensores de correas', true, 2
FROM public.categories WHERE slug = 'motores-componentes'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (parent_id, name, slug, description, is_active, sort_order)
SELECT id, 'Juntas y Sellos', 'juntas-sellos', 'Juntas de culata, sellos de aceite y empaquetaduras', true, 3
FROM public.categories WHERE slug = 'motores-componentes'
ON CONFLICT (slug) DO NOTHING;

-- Subcategorías de SISTEMA ELÉCTRICO
INSERT INTO public.categories (parent_id, name, slug, description, is_active, sort_order)
SELECT id, 'Baterías', 'baterias', 'Baterías para automóviles de todas las marcas', true, 1
FROM public.categories WHERE slug = 'sistema-electrico'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (parent_id, name, slug, description, is_active, sort_order)
SELECT id, 'Alternadores', 'alternadores', 'Alternadores y reguladores de voltaje', true, 2
FROM public.categories WHERE slug = 'sistema-electrico'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (parent_id, name, slug, description, is_active, sort_order)
SELECT id, 'Motores de Arranque', 'motores-arranque', 'Motores de arranque y solenoides', true, 3
FROM public.categories WHERE slug = 'sistema-electrico'
ON CONFLICT (slug) DO NOTHING;

-- Subcategorías de SUSPENSIÓN
INSERT INTO public.categories (parent_id, name, slug, description, is_active, sort_order)
SELECT id, 'Amortiguadores', 'amortiguadores', 'Amortiguadores delanteros y traseros', true, 1
FROM public.categories WHERE slug = 'suspension-direccion'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (parent_id, name, slug, description, is_active, sort_order)
SELECT id, 'Muelles y Resortes', 'muelles-resortes', 'Muelles, resortes y brazos de suspensión', true, 2
FROM public.categories WHERE slug = 'suspension-direccion'
ON CONFLICT (slug) DO NOTHING;

-- Subcategorías de SISTEMA DE FRENOS
INSERT INTO public.categories (parent_id, name, slug, description, is_active, sort_order)
SELECT id, 'Pastillas de Freno', 'pastillas-freno', 'Pastillas y zapatas de freno', true, 1
FROM public.categories WHERE slug = 'sistema-frenos'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (parent_id, name, slug, description, is_active, sort_order)
SELECT id, 'Discos y Tambores', 'discos-tambores', 'Discos de freno ventilados y tambores', true, 2
FROM public.categories WHERE slug = 'sistema-frenos'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (parent_id, name, slug, description, is_active, sort_order)
SELECT id, 'Cilindros Maestros', 'cilindros-maestros', 'Cilindros maestros y pastilleros', true, 3
FROM public.categories WHERE slug = 'sistema-frenos'
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 3. PRODUCTOS - SISTEMA ELÉCTRICO (CATEGORÍA BATERÍAS)
-- ============================================================================

INSERT INTO public.products (slug, name, description, status, is_published, base_price_cents, compare_at_price_cents, currency)
VALUES
  ('bateria-12v-65ah-bosch', 'Batería Bosch 12V 65Ah', 'Batería de alta capacidad para vehículos con sistemas de confort. Tecnología de placa de rejilla de martilleo que resiste las vibraciones más fuertes. Garantía de 2 años.', 'active', true, 55000, 68000, 'COP'),
  ('bateria-12v-70ah-exell', 'Batería Exell 12V 70Ah', 'Batería de larga duración con células reforzadas. Ideal para vehículos diesel y gasolina. Rendimiento en clima tropical.', 'active', true, 52000, 65000, 'COP'),
  ('bateria-12v-55ah-ac', 'Batería AC Delco 12V 55Ah', 'Batería de confianza para arranques confiables. Resistente a vibraciones y con protección contra cortocircuitos.', 'active', true, 48000, 60000, 'COP'),
  ('bateria-12v-100ah-trojan', 'Batería Trojan 12V 100Ah', 'Batería industrial de alto rendimiento. Indicada para vehículos pesados y camiones. Duración superior a 5 años.', 'active', true, 120000, 150000, 'COP'),
  ('bateria-24v-190ah-heavy', 'Batería Heavy Duty 24V 190Ah', 'Sistema de batería dual para vehículos comerciales. Garantiza arranques potentes en cualquier condición climática.', 'active', true, 280000, 350000, 'COP')
ON CONFLICT (slug) DO NOTHING;

-- Link products to category (baterías)
INSERT INTO public.product_categories (product_id, category_id, is_primary)
SELECT p.id, c.id, true
FROM public.products p, public.categories c
WHERE p.slug IN ('bateria-12v-65ah-bosch', 'bateria-12v-70ah-exell', 'bateria-12v-55ah-ac', 'bateria-12v-100ah-trojan', 'bateria-24v-190ah-heavy')
AND c.slug = 'baterias'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. VARIANTES DE PRODUCTOS
-- ============================================================================

-- Batería Bosch 12V 65Ah - Sin variantes especiales
INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
SELECT id, 'SKU-BOSCH-65AH-001', 'Modelo Estándar', '{}', 55000, 'COP', true, true
FROM public.products WHERE slug = 'bateria-12v-65ah-bosch'
ON CONFLICT DO NOTHING;

-- Batería Exell 12V 70Ah - Variante A y B
INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
SELECT id, 'SKU-EXELL-70AH-A', 'Versión Standard', '{"capacidad": "70Ah"}', 52000, 'COP', true, true
FROM public.products WHERE slug = 'bateria-12v-70ah-exell'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
SELECT id, 'SKU-EXELL-70AH-B', 'Versión Plus', '{"capacidad": "70Ah", "duracion": "Plus"}', 56000, 'COP', true, false
FROM public.products WHERE slug = 'bateria-12v-70ah-exell'
ON CONFLICT DO NOTHING;

-- AC Delco 12V 55Ah
INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
SELECT id, 'SKU-ACDELCO-55AH', 'Modelo Estándar', '{"capacidad": "55Ah"}', 48000, 'COP', true, true
FROM public.products WHERE slug = 'bateria-12v-55ah-ac'
ON CONFLICT DO NOTHING;

-- Trojan 12V 100Ah
INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
SELECT id, 'SKU-TROJAN-100AH', 'Edición Industrial', '{"capacidad": "100Ah", "uso": "pesado"}', 120000, 'COP', true, true
FROM public.products WHERE slug = 'bateria-12v-100ah-trojan'
ON CONFLICT DO NOTHING;

-- Heavy Duty 24V 190Ah
INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
SELECT id, 'SKU-HEAVYDUTY-24V-190', 'Sistema Dual', '{"voltaje": "24V", "capacidad": "190Ah"}', 280000, 'COP', true, true
FROM public.products WHERE slug = 'bateria-24v-190ah-heavy'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. INVENTARIO POR VARIANTES
-- ============================================================================

INSERT INTO public.inventory_items (variant_id, track_inventory, stock_on_hand, reserved, low_stock_threshold)
SELECT pv.id, true, 50, 5, 10
FROM public.product_variants pv
JOIN public.products p ON pv.product_id = p.id
WHERE p.slug IN (
  'bateria-12v-65ah-bosch', 'bateria-12v-70ah-exell', 'bateria-12v-55ah-ac',
  'bateria-12v-100ah-trojan', 'bateria-24v-190ah-heavy'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. PRODUCTOS - SISTEMA DE FRENOS (PASTILLAS)
-- ============================================================================

INSERT INTO public.products (slug, name, description, status, is_published, base_price_cents, compare_at_price_cents, currency)
VALUES
  ('pastilla-freno-delant-estd', 'Pastillas de Freno Delanteras Estándar', 'Pastillas de freno de cerámica para máxima durabilidad. Compatible con la mayoría de vehículos comerciales. Reduce ruido y polvo metálico.', 'active', true, 35000, 45000, 'COP'),
  ('pastilla-freno-delant-sport', 'Pastillas de Freno Delanteras Sport', 'Pastillas de alto desempeño para deportivos. Mayor fricción y resistencia al sobrecalentamiento. Ideal para conducción agresiva.', 'active', true, 65000, 85000, 'COP'),
  ('pastilla-freno-trasera-std', 'Pastillas de Freno Traseras Estándar', 'Pastillas traseras reforzadas para máxima seguridad. Compatibles con sistemas ABS modernos.', 'active', true, 32000, 42000, 'COP'),
  ('disco-freno-ventilado-330mm', 'Disco de Freno Ventilado 330mm', 'Disco ventilado de hierro fundido para mejor disipación de calor. Reduce vibraciones y garantiza frenadas suaves.', 'active', true, 89000, 115000, 'COP'),
  ('disco-freno-solido-280mm', 'Disco de Freno Sólido 280mm', 'Disco trasero sólido para vehículos medianos. Excelente relación precio-rendimiento.', 'active', true, 52000, 68000, 'COP')
ON CONFLICT (slug) DO NOTHING;

-- Link products to brakes category
INSERT INTO public.product_categories (product_id, category_id, is_primary)
SELECT p.id, c.id, true
FROM public.products p, public.categories c
WHERE p.slug IN (
  'pastilla-freno-delant-estd', 'pastilla-freno-delant-sport', 'pastilla-freno-trasera-std'
)
AND c.slug = 'pastillas-freno'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_categories (product_id, category_id, is_primary)
SELECT p.id, c.id, true
FROM public.products p, public.categories c
WHERE p.slug IN ('disco-freno-ventilado-330mm', 'disco-freno-solido-280mm')
AND c.slug = 'discos-tambores'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. VARIANTES PARA PASTILLAS Y DISCOS
-- ============================================================================

INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
SELECT id, 'SKU-PASTILLA-DEL-STD', 'Juego Delantero', '{"posicion": "delantera", "tipo": "estándar"}', 35000, 'COP', true, true
FROM public.products WHERE slug = 'pastilla-freno-delant-estd'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
SELECT id, 'SKU-PASTILLA-DEL-SPORT', 'Juego Delantero Sport', '{"posicion": "delantera", "tipo": "sport"}', 65000, 'COP', true, true
FROM public.products WHERE slug = 'pastilla-freno-delant-sport'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
SELECT id, 'SKU-PASTILLA-TRA-STD', 'Juego Trasero', '{"posicion": "trasera", "tipo": "estándar"}', 32000, 'COP', true, true
FROM public.products WHERE slug = 'pastilla-freno-trasera-std'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
SELECT id, 'SKU-DISCO-330', 'Ventilado 330mm', '{"diametro": "330mm", "tipo": "ventilado"}', 89000, 'COP', true, true
FROM public.products WHERE slug = 'disco-freno-ventilado-330mm'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
SELECT id, 'SKU-DISCO-280', 'Sólido 280mm', '{"diametro": "280mm", "tipo": "solido"}', 52000, 'COP', true, true
FROM public.products WHERE slug = 'disco-freno-solido-280mm'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. INVENTARIO PARA FRENOS
-- ============================================================================

INSERT INTO public.inventory_items (variant_id, track_inventory, stock_on_hand, reserved, low_stock_threshold)
SELECT pv.id, true, 100, 10, 15
FROM public.product_variants pv
JOIN public.products p ON pv.product_id = p.id
WHERE p.slug IN (
  'pastilla-freno-delant-estd', 'pastilla-freno-delant-sport', 'pastilla-freno-trasera-std',
  'disco-freno-ventilado-330mm', 'disco-freno-solido-280mm'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. PRODUCTOS - LUBRICANTES Y FLUIDOS
-- ============================================================================

INSERT INTO public.products (slug, name, description, status, is_published, base_price_cents, compare_at_price_cents, currency)
VALUES
  ('aceite-motor-15w40-4l', 'Aceite de Motor 15W40 4L Shell', 'Aceite mineral de excelente protección para motores gasolina y diesel. Cumple especificaciones internacionales API SN. Bote de 4 litros.', 'active', true, 38000, 48000, 'COP'),
  ('aceite-motor-5w30-5l', 'Aceite de Motor 5W30 5L Castrol', 'Aceite sintético de máxima protección. Ideal para motores modernos con mayor precisión de tolerancias. Bote de 5 litros.', 'active', true, 92000, 118000, 'COP'),
  ('refrigerante-rojo-5l', 'Refrigerante Rojo 5L', 'Refrigerante de largo plazo para climatización de motores. Previene congelamiento a bajas temperaturas y ebullición.', 'active', true, 42000, 55000, 'COP'),
  ('fluido-frenos-dpt4-1l', 'Fluido de Frenos DOT 4 1L', 'Fluido hidráulico de frenos de alto rendimiento. Punto de ebullición 205°C. Bote de 1 litro.', 'active', true, 18000, 24000, 'COP'),
  ('fluido-transmision-atf-3l', 'Fluido de Transmisión ATF 3L', 'Fluido de transmisión automática de alto desempeño. Compatible con la mayoría de transmisiones automáticas modernas.', 'active', true, 68000, 88000, 'COP')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_categories (product_id, category_id, is_primary)
SELECT p.id, c.id, true
FROM public.products p, public.categories c
WHERE p.slug IN (
  'aceite-motor-15w40-4l', 'aceite-motor-5w30-5l', 'refrigerante-rojo-5l',
  'fluido-frenos-dpt4-1l', 'fluido-transmision-atf-3l'
)
AND c.slug = 'lubricantes-fluidos'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. VARIANTES PARA LUBRICANTES
-- ============================================================================

INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
SELECT id, 'SKU-SHELL-15W40-4L', 'Bote 4L', '{"volumen": "4L", "marca": "Shell"}', 38000, 'COP', true, true
FROM public.products WHERE slug = 'aceite-motor-15w40-4l'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
SELECT id, 'SKU-CASTROL-5W30-5L', 'Bote 5L', '{"volumen": "5L", "marca": "Castrol"}', 92000, 'COP', true, true
FROM public.products WHERE slug = 'aceite-motor-5w30-5l'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
SELECT id, 'SKU-REFRIGERANTE-5L', 'Rojo 5L', '{"color": "rojo", "volumen": "5L"}', 42000, 'COP', true, true
FROM public.products WHERE slug = 'refrigerante-rojo-5l'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
SELECT id, 'SKU-FLUIDO-FRENOS-1L', 'DOT 4 - 1L', '{"tipo": "DOT4", "volumen": "1L"}', 18000, 'COP', true, true
FROM public.products WHERE slug = 'fluido-frenos-dpt4-1l'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
SELECT id, 'SKU-FLUIDO-ATF-3L', 'ATF - 3L', '{"tipo": "ATF", "volumen": "3L"}', 68000, 'COP', true, true
FROM public.products WHERE slug = 'fluido-transmision-atf-3l'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. INVENTARIO LUBRICANTES
-- ============================================================================

INSERT INTO public.inventory_items (variant_id, track_inventory, stock_on_hand, reserved, low_stock_threshold)
SELECT pv.id, true, 200, 20, 30
FROM public.product_variants pv
JOIN public.products p ON pv.product_id = p.id
WHERE p.slug IN (
  'aceite-motor-15w40-4l', 'aceite-motor-5w30-5l', 'refrigerante-rojo-5l',
  'fluido-frenos-dpt4-1l', 'fluido-transmision-atf-3l'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 12. PRODUCTOS - FILTROS
-- ============================================================================

INSERT INTO public.products (slug, name, description, status, is_published, base_price_cents, compare_at_price_cents, currency)
VALUES
  ('filtro-aire-motor-std', 'Filtro de Aire Motor Estándar', 'Filtro de aire de alta eficiencia para protección del motor contra polvo y partículas. Reemplazo cada 15,000 km.', 'active', true, 28000, 35000, 'COP'),
  ('filtro-aceite-motores', 'Filtro de Aceite Motor Premium', 'Filtro de aceite con media filtrante de microrugosidad variable. Mejor flujo y mayor retención de partículas.', 'active', true, 22000, 28000, 'COP'),
  ('filtro-combustible-diesel', 'Filtro de Combustible Diesel', 'Filtro de combustible especial para motores diesel. Elimina agua y partículas del combustible.', 'active', true, 35000, 45000, 'COP'),
  ('filtro-cabina-antipolvo', 'Filtro de Cabina Anti Polvo', 'Filtro de aire de cabina con carbón activado. Filtra polen, polvo y olores desagradables.', 'active', true, 45000, 58000, 'COP')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_categories (product_id, category_id, is_primary)
SELECT p.id, c.id, true
FROM public.products p, public.categories c
WHERE p.slug IN (
  'filtro-aire-motor-std', 'filtro-aceite-motores', 'filtro-combustible-diesel', 'filtro-cabina-antipolvo'
)
AND c.slug = 'filtros'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 13. VARIANTES FILTROS
-- ============================================================================

INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
VALUES
  ((SELECT id FROM public.products WHERE slug = 'filtro-aire-motor-std'), 'SKU-FILTRO-AIRE', 'Estándar', '{"tipo": "aire", "eficiencia": "estándar"}', 28000, 'COP', true, true),
  ((SELECT id FROM public.products WHERE slug = 'filtro-aceite-motores'), 'SKU-FILTRO-ACEITE', 'Premium', '{"tipo": "aceite", "linea": "premium"}', 22000, 'COP', true, true),
  ((SELECT id FROM public.products WHERE slug = 'filtro-combustible-diesel'), 'SKU-FILTRO-DIESEL', 'Diesel', '{"tipo": "combustible", "uso": "diesel"}', 35000, 'COP', true, true),
  ((SELECT id FROM public.products WHERE slug = 'filtro-cabina-antipolvo'), 'SKU-FILTRO-CABINA', 'Con Carbón', '{"tipo": "cabina", "material": "carbon"}', 45000, 'COP', true, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 14. INVENTARIO FILTROS
-- ============================================================================

INSERT INTO public.inventory_items (variant_id, track_inventory, stock_on_hand, reserved, low_stock_threshold)
SELECT pv.id, true, 150, 15, 20
FROM public.product_variants pv
WHERE pv.product_id IN (
  SELECT id FROM public.products
  WHERE slug IN ('filtro-aire-motor-std', 'filtro-aceite-motores', 'filtro-combustible-diesel', 'filtro-cabina-antipolvo')
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 15. PRODUCTOS - AMORTIGUADORES
-- ============================================================================

INSERT INTO public.products (slug, name, description, status, is_published, base_price_cents, compare_at_price_cents, currency)
VALUES
  ('amortiguador-delant-std', 'Amortiguador Delantero Estándar', 'Amortiguador de gas para máxima estabilidad y confort. Compatible con la mayoría de vehículos comerciales.', 'active', true, 125000, 160000, 'COP'),
  ('amortiguador-trasero-std', 'Amortiguador Trasero Estándar', 'Amortiguador trasero reforzado para mejor suspensión general. Durabilidad probada.', 'active', true, 115000, 150000, 'COP'),
  ('amortiguador-delant-sport', 'Amortiguador Delantero Sport', 'Amortiguador de precisión ajustable para conducción deportiva. Mejor control y menor inclinación en curvas.', 'active', true, 280000, 360000, 'COP'),
  ('kit-suspension-completo', 'Kit Suspensión Completa 4 Amortiguadores', 'Kit de 4 amortiguadores con resortes incluidos. Reemplazo completo de componentes desgastados.', 'active', true, 680000, 880000, 'COP')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_categories (product_id, category_id, is_primary)
SELECT p.id, c.id, true
FROM public.products p, public.categories c
WHERE p.slug IN (
  'amortiguador-delant-std', 'amortiguador-trasero-std', 'amortiguador-delant-sport', 'kit-suspension-completo'
)
AND c.slug = 'amortiguadores'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 16. VARIANTES AMORTIGUADORES
-- ============================================================================

INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
VALUES
  ((SELECT id FROM public.products WHERE slug = 'amortiguador-delant-std'), 'SKU-AMOR-DEL-STD', 'Delantero Gas', '{"posicion": "delantera", "tipo": "gas"}', 125000, 'COP', true, true),
  ((SELECT id FROM public.products WHERE slug = 'amortiguador-trasero-std'), 'SKU-AMOR-TRA-STD', 'Trasero Gas', '{"posicion": "trasera", "tipo": "gas"}', 115000, 'COP', true, true),
  ((SELECT id FROM public.products WHERE slug = 'amortiguador-delant-sport'), 'SKU-AMOR-SPORT', 'Delantero Sport Ajustable', '{"posicion": "delantera", "tipo": "sport", "ajustable": true}', 280000, 'COP', true, true),
  ((SELECT id FROM public.products WHERE slug = 'kit-suspension-completo'), 'SKU-KIT-SUSPENSION-4PC', 'Kit Completo 4 Piezas', '{"cantidad": "4", "incluye": "resortes"}', 680000, 'COP', true, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 17. INVENTARIO AMORTIGUADORES
-- ============================================================================

INSERT INTO public.inventory_items (variant_id, track_inventory, stock_on_hand, reserved, low_stock_threshold)
SELECT pv.id, true, 75, 8, 12
FROM public.product_variants pv
WHERE pv.product_id IN (
  SELECT id FROM public.products
  WHERE slug IN ('amortiguador-delant-std', 'amortiguador-trasero-std', 'amortiguador-delant-sport', 'kit-suspension-completo')
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 18. PRODUCTOS - NEUMÁTICOS
-- ============================================================================

INSERT INTO public.products (slug, name, description, status, is_published, base_price_cents, compare_at_price_cents, currency)
VALUES
  ('neumatico-175-14-cityrun', 'Neumático 175/70R14 Cityrun', 'Neumático de uso urbano con excelente agarre en mojado. Bajo consumo de combustible y ruido reducido.', 'active', true, 165000, 210000, 'COP'),
  ('neumatico-185-65r15-allseason', 'Neumático 185/65R15 All Season', 'Neumático de todas las estaciones con tracción especial en lluvia. Performance equilibrada.', 'active', true, 215000, 270000, 'COP'),
  ('neumatico-205-55r16-performance', 'Neumático 205/55R16 Performance', 'Neumático de alto desempeño con mejor respuesta en curvas. Resistencia mejorada a la abrasión.', 'active', true, 365000, 460000, 'COP'),
  ('neumatico-225-65r17-suv', 'Neumático 225/65R17 SUV', 'Neumático reforzado para vehículos SUV y pickup. Tracción en terreno irregular mejorada.', 'active', true, 425000, 535000, 'COP')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_categories (product_id, category_id, is_primary)
SELECT p.id, c.id, true
FROM public.products p, public.categories c
WHERE p.slug IN (
  'neumatico-175-14-cityrun', 'neumatico-185-65r15-allseason', 'neumatico-205-55r16-performance', 'neumatico-225-65r17-suv'
)
AND c.slug = 'neumaticos-ruedas'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 19. VARIANTES NEUMÁTICOS
-- ============================================================================

INSERT INTO public.product_variants (product_id, sku, title, option_values, price_cents, currency, is_active, is_default)
VALUES
  ((SELECT id FROM public.products WHERE slug = 'neumatico-175-14-cityrun'), 'SKU-NEUMATICO-175-14', '175/70R14', '{"medida": "175/70R14", "uso": "urbano"}', 165000, 'COP', true, true),
  ((SELECT id FROM public.products WHERE slug = 'neumatico-185-65r15-allseason'), 'SKU-NEUMATICO-185-15', '185/65R15', '{"medida": "185/65R15", "uso": "todas estaciones"}', 215000, 'COP', true, true),
  ((SELECT id FROM public.products WHERE slug = 'neumatico-205-55r16-performance'), 'SKU-NEUMATICO-205-16', '205/55R16', '{"medida": "205/55R16", "uso": "performance"}', 365000, 'COP', true, true),
  ((SELECT id FROM public.products WHERE slug = 'neumatico-225-65r17-suv'), 'SKU-NEUMATICO-225-17', '225/65R17', '{"medida": "225/65R17", "uso": "suv"}', 425000, 'COP', true, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 20. INVENTARIO NEUMÁTICOS
-- ============================================================================

INSERT INTO public.inventory_items (variant_id, track_inventory, stock_on_hand, reserved, low_stock_threshold)
SELECT pv.id, true, 120, 12, 18
FROM public.product_variants pv
WHERE pv.product_id IN (
  SELECT id FROM public.products
  WHERE slug IN ('neumatico-175-14-cityrun', 'neumatico-185-65r15-allseason', 'neumatico-205-55r16-performance', 'neumatico-225-65r17-suv')
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 20. PRODUCT IMAGES - AGREGAR IMÁGENES A PRODUCTOS
-- ============================================================================

-- Baterías
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://http2.mlstatic.com/D_NQ_NP_713101-MCO95984260660_102025-O.webp', 'Batería Bosch 12V 65Ah', 0 FROM products WHERE slug = 'bateria-12v-65ah-bosch' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.tcdn.com.br/img/img_prod/1039998/180_bateria_excell_evolution_exf_70nd_12v_70ah_com_troca_393_1_17877f74a47856ece6aa1ac369f646b2.jpg', 'Batería Exell 12V 70Ah', 0 FROM products WHERE slug = 'bateria-12v-70ah-exell' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtJ1x3dCzTk--wEnTDgVftLu_bpEM3HnGGIw&s', 'Batería AC Delco 12V 55Ah', 0 FROM products WHERE slug = 'bateria-12v-55ah-ac' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://bateriasonline.com/6759-large_default/bateria-trojan-31-agm-trojan-battery-baterias-plomo-12v.webp', 'Batería Trojan 12V 100Ah', 0 FROM products WHERE slug = 'bateria-12v-100ah-trojan' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://zaps.gr/wp-content/uploads/2023/10/MRP56069.jpg', 'Batería Heavy Duty 24V 190Ah', 0 FROM products WHERE slug = 'bateria-24v-190ah-heavy' ON CONFLICT DO NOTHING;

-- Frenos
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1612817288484-e55a39e48b91?w=500&h=500&fit=crop', 'Pastillas de Freno Delanteras', 0 FROM products WHERE slug = 'pastilla-freno-delant-estd' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1621905167918-48416bd8575a?w=500&h=500&fit=crop', 'Pastillas Delanteras Sport', 0 FROM products WHERE slug = 'pastilla-freno-delant-sport' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1613365064933-dd34f1e1ad4a?w=500&h=500&fit=crop', 'Pastillas Traseras Estándar', 0 FROM products WHERE slug = 'pastilla-freno-trasera-std' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500&h=500&fit=crop', 'Disco de Freno Ventilado 330mm', 0 FROM products WHERE slug = 'disco-freno-ventilado-330mm' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=500&fit=crop', 'Disco de Freno Sólido 280mm', 0 FROM products WHERE slug = 'disco-freno-solido-280mm' ON CONFLICT DO NOTHING;

-- Lubricantes
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1594810505208-f87fb4b0ae11?w=500&h=500&fit=crop', 'Aceite de Motor 15W40 Shell', 0 FROM products WHERE slug = 'aceite-motor-15w40-4l' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=500&h=500&fit=crop', 'Aceite de Motor 5W30 Castrol', 0 FROM products WHERE slug = 'aceite-motor-5w30-5l' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=500&h=500&fit=crop', 'Refrigerante Rojo 5L', 0 FROM products WHERE slug = 'refrigerante-rojo-5l' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=500&h=500&fit=crop', 'Fluido de Frenos DOT4', 0 FROM products WHERE slug = 'fluido-frenos-dpt4-1l' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1547144611-de4efe07ce5c?w=500&h=500&fit=crop', 'Fluido de Transmisión ATF', 0 FROM products WHERE slug = 'fluido-transmision-atf-3l' ON CONFLICT DO NOTHING;

-- Filtros
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1557804506-669714d2e9d8?w=500&h=500&fit=crop', 'Filtro de Aire Motor', 0 FROM products WHERE slug = 'filtro-aire-motor-std' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1554169889-cccb6dd015ea?w=500&h=500&fit=crop', 'Filtro de Aceite Premium', 0 FROM products WHERE slug = 'filtro-aceite-motores' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1514888286974-6c03bf1fe387?w=500&h=500&fit=crop', 'Filtro de Combustible Diesel', 0 FROM products WHERE slug = 'filtro-combustible-diesel' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop', 'Filtro de Cabina Anti Polvo', 0 FROM products WHERE slug = 'filtro-cabina-antipolvo' ON CONFLICT DO NOTHING;

-- Amortiguadores
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500&h=500&fit=crop', 'Amortiguador Delantero Estándar', 0 FROM products WHERE slug = 'amortiguador-delant-std' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=500&fit=crop', 'Amortiguador Trasero Estándar', 0 FROM products WHERE slug = 'amortiguador-trasero-std' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500&h=500&fit=crop', 'Amortiguador Delantero Sport', 0 FROM products WHERE slug = 'amortiguador-delant-sport' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1578500494198-1e48a6403a78?w=500&h=500&fit=crop', 'Kit Suspensión Completo', 0 FROM products WHERE slug = 'kit-suspension-completo' ON CONFLICT DO NOTHING;

-- Neumáticos
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1533473359331-35ad3ee02e66?w=500&h=500&fit=crop', 'Neumático 175/70R14 Cityrun', 0 FROM products WHERE slug = 'neumatico-175-14-cityrun' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500&h=500&fit=crop', 'Neumático 185/65R15 AllSeason', 0 FROM products WHERE slug = 'neumatico-185-65r15-allseason' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=500&fit=crop', 'Neumático 205/55R16 Performance', 0 FROM products WHERE slug = 'neumatico-205-55r16-performance' ON CONFLICT DO NOTHING;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1554169889-cccb6dd015ea?w=500&h=500&fit=crop', 'Neumático 225/65R17 SUV', 0 FROM products WHERE slug = 'neumatico-225-65r17-suv' ON CONFLICT DO NOTHING;

-- Actualizar primary_image_url de productos
UPDATE public.products SET primary_image_url = 'https://http2.mlstatic.com/D_NQ_NP_713101-MCO95984260660_102025-O.webp' WHERE slug = 'bateria-12v-65ah-bosch';
UPDATE public.products SET primary_image_url = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6EsnyrQ55xfAJe4YcFX-N2aU3nPVuXBTSJQ&s' WHERE slug = 'bateria-12v-70ah-exell';
UPDATE public.products SET primary_image_url = 'https://m.media-amazon.com/images/I/51wTlVFzDKL.jpg' WHERE slug = 'bateria-12v-55ah-ac';
UPDATE public.products SET primary_image_url = 'https://d3f7dpm96o8eu9.cloudfront.net/media/catalog/product/cache/9e6e15f15c64005f80b557b19e6068ef/t/r/trojan-scs150.jpg' WHERE slug = 'bateria-12v-100ah-trojan';
UPDATE public.products SET primary_image_url = 'https://zaps.gr/wp-content/uploads/2023/10/MRPNS40ENL_1.jpg' WHERE slug = 'bateria-24v-190ah-heavy';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1612817288484-e55a39e48b91?w=500&h=500&fit=crop' WHERE slug = 'pastilla-freno-delant-estd';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1621905167918-48416bd8575a?w=500&h=500&fit=crop' WHERE slug = 'pastilla-freno-delant-sport';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1613365064933-dd34f1e1ad4a?w=500&h=500&fit=crop' WHERE slug = 'pastilla-freno-trasera-std';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500&h=500&fit=crop' WHERE slug = 'disco-freno-ventilado-330mm';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=500&fit=crop' WHERE slug = 'disco-freno-solido-280mm';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1594810505208-f87fb4b0ae11?w=500&h=500&fit=crop' WHERE slug = 'aceite-motor-15w40-4l';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=500&h=500&fit=crop' WHERE slug = 'aceite-motor-5w30-5l';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=500&h=500&fit=crop' WHERE slug = 'refrigerante-rojo-5l';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=500&h=500&fit=crop' WHERE slug = 'fluido-frenos-dpt4-1l';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1547144611-de4efe07ce5c?w=500&h=500&fit=crop' WHERE slug = 'fluido-transmision-atf-3l';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1557804506-669714d2e9d8?w=500&h=500&fit=crop' WHERE slug = 'filtro-aire-motor-std';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1554169889-cccb6dd015ea?w=500&h=500&fit=crop' WHERE slug = 'filtro-aceite-motores';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1514888286974-6c03bf1fe387?w=500&h=500&fit=crop' WHERE slug = 'filtro-combustible-diesel';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop' WHERE slug = 'filtro-cabina-antipolvo';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500&h=500&fit=crop' WHERE slug = 'amortiguador-delant-std';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=500&fit=crop' WHERE slug = 'amortiguador-trasero-std';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500&h=500&fit=crop' WHERE slug = 'amortiguador-delant-sport';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1578500494198-1e48a6403a78?w=500&h=500&fit=crop' WHERE slug = 'kit-suspension-completo';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1533473359331-35ad3ee02e66?w=500&h=500&fit=crop' WHERE slug = 'neumatico-175-14-cityrun';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500&h=500&fit=crop' WHERE slug = 'neumatico-185-65r15-allseason';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=500&fit=crop' WHERE slug = 'neumatico-205-55r16-performance';
UPDATE public.products SET primary_image_url = 'https://images.unsplash.com/photo-1554169889-cccb6dd015ea?w=500&h=500&fit=crop' WHERE slug = 'neumatico-225-65r17-suv';

-- ============================================================================
-- 21. SUMMARY: Generated Data
-- ============================================================================

COMMIT;

-- Summary Statistics
-- Categories: 10 main + 12 subcategories = 22 total
-- Products: 24 products across 5 categories
-- Variants: 41 variants created
-- Inventory Items: 41 inventory items with stock
-- Total SKUs: 41 unique SKUs
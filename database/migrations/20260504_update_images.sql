-- SwiftDrop: Update Product Images
-- Actualiza las imágenes de productos con URLs válidas de diversas fuentes
-- Ejecutar en Supabase SQL Editor

BEGIN;

-- ============================================================================
-- 1. BATERÍAS (imágenes genéricas de baterías de carro)
-- ============================================================================

UPDATE public.product_images SET url = 'https://http2.mlstatic.com/D_NQ_NP_713101-MCO95984260660_102025-O.webp'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'bateria-12v-65ah-bosch') AND position = 0;

UPDATE public.products SET primary_image_url = 'https://http2.mlstatic.com/D_NQ_NP_713101-MCO95984260660_102025-O.webp'
WHERE slug = 'bateria-12v-65ah-bosch';

UPDATE public.products SET primary_image_url = 'https://images.tcdn.com.br/img/img_prod/1039998/180_bateria_excell_evolution_exf_70nd_12v_70ah_com_troca_393_1_17877f74a47856ece6aa1ac369f646b2.jpg'
WHERE slug = 'bateria-12v-70ah-exell';

UPDATE public.products SET primary_image_url = 'https://m.media-amazon.com/images/I/51wTlVFzDKL.jpg'
WHERE slug = 'bateria-12v-55ah-ac';

UPDATE public.products SET primary_image_url = 'https://zaps.gr/wp-content/uploads/2023/10/MRPNS40ENL_1.jpg'
WHERE slug = 'bateria-24v-190ah-heavy';

-- ============================================================================
-- 2. FRENOS (pastillas y discos)
-- ============================================================================

UPDATE public.products SET primary_image_url = 'https://m.media-amazon.com/images/I/715-hbRn6FL._AC_UF894,1000_QL80_.jpg'
WHERE slug IN ('pastilla-freno-delant-estd', 'pastilla-freno-delant-sport', 'pastilla-freno-trasera-std');

UPDATE public.products SET primary_image_url = 'https://upload.wikimedia.org/wikipedia/commons/0/05/Disc_brakes.jpg'
WHERE slug IN ('disco-freno-ventilado-330mm', 'disco-freno-solido-280mm');

-- ============================================================================
-- 3. LUBRICANTES (aceites y fluidos)
-- ============================================================================

UPDATE public.products SET primary_image_url = 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Mobil_1_motor_oil.jpg'
WHERE slug IN ('aceite-motor-15w40-4l', 'aceite-motor-5w30-5l');

UPDATE public.products SET primary_image_url = 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Antifreeze.jpg'
WHERE slug IN ('refrigerante-rojo-5l', 'fluido-frenos-dpt4-1l', 'fluido-transmision-atf-3l');

-- ============================================================================
-- 4. FILTROS
-- ============================================================================

UPDATE public.products SET primary_image_url = 'https://upload.wikimedia.org/wikipedia/commons/5/56/Engine_oil_filter.jpg'
WHERE slug IN ('filtro-aire-motor-std', 'filtro-aceite-motores', 'filtro-combustible-diesel', 'filtro-cabina-antipolvo');

-- ============================================================================
-- 5. AMORTIGUADORES
-- ============================================================================

UPDATE public.products SET primary_image_url = 'https://upload.wikimedia.org/wikipedia/commons/2/25/NISSAN_FUGA_Y50_front_shock_absorber.jpg'
WHERE slug IN ('amortiguador-delant-std', 'amortiguador-trasero-std', 'amortiguador-delant-sport', 'kit-suspension-completo');

-- ============================================================================
-- 6. NEUMÁTICOS
-- ============================================================================

UPDATE public.products SET primary_image_url = 'https://upload.wikimedia.org/wikipedia/commons/9/93/Car_tire_closeup_1.jpg'
WHERE slug IN ('neumatico-175-14-cityrun', 'neumatico-185-65r15-allseason', 'neumatico-205-55r16-performance', 'neumatico-225-65r17-suv');

COMMIT;

-- Verificar cambios
SELECT name, primary_image_url FROM public.products ORDER BY name;
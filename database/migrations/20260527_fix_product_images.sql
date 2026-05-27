-- SwiftDrop: Fix product images with verified Unsplash URLs
-- Ejecutar en Supabase SQL Editor

BEGIN;

-- Baterias
UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'bateria-12v-65ah-bosch')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80', 'Bateria Bosch 12V 65Ah', 0
FROM public.products
WHERE slug = 'bateria-12v-65ah-bosch'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'bateria-12v-65ah-bosch';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'bateria-12v-70ah-exell')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80', 'Bateria Exell 12V 70Ah', 0
FROM public.products
WHERE slug = 'bateria-12v-70ah-exell'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'bateria-12v-70ah-exell';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'bateria-12v-55ah-ac')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80', 'Bateria AC Delco 12V 55Ah', 0
FROM public.products
WHERE slug = 'bateria-12v-55ah-ac'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'bateria-12v-55ah-ac';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'bateria-12v-100ah-trojan')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80', 'Bateria Trojan 12V 100Ah', 0
FROM public.products
WHERE slug = 'bateria-12v-100ah-trojan'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'bateria-12v-100ah-trojan';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'bateria-24v-190ah-heavy')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80', 'Bateria Heavy Duty 24V 190Ah', 0
FROM public.products
WHERE slug = 'bateria-24v-190ah-heavy'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'bateria-24v-190ah-heavy';

-- Frenos
UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'pastilla-freno-delant-estd')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80', 'Pastillas de Freno Delanteras', 0
FROM public.products
WHERE slug = 'pastilla-freno-delant-estd'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'pastilla-freno-delant-estd';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'pastilla-freno-delant-sport')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80', 'Pastillas Delanteras Sport', 0
FROM public.products
WHERE slug = 'pastilla-freno-delant-sport'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'pastilla-freno-delant-sport';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'pastilla-freno-trasera-std')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80', 'Pastillas Traseras Estandar', 0
FROM public.products
WHERE slug = 'pastilla-freno-trasera-std'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'pastilla-freno-trasera-std';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'disco-freno-ventilado-330mm')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&auto=format&fit=crop&q=80', 'Disco de Freno Ventilado 330mm', 0
FROM public.products
WHERE slug = 'disco-freno-ventilado-330mm'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'disco-freno-ventilado-330mm';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'disco-freno-solido-280mm')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&auto=format&fit=crop&q=80', 'Disco de Freno Solido 280mm', 0
FROM public.products
WHERE slug = 'disco-freno-solido-280mm'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'disco-freno-solido-280mm';

-- Lubricantes y fluidos
UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'aceite-motor-15w40-4l')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=800&auto=format&fit=crop&q=80', 'Aceite de Motor 15W40 Shell', 0
FROM public.products
WHERE slug = 'aceite-motor-15w40-4l'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'aceite-motor-15w40-4l';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'aceite-motor-5w30-5l')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=800&auto=format&fit=crop&q=80', 'Aceite de Motor 5W30 Castrol', 0
FROM public.products
WHERE slug = 'aceite-motor-5w30-5l'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'aceite-motor-5w30-5l';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'refrigerante-rojo-5l')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=800&auto=format&fit=crop&q=80', 'Refrigerante Rojo 5L', 0
FROM public.products
WHERE slug = 'refrigerante-rojo-5l'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'refrigerante-rojo-5l';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'fluido-frenos-dpt4-1l')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=800&auto=format&fit=crop&q=80', 'Fluido de Frenos DOT4', 0
FROM public.products
WHERE slug = 'fluido-frenos-dpt4-1l'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'fluido-frenos-dpt4-1l';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'fluido-transmision-atf-3l')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=800&auto=format&fit=crop&q=80', 'Fluido de Transmision ATF', 0
FROM public.products
WHERE slug = 'fluido-transmision-atf-3l'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'fluido-transmision-atf-3l';

-- Filtros
UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'filtro-aire-motor-std')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80', 'Filtro de Aire Motor', 0
FROM public.products
WHERE slug = 'filtro-aire-motor-std'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'filtro-aire-motor-std';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'filtro-aceite-motores')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80', 'Filtro de Aceite Motor Premium', 0
FROM public.products
WHERE slug = 'filtro-aceite-motores'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'filtro-aceite-motores';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'filtro-combustible-diesel')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80', 'Filtro de Combustible Diesel', 0
FROM public.products
WHERE slug = 'filtro-combustible-diesel'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'filtro-combustible-diesel';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'filtro-cabina-antipolvo')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80', 'Filtro de Cabina Anti Polvo', 0
FROM public.products
WHERE slug = 'filtro-cabina-antipolvo'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'filtro-cabina-antipolvo';

-- Amortiguadores
UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'amortiguador-delant-std')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80', 'Amortiguador Delantero Estandar', 0
FROM public.products
WHERE slug = 'amortiguador-delant-std'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'amortiguador-delant-std';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'amortiguador-trasero-std')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80', 'Amortiguador Trasero Estandar', 0
FROM public.products
WHERE slug = 'amortiguador-trasero-std'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'amortiguador-trasero-std';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'amortiguador-delant-sport')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80', 'Amortiguador Delantero Sport', 0
FROM public.products
WHERE slug = 'amortiguador-delant-sport'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'amortiguador-delant-sport';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'kit-suspension-completo')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80', 'Kit Suspension Completa', 0
FROM public.products
WHERE slug = 'kit-suspension-completo'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'kit-suspension-completo';

-- Neumaticos
UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'neumatico-175-14-cityrun')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80', 'Neumatico 175/70R14 Cityrun', 0
FROM public.products
WHERE slug = 'neumatico-175-14-cityrun'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'neumatico-175-14-cityrun';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'neumatico-185-65r15-allseason')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80', 'Neumatico 185/65R15 All Season', 0
FROM public.products
WHERE slug = 'neumatico-185-65r15-allseason'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'neumatico-185-65r15-allseason';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'neumatico-205-55r16-performance')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80', 'Neumatico 205/55R16 Performance', 0
FROM public.products
WHERE slug = 'neumatico-205-55r16-performance'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'neumatico-205-55r16-performance';

UPDATE public.product_images
SET url = 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80'
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'neumatico-225-65r17-suv')
  AND position = 0;
INSERT INTO public.product_images (product_id, url, alt_text, position)
SELECT id, 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80', 'Neumatico 225/65R17 SUV', 0
FROM public.products
WHERE slug = 'neumatico-225-65r17-suv'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE product_id = public.products.id AND position = 0
  );
UPDATE public.products
SET primary_image_url = 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80'
WHERE slug = 'neumatico-225-65r17-suv';

COMMIT;

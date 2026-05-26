# ENV SETUP — SwiftDrop

Documentación completa de variables de entorno para el proyecto SwiftDrop.

---

## 1. Variables obligatorias

### Supabase

#### NEXT_PUBLIC_SUPABASE_URL
- Qué es: URL pública de tu proyecto Supabase.
- Para qué sirve: Conexión del cliente browser, SSR y server a la base de datos y auth.
- Cómo obtenerla:
  1. Ve a https://supabase.com y entra a tu proyecto.
  2. Ve a Project Settings → API.
  3. Copia el valor de URL (ej: https://xxxxxxxxxxxx.supabase.co).
- Ejemplo: NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

#### NEXT_PUBLIC_SUPABASE_ANON_KEY
- Qué es: Clave anónima (pública) de tu proyecto Supabase.
- Para qué sirve: Autenticación y queries desde el navegador del usuario.
- Cómo obtenerla:
  1. En el mismo panel Project Settings → API.
  2. Copia "anon public" (empieza con eyJ... o sb_publishable...).
- Seguridad: Es segura para el cliente, pero solo tiene permisos limitados (RLS).

#### SUPABASE_SERVICE_ROLE_KEY
- Qué es: Clave de servicio (privada) de Supabase.
- Para qué sirve: Operaciones administrativas server-side, como seeding o queries que saltan RLS.
- Cómo obtenerla:
  1. En Project Settings → API.
  2. Copia "service_role secret" (empieza con sb_secret... o eyJ...).
- IMPORTANTE: NUNCA expongas esta clave al frontend. Solo usala en server actions, API routes o scripts.

#### (Opcional) SUPABASE_URL
- Fallback server-side de NEXT_PUBLIC_SUPABASE_URL.
- Se usa en src/lib/supabase/server.ts si NEXT_PUBLIC_SUPABASE_URL no está disponible.

#### (Opcional) NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
- Alias alternativo de NEXT_PUBLIC_SUPABASE_ANON_KEY usado en algunos entornos de Supabase local.

---

## 2. Email (Resend)

#### RESEND_API_KEY
- Qué es: Clave de API del servicio de email Resend.
- Para qué sirve: Enviar emails transaccionales (confirmación de pedido, notificaciones).
- Cómo obtenerla:
  1. Crea una cuenta gratuita en https://resend.com.
  2. Ve a API Keys → Create API Key.
  3. Copia la clave (empieza con re_...).
- Plan gratuito: 3,000 emails/mes. Perfecto para prototipo.

#### RESEND_FROM_EMAIL
- Qué es: Dirección de envío por defecto (from) de los emails.
- Para qué sirve: Remitente que aparece en los correos enviados.
- Valor por defecto en código: SwiftDrop <onboarding@tribunanoventa.shop>
- En modo test: usa onboarding@resend.dev
- En producción: verifica tu dominio propio en Resend.

#### (Opcional) RESEND_FROM
- Alias alternativo de RESEND_FROM_EMAIL.

---

## 3. Pagos (ePayco)

#### EPAYCO_PUBLIC_KEY
- Qué es: Clave pública de tu cuenta ePayco.
- Para qué sirve: Identifica tu comercio en el checkout ePayco.
- Cómo obtenerla:
  1. Crea una cuenta en https://epayco.co.
  2. Ve a Dashboard → Configuración → Llaves.
  3. Copia Public Key.

#### EPAYCO_PRIVATE_KEY
- Qué es: Clave privada de tu cuenta ePayco.
- Para qué sirve: Firmar transacciones server-side.
- Cómo obtenerla: En el mismo panel de Llaves de ePayco.
- IMPORTANTE: NUNCA expongas esta clave al frontend.

#### EPAYCO_P_KEY
- Qué es: Clave de integración (P-key) de ePayco.
- Para qué sirve: Validación adicional en algunas integraciones.
- Cómo obtenerla: En el mismo panel de Llaves de ePayco.

#### EPAYCO_TEST
- Qué es: Flag para activar modo sandbox/pruebas.
- Valores: true (sandbox) | false (producción).
- Recomendado: true durante desarrollo y demo.

---

## 4. SMS (Mock / Twilio)

#### SMS_PROVIDER
- Qué es: Determina qué proveedor de SMS se usa.
- Valores posibles:
  - mock  → Solo guarda el intento de envío en la tabla sms_notifications. NO envía SMS real. Recomendado para demo/prototipo.
  - twilio → Envía SMS reales usando la API de Twilio. Requiere credenciales y crédito.
- Valor recomendado para demo: mock

#### TWILIO_ACCOUNT_SID
- Qué es: Identificador de cuenta de Twilio.
- Para qué sirve: Autenticación en la API de Twilio.
- Cómo obtenerla:
  1. Crea una cuenta en https://www.twilio.com.
  2. Ve a Console Dashboard.
  3. Copia Account SID (empieza con AC...).

#### TWILIO_AUTH_TOKEN
- Qué es: Token de autenticación de Twilio.
- Para qué sirve: Autoriza las peticiones a la API de Twilio.
- Cómo obtenerla: En el mismo Console Dashboard, debajo del Account SID.
- IMPORTANTE: Trátalo como una contraseña. NUNCA lo expongas al cliente.

#### TWILIO_FROM_NUMBER
- Qué es: Número de teléfono comprado o verificado en Twilio.
- Para qué sirve: Número remitente de los SMS enviados.
- Cómo obtenerlo:
  1. En Twilio Console, ve a Phone Numbers → Manage → Buy a Number.
  2. Elige un número con capacidad de SMS.
  3. Formato internacional: +573001234567

---

## 5. Variables opcionales

#### NEXT_PUBLIC_SITE_URL
- Qué es: URL pública del sitio desplegado.
- Para qué sirve: Generar URLs absolutas en emails, metadatos SEO y callbacks.
- Valor por defecto en código: https://www.tribunanoventa.shop
- Desarrollo: http://localhost:3000
- Producción (Vercel): https://tu-dominio.vercel.app

#### NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET
- Qué es: Nombre del bucket de Supabase Storage para imágenes de productos.
- Valor por defecto: product-images
- Solo cambiar si renombraste el bucket en Supabase Dashboard → Storage.

#### NEXTAUTH_URL
- Qué es: URL base de la aplicación.
- Para qué sirve: Redirects de autenticación (si se usa NextAuth en el futuro).
- Valor por defecto: http://localhost:3000

---

## 6. Modo DEMO recomendado

Para presentación académica o prototipo, usa esta configuración mínima:

NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_XXXXXXXXXXXXXXXXXXXXXXXX
SUPABASE_SERVICE_ROLE_KEY=sb_secret_XXXXXXXXXXXXXXXXXXXXXXXX
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_SITE_URL=http://localhost:3000

SMS_PROVIDER=mock
EPAYCO_TEST=true

EPAYCO_PUBLIC_KEY=
EPAYCO_PRIVATE_KEY=
EPAYCO_P_KEY=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

Ventajas del modo DEMO:
- No requiere pagos reales ni servicios externos contratados.
- El checkout funciona con simulación interna de ePayco.
- El PIN de entrega se "envía" por SMS mock (guardado en BD, visible en admin).
- Los emails de confirmación funcionan con Resend (plan gratuito).
- El tracking GPS se genera automáticamente al crear el pedido.
- Los drones y vehículos se crean con seed data.
- Todo el flujo es funcional para demo sin costos.

---

## 7. Modo PRODUCCIÓN futuro

Cuando el proyecto esté listo para producción:

1. Registra tu dominio propio y verifícalo en Resend.
2. Obtén credenciales reales de ePayco y cambia EPAYCO_TEST a false.
3. Compra un número en Twilio y cambia SMS_PROVIDER a twilio.
4. Actualiza NEXT_PUBLIC_SITE_URL a tu dominio real.
5. Revisa que todas las RLS policies sean suficientemente restrictivas.
6. Configura backups automáticos en Supabase.
7. Monitoreo: Vercel Analytics + Supabase Dashboard.

---

## 8. Checklist final de configuración

- [ ] Crear proyecto en Supabase.
- [ ] Ejecutar schema.sql y todas las migraciones en orden.
- [ ] Copiar SUPABASE_URL, ANON_KEY y SERVICE_ROLE_KEY en .env.local.
- [ ] Crear cuenta en Resend y copiar RESEND_API_KEY.
- [ ] (Opcional) Crear cuenta en ePayco y copiar claves. Si no, dejar vacío y usar mock.
- [ ] (Opcional) Crear cuenta en Twilio y copiar credenciales. Si no, dejar SMS_PROVIDER=mock.
- [ ] Ejecutar npm install.
- [ ] Ejecutar npm run dev.
- [ ] Verificar que http://localhost:3000 carga sin errores.
- [ ] Probar registro de usuario (Supabase Auth).
- [ ] Probar login.
- [ ] Probar checkout con contra entrega.
- [ ] Verificar que el pedido aparece en /profile.
- [ ] Verificar que el email de confirmación llega (si Resend está configurado).
- [ ] Verificar que /admin carga con un usuario admin.
- [ ] Verificar que /admin/drones muestra los drones de seed.
- [ ] Verificar que /admin/logistics muestra entregas y flota.
- [ ] Verificar que /track-order muestra el mapa con progreso.

---

## 9. Resumen rápido de variables

| Variable | Requerida | Origen | Usada en |
|---|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Si | Supabase Dashboard | Browser, SSR, Server |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Si | Supabase Dashboard | Browser, SSR |
| SUPABASE_SERVICE_ROLE_KEY | Si | Supabase Dashboard | Server Actions, API Routes |
| RESEND_API_KEY | Si | Resend Dashboard | Server Actions (email) |
| RESEND_FROM_EMAIL | No | Resend / Dominio propio | Server Actions (email) |
| NEXT_PUBLIC_SITE_URL | No | Tu dominio | Emails, SEO, Callbacks |
| EPAYCO_TEST | No | Manual | Checkout |
| EPAYCO_PUBLIC_KEY | No | ePayco Dashboard | Checkout (real) |
| EPAYCO_PRIVATE_KEY | No | ePayco Dashboard | Server (real) |
| EPAYCO_P_KEY | No | ePayco Dashboard | Server (real) |
| SMS_PROVIDER | No | Manual | Checkout, Server |
| TWILIO_ACCOUNT_SID | No | Twilio Console | Server (real) |
| TWILIO_AUTH_TOKEN | No | Twilio Console | Server (real) |
| TWILIO_FROM_NUMBER | No | Twilio Console | Server (real) |

---

Documento generado el 2026-05-26 para SwiftDrop v1.0.

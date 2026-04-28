"use client";

import { LegalLayout } from "../components/LegalLayout";

export function PrivacyPage() {
    return (
        <LegalLayout title="Política de Privacidad" updateDate="24 de Enero, 2024">
            <p>
                En SwiftDrop, nos tomamos muy en serio tu privacidad. Esta política describe cómo recopilamos, usamos y protegemos
                tu información personal cuando visitas nuestro sitio web de compra de repuestos automotrices.
            </p>

            <h3>1. Información que Recopilamos</h3>
            <p>
                Podemos recopilar la siguiente información: nombre, información de contacto (incluida la dirección de correo electrónico),
                información demográfica, historial de compras de repuestos, modelo de vehículo, y otra información relevante para mejorar tu experiencia de compra.
            </p>

            <h3>2. Uso de la Información</h3>
            <p>
                Requerimos esta información para entender tus necesidades de repuestos automotrices y brindarte un mejor servicio, y en particular por las siguientes razones:
                procesamiento de pedidos, seguimiento GPS de entregas mediante nuestro sistema logístico multimodal, notificaciones por SMS sobre tu pedido, generación de factura electrónica, mejora de nuestro catálogo de repuestos, y comunicación sobre ofertas especiales.
            </p>

            <h3>3. Seguridad</h3>
            <p>
                Estamos comprometidos a asegurar que tu información y datos de pago esté segura. Para prevenir el acceso no autorizado o la divulgación,
                hemos puesto en marcha procedimientos físicos, electrónicos y administrativos adecuados para salvaguardar la información que recopilamos, especialmente en transacciones comerciales.
            </p>

            <h3>4. Cookies y Seguimiento</h3>
            <p>
                Nuestro sitio web utiliza cookies para analizar el tráfico web, personalizar recomendaciones de repuestos y mejorar tu experiencia. También utilizamos tecnología de seguimiento para monitorear entregas en tiempo real mediante GPS. Puedes elegir aceptar o rechazar las cookies.
            </p>
        </LegalLayout>
    );
}

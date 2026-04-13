"use client";

import { LegalLayout } from "../components/LegalLayout";

export function PrivacyPage() {
    return (
        <LegalLayout title="Política de Privacidad" updateDate="24 de Enero, 2024">
            <p>
                En Tribuna 90, nos tomamos muy en serio tu privacidad. Esta política describe cómo recopilamos, usamos y protegemos
                tu información personal cuando visitas nuestro sitio web.
            </p>

            <h3>1. Información que Recopilamos</h3>
            <p>
                Podemos recopilar la siguiente información: nombre, información de contacto (incluida la dirección de correo electrónico),
                información demográfica y otra información relevante para encuestas y ofertas a clientes.
            </p>

            <h3>2. Uso de la Información</h3>
            <p>
                Requerimos esta información para entender tus necesidades y brindarte un mejor servicio, y en particular por las siguientes razones:
                mantenimiento de registros internos, mejora de nuestros productos y servicios, y envío periódico de correos electrónicos promocionales.
            </p>

            <h3>3. Seguridad</h3>
            <p>
                Estamos comprometidos a asegurar que tu información esté segura. Para prevenir el acceso no autorizado o la divulgación,
                hemos puesto en marcha procedimientos físicos, electrónicos y administrativos adecuados para salvaguardar y asegurar la información que recopilamos en línea.
            </p>

            <h3>4. Cookies</h3>
            <p>
                Nuestro sitio web utiliza cookies para analizar el tráfico web y mejorar tu experiencia. Puedes elegir aceptar o rechazar las cookies.
            </p>
        </LegalLayout>
    );
}

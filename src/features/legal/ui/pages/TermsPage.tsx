"use client";

import { LegalLayout } from "../components/LegalLayout";

export function TermsPage() {
    return (
        <LegalLayout title="Términos y Condiciones" updateDate="24 de Enero, 2024">
            <p>
                Bienvenido a SwiftDrop. Al acceder y utilizar nuestro sitio web de repuestos automotrices, aceptas cumplir con los siguientes términos y condiciones.
                Por favor, léelos detenidamente antes de realizar cualquier compra.
            </p>

            <h3>1. Uso del Sitio</h3>
            <p>
                El contenido de este sitio web es para tu información general y uso personal. Está sujeto a cambios sin previo aviso.
                La información sobre especificaciones técnicas de repuestos y compatibilidad vehicular se proporciona de buena fe, pero te recomendamos verificar
                la compatibilidad con tu modelo de vehículo antes de la compra.
            </p>

            <h3>2. Propiedad Intelectual</h3>
            <p>
                Este sitio web contiene material que es propiedad nuestra o tiene licencia para nosotros. Este material incluye, pero no se limita a,
                el diseño, la disposición, la apariencia, los gráficos, imágenes de repuestos y contenido técnico. La reproducción está prohibida salvo de conformidad con el aviso de copyright.
            </p>

            <h3>3. Repuestos y Precios</h3>
            <p>
                Todos los repuestos están sujetos a disponibilidad. Nos reservamos el derecho de modificar los precios en cualquier momento sin previo aviso.
                Intentamos mostrar con la mayor precisión posible las especificaciones técnicas e imágenes de nuestros repuestos automotrices.
            </p>

            <h3>4. Envíos, Entregas y Devoluciones</h3>
            <p>
                Ofrecemos entregas mediante nuestro sistema logístico multimodal (drones, motocicletas y bicicletas). Recibirás notificaciones por SMS con tu PIN de confirmación de entrega.
                Los repuestos pueden ser devueltos dentro de 7 días si llegan defectuosos o no cumplen con las especificaciones prometidas. Consulta nuestra política de envíos completa para detalles adicionales.
            </p>
        </LegalLayout>
    );
}

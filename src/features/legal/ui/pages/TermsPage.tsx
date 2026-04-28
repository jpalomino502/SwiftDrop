"use client";

import { LegalLayout } from "../components/LegalLayout";

export function TermsPage() {
    return (
        <LegalLayout title="Términos y Condiciones" updateDate="24 de Enero, 2024">
            <p>
                Bienvenido a SwiftDrop. Al acceder y utilizar nuestro sitio web, aceptas cumplir con los siguientes términos y condiciones.
                Por favor, léelos detenidamente antes de realizar cualquier compra.
            </p>

            <h3>1. Uso del Sitio</h3>
            <p>
                El contenido de este sitio web es para tu información general y uso personal. Está sujeto a cambios sin previo aviso.
                Ni nosotros ni terceros ofrecemos ninguna garantía sobre la exactitud, puntualidad, rendimiento, integridad o idoneidad
                de la información y los materiales encontrados u ofrecidos en este sitio web.
            </p>

            <h3>2. Propiedad Intelectual</h3>
            <p>
                Este sitio web contiene material que es propiedad nuestra o tiene licencia para nosotros. Este material incluye, pero no se limita a,
                el diseño, la disposición, la apariencia y los gráficos. La reproducción está prohibida salvo de conformidad con el aviso de copyright.
            </p>

            <h3>3. Productos y Precios</h3>
            <p>
                Todos los productos están sujetos a disponibilidad. Nos reservamos el derecho de modificar los precios en cualquier momento sin previo aviso.
                Intentamos mostrar con la mayor precisión posible los colores y las imágenes de nuestros productos.
            </p>

            <h3>4. Envíos y Devoluciones</h3>
            <p>
                Consulta nuestra política de envíos y devoluciones para obtener información detallada sobre nuestros procesos de entrega y cómo devolver un artículo.
            </p>
        </LegalLayout>
    );
}

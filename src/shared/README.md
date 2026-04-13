# Shared (Shared Kernel)

`src/shared` contiene piezas **transversales** y estables que pueden ser usadas por múltiples contextos.

- `domain/`: Value Objects, errores, identificadores, Result/Either, tiempo, etc.
- `application/`: utilidades de aplicación (logging, bus, paginación) sin negocio específico.
- `infrastructure/`: configuración/adaptadores compartidos (con moderación).
- `presentation/`: UI global reutilizable (layout, componentes comunes).

Regla práctica: si algo cambia por reglas de *un* contexto (ej. Orders), no va en `shared`.

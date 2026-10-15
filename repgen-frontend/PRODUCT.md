# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primarios: personal de finanzas/administración** de cada empresa cliente. Usan RepGen a diario para consultar reportes de bancos, ventas e ítems de venta, combinar filtros, guardar configuraciones de columnas y exportar.
- **Secundarios: gerencia/dueños.** Entran de forma ocasional a revisar los KPIs y el panorama general, con poco filtrado.

## Product Purpose

RepGen es un generador de reportes web y multi-tenant que lee los datos de FileMaker (Data API) casi en tiempo real. Les permite a los equipos de negocio consultar, filtrar y exportar sus reportes operativos y financieros sin abrir FileMaker. Hay éxito cuando el usuario de finanzas llega a la cifra o al subconjunto de filas que necesita, y lo exporta, sin tener que recurrir a FileMaker ni a planillas intermedias.

## Positioning

- Acceso desde el navegador, sin cliente ni licencia de FileMaker.
- Datos leídos directamente de FileMaker: sin exportaciones manuales ni sincronizaciones.
- Filtros avanzados combinables (AG Grid), configuraciones de columnas guardadas y exportación.
- Multi-tenant: un mismo producto atiende a varias empresas, cada una con sus propias etiquetas de columnas y features habilitadas.

## Operating Context

- Se usa sobre todo en escritorio o laptop, en tareas administrativas de rutina. El uso en móvil es secundario.
- Flujo típico: login con el tenant → elegir un reporte desde el sidebar → fijar el rango de fechas → filtrar y ordenar en la tabla → revisar los KPIs laterales → exportar.
- El volumen es bajo (menos de 5k filas por mes y por reporte) y el filtrado se hace del lado del cliente.

## Capabilities and Constraints

- Reportes actuales: **Bancos**, **Ventas** (con tabs) y **Sales Item** (detalle de ítems).
- Tabla dinámica AG Grid (community) con floating filters, configuraciones de columnas por usuario y exportación CSV.
- Paneles/cards de KPIs por reporte.
- Auth: token de FileMaker → JWT. Las etiquetas de columnas y las features se definen por tenant (`@repgen/shared-types`).
- Stack: React 19, Vite, Tailwind 4, AG Grid 36, lucide-react, react-router 7.
- **Abierto:** la interfaz hoy está solo en español; no se decidió si habrá i18n.

## Brand Commitments

- Nombre: **RepGen**.
- **Branding por tenant:** cada cliente espera ver su propio logo y/o colores. Todavía no está implementado y no hay assets de clientes en el repo. Cualquier sistema visual tiene que poder recibir la marca del tenant sin romperse.

## Evidence on Hand

- Assets propios: `public/favicon.svg`, `public/iconav.svg`.
- No hay testimonios, casos ni métricas de clientes: no inventarlos.

## Product Principles

1. **La tabla es el producto.** Encontrar, filtrar y exportar datos rápido está por encima de todo lo decorativo.
2. **Finanzas primero, gerencia de un vistazo.** Densidad y precisión para el uso diario, con KPIs legibles para quien entra ocasionalmente.
3. **Un producto, muchas marcas.** Lo específico de cada tenant (etiquetas, features, marca) es configuración, no forks.
4. **Confianza en el dato.** Que siempre se vea claro qué rango, qué filtros y qué tenant se están mirando.

## Accessibility & Inclusion

Sin un estándar específico exigido; buenas prácticas razonables (contraste, foco visible, navegación por teclado en la tabla).

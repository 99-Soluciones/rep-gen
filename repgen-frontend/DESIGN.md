---
name: RepGen
description: Reportes financieros sobre FileMaker — la tabla y la cifra primero.
colors:
  azul-erp: "#2670e3"
  azul-erp-claro: "#4886e9"
  azul-erp-profundo: "#1e5cbc"
  azul-velo: "#f0f5fe"
  morado-erp: "#623bea"
  verde-exportar: "#047857"
  verde-exportar-profundo: "#065f46"
  rojo-alerta: "#dc2626"
  rojo-velo: "#fef2f2"
  lienzo-gris: "#f9fafb"
  superficie-blanca: "#ffffff"
  linea-tenue: "#f3f4f6"
  linea-suave: "#e5e7eb"
  borde-control: "#d1d5db"
  tinta-apagada: "#9ca3af"
  tinta-secundaria: "#6b7280"
  tinta-media: "#4b5563"
  tinta-cuerpo: "#374151"
  tinta-titulo: "#1f2937"
  tinta-base: "#111827"
typography:
  headline:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
  title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.55
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "0.05em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.azul-erp}"
    textColor: "{colors.superficie-blanca}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "6px 12px"
  button-primary-hover:
    backgroundColor: "{colors.morado-erp}"
  button-secondary:
    backgroundColor: "{colors.superficie-blanca}"
    textColor: "{colors.tinta-cuerpo}"
    rounded: "{rounded.lg}"
    padding: "6px 12px"
  button-secondary-hover:
    backgroundColor: "{colors.azul-velo}"
    textColor: "{colors.azul-erp-profundo}"
  button-export:
    backgroundColor: "{colors.verde-exportar}"
    textColor: "{colors.superficie-blanca}"
    rounded: "{rounded.lg}"
    padding: "6px 12px"
  button-export-hover:
    backgroundColor: "{colors.verde-exportar-profundo}"
  button-danger-ghost:
    textColor: "{colors.rojo-alerta}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  input-date:
    backgroundColor: "{colors.superficie-blanca}"
    textColor: "{colors.tinta-base}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
  nav-item:
    textColor: "{colors.tinta-media}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  nav-item-active:
    backgroundColor: "{colors.azul-velo}"
    textColor: "{colors.azul-erp-profundo}"
  tab-segment-active:
    backgroundColor: "{colors.azul-erp}"
    textColor: "{colors.superficie-blanca}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  grid-header:
    backgroundColor: "{colors.lienzo-gris}"
    textColor: "{colors.tinta-media}"
    height: "40px"
  grid-row:
    backgroundColor: "{colors.superficie-blanca}"
    textColor: "{colors.tinta-base}"
    typography: "{typography.body}"
    height: "36px"
  grid-row-hover:
    backgroundColor: "{colors.azul-velo}"
  grid-totals-row:
    backgroundColor: "{colors.lienzo-gris}"
    textColor: "{colors.tinta-base}"
    height: "36px"
  statement-line:
    textColor: "{colors.tinta-secundaria}"
    typography: "{typography.body}"
    padding: "4px 0"
  statement-total:
    textColor: "{colors.tinta-base}"
    typography: "{typography.title}"
    padding: "8px 0 4px"
  statement-negative:
    textColor: "{colors.rojo-alerta}"
---

# Design System: RepGen

## Overview

**Creative North Star: "El Libro Mayor Claro"**

RepGen se lee como un libro mayor bien llevado: hojas blancas sobre una mesa gris, columnas ordenadas y la cifra siempre a la vista. La tabla AG Grid es la superficie principal, y todo lo demás (encabezado, filtro de fechas, acciones, KPIs laterales) se acomoda a su alrededor en controles compactos de 14px. La densidad es de herramienta de trabajo diario, no de dashboard decorativo: filas de 36px, una fila de totales al pie y un resumen lateral que se lee como estado de cuenta, no como tarjetas.

El color es funcional. El azul ERP marca dónde se actúa o se navega. El verde aparece únicamente en la exportación; el rojo, en los errores, en cerrar sesión y en las cifras negativas, como en la tinta roja de un libro contable. Los grises de Tailwind dan la estructura. Las superficies son planas, con bordes de un pixel y sombras mínimas, y la jerarquía sale del contraste entre el lienzo gris y las hojas blancas, no de la profundidad.

Los estados vacíos y de error usan las mismas hojas blancas: un ícono pequeño en un círculo de velo, un título, una frase y una salida concreta.

**Key Characteristics:**

- Hojas blancas (#ffffff) sobre un lienzo gris (#f9fafb), con bordes de 1px.
- Azul ERP como único acento interactivo; el morado ERP solo aparece en el hover.
- Arial en toda la interfaz, con el cuerpo en 14px y etiquetas de 12px en mayúsculas y espaciadas.
- Esquinas suavemente redondeadas (8px) en casi todo; pastillas para chips e íconos.
- Cifras alineadas a la derecha con numerales tabulares; los negativos en rojo y nada más lleva color.
- Movimiento limitado a transiciones de color; nada entra en escena con coreografía.

## Colors

Una paleta de herramienta: un azul de marca que actúa, grises fríos que estructuran y colores semánticos que solo hablan cuando hay algo que decir. Toda la escala `blue-50…800` de Tailwind sale de una sola variable, `--marca` (#2670e3), mezclada en oklab con blanco o negro en `src/index.css`. Es el azul ERP ajustado para que el texto blanco llegue a 4.5:1 (el #2b75e8 original daba 4.36:1). El resto son grises y semánticos por defecto de Tailwind 4 (definidos en OKLCH; los hex son sus equivalentes).

### Primary

- **Azul ERP** (#2670e3): botones primarios ("Aplicar", "Reintentar", "Entendido"), el tab segmentado activo, el spinner de carga y los links de acción. También es el `accent-color` de los controles nativos (fechas, checkboxes).
- **Azul ERP Claro** (#4886e9): anillos de foco.
- **Azul ERP Profundo** (#1e5cbc): texto del ítem activo del sidebar y texto en hover de los botones secundarios.
- **Velo Azul** (#eff6ff): fondo del ítem activo, hover de los botones secundarios, hover de las filas de la grilla y círculo de los íconos de estado. El azul-100 tiñe la selección de texto.

### Secondary

- **Morado ERP** (#623bea): solo el hover de los botones primarios.

### Tertiary

- **Verde Exportar** (#047857 → #065f46 en hover; el texto blanco da 5.48:1, el #059669 de antes daba 3.77:1): exclusivo del botón "Exportar a Excel".
- **Rojo Alerta** (#dc2626, velo #fef2f2): cifras negativas, el estado de error de la tabla, cerrar sesión, eliminar una vista y el hover de los botones de cerrar.

### Neutral

- **Lienzo Gris** (#f9fafb): fondo de la app, encabezado de la grilla, campo de búsqueda en reposo.
- **Superficie Blanca** (#ffffff): navbar, sidebar, panel de resumen, la grilla, los modales y los botones secundarios.
- **Línea Tenue** (#f3f4f6) y **Línea Suave** (#e5e7eb): divisores de celdas de la grilla y bordes de las tarjetas y del layout.
- **Borde de Control** (#d1d5db): bordes de inputs, checkboxes y botones secundarios.
- **Tintas** (#9ca3af → #111827): apagada solo para íconos decorativos (nunca para texto: no llega a 4.5:1); secundaria para etiquetas, ayudas y el tenant; media para el sidebar y el encabezado de la grilla; cuerpo para el texto de los controles y el nombre del usuario; título para h1 y h2; base para cifras y texto general.

### Named Rules

**La Regla del Morado en Tránsito.** El morado ERP existe solo como estado hover de una acción primaria. Nunca es relleno en reposo, ni texto, ni fondo.

**La Regla del Verde Único.** El verde sólido pertenece solo a la exportación. Un segundo botón verde le roba el significado.

**La Regla de la Tinta Roja.** Una cifra solo lleva color si es negativa, y entonces es rojo alerta. Las positivas y los conteos van en tinta base. Nada de colores por categoría: el color dice "esto resta", no "esto es una factura".

**La Regla de la Marca del Tenant.** Un tenant cambia `--marca` (y, si quiere, `--marca-hover`, que hoy es el morado ERP) en `:root`, y lo siguen botones, tabs, hovers, chips, la selección y la grilla. El rojo (negativos, errores, salir) y el verde (exportar) son semánticos y nunca siguen a la marca. Antes de aceptar una marca: el blanco sobre ella debe llegar a 4.5:1 (RepGen misma pasó de #2b75e8, 4.36:1, a #2670e3, 4.66:1) y no puede ser un rojo ni un verde, porque se confundiría con "esto resta" o con "exportar"; en ese caso se usa el color secundario del tenant.

**La Regla del Azul que Actúa.** El azul ERP marca lo que se puede pulsar o lo que está activo. Un texto informativo (el nombre del usuario, una etiqueta) nunca va en azul.

## Typography

**Display Font:** ninguna; RepGen no tiene tipografía de display.
**Body Font:** Arial (con Helvetica, sans-serif), también en AG Grid vía el parámetro `fontFamily` del tema.

**Character:** neutra y de sistema, como una planilla. La jerarquía se construye con peso y tamaño, nunca con una segunda familia.

### Hierarchy

- **Headline** (700, 1.25rem/20px): títulos de reporte en desktop, títulos de modal y la cifra que encabeza el resumen (Flujo neto, Facturación neta).
- **Title** (700, 1.125rem/18px): títulos de reporte en móvil.
- **Body** (400–500, 0.875rem/14px): el tamaño de trabajo de toda la interfaz: botones, inputs, sidebar, tabs, celdas, renglones del resumen. Las cifras usan `tabular-nums`.
- **Label** (600, 0.75rem/12px, tracking 0.05em, MAYÚSCULAS): título del panel de resumen, sus secciones (Importes, Facturas) y el encabezado del sidebar. Las etiquetas "Desde:" y "Hasta:" usan el mismo tamaño en 500, sin mayúsculas.

### Named Rules

**La Regla de los Catorce.** Todo lo que se toca o se lee en una tarea mide 14px. Por encima de 14px solo van los títulos y la cifra resultado de cada resumen; una por sección, no todas.

## Layout

La aplicación ocupa toda la pantalla (`h-screen`) con un navbar fijo arriba (mín. 64px) y el área principal con scroll propio. El sidebar (288px) es un drawer que entra desde la izquierda sobre el contenido (300ms ease-in-out), no una columna permanente.

El título del reporte (h1) y los tabs viven en el navbar; cada reporte nombra también la pestaña del navegador ("Bancos · RepGen", "Ventas · Facturas · RepGen") con `<title>`, y los estados vacíos o de error igual; el área principal es solo la tabla y el resumen. La barra de la tabla es una sola fila que se parte limpia: a la izquierda lo que se está viendo (fechas, contador de registros), a la derecha y como un bloque lo que se puede hacer (vistas, columnas, exportar). Si no cabe, el bloque de acciones baja entero y empieza a la izquierda, bajo la primera fila (nunca escalonado a la derecha): una fila en 1920px, dos en una laptop de 1366px con el resumen abierto. En teléfono, "Actualizar vista" queda como ícono (con su punto) y el nombre accesible completo. `<main>` es un contenedor de tamaño (`container-type: size`): las alturas se miden con `100cqh`, el alto real del área, aunque el navbar ocupe dos filas. A partir de `xl` (1280px) la tabla llena la altura disponible con flex y el panel de resumen es una columna lateral sticky, redimensionable y colapsable (recuerda su ancho y si quedó abierto, por navegador); solo la tabla hace scroll. Debajo de `xl` la primera pantalla (`100cqh`, mínimo 400px) es una línea con la cifra resultado ("Flujo neto", "Facturación neta") y **Ver resumen**, que abre el panel y lleva el foco hasta él, más la tabla; el resumen completo queda debajo.

El ritmo se construye sobre una base de 4px: 6, 8 y 12px dentro de los controles, y 16–24px entre bloques y en el padding de los modales. En móvil (debajo de `sm`, 640px) el navbar se reacomoda en dos filas, los tabs segmentados pasan a ser un menú desplegable y las etiquetas de los botones se acortan ("Exportar"). El diseño apunta primero a escritorio; con puntero táctil (`pointer: coarse`) los controles principales de la barra miden 40px. Debajo de `lg` (1024px, también una laptop al 200% de zoom) el título y los tabs del reporte bajan a su propia fila del navbar y del usuario queda solo el tenant. La primera pantalla es un mínimo, no un alto fijo: en pantallas bajas (zoom 200%, teléfono horizontal) el cuerpo de la tabla conserva al menos 288px (encabezado, filtros, totales y unas cinco filas) y la página hace scroll; debajo de `xl` con la ventana a menos de 640px de alto, el mínimo sube a casi el alto del área (`100cqh − 16px`), así al bajar la tabla llena la pantalla (seis filas a 720×450 en vez de tres); el grid llena su cuerpo por posición (`absolute inset-0`), nunca con `height: 100%`. Si un reporte falla al pintarse, el router muestra la hoja de estado vacío ("No se pudo mostrar este reporte") con salida, no una pantalla técnica. Los toasts aparecen abajo a la derecha para no tapar el área del usuario; los que traen "Deshacer" duran 10s.

## Elevation & Depth

El sistema es plano con sombras de cortesía. La profundidad sale del contraste lienzo gris / hoja blanca y de bordes de 1px. `shadow-sm` acompaña tarjetas, botones y el navbar; `shadow-lg` envuelve la grilla y los menús desplegables; `shadow-2xl` queda para los modales y el drawer del sidebar, siempre sobre un velo gris oscuro al 60% con blur (`::backdrop` en los `<dialog>` nativos).

### Shadow Vocabulary

- **Cortesía** (`box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): tarjetas, botones, navbar.
- **Hoja de trabajo** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): el contenedor de la grilla y los menús.
- **Capa superior** (`box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)`): modales y sidebar.

### Named Rules

**La Regla del Velo.** Lo que flota sobre la tabla (un modal o un drawer) lleva sombra `2xl` y un velo detrás. Nada más flota.

## Shapes

Esquinas suavemente redondeadas (8px) como norma para botones, tarjetas, la grilla, los inputs de búsqueda y los ítems de navegación. Hay 6px en los inputs de fecha y el botón de salir, y 12px en los contenedores compuestos (los tabs segmentados, los menús, los modales y la tarjeta de sesión no disponible). Los chips, los botones circulares del panel de resumen y los círculos de íconos de estado van en pastilla (`9999px`). Los bordes son siempre de 1px, sólidos y grises.

## Components

### Buttons

Compactos y directos: 14px en peso 500, padding de 6px × 12px, esquinas de 8px y transición de color.

- **Shape:** suavemente redondeado (8px).
- **Primary:** Azul ERP con texto blanco. En hover pasa a morado ERP. El foco de teclado usa el anillo único del sistema: `focus-visible:ring-2 ring-blue-500` con 1px de separación. Deshabilitado: opacidad 40–50%.
- **Secondary:** blanco con borde de control, texto en tinta-cuerpo y `shadow-sm`. En hover toma el velo azul, con borde azul-300 y texto e ícono en azul.
- **Export:** verde sólido con ícono verde claro, "Exportar CSV" (Excel lo abre directo). Un solo botón por pantalla. Cuando no se puede exportar (cargando, error, 0 registros) usa `aria-disabled`, no `disabled`: sigue enfocable, queda al 40% y el motivo es su descripción accesible (`aria-describedby`); el clic no hace nada. Habilitado, la descripción dice qué trae el archivo: filas filtradas, columnas visibles, sin fila de totales. Lo mismo va en el `title` (con el mouse se lee antes de bajar) y la confirmación lo repite para todos, empezando por lo que se llevó y con el archivo al final: "340 registros · 8 columnas, sin la fila de totales. Archivo: reporte_x.csv".
- **Danger ghost:** texto rojo sin fondo; en hover toma el velo rojo ("Cerrar sesión").
- **Actualizar vista sin cambios:** como Exportar, `aria-disabled` y no `disabled`: sigue enfocable y su descripción accesible dice por qué ("«Conciliación» no tiene cambios sin guardar.").
- **Exportar, nombre accesible:** "Exportar CSV" y nada más (en teléfono se ve "Exportar"); lo que trae el archivo, o por qué no se puede, va como descripción (`aria-describedby`) fuera del botón, no dentro de su texto.
- **Exportar sin poder:** el clic no queda mudo; un aviso dice el motivo (el mismo de su descripción).
- **Nombres:** el texto dice el resultado, no el gesto: "Aplicar" (solo esta sesión), "Actualizar vista" (sobrescribe la vista elegida), "Guardar vista" (crea una nueva).

### Chips

- **Style:** pastilla gris-100 con borde gris-300, texto de 12px en peso 500 y un ícono de 12px (por ejemplo, "Importes en MXN" en el panel de resumen).
- **Contador de registros:** pastilla de 8px junto al filtro de fechas, anunciada con `aria-live`. Gris en reposo ("340 registros"); mientras carga sin nada en pantalla dice "Cargando registros…", nunca "0 registros"; con filtros de columna toma el velo azul y dice "12 de 340 registros · 3 filtros ▾" seguido de **Limpiar** (texto azul, quita todos los filtros). "3 filtros" es un botón (`aria-expanded`) que despliega la lista de filtros en palabras ("Banco contiene «BBVA»"), cada uno con su "X" ("Quitar filtro de Banco"); Escape o un clic fuera la cierran. Un filtro sobre una columna oculta sigue aplicando: el botón lo dice ("3 filtros, 1 en columna oculta") y la lista lo aclara. Si la carga falló, el chip dice "Sin registros cargados", no "0 registros". Limpiar avisa "Se quitaron 3 filtros." con **Deshacer**, y el chip ofrece **Restaurar filtros** hasta que se vuelva a filtrar (el aviso se va solo; el chip no). Cuenta también los filtros de columnas que quedaron fuera de pantalla, y se marca aunque el filtro todavía no excluya filas.

### Cards / Containers

- **Corner Style:** 8px.
- **Background:** superficie blanca.
- **Shadow Strategy:** Cortesía.
- **Border:** 1px línea tenue.
- **Internal Padding:** 16px en el panel de resumen; 24–32px en estados vacíos y diálogos.

### Inputs / Fields

- **Style:** fondo blanco con borde de control de 1px, 6–8px de radio y texto de 14px. La búsqueda de los modales reposa en el lienzo gris y pasa a blanco con el foco.
- **Focus:** borde y anillo en azul ERP claro. Ningún control quita el outline sin poner en su lugar un anillo `focus-visible` (2px azul-500).
- **Checkbox:** cuadrado de 16px con radio de 4px; al marcarse se rellena de azul ERP con un check blanco. Con teclado lleva el anillo del sistema.
- **Fechas:** un grupo ‹ [enunciado] ›. Las flechas aplican directo el periodo de al lado del mismo tamaño (un mes completo o en curso → el mes entero de al lado; un año → el año de al lado; otro rango → los mismos días corridos), nunca pasan de hoy (› queda `aria-disabled` y lo dice) y su nombre accesible dice a qué fechas van. En el centro, un botón que enuncia lo cargado ("Mes actual · 01/10/2026 – 15/10/2026", o solo el rango si no es un periodo), con ícono de calendario y `aria-expanded`. Abre un panel (hoja blanca de 12px de radio, sombra de menú) con "Periodo" arriba, "Desde"/"Hasta" en dos columnas y **Cancelar** / **Aplicar**; el foco entra en "Periodo". Escape, Cancelar, un clic fuera o salir con Tab lo cierran y descartan el borrador; aplicar lo cierra. "Periodo", "Desde" y "Hasta" son un borrador: se aplican con "Aplicar" o Enter, también desde el select de Periodo. Sin cambios, "Aplicar" es `aria-disabled` y dice "Las fechas son las que ya están cargadas". Elegir un periodo (_Mes actual_, _Mes anterior_, _Año en curso_) solo llena las fechas, así recorrer la lista con flechas no consulta FileMaker; el select refleja el borrador y dice _Personalizado_ cuando no coincide, y elegir _Personalizado_ lleva el foco a "Desde". Los errores de validación no van en toast: aparecen debajo en 12px rojo alerta (`role="alert"`), el input afectado toma borde rojo, `aria-invalid` y `aria-describedby`, y el error se borra al corregir. Una vista con periodo reinicia el borrador.
- **Datos de las 10:42:** junto a las fechas, un botón dice de cuándo son las cifras en pantalla (la hora de la última carga correcta) y al pulsarlo vuelve a leer FileMaker con el mismo rango, sin tocar columnas, filtros ni vistas. Mientras carga dice "Actualizando…" (ícono girando, `aria-disabled`); en la primera lectura, sin cifras previas, dice "Cargando datos…". Pasados 15 minutos agrega "· hace 25 min" ("hace 3 h", "hace 2 días" con más tiempo), el texto pasa a tinta base y el ícono al azul que actúa. Con error no aparece: la tabla ofrece Reintentar.
- **Filtros flotantes:** cada input se nombra por su columna ("Filtrar Banco") y su "X" dice qué limpia ("Limpiar filtro de Banco").
- **Filtros de lista:** las columnas con pocas opciones se marcan `"filtro": "lista"` en su esquema (Bancos: Banco, Número de Cuenta, Moneda, Forma Pago, Estado Ingreso/Egreso; Ventas: estatus, serie, moneda, uso CFDI, método y forma de pago, tipo de concepto, unidad, bodega, marca, estado y representantes del cliente, categorías y clasificaciones). Bajo el encabezado, en vez de una caja para escribir, un botón con caja de 30px que dice lo elegido: "Todos", "BBVA, Santander", "3 valores", "Todo menos Cancelada". Sin filtro, el chevron va pegado al borde derecho; con filtro, su lugar lo toma la X para quitarlo. Abre la misma lista que el menú de la columna (`role="dialog"`): búsqueda con el foco, "Todos · Ninguno" (actúan sobre lo buscado, como Excel) y una casilla por valor con su cuenta en 12px, por nombre, con "(Vacío)" al final; flechas entre casillas (↓ desde la búsqueda entra en la lista, ↑ desde la primera vuelve), Espacio marca. Marcar filtra al instante; todo marcado = sin filtro. Valores y cuentas salen de todos los registros cargados del rango, no de los que dejan otros filtros. El modelo guarda lo más corto de decir: _incluir_ los marcados (un valor nuevo queda fuera) o _excluir_ los desmarcados (un valor nuevo entra). Un valor elegido que ya no tiene registros en el rango sigue marcado y dice "sin registros en este rango". Una vista guardada con un filtro de texto en una de estas columnas se respeta tal cual (la lista marca lo que coincide) hasta que el usuario la toque.
- **Excluir en texto:** las columnas de texto suman "No contiene" y "Distinto de"; como en Excel, la celda vacía pasa.
- **Filtros de montos** (moneda y número): el input es de texto (teclado decimal en teléfono) y entiende cómo piensa finanzas: `5000` es "igual a" sin centavos (5,000.00 a 5,000.99; con decimales es exacto), `=5000` exacto, `>5000`, `>=1000`, `<0`, `<=1000` y `1000-5000` (entre, ambos incluidos; `-1200` solo es un negativo). Ignora espacios, "$" y comas de miles. Aplica tras 450 ms sin teclear; lo que no es un monto no filtra, se marca con borde rojo y `aria-invalid`, y su descripción accesible dice qué se acepta. Con el foco, una pista visible bajo el input (hoja blanca de 12px, en un portal con posición fija porque el encabezado de AG Grid recorta) dice "Monto, >5000, <0 o 1000-5000", o en rojo "No es un monto. Escribe un monto, >5000 o 1000-5000.". Un filtro de solo lectura (varias condiciones) explica lo mismo a la vista con el foco, no solo en `title`. El menú de la columna ofrece Igual a, Igual a (exacto), Mayor que, Mayor o igual que, Menor que, Menor o igual que, Entre y Vacío, con hasta dos condiciones (Y/O). El "Igual a" de vistas guardadas antes queda como exacto y se lee "=5000". Los porcentajes no ignoran nada: su "Igual a" es exacto. Las reglas viven en `ag-grid/filtro-monto.ts`. Un filtro con varias condiciones queda de solo lectura y lo explica al pasar el cursor. La "X" se ve de 20px pero responde en 36px.

### Navigation

- **Navbar:** blanco, mínimo 64px. A la izquierda el botón de menú (40px, con `aria-expanded`) y el logo; al centro el h1 del reporte; a la derecha el usuario en tinta-cuerpo con " · tenant" en tinta-secundaria, y "Cerrar sesión".
- **Sidebar:** drawer blanco de 288px, `inert` cuando está cerrado y con cierre por Escape. Abierto, el reporte detrás queda `inert` bajo el velo del sistema (gris oscuro al 60% con blur) y un clic en el velo lo cierra. Al abrirse, el foco entra en el reporte actual; al cerrarse, si estaba adentro, vuelve al botón de menú. Va con un encabezado de sección como Label gris-500. Los ítems llevan ícono de 20px y texto de 14px en peso 500, con padding de 10px × 16px y radio de 8px. Un reporte que todavía no existe dice "Próximamente" en una segunda línea de 12px gris-500 bajo su nombre, no en una pastilla al lado. Reposo en tinta-media; hover sobre el lienzo con texto azul; activo con velo azul y texto azul profundo.
- **Tabs segmentados (Ventas):** contenedor blanco de 12px de radio con padding de 4px. El tab activo va relleno de azul ERP con texto blanco; el inactivo, en tinta-media con hover azul. En móvil se convierten en un botón de 40px ("Tipo de reporte: Facturas", `aria-expanded`) que abre un menú de links con `aria-current`; navegan, así que no son un listbox. Cada pestaña tiene sus propias vistas guardadas (el selector se recrea por reporte; las vistas de la pestaña anterior nunca se ofrecen mientras cargan las nuevas) y recuerda sus columnas, filtros, la vista elegida y su referencia de "sin cambios": al volver, se recupera lo que el usuario dejó, con los cambios sin guardar todavía marcados, no la vista predeterminada, que se aplica solo en la primera visita.

### Tabla Dinámica (signature)

AG Grid con `themeQuartz.withParams(...)` (la Theming API no usa la clase `.ag-theme-quartz`: el estilo vive en los parámetros de `TablaDinamica.tsx`), dentro de una hoja blanca de 8px de radio con sombra de hoja de trabajo. Encabezado de 40px sobre el lienzo gris, en tinta-media y peso 600, sin separadores de columna. Filas de 36px divididas por la línea tenue, sin bordes de columna ni exteriores; el hover de fila toma el velo azul. El acento y el hover se leen de los tokens (`var(--color-blue-600)`, `var(--color-blue-50)`) para seguir la marca del tenant; los grises quedan fijos.

- **Columna fija:** en Ventas, "Factura Folio" abre fija a la izquierda (`initialPinned`, así "— Ninguna —" la devuelve ahí). En "Columnas" cada columna tiene un alfiler para fijarla o soltarla, y no se puede aplicar sin al menos una columna visible.
- **Fila de totales:** fija al pie, sobre el lienzo gris, en negrita con una regla gris-300 encima. Suma solo las filas filtradas y solo las columnas que el reporte declara sumables (nunca saldos ni montos que se repiten por renglón); solo MXN. El rótulo ("Total MXN") va en la primera columna visible pero como Label (12px, 600, mayúsculas, gris-600), para que no se lea como un dato de esa columna (un folio o una fecha). En Ventas el pie suma las mismas filas que la Facturación neta del resumen (`cuentaEnNeto`: ventas en positivo y, en negativo, solo cancelaciones y devoluciones), así el Gran Total del pie es la Facturación neta y no hace falta aclarar nada. No viaja en el CSV.
- **Tinta roja:** en las columnas de cifras (número, moneda, porcentaje), un valor negativo va en rojo alerta, también en la fila de totales; sobre el velo azul del hover pasa a rojo-700 para no bajar de 4.5:1. El signo menos sigue ahí: el color no es la única señal.
- **Cargando:** un velo blanco al 60% con blur y un spinner azul, con "Cargando registros…". Los reportes (con AG Grid) se descargan aparte del login, en segundo plano desde que abre la app; si al entrar todavía no llegaron, el área principal dice "Cargando reporte…" con el navbar ya en pantalla. Todo texto visible usa "…" tipográfico, nunca "...".
- **Error:** reemplaza el cuerpo de la tabla (la barra sigue usable): ícono en círculo de velo rojo, "No se pudieron cargar los registros", el motivo en lenguaje llano y "Reintentar" cuando sirve. Nunca quedan filas de otro rango debajo.
- **Vacío:** ícono de 24px en gris-400 (calendario tachado o embudo tachado) sobre el mensaje, y siempre una salida como botón secundario. "No hay registros en este rango de fechas." con **Ver periodo anterior** (el mismo ‹ de las fechas; no aparece si no hay periodo anterior). Si los filtros excluyen todo: "Ningún registro coincide con los filtros." con **Limpiar filtros** (botón secundario, el mismo Limpiar del chip, con su aviso para deshacer). Los dos avisos son un componente propio (`overlayComponentSelector` de AG Grid: `noRows` y `noMatchingRows`). Nunca "Cargando" fuera de una carga.
- **Exportación:** CSV con valores crudos (Excel los toma como números). Si un importe visible tiene su columna de moneda oculta, la moneda se agrega al archivo y el aviso lo dice ("con Moneda, que estaba oculta").
- **Orden por defecto:** el esquema ordena las columnas como se lee el reporte, no como llegan de FileMaker. Bancos abre como una conciliación: Fecha, Banco, Número de Cuenta, Concepto, Abono, Cargo, Saldo Resultante, Moneda y después el resto; Id de Transacción, RFC y Cuenta Contable empiezan ocultas (`"oculta": true` en el esquema) y se muestran desde Columnas o una vista. "— Ninguna —" vuelve a este estado. A 1440px con el resumen abierto, el dinero entra en la primera pantalla. Un texto que se lee entero puede pedir ancho mínimo (`"anchoMinimo": 240` en Concepto). Los encabezados largos parten en dos líneas ("Número de / Cuenta") en vez de cortarse, y las columnas de fecha miden al menos 170px con su filtro flotante a todo el ancho (el menú del filtro queda en el encabezado), para que "dd/mm/aaaa" entre entero.
- **Moneda por renglón:** las columnas de moneda se formatean en la moneda de su renglón (`currencyField` del esquema): MXN con "$", cualquier otra con su código ("USD 1,000.00"), para que nunca parezca un monto en pesos. La fila de totales no trae moneda y se formatea en MXN.
- **Idioma:** los textos propios de AG Grid (overlays, panel de filtros, operadores, etiquetas ARIA) vienen de `ag-grid/locale-es.ts`, con `LocaleModule` registrado. Un módulo nuevo de AG Grid trae claves nuevas: se agregan ahí.

### Resumen (signature)

El panel lateral se lee como estado de cuenta, no como tarjetas. Lo encabeza el titular: la etiqueta del resultado (14px, 600) y la cifra en Headline ("Flujo neto en MXN" si hay otras monedas), con el periodo anterior debajo en 14px; quien entra a ver "cómo vamos" lo lee primero. Debajo, en 12px, el rango cargado ("01/09/2026 – 30/09/2026") y "Calculado sobre 12 de 340 registros (con los filtros de la tabla)": quien solo mira el resumen sabe qué periodo y qué recorte está leyendo. Cada sección (Label) es una lista de definiciones: etiqueta a la izquierda en tinta-secundaria y cifra a la derecha en tinta base, peso 500 y `tabular-nums`. El renglón resultado del estado cierra la cuenta con una regla gris-300 encima y la cifra en 14px semibold: la misma del titular, ahora como suma visible. Los renglones que restan llegan en negativo, así el neto es la suma visible de lo de arriba. Los conteos van en su propia sección y sin color, con etiquetas que no repiten las de los importes ("Con devolución", no "Devoluciones"). Una sección puede llevar una nota de 12px bajo las cifras (p. ej. de dónde salen los saldos al cierre), y el aviso del panel dice cómo se agrupan las monedas ("Cada moneda por separado: MXN, USD").

- **Monedas (Bancos):** MXN arriba ("Movimientos en MXN"); cada otra moneda en su propia sección ("Movimientos en USD"), con sus cifras en su moneda ("USD 5,400.00") y nunca sumada a MXN. El pie de la tabla sigue siendo solo MXN.
- **Saldos al cierre (Bancos):** una línea por cuenta ("BBVA ··4560"; los puntos son `aria-hidden` y el lector dice "terminación 4560") con el Saldo Resultante (saldo corrido de FileMaker, `monto_ORIG_bancoRunningSaldo`) de su último movimiento en el rango: fecha más reciente y, el mismo día, el id de transacción mayor. Se calcula con todos los movimientos del rango, no con los filtrados (un filtro cambiaría cuál es "el último"), y la nota lo dice.
- **Periodo anterior:** bajo la cifra del titular (Flujo neto en MXN, Facturación neta), una línea de 14px "vs. 01/09 – 15/09/2026 $62,400.00 · +57.7%", con el mismo cálculo que el resumen. Rango desde el día 1 dentro de un mes → los mismos días del mes anterior (mes completo → mes anterior completo); desde el 1 de enero → el mismo tramo del año anterior; cualquier otro → los mismos días justo antes. Es una consulta más a FileMaker por cambio de rango (y por "Actualizar datos", para no comparar datos nuevos contra una cifra vieja) y lee el periodo completo: con filtros en la tabla dice "Sin comparar: la tabla tiene filtros". El cambio negativo va en rojo, como toda cifra que resta. Formato `es-MX` (MXN). Mientras carga, el panel se atenúa; antes de la primera carga dice "Calculando las cifras…" y la línea de resultado muestra "—" (un $0.00 se leería como "no hubo movimientos"); si la carga falla, dice "Sin cifras: el reporte no se pudo cargar" en vez de mostrar $0.00. La línea de resultado (bajo xl) agrega "· filtrado" cuando la cifra sale de filas filtradas.

### Vistas guardadas

Una vista es una pregunta guardada, por usuario y por reporte: columnas (visibilidad, orden, orden de clasificación, columnas fijas), filtros y, si se quiere, un periodo relativo (_Mes actual_, _Mes anterior_, _Año en curso_) que se resuelve a fechas locales al abrirla. Después, las fechas son navegación: ‹ ›, otro mes o un rango a mano no marcan la vista como modificada ni activan el aviso de salida, y "Actualizar vista" guarda columnas y filtros conservando el periodo. Mientras las fechas no coinciden con el periodo de la vista, junto al grupo aparece un link de 12px "Volver a mes anterior" (el periodo de la vista) que lo reaplica. El ancho de columnas se guarda pero nunca cuenta como cambio. Para qué sirve una vista lo dice el `title` de "Guardar vista"; no hay línea de ayuda en la barra (le quitaba una fila). El select deja ver hasta 240px del nombre (160px en teléfono); el nombre completo queda en la lista y en el `title`. El grupo segmentado es `Vista: [select] | Guardar/Actualizar vista | ⋮`:

- **Sin guardar:** el nombre de la vista no cambia. El aviso va en el botón que guarda: "Actualizar vista" se habilita, pasa a peso 600 en azul, suma un punto azul de 8px y su nombre accesible dice "Actualizar vista (cambios sin guardar)". La referencia de "sin cambios" es el grid tal como quedó al abrir o guardar la vista (`fijarBase` en `useReporteGrid`), no el JSON guardado, que AG Grid puede normalizar distinto. La foto actual llega por estado, actualizada por las props de AgGridReact (`onFilterChanged`, `onColumnVisible`, `onColumnMoved`, `onSortChanged`, `onColumnPinned`, `onDisplayedColumnsChanged` → `onCambioVista`); nunca se lee el grid durante el render (React Compiler lo memoizaría).
- **— Ninguna —:** columnas originales del reporte y sin filtros; no toca las fechas. También puede tener cambios sin guardar: filtros puestos, o columnas distintas de como quedó el grid al cargar. Entonces "Guardar vista" lleva el punto.
- **Antes de perder trabajo:** cambiar de vista con cambios sin guardar abre un aviso anclado al grupo (`role="alertdialog"`, Tab queda adentro, el foco arranca en **Cancelar**): "Tienes cambios sin guardar en «X». Si cambias de vista se pierden." con **Cancelar** / **Descartar cambios** / **Actualizar y cambiar** (o **Guardar como vista nueva** desde "Ninguna"). Mientras guarda, las otras opciones se bloquean. El mismo aviso protege las salidas: ir a otro reporte desde el menú o con "Atrás" del navegador ("Si sales del reporte se pierden.", con **Actualizar y salir**) y "Cerrar sesión" ("Si cierras sesión se pierden."); el logout no llama al backend hasta que se confirma. Cambiar entre pestañas de Ventas no pregunta: cada pestaña recuerda lo suyo. Recargar o cerrar la pestaña del navegador usa el aviso nativo (`beforeunload`).
- **Errores al guardar:** si la sesión expiró, el aviso no dice "Inténtalo de nuevo" (no serviría): dice que la sesión expiró, que lo que está en la tabla sigue ahí y que para guardar hay que volver a abrir el reporte desde FileMaker. Si no se pudo saber si el tenant tiene vistas (`/tenant/features` falló), no se recuerda el fallo: el próximo reporte vuelve a preguntar.
- **Deshacer:** "Actualizar vista" avisa con **Deshacer**, y el menú ⋮ ofrece "Deshacer la última actualización" mientras aplique. Deshacer vuelve a guardar la versión anterior sin tocar el grid: si la vista sigue abierta, los cambios reaparecen como sin guardar; si ya se abrió otra, no se toca su referencia y el aviso dice que lo guardado se descartó.
- **Teclado:** con el mouse, elegir una vista la aplica. Con flechas, la vista queda en espera en el select hasta Enter o salir del control (Escape la descarta), para no aplicar una vista ni consultar por cada tecla.
- **Menú ⋮:** `aria-haspopup="menu"`; la lista es `role="menu"` con `menuitem` y separador. Flechas (circulares), Inicio y Fin recorren las acciones disponibles; Tab lo cierra y sigue de largo. Un clic fuera lo cierra (también "Nueva vista") y ese clic sigue su curso: no hay velo que se lo trague. El velo invisible queda solo para el aviso de cambios sin guardar, donde un clic fuera equivale a Cancelar.
- **Foco:** abrir ⋮ enfoca la primera acción disponible; Renombrar enfoca el campo, Eliminar enfoca **No**, Nueva vista enfoca el nombre; al cerrar, el foco vuelve a ⋮.
- **Nueva vista:** diálogo anclado (`role="dialog"`, título "Nueva vista") con nombre, un select "Periodo" que arranca en _Sin periodo (no cambia las fechas)_, **Guardar** y **Cancelar**; Tab se queda adentro y al cerrar el foco vuelve a ⋮.

### Diálogos

`<dialog>` nativo con `showModal()`: atrapa el foco, cierra con Escape y deja inerte la página. Hoja blanca de 12px de radio, sombra capa superior y `::backdrop` gris al 60% con blur, con título h2 enlazado por `aria-labelledby`. Se usa para las columnas visibles y la sesión expirada. Una decisión sobre el control que la provoca (el aviso de cambios sin guardar) va anclada a ese control como `alertdialog`, con el foco atrapado a mano, no en un modal a pantalla completa (por eso sin `aria-modal`: la página no queda inerte).

### Estados vacíos y de acceso

Hoja blanca centrada (máx. 448px) con un ícono de 24px en un círculo de velo azul de 48px, título en Headline, una frase en 14px tinta-secundaria y una salida concreta como botón secundario ("Ir a Bancos"). Sin degradados, ilustraciones ni animación de entrada.

## Do's and Don'ts

### Do:

- **Do** usar el Azul ERP (#2670e3) para toda acción primaria y estado activo, con el morado ERP (#623bea) solo en su hover.
- **Do** mantener los controles en 14px, con padding de 6px × 12px y radio de 8px.
- **Do** poner las superficies nuevas como hojas blancas con borde de 1px y `shadow-sm` sobre el lienzo #f9fafb.
- **Do** presentar las cifras como estado de cuenta: renglones alineados a la derecha, un total con regla encima y rojo solo para negativos.
- **Do** usar `<dialog>` nativo para todo lo modal y anillos `focus-visible` en cada control.
- **Do** nombrar las acciones por su resultado ("Actualizar vista", "Aplicar") y los errores por lo que pasó y cómo seguir.
- **Do** limitar el movimiento a transiciones de color (y a 300ms para drawers y paneles).
- **Do** mostrar la moneda de cada importe cuando no es MXN, y decir qué quedó fuera de un total.
- **Do** decir de cuándo son los datos ("Datos de las 10:42") y ofrecer volver a leerlos sin recargar la página.
- **Do** dejar los errores de un campo junto al campo (`aria-describedby`), no solo en un toast.
- **Do** acompañar toda acción que borra trabajo armado a mano (actualizar una vista, limpiar filtros) con un aviso con **Deshacer** y una segunda vía que no caduque (el menú ⋮, el chip "Restaurar filtros").
- **Do** preguntar antes de reemplazar trabajo sin guardar, con la opción segura enfocada primero.
- **Do** confirmar con "Aplicar" todo lo que dispara una consulta: un select no consulta al cambiar.
- **Do** decir por qué algo no está disponible en un texto accesible (`aria-describedby`) sobre un control que sigue enfocable (`aria-disabled`).
- **Do** devolver el foco a quien abrió un menú, panel o drawer al cerrarlo.

### Don't:

- **Don't** usar degradados decorativos, sombras pesadas sobre fondos de color ni animaciones de entrada (el viejo ComingSoon violeta es el antiejemplo).
- **Don't** volver a las tarjetas de KPI con ícono en círculo de color: una cifra por tarjeta en un arcoíris de tonos es justo lo que el resumen reemplazó.
- **Don't** sumar en una fila de totales columnas en monedas distintas, saldos o montos repetidos por renglón.
- **Don't** usar el morado ERP como relleno, texto o fondo en reposo.
- **Don't** usar el verde sólido fuera del botón de exportar.
- **Don't** introducir una segunda familia tipográfica ni tamaños por encima de 20px.
- **Don't** usar gris-400 para texto: solo para íconos decorativos.
- **Don't** leer `referenciaGrid.current` para decidir qué se pinta: con React Compiler ese valor queda memoizado. El estado del grid entra como estado o prop.
- **Don't** contar el ancho de columnas como cambio de una vista: el grid lo recalcula al redimensionar la ventana.
- **Don't** escuchar cambios del grid con `api.addEventListener`: en esta integración no llegan. Usar las props `on…` de AgGridReact.
- **Don't** hacer flotar nada sobre la tabla sin velo y sombra `2xl`.
- **Don't** dejar una explicación solo en `title`: no llega por teclado, toque ni lector de pantalla.
- **Don't** aplicar una vista ni un periodo en cada `change` de un select: con flechas, Windows dispara uno por tecla.
- **Don't** usar `focus:ring-4 ring-blue-100` ni un color de anillo sin `ring-2`: el anillo del sistema es `focus-visible:ring-2 ring-blue-500`.

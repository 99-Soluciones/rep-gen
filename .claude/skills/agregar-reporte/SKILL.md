---
name: agregar-reporte
description: Guía el flujo completo para agregar un reporte nuevo a RepGen (FileMaker → NestJS → React), desde la ficha hasta la comparación con el sistema actual. Úsala cuando el usuario pida crear, especificar o continuar un reporte nuevo (inventarios, cuentas por pagar, etc.), armar una ficha, capturar o revisar datos dorados, o comparar el reporte nuevo contra el ERP.
version: "1.0.0"
---

# Agregar un reporte a RepGen

La persona decide **qué** sale (reglas, layout, datos dorados); el agente
programa **cómo**. Esta skill es el orden de trabajo y los puntos donde hay que
detenerse a preguntar. El detalle técnico vive en la guía:
[docs/guides/COMO-AGREGAR-REPORTE.md](../../../docs/guides/COMO-AGREGAR-REPORTE.md).
No repetirlo aquí: si algo cambia, se cambia en la guía.

Ejemplo completo a imitar: Cuentas por cobrar
(`repgen-backend/docs/reports/fichas/receivables/`, código en `*/receivables/`).

## Reglas que no se negocian

- No modificar `__golden__/`. Si `esperado.json` parece mal, detenerse y explicar por qué.
- No hacer commits salvo que la persona los pida.
- No inventar reglas de negocio: lo no decidido se escribe como **PENDIENTE** y se pregunta.
- Formatear y corregir lint **solo en los archivos tocados**, nunca carpetas enteras (cambia saltos de línea de archivos ajenos).
- Antes de entregar: `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm typecheck:shared`.

## Fases

Cada fase termina en un entregable. Las marcadas **ALTO** esperan la respuesta
de la persona antes de seguir.

### 1. Ficha — **ALTO** al final

1. Leer el reporte que hoy usa el cliente (CSV/Excel de muestra) si lo hay.
2. Hacer las **preguntas obligatorias** de la sección 1 de la guía (rango o
   corte, fuentes, exclusiones, cancelaciones, moneda, qué fecha cuenta,
   permisos). Recomendar una opción en cada una, no solo listar.
3. Crear `repgen-backend/docs/reports/fichas/<nombre>/` con `<nombre>.md` y
   `api_response.json` (un renglón por tipo, datos inventados).
4. La ficha queda con **PENDIENTE** visibles; la persona los resuelve.

### 2. Layout y respuesta cruda — **ALTO** hasta tener la respuesta

1. La persona crea el layout y pega la respuesta del Data API.
2. Guardar `<Layout>_ResponseFM` y `<Layout>.schema.json` en la carpeta de la ficha.
3. Revisar contra la ficha: campos que faltan, campos mal elegidos (p. ej. una
   etiqueta en vez del valor), portales sin nombre de objeto. Señalarlo.
4. Repasar las **trampas de FileMaker** de la sección 2 de la guía y preguntar
   las que apliquen (portales > 50, cálculos almacenados, campos con dos significados).

### 3. Datos dorados — **ALTO** hasta que la persona apruebe

1. La persona captura las entradas en `datos-dorados/` de la ficha. Anonimizarlas
   con `scripts/anonimizar-datos-dorados.mjs` (sección 3 de la guía) antes del
   borrador, y revisar si quedó algún dato sensible sin regla.
2. Elegir el corte/rango que haga que esos registros cubran más casos.
3. Armar `esperado-borrador.json` con un **script aparte que aplica la ficha**
   (en el scratchpad), nunca con el código del reporte.
4. Entregar: qué casos cubre, cuáles faltan, totales, y anomalías de los datos
   (series vacías, nombres raros, campos vacíos) para que la persona decida.
5. La persona aprueba y copia a `__golden__/` (renombrando a `esperado.json`).
   Si cambian nombres de campo en el layout, se **recapturan** las entradas.

### 4. Plan — **ALTO** para aprobarlo

Explorar el código (los reportes de referencia de la guía) y proponer el plan.
Decidir si el reporte cabe en `BaseReportService` (un layout, rango) o necesita
un use case propio como `receivables` (varios layouts o fecha de corte).

### 5. Backend y frontend

Seguir las secciones 4 y 5 de la guía. Mientras `__golden__/` no exista,
verificar el mapper con una copia temporal del spec que lea `datos-dorados/` y
borrarla al terminar. Tests unitarios con datos parecidos a los reales.

Para revisar la pantalla sin FileMaker: un servidor simulado mínimo (en el
scratchpad) en el puerto 3901 y el preview `repgen-frontend-mock` de
`.claude/launch.json`. Detenerlos al terminar.

### 6. Cuadres y comparación con el sistema actual

1. Cuadres de la ficha con datos reales (p. ej. corte = hoy ⇒ saldos de FileMaker).
2. La persona genera ambos reportes con el mismo corte/rango. Analizar cada
   diferencia: decir **quién tiene razón y por qué**, sin asumir que el sistema
   actual está bien. Proponer la corrección, pedir el visto bueno, aplicarla
   con su test y actualizar la ficha.

## Al cerrar

- Ficha actualizada con lo que cambió durante la implementación.
- Si apareció una trampa nueva de FileMaker o un patrón nuevo, agregarlo a la guía.
- Resumen para la persona: qué quedó, qué falta (datos dorados, prueba con
  FileMaker real) y qué no se verificó.

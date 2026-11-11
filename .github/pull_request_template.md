<!--
Título: <tipo>(<alcance>): <qué cambia>   (ver docs/guides/COMMITS-Y-PR.md)
Base: developer
-->

## Qué cambia

<!-- Lo que nota quien usa RepGen. Una lista corta. -->

## Por qué

<!-- El problema o la petición. Enlace a la tarea o ficha si existe. -->

## Cómo se probó

- [ ] `pnpm test`
- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] `pnpm typecheck:shared`
- [ ] Revisado en el navegador (si cambia la pantalla; adjuntar captura)
- [ ] Probado contra FileMaker (si cambia una consulta o un reporte)

## Revisión

- [ ] Sin secretos ni datos reales sin anonimizar
- [ ] `__golden__/` sin cambios, o los hizo una persona
- [ ] Ficha / documentación actualizada si cambió una regla o un campo
- [ ] Si rompe el contrato de la API o las vistas guardadas, el título lleva `!`

## Pendiente

<!-- Qué no se hizo o no se verificó. "Nada" si no hay. -->

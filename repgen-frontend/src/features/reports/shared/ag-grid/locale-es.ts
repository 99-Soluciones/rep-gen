/**
 * Textos propios de AG Grid en español (es-MX). Solo las claves que muestran
 * los módulos registrados en TablaDinamica: overlays, panel de filtros,
 * operadores y etiquetas ARIA de filtro/orden. Evita sumar el paquete de
 * locales completo por unas decenas de cadenas.
 */
export const LOCALE_ES: Record<string, string> = {
  // Overlays
  loadingOoo: "Cargando...",
  noRowsToShow: "No hay registros",
  noMatchingRows: "Ningún registro coincide con los filtros",

  // Panel de filtros
  filterOoo: "Filtrar...",
  applyFilter: "Aplicar",
  resetFilter: "Restablecer",
  clearFilter: "Limpiar",
  cancelFilter: "Cancelar",
  andCondition: "Y",
  orCondition: "O",
  dateFormatOoo: "aaaa-mm-dd",
  empty: "Elige una opción",

  // Operadores (los propios de RepGen ya traen displayName; estos cubren el resto)
  contains: "Contiene",
  notContains: "No contiene",
  equals: "Igual a",
  notEqual: "Distinto de",
  startsWith: "Empieza con",
  endsWith: "Termina con",
  blank: "Vacío",
  notBlank: "No vacío",
  lessThan: "Menor que",
  greaterThan: "Mayor que",
  lessThanOrEqual: "Menor o igual que",
  greaterThanOrEqual: "Mayor o igual que",
  inRange: "Entre",
  inRangeStart: "Desde",
  inRangeEnd: "Hasta",
  before: "Antes de",
  after: "Después de",

  // Orden
  sortAscending: "ascendente",
  sortDescending: "descendente",
  sortUnSort: "sin orden",

  // ARIA (lectores de pantalla)
  ariaColumnFiltered: "Columna filtrada",
  ariaDateFilterInput: "Fecha del filtro",
  ariaFilterColumn: "Presiona Ctrl Enter para abrir el filtro",
  ariaFilterFromValue: "Filtrar desde",
  ariaFilterInput: "Valor del filtro",
  ariaFilterMenuOpen: "Abrir menú de filtro",
  ariaFilterToValue: "Filtrar hasta",
  ariaFilterValue: "Valor del filtro",
  ariaFilteringOperator: "Operador del filtro",
  ariaLabelColumnFilter: "Filtro de columna",
  ariaLabelColumnMenu: "Menú de columna",
  ariaMenuColumn: "Presiona Alt Abajo para abrir el menú de la columna",
  ariaSortableColumn: "Presiona Enter para ordenar",
};

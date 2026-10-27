/**
 * Función para obtener el primer día del mes actual formateado como cadena en formato "YYYY-MM-DD".
 * @returns La cadena que representa el primer día del mes actual.
 */
export const obtenerPrimerDiaDelMes = (): string => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
};

/**
 * Función para obtener la fecha de hoy formateada como cadena en formato "YYYY-MM-DD".
 * @returns La cadena que representa la fecha de hoy.
 */
export const obtenerFechaHoyFormateada = (): string => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
};
/**
 * "2026-09-01" (o "2026-09-01 00:00:00", como llega en un filtro de AG Grid) → "01/09/2026".
 * Sin pasar por Date: evita corrimientos de zona horaria.
 */
export const formatearFecha = (iso: string): string => iso.slice(0, 10).split("-").reverse().join("/");

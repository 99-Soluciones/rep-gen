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
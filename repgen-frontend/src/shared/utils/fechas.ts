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

/**
 * Lo que escribe el usuario, día primero ("1/9/2026", "01-09-2026") → "2026-09-01".
 * "" si no es una fecha completa y real (31/02/2026 no existe).
 */
export const interpretarFecha = (texto: string): string => {
  const partes = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(texto.trim());
  if (!partes) return "";
  const [dia, mes, anio] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const fecha = new Date(0);
  fecha.setUTCFullYear(anio, mes - 1, dia); // un día que no existe se corre al mes siguiente
  if (fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) return "";
  return `${partes[3]}-${partes[2].padStart(2, "0")}-${partes[1].padStart(2, "0")}`;
};

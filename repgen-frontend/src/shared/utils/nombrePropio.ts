/**
 * Mayúscula inicial por palabra, respetando los espacios: "grupo alfa" → "Grupo Alfa".
 * ponytail: los acrónimos se pierden ("ABC" → "Abc"); si un tenant lo necesita,
 * que el backend mande un nombre configurado por base.
 */
export const nombrePropio = (texto: string): string =>
  texto
    .trim()
    .toLocaleLowerCase("es-MX")
    .replace(/(^|\s)(\p{L})/gu, (_, espacio: string, letra: string) => espacio + letra.toLocaleUpperCase("es-MX"));

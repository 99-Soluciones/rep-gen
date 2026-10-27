/**
 * Obtiene las filas de un portal específico desde la estructura de portales de FileMaker.
 * Verifica si el portal existe y si su valor es un array, en cuyo caso lo devuelve. Si el portal no existe o su valor no es un array, devuelve un array vacío.
 * @param portals La estructura de portales de FileMaker.
 * @param portalName El nombre del portal del cual obtener las filas.
 * @returns Un array de objetos que representan las filas del portal.
 */
export function getPortalRows(
  portals: Record<string, unknown> | null,
  portalName: string,
): Array<Record<string, unknown>> {
  const portalValue = portals?.[portalName];
  return Array.isArray(portalValue)
    ? (portalValue as Array<Record<string, unknown>>)
    : [];
}

/**
 * Uitidades para mapear campos de un objeto a otro usando mapeos definidos.
 * StringKeys<T> y NumberKeys<T> son tipos que extraen las claves de un tipo T cuyos valores son string o number respectivamente.
 * FieldMapping<K> es un tipo que representa un mapeo entre una clave de destino y una clave de origen.
 * applyStringFieldMapping y applyNumberFieldMapping son funciones que aplican los mapeos definidos a un objeto destino usando los valores de un objeto fuente.
 * getPortalRows es una función auxiliar para obtener las filas de un portal específico desde la estructura de portales de FileMaker.
 */

/**
 * Extrae las claves de un tipo T cuyos valores son string.
 * Se utiliza para definir mapeos de campos de texto en los objetos de reporte.
 */
export type StringKeys<T> = Extract<
  {
    [K in keyof T]-?: NonNullable<T[K]> extends string ? K : never;
  }[keyof T],
  PropertyKey
>;

/**
 * Extrae las claves de un tipo T cuyos valores son number.
 * Se utiliza para definir mapeos de campos numéricos en los objetos de reporte.
 */
export type NumberKeys<T> = Extract<
  {
    [K in keyof T]-?: NonNullable<T[K]> extends number ? K : never;
  }[keyof T],
  PropertyKey
>;

/**
 * Representa un mapeo entre una clave de destino (targetKey) y una clave de origen (sourceKey).
 * Se utiliza para definir cómo se deben mapear los campos de un objeto fuente a un objeto destino.
 */
export type FieldMapping<K extends PropertyKey> = readonly [
  targetKey: K,
  sourceKey: string,
];

/**
 * Aplica un mapeo de campos de tipo string a un objeto destino.
 * Itera sobre los mapeos definidos y asigna los valores obtenidos del objeto fuente al objeto destino usando la función getString para convertir los valores a string.
 * @param target El objeto destino al que se le asignarán los valores mapeados.
 * @param source El objeto fuente del cual se obtendrán los valores a mapear.
 * @param mappings Un array de mapeos que definen cómo se deben mapear los campos del objeto fuente al objeto destino.
 * @param getString La función para convertir los valores a string.
 */
export function applyStringFieldMapping<T extends object>(
  target: T,
  source: Record<string, unknown>,
  mappings: readonly FieldMapping<StringKeys<T>>[],
  getString: (value: unknown) => string,
): void {
  for (const [targetKey, sourceKey] of mappings) {
    (target as unknown as Record<string, unknown>)[targetKey as string] =
      getString(source[sourceKey]);
  }
}

/**
 * Aplica un mapeo de campos de tipo number a un objeto destino.
 * Itera sobre los mapeos definidos y asigna los valores obtenidos del objeto fuente al objeto destino usando la función getNumber para convertir los valores a number.
 * @param target El objeto destino al que se le asignarán los valores mapeados.
 * @param source El objeto fuente del cual se obtendrán los valores a mapear.
 * @param mappings Un array de mapeos que definen cómo se deben mapear los campos del objeto fuente al objeto destino.
 * @param getNumber La función para convertir los valores a number.
 */
export function applyNumberFieldMapping<T extends object>(
  target: T,
  source: Record<string, unknown>,
  mappings: readonly FieldMapping<NumberKeys<T>>[],
  getNumber: (value: unknown) => number,
): void {
  for (const [targetKey, sourceKey] of mappings) {
    (target as unknown as Record<string, unknown>)[targetKey as string] =
      getNumber(source[sourceKey]);
  }
}

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

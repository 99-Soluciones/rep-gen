import { RawRecord } from '../../../filemaker/ifilemaker';

export interface FieldMapNode {
  [key: string]: string | FieldMapNode;
}

export type GenericFieldMapRoot = {
  data: FieldMapNode;
};
export type PortalConfigDef = {
  name: string;
  isArray: boolean;
};

export type NestedPortalConfig = Record<string, string | PortalConfigDef>;

export type PortalSourceByKey = Record<
  string,
  string | NestedPortalConfig | PortalConfigDef
>;

export class FieldMapHelper {
  private readonly fieldMap: GenericFieldMapRoot;
  constructor(fieldMapJson: unknown) {
    if (!this.isGenericFieldMapRoot(fieldMapJson)) {
      throw new Error(
        'El JSON del mapa de campos no tiene la estructura esperada { data: FieldMapNode }',
      );
    }
    this.fieldMap = fieldMapJson;
  }

  private isPortalConfigDef(config: unknown): config is PortalConfigDef {
    return (
      typeof config === 'object' &&
      config !== null &&
      'name' in config &&
      typeof (config as PortalConfigDef).name === 'string' &&
      'isArray' in config &&
      typeof (config as PortalConfigDef).isArray === 'boolean'
    );
  }

  /**
   * Valida recursivamente que un valor sea un nodo de FieldMap.
   * @param value Valor a validar.
   * @returns true si cumple la estructura esperada.
   * @example
   * isFieldMapNode({ cliente: { rfc: 'venta::fiscal_RFC' } }) // true
   */
  public isFieldMapNode(value: unknown): value is FieldMapNode {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    const entries = Object.entries(value);
    for (const [, fieldValue] of entries) {
      if (typeof fieldValue === 'string') {
        continue;
      }

      if (!this.isFieldMapNode(fieldValue)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Valida que el JSON importado tenga forma { data: FieldMapNode }.
   * @param value Valor a validar.
   */
  public isGenericFieldMapRoot(value: unknown): value is GenericFieldMapRoot {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    const data = (value as Record<string, unknown>).data;
    return this.isFieldMapNode(data);
  }

  /**
   * Mapea un registro raw completo usando configuracion de portales por key.
   * @param record Registro raw de FileMaker.
   * @param portalSourceByKey Configuracion opcional: key limpia -> portal.
   * @returns Registro con llaves limpias mapeadas desde fieldData/portalData.
   * @example
   * mapRecordWithPortalConfig(record, { cliente: 'Cliente' })
   */
  public mapRecordWithPortalConfig<T extends object = Record<string, unknown>>(
    record: RawRecord,
    portalSourceByKey: PortalSourceByKey = {},
  ): T {
    const fieldData = record.fieldData || {};
    const portals = record.portalData || null;
    const mappedRecord: Record<string, unknown> = {};

    for (const [cleanKey, rawKeyOrNode] of Object.entries(this.fieldMap.data)) {
      const portalConfig = portalSourceByKey[cleanKey];

      //Caso 1: El nodo del mapa es un portal simple (string) y no hay configuración adicional
      // Ejemplo: "cliente" -> "Cliente" (portal) con nodo { rfc: 'cliente::fiscal_RFC' }
      // En este caso, mapeamos directamente usando el portal indicado. Una vez dentro del portal,
      //  la función mapPortalNode se encargará de traducir los campos usando el nodo definido en el mapa.
      if (
        typeof rawKeyOrNode !== 'string' &&
        typeof portalConfig === 'string'
      ) {
        mappedRecord[cleanKey] = this.mapPortalNode(
          portals,
          portalConfig,
          rawKeyOrNode,
        );
        continue;
      }
      //Caso 2: El nodo del mapa es un portal (object) y la configuración indica que es un portal (PortalConfigDef)
      // Ejemplo: "cliente" -> { name: "Cliente", isArray: false } con nodo { rfc: 'cliente::fiscal_RFC' }
      // En este caso, mapeamos usando el portal indicado y respetando si es array o no. La función mapPortalNode
      // o mapPortalArray se encargará de traducir los campos usando el nodo definido en el mapa.
      if (
        typeof rawKeyOrNode !== 'string' &&
        this.isPortalConfigDef(portalConfig)
      ) {
        if (portalConfig.isArray) {
          mappedRecord[cleanKey] = this.mapPortalArray(
            portals,
            portalConfig.name,
            rawKeyOrNode,
          );
        } else {
          mappedRecord[cleanKey] = this.mapPortalNode(
            portals,
            portalConfig.name,
            rawKeyOrNode,
          );
        }
        continue;
      }
      //Caso 3: El nodo del mapa es un objeto (posible portal anidado) y la configuración también es un objeto (NestedPortalConfig)
      // Ejemplo: "cliente" -> { direccion: 'venta::entrega_dest_Address1', ciudad: 'venta::entrega_dest_Ciudad' } con configuración { direccion: 'Entrega', ciudad: 'Entrega' }
      // En este caso, iteramos cada key del nodo y buscamos su configuración en el NestedPortalConfig. Si encontramos una configuración de portal para esa key,
      // mapeamos usando ese portal. Si no, mapeamos directamente desde fieldData usando el valor del nodo.
      if (
        typeof rawKeyOrNode !== 'string' &&
        portalConfig &&
        typeof portalConfig === 'object' &&
        !this.isPortalConfigDef(portalConfig) // Aseguramos que sea un NestedPortalConfig
      ) {
        const nestedMapped: Record<string, unknown> = {};
        for (const [nestedKey, nestedConfig] of Object.entries(portalConfig)) {
          const nestedNode = rawKeyOrNode[nestedKey];
          if (typeof nestedNode === 'string' || !nestedNode) {
            nestedMapped[nestedKey] = null;
            continue;
          }

          // Verificamos si el portal anidado usa la nueva configuración o un string simple
          if (this.isPortalConfigDef(nestedConfig)) {
            nestedMapped[nestedKey] = nestedConfig.isArray
              ? this.mapPortalArray(portals, nestedConfig.name, nestedNode)
              : this.mapPortalNode(portals, nestedConfig.name, nestedNode);
          } else if (typeof nestedConfig === 'string') {
            nestedMapped[nestedKey] = this.mapPortalNode(
              portals,
              nestedConfig,
              nestedNode,
            );
          }
        }
        mappedRecord[cleanKey] = nestedMapped;
        continue;
      }
      //Caso 4: El nodo del mapa es un objeto pero no hay configuración de portal, o el nodo es un string. \
      // En ambos casos, mapeamos directamente desde fieldData usando el valor del nodo.
      if (typeof rawKeyOrNode === 'string') {
        mappedRecord[cleanKey] = fieldData[rawKeyOrNode] ?? null;
        continue;
      }

      mappedRecord[cleanKey] = this.mapByNode(fieldData, rawKeyOrNode);
    }

    return mappedRecord as T;
  }

  private mapPortalNode<T extends object = Record<string, unknown>>(
    portals: Record<string, unknown> | null,
    portalName: string,
    node: FieldMapNode,
  ): T | null {
    const portalValue = portals?.[portalName];
    const rows = Array.isArray(portalValue)
      ? (portalValue as Array<Record<string, unknown>>)
      : [];

    if (rows.length === 0) {
      return null;
    }

    return this.mapByNode<T>(rows[0] || {}, node);
  }

  /**
   * Mapea un array de portales usando un nodo del mapa de campos.
   * @param portals Objeto con los portales raw.
   * @param portalName Nombre del portal a mapear.
   * @param node Nodo del mapa de campos para mapear cada fila del portal.
   * @returns Array de objetos con llaves limpias mapeados desde el portal, o array vacío si el portal no existe o no tiene filas.
   * @example
   * mapPortalArray(portals, 'Clientes', { rfc: 'cliente::fiscal_RFC' })
   * // [{ rfc: 'XAXX010101000' }, { rfc: 'GODE561231GR8' }]
   */
  private mapPortalArray<T extends object = Record<string, unknown>>(
    portals: Record<string, unknown> | null,
    portalName: string,
    node: FieldMapNode,
  ): T[] {
    const portalValue = portals?.[portalName];
    const rows = Array.isArray(portalValue)
      ? (portalValue as Array<Record<string, unknown>>)
      : [];

    if (rows.length === 0) {
      return [];
    }

    // Iteramos cada fila y la traducimos con nuestro nodo
    return rows.map((row) => this.mapByNode<T>(row, node));
  }

  /**
   * Mapea un objeto source usando un nodo del mapa de campos.
   * @param source Objeto con campos raw.
   * @param node Nodo del mapa de campos.
   * @returns Objeto con llaves limpias y valores tomados del source.
   * @example
   * mapByNode({ cfdi_UUID: 'abc' }, { uuidCfdi: 'cfdi_UUID' })
   * // { uuidCfdi: 'abc' }
   */
  public mapByNode<T extends object = Record<string, unknown>>(
    source: Record<string, unknown>,
    node: FieldMapNode,
  ): T {
    const mapped: Record<string, unknown> = {};

    for (const [cleanKey, rawKeyOrNode] of Object.entries(node)) {
      if (typeof rawKeyOrNode === 'string') {
        mapped[cleanKey] = source[rawKeyOrNode] ?? null;
        continue;
      }

      mapped[cleanKey] = this.mapByNode(source, rawKeyOrNode);
    }

    return mapped as T;
  }

  /**
   * Resuelve una ruta limpia (ej. "cliente.rfc") al nombre real del campo.
   * Devuelve null si la ruta no existe en el mapa.
   * @param cleanPath Ruta de key limpia separada por punto.
   * @returns Nombre raw del campo o null.
   */
  public getRawFieldName(cleanPath: string): string | null {
    const pathParts = cleanPath
      .split('.')
      .map((part) => part.trim())
      .filter(Boolean);

    if (pathParts.length === 0) {
      return null;
    }

    let currentNode: string | FieldMapNode = this.fieldMap.data;

    for (const part of pathParts) {
      if (typeof currentNode === 'string') {
        return null;
      }

      const nextNodeUnknown = (currentNode as Record<string, unknown>)[part];
      if (typeof nextNodeUnknown === 'undefined') {
        return null;
      }

      if (
        typeof nextNodeUnknown !== 'string' &&
        !this.isFieldMapNode(nextNodeUnknown)
      ) {
        return null;
      }

      currentNode = nextNodeUnknown;
    }

    return typeof currentNode === 'string' ? currentNode : null;
  }
}

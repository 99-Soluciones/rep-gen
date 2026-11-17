import { describe, expect, it } from "vitest";

/*
 * Regla de nombres de columnas (docs/guides/COMO-AGREGAR-REPORTE.md):
 * "<Entidad> <Dato>", y el mismo campo se llama igual en todos los reportes.
 * Cubre cualquier *.schema.json de reportes, también los que se agreguen.
 */

interface Columna {
  field: string;
  defaultHeader?: string;
}

const schemas = import.meta.glob<{ columns: Record<string, Columna> }>("../**/*.schema.json", {
  eager: true,
  import: "default",
});

const columnas = Object.entries(schemas).flatMap(([archivo, schema]) =>
  Object.entries(schema.columns).map(([llave, meta]) => ({
    reporte: archivo.split("/").at(-1)!,
    field: meta.field,
    encabezado: meta.defaultHeader ?? llave,
  })),
);

const ENTIDADES = [
  "Cliente",
  "Cliente/Proveedor",
  "Factura",
  "Artículo",
  "Banco",
  "Pago",
  "Bodega",
  "Venta",
  "Devolución",
  "Ingreso",
  "Egreso",
];
/** Importes y tasas del renglón: no son de una entidad. */
const DEL_RENGLON = ["Importe", "Descuento", "IVA", "IEPS", "ISR", "Costo", "Ganancia", "Margen"];
/** Datos del renglón mismo. */
const EXCEPCIONES = ["Tipo de Renglón", "Tipo de Transacción", "Fecha Corte"];

describe("nombres de columnas entre reportes", () => {
  it("encuentra los schemas", () => {
    expect(Object.keys(schemas).length).toBeGreaterThanOrEqual(4);
  });

  it("el mismo campo lleva el mismo encabezado en todos los reportes", () => {
    const porCampo = new Map<string, Set<string>>();
    for (const { field, encabezado } of columnas) {
      porCampo.set(field, (porCampo.get(field) ?? new Set()).add(encabezado));
    }
    const distintos = [...porCampo]
      .filter(([, nombres]) => nombres.size > 1)
      .map(([field, nombres]) => `${field}: ${[...nombres].join(" | ")}`);
    expect(distintos).toEqual([]);
  });

  it("cada encabezado empieza con su entidad", () => {
    const sinEntidad = columnas
      .filter(
        ({ encabezado }) =>
          !EXCEPCIONES.includes(encabezado) &&
          ![...ENTIDADES, ...DEL_RENGLON].includes(encabezado.split(" ")[0]),
      )
      .map(({ reporte, encabezado }) => `${reporte}: ${encabezado}`);
    expect(sinEntidad).toEqual([]);
  });
});
